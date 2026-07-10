import { notFound } from "next/navigation";
import { MonoLabel } from "@/components/brand/mono-label";
import { StudioShell } from "@/components/studio/studio-shell";
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
  });
  if (!generation) notFound();

  return (
    <StudioShell hotelName={ctx.workspace.hotelName}>
      <main className="container-tdf flex flex-col gap-6 py-16">
        <MonoLabel size="sm" className="text-muted-foreground">
          {generation.assetType} · {generation.outputKind}
        </MonoLabel>
        <h1 className="text-h1">Creation workspace</h1>
        <p className="max-w-[60ch] text-body text-secondary-foreground">
          Your brief is in. The creative plan and variants surface here —
          this workspace is being assembled next.
        </p>
        <div className="max-w-xl rounded-card border border-line bg-raised p-4 text-[15px] text-secondary-foreground">
          {generation.rawBrief}
        </div>
      </main>
    </StudioShell>
  );
}
