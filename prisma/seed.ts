/* Demo seed (TDF-06 §4 — replaces BRIEF §6). Three real brands:
   Rhino Fort (IMAGE), The Regent (TEXT), El Mara (COMPOSITE).
   Workspaces are flagged isDemo. Idempotent: keyed on slugs and emails.

   Run: npx tsx --conditions react-server prisma/seed.ts
   Requires: node scripts/prep-demo-brands.js <source-dir> first
   (keys the supplied logos to alpha into public/demo/{slug}/). */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import argon2 from "argon2";
import { nanoid } from "nanoid";
import sharp from "sharp";
import { readFile } from "node:fs/promises";
import path from "node:path";
import { DEMO_BRANDS } from "@/lib/demo/brands";
import { appEnv } from "@/lib/env";
import { putObject } from "@/lib/storage";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const DEMO_ROOT = path.join(process.cwd(), "public", "demo");
const BRAND_ROOT = path.join(process.cwd(), "public", "brand");

/* Route demo assets through the app's storage layer, so the same seed
   populates .uploads/ locally and Supabase Storage in the cloud. */
async function putLocal(key: string, data: Buffer, contentType: string) {
  await putObject(key, data, contentType);
}

function esc(s: string) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/* Brand-palette layout comp for the seeded sample asset. */
function demoPoster(opts: {
  hotel: string;
  line: string;
  price: string;
  cta: string;
  bg: string;
  band: string;
  accent: string;
  ink: string;
}): string {
  const { hotel, line, price, cta, bg, band, accent, ink } = opts;
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350">
    <rect width="1080" height="1350" fill="${bg}"/>
    <circle cx="820" cy="330" r="240" fill="${accent}" opacity="0.35"/>
    <rect y="820" width="1080" height="530" fill="${band}"/>
    <text x="90" y="130" font-family="Helvetica, Arial" font-size="34" letter-spacing="7" fill="${ink}">${esc(hotel.toUpperCase())}</text>
    <text x="90" y="960" font-family="Georgia, serif" font-size="78" fill="${ink}">${esc(line)}</text>
    <text x="90" y="1060" font-family="Georgia, serif" font-size="54" fill="${accent}">${esc(price)}</text>
    <rect x="90" y="1150" rx="45" width="460" height="90" fill="${ink}"/>
    <text x="130" y="1208" font-family="Helvetica, Arial" font-size="34" fill="${bg}">${esc(cta)}</text>
  </svg>`;
}

type CopyBlocks = {
  headline: string;
  subhead: string;
  body: string;
  cta: string;
  sections: { heading: string; body: string }[];
};

type DemoBrand = {
  slug: string;
  hotelName: string;
  county: string;
  propertyType: string;
  roomCount: number;
  owner: { name: string; email: string };
  palette: Record<string, string>;
  swatches: string[];
  motifs: string[];
  typography: Record<string, string>;
  imageStyle: string;
  toneOfVoice: string;
  layoutApproach: string;
  campaignStyle: string;
  profile: Record<string, unknown>;
  generation: {
    assetType: string;
    outputKind: "IMAGE" | "TEXT" | "COMPOSITE";
    rawBrief: string;
    expanded: Record<string, unknown>;
    poster?: { line: string; price: string; cta: string; bg: string; band: string; accent: string; ink: string };
    copies?: CopyBlocks[];
    approvalPending?: boolean;
  };
};

const BRANDS: DemoBrand[] = [
  {
    slug: "rhino-fort",
    hotelName: "Rhino Fort Hotel",
    county: "Laikipia",
    propertyType: "Conservancy lodge",
    roomCount: 34,
    owner: { name: "Wanjiku Leteipa", email: "wanjiku@demo.thedesignfactory.local" },
    palette: {
      primary: "#4B3A2A",
      deep: "#2B2118",
      accent: "#B15A2B",
      secondary: "#6D6A4A",
      tint: "#C2A06B",
      surface: "#E6D5B3",
    },
    swatches: ["#4B3A2A", "#B15A2B", "#C2A06B", "#E6D5B3"],
    motifs: ["spear", "shield ellipse", "diamond", "chevron", "dot path", "arch"],
    typography: {
      display: "Heavy slab serif, condensed, hand-hewn terminals. Web substitute: Bitter 700 or Zilla Slab 700.",
      label: "Sans caps, 0.2em tracking",
    },
    imageStyle:
      "Warm, earthen, low sun. Dust, canvas, hide, brass, weathered stone. Long shadows, golden hour or blue hour. No cool tones, no glass, no chrome. Texture over polish.",
    toneOfVoice:
      "Grounded, plain, unhurried. Speaks about land, animals and welcome. Confident without boasting. Never uses the word luxury. Never uses exclamation marks.",
    layoutApproach:
      "Symmetrical, centred, emblem-led. Generous margins. Rules and diamonds as separators.",
    campaignStyle: "Strength · Heritage · Hospitality",
    profile: {
      location: "Laikipia Conservancy, Laikipia County",
      roomCategories: ["Fort Room", "Conservancy Suite", "Family Rondavel", "Ranger's Cottage"],
      restaurant: "The Boma, open-fire dining, single seating at 19:30",
      conference: "40-seat boardroom in the old stone stables",
      wellness: "Outdoor massage deck overlooking the waterhole",
      targetCustomers: ["International safari guests", "Conservation groups", "Domestic weekenders", "Small corporate retreats"],
      sellingPoints: ["Rhino sanctuary on site", "Ranger-led tracking at dawn", "Fire-lit dining", "Fifteen minutes from the airstrip"],
      seasonalOffers: ["Low-season conservancy rate, April–June"],
      contact: "+254 700 111222",
      bookingUrl: "https://example.com/rhino-fort",
    },
    generation: {
      assetType: "Poster",
      outputKind: "IMAGE",
      rawBrief:
        "A poster for our low-season conservancy rate, KES 18,000 per night full board, valid April to June. For domestic guests. Warm, grounded, not flashy. CTA: Reserve your season.",
      expanded: {
        assetType: "Poster",
        outputKind: "IMAGE",
        targetAudience: "Domestic guests planning a low-season safari",
        marketingObjective: "Fill April–June with resident bookings",
        keyMessage: "The conservancy, in its quiet season",
        offerDetails: { price: "KES 18,000 per night", validity: "April to June", inclusions: ["Full board"] },
        toneOfVoice: "Grounded, plain, unhurried",
        visualDirection: "Low sun, dust and canvas, long shadows. Emblem-led, centred.",
        suggestedLayout: "Centred emblem, headline, rate block, reserve line",
        brandApplication: "Earth brown ground, terracotta accent, bone type",
        callToAction: "Reserve your season",
        outputFormat: "1080×1350 · IG feed",
        missingDetails: [],
      },
      poster: {
        line: "The quiet season",
        price: "KES 18,000 per night",
        cta: "Reserve your season",
        bg: "#4B3A2A",
        band: "#2B2118",
        accent: "#B15A2B",
        ink: "#E6D5B3",
      },
    },
  },
  {
    slug: "the-regent",
    hotelName: "The Regent Hotel & Travel",
    county: "Nairobi",
    propertyType: "City hotel and travel desk",
    roomCount: 118,
    owner: { name: "Daniel Otieno", email: "daniel@demo.thedesignfactory.local" },
    palette: {
      primary: "#2B1B3D",
      deep: "#52307C",
      mid: "#7D5BA6",
      tint: "#B8A7D6",
      accent: "#D4AF37",
      surface: "#FFFFFF",
    },
    swatches: ["#2B1B3D", "#52307C", "#D4AF37", "#FFFFFF"],
    motifs: ["crown", "four-point star", "flow", "pillar", "gold hairline rule"],
    typography: {
      display: "Classical serif, small caps, wide tracking. Web substitute: Cormorant Garamond 300–400 or Marcellus.",
      label: "Sans caps, 0.24em tracking, gold",
    },
    imageStyle:
      "Low-key, nocturnal. Gold specular highlights on dark ground. Marble, silk, glass, brass. Controlled portrait lighting. Shallow depth of field. Never sunlit, never busy.",
    toneOfVoice:
      'Precise, composed, understated. Short declarative sentences. Never exclaims. Never uses the words amazing, unbeatable or deal. Says "rate", not "price".',
    layoutApproach: "Centred monogram, deep margins, gold hairline rules. Type does the work.",
    campaignStyle: "Regal · Refined · Remarkable · Every journey elevated",
    profile: {
      location: "Upper Hill, Nairobi",
      roomCategories: ["Regent Room", "Executive Suite", "Ambassador Suite", "Long-stay Residence"],
      restaurant: "Aurelia, modern European, à la carte",
      conference: "Four rooms, 12–220 delegates, in-house AV",
      wellness: "Spa, 24-hour gym, lap pool",
      targetCustomers: ["Business travellers", "MICE clients", "Travel trade", "Diplomatic and NGO accounts"],
      sellingPoints: ["Nine minutes from the CBD", "In-house travel desk", "Airport transfers included above three nights"],
      seasonalOffers: ["Corporate quarterly retreat package"],
      contact: "+254 700 333444",
      bookingUrl: "https://example.com/the-regent",
    },
    generation: {
      assetType: "Email sales letter",
      outputKind: "TEXT",
      rawBrief:
        "An email sales letter to travel agents introducing our corporate retreat package. Two nights, full board, one meeting room, KES 42,000 per delegate. Tone: composed, professional. CTA: Request the agent rate sheet.",
      expanded: {
        assetType: "Email sales letter",
        outputKind: "TEXT",
        targetAudience: "Travel agents booking corporate accounts",
        marketingObjective: "Place the retreat package on agent rate sheets",
        keyMessage: "A retreat that runs itself, nine minutes from the CBD",
        offerDetails: {
          price: "KES 42,000 per delegate",
          inclusions: ["Two nights", "Full board", "One meeting room"],
        },
        toneOfVoice: "Precise, composed, understated",
        suggestedLayout: "Subject, greeting, three short paragraphs, rate line, sign-off",
        brandApplication: "Aubergine and gold restraint; the type does the work",
        callToAction: "Request the agent rate sheet",
        outputFormat: "Email · plain and HTML",
        missingDetails: [],
      },
      copies: [
        {
          headline: "The corporate retreat, handled",
          subhead: "A note for your Q3 planning files",
          body:
            "The Regent introduces a corporate retreat package for your business accounts. Two nights, full board, one dedicated meeting room. KES 42,000 per delegate.\n\nYour clients keep their mornings. We hold the room from eight, break for lunch at one, and clear the boardroom before dinner at Aurelia. Airport transfers are included above three nights.\n\nThe rate holds for bookings confirmed this quarter.",
          cta: "Request the agent rate sheet",
          sections: [],
        },
        {
          headline: "Nine minutes from the CBD. Two days of quiet work.",
          subhead: "",
          body:
            "We have put together a retreat package your corporate accounts will find easy to approve. Two nights at The Regent, full board, one meeting room with in-house AV. KES 42,000 per delegate.\n\nThe travel desk arranges transfers and any onward bookings. One invoice, one contact.",
          cta: "Request the agent rate sheet",
          sections: [],
        },
      ],
    },
  },
  {
    slug: "el-mara",
    hotelName: "El Mara Hotels, Resorts & Camps",
    county: "Narok",
    propertyType: "Multi-property group",
    roomCount: 260,
    owner: { name: "Amani Kiptoo", email: "amani@demo.thedesignfactory.local" },
    palette: {
      primary: "#3A1A0A",
      accent: "#B80D1E",
      warm: "#F15A24",
      highlight: "#F7B500",
      secondary: "#5A8B3B",
      surface: "#E9D6C1",
    },
    swatches: ["#B80D1E", "#F15A24", "#F7B500", "#E9D6C1"],
    motifs: ["lion in profile", "Maasai pattern block", "chevron", "concentric sun", "dot rows", "cross-hatch"],
    typography: {
      display: "Connected brush script for the wordmark. Web substitute: Yellowtail.",
      support: "Bold geometric sans caps, wide tracking, colour-coded per word",
    },
    imageStyle:
      "High sun, saturated, joyful. Patterned textiles, flat geometric colour blocks, wildlife, movement, people. Bold and graphic rather than photographic-realist. Pattern is a first-class element.",
    toneOfVoice:
      "Warm, generous, energetic. Speaks to families and to the whole table. Uses a Swahili word where it earns its place (karibu, pamoja), never as decoration.",
    layoutApproach: "Horizontal lockup, pattern panel left, script right. Colour blocks carry hierarchy.",
    campaignStyle: "Kenya · camps, coast and city under one booking",
    profile: {
      location: "Group HQ Narok; properties across Narok, Kwale and Nairobi",
      roomCategories: ["Tented Camp", "Beach Cottage", "Family Villa", "City Room"],
      restaurant: "Saturday and Sunday family buffet, KES 3,500 per person, under-8s half price",
      conference: "Coastal conference wing, 300 delegates",
      wellness: "Spa at the coast property",
      targetCustomers: ["Kenyan families", "Domestic weekenders", "Regional groups", "Coastal holidaymakers"],
      sellingPoints: ["Camps, coast and city under one booking", "Family-first", "Kenyan-owned"],
      seasonalOffers: ["Weekend family buffet", "Easter coastal package", "Staycation rate"],
      contact: "+254 700 555666",
      bookingUrl: "https://example.com/el-mara",
    },
    generation: {
      assetType: "Restaurant or buffet promotion",
      outputKind: "COMPOSITE",
      rawBrief:
        "A poster for our weekend family buffet. KES 2,500 per adult, children under 12 half price, every Saturday and Sunday from 12:30pm. Aimed at Nairobi families. We want bookings via WhatsApp.",
      expanded: {
        assetType: "Restaurant or buffet promotion",
        outputKind: "COMPOSITE",
        targetAudience: "Nairobi families planning the weekend",
        marketingObjective: "Fill the weekend buffet tables",
        keyMessage: "Karibu, the weekend table is set",
        offerDetails: {
          price: "KES 2,500 per adult",
          validity: "Every Saturday and Sunday from 12:30pm",
          terms: "Children under 12 half price",
        },
        toneOfVoice: "Warm, generous, energetic",
        visualDirection: "High sun, saturated colour blocks, pattern panel, the whole table",
        suggestedLayout: "Pattern panel left, script headline right, offer block, WhatsApp line",
        brandApplication: "Scarlet and sun-yellow blocks on cream; script for the headline",
        callToAction: "Book on WhatsApp",
        outputFormat: "1080×1350 · IG feed",
        missingDetails: [],
      },
      poster: {
        line: "The weekend table",
        price: "KES 2,500 per adult",
        cta: "Book on WhatsApp",
        bg: "#B80D1E",
        band: "#3A1A0A",
        accent: "#F7B500",
        ink: "#E9D6C1",
      },
      copies: [
        {
          headline: "Karibu, the weekend table is set",
          subhead: "Saturday and Sunday from 12:30pm",
          body:
            "The family buffet is back on the weekend. KES 2,500 per adult, children under twelve half price. Bring the whole table, there is room.\n\nPamoja is the point: one long lunch, everyone served, nobody cooking.",
          cta: "Book on WhatsApp",
          sections: [],
        },
        {
          headline: "Saturday is for the whole table",
          subhead: "Weekend family buffet · from 12:30pm",
          body:
            "KES 2,500 per adult. Under-12s half price. Every Saturday and Sunday from half past noon.\n\nSend one WhatsApp message and the table is yours.",
          cta: "Book on WhatsApp",
          sections: [],
        },
      ],
      approvalPending: true,
    },
  },
];

const OLD_DEMO_SLUGS = [
  "demo-mara-sable-camp",
  "demo-diani-baobab-resort",
  "demo-sable-house-nairobi",
];
const OLD_DEMO_EMAILS = [
  "naisula@demo.thedesignfactory.local",
  "hamisi@demo.thedesignfactory.local",
  "achieng@demo.thedesignfactory.local",
];

async function seedBrand(brand: DemoBrand, csaId: string) {
  // The owner login uses the documented FIX-04 §3.1 credentials, hashed
  // with argon2 like any real account and flagged isDemo. The demo
  // password is per-brand and lives in the shared registry.
  const demoLogin = DEMO_BRANDS.find((b) => b.slug === brand.slug);
  const ownerEmail = demoLogin?.email ?? brand.owner.email;
  const passwordHash = await argon2.hash(
    demoLogin?.password ?? "demo-password-2026",
    { type: argon2.argon2id }
  );

  const owner = await db.user.upsert({
    where: { email: ownerEmail },
    create: {
      email: ownerEmail,
      name: brand.owner.name,
      passwordHash,
      emailVerifiedAt: new Date(),
      isDemo: true,
    },
    update: { passwordHash, isDemo: true },
  });

  const workspace = await db.workspace.upsert({
    where: { slug: brand.slug },
    create: {
      slug: brand.slug,
      hotelName: brand.hotelName,
      county: brand.county,
      propertyType: brand.propertyType,
      roomCount: brand.roomCount,
      isDemo: true,
    },
    update: {},
  });

  await db.membership.upsert({
    where: { userId_workspaceId: { userId: owner.id, workspaceId: workspace.id } },
    create: {
      userId: owner.id,
      workspaceId: workspace.id,
      role: "HOTEL_MARKETER",
      isOwner: true,
    },
    update: {},
  });

  await db.assignment.upsert({
    where: { assistantId_workspaceId: { assistantId: csaId, workspaceId: workspace.id } },
    create: { assistantId: csaId, workspaceId: workspace.id },
    update: {},
  });

  await db.hotelProfile.upsert({
    where: { workspaceId: workspace.id },
    create: {
      workspaceId: workspace.id,
      ...(brand.profile as object),
      socials: { instagram: `@${brand.slug.replace(/-/g, "")}` },
    } as never,
    update: {},
  });

  // These are confirmed brand systems — the demo argument depends on it.
  await db.brandSystem.upsert({
    where: { workspaceId: workspace.id },
    create: {
      workspaceId: workspace.id,
      palette: { ...brand.palette, swatches: brand.swatches, motifs: brand.motifs },
      typography: brand.typography,
      imageStyle: brand.imageStyle,
      toneOfVoice: brand.toneOfVoice,
      layoutApproach: brand.layoutApproach,
      campaignStyle: brand.campaignStyle,
      provisional: false,
      completion: 100,
    },
    update: {
      palette: { ...brand.palette, swatches: brand.swatches, motifs: brand.motifs },
      typography: brand.typography,
      provisional: false,
      completion: 100,
    },
  });

  // Real brand material: the keyed logo and the actual guidelines sheet.
  const existingAssets = await db.brandAsset.count({ where: { workspaceId: workspace.id } });
  if (existingAssets === 0) {
    const logoBuffer = await readFile(
      path.join(BRAND_ROOT, brand.slug, `logo-${brand.slug}.png`)
    );
    const detailsBuffer = await readFile(path.join(DEMO_ROOT, brand.slug, "details.png"));

    const logoKey = `ws/${workspace.id}/brand/${nanoid()}.png`;
    await putLocal(logoKey, logoBuffer, "image/png");
    const guideKey = `ws/${workspace.id}/brand/${nanoid()}.png`;
    await putLocal(guideKey, detailsBuffer, "image/png");

    await db.brandAsset.createMany({
      data: [
        {
          workspaceId: workspace.id,
          kind: "LOGO",
          storageKey: logoKey,
          mime: "image/png",
          bytes: logoBuffer.length,
          extracted: { palette: brand.swatches },
        },
        {
          workspaceId: workspace.id,
          kind: "GUIDELINES",
          storageKey: guideKey,
          mime: "image/png",
          bytes: detailsBuffer.length,
          extracted: { source: "brand sheet" },
        },
      ],
    });
  }

  // One generation, two variants, per TDF-06 §4.4.
  const existingGeneration = await db.generation.findFirst({
    where: { workspaceId: workspace.id },
  });
  if (!existingGeneration) {
    const g = brand.generation;
    const generation = await db.generation.create({
      data: {
        workspaceId: workspace.id,
        assetType: g.assetType,
        outputKind: g.outputKind,
        rawBrief: g.rawBrief,
        status: "COMPLETE",
        expandedPrompt: g.expanded as never,
      },
    });

    const variantIds: string[] = [];
    for (let i = 0; i < 2; i++) {
      let imageKey: string | null = null;
      if (g.poster) {
        const p = g.poster;
        const svg = demoPoster({
          hotel: brand.hotelName,
          line: p.line,
          price: p.price,
          cta: p.cta,
          // second variant swaps ground and band for a distinct draw
          bg: i === 0 ? p.bg : p.band,
          band: i === 0 ? p.band : p.bg,
          accent: p.accent,
          ink: p.ink,
        });
        imageKey = `ws/${workspace.id}/gen/gen_${nanoid()}.webp`;
        await putLocal(
          imageKey,
          await sharp(Buffer.from(svg)).webp({ quality: 88 }).toBuffer(),
          "image/webp"
        );
      }
      const copy = g.copies ? g.copies[Math.min(i, g.copies.length - 1)] : null;
      const variant = await db.variant.create({
        data: {
          generationId: generation.id,
          imageKey,
          copy: (copy as object | null) as never,
        },
      });
      variantIds.push(variant.id);
    }

    if (g.approvalPending) {
      await db.approval.create({
        data: {
          variantId: variantIds[0],
          stage: "HOTEL_APPROVAL",
          reviewerId: owner.id,
          decision: "PENDING",
        },
      });
    }
  }

  console.log(`seeded ${brand.hotelName}`);
}

async function main() {
  // Demo passwords are weak on purpose (FIX-04 §3.1) — never seed prod.
  if (appEnv() === "production") {
    throw new Error(
      "Refusing to seed demo data with APP_ENV=production. Use APP_ENV=demo for a demo deployment."
    );
  }

  // TDF-06 replaced the fictional placeholders; clear any older owner
  // accounts (both the fictional set and the pre-FIX-04 generated
  // emails) plus the demo workspaces so brands re-seed cleanly with the
  // documented demo@*.co.ke logins and a fresh pending approval.
  const staleEmails = [
    ...OLD_DEMO_EMAILS,
    "wanjiku@demo.thedesignfactory.local",
    "daniel@demo.thedesignfactory.local",
    "amani@demo.thedesignfactory.local",
  ];
  await db.workspace.deleteMany({
    where: { slug: { in: BRANDS.map((b) => b.slug) } },
  });
  await db.user.deleteMany({ where: { email: { in: staleEmails } } });

  const csaPassword = await argon2.hash("demo-password-2026", { type: argon2.argon2id });
  const csa = await db.user.upsert({
    where: { email: "amina@demo.thedesignfactory.local" },
    create: {
      email: "amina@demo.thedesignfactory.local",
      name: "Amina Njoroge",
      passwordHash: csaPassword,
      emailVerifiedAt: new Date(),
    },
    update: {},
  });

  for (const brand of BRANDS) {
    await seedBrand(brand, csa.id);
  }

  console.log("demo seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
