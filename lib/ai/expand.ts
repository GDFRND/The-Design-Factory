import "server-only";
import {
  aiConfigured,
  getClient,
  PLATFORM_SYSTEM_PROMPT,
  TEXT_MODEL,
} from "@/lib/ai/claude";
import type { BrandDossier } from "@/lib/ai/dossier";
import type { ExpandedPrompt } from "@/lib/ai/expanded-prompt";
import { parseExpandedPrompt } from "@/lib/ai/parse";
import type { OutputKind } from "@/lib/studio/asset-types";

/* Prompt expansion (BRIEF §4.3): the user's short brief is never sent
   straight to an image engine. It becomes a structured, editable
   creative plan first. JSON only, no prose, no fences — parsed
   defensively with one repair retry. */

const EXPANSION_INSTRUCTIONS = `Turn the marketing brief below into a structured creative plan.

Respond with a single JSON object only — no prose, no markdown fences. Shape:

{
  "assetType": string,
  "outputKind": "IMAGE" | "TEXT" | "COMPOSITE",
  "targetAudience": string,
  "marketingObjective": string,
  "keyMessage": string,
  "offerDetails": { "price"?: string, "validity"?: string, "inclusions"?: string[], "terms"?: string },
  "toneOfVoice": string,
  "visualDirection": string,   // omit this key entirely when outputKind is "TEXT"
  "suggestedLayout": string,
  "brandApplication": string,  // how this property's palette, type and imagery apply
  "callToAction": string,
  "outputFormat": string,      // e.g. "1080×1350 · Instagram feed"
  "missingDetails": string[]   // facts the hotel should confirm, phrased as short prompts
}

Ground every field in the brand dossier when one is provided. Keep each field concrete and short — these render as an editable form, not an essay.`;

function buildUserMessage(input: {
  assetType: string;
  outputKind: OutputKind;
  rawBrief: string;
  attachmentNotes?: string;
}) {
  return [
    `Asset type: ${input.assetType}`,
    `Output kind: ${input.outputKind}`,
    input.attachmentNotes ? `Attachments: ${input.attachmentNotes}` : null,
    "",
    "Brief from the hotel:",
    input.rawBrief,
  ]
    .filter((l) => l !== null)
    .join("\n");
}

async function callModel(
  dossier: BrandDossier,
  userMessage: string,
  repair?: { badOutput: string; error: string }
): Promise<string> {
  const client = getClient();

  const messages: { role: "user" | "assistant"; content: string }[] = [
    { role: "user", content: `${EXPANSION_INSTRUCTIONS}\n\n${userMessage}` },
  ];
  if (repair) {
    messages.push(
      { role: "assistant", content: repair.badOutput },
      {
        role: "user",
        content: `That output could not be parsed (${repair.error}). Respond again with only the corrected JSON object — no prose, no fences.`,
      }
    );
  }

  const response = await client.messages.create({
    model: TEXT_MODEL,
    max_tokens: 4000,
    system: [
      { type: "text", text: PLATFORM_SYSTEM_PROMPT },
      {
        type: "text",
        text: dossier.markdown,
        // Stable per workspace — cached so it isn't re-billed every turn.
        cache_control: { type: "ephemeral" },
      },
    ],
    messages,
  });

  return response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");
}

/** Deterministic local fallback so the full flow can run without an API
    key in development. Clearly provisional; never pretends to be smart. */
function offlineExpansion(input: {
  assetType: string;
  outputKind: OutputKind;
  rawBrief: string;
  dossier: BrandDossier;
}): ExpandedPrompt {
  const brief = input.rawBrief.trim();
  const price = brief.match(/(?:KES|KSh|Ksh)\s?[\d,]+/)?.[0];
  return {
    assetType: input.assetType,
    outputKind: input.outputKind,
    targetAudience: "Guests described in the brief",
    marketingObjective: "Drive direct bookings for this offer",
    keyMessage: brief.split(/[.\n]/)[0]?.trim() ?? brief.slice(0, 80),
    offerDetails: price ? { price } : {},
    toneOfVoice: "Warm, plain, confident",
    ...(input.outputKind === "TEXT"
      ? {}
      : {
        visualDirection:
          "Natural light photography of the property; generous space for the offer.",
      }),
    suggestedLayout: "Headline, offer block, contact and booking details",
    brandApplication: `${input.dossier.hotelName}'s confirmed palette and type apply to headline and offer block.`,
    callToAction: "Book via the contact on the asset",
    outputFormat:
      input.outputKind === "IMAGE" ? "1080×1350 · social feed" : "Editable document",
    missingDetails: [
      "The creative assistant is offline — review every field before creating.",
    ],
  };
}

export async function expandBrief(input: {
  assetType: string;
  outputKind: OutputKind;
  rawBrief: string;
  attachmentNotes?: string;
  dossier: BrandDossier;
}): Promise<{ prompt: ExpandedPrompt; offline: boolean }> {
  if (!aiConfigured()) {
    return { prompt: offlineExpansion(input), offline: true };
  }

  const userMessage = buildUserMessage(input);
  const first = await callModel(input.dossier, userMessage);
  const parsed = parseExpandedPrompt(first);
  if (parsed.ok) return { prompt: parsed.data, offline: false };

  // One retry with a repair instruction (§4.3).
  const second = await callModel(input.dossier, userMessage, {
    badOutput: first,
    error: parsed.error,
  });
  const reparsed = parseExpandedPrompt(second);
  if (reparsed.ok) return { prompt: reparsed.data, offline: false };

  throw new Error(`Expansion failed after repair: ${reparsed.error}`);
}
