import { SpecPlate } from "@/components/brand/spec-plate";

export const metadata = { title: "Terms · The Design Factory" };

export default function TermsPage() {
  return (
    <main className="container-tdf flex flex-col gap-8 py-24">
      <SpecPlate no="§01" name="Terms" note="Last updated July 2026" />
      <h1 className="text-h1">Terms of service</h1>
      <div className="flex max-w-[68ch] flex-col gap-5 text-body text-secondary-foreground">
        <p>
          The Design Factory is provided to Kenyan hospitality businesses as
          part of the Tourism Fund&apos;s capacity-building mandate. Use it for
          marketing your own property. Assets you create are yours to publish
          once they pass your property&apos;s approval flow.
        </p>
        <p>
          Do not upload material you do not have the right to use. We may
          suspend workspaces that abuse the service or the people supporting
          it.
        </p>
      </div>
    </main>
  );
}
