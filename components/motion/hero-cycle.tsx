"use client";

import * as React from "react";
import Image from "next/image";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/components/motion/fade-in";

/* Three-image ambient cycle (BRIEF §5.1) — the one place --d-hold /
   --d-ambient may be used. Hold 6s, cross-fade 1200ms linear,
   looping 1→2→3→1, with a Ken Burns drift (scale 1.00→1.06) over the
   full cycle, transform-origin alternating between layers.
   prefers-reduced-motion: image 1 only, static.
   No dimming overlay — legibility comes from the reversed lockup and
   the glass panels. */

const ORIGINS = ["50% 50%", "35% 45%", "65% 55%"];

function readMs(name: string, fallback: number) {
  if (typeof window === "undefined") return fallback;
  const raw = getComputedStyle(document.documentElement).getPropertyValue(name);
  const n = parseFloat(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function HeroCycle({
  images,
  className,
  progressClassName,
}: {
  images: { src: string; alt: string }[];
  className?: string;
  progressClassName?: string;
}) {
  const [active, setActive] = React.useState(0);
  const [cycleMs, setCycleMs] = React.useState(7200);
  const reduced = useReducedMotion();
  const timer = React.useRef<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(() => {
    setCycleMs(readMs("--d-hold", 6000) + readMs("--d-ambient", 1200));
  }, []);

  const restart = React.useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(
      () => setActive((a) => (a + 1) % images.length),
      cycleMs
    );
  }, [cycleMs, images.length]);

  React.useEffect(() => {
    if (reduced || images.length < 2) return;
    restart();
    return () => {
      if (timer.current) clearInterval(timer.current);
    };
  }, [reduced, restart, images.length]);

  const shown = reduced ? images.slice(0, 1) : images;

  return (
    <div className={cn("absolute inset-0 overflow-hidden", className)}>
      {shown.map((img, i) => {
        const isActive = i === active || reduced;
        return (
          <div
            key={img.src}
            aria-hidden={!isActive}
            className="absolute inset-0 transition-opacity ease-linear"
            style={{
              opacity: isActive ? 1 : 0,
              transitionDuration: "var(--d-ambient)",
            }}
          >
            <div
              className="absolute inset-0"
              style={{
                transformOrigin: ORIGINS[i % ORIGINS.length],
                animation:
                  isActive && !reduced
                    ? `tdf-kenburns ${cycleMs}ms linear forwards`
                    : "none",
              }}
            >
              <Image
                src={img.src}
                alt={img.alt}
                fill
                sizes="100vw"
                preload={i === 0}
                loading="eager"
                className="object-cover"
              />
            </div>
          </div>
        );
      })}

      {!reduced && images.length > 1 ? (
        <div
          role="group"
          aria-label="Hero images"
          className={cn(
            "absolute bottom-8 right-8 z-20 flex items-center gap-2",
            progressClassName
          )}
        >
          {images.map((img, i) => (
            <button
              key={img.src}
              type="button"
              aria-label={`Show image ${i + 1} of ${images.length}`}
              aria-current={i === active}
              onClick={() => {
                setActive(i);
                restart();
              }}
              className="group py-2"
            >
              <span
                className={cn(
                  "block h-0.5 w-6 transition-colors duration-180 ease-tdf",
                  i === active
                    ? "bg-tdf-025"
                    : "bg-tdf-200/30 group-hover:bg-tdf-200/60"
                )}
              />
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}
