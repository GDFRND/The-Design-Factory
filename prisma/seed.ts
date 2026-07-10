/* Demo seed (BRIEF §6). Three fictional properties, one per hero image,
   so "Explore demo" lands somewhere that feels real. Everything is
   marked demo/provisional; nothing pretends to be a real client.
   Idempotent: keyed on slugs and emails, safe to re-run.

   Run: npx tsx --conditions react-server prisma/seed.ts */

import "dotenv/config";
import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";
import argon2 from "argon2";
import { nanoid } from "nanoid";
import sharp from "sharp";
import { mkdir, writeFile } from "node:fs/promises";
import path from "node:path";

const db = new PrismaClient({
  adapter: new PrismaPg({ connectionString: process.env.DATABASE_URL }),
});

const UPLOAD_ROOT = path.join(process.cwd(), ".uploads");

async function putLocal(key: string, data: Buffer) {
  const file = path.join(UPLOAD_ROOT, key);
  await mkdir(path.dirname(file), { recursive: true });
  await writeFile(file, data);
}

function svgLogo(name: string, bg: string, fg: string) {
  const initials = name
    .split(/\s+/)
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512">
    <rect width="512" height="512" rx="64" fill="${bg}"/>
    <text x="256" y="300" text-anchor="middle" font-family="Georgia, serif" font-size="180" fill="${fg}">${initials}</text>
    <text x="256" y="420" text-anchor="middle" font-family="Helvetica, Arial" font-size="36" letter-spacing="8" fill="${fg}" opacity="0.8">${name.toUpperCase().slice(0, 18)}</text>
  </svg>`;
}

function svgPoster(hotel: string, line: string, bg: string, accent: string) {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="1080" height="1350">
    <rect width="1080" height="1350" fill="${bg}"/>
    <rect y="840" width="1080" height="510" fill="rgba(0,0,0,0.35)"/>
    <circle cx="800" cy="360" r="220" fill="${accent}" opacity="0.5"/>
    <text x="90" y="120" font-family="Helvetica, Arial" font-size="34" letter-spacing="6" fill="#FAFAF9">${hotel.toUpperCase()}</text>
    <text x="90" y="980" font-family="Georgia, serif" font-size="86" fill="#FAFAF9">${line}</text>
    <rect x="90" y="1180" rx="46" width="420" height="92" fill="#FAFAF9"/>
    <text x="130" y="1240" font-family="Helvetica, Arial" font-size="38" fill="#111111">Book on WhatsApp</text>
  </svg>`;
}

type DemoProperty = {
  slug: string;
  hotelName: string;
  county: string;
  propertyType: string;
  roomCount: number;
  palette: [string, string];
  owner: { name: string; email: string };
  profile: {
    location: string;
    roomCategories: string[];
    restaurant: string;
    buffet?: string;
    conference?: string;
    wellness?: string;
    targetCustomers: string[];
    sellingPoints: string[];
    seasonalOffers: string[];
    contact: string;
    bookingUrl: string;
  };
  typography: { heading: string; body: string };
  toneOfVoice: string;
  generation: {
    assetType: string;
    outputKind: "IMAGE" | "TEXT" | "COMPOSITE";
    rawBrief: string;
    keyMessage: string;
    price: string;
    posterLine: string;
  };
};

