import "server-only";
import { db } from "@/lib/db";
import {
  computeCompletion,
  GENERATION_THRESHOLD,
  type CompletionResult,
} from "@/lib/brand/completion";
import type { WorkspaceContext } from "@/lib/workspace";

export type GenerationGate = {
  allowed: boolean;
  emailVerified: boolean;
  completion: CompletionResult;
  threshold: number;
};

/* The gate (BRIEF §4.8): a workspace cannot generate until the owner's
   email is verified and completion ≥ 25%. Shown as an encouraging
   card, never an error. */
export async function getGenerationGate(
  ctx: WorkspaceContext
): Promise<GenerationGate> {
  const [profile, brandSystem, assets] = await Promise.all([
    db.hotelProfile.findUnique({ where: { workspaceId: ctx.workspace.id } }),
    db.brandSystem.findUnique({ where: { workspaceId: ctx.workspace.id } }),
    db.brandAsset.findMany({
      where: { workspaceId: ctx.workspace.id },
      select: { kind: true },
    }),
  ]);

  const completion = computeCompletion({
    assetKinds: assets.map((a) => a.kind),
    profile,
    workspace: ctx.workspace,
    brandSystem,
  });

  const emailVerified = Boolean(ctx.user.emailVerifiedAt);
  return {
    allowed: emailVerified && completion.percent >= GENERATION_THRESHOLD,
    emailVerified,
    completion,
    threshold: GENERATION_THRESHOLD,
  };
}
