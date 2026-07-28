import "server-only";
import { z } from "zod";
import {
  aiConfigured,
  getClient,
  PLATFORM_SYSTEM_PROMPT,
  TEXT_MODEL,
} from "@/lib/ai/claude";
import type { BrandDossier } from "@/lib/ai/dossier";
import type { ExpandedPrompt } from "@/lib/ai/expanded-prompt";
import { extractJsonObject } from "@/lib/ai/parse";

/* Copy blocks for TEXT and COMPOSITE variants (BRIEF §4.5). */

export const copySchema = z.object({
  headline: z.string().default(""),
  subhead: z.string().default(""),
  body: z.string().default(""),
  cta: z.string().default(""),
  sections: z
    .array(z.object({ heading: z.string().default(""), body: z.string().default("") }))
    .default([]),
});

export type CopyBlocks = z.infer<typeof copySchema>;

const COPY_INSTRUCTIONS = `Write the marketing copy for the asset described below.

Respond with a single JSON object only, no prose, no fences:
{ "headline": string, "subhead": string, "body": string, "cta": string,
  "sections": [{ "heading": string, "body": string }] }

"body" is the main copy. Use "sections" only for longer formats (emails,
brochures, newsletters), otherwise return an empty array. Match the tone
of voice exactly. Keep prices, dates and names exactly as given.

Never use em dashes or en dashes in the copy. Use commas, periods, colons,
or parentheses instead.`;

function offlineCopy(p: ExpandedPrompt, brand: BrandDossier, tone?: string): CopyBlocks {
  return {
    headline: p.keyMessage || `${p.assetType} for ${brand.hotelName}`,
    subhead: p.offerDetails.validity ?? "",
    body: [
      p.marketingObjective,
      p.offerDetails.price ? `Price: ${p.offerDetails.price}.` : "",
      p.offerDetails.inclusions?.length
        ? `Includes ${p.offerDetails.inclusions.join(", ")}.`
        : "",
      tone ? `(Tone requested: ${tone}. Assistant offline, review before use.)` : "",
    ]
      .filter(Boolean)
      .join(" "),
    cta: p.callToAction || "Book now",
    sections: [],
  };
}

export async function writeCopy(input: {
  prompt: ExpandedPrompt;
  dossier: BrandDossier;
  instruction?: string;
  base?: CopyBlocks;
}): Promise<CopyBlocks> {
  const { prompt, dossier, instruction, base } = input;
  if (!aiConfigured()) return offlineCopy(prompt, dossier, instruction);

  const client = getClient();
  const userParts = [
    COPY_INSTRUCTIONS,
    "",
    `Asset: ${prompt.assetType} (${prompt.outputKind})`,
    `Audience: ${prompt.targetAudience}`,
    `Key message: ${prompt.keyMessage}`,
    `Tone: ${prompt.toneOfVoice}`,
    prompt.offerDetails.price ? `Price: ${prompt.offerDetails.price}` : null,
    prompt.offerDetails.validity ? `Validity: ${prompt.offerDetails.validity}` : null,
    prompt.offerDetails.inclusions?.length
      ? `Inclusions: ${prompt.offerDetails.inclusions.join(", ")}`
      : null,
    `Call to action: ${prompt.callToAction}`,
    base ? `\nCurrent copy to revise:\n${JSON.stringify(base)}` : null,
    instruction ? `\nRevision instruction: ${instruction}` : null,
  ].filter(Boolean);

  const response = await client.messages.create({
    model: TEXT_MODEL,
    max_tokens: 3000,
    system: [
      { type: "text", text: PLATFORM_SYSTEM_PROMPT },
      { type: "text", text: dossier.markdown, cache_control: { type: "ephemeral" } },
    ],
    messages: [{ role: "user", content: userParts.join("\n") }],
  });

  const text = response.content
    .filter((b) => b.type === "text")
    .map((b) => b.text)
    .join("\n");

  const json = extractJsonObject(text);
  if (json) {
    try {
      const parsed = copySchema.safeParse(JSON.parse(json));
      if (parsed.success) return parsed.data;
    } catch {}
  }
  // Degrade gracefully: raw text into the body.
  return { headline: prompt.keyMessage, subhead: "", body: text.trim(), cta: prompt.callToAction, sections: [] };
}
