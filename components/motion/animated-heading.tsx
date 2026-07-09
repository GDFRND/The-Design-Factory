"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/components/motion/fade-in";

/* Character-stagger heading (BRIEF §5.1). 200ms initial delay,
   30ms per character, 260ms per-character transition from
   opacity 0 / translateX(−18px). The heading carries a plain-text
   aria-label; the spans are aria-hidden so screen readers never
   read it letter by letter. */
export function AnimatedHeading({
  text,
  speed = 30,
  initialDelay = 200,
  accent,
  accentClassName = "italic",
  as: Tag = "h1",
  className,
}: {
  text: string;
  speed?: number;
  initialDelay?: number;
  /** Substring rendered with accentClassName (e.g. the italic Blueprint word). */
  accent?: string;
  accentClassName?: string;
  as?: "h1" | "h2" | "h3" | "p";
  className?: string;
}) {
  const [visible, setVisible] = React.useState(false);
  const reduced = useReducedMotion();

  React.useEffect(() => {
    const raf = requestAnimationFrame(() => setVisible(true));
    return () => cancelAnimationFrame(raf);
  }, []);

  const shown = visible || reduced;
  const accentStart = accent ? text.indexOf(accent) : -1;
  const accentEnd = accentStart >= 0 ? accentStart + accent!.length : -1;

  const lines = text.split("\n");
  let globalIndex = 0;
  let charCount = 0;

  return (
    <Tag className={className} aria-label={text.replace(/\n/g, " ")}>
      {lines.map((line, li) => {
        const lineStart = charCount;
        charCount += line.length + 1; // +1 for the split newline
        return (
          <span key={li} aria-hidden className="block">
            {Array.from(line).map((ch, ci) => {
              const abs = lineStart + ci;
              const idx = globalIndex++;
              const inAccent = abs >= accentStart && abs < accentEnd && accentStart >= 0;
              return (
                <span
                  key={ci}
                  className={cn(
                    "inline-block transition-[opacity,transform] duration-260 ease-tdf",
                    inAccent && accentClassName
                  )}
                  style={{
                    opacity: shown ? 1 : 0,
                    transform: shown ? "none" : "translateX(-18px)",
                    transitionDelay: reduced
                      ? "0ms"
                      : `${initialDelay + idx * speed}ms`,
                  }}
                >
                  {ch === " " ? " " : ch}
                </span>
              );
            })}
          </span>
        );
      })}
    </Tag>
  );
}
