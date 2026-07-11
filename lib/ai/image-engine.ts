import "server-only";
import type { BrandDossier } from "@/lib/ai/dossier";
import type { ExpandedPrompt } from "@/lib/ai/expanded-prompt";

/* ImageEngine (BRIEF §4.4). The engine is an implementation detail —
   no engine selector in the UI, no provider named anywhere a browser
   can see. implementations/nano-banana.ts is the only file that talks
   to the provider; everything else programs against this interface. */

export interface ImageEngine {
  generate(
    p: ExpandedPrompt,
    brand: BrandDossier,
    n: number,
    reference?: Buffer[]
  ): Promise<Buffer[]>;
  refine(
    base: Buffer,
    instruction: string,
    brand: BrandDossier
  ): Promise<Buffer[]>;
}

export async function getImageEngine(): Promise<ImageEngine> {
  if (process.env.OPENROUTER_API_KEY) {
    const { OpenRouterEngine } = await import("@/lib/ai/image/openrouter");
    return new OpenRouterEngine();
  }
  const { PlaceholderEngine } = await import("@/lib/ai/implementations/placeholder");
  return new PlaceholderEngine();
}

/** Builds the creative prompt an engine receives. Vendor-neutral. */
export function buildImagePrompt(p: ExpandedPrompt, brand: BrandDossier): string {
  const lines = [
    `Design a ${p.assetType.toLowerCase()} for ${brand.hotelName}, a Kenyan hospitality property.`,
    p.visualDirection ? `Visual direction: ${p.visualDirection}` : null,
    p.keyMessage ? `The message: ${p.keyMessage}` : null,
    p.offerDetails.price ? `Price shown: ${p.offerDetails.price}` : null,
    p.offerDetails.validity ? `Valid: ${p.offerDetails.validity}` : null,
    p.suggestedLayout ? `Layout: ${p.suggestedLayout}` : null,
    p.brandApplication ? `Brand application: ${p.brandApplication}` : null,
    p.callToAction ? `Call to action: ${p.callToAction}` : null,
    p.outputFormat ? `Format: ${p.outputFormat}` : null,
    "Professional marketing quality. All text must be spelled exactly as given. No watermarks, no logos other than the property's own.",
  ];
  return lines.filter(Boolean).join("\n");
}

/** Parses "1080×1350 · IG feed"-style formats into pixel dimensions. */
export function parseDimensions(outputFormat: string): { width: number; height: number } {
  const m = outputFormat.match(/(\d{3,4})\s*[×x]\s*(\d{3,4})/);
  if (m) return { width: Number(m[1]), height: Number(m[2]) };
  return { width: 1080, height: 1350 }; // 4:5 default
}

/* Aspect ratio rides in the request config, never in prompt text
   (FIX-03 §3). Poster 4:5, story 9:16, LinkedIn 1:1 — driven from
   outputFormat, snapped to the ratios the image model honours. */
const SUPPORTED_ASPECTS: [string, number][] = [
  ["1:1", 1],
  ["4:5", 4 / 5],
  ["5:4", 5 / 4],
  ["3:4", 3 / 4],
  ["4:3", 4 / 3],
  ["2:3", 2 / 3],
  ["3:2", 3 / 2],
  ["9:16", 9 / 16],
  ["16:9", 16 / 9],
];

export function aspectFor(outputFormat: string): string {
  const { width, height } = parseDimensions(outputFormat);
  const target = width / height;
  let best = SUPPORTED_ASPECTS[0];
  for (const candidate of SUPPORTED_ASPECTS) {
    if (Math.abs(candidate[1] - target) < Math.abs(best[1] - target)) {
      best = candidate;
    }
  }
  return best[0];
}
