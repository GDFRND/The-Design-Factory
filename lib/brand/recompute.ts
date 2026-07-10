import "server-only";
import { db } from "@/lib/db";
import { computeCompletion } from "@/lib/brand/completion";

/** Recomputes and persists BrandSystem.completion for a workspace.
    Call after any change to assets, profile or brand system. */
export async function recomputeCompletion(workspaceId: string) {
  const [workspace, profile, brandSystem, assets] = await Promise.all([
    db.workspace.findUnique({ where: { id: workspaceId } }),
    db.hotelProfile.findUnique({ where: { workspaceId } }),
    db.brandSystem.findUnique({ where: { workspaceId } }),
    db.brandAsset.findMany({ where: { workspaceId }, select: { kind: true } }),
  ]);

  const result = computeCompletion({
    assetKinds: assets.map((a) => a.kind),
    profile,
    workspace,
    brandSystem,
  });

  await db.brandSystem.upsert({
    where: { workspaceId },
    create: { workspaceId, completion: result.percent },
    update: { completion: result.percent },
  });

  return result;
}