const PROPERTIES: DemoProperty[] = [
  {
    slug: "demo-mara-sable-camp",
    hotelName: "Mara Sable Camp",
    county: "Narok",
    propertyType: "Tented camp",
    roomCount: 12,
    palette: ["#4A3B28", "#C8A96A"],
    owner: { name: "Naisula Koech", email: "naisula@demo.thedesignfactory.local" },
    profile: {
      location: "Olare Motorogi Conservancy, Maasai Mara, Narok County",
      roomCategories: ["Classic tent", "Family tent", "Honeymoon suite tent"],
      restaurant: "The Fig Tree mess tent — bush dinners on request",
      conference: "",
      wellness: "Massage banda by the river",
      targetCustomers: ["International safari travellers", "Kenyan weekenders", "Honeymooners"],
      sellingPoints: ["Private conservancy traversal", "Guides with 15+ years in the Mara", "Solar-powered camp"],
      seasonalOffers: ["Green season resident rates", "Migration window packages"],
      contact: "+254 700 111222",
      bookingUrl: "https://example.com/mara-sable",
    },
    typography: { heading: "Playfair Display", body: "Source Sans" },
    toneOfVoice: "Quiet, knowledgeable, unhurried. The wild speaks for itself.",
    generation: {
      assetType: "Room promotion",
      outputKind: "IMAGE",
      rawBrief:
        "Green season offer for the honeymoon suite tent. KES 28,000 per night for Kenyan residents, April to June. Includes game drives and bush breakfast.",
      keyMessage: "The Mara, without the crowds",
      price: "KES 28,000",
      posterLine: "Green season, private Mara",
    },
  },
  {
    slug: "demo-diani-baobab-resort",
    hotelName: "Baobab Lane Resort",
    county: "Kwale",
    propertyType: "Beach resort",
    roomCount: 64,
    palette: ["#0E5E63", "#E8C170"],
    owner: { name: "Hamisi Mwakio", email: "hamisi@demo.thedesignfactory.local" },
    profile: {
      location: "Diani Beach Road, Kwale County",
      roomCategories: ["Garden room", "Ocean-view room", "Family suite", "Beach villa"],
      restaurant: "Mvuvi Grill — seafood, on the sand",
      buffet: "Sunday seafood buffet, 12:30–16:00",
      conference: "Two boardrooms for up to 40",
      wellness: "Baobab spa, six treatment rooms",
      targetCustomers: ["Nairobi families", "Coast weekenders", "UK and German charters"],
      sellingPoints: ["Direct beach access", "Award-winning kitchen", "Kids' club"],
      seasonalOffers: ["Easter family package", "Low-season resident rates"],
      contact: "+254 700 333444",
      bookingUrl: "https://example.com/baobab-lane",
    },
    typography: { heading: "Fraunces", body: "Inter" },
    toneOfVoice: "Sunny, generous, family-first. Plain words, real prices.",
    generation: {
      assetType: "Restaurant or buffet promotion",
      outputKind: "COMPOSITE",
      rawBrief:
        "Sunday seafood buffet campaign. KES 3,200 per adult, kids under 12 half price. Live band from 2pm. Target Nairobi families planning coast weekends.",
      keyMessage: "Sunday is for seafood",
      price: "KES 3,200",
      posterLine: "Sunday seafood buffet",
    },
  },
  {
    slug: "demo-sable-house-nairobi",
    hotelName: "Sable House Nairobi",
    county: "Nairobi",
    propertyType: "City hotel",
    roomCount: 118,
    palette: ["#1E2A38", "#B08D57"],
    owner: { name: "Achieng Odera", email: "achieng@demo.thedesignfactory.local" },
    profile: {
      location: "Upper Hill, Nairobi",
      roomCategories: ["Studio", "Executive room", "Corner suite"],
      restaurant: "Ledger & Vine — modern Kenyan",
      conference: "Nine meeting rooms, 400-seat ballroom",
      wellness: "24-hour gym, rooftop pool",
      targetCustomers: ["Business travellers", "Conference organisers", "Regional NGOs"],
      sellingPoints: ["Five minutes from the CBD", "Fastest check-in in Upper Hill", "Dedicated MICE team"],
      seasonalOffers: ["Day-delegate packages", "Weekend city-break rates"],
      contact: "+254 700 555666",
      bookingUrl: "https://example.com/sable-house",
    },
    typography: { heading: "Libre Caslon", body: "Inter" },
    toneOfVoice: "Crisp, assured, corporate without being cold.",
    generation: {
      assetType: "Conference or event package",
      outputKind: "COMPOSITE",
      rawBrief:
        "Day-delegate conference package. KES 6,500 per person including lunch, two breaks and boardroom hire. Target corporate planners booking Q3 off-sites.",
      keyMessage: "Meetings that run themselves",
      price: "KES 6,500",
      posterLine: "Day-delegate, done properly",
    },
  },
];

