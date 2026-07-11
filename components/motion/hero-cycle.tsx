"use client";

import * as React from "react";
import Image, { type StaticImageData } from "next/image";
import { cn } from "@/lib/utils";
import { useReducedMotion } from "@/components/motion/fade-in";

/* Three-image ambient cycle (BRIEF §5.1, hardened per FIX-02 §2).
   Invariants that keep it from ever showing the orb through a hole:
   - exactly one layer is lit, expressed as idx === active, never a
     subtraction
   - every layer is preloaded — a lazy layer fades in to nothing
   - the interval is HOLD + FADE with its cleanup returned, so ticks
     never race and the next fade never starts mid-fade
   - the wrapper carries an opaque Graphite base: if every layer fails,
     you get Graphite, never a surprise
   Ken Burns is decoupled from the crossfade — one slow scale loop per
   layer (2× the cycle, ease-in-out, alternate) with per-layer negative
   delays and alternating origins, so nothing resets at the fade.
   Under prefers-reduced-motion the interval never starts and layer 0
   stays lit; the scrim is baked into the images, no runtime overlay. */

const ORIGINS = ["bottom left", "top right", "bottom right"];

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
  images: { src: string | StaticImageData; alt: string }[];
  className?: string;
  progressClassName?: string;
}) {
  const [active, setActive] = React.useState(0);
  const [cycleMs, setCycleMs] = React.useState(7200);
  const reduced = useReducedMotion();
  const timer = React.useRef<ReturnType<typeof setInterval> | null>(null);

  React.useEffect(() => {
    // --d-hold + --d-ambient: the interval is hold PLUS fade, so a
    // transition always completes before the next one starts.
    setCycleMs(readMs("--d-hold", 6000) + readMs("--d-ambient", 1200));
  }, []);

  const restart = React.useCallback(() => {
    if (timer.current) clearInterval(timer.current);
    timer.current = setInterval(
      () => setActive((p) => (p + 1) % images.length),
      cycleMs
    );
  }, [cycleMs, images.length]);

  React.useEffect(() => {
    if (reduced || images.length < 2) return;
    restart();
    return () => {
      // Non-negotiable: an uncleared interval multiplies on re-render
      // and the racing ticks are what blank every layer at once.
      if (timer.current) clearInterval(timer.current);
    };
  }, [reduced, restart, images.length]);

  const kenBurnsMs = cycleMs * 2;

  return (
    <div
      className={cn(
        // Opaque Graphite base — the fail-safe surface.
        "absolute inset-0 overflow-hidden bg-tdf-950",
        className
      )}
    >
      {images.map((img, idx) => (
        <div
          key={typeof img.src === "string" ? img.src : img.src.src}
          data-hero-layer={idx}
          aria-hidden={idx !== active}
          className="absolute inset-0 transition-opacity ease-linear"
          style={{
            // Exactly one layer is lit, always.
            opacity: idx === active ? 1 : 0,
            transitionDuration: "var(--d-ambient)",
          }}
        >
          <div
            className="absolute inset-0"
            // Longhands only — mixing the `animation` shorthand with a
            // longhand delay makes React rerenders fight over the rule.
            style={{
              transformOrigin: ORIGINS[idx % ORIGINS.length],
              animationName: reduced ? "none" : "tdf-kenburns",
              animationDuration: `${kenBurnsMs}ms`,
              animationTimingFunction: "ease-in-out",
              animationIterationCount: "infinite",
              animationDirection: "alternate",
              // Offset per layer so no two layers rescale in step.
              animationDelay: `${idx * -(kenBurnsMs / images.length)}ms`,
            }}
          >
            <Image
              src={img.src}
              alt={img.alt}
              fill
              sizes="100vw"
              // All layers, not just the first — a layer that was never
              // fetched fades in to nothing (FIX-02 §2.2).
              preload
              placeholder={typeof img.src === "string" ? "empty" : "blur"}
              className="object-cover"
            />
          </div>
        </div>
      ))}

      {!reduced && images.length > 1 ? (
        <div
          role="group"
          aria-label="Hero images"
          className={cn(
            "absolute bottom-8 right-8 z-20 flex items-center gap-2",
            progressClassName
          )}
        >
          {images.map((img, idx) => (
            <button
              key={typeof img.src === "string" ? img.src : img.src.src}
              type="button"
              aria-label={`Show image ${idx + 1} of ${images.length}`}
              aria-current={idx === active}
              onClick={() => {
                setActive(idx);
                restart();
              }}
              className="group py-2"
            >
              <span
                className={cn(
                  "block h-0.5 w-6 transition-colors duration-180 ease-tdf",
                  idx === active
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
