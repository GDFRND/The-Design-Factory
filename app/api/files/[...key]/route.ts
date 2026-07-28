import { NextResponse } from "next/server";
import { readObject, verifySignature } from "@/lib/storage";
import { sniff } from "@/lib/uploads/magic";

/* Serves locally stored uploads behind HMAC-signed, expiring URLs
   (dev / self-hosted path; Vercel Blob serves its own URLs in prod).
   An invalid or expired signature is a 404 — never a 403. */

export async function GET(
  request: Request,
  { params }: { params: Promise<{ key: string[] }> }
) {
  const { key: parts } = await params;
  const key = parts.join("/");
  const url = new URL(request.url);
  const expiresAt = Number(url.searchParams.get("e"));
  const sig = url.searchParams.get("s") ?? "";

  if (!verifySignature(key, expiresAt, sig)) {
    return new NextResponse(null, { status: 404 });
  }

  let data: Buffer;
  try {
    data = await readObject(key);
  } catch {
    return new NextResponse(null, { status: 404 });
  }

  // Prefer the key's extension (deterministic) and fall back to magic-byte
  // sniffing; without this a webp whose header is off by a byte would be
  // served as octet-stream and refuse to render in <img>.
  const EXT_MIME: Record<string, string> = {
    webp: "image/webp",
    png: "image/png",
    jpg: "image/jpeg",
    jpeg: "image/jpeg",
    gif: "image/gif",
    svg: "image/svg+xml",
    pdf: "application/pdf",
  };
  const ext = key.split(".").pop()?.toLowerCase() ?? "";
  const type = EXT_MIME[ext] ?? sniff(data)?.mime ?? "application/octet-stream";
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": type,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
