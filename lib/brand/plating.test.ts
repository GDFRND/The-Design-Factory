import { readFile } from "node:fs/promises";
import path from "node:path";
import { describe, expect, it } from "vitest";
import { detectPlatingNeed } from "./plating";

/* FIX-02 §2.1 — the three independent confirmations of the plating
   rule, plus the counter-example. If a mark uses the background colour
   as an ink, detect it on upload and plate rather than key. */

const asset = (p: string) => readFile(path.join(process.cwd(), "public", p));

describe("detectPlatingNeed", () => {
  it("plates the Tourism Fund (white counters in the TF brushmark)", async () => {
    const r = await detectPlatingNeed(await asset("brand/partners/tourism-fund.png"));
    expect(r.plate).toBe(true);
  });

  it("plates Jitume (white target ring and hand outline inside colour)", async () => {
    const r = await detectPlatingNeed(
      await asset("brand/partners/digital-media-factory.png")
    );
    expect(r.plate).toBe(true);
  });

  it("plates El Mara (white pattern detail inside colour blocks)", async () => {
    const r = await detectPlatingNeed(await asset("brand/el-mara/logo-el-mara.png"));
    expect(r.plate).toBe(true);
  });

  it("does not plate Genesis (solid wordmark — counters are ground, not ink)", async () => {
    const r = await detectPlatingNeed(await asset("brand/partners/genesis.png"));
    expect(r.plate).toBe(false);
  });

  it("returns safely on non-image input", async () => {
    const r = await detectPlatingNeed(Buffer.from("not an image"));
    expect(r.plate).toBe(false);
  });
});
