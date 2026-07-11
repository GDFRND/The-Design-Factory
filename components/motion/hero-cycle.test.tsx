// @vitest-environment jsdom
import * as React from "react";
import { act, cleanup, render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { HeroCycle } from "./hero-cycle";

/* FIX-02 §2.4 — the regression test that would have caught the blank
   hero: across eight full cycles, exactly one layer is at opacity 1 at
   every tick. */

const IMAGES = [
  { src: "/hero/1.jpg", alt: "" },
  { src: "/hero/2.jpg", alt: "" },
  { src: "/hero/3.jpg", alt: "" },
];

const CYCLE = 7200; // --d-hold (6000) + --d-ambient (1200) fallbacks

function litLayers(container: HTMLElement): number[] {
  return [...container.querySelectorAll<HTMLElement>("[data-hero-layer]")]
    .filter((el) => el.style.opacity === "1")
    .map((el) => Number(el.dataset.heroLayer));
}

beforeEach(() => {
  vi.useFakeTimers();
  // jsdom has no matchMedia; motion is not reduced in this test.
  vi.stubGlobal(
    "matchMedia",
    vi.fn().mockImplementation((query: string) => ({
      matches: false,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }))
  );
});

afterEach(() => {
  cleanup();
  vi.useRealTimers();
  vi.unstubAllGlobals();
});

describe("HeroCycle", () => {
  it("keeps exactly one layer lit at every tick across eight cycles", () => {
    const { container } = render(<HeroCycle images={IMAGES} />);

    // Initial state: layer 0, alone.
    expect(litLayers(container)).toEqual([0]);

    for (let tick = 1; tick <= 8; tick++) {
      act(() => {
        vi.advanceTimersByTime(CYCLE);
      });
      const lit = litLayers(container);
      expect(lit, `tick ${tick}: exactly one layer lit`).toHaveLength(1);
      expect(lit[0], `tick ${tick}: index in range`).toBe(tick % IMAGES.length);
    }
  });

  it("never lets the index run past images.length", () => {
    const { container } = render(<HeroCycle images={IMAGES} />);
    act(() => {
      vi.advanceTimersByTime(CYCLE * 100);
    });
    const lit = litLayers(container);
    expect(lit).toHaveLength(1);
    expect(lit[0]).toBeGreaterThanOrEqual(0);
    expect(lit[0]).toBeLessThan(IMAGES.length);
  });

  it("clears its interval on unmount (no orphan timers)", () => {
    const clearSpy = vi.spyOn(global, "clearInterval");
    const { unmount } = render(<HeroCycle images={IMAGES} />);
    unmount();
    expect(clearSpy).toHaveBeenCalled();
  });

  it("stays on layer 0 with no timers under reduced motion", () => {
    (matchMedia as ReturnType<typeof vi.fn>).mockImplementation((query: string) => ({
      matches: true,
      media: query,
      addEventListener: vi.fn(),
      removeEventListener: vi.fn(),
    }));
    const { container } = render(<HeroCycle images={IMAGES} />);
    act(() => {
      vi.advanceTimersByTime(CYCLE * 4);
    });
    expect(litLayers(container)).toEqual([0]);
  });
});
