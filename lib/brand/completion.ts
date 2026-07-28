/* Brand completion score (BRIEF §4.8).
   One pure function — every screen that shows a percentage calls this,
   so the number can never disagree with itself. Copy is instructional,
   never nagging. */

export type CompletionInput = {
  assetKinds: string[]; // BrandAssetKind values present in the workspace
  profile: {
    location?: string | null;
    roomCategories?: string[];
    restaurant?: string | null;
    buffet?: string | null;
    targetCustomers?: string[];
    sellingPoints?: string[];
    contact?: string | null;
    bookingUrl?: string | null;
    socials?: unknown;
  } | null;
  workspace: {
    county?: string | null;
    propertyType?: string | null;
  } | null;
  brandSystem: {
    provisional?: boolean;
    palette?: unknown;
    typography?: unknown;
  } | null;
};

export type CompletionMissing = { label: string; weight: number; cta: string };

export type CompletionResult = { percent: number; missing: CompletionMissing[] };

type Check = {
  label: string;
  weight: number;
  cta: string;
  done: (i: CompletionInput) => boolean;
};

const has = (v: string | null | undefined) => Boolean(v && v.trim().length > 0);
const some = (v: string[] | undefined) => Boolean(v && v.length > 0);

const CHECKS: Check[] = [
  {
    label: "Logo",
    weight: 15,
    cta: "Upload your logo so every asset carries your mark.",
    done: (i) => i.assetKinds.includes("LOGO"),
  },
  {
    label: "Hotel basics",
    weight: 10,
    cta: "Tell us where you are and what kind of property you run.",
    done: (i) =>
      has(i.profile?.location) ||
      (has(i.workspace?.county) && has(i.workspace?.propertyType)),
  },
  {
    label: "Room types",
    weight: 10,
    cta: "Add your room types so we can build better offers.",
    done: (i) => some(i.profile?.roomCategories),
  },
  {
    label: "Food & drink",
    weight: 5,
    cta: "Add your restaurant or buffet so food offers write themselves.",
    done: (i) => has(i.profile?.restaurant) || has(i.profile?.buffet),
  },
  {
    label: "Target guests",
    weight: 10,
    cta: "Tell us who you sell to: families, business travellers, groups.",
    done: (i) => some(i.profile?.targetCustomers),
  },
  {
    label: "Selling points",
    weight: 10,
    cta: "List what you're proud of so we can lead with it.",
    done: (i) => some(i.profile?.sellingPoints),
  },
  {
    label: "Photography",
    weight: 10,
    cta: "Upload photos of the property so we design with real imagery.",
    done: (i) =>
      i.assetKinds.includes("PHOTOGRAPHY") || i.assetKinds.includes("ROOM_IMAGE"),
  },
  {
    label: "Past marketing",
    weight: 10,
    cta: "Add an old poster or campaign so we can learn your habits.",
    done: (i) =>
      ["POSTER", "PAST_CAMPAIGN", "SOCIAL_SAMPLE", "BROCHURE"].some((k) =>
        i.assetKinds.includes(k)
      ),
  },
  {
    label: "Brand rules",
    weight: 10,
    cta: "Upload guidelines, or confirm the palette and type we propose.",
    done: (i) =>
      i.assetKinds.includes("GUIDELINES") ||
      Boolean(i.brandSystem?.palette && i.brandSystem?.typography),
  },
  {
    label: "Contact & booking",
    weight: 5,
    cta: "Add contact details so every asset ends with a way to book.",
    done: (i) =>
      has(i.profile?.contact) ||
      has(i.profile?.bookingUrl) ||
      Boolean(i.profile?.socials),
  },
  {
    label: "Confirmed system",
    weight: 5,
    cta: "Review the provisional system and confirm it as yours.",
    done: (i) => i.brandSystem?.provisional === false,
  },
];

export function computeCompletion(input: CompletionInput): CompletionResult {
  let percent = 0;
  const missing: CompletionMissing[] = [];
  for (const check of CHECKS) {
    if (check.done(input)) {
      percent += check.weight;
    } else {
      missing.push({ label: check.label, weight: check.weight, cta: check.cta });
    }
  }
  return { percent, missing };
}

/** Generation gate: at least a logo and the hotel basics (≥ 25%). */
export const GENERATION_THRESHOLD = 25;
