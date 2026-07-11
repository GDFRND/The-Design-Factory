import { MonoLabel } from "@/components/brand/mono-label";
import { SpecPlate } from "@/components/brand/spec-plate";
import { BrandUploader } from "@/components/studio/brand-uploader";
import { ProfileForm } from "@/components/studio/profile-form";
import { ProvisionalSystem } from "@/components/studio/provisional-system";
import { computeCompletion } from "@/lib/brand/completion";
import { db } from "@/lib/db";
import { requireWorkspace } from "@/lib/workspace";

export const metadata = { title: "Brand profile · The Design Factory" };

export default async function BrandPage() {
  const ctx = await requireWorkspace();
  const [profile, brandSystem, assets] = await Promise.all([
    db.hotelProfile.findUnique({ where: { workspaceId: ctx.workspace.id } }),
    db.brandSystem.findUnique({ where: { workspaceId: ctx.workspace.id } }),
    db.brandAsset.findMany({
      where: { workspaceId: ctx.workspace.id },
      select: { kind: true },
    }),
  ]);

  const completion = computeCompletion({
    assetKinds: assets.map((a) => a.kind),
    profile,
    workspace: ctx.workspace,
    brandSystem,
  });

  const counts: Record<string, number> = {};
  for (const a of assets) counts[a.kind] = (counts[a.kind] ?? 0) + 1;

  const palette =
    ((brandSystem?.palette as { swatches?: string[] } | null)?.swatches ?? []).slice(0, 4);

  const defaults = {
    location: profile?.location ?? "",
    county: ctx.workspace.county ?? "",
    propertyType: ctx.workspace.propertyType ?? "",
    roomCount: ctx.workspace.roomCount ? String(ctx.workspace.roomCount) : "",
    roomCategories: profile?.roomCategories.join(", ") ?? "",
    restaurant: profile?.restaurant ?? "",
    buffet: profile?.buffet ?? "",
    conference: profile?.conference ?? "",
    wellness: profile?.wellness ?? "",
    targetCustomers: profile?.targetCustomers.join(", ") ?? "",
    sellingPoints: profile?.sellingPoints.join(", ") ?? "",
    contact: profile?.contact ?? "",
    bookingUrl: profile?.bookingUrl ?? "",
    websiteUrl: profile?.websiteUrl ?? "",
  };

  return (
    <>
      <main className="container-tdf flex flex-col gap-12 py-12">
        <div className="flex flex-col gap-3">
          <h1 className="text-h1">Build your brand system</h1>
          <p className="max-w-[68ch] text-body text-secondary-foreground">
            Upload what exists. We read it, propose a provisional system, and
            you confirm each part before it is used.
          </p>
        </div>

        <section className="flex flex-col gap-6">
          <SpecPlate no="§01" name="Upload brand material" note="Twelve kinds · anything helps" />
          <BrandUploader initialPercent={completion.percent} counts={counts} />
        </section>

        {completion.missing.length ? (
          <section className="flex flex-col gap-6">
            <SpecPlate no="§02" name="What's still missing" note="Each item raises the score" />
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {completion.missing.map((m) => (
                <li
                  key={m.label}
                  className="flex flex-col gap-2 rounded-card border border-line bg-raised p-4"
                >
                  <div className="flex items-center justify-between gap-2">
                    <span className="text-[15px] font-medium">{m.label}</span>
                    <MonoLabel size="xs" className="text-blueprint">
                      +{m.weight}%
                    </MonoLabel>
                  </div>
                  <p className="text-caption text-muted-foreground">{m.cta}</p>
                </li>
              ))}
            </ul>
          </section>
        ) : null}

        <section className="flex flex-col gap-6">
          <SpecPlate no="§03" name="Hotel profile" note="What we say starts here" />
          <div className="max-w-2xl">
            <ProfileForm defaults={defaults} />
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <SpecPlate no="§04" name="Provisional system" note="Nothing is approved until you confirm it" />
          <div className="max-w-2xl">
            <ProvisionalSystem
              palette={palette}
              provisional={brandSystem?.provisional ?? true}
              toneOfVoice={brandSystem?.toneOfVoice ?? null}
              imageStyle={brandSystem?.imageStyle ?? null}
            />
          </div>
        </section>
      </main>
    </>
  );
}
