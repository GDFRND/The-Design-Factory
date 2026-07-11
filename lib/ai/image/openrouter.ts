import "server-only";
import OpenAI from "openai";
import sharp from "sharp";
import type { BrandDossier } from "@/lib/ai/dossier";
import type { ExpandedPrompt } from "@/lib/ai/expanded-prompt";
import {
  aspectFor,
  buildImagePrompt,
  type ImageEngine,
} from "@/lib/ai/image-engine";

/* OpenRouter adapter (FIX-03 — supersedes the direct-to-Google path).
   The ONLY file that talks to the image router. One key, two tiers:
   the draft model draws the 4-variant gallery cheap; the final model
   re-renders the selected asset at 2K from the chosen draft, so the
   download is a faithful high-res version of the picked thumbnail,
   not a fresh roll of the dice.

   Trade-off on record (FIX-03 §1): briefs and reference images pass
   through a third-party router before reaching the model provider.
   Fine for demo data; a one-file swap back to direct if the Fund
   requires it. Callers re-encode every output to WebP, which strips
   EXIF and normalises the router's JPEG/PNG/WebP inconsistency;
   the invisible SynthID watermark is left intact by design. */

const MODEL_DRAFT =
  process.env.IMAGE_MODEL_DRAFT ?? "google/gemini-3.1-flash-image";
const MODEL_FINAL =
  process.env.IMAGE_MODEL_FINAL ?? "google/gemini-3-pro-image";

let _client: OpenAI | null = null;
function getRouter(): OpenAI {
  if (!_client) {
    _client = new OpenAI({
      baseURL: "https://openrouter.ai/api/v1",
      apiKey: process.env.OPENROUTER_API_KEY,
      defaultHeaders: {
        // Router attribution headers — optional, not secret.
        "HTTP-Referer": process.env.OPENROUTER_APP_URL ?? "",
        "X-Title": process.env.OPENROUTER_APP_NAME ?? "",
      },
    });
  }
  return _client;
}

type GenImage = { bytes: Buffer; mime: string };

/** The router may return image/png, image/jpeg or image/webp depending
    on which provider served the request. */
function decodeDataUrl(url: string): GenImage {
  const m = /^data:(image\/[a-z+]+);base64,(.+)$/i.exec(url);
  if (!m) throw new Error("unexpected image payload from router");
  return { mime: m[1], bytes: Buffer.from(m[2], "base64") };
}

type RouterMessage = {
  images?: Array<{ image_url: { url: string } }>;
};

type UserContent =
  | string
  | Array<
    | { type: "text"; text: string }
    | { type: "image_url"; image_url: { url: string } }
  >;

async function callOnce(
  model: string,
  content: UserContent,
  aspect: string,
  size?: "1K" | "2K" | "4K"
): Promise<GenImage[]> {
  const res = await getRouter().chat.completions.create({
    model,
    messages: [{ role: "user", content: content as never }],
    // Router extensions, not in the OpenAI types:
    // modalities opts into image output; image_config carries the
    // aspect ratio (not baked into prompt text) and, on the Pro tier,
    // the requested output size.
    ...({
      modalities: ["image", "text"],
      image_config: { aspect_ratio: aspect, ...(size ? { image_size: size } : {}) },
    } as object),
  });

  const msg = res.choices[0]?.message as RouterMessage | undefined;
  const imgs = msg?.images;
  if (!imgs?.length) {
    // Never leak router/provider JSON toward the client — log for ops.
    console.error("[image-engine] no image returned", JSON.stringify(res).slice(0, 400));
    throw new Error("no image returned");
  }
  return imgs.map((i) => decodeDataUrl(i.image_url.url));
}

/** One retry on transient failure; the router already fails over
    between providers, so a second miss is a real error. */
async function withRetry<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn();
  } catch {
    await new Promise((r) => setTimeout(r, 800));
    return await fn();
  }
}

async function aspectOfBuffer(image: Buffer): Promise<string> {
  try {
    const meta = await sharp(image).metadata();
    if (meta.width && meta.height) {
      return aspectFor(`${meta.width}×${meta.height}`);
    }
  } catch {}
  return "4:5";
}

export class OpenRouterEngine implements ImageEngine {
  async generate(
    p: ExpandedPrompt,
    brand: BrandDossier,
    n: number,
    reference?: Buffer[]
  ): Promise<Buffer[]> {
    const prompt = buildImagePrompt(p, brand);
    const aspect = aspectFor(p.outputFormat);

    const referenceParts = (reference ?? []).slice(0, 3).map((buf) => ({
      type: "image_url" as const,
      image_url: { url: `data:image/png;base64,${buf.toString("base64")}` },
    }));
    const content: UserContent = referenceParts.length
      ? [{ type: "text", text: prompt }, ...referenceParts]
      : prompt;

    // N independent draft calls in parallel — each returns one image.
    // allSettled, not all: one draft failing shouldn't kill the gallery.
    const results = await Promise.allSettled(
      Array.from({ length: n }, () =>
        withRetry(() => callOnce(MODEL_DRAFT, content, aspect))
      )
    );
    const images = results.flatMap((r) =>
      r.status === "fulfilled" ? r.value : []
    );
    if (!images.length) throw new Error("all draft generations failed");
    return images.slice(0, n).map((i) => i.bytes);
  }

  async refine(
    base: Buffer,
    instruction: string,
    brand: BrandDossier
  ): Promise<Buffer[]> {
    // The selected draft rides along as the input image, on the FINAL
    // model — the output must resemble the thumbnail the user picked.
    const aspect = await aspectOfBuffer(base);
    const content: UserContent = [
      {
        type: "text",
        text: `Edit this marketing asset for ${brand.hotelName}. ${instruction}. Keep the composition, layout and all other elements unchanged. No watermarks.`,
      },
      {
        type: "image_url",
        image_url: {
          url: `data:image/webp;base64,${base.toString("base64")}`,
        },
      },
    ];
    // Ask the Pro tier for 2K; if the routed provider rejects the size
    // hint, fall back to the default resolution rather than failing.
    try {
      const images = await callOnce(MODEL_FINAL, content, aspect, "2K");
      return images.map((i) => i.bytes);
    } catch {
      const images = await withRetry(() => callOnce(MODEL_FINAL, content, aspect));
      return images.map((i) => i.bytes);
    }
  }
}
