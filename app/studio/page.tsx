import Link from "next/link";
import { MonoLabel } from "@/components/brand/mono-label";
import { StudioIntake } from "@/components/studio/intake";
import { SupportPanel } from "@/components/studio/support-panel";
import { db } from "@/lib/db";
import { getGenerationGate } from "@/lib/brand/gate";
import { requireWorkspace } from "@/lib/workspace";
import { cn } from "@/lib/utils";

export const metadata = { title: "Studio · The Design Factory" };

export default async function StudioPage() {
  const ctx = await requireWorkspace();
  const [gate, assignment, recent] = await Promise.all([
    getGenerationGate(ctx),
    db.assignment.findFirst({
      where: { workspaceId: ctx.workspace.id },
      include: { assistant: { select: { name: true } } },
    }),
    db.generation.findMany({
      where: { workspaceId: ctx.workspace.id },
      orderBy: { createdAt: "desc" },
      take: 5,
      select: { id: true, assetType: true, status: true, createdAt: true },
    }),
  ]);

  const firstName = ctx.user.name.split(" ")[0];
  const percent = gate.completion.percent;

  return (
    <>
      <main className="container-tdf flex flex-col gap-10 py-12 lg:py-16">
        <div className="flex flex-col gap-4">
          <h1 className="font-display text-[clamp(2rem,4vw,3rem)] font-light leading-[1.08] tracking-[-0.018em]">
            Hello, {firstName}. What are we building today?
          </h1>
          <Link
            href="/studio/brand"
            className="inline-flex w-fit items-center gap-2 rounded-full border border-line px-4 py-1.5 transition-colors duration-180 ease-tdf hover:bg-sunken"
          >
            <MonoLabel
              size="sm"
              className={cn(percent < 60 ? "text-warning" : "text-success")}
            >
              Brand profile · {percent}% complete
            </MonoLabel>
          </Link>
        </div>

        <div className="grid gap-10 lg:grid-cols-[minmax(0,1fr)_320px]">
          <div className="flex flex-col gap-8">
            {gate.allowed ? (
              <StudioIntake />
            ) : (
              <div className="max-w-xl rounded-panel border border-line bg-raised p-6 shadow-e1">
                <MonoLabel size="sm" className="text-muted-foreground">
                  Before we build
                </MonoLabel>
                <p className="mt-3 text-body text-secondary-foreground">
                  {!gate.emailVerified
                    ? "Verify your email, then add your logo and hotel basics — the studio opens at 25%."
                    : `A little more and the studio opens — ${gate.threshold}% unlocks it. You're at ${percent}%.`}
                </p>
                <ul className="mt-4 flex flex-col gap-2">
                  {gate.completion.missing.slice(0, 3).map((m) => (
                    <li key={m.label} className="flex items-baseline gap-3">
                      <MonoLabel size="xs" className="shrink-0 text-blueprint">
                        +{m.weight}%
                      </MonoLabel>
                      <span className="text-[15px] text-secondary-foreground">
                        {m.cta}
                      </span>
                    </li>
                  ))}
                </ul>
                <Link
                  href="/studio/brand"
                  className="mt-6 inline-flex h-10 items-center rounded-full bg-foreground px-6 text-[15px] font-medium text-background transition-colors duration-180 ease-tdf hover:bg-tdf-700 dark:hover:bg-tdf-200"
                >
                  Build your brand profile
                </Link>
              </div>
            )}

            {recent.length ? (
              <div className="flex flex-col gap-3">
                <MonoLabel size="sm" className="text-muted-foreground">
                  Recent
                </MonoLabel>
                <ul className="flex flex-col divide-y divide-line rounded-card border border-line bg-raised">
                  {recent.map((g) => (
                    <li key={g.id}>
                      <Link
                        href={`/studio/${g.id}`}
                        className="flex items-center justify-between gap-4 px-4 py-3 transition-colors duration-180 ease-tdf hover:bg-sunken"
                      >
                        <span className="truncate text-[15px]">{g.assetType}</span>
                        <MonoLabel size="xs" className="shrink-0 text-muted-foreground">
                          {g.status}
                        </MonoLabel>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ) : null}
          </div>

          <SupportPanel assistantName={assignment?.assistant.name ?? null} />
        </div>
      </main>
    </>
  );
}
