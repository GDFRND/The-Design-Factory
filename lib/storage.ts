import "server-only";
import { createHmac } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/* Asset storage. Vercel Blob when BLOB_READ_WRITE_TOKEN is set;
   otherwise files land in .uploads/ (gitignored) and are served from
   /api/files/<key> behind an HMAC-signed, expiring URL. Either way the
   browser only ever sees signed URLs. */

const LOCAL_ROOT = path.join(process.cwd(), ".uploads");

function secret() {
  return process.env.SESSION_SECRET ?? "dev-secret";
}

export function signKey(key: string, expiresAt: number) {
  return createHmac("sha256", secret()).update(`${key}:${expiresAt}`).digest("hex");
}

export function verifySignature(key: string, expiresAt: number, sig: string) {
  if (Number.isNaN(expiresAt) || expiresAt < Date.now()) return false;
  return signKey(key, expiresAt) === sig;
}

export async function putObject(
  key: string,
  data: Buffer,
  contentType: string
): Promise<void> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { put } = await import("@vercel/blob");
    await put(key, data, {
      access: "public",
      contentType,
      addRandomSuffix: false,
    });
    return;
  }
  const file = path.join(LOCAL_ROOT, key);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, data);
}

export async function readObject(key: string): Promise<Buffer> {
  const file = path.join(LOCAL_ROOT, key);
  const resolved = path.resolve(file);
  if (!resolved.startsWith(path.resolve(LOCAL_ROOT))) {
    throw new Error("invalid key");
  }
  return readFile(resolved);
}

/** Signed URL for the browser, valid for one hour. */
export async function getSignedUrl(key: string): Promise<string> {
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { head } = await import("@vercel/blob");
    const meta = await head(key).catch(() => null);
    if (meta) return meta.url;
  }
  const expiresAt = Date.now() + 60 * 60 * 1000;
  const sig = signKey(key, expiresAt);
  return `/api/files/${key}?e=${expiresAt}&s=${sig}`;
}
