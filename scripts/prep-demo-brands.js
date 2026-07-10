// Demo brand asset intake (TDF-06 §4).
// The supplied logos are RGB with the white background baked in — on
// Graphite chrome they'd render as white rectangles. This script:
//   1. keys near-white to transparency (soft threshold on low-saturation
//      pixels) and exports logo-{slug}.png at 2048px with alpha
//   2. produces a reversed silhouette variant for dark surfaces
//      (Paper for Rhino Fort / The Regent; cream for El Mara — replace
//      with the sheet-native reversed lockups when extracted)
//   3. copies each _Details brand sheet as details.png
// Usage: node scripts/prep-demo-brands.js <source-dir>
const sharp = require("sharp");
const fs = require("node:fs/promises");
const path = require("node:path");

const SRC = process.argv[2];
if (!SRC) {
  console.error("usage: node scripts/prep-demo-brands.js <source-dir>");
  process.exit(1);
}

const BRANDS = [
  { slug: "rhino-fort", logo: "Logo 2.png", details: "Logo 2 Details.png", reverse: [250, 250, 249] },
  { slug: "the-regent", logo: "Logo 3.png", details: "Logo 3 Details.png", reverse: [250, 250, 249] },
  { slug: "el-mara", logo: "Logo 4.png", details: "Logo 4 Details.png", reverse: [233, 214, 193] },
];

function keyWhite(data) {
  // data: RGBA buffer. Near-white, low-saturation pixels fade out.
  for (let i = 0; i < data.length; i += 4) {
    const r = data[i], g = data[i + 1], b = data[i + 2];
    const max = Math.max(r, g, b);
    const min = Math.min(r, g, b);
    const sat = max - min;
    if (sat < 28 && min > 225) {
      // 225→255 maps to alpha 255→0 (soft edge)
      const t = Math.min(1, (min - 225) / 30);
      data[i + 3] = Math.round(255 * (1 - t));
    }
  }
  return data;
}

function silhouette(data, [tr, tg, tb]) {
  for (let i = 0; i < data.length; i += 4) {
    if (data[i + 3] > 0) {
      data[i] = tr;
      data[i + 1] = tg;
      data[i + 2] = tb;
    }
  }
  return data;
}

async function run() {
  for (const brand of BRANDS) {
    const outDir = path.join(process.cwd(), "public", "demo", brand.slug);
    await fs.mkdir(outDir, { recursive: true });

    const resized = sharp(path.join(SRC, brand.logo))
      .resize({ width: 2048 })
      .ensureAlpha();
    const { data, info } = await resized
      .raw()
      .toBuffer({ resolveWithObject: true });

    const keyed = keyWhite(Buffer.from(data));
    await sharp(keyed, {
      raw: { width: info.width, height: info.height, channels: 4 },
    })
      .png()
      .toFile(path.join(outDir, `logo-${brand.slug}.png`));

    const rev = silhouette(Buffer.from(keyed), brand.reverse);
    await sharp(rev, {
      raw: { width: info.width, height: info.height, channels: 4 },
    })
      .png()
      .toFile(path.join(outDir, `logo-${brand.slug}-reversed.png`));

    await sharp(path.join(SRC, brand.details))
      .resize({ width: 1600, withoutEnlargement: true })
      .png()
      .toFile(path.join(outDir, "details.png"));

    console.log(`prepared ${brand.slug}`);
  }
}

run().catch((e) => {
  console.error(e);
  process.exit(1);
});
