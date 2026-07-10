import { describe, expect, it } from "vitest";
import { extractJsonObject, parseExpandedPrompt } from "./parse";

const valid = {
  assetType: "Poster",
  outputKind: "IMAGE",
  targetAudience: "Nairobi families",
  marketingObjective: "Drive weekend buffet bookings",
  keyMessage: "Weekend seafood buffet at Mvuvi Grill",
  offerDetails: { price: "KES 2,800", inclusions: ["Buffet", "Kids' corner"] },
  toneOfVoice: "Warm, plain",
  visualDirection: "Natural light, long table by the water",
  suggestedLayout: "Headline top, offer block bottom-left",
  brandApplication: "Deep green headline, sand background",
  callToAction: "Book on WhatsApp",
  outputFormat: "1080×1350 · IG feed",
  missingDetails: ["Confirm children's price"],
};

describe("extractJsonObject", () => {
  it("returns bare JSON untouched", () => {
    expect(extractJsonObject('{"a":1}')).toBe('{"a":1}');
  });

  it("strips ```json fences", () => {
    const raw = "```json\n" + JSON.stringify(valid) + "\n```";
    expect(extractJsonObject(raw)).toBe(JSON.stringify(valid));
  });

  it("strips bare ``` fences", () => {
    expect(extractJsonObject("```\n{\"a\":1}\n```")).toBe('{"a":1}');
  });

  it("isolates JSON wrapped in prose", () => {
    const raw = `Here is the plan you asked for:\n${JSON.stringify(valid)}\nLet me know.`;
    expect(extractJsonObject(raw)).toBe(JSON.stringify(valid));
  });

  it("returns null when no object exists", () => {
    expect(extractJsonObject("no json here")).toBeNull();
    expect(extractJsonObject("")).toBeNull();
    expect(extractJsonObject("} backwards {")).toBeNull();
  });
});

describe("parseExpandedPrompt", () => {
  it("parses a clean response", () => {
    const r = parseExpandedPrompt(JSON.stringify(valid));
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.assetType).toBe("Poster");
      expect(r.data.offerDetails.price).toBe("KES 2,800");
    }
  });

  it("parses a fenced, prose-wrapped response", () => {
    const raw = "Sure — here it is:\n```json\n" + JSON.stringify(valid) + "\n```";
    expect(parseExpandedPrompt(raw).ok).toBe(true);
  });

  it("fails on malformed JSON with a useful error", () => {
    const r = parseExpandedPrompt('{"assetType": "Poster", "outputKind": }');
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/Invalid JSON/);
  });

  it("fails on schema violations (bad outputKind)", () => {
    const r = parseExpandedPrompt(
      JSON.stringify({ ...valid, outputKind: "VIDEO" })
    );
    expect(r.ok).toBe(false);
    if (!r.ok) expect(r.error).toMatch(/outputKind/);
  });

  it("fills defaults for omitted optional fields", () => {
    const r = parseExpandedPrompt(
      JSON.stringify({ outputKind: "COMPOSITE", assetType: "Brochure" })
    );
    expect(r.ok).toBe(true);
    if (r.ok) {
      expect(r.data.missingDetails).toEqual([]);
      expect(r.data.offerDetails).toEqual({});
      expect(r.data.keyMessage).toBe("");
    }
  });

  it("drops visualDirection on TEXT output", () => {
    const r = parseExpandedPrompt(
      JSON.stringify({
        ...valid,
        outputKind: "TEXT",
        visualDirection: "should not survive",
      })
    );
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.visualDirection).toBeUndefined();
  });

  it("keeps visualDirection on IMAGE output", () => {
    const r = parseExpandedPrompt(JSON.stringify(valid));
    expect(r.ok).toBe(true);
    if (r.ok) expect(r.data.visualDirection).toContain("Natural light");
  });

  it("rejects empty input", () => {
    expect(parseExpandedPrompt("").ok).toBe(false);
  });
});
