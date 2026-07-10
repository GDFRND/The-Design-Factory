import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { produceVariants, serializeVariant } from "@/lib/ai/generate";
import { getGenerationGate } from "@/lib/brand/gate";
import { getWorkspaceContext } from "@/lib/workspace";

/* Produces variants for a READY generation. */

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ generationId: string }> }
) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { generationId } = await params;
  const generation = await db.generation.findFirst({
    where: { id: generationId, workspaceId: ctx.workspace.id },
    include: { variants: true },
  });
  if (!generation) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  const gate = await getGenerationGate(ctx);
  if (!gate.allowed) {
    return NextResponse.json(
      { error: "Complete your brand profile to unlock the studio." },
      { status: 403 }
    );
  }

  if (generation.variants.length) {
    return NextResponse.json({
      variants: await Promise.all(generation.variants.map(serializeVariant)),
    });
  }

  await db.generation.update({
    where: { id: generation.id },
    data: { status: "GENERATING" },
  });

  try {
    const variants = await produceVariants(generation.id, ctx.workspace.id);
    return NextResponse.json({
      variants: await Promise.all(variants.map(serializeVariant)),
    });
  } catch (e) {
    console.error("[generate] failed", e);
    await db.generation.update({
      where: { id: generation.id },
      data: { status: "FAILED" },
    });
    return NextResponse.json(
      { error: "Generation failed. Try again in a moment." },
      { status: 502 }
    );
  }
}
