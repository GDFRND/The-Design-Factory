"use client";

import * as React from "react";

/* Six-digit verification input. Auto-advances, handles paste and
   backspace, and exposes the combined value via a hidden input so it
   posts with the surrounding form. */
export function CodeInput({ name = "code" }: { name?: string }) {
  const [digits, setDigits] = React.useState<string[]>(Array(6).fill(""));
  const refs = React.useRef<(HTMLInputElement | null)[]>([]);

  function setDigit(i: number, v: string) {
    setDigits((d) => {
      const next = [...d];
      next[i] = v;
      return next;
    });
  }

  function onChange(i: number, value: string) {
    const v = value.replace(/\D/g, "");
    if (!v) {
      setDigit(i, "");
      return;
    }
    if (v.length > 1) {
      // Paste path
      const chars = v.slice(0, 6 - i).split("");
      setDigits((d) => {
        const next = [...d];
        chars.forEach((c, j) => (next[i + j] = c));
        return next;
      });
      refs.current[Math.min(i + chars.length, 5)]?.focus();
      return;
    }
    setDigit(i, v);
    refs.current[i + 1]?.focus();
  }

  function onKeyDown(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !digits[i] && i > 0) {
      refs.current[i - 1]?.focus();
      setDigit(i - 1, "");
    }
    if (e.key === "ArrowLeft") refs.current[i - 1]?.focus();
    if (e.key === "ArrowRight") refs.current[i + 1]?.focus();
  }

  return (
    <div className="flex items-center gap-2">
      {digits.map((d, i) => (
        <input
          key={i}
          ref={(el) => {
            refs.current[i] = el;
          }}
          inputMode="numeric"
          autoComplete={i === 0 ? "one-time-code" : "off"}
          aria-label={`Digit ${i + 1} of 6`}
          className="h-12 w-10 rounded-input border border-line bg-raised text-center text-lg font-medium text-foreground transition-colors duration-180 ease-tdf"
          value={d}
          onChange={(e) => onChange(i, e.target.value)}
          onKeyDown={(e) => onKeyDown(i, e)}
        />
      ))}
      <input type="hidden" name={name} value={digits.join("")} />
    </div>
  );
}
