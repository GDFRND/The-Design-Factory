import { describe, expect, it } from "vitest";
import {
  computeCompletion,
  GENERATION_THRESHOLD,
  type CompletionInput,
} from "./completion";

const empty: CompletionInput = {
  assetKinds: [],
  profile: null,
  workspace: null,
  brandSystem: null,
};

function full(): CompletionInput {
  return {
    assetKinds: ["LOGO", "PHOTOGRAPHY", "POSTER", "GUIDELINES"],
    profile: {
      location: "Diani, Kwale County",
      roomCategories: ["Garden room", "Ocean suite"],
      restaurant: "Mvuvi Grill",
      buffet: "Weekend seafood buffet",
      targetCustomers: ["Families", "Domestic weekenders"],
      sellingPoints: ["Beachfront", "Award-winning kitchen"],
      contact: "+254 700 000000",
      bookingUrl: "https://example.com/book",
      socials: { instagram: "@dianibay" },
    },
    workspace: { county: "Kwale", propertyType: "Beach resort" },
    brandSystem: {
      provisional: false,
      palette: { primary: "#0A3D2E" },
      typography: { heading: "Playfair Display" },
    },
  };
}

describe("computeCompletion", () => {
  it("scores an empty workspace at 0 with every item missing", () => {
    const r = computeCompletion(empty);
    expect(r.percent).toBe(0);
    expect(r.missing.length).toBe(11);
  });

  it("scores a complete workspace at exactly 100", () => {
    const r = computeCompletion(full());
    expect(r.percent).toBe(100);
    expect(r.missing).toEqual([]);
  });

  it("weights sum to 100 (percent + missing weights is invariant)", () => {
    for (const input of [empty, full(), { ...empty, assetKinds: ["LOGO"] }]) {
      const r = computeCompletion(input as CompletionInput);
      const missingWeight = r.missing.reduce((s, m) => s + m.weight, 0);
      expect(r.percent + missingWeight).toBe(100);
    }
  });

  it("logo + hotel basics reaches the generation threshold", () => {
    const r = computeCompletion({
      ...empty,
      assetKinds: ["LOGO"],
      workspace: { county: "Narok", propertyType: "Tented camp" },
    });
    expect(r.percent).toBeGreaterThanOrEqual(GENERATION_THRESHOLD);
  });

  it("logo alone stays below the threshold", () => {
    const r = computeCompletion({ ...empty, assetKinds: ["LOGO"] });
    expect(r.percent).toBeLessThan(GENERATION_THRESHOLD);
  });

  it("accepts location as an alternative to county+type for basics", () => {
    const withLocation = computeCompletion({
      ...empty,
      profile: { location: "Nairobi CBD" },
    });
    const without = computeCompletion(empty);
    expect(withLocation.percent).toBe(without.percent + 10);
  });

  it("counts room images as photography", () => {
    const r = computeCompletion({ ...empty, assetKinds: ["ROOM_IMAGE"] });
    expect(r.missing.find((m) => m.label === "Photography")).toBeUndefined();
  });

  it("brand rules pass via guidelines OR confirmed palette+typography", () => {
    const viaGuidelines = computeCompletion({ ...empty, assetKinds: ["GUIDELINES"] });
    expect(viaGuidelines.missing.find((m) => m.label === "Brand rules")).toBeUndefined();

    const viaSystem = computeCompletion({
      ...empty,
      brandSystem: { provisional: true, palette: {}, typography: {} },
    });
    expect(viaSystem.missing.find((m) => m.label === "Brand rules")).toBeUndefined();

    const paletteOnly = computeCompletion({
      ...empty,
      brandSystem: { provisional: true, palette: {} },
    });
    expect(paletteOnly.missing.find((m) => m.label === "Brand rules")).toBeDefined();
  });

  it("provisional systems don't earn the confirmation weight", () => {
    const provisional = computeCompletion({
      ...empty,
      brandSystem: { provisional: true },
    });
    expect(
      provisional.missing.find((m) => m.label === "Confirmed system")
    ).toBeDefined();
  });

  it("every missing item carries an instructional CTA", () => {
    const r = computeCompletion(empty);
    for (const m of r.missing) {
      expect(m.cta.length).toBeGreaterThan(10);
      expect(m.weight).toBeGreaterThan(0);
    }
  });
});
