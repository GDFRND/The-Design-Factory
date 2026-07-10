import Link from "next/link";
import { MonoLabel } from "@/components/brand/mono-label";
import { getGenerationGate } from "@/lib/brand/gate";
import { requireWorkspace } from "@/lib/workspace";
import { cn } from "@/lib/utils";

export const metadata = { title: "Studio · The Design Factory" };

export default async function StudioPage() {
  const ctx = await requireWorkspace();
  const gate = await getGenerationGate(ctx);
  const firstName = ctx.user.name.split(" ")[0];
  const percent = gate.completion.percent;

  return (
    <main className="container-tdf flex flex-col gap-8 py-24">
      <div className="flex flex-col gap-4">
        <h1 className="font-display text-display-2">
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

      {!gate.allowed ? (
        <div className="max-w-xl rounded-panel border border-line bg-raised p-6 shadow-e1">
          <MonoLabel size="sm" className="text-muted-foreground">
            Before we build
          </MonoLabel>
          <p className="mt-3 text-body text-secondary-foreground">
            {!gate.emailVerified
              ? "Verify your email and add your logo and hotel basics — then the studio opens."
              : `Add a little more to your brand profile — ${gate.threshold}% unlocks the studio. You're at ${percent}%.`}
          </p>
          <ul className="mt-4 flex flex-col gap-2">
            {gate.completion.missing.slice(0, 3).map((m) => (
              <li key={m.label} className="flex items-baseline gap-3">
                <MonoLabel size="xs" className="shrink-0 text-blueprint">
                  +{m.weight}%
                </MonoLabel>
                <span className="text-[15px] text-secondary-foreground">{m.cta}</span>
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
      ) : (
        <p className="max-w-[52ch] text-body text-secondary-foreground">
          The studio intake is being assembled — asset types, your brief, and
          attachments land here next.
        </p>
      )}
    </main>
  );
}
