/* One place for the APP_ENV gate (FIX-04 §3–4). "demo" shows the brand
   buttons and lets the seed run; "production" hides both. Anything else
   (unset, "development") behaves like demo locally. */

export function appEnv(): "production" | "demo" | "development" {
  const raw = process.env.APP_ENV;
  if (raw === "production") return "production";
  if (raw === "demo") return "demo";
  return "development";
}

/** Demo affordances (brand-login buttons, /demo cheat sheet) are shown
    everywhere except production. */
export function demoFeaturesEnabled() {
  return appEnv() !== "production";
}
