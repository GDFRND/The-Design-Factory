import { NextResponse } from "next/server";
import { nanoid } from "nanoid";
import { z } from "zod";
import { db } from "@/lib/db";
import { recomputeCompletion } from "@/lib/brand/recompute";
import { inferPaletteFromPng } from "@/lib/brand/palette";
import { getSignedUrl, putObject } from "@/lib/storage";
import { allowedCategories, MAX_UPLOAD_BYTES, sniff } from "@/lib/uploads/magic";
import { getWorkspaceContext } from "@/lib/workspace";

/* Brand-asset / reference upload endpoint. Validates by magic bytes
   (never extension), caps size, stores under the caller's workspace
   prefix, and recomputes the completion score. */

const kindSchema = z.enum([
  "LOGO",
  "GUIDELINES",
  "FONT",
  "PHOTOGRAPHY",
  "POSTER",
  "SOCIAL_SAMPLE",
  "MENU",
  "ROOM_IMAGE",
  "BROCHURE",
  "PAST_CAMPAIGN",
  "WEBSITE_SHOT",
  "REFERENCE",
]);

export async function POST(request: Request) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const form = await request.formData().catch(() => null);
  const file = form?.get("file");
  const kind = kindSchema.safeParse(form?.get("kind"));
  if (!form || !(file instanceof File) || !kind.success) {
    return NextResponse.json({ error: "Invalid upload" }, { status: 400 });
  }
  if (file.size > MAX_UPLOAD_BYTES) {
    return NextResponse.json(
      { error: "Files are capped at 15MB." },
      { status: 413 }
    );
  }

  const buffer = Buffer.from(await file.arrayBuffer());
  const type = sniff(buffer);
  if (!type || !allowedCategories(kind.data).includes(type.category)) {
    return NextResponse.json(
      { error: "That file type isn't supported here." },
      { status: 415 }
    );
  }

  const key = `ws/${ctx.workspace.id}/brand/${nanoid()}.${type.ext}`;
  await putObject(key, buffer, type.mime);

  // Light inference: a PNG logo contributes a provisional palette.
  let extracted: Record<string, unknown> | undefined;
  if (kind.data === "LOGO" && type.mime === "image/png") {
    const palette = inferPaletteFromPng(buffer);
    if (palette.length) {
      extracted = { palette };
      const existing = await db.brandSystem.findUnique({
        where: { workspaceId: ctx.workspace.id },
      });
      if (!existing?.palette) {
        await db.brandSystem.upsert({
          where: { workspaceId: ctx.workspace.id },
          create: {
            workspaceId: ctx.workspace.id,
            palette: { swatches: palette },
            provisional: true,
          },
          update: { palette: { swatches: palette }, provisional: true },
        });
      }
    }
  }

  const asset = await db.brandAsset.create({
    data: {
      workspaceId: ctx.workspace.id,
      kind: kind.data,
      storageKey: key,
      mime: type.mime,
      bytes: buffer.length,
      extracted: extracted as never,
    },
  });

  const completion = await recomputeCompletion(ctx.workspace.id);
  const url = await getSignedUrl(key);

  return NextResponse.json({
    asset: { id: asset.id, kind: asset.kind, bytes: asset.bytes, url },
    completion,
  });
}