async function seedProperty(p: DemoProperty, csaId: string) {
  const passwordHash = await argon2.hash("demo-password-2026", { type: argon2.argon2id });

  const owner = await db.user.upsert({
    where: { email: p.owner.email },
    create: {
      email: p.owner.email,
      name: p.owner.name,
      passwordHash,
      emailVerifiedAt: new Date(),
    },
    update: {},
  });

  const workspace = await db.workspace.upsert({
    where: { slug: p.slug },
    create: {
      slug: p.slug,
      hotelName: p.hotelName,
      county: p.county,
      propertyType: p.propertyType,
      roomCount: p.roomCount,
      isDemo: true,
    },
    update: {},
  });

  await db.membership.upsert({
    where: { userId_workspaceId: { userId: owner.id, workspaceId: workspace.id } },
    create: {
      userId: owner.id,
      workspaceId: workspace.id,
      role: "HOTEL_APPROVER",
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
      ...p.profile,
      socials: { instagram: `@${p.slug.replace(/^demo-/, "").replace(/-/g, "")}` },
    },
    update: {},
  });

  // Everything seeded is provisional (§6) — nothing pretends to be a
  // real client's approved system.
  await db.brandSystem.upsert({
    where: { workspaceId: workspace.id },
    create: {
      workspaceId: workspace.id,
      palette: { swatches: [p.palette[0], p.palette[1], "#FAFAF9"], status: "PROVISIONAL" },
      typography: { ...p.typography, status: "PROVISIONAL" },
      imageStyle: "Natural light, real guests, no heavy filters (provisional)",
      toneOfVoice: p.toneOfVoice,
      provisional: true,
    },
    update: {},
  });

  // Brand assets: a logo wordmark and one past poster.
  const existingAssets = await db.brandAsset.count({ where: { workspaceId: workspace.id } });
  if (existingAssets === 0) {
    const logoKey = `ws/${workspace.id}/brand/${nanoid()}.png`;
    await putLocal(
      logoKey,
      await sharp(Buffer.from(svgLogo(p.hotelName, p.palette[0], "#FAFAF9"))).png().toBuffer()
    );
    const posterKey = `ws/${workspace.id}/brand/${nanoid()}.png`;
    await putLocal(
      posterKey,
      await sharp(
        Buffer.from(svgPoster(p.hotelName, p.profile.seasonalOffers[0] ?? "Our offer", p.palette[0], p.palette[1]))
      ).png().toBuffer()
    );
    await db.brandAsset.createMany({
      data: [
        {
          workspaceId: workspace.id,
          kind: "LOGO",
          storageKey: logoKey,
          mime: "image/png",
          bytes: 1,
          extracted: { palette: [p.palette[0], p.palette[1]], status: "PROVISIONAL" },
        },
        {
          workspaceId: workspace.id,
          kind: "POSTER",
          storageKey: posterKey,
          mime: "image/png",
          bytes: 1,
          extracted: { status: "PROVISIONAL" },
        },
      ],
    });
  }

  // One generation with two variants and a pending hotel approval, so
  // the approval badge has something to render.
  const existingGeneration = await db.generation.findFirst({
    where: { workspaceId: workspace.id },
  });
  if (!existingGeneration) {
    const g = p.generation;
    const generation = await db.generation.create({
      data: {
        workspaceId: workspace.id,
        assetType: g.assetType,
        outputKind: g.outputKind,
        rawBrief: g.rawBrief,
        status: "COMPLETE",
        expandedPrompt: {
          assetType: g.assetType,
          outputKind: g.outputKind,
          targetAudience: p.profile.targetCustomers.join(", "),
          marketingObjective: "Drive direct bookings",
          keyMessage: g.keyMessage,
          offerDetails: { price: g.price },
          toneOfVoice: p.toneOfVoice,
          visualDirection: "Natural light photography of the property",
          suggestedLayout: "Headline, offer block, booking contact",
          brandApplication: "Provisional palette on headline and offer block",
          callToAction: "Book on WhatsApp",
          outputFormat: "1080×1350 · IG feed",
          missingDetails: [],
        },
      },
    });

    const variantIds: string[] = [];
    for (let i = 0; i < 2; i++) {
      const key = `ws/${workspace.id}/gen/gen_${nanoid()}.webp`;
      await putLocal(
        key,
        await sharp(
          Buffer.from(
            svgPoster(p.hotelName, g.posterLine, i === 0 ? p.palette[0] : p.palette[1], i === 0 ? p.palette[1] : p.palette[0])
          )
        )
          .webp({ quality: 88 })
          .toBuffer()
      );
      const variant = await db.variant.create({
        data: {
          generationId: generation.id,
          imageKey: key,
          copy:
            g.outputKind === "COMPOSITE"
              ? {
                headline: g.keyMessage,
                subhead: "",
                body: g.rawBrief,
                cta: "Book on WhatsApp",
                sections: [],
              }
              : undefined,
        },
      });
      variantIds.push(variant.id);
    }

    await db.approval.create({
      data: {
        variantId: variantIds[0],
        stage: "HOTEL_APPROVAL",
        reviewerId: owner.id,
        decision: "PENDING",
      },
    });
  }

  console.log(`seeded ${p.hotelName}`);
}

async function main() {
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

  for (const property of PROPERTIES) {
    await seedProperty(property, csa.id);
  }

  console.log("demo seed complete");
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => db.$disconnect());
