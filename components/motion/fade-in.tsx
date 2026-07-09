"use client";

import * as React from "react";
import { cn } from "@/lib/utils";

export function useReducedMotion() {
  const [reduced, setReduced] = React.useState(false);
  React.useEffect(() => {
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    setReduced(mq.matches);
    const onChange = (e: MediaQueryListEvent) => setReduced(e.matches);
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return reduced;
}

/* Entrance fade. Duration defaults to --d-4 (420ms). Under
   prefers-reduced-motion the final state renders immediately. */
export function FadeIn({
  delay = 0,
  duration = 420,
  y = 12,
  className,
  children,
}: {
  delay?: number;
  duration?: number;
  y?: number;
  className?: string;
  children: React.ReactNode;
}) {
  const [visible, setVisible] = React.useState(false);
  const reduced = useReducedMotion();

  React.useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const shown = visible || reduced;

  return (
    <div
      className={cn("transition-[opacity,transform] ease-tdf", className)}
      style={{
        opacity: shown ? 1 : 0,
        transform: shown ? "none" : `translateY(${y}px)`,
        transitionDuration: `${duration}ms`,
        transitionDelay: shown && !reduced ? `${delay}ms` : "0ms",
      }}
    >
      {children}
    </div>
  );
}
