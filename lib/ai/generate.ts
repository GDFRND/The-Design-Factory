import "server-only";
import { nanoid } from "nanoid";
import sharp from "sharp";
import { db } from "@/lib/db";
import { buildBrandDossier, type BrandDossier } from "@/lib/ai/dossier";
import { writeCopy, type CopyBlocks } from "@/lib/ai/copy";
import { expandedPromptSchema, type ExpandedPrompt } from "@/lib/ai/expanded-prompt";
import { getImageEngine } from "@/lib/ai/image-engine";
import { getSignedUrl, putObject, readObject } from "@/lib/storage";

/* Variant production (BRIEF §4.4–§4.6).
   COMPOSITE is the primary case — IMAGE and TEXT are degenerate forms
   of it (image-only / copy-only). Output is re-encoded to WebP via
   sharp, which drops provider metadata (EXIF, XMP) by default; files
   are named gen_{nanoid}.webp with no vendor string anywhere. */

const IMAGE_VARIANTS = Number(process.env.IMAGE_VARIANT_COUNT) || 4;
const VARIANT_COUNTS: Record<string, number> = {
  IMAGE: IMAGE_VARIANTS,
  TEXT: 2,
  COMPOSITE: 2,
};

/* TDF-06 §4: every asset generated for a demo workspace is watermarked
   DEMO at 40% — a Tourism Fund board must never mistake a demo asset
   for an approved one. */
function demoWatermark(width: number): Buffer {
  const fs = Math.max(24, Math.round(width * 0.05));
  return Buffer.from(
    `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${fs * 2}">
      <text x="${width - fs * 0.6}" y="${fs * 1.3}" text-anchor="end"
        font-family="Helvetica, Arial, sans-serif" font-size="${fs}"
        font-weight="700" letter-spacing="${fs * 0.2}"
        fill="#FAFAF9" opacity="0.4">DEMO</text>
    </svg>`
  );
}

async function toCleanWebp(image: Buffer, isDemo: boolean): Promise<Buffer> {
  let pipeline = sharp(image);
  if (isDemo) {
    const meta = await pipeline.metadata();
    pipeline = pipeline.composite([
      { input: demoWatermark(meta.width ?? 1080), gravity: "southeast" },
    ]);
  }
  return pipeline.webp({ quality: 88 }).toBuffer();
}

async function storeImage(
  workspaceId: string,
  image: Buffer,
  isDemo: boolean
): Promise<string> {
  const key = `ws/${workspaceId}/gen/gen_${nanoid()}.webp`;
  await putObject(key, await toCleanWebp(image, isDemo), "image/webp");
  return key;
}

async function loadReferenceImages(
  workspaceId: string,
  attachmentIds: string[]
): Promise<Buffer[]> {
  if (!attachmentIds.length) return [];
  const assets = await db.brandAsset.findMany({
    where: { id: { in: attachmentIds }, workspaceId, mime: { startsWith: "image/" } },
    take: 3,
  });
  const buffers: Buffer[] = [];
  for (const asset of assets) {
    try {
      buffers.push(await readObject(asset.storageKey));
    } catch {
      // Blob-store assets can't be read locally; skip silently.
    }
  }
  return buffers;
}

export async function produceVariants(generationId: string, workspaceId: string) {
  const generation = await db.generation.findFirstOrThrow({
    where: { id: generationId, workspaceId },
    include: { workspace: { select: { isDemo: true } } },
  });

  const stored = generation.expandedPrompt as Record<string, unknown> | null;
  const parsed = expandedPromptSchema.safeParse(stored);
  if (!parsed.success) throw new Error("generation has no creative plan");
  const prompt = parsed.data;
  const attachmentIds = (stored?.attachmentIds as string[] | undefined) ?? [];

  const dossier = await buildBrandDossier(workspaceId);
  const kind = generation.outputKind;
  const n = VARIANT_COUNTS[kind] ?? 2;

  const wantsImages = kind === "IMAGE" || kind === "COMPOSITE";
  const wantsCopy = kind === "TEXT" || kind === "COMPOSITE";

  const [images, copies] = await Promise.all([
    wantsImages
      ? (async () => {
        const engine = await getImageEngine();
        const refs = await loadReferenceImages(workspaceId, attachmentIds);
        return engine.generate(prompt, dossier, n, refs);
      })()
      : Promise.resolve([] as Buffer[]),
    wantsCopy
      ? Promise.all(
        Array.from({ length: n }, (_, i) =>
          writeCopy({
            prompt,
            dossier,
            instruction: i > 0 ? "Write a distinctly different variation." : undefined,
          })
        )
      )
      : Promise.resolve([] as CopyBlocks[]),
  ]);

  const count = wantsImages ? Math.min(n, images.length) : n;
  const variants = [];
  for (let i = 0; i < count; i++) {
    const imageKey =
      wantsImages && images[i]
        ? await storeImage(workspaceId, images[i], generation.workspace.isDemo)
        : null;
    const copy = wantsCopy ? copies[Math.min(i, copies.length - 1)] : null;
    variants.push(
      await db.variant.create({
        data: {
          generationId,
          imageKey,
          copy: copy as never,
        },
      })
    );
  }

  await db.generation.update({
    where: { id: generationId },
    data: { status: "COMPLETE" },
  });

  return variants;
}

