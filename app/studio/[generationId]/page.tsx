import { notFound } from "next/navigation";
import { StudioShell } from "@/components/studio/studio-shell";
import { CreationWorkspace } from "@/components/studio/creation-workspace";
import { serializeVariant } from "@/lib/ai/generate";
import { db } from "@/lib/db";
import { requireWorkspace } from "@/lib/workspace";

export const metadata = { title: "Creation · The Design Factory" };

export default async function GenerationPage({
  params,
}: {
  params: Promise<{ generationId: string }>;
}) {
  const ctx = await requireWorkspace();
  const { generationId } = await params;

  // Scoped read: a generation outside this workspace is a 404, not 403.
  const generation = await db.generation.findFirst({
    where: { id: generationId, workspaceId: ctx.workspace.id },
    include: {
      variants: {
        orderBy: { createdAt: "asc" },
        include: {
          approvals: {
            orderBy: { createdAt: "desc" },
            include: { reviewer: { select: { name: true } } },
          },
        },
      },
    },
  });
  if (!generation) notFound();

  const recent = await db.generation.findMany({
    where: { workspaceId: ctx.workspace.id, id: { not: generation.id } },
    orderBy: { createdAt: "desc" },
    take: 8,
    select: { id: true, assetType: true, status: true, rawBrief: true, createdAt: true },
  });

  const approvers = await db.membership.findMany({
    where: {
      workspaceId: ctx.workspace.id,
      role: { in: ["HOTEL_APPROVER", "HOTEL_MARKETER"] },
    },
    include: { user: { select: { id: true, name: true } } },
  });
  const assignment = await db.assignment.findFirst({
    where: { workspaceId: ctx.workspace.id },
    include: { assistant: { select: { id: true, name: true } } },
  });

  const variants = await Promise.all(
    generation.variants.map(async (v) => ({
      ...(await serializeVariant(v)),
      approvals: v.approvals.map((a) => ({
        id: a.id,
        stage: a.stage,
        decision: a.decision,
        reviewerName: a.reviewer.name,
        note: a.note,
      })),
    }))
  );

  const stored = generation.expandedPrompt as Record<string, unknown> | null;
  const hasPlan = Boolean(stored && stored.keyMessage !== undefined);

  return (
    <StudioShell hotelName={ctx.workspace.hotelName}>
      <CreationWorkspace
        generation={{
          id: generation.id,
          assetType: generation.assetType,
          outputKind: generation.outputKind,
          rawBrief: generation.rawBrief,
          status: generation.status,
          plan: hasPlan ? (stored as never) : null,
        }}
        initialVariants={variants}
        recent={recent.map((r) => ({
          id: r.id,
          assetType: r.assetType,
          status: r.status,
          brief: r.rawBrief,
          createdAt: r.createdAt.toISOString(),
        }))}
        reviewers={{
          approvers: approvers.map((m) => ({ id: m.user.id, name: m.user.name })),
          assistant: assignment
            ? { id: assignment.assistant.id, name: assignment.assistant.name }
            : null,
        }}
      />
    </StudioShell>
  );
}
