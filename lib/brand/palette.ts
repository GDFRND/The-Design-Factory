import { PNG } from "pngjs";

/* Provisional palette inference (BRIEF §4.8): sample a PNG logo's
   dominant opaque colours. Coarse 32-step quantisation is plenty for a
   provisional system the hotel will confirm or change. */

export function inferPaletteFromPng(buffer: Buffer, maxSwatches = 4): string[] {
  let png: PNG;
  try {
    png = PNG.sync.read(buffer);
  } catch {
    return [];
  }

  const counts = new Map<string, { n: number; r: number; g: number; b: number }>();
  const step = Math.max(1, Math.floor((png.width * png.height) / 40_000));

  for (let i = 0; i < png.width * png.height; i += step) {
    const o = i * 4;
    const a = png.data[o + 3];
    if (a < 200) continue; // ignore transparent / anti-aliased edges
    const r = png.data[o], g = png.data[o + 1], b = png.data[o + 2];
    const bucket = `${r >> 5}-${g >> 5}-${b >> 5}`;
    const entry = counts.get(bucket) ?? { n: 0, r: 0, g: 0, b: 0 };
    entry.n++;
    entry.r += r;
    entry.g += g;
    entry.b += b;
    counts.set(bucket, entry);
  }

  const hex = (v: number) => Math.round(v).toString(16).padStart(2, "0");

  return [...counts.values()]
    .sort((a, b) => b.n - a.n)
    .slice(0, maxSwatches)
    .map(
      (e) =>
        `#${hex(e.r / e.n)}${hex(e.g / e.n)}${hex(e.b / e.n)}`.toUpperCase()
    );
}