export async function refineVariant(input: {
  variantId: string;
  workspaceId: string;
  instruction: string;
}) {
  const variant = await db.variant.findFirstOrThrow({
    where: {
      id: input.variantId,
      generation: { workspaceId: input.workspaceId },
    },
    include: {
      generation: { include: { workspace: { select: { isDemo: true } } } },
    },
  });

  const stored = variant.generation.expandedPrompt as Record<string, unknown> | null;
  const parsed = expandedPromptSchema.safeParse(stored);
  if (!parsed.success) throw new Error("generation has no creative plan");
  const prompt: ExpandedPrompt = parsed.data;
  const dossier: BrandDossier = await buildBrandDossier(input.workspaceId);

  let imageKey = variant.imageKey;
  let copy = variant.copy as CopyBlocks | null;

  if (variant.imageKey) {
    const base = await readObject(variant.imageKey).catch(() => null);
    if (base) {
      const engine = await getImageEngine();
      const [refined] = await engine.refine(base, input.instruction, dossier);
      if (refined) {
        imageKey = await storeImage(
          input.workspaceId,
          refined,
          variant.generation.workspace.isDemo
        );
      }
    }
  }
  if (copy) {
    copy = await writeCopy({
      prompt,
      dossier,
      instruction: input.instruction,
      base: copy,
    });
  }

  return db.variant.update({
    where: { id: variant.id },
    data: {
      imageKey,
      copy: copy as never,
      refinements: [
        ...(variant.refinements as unknown[] ?? []),
        { instruction: input.instruction, at: new Date().toISOString() },
      ] as never,
    },
  });
}

/* ------------------------------------------------------ finalize (§FIX-04) */

const FINALIZE_INSTRUCTION =
  "Reproduce this exact design faithfully at maximum fidelity and resolution. Do not change the composition, colours, layout or any text";

// Double-charge guard: concurrent finalize calls for the same variant
// share one in-flight render; a finished render is cached on finalKey.
const inFlightFinalize = new Map<string, Promise<string | null>>();

export async function finalizeVariant(input: {
  variantId: string;
  workspaceId: string;
}): Promise<{ finalKey: string | null }> {
  const variant = await db.variant.findFirstOrThrow({
    where: {
      id: input.variantId,
      generation: { workspaceId: input.workspaceId },
    },
    include: {
      generation: { include: { workspace: { select: { isDemo: true } } } },
    },
  });

  if (variant.finalKey) return { finalKey: variant.finalKey };
  if (!variant.imageKey) return { finalKey: null }; // TEXT-only variants

  const existing = inFlightFinalize.get(variant.id);
  if (existing) return { finalKey: await existing };

  const job = (async () => {
    const base = await readObject(variant.imageKey!).catch(() => null);
    if (!base) return null;
    const dossier = await buildBrandDossier(input.workspaceId);
    const engine = await getImageEngine();
    const [final] = await engine.refine(base, FINALIZE_INSTRUCTION, dossier);
    if (!final) return null;
    const key = await storeImage(
      input.workspaceId,
      final,
      variant.generation.workspace.isDemo
    );
    await db.variant.update({
      where: { id: variant.id },
      data: { finalKey: key },
    });
    return key;
  })();

  inFlightFinalize.set(variant.id, job);
  try {
    return { finalKey: await job };
  } finally {
    inFlightFinalize.delete(variant.id);
  }
}

/** Serializes a variant for the client, with a signed image URL. */
export async function serializeVariant(variant: {
  id: string;
  imageKey: string | null;
  finalKey?: string | null;
  downloadedAt?: Date | null;
  copy: unknown;
  selected: boolean;
  refinements: unknown;
  createdAt: Date;
}) {
  return {
    id: variant.id,
    imageUrl: variant.imageKey ? await getSignedUrl(variant.imageKey) : null,
    hasFinal: Boolean(variant.finalKey),
    downloadedAt: variant.downloadedAt?.toISOString() ?? null,
    copy: (variant.copy as CopyBlocks | null) ?? null,
    selected: variant.selected,
    refinements: (variant.refinements as { instruction: string; at: string }[]) ?? [],
    createdAt: variant.createdAt.toISOString(),
  };
}

export type SerializedVariant = Awaited<ReturnType<typeof serializeVariant>>;
