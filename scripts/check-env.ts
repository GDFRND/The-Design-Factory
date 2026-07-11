/* FIX-02 §6 Step 4 — validate .env.local without revealing anything.
   Prints prefix and length only, never the body of a value.
   Run: npx tsx scripts/check-env.ts */

import { config } from "dotenv";
import path from "node:path";

config({ path: path.join(process.cwd(), ".env.local") });
config({ path: path.join(process.cwd(), ".env") });

const REQUIRED = [
  "ANTHROPIC_API_KEY",
  "GOOGLE_IMAGE_API_KEY",
  "DATABASE_URL",
  "SESSION_SECRET",
  "APP_URL",
] as const;

let missing = 0;
for (const name of REQUIRED) {
  const value = process.env[name];
  if (!value || !value.trim()) {
    console.error(`✗ ${name} missing or empty`);
    missing++;
    continue;
  }
  const prefix = value.slice(0, Math.min(7, value.length));
  console.log(`✓ ${name} present (${prefix}…, ${value.length} chars)`);
}

if (missing) {
  console.error(`\n${missing} variable(s) need attention in .env.local.`);
  process.exit(1);
}
console.log("\nAll required variables present.");
