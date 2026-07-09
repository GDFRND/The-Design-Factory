// Generates placeholder brand PNGs (transparent background) for The Design Factory.
// - tdf-mark-{graphite,paper,blueprint,dimensional}.png : factory silhouette
// - digital-media-factory{,-paper}.png                  : placeholder sibling mark
// - {tourism-fund,genesis}-paper.png                    : white knockout of supplied logos
const { PNG } = require("pngjs");
const fs = require("fs");
const path = require("path");

const OUT = process.argv[2];
const SIZE = 512;
const SS = 4; // supersampling factor

// Factory silhouette polygon (same geometry as the SVG draft)
const body = [
  [96, 432], [96, 208], [184, 152], [184, 208], [272, 152],
  [272, 208], [360, 152], [360, 208], [416, 172], [416, 432],
];
const chimney = { x0: 336, y0: 96, x1: 376, y1: 184 };

function inPoly(pts, x, y) {
  let inside = false;
  for (let i = 0, j = pts.length - 1; i < pts.length; j = i++) {
    const [xi, yi] = pts[i], [xj, yj] = pts[j];
    if (yi > y !== yj > y && x < ((xj - xi) * (y - yi)) / (yj - yi) + xi) inside = !inside;
  }
  return inside;
}

function factoryCoverage(px, py) {
  let hit = 0;
  for (let sy = 0; sy < SS; sy++)
    for (let sx = 0; sx < SS; sx++) {
      const x = px + (sx + 0.5) / SS, y = py + (sy + 0.5) / SS;
      if (
        inPoly(body, x, y) ||
        (x >= chimney.x0 && x < chimney.x1 && y >= chimney.y0 && y < chimney.y1)
      )
        hit++;
    }
  return hit / (SS * SS);
}

// DMF placeholder: three ascending bars + a dot (media/signal motif)
const dmfShapes = [
  { x0: 128, y0: 288, x1: 192, y1: 416 },
  { x0: 224, y0: 208, x1: 288, y1: 416 },
  { x0: 320, y0: 128, x1: 384, y1: 416 },
];
function dmfCoverage(px, py) {
  let hit = 0;
  for (let sy = 0; sy < SS; sy++)
    for (let sx = 0; sx < SS; sx++) {
      const x = px + (sx + 0.5) / SS, y = py + (sy + 0.5) / SS;
      if (dmfShapes.some((r) => x >= r.x0 && x < r.x1 && y >= r.y0 && y < r.y1)) hit++;
    }
  return hit / (SS * SS);
}

function render(name, coverageFn, colorFn) {
  const png = new PNG({ width: SIZE, height: SIZE });
  for (let y = 0; y < SIZE; y++)
    for (let x = 0; x < SIZE; x++) {
      const cov = coverageFn(x, y);
      const i = (y * SIZE + x) * 4;
      const [r, g, b] = colorFn(x, y);
      png.data[i] = r;
      png.data[i + 1] = g;
      png.data[i + 2] = b;
      png.data[i + 3] = Math.round(cov * 255);
    }
  fs.writeFileSync(path.join(OUT, name), PNG.sync.write(png));
  console.log("wrote", name);
}

const hex = (h) => [parseInt(h.slice(0, 2), 16), parseInt(h.slice(2, 4), 16), parseInt(h.slice(4, 6), 16)];
const GRAPHITE = hex("0D0F13"), PAPER = hex("FAFAF9"), BLUEPRINT = hex("1F3FD8"), BP_LT = hex("7C90F0");

render("tdf-mark-graphite.png", factoryCoverage, () => GRAPHITE);
render("tdf-mark-paper.png", factoryCoverage, () => PAPER);
render("tdf-mark-blueprint.png", factoryCoverage, () => BLUEPRINT);
render("tdf-mark-dimensional.png", factoryCoverage, (x, y) => {
  const t = (x + y) / (2 * SIZE);
  return BP_LT.map((c, i) => Math.round(c + (BLUEPRINT[i] - c) * t));
});
render("digital-media-factory.png", dmfCoverage, () => GRAPHITE);
render("digital-media-factory-paper.png", dmfCoverage, () => PAPER);

// White knockouts of supplied partner logos (keep alpha, set RGB to Paper)
for (const f of ["tourism-fund", "genesis"]) {
  const src = PNG.sync.read(fs.readFileSync(path.join(OUT, `${f}.png`)));
  for (let i = 0; i < src.data.length; i += 4) {
    src.data[i] = PAPER[0];
    src.data[i + 1] = PAPER[1];
    src.data[i + 2] = PAPER[2];
  }
  fs.writeFileSync(path.join(OUT, `${f}-paper.png`), PNG.sync.write(src));
  console.log("wrote", `${f}-paper.png`);
}
