"use client";

import * as React from "react";
import { MonoLabel } from "@/components/brand/mono-label";
import { useReducedMotion } from "@/components/motion/fade-in";
import { cn } from "@/lib/utils";

/* §03 live demo widget — steps 35% → 60% → 100% on a loop.
   Purely illustrative; the real score comes from the completion
   scorer in lib/brand/completion.ts. */

const STEPS = [
  {
    percent: 35,
    received: ["Logo received", "Hotel basics received"],
    next: "Add your room types so we can build better offers.",
  },
  {
    percent: 60,
    received: ["Room types received", "Photography received"],
    next: "Add a past poster so we can learn your layout habits.",
  },
  {
    percent: 100,
    received: ["Brand system confirmed"],
    next: "Your brand system is complete. Everything you create uses it.",
  },
];

export function BrandCompletionDemo() {
  const [step, setStep] = React.useState(0);
  const [displayed, setDisplayed] = React.useState(STEPS[0].percent);
  const reduced = useReducedMotion();

  React.useEffect(() => {
    if (reduced) return;
    const interval = setInterval(
      () => setStep((s) => (s + 1) % STEPS.length),
      3000
    );
    return () => clearInterval(interval);
  }, [reduced]);

  // 420ms count-up toward the current step's percent
  React.useEffect(() => {
    if (reduced) {
      setDisplayed(STEPS[step].percent);
      return;
    }
    const from = displayed;
    const to = STEPS[step].percent;
    if (from === to) return;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 420);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayed(Math.round(from + (to - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [step, reduced]);

  const current = STEPS[step];

  return (
    <div className="rounded-panel border border-line bg-raised p-6 shadow-e2 md:p-8">
      <div className="flex items-baseline justify-between gap-4">
        <MonoLabel size="sm" className="text-muted-foreground">
          Brand profile
        </MonoLabel>
        <MonoLabel
          size="sm"
          className={cn(displayed < 60 ? "text-warning" : "text-success")}
        >
          {displayed}% complete
        </MonoLabel>
      </div>
      <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-sunken">
        <div
          className="h-full rounded-full bg-blueprint transition-[width] duration-420 ease-tdf"
          style={{ width: `${displayed}%` }}
        />
      </div>
      <ul className="mt-6 flex flex-col gap-2">
        {current.received.map((r) => (
          <li key={r} className="flex items-center gap-3">
            <span aria-hidden className="size-1.5 rounded-full bg-success" />
            <MonoLabel size="xs" className="text-muted-foreground">
              {r}
            </MonoLabel>
          </li>
        ))}
      </ul>
      <p className="mt-4 text-[15px] leading-relaxed text-secondary-foreground">
        {current.next}
      </p>
    </div>
  );
}
