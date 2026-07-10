import { SpecPlate } from "@/components/brand/spec-plate";

export const metadata = { title: "Privacy · The Design Factory" };

export default function PrivacyPage() {
  return (
    <main className="container-tdf flex flex-col gap-8 py-24">
      <SpecPlate no="§01" name="Privacy" note="Last updated July 2026" />
      <h1 className="text-h1">Privacy policy</h1>
      <div className="flex max-w-[68ch] flex-col gap-5 text-body text-secondary-foreground">
        <p>
          The Design Factory stores the information you provide — your account
          details, your property profile, and the brand material you upload —
          to operate your workspace. We do not sell it, and we do not share it
          outside the platform&apos;s operators (Genesis) and its institutional
          partner (the Tourism Fund) except as required to run the service.
        </p>
        <p>
          Uploaded brand assets remain yours. Generated assets belong to your
          property. You can request deletion of your workspace and its data at
          any time by writing to studio@gdfkenya.com.
        </p>
      </div>
    </main>
  );
}
