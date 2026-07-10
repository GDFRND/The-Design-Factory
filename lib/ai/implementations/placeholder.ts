import "server-only";
import sharp from "sharp";
import type { BrandDossier } from "@/lib/ai/dossier";
import type { ExpandedPrompt } from "@/lib/ai/expanded-prompt";
import { parseDimensions, type ImageEngine } from "@/lib/ai/image-engine";

/* Offline engine: renders a clean, brand-coloured layout sketch so the
   whole flow works end-to-end without provider keys (local dev, demo
   workspaces). Clearly a comp, not a photograph. */

const FALLBACK_PALETTE = ["#0D3B2E", "#C8A96A", "#FAFAF9", "#1A1A1A"];

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

function wrap(text: string, max: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = "";
  for (const w of words) {
    if ((line + " " + w).trim().length > max) {
      if (line) lines.push(line);
      line = w;
    } else {
      line = (line + " " + w).trim();
    }
  }
  if (line) lines.push(line);
  return lines.slice(0, 3);
}

function paletteFromDossier(brand: BrandDossier): string[] {
  const hexes = brand.markdown.match(/#[0-9a-fA-F]{6}/g);
  return hexes && hexes.length >= 2 ? hexes.slice(0, 4) : FALLBACK_PALETTE;
}

function renderSvg(
  p: ExpandedPrompt,
  brand: BrandDossier,
  seed: number,
  note?: string
): string {
  const { width, height } = parseDimensions(p.outputFormat);
  const palette = paletteFromDossier(brand);
  const bg = palette[seed % palette.length];
  const accent = palette[(seed + 1) % palette.length];
  const headlineLines = wrap(p.keyMessage || p.assetType, 20);
  const fs = Math.round(width / 14);
  const price = p.offerDetails.price ?? "";

  return `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}" viewBox="0 0 ${width} ${height}">
  <rect width="${width}" height="${height}" fill="${bg}"/>
  <rect x="0" y="${height * 0.62}" width="${width}" height="${height * 0.38}" fill="rgba(0,0,0,0.35)"/>
  <circle cx="${width * (0.72 + (seed % 3) * 0.06)}" cy="${height * 0.3}" r="${width * 0.18}" fill="${accent}" opacity="0.5"/>
  ${headlineLines
    .map(
      (line, i) =>
        `<text x="${width * 0.08}" y="${height * 0.7 + i * fs * 1.1}" font-family="Georgia, serif" font-size="${fs}" fill="#FAFAF9">${esc(line)}</text>`
    )
    .join("\n  ")}
  ${price
    ? `<text x="${width * 0.08}" y="${height * 0.7 + headlineLines.length * fs * 1.1 + fs * 0.9}" font-family="Georgia, serif" font-size="${Math.round(fs * 0.8)}" fill="${accent}">${esc(price)}</text>`
    : ""}
  <rect x="${width * 0.08}" y="${height * 0.9}" rx="${fs * 0.55}" width="${Math.min(width * 0.5, (p.callToAction.length || 10) * fs * 0.32 + fs)}" height="${fs * 1.1}" fill="#FAFAF9"/>
  <text x="${width * 0.08 + fs * 0.5}" y="${height * 0.9 + fs * 0.78}" font-family="Helvetica, Arial, sans-serif" font-size="${Math.round(fs * 0.42)}" fill="#111111">${esc(p.callToAction || "Book now")}</text>
  <text x="${width * 0.08}" y="${height * 0.08}" font-family="Helvetica, Arial, sans-serif" font-size="${Math.round(fs * 0.38)}" letter-spacing="4" fill="#FAFAF9">${esc(brand.hotelName.toUpperCase())}</text>
  ${note ? `<text x="${width * 0.08}" y="${height * 0.12}" font-family="Helvetica, Arial, sans-serif" font-size="${Math.round(fs * 0.3)}" fill="#FAFAF9" opacity="0.7">${esc(note)}</text>` : ""}
  <text x="${width - width * 0.08}" y="${height * 0.06}" text-anchor="end" font-family="Helvetica, Arial, sans-serif" font-size="${Math.round(fs * 0.28)}" letter-spacing="3" fill="#FAFAF9" opacity="0.6">LAYOUT COMP</text>
</svg>`;
}

export class PlaceholderEngine implements ImageEngine {
  async generate(
    p: ExpandedPrompt,
    brand: BrandDossier,
    n: number
  ): Promise<Buffer[]> {
    return Promise.all(
      Array.from({ length: n }, (_, i) =>
        sharp(Buffer.from(renderSvg(p, brand, i))).png().toBuffer()
      )
    );
  }

  async refine(
    base: Buffer,
    instruction: string,
    brand: BrandDossier
  ): Promise<Buffer[]> {
    // A comp can't truly be edited — annotate it with the instruction
    // so the loop is honest about what happened.
    const meta = await sharp(base).metadata();
    const width = meta.width ?? 1080;
    const badge = `<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="60">
      <rect width="${width}" height="60" fill="rgba(0,0,0,0.6)"/>
      <text x="20" y="38" font-family="Helvetica, Arial, sans-serif" font-size="22" fill="#FAFAF9">Refined: ${esc(instruction.slice(0, 70))}</text>
    </svg>`;
    const out = await sharp(base)
      .composite([{ input: Buffer.from(badge), gravity: "north" }])
      .png()
      .toBuffer();
    void brand;
    return [out];
  }
}
