import { detectPlatingNeed } from "../lib/brand/plating";
import { readFile } from "node:fs/promises";
const cases: [string, string, boolean][] = [
  ["Tourism Fund", "public/brand/partners/tourism-fund.png", true],
  ["Jitume", "public/brand/partners/digital-media-factory.png", true],
  ["Genesis", "public/brand/partners/genesis.png", false],
  ["El Mara keyed", "public/brand/el-mara/logo-el-mara.png", true],
  ["Rhino Fort keyed", "public/brand/rhino-fort/logo-rhino-fort.png", false],
  ["The Regent keyed", "public/brand/the-regent/logo-the-regent.png", false],
];
let fail = 0;
for (const [label, file, expected] of cases) {
  const r = await detectPlatingNeed(await readFile(file));
  const ok = r.plate === expected ? "✓" : "✗";
  if (r.plate !== expected) fail++;
  console.log(`${ok} ${label}: plate=${r.plate} (expected ${expected}) enclosed=${r.enclosedWhiteRatio.toFixed(4)} chromaShare=${r.chromaticBoundaryShare.toFixed(2)}`);
}
process.exit(fail ? 1 : 0);
