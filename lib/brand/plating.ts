import sharp from "sharp";

/* Plating detection (FIX-02 §2.1, generalising FIX-01 §3.2):
   if a mark uses the background colour as an ink — white counters
   inside coloured fields, white rings inside colour — keying the white
   hollows it out, so dark surfaces need a plate.

   The discriminator is not "enclosed white exists" (every letterform
   counter is enclosed white, and Genesis keys cleanly despite them);
   it is "enclosed white bounded by CHROMATIC colour". A counter inside
   a black letter reads as ground and may key; a white ring inside a
   red target reads as figure and must be plated.
   Proven cases: El Mara, Tourism Fund, Jitume plate; Genesis doesn't. */

const SIZE = 192; // analysis resolution
const WHITE = 228; // near-white floor per channel
const CHROMA = 36; // max-min channel spread that counts as "coloured"

export async function detectPlatingNeed(image: Buffer): Promise<{
  plate: boolean;
  enclosedWhiteRatio: number;
  chromaticBoundaryShare: number;
}> {
  let data: Buffer, info: { width: number; height: number; channels: number };
  try {
    const result = await sharp(image)
      .resize({ width: SIZE, height: SIZE, fit: "inside" })
      .ensureAlpha()
      .raw()
      .toBuffer({ resolveWithObject: true });
    data = result.data;
    info = result.info as never;
  } catch {
    return { plate: false, enclosedWhiteRatio: 0, chromaticBoundaryShare: 0 };
  }

  const { width, height } = info;
  const px = (i: number) => {
    const o = i * 4;
    return { r: data[o], g: data[o + 1], b: data[o + 2], a: data[o + 3] };
  };
  const isBackgroundish = (i: number) => {
    const { r, g, b, a } = px(i);
    if (a < 60) return true; // transparent = background
    return r >= WHITE && g >= WHITE && b >= WHITE; // near-white
  };
  const isWhiteOpaque = (i: number) => {
    const { r, g, b, a } = px(i);
    return a >= 200 && r >= WHITE && g >= WHITE && b >= WHITE;
  };

  // 1. Flood from the border across background-ish pixels.
  const visited = new Uint8Array(width * height);
  const queue: number[] = [];
  for (let x = 0; x < width; x++) queue.push(x, (height - 1) * width + x);
  for (let y = 0; y < height; y++) queue.push(y * width, y * width + width - 1);
  while (queue.length) {
    const i = queue.pop()!;
    if (visited[i] || !isBackgroundish(i)) continue;
    visited[i] = 1;
    const x = i % width;
    const y = (i - x) / width;
    if (x > 0) queue.push(i - 1);
    if (x < width - 1) queue.push(i + 1);
    if (y > 0) queue.push(i - width);
    if (y < height - 1) queue.push(i + width);
  }

  // 2. Enclosed white = opaque near-white not reached from the border.
  //    Classify the ink around it: chromatic vs dark/neutral.
  let enclosed = 0;
  let chromaticBoundary = 0;
  let totalBoundary = 0;
  const neighbours = [-1, 1, -width, width];
  for (let i = 0; i < width * height; i++) {
    if (!isWhiteOpaque(i) || visited[i]) continue;
    enclosed++;
    for (const d of neighbours) {
      const j = i + d;
      if (j < 0 || j >= width * height) continue;
      if (isBackgroundish(j) || isWhiteOpaque(j)) continue;
      const { r, g, b, a } = px(j);
      if (a < 60) continue;
      totalBoundary++;
      if (Math.max(r, g, b) - Math.min(r, g, b) >= CHROMA) chromaticBoundary++;
    }
  }

  const enclosedWhiteRatio = enclosed / (width * height);
  const chromaticBoundaryShare = totalBoundary
    ? chromaticBoundary / totalBoundary
    : 0;

  return {
    // Enough enclosed white, and mostly bounded by colour: white is ink.
    plate: enclosedWhiteRatio >= 0.0008 && chromaticBoundaryShare >= 0.35,
    enclosedWhiteRatio,
    chromaticBoundaryShare,
  };
}
