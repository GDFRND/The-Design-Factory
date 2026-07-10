import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { buildBrandDossier } from "@/lib/ai/dossier";
import { expandBrief } from "@/lib/ai/expand";
import { getGenerationGate } from "@/lib/brand/gate";
import type { OutputKind } from "@/lib/studio/asset-types";
import { getWorkspaceContext } from "@/lib/workspace";

/* Expands a generation's raw brief into an ExpandedPrompt and stores it.
   Idempotent: re-posting returns the stored plan. Workspace-scoped:
   a generation outside the caller's workspace is a 404. */

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ generationId: string }> }
) {
  const ctx = await getWorkspaceContext();
  if (!ctx) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const { generationId } = await params;
  const generation = await db.generation.findFirst({
    where: { id: generationId, workspaceId: ctx.workspace.id },
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

  const existing = generation.expandedPrompt as Record<string, unknown> | null;
  if (existing && existing.keyMessage !== undefined) {
    return NextResponse.json({ prompt: existing, status: generation.status });
  }

  await db.generation.update({
    where: { id: generation.id },
    data: { status: "EXPANDING" },
  });

  try {
    const dossier = await buildBrandDossier(ctx.workspace.id);
    const attachmentIds = (existing?.attachmentIds as string[] | undefined) ?? [];
    const { prompt } = await expandBrief({
      assetType: generation.assetType,
      outputKind: generation.outputKind as OutputKind,
      rawBrief: generation.rawBrief,
      attachmentNotes: attachmentIds.length
        ? `${attachmentIds.length} image(s) attached by the hotel as reference or for branding.`
        : undefined,
      dossier,
    });

    const stored = { ...prompt, ...(attachmentIds.length ? { attachmentIds } : {}) };
    await db.generation.update({
      where: { id: generation.id },
      data: { expandedPrompt: stored as never, status: "READY" },
    });

    return NextResponse.json({ prompt: stored, status: "READY" });
  } catch (e) {
    console.error("[expand] failed", e);
    await db.generation.update({
      where: { id: generation.id },
      data: { status: "FAILED" },
    });
    return NextResponse.json(
      { error: "We couldn't build the creative plan. Try again." },
      { status: 502 }
    );
  }
}
