import "server-only";
import { db } from "@/lib/db";

/* Brand dossier (BRIEF §4.1). Assembled from HotelProfile +
   BrandSystem + the BrandAsset manifest, written like a brief rather
   than a JSON dump. Injected as a cached system-prompt block on every
   model call, so it isn't re-billed every turn. */

export type BrandDossier = {
  workspaceId: string;
  hotelName: string;
  markdown: string;
};

function line(label: string, value?: string | null) {
  return value && value.trim() ? `- ${label}: ${value.trim()}` : null;
}

function list(label: string, values?: string[]) {
  return values && values.length ? `- ${label}: ${values.join(", ")}` : null;
}

export async function buildBrandDossier(
  workspaceId: string
): Promise<BrandDossier> {
  const [workspace, profile, brand, assets] = await Promise.all([
    db.workspace.findUniqueOrThrow({ where: { id: workspaceId } }),
    db.hotelProfile.findUnique({ where: { workspaceId } }),
    db.brandSystem.findUnique({ where: { workspaceId } }),
    db.brandAsset.findMany({
      where: { workspaceId },
      select: { kind: true, extracted: true },
      orderBy: { createdAt: "asc" },
    }),
  ]);

  const sections: string[] = [];

  sections.push(`# Brand dossier — ${workspace.hotelName}`);

  const property = [
    line("Property", workspace.hotelName),
    line("Location", profile?.location ?? workspace.county),
    line("Property type", workspace.propertyType),
    workspace.roomCount ? `- Rooms: ${workspace.roomCount}` : null,
    list("Room categories", profile?.roomCategories),
  ].filter(Boolean);
  if (property.length > 1) sections.push(`## The property\n${property.join("\n")}`);

  const fnb = [
    line("Restaurant", profile?.restaurant),
    line("Buffet", profile?.buffet),
    line("Conference", profile?.conference),
    line("Wellness", profile?.wellness),
    line("Spa", profile?.spa),
  ].filter(Boolean);
  if (fnb.length) sections.push(`## Food, drink & facilities\n${fnb.join("\n")}`);

  const market = [
    list("They sell to", profile?.targetCustomers),
    list("What they're proud of", profile?.sellingPoints),
    list("Seasonal offers", profile?.seasonalOffers),
  ].filter(Boolean);
  if (market.length) sections.push(`## Who they sell to\n${market.join("\n")}`);

  const brandLines: string[] = [];
  if (brand?.toneOfVoice) brandLines.push(`- Tone of voice: ${brand.toneOfVoice}`);
  if (brand?.palette)
    brandLines.push(`- Palette: ${JSON.stringify(brand.palette)}`);
  if (brand?.typography)
    brandLines.push(`- Typography: ${JSON.stringify(brand.typography)}`);
  if (brand?.imageStyle) brandLines.push(`- Image style: ${brand.imageStyle}`);
  if (brand?.layoutApproach)
    brandLines.push(`- Layout habits: ${brand.layoutApproach}`);
  if (brand?.campaignStyle)
    brandLines.push(`- Past campaigns: ${brand.campaignStyle}`);
  if (brand?.provisional)
    brandLines.push(
      "- Status: PROVISIONAL — inferred from uploads, not yet confirmed by the hotel."
    );
  if (brandLines.length)
    sections.push(`## Brand system\n${brandLines.join("\n")}`);

  if (assets.length) {
    const manifest = assets
      .map((a) => {
        const extracted =
          a.extracted && Object.keys(a.extracted as object).length
            ? ` — ${JSON.stringify(a.extracted)}`
            : "";
        return `- ${a.kind}${extracted}`;
      })
      .join("\n");
    sections.push(`## Uploaded brand material\n${manifest}`);
  }

  const contact = [
    line("Contact", profile?.contact),
    line("Booking", profile?.bookingUrl),
    line("Website", profile?.websiteUrl),
    profile?.socials ? `- Socials: ${JSON.stringify(profile.socials)}` : null,
  ].filter(Boolean);
  if (contact.length) sections.push(`## Contact\n${contact.join("\n")}`);

  return {
    workspaceId,
    hotelName: workspace.hotelName,
    markdown: sections.join("\n\n"),
  };
}
