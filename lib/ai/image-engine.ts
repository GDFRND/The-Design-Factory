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
  if (process.env.GOOGLE_IMAGE_API_KEY) {
    const { NanoBananaEngine } = await import("@/lib/ai/implementations/nano-banana");
    return new NanoBananaEngine();
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
