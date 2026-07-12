import "server-only";
import { createHmac } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";

/* Asset storage, three backends in precedence order:
   1. Supabase Storage — when SUPABASE_URL + SUPABASE_SERVICE_ROLE_KEY are
      set (the deployed default; a private bucket, browser gets short-lived
      signed URLs).
   2. Vercel Blob — when BLOB_READ_WRITE_TOKEN is set.
   3. Local .uploads/ — dev fallback, served from /api/files/<key> behind
      an HMAC-signed, expiring URL.
   Either way the browser only ever sees signed URLs. */

const LOCAL_ROOT = path.join(process.cwd(), ".uploads");
const BUCKET = process.env.SUPABASE_STORAGE_BUCKET ?? "assets";
const SIGNED_TTL_SECONDS = 60 * 60;

function useSupabase() {
  return Boolean(process.env.SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY);
}

// Lazily constructed so the SDK never loads in the local/Blob paths.
let _sb: import("@supabase/supabase-js").SupabaseClient | null = null;
async function supabase() {
  if (!_sb) {
    const { createClient } = await import("@supabase/supabase-js");
    _sb = createClient(
      process.env.SUPABASE_URL!,
      process.env.SUPABASE_SERVICE_ROLE_KEY!,
      { auth: { persistSession: false } }
    );
  }
  return _sb;
}

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
  if (useSupabase()) {
    const sb = await supabase();
    const { error } = await sb.storage.from(BUCKET).upload(key, data, {
      contentType,
      upsert: true,
    });
    if (error) throw new Error(`storage upload failed: ${error.message}`);
    return;
  }
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
  if (useSupabase()) {
    const sb = await supabase();
    const { data, error } = await sb.storage.from(BUCKET).download(key);
    if (error || !data) throw new Error(`storage read failed: ${error?.message}`);
    return Buffer.from(await data.arrayBuffer());
  }
  const file = path.join(LOCAL_ROOT, key);
  const resolved = path.resolve(file);
  if (!resolved.startsWith(path.resolve(LOCAL_ROOT))) {
    throw new Error("invalid key");
  }
  return readFile(resolved);
}

/** Signed URL for the browser, valid for one hour. */
export async function getSignedUrl(key: string): Promise<string> {
  if (useSupabase()) {
    const sb = await supabase();
    const { data, error } = await sb.storage
      .from(BUCKET)
      .createSignedUrl(key, SIGNED_TTL_SECONDS);
    if (error || !data) throw new Error(`sign failed: ${error?.message}`);
    return data.signedUrl;
  }
  if (process.env.BLOB_READ_WRITE_TOKEN) {
    const { head } = await import("@vercel/blob");
    const meta = await head(key).catch(() => null);
    if (meta) return meta.url;
  }
  const expiresAt = Date.now() + SIGNED_TTL_SECONDS * 1000;
  const sig = signKey(key, expiresAt);
  return `/api/files/${key}?e=${expiresAt}&s=${sig}`;
}
