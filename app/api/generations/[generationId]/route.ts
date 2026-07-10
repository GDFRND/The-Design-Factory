import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { expandedPromptSchema } from "@/lib/ai/expanded-prompt";
import { getWorkspaceContext } from "@/lib/workspace";

/* PATCH: persist edits to the creative plan (the left-rail form). */

export async function PATCH(
  request: Request,
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

  const body = await request.json().catch(() => null);
  const parsed = expandedPromptSchema.safeParse(body?.prompt);
  if (!parsed.success) {
    return NextResponse.json({ error: "Invalid plan" }, { status: 400 });
  }

  const existing = (generation.expandedPrompt as Record<string, unknown> | null) ?? {};
  const attachmentIds = existing.attachmentIds;

  await db.generation.update({
    where: { id: generation.id },
    data: {
      expandedPrompt: {
        ...parsed.data,
        ...(attachmentIds ? { attachmentIds } : {}),
      } as never,
    },
  });

  return NextResponse.json({ ok: true });
}
