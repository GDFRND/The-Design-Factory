import { NextResponse } from "next/server";
import sharp from "sharp";
import type { CopyBlocks } from "@/lib/ai/copy";
import { db } from "@/lib/db";
import { readObject } from "@/lib/storage";
import { getWorkspaceContext } from "@/lib/workspace";

/* FIX-04 §1 — delivers the finished asset with the proper filename:
   {hotel-slug}-{asset-type}-{yyyymmdd}.{webp|png}. Serves the cached
   2K final when present (fall back to the draft), converts to PNG on
   request, records downloadedAt. TEXT-only variants download their
   copy as markdown. */

function assetSlug(assetType: string) {
  return assetType.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");
}

function today() {
  const d = new Date();
  return `${d.getFullYear()}${String(d.getMonth() + 1).padStart(2, "0")}${String(d.getDate()).padStart(2, "0")}`;
}

export async function GET(
  request: Request,
  { params }: { params: Promise<{ variantId: string }> }
) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return new NextResponse(null, { status: 404 });

  const { variantId } = await params;
  const variant = await db.variant.findFirst({
    where: { id: variantId, generation: { workspaceId: ctx.workspace.id } },
    include: { generation: { include: { workspace: { select: { slug: true } } } } },
  });
  if (!variant) return new NextResponse(null, { status: 404 });

  const format = new URL(request.url).searchParams.get("format") === "png" ? "png" : "webp";
  const baseName = `${variant.generation.workspace.slug}-${assetSlug(variant.generation.assetType)}-${today()}`;

  await db.variant.update({
    where: { id: variant.id },
    data: { downloadedAt: new Date() },
  });

  const key = variant.finalKey ?? variant.imageKey;
  if (key) {
    let bytes: Buffer;
    try {
      bytes = await readObject(key);
    } catch {
      return new NextResponse(null, { status: 404 });
    }
    if (format === "png") bytes = await sharp(bytes).png().toBuffer();
    return new NextResponse(new Uint8Array(bytes), {
      headers: {
        "Content-Type": format === "png" ? "image/png" : "image/webp",
        "Content-Disposition": `attachment; filename="${baseName}.${format}"`,
        "Cache-Control": "private, no-store",
      },
    });
  }

  // TEXT-only variant: the copy is the asset.
  const copy = variant.copy as CopyBlocks | null;
  if (!copy) return new NextResponse(null, { status: 404 });
  const md = [
    `# ${copy.headline}`,
    copy.subhead,
    "",
    copy.body,
    ...(copy.sections ?? []).flatMap((s) => ["", `## ${s.heading}`, s.body]),
    "",
    `**${copy.cta}**`,
  ].join("\n");
  return new NextResponse(md, {
    headers: {
      "Content-Type": "text/markdown; charset=utf-8",
      "Content-Disposition": `attachment; filename="${baseName}.md"`,
      "Cache-Control": "private, no-store",
    },
  });
}
