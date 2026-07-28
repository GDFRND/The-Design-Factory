import Image from "next/image";
import Link from "next/link";
import { Plus } from "lucide-react";
import { MonoLabel } from "@/components/brand/mono-label";
import { serializeVariant } from "@/lib/ai/generate";
import { getGenerationGate } from "@/lib/brand/gate";
import { db } from "@/lib/db";
import {
  deriveAssetStatus,
  STATUS_LABEL,
  type AssetStatus,
} from "@/lib/studio/asset-status";
import { requireWorkspace } from "@/lib/workspace";
import { cn } from "@/lib/utils";

export const metadata = { title: "Dashboard · The Design Factory" };

const STATUS_CLASS: Record<AssetStatus, string> = {
  DRAFT: "text-muted-foreground",
  AWAITING_APPROVAL: "text-warning",
  APPROVED: "text-success",
  DOWNLOADED: "text-success",
};

const EXPLAINER = [
  { no: "01 · Choose", title: "Choose what you want", body: "A poster, a room offer, an email to past guests." },
  { no: "02 · Describe", title: "Describe your offer", body: "The offer, the price, the dates, who it's for." },
  { no: "03 · Create", title: "Review and create", body: "We turn the brief into a plan, then build it in your brand." },
];

export default async function DashboardPage() {
  const ctx = await requireWorkspace();
  const [gate, generations] = await Promise.all([
    getGenerationGate(ctx),
    db.generation.findMany({
      where: { workspaceId: ctx.workspace.id },
      orderBy: { createdAt: "desc" },
      take: 24,
      include: {
        variants: {
          orderBy: { createdAt: "asc" },
          include: { approvals: { select: { decision: true } } },
        },
      },
    }),
  ]);

  const firstName = ctx.user.name.split(" ")[0];

  const assets = await Promise.all(
    generations.map(async (g) => {
      const variants = g.variants;
      const thumb = variants.find((v) => v.imageKey);
      const status = deriveAssetStatus({
        anyDownloaded: variants.some((v) => v.downloadedAt),
        anyApproved: variants.some((v) =>
          v.approvals.some((a) => a.decision === "APPROVED")
        ),
        anyPending: variants.some((v) =>
          v.approvals.some((a) => a.decision === "PENDING")
        ),
      });
      return {
        id: g.id,
        assetType: g.assetType,
        outputKind: g.outputKind,
        createdAt: g.createdAt,
        status,
        imageUrl: thumb ? (await serializeVariant(thumb)).imageUrl : null,
        headline:
          (variants.find((v) => v.copy)?.copy as { headline?: string } | null)
            ?.headline ?? null,
      };
    })
  );

  return (
    <main className="container-tdf flex flex-col gap-10 py-10">
      {/* Greeting strip */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-col gap-2">
          <h1 className="font-display text-[clamp(1.75rem,3.5vw,2.75rem)] font-light leading-[1.1] tracking-[-0.018em]">
            {firstName}&apos;s desk · {ctx.workspace.hotelName}
          </h1>
          <div className="flex items-center gap-3">
            {ctx.workspace.county ? (
              <MonoLabel size="xs" className="text-muted-foreground">
                {ctx.workspace.county}
              </MonoLabel>
            ) : null}
            <Link href="/studio/brand">
              <MonoLabel
                size="xs"
                className={cn(
                  gate.completion.percent < 60 ? "text-warning" : "text-success"
                )}
              >
                Brand · {gate.completion.percent}% complete
              </MonoLabel>
            </Link>
          </div>
        </div>
        {/* The one accent element on this screen. */}
        <Link
          href="/studio"
          className="inline-flex h-11 items-center gap-2 rounded-full bg-blueprint px-6 text-[15px] font-medium text-(--accent-fg) transition-shadow duration-180 ease-tdf hover:shadow-(--lift-accent)"
        >
          <Plus className="size-4" aria-hidden /> New asset
        </Link>
      </div>

      {assets.length === 0 ? (
        /* Empty state — the three-card explainer. */
        <div className="flex flex-col gap-8">
          <div className="grid gap-6 md:grid-cols-3">
            {EXPLAINER.map((card) => (
              <div
                key={card.no}
                className="flex flex-col gap-3 rounded-card border border-line bg-raised p-6"
              >
                <MonoLabel size="sm" className="text-muted-foreground">
                  {card.no}
                </MonoLabel>
                <h2 className="text-h2">{card.title}</h2>
                <p className="text-[15px] leading-relaxed text-secondary-foreground">
                  {card.body}
                </p>
              </div>
            ))}
          </div>
          <Link
            href="/studio"
            className="inline-flex h-11 w-fit items-center gap-2 rounded-full bg-blueprint px-6 text-[15px] font-medium text-(--accent-fg) transition-shadow duration-180 ease-tdf hover:shadow-(--lift-accent)"
          >
            Start a new asset
          </Link>
        </div>
      ) : (
        <section className="flex flex-col gap-4">
          <MonoLabel size="sm" className="text-muted-foreground">
            Recent assets
          </MonoLabel>
          <ul className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
            {assets.map((a) => (
              <li key={a.id}>
                <Link
                  href={`/studio/${a.id}`}
                  className="group flex flex-col gap-2 rounded-card border border-line bg-raised p-2 transition-colors duration-180 ease-tdf hover:border-(--line-strong)"
                >
                  <div className="relative aspect-[4/5] overflow-hidden rounded-chip bg-inset">
                    {a.imageUrl ? (
                      <Image
                        src={a.imageUrl}
                        alt=""
                        fill
                        sizes="(min-width: 1024px) 22vw, 45vw"
                        className="object-cover"
                        unoptimized
                      />
                    ) : (
                      <div className="flex h-full items-center justify-center p-4 text-center">
                        <span className="line-clamp-4 text-[13px] text-secondary-foreground">
                          {a.headline ?? a.assetType}
                        </span>
                      </div>
                    )}
                  </div>
                  <div className="flex flex-col gap-1 px-1 pb-1">
                    <span className="truncate text-[13px] font-medium">
                      {a.assetType}
                    </span>
                    <div className="flex items-center justify-between gap-2">
                      <MonoLabel size="xs" className={STATUS_CLASS[a.status]}>
                        {STATUS_LABEL[a.status]}
                      </MonoLabel>
                      <MonoLabel size="xs" className="text-muted-foreground">
                        {a.createdAt.toLocaleDateString("en-KE", {
                          day: "2-digit",
                          month: "short",
                        })}
                      </MonoLabel>
                    </div>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
    </main>
  );
}
