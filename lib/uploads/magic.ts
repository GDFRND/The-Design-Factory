/* Magic-byte sniffing (BRIEF §9): uploads are validated by content,
   never by extension. */

export type SniffedType = {
  mime: string;
  ext: string;
  category: "image" | "pdf" | "font";
};

export function sniff(buffer: Buffer): SniffedType | null {
  if (buffer.length < 12) return null;

  // PNG
  if (buffer.subarray(0, 4).equals(Buffer.from([0x89, 0x50, 0x4e, 0x47]))) {
    return { mime: "image/png", ext: "png", category: "image" };
  }
  // JPEG
  if (buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff) {
    return { mime: "image/jpeg", ext: "jpg", category: "image" };
  }
  // WebP: RIFF....WEBP
  if (
    buffer.subarray(0, 4).toString("ascii") === "RIFF" &&
    buffer.subarray(8, 12).toString("ascii") === "WEBP"
  ) {
    return { mime: "image/webp", ext: "webp", category: "image" };
  }
  // PDF
  if (buffer.subarray(0, 5).toString("ascii") === "%PDF-") {
    return { mime: "application/pdf", ext: "pdf", category: "pdf" };
  }
  // Fonts
  const four = buffer.subarray(0, 4);
  if (four.equals(Buffer.from([0x00, 0x01, 0x00, 0x00]))) {
    return { mime: "font/ttf", ext: "ttf", category: "font" };
  }
  if (four.toString("ascii") === "OTTO") {
    return { mime: "font/otf", ext: "otf", category: "font" };
  }
  if (four.toString("ascii") === "wOFF") {
    return { mime: "font/woff", ext: "woff", category: "font" };
  }
  if (four.toString("ascii") === "wOF2") {
    return { mime: "font/woff2", ext: "woff2", category: "font" };
  }
  return null;
}

export const MAX_UPLOAD_BYTES = 15 * 1024 * 1024;

/** Which sniffed categories each BrandAsset kind accepts. */
export function allowedCategories(kind: string): SniffedType["category"][] {
  switch (kind) {
    case "FONT":
      return ["font"];
    case "GUIDELINES":
    case "BROCHURE":
    case "MENU":
      return ["pdf", "image"];
    default:
      return ["image", "pdf"];
  }
}
