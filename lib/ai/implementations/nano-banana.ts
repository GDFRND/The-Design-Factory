import "server-only";
import type { BrandDossier } from "@/lib/ai/dossier";
import type { ExpandedPrompt } from "@/lib/ai/expanded-prompt";
import {
  buildImagePrompt,
  type ImageEngine,
} from "@/lib/ai/image-engine";

/* Nano Banana adapter — the ONLY file that knows the image provider.
   Verified against the provider's docs 2026-07: generateContent REST
   endpoint, x-goog-api-key header, image parts returned as inlineData.
   Model id is configuration, not code. */

const MODEL = process.env.GOOGLE_IMAGE_MODEL ?? "gemini-3.1-flash-image";
const ENDPOINT = `https://generativelanguage.googleapis.com/v1beta/models/${MODEL}:generateContent`;

type Part =
  | { text: string }
  | { inline_data: { mime_type: string; data: string } };

type ResponsePart = {
  text?: string;
  inlineData?: { mimeType?: string; data?: string };
  inline_data?: { mime_type?: string; data?: string };
};

async function callProvider(parts: Part[]): Promise<Buffer[]> {
  const key = process.env.GOOGLE_IMAGE_API_KEY;
  if (!key) throw new Error("image engine not configured");

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-goog-api-key": key,
    },
    body: JSON.stringify({ contents: [{ parts }] }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    // Provider details stay server-side; log for ops, throw generic.
    console.error("[image-engine] provider error", res.status, detail.slice(0, 500));
    throw new Error("image generation failed");
  }

  const json = (await res.json()) as {
    candidates?: { content?: { parts?: ResponsePart[] } }[];
  };

  const buffers: Buffer[] = [];
  for (const candidate of json.candidates ?? []) {
    for (const part of candidate.content?.parts ?? []) {
      const data = part.inlineData?.data ?? part.inline_data?.data;
      if (data) buffers.push(Buffer.from(data, "base64"));
    }
  }
  if (!buffers.length) throw new Error("image generation returned no image");
  return buffers;
}

export class NanoBananaEngine implements ImageEngine {
  async generate(
    p: ExpandedPrompt,
    brand: BrandDossier,
    n: number,
    reference?: Buffer[]
  ): Promise<Buffer[]> {
    const prompt = buildImagePrompt(p, brand);
    const referenceParts: Part[] = (reference ?? []).slice(0, 3).map((buf) => ({
      inline_data: { mime_type: "image/png", data: buf.toString("base64") },
    }));

    // One request per variant so each draw is independent.
    const results = await Promise.allSettled(
      Array.from({ length: n }, () =>
        callProvider([{ text: prompt }, ...referenceParts])
      )
    );
    const images = results
      .filter((r): r is PromiseFulfilledResult<Buffer[]> => r.status === "fulfilled")
      .flatMap((r) => r.value);
    if (!images.length) throw new Error("image generation failed");
    return images.slice(0, n);
  }

  async refine(
    base: Buffer,
    instruction: string,
    brand: BrandDossier
  ): Promise<Buffer[]> {
    return callProvider([
      {
        text: `Edit this marketing asset for ${brand.hotelName}. ${instruction}. Keep everything else unchanged. No watermarks.`,
      },
      { inline_data: { mime_type: "image/png", data: base.toString("base64") } },
    ]);
  }
}
