import "server-only";
import { computeCompletion } from "@/lib/brand/completion";
import { db } from "@/lib/db";
import { DEMO_BRANDS, brandLogo } from "@/lib/demo/brands";
import { getSignedUrl } from "@/lib/storage";
import type { WorkspaceContext } from "@/lib/workspace";

/* Resolves the app-bar props for a workspace: the brand logo to show
   on the dark bar, and the live completion percentage. Demo brands use
   their public logo (plated where the plating rule flagged them);
   real workspaces use their uploaded LOGO asset via a signed URL. */

export async function getChrome(ctx: WorkspaceContext) {
  const demo = DEMO_BRANDS.find((b) => b.slug === ctx.workspace.slug);

  let logoSrc: string | null = demo ? brandLogo(demo.slug, demo.plated) : null;

  const [profile, brandSystem, assets] = await Promise.all([
    db.hotelProfile.findUnique({ where: { workspaceId: ctx.workspace.id } }),
    db.brandSystem.findUnique({ where: { workspaceId: ctx.workspace.id } }),
    db.brandAsset.findMany({
      where: { workspaceId: ctx.workspace.id },
      select: { kind: true, storageKey: true, extracted: true },
    }),
  ]);

  if (!logoSrc) {
    const logoAsset = assets.find((a) => a.kind === "LOGO");
    if (logoAsset) logoSrc = await getSignedUrl(logoAsset.storageKey);
  }

  const completion = computeCompletion({
    assetKinds: assets.map((a) => a.kind),
    profile,
    workspace: ctx.workspace,
    brandSystem,
  });

  return {
    hotelName: ctx.workspace.hotelName,
    logoSrc,
    completion: completion.percent,
    userName: ctx.user.name,
  };
}
