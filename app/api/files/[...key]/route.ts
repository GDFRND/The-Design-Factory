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

  const type = sniff(data)?.mime ?? "application/octet-stream";
  return new NextResponse(new Uint8Array(data), {
    headers: {
      "Content-Type": type,
      "Cache-Control": "private, max-age=3600",
    },
  });
}
