/* Asset types (BRIEF §5.4). Each option carries its outputKind (§4.5)
   so the creation workspace knows which surface to open. */

export type OutputKind = "IMAGE" | "TEXT" | "COMPOSITE";

export const ASSET_TYPES: { label: string; kind: OutputKind }[] = [
  { label: "Poster", kind: "IMAGE" },
  { label: "Social media post", kind: "IMAGE" },
  { label: "Instagram story", kind: "IMAGE" },
  { label: "Facebook post", kind: "IMAGE" },
  { label: "LinkedIn post", kind: "IMAGE" },
  { label: "Email sales letter", kind: "TEXT" },
  { label: "WhatsApp marketing message", kind: "TEXT" },
  { label: "Hotel offer campaign", kind: "COMPOSITE" },
  { label: "Room promotion", kind: "IMAGE" },
  { label: "Restaurant or buffet promotion", kind: "IMAGE" },
  { label: "Wellness package", kind: "COMPOSITE" },
  { label: "Conference or event package", kind: "COMPOSITE" },
  { label: "Branding an uploaded image", kind: "IMAGE" },
  { label: "Brochure", kind: "COMPOSITE" },
  { label: "Landing page copy", kind: "TEXT" },
  { label: "Newsletter", kind: "COMPOSITE" },
  { label: "Customer follow-up message", kind: "TEXT" },
  { label: "Lead generation campaign", kind: "COMPOSITE" },
  { label: "Other", kind: "COMPOSITE" },
];

export function outputKindFor(label: string): OutputKind {
  return ASSET_TYPES.find((t) => t.label === label)?.kind ?? "COMPOSITE";
}
