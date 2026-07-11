/* The three seeded demo brands (FIX-04 §3). Shared by the seed script,
   the auth-sheet brand buttons and the /demo cheat sheet, so the
   credentials and slugs never drift between them.

   Passwords are weak on purpose and only ever used against demo data;
   the seed refuses to run when APP_ENV=production. `plated` marks the
   logos whose white is an ink (FIX-02 §2.1) — they ride a plate on
   dark chrome instead of keying. */

export type DemoBrand = {
  slug: string;
  hotelName: string;
  email: string;
  password: string;
  plated: boolean;
};

export const DEMO_BRANDS: DemoBrand[] = [
  {
    slug: "rhino-fort",
    hotelName: "Rhino Fort Hotel",
    email: "demo@rhinofort.co.ke",
    password: "RhinoFort2026",
    plated: true,
  },
  {
    slug: "the-regent",
    hotelName: "The Regent Hotel & Travel",
    email: "demo@theregent.co.ke",
    password: "Regent2026",
    plated: true,
  },
  {
    slug: "el-mara",
    hotelName: "El Mara Hotels & Resorts",
    email: "demo@elmara.co.ke",
    password: "ElMara2026",
    plated: true,
  },
];

/** Public path to a brand's logo, plated variant on dark surfaces. */
export function brandLogo(slug: string, plated: boolean) {
  return plated
    ? `/brand/${slug}/logo-${slug}-plated.png`
    : `/brand/${slug}/logo-${slug}-paper.png`;
}
