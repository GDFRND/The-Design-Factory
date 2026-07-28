import { notFound } from "next/navigation";
import { MonoLabel } from "@/components/brand/mono-label";
import { SpecPlate } from "@/components/brand/spec-plate";
import { DEMO_BRANDS } from "@/lib/demo/brands";
import { demoFeaturesEnabled } from "@/lib/env";

export const metadata = { title: "Demo logins · The Design Factory" };

/* FIX-04 §3.1 cheat sheet — the seeded credentials on hand for a live
   walkthrough. Absent in production (the accounts don't exist there). */

export default function DemoPage() {
  if (!demoFeaturesEnabled()) notFound();

  return (
    <main className="container-tdf flex max-w-2xl flex-col gap-8 py-24">
      <SpecPlate no="§00" name="Demo logins" note="APP_ENV=demo only" />
      <h1 className="text-h1">Three real brands, one chrome.</h1>
      <p className="max-w-[68ch] text-body text-secondary-foreground">
        These accounts log in through the normal form, nothing is
        special-cased. The buttons on the sign-in sheet just type these
        credentials for you.
      </p>
      <ul className="flex flex-col divide-y divide-line rounded-card border border-line">
        {DEMO_BRANDS.map((b) => (
          <li key={b.slug} className="flex flex-wrap items-center justify-between gap-2 p-4">
            <span className="text-[15px] font-medium">{b.hotelName}</span>
            <div className="flex flex-col items-end gap-1">
              <MonoLabel size="xs" className="text-secondary-foreground">
                {b.email}
              </MonoLabel>
              <MonoLabel size="xs" className="text-muted-foreground">
                {b.password}
              </MonoLabel>
            </div>
          </li>
        ))}
      </ul>
    </main>
  );
}
