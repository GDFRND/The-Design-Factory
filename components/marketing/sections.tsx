import Link from "next/link";
import { MonoLabel } from "@/components/brand/mono-label";
import { SpecPlate } from "@/components/brand/spec-plate";
import { BrandCompletionDemo } from "@/components/marketing/brand-completion-demo";

/* BRIEF §5.2 — every section opens with a SpecPlate, breathes at 96px
   desktop / 64px mobile, and closes on a 1px Fog rule. No section
   invents a new page shape. */

function Section({
  id,
  children,
  className = "",
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <section id={id} className={`border-b border-line scroll-mt-16 ${className}`}>
      <div className="container-tdf py-16 md:py-24">{children}</div>
    </section>
  );
}

const ASSET_KINDS = [
  "Logo",
  "Brand guidelines",
  "Fonts",
  "Photography",
  "Old posters",
  "Menus",
  "Room images",
  "Brochures",
  "Past campaigns",
  "Website screenshots",
  "Social samples",
  "Reference brands",
];

const REFINE_CHIPS = [
  "More premium",
  "More local",
  "More corporate",
  "More youthful",
  "More luxurious",
  "More family-friendly",
  "Apply brand colours",
  "Use different image",
];

const CATEGORIES = [
  "Tented camp",
  "Beach resort",
  "City hotel",
  "Safari lodge",
  "Boutique stay",
  "Conference centre",
  "Ranch & farmstay",
  "MICE venue",
];

export function MarketingSections() {
  return (
    <main>
      {/* §01 — Why this exists */}
      <Section>
        <SpecPlate no="§01" name="Why this exists" note="The levy, returned as a tool" />
        <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-16">
          <h2 className="text-display-2 max-w-[18ch]">
            Every property pays the levy. This is the levy,{" "}
            <span className="text-display-italic">working for you.</span>
          </h2>
          <div className="flex max-w-[68ch] flex-col gap-5 text-body text-secondary-foreground lg:pt-2">
            <p>
              Every hospitality business in Kenya contributes to the Tourism
              Fund. The Fund exists to build the industry&apos;s capacity — and
              marketing capacity is where small properties are most alone.
            </p>
            <p>
              The Design Factory is part of that mandate. A working marketing
              department, available to the properties that fund it. Not a
              grant. Not a workshop. A tool you use on a Tuesday.
            </p>
          </div>
        </div>
      </Section>

      {/* §02 — Build your hotel brand system */}
      <Section id="brand-system">
        <SpecPlate no="§02" name="Build your hotel brand system" note="We infer a system from whatever exists" />
        <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col gap-5">
            <h2 className="text-h1 max-w-[24ch]">
              Upload what you have. We build a system from it.
            </h2>
            <p className="max-w-[68ch] text-body text-secondary-foreground">
              A logo. Old posters. The menu. Photos on someone&apos;s phone.
              That is enough to start. We read what exists, propose a
              provisional brand system — palette, type, tone of voice — and
              you confirm each part before it is used.
            </p>
          </div>
          <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3">
            {ASSET_KINDS.map((k) => (
              <li
                key={k}
                className="flex items-center rounded-input border border-line bg-raised px-3 py-2.5"
              >
                <MonoLabel size="xs" className="text-muted-foreground">
                  {k}
                </MonoLabel>
              </li>
            ))}
          </ul>
        </div>
      </Section>

      {/* §03 — Complete your brand profile */}
      <Section>
        <SpecPlate no="§03" name="Complete your brand profile" note="35 → 60 → 100" />
        <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col gap-5">
            <h2 className="text-h1 max-w-[24ch]">
              The more we know, the better the work.
            </h2>
            <p className="max-w-[68ch] text-body text-secondary-foreground">
              Your brand profile has a score. Every upload raises it. Every
              confirmed detail raises it. Nothing nags — each missing piece
              simply explains what it would make possible.
            </p>
          </div>
          <BrandCompletionDemo />
        </div>
      </Section>

      {/* §04 — Create marketing assets */}
      <Section id="how-it-works">
        <SpecPlate no="§04" name="Create marketing assets" note="Three steps · no AI knowledge required" />
        <div className="mt-12 grid gap-6 md:grid-cols-3">
          {[
            {
              no: "01 — Choose",
              title: "Choose what you want",
              body: "A poster. A room promotion. An email to past guests. Nineteen asset types, in plain language.",
            },
            {
              no: "02 — Describe",
              title: "Describe your offer",
              body: "The buffet, the price, the dates, who it is for. Write it the way you would tell a colleague.",
            },
            {
              no: "03 — Review",
              title: "Review and create",
              body: "We turn your brief into a full creative plan you can edit. Then we produce it in your brand.",
            },
          ].map((card) => (
            <div
              key={card.no}
              className="flex flex-col gap-4 rounded-card border border-line bg-raised p-6"
            >
              <MonoLabel size="sm" className="text-muted-foreground">
                {card.no}
              </MonoLabel>
              <h3 className="text-h2">{card.title}</h3>
              <p className="text-[15px] leading-relaxed text-secondary-foreground">
                {card.body}
              </p>
            </div>
          ))}
        </div>
      </Section>

      {/* §05 — Refine and approve */}
      <Section>
        <SpecPlate no="§05" name="Refine and approve" note="Two stages · every decision recorded" />
        <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-16">
          <div className="flex flex-col gap-6">
            <h2 className="text-h1 max-w-[24ch]">
              Nothing publishes until the right person says so.
            </h2>
            <p className="max-w-[68ch] text-body text-secondary-foreground">
              Refine a variant in plain words — more premium, more local,
              apply brand colours. When it is right, send it for approval.
              The person who creates is rarely the person who may publish;
              the platform models that.
            </p>
            <div className="flex flex-wrap gap-2">
              {REFINE_CHIPS.map((c) => (
                <span
                  key={c}
                  className="rounded-full border border-line bg-raised px-4 py-1.5 text-[13px] text-secondary-foreground"
                >
                  {c}
                </span>
              ))}
            </div>
          </div>
          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4 rounded-card border border-line bg-raised p-5">
              <div className="flex flex-col gap-1">
                <MonoLabel size="sm">01 · Support review</MonoLabel>
                <p className="text-[15px] text-secondary-foreground">
                  Your Creative Support Assistant checks the asset.
                </p>
              </div>
              <MonoLabel size="xs" className="shrink-0 text-muted-foreground">
                Optional
              </MonoLabel>
            </div>
            <div className="flex items-center justify-between gap-4 rounded-card border border-line bg-raised p-5">
              <div className="flex flex-col gap-1">
                <MonoLabel size="sm">02 · Hotel approval</MonoLabel>
                <p className="text-[15px] text-secondary-foreground">
                  Your approver signs off before anything is published.
                </p>
              </div>
              <MonoLabel size="xs" className="shrink-0 text-warning">
                Required
              </MonoLabel>
            </div>
          </div>
        </div>
      </Section>

      {/* §06 — Human support layer */}
      <Section id="support">
        <SpecPlate no="§06" name="Human support layer" note="Powered by Jitume · Digital Media Factory" />
        <div className="mt-12 grid gap-10 lg:grid-cols-2 lg:gap-16">
          <h2 className="text-h1 max-w-[24ch]">
            A person, assigned to your property.
          </h2>
          <div className="flex max-w-[68ch] flex-col gap-5 text-body text-secondary-foreground">
            <p>
              Every workspace has a Creative Support Assistant — a working
              designer trained through Jitume, the national digital-skills
              programme, at its Digital Media Factory. Each carries five to
              ten properties. Ask them what to run for Easter. Ask them to
              review an asset before your manager sees it. They answer inside
              the platform, against your brand.
            </p>
          </div>
        </div>
      </Section>

      {/* §07 — Built for Kenyan hospitality */}
      <Section>
        <SpecPlate no="§07" name="Built for Kenyan hospitality" note="Coastal · safari · city" />
        <div className="mt-12 flex flex-wrap items-center gap-x-8 gap-y-4">
          {CATEGORIES.map((c, i) => (
            <span key={c} className="flex items-center gap-8">
              <MonoLabel size="md" className="text-muted-foreground">
                {c}
              </MonoLabel>
              {i < CATEGORIES.length - 1 ? (
                <span aria-hidden className="hidden h-4 w-px bg-line sm:block" />
              ) : null}
            </span>
          ))}
        </div>
      </Section>

      {/* §08 — Closing band */}
      <section className="bg-tdf-950">
        <div className="container-tdf flex flex-col items-start gap-8 py-16 md:py-24">
          <SpecPlate
            no="§08"
            name="Start"
            note="Describe the offer · we handle the rest"
            className="w-full border-tdf-800 [&_span]:text-tdf-400"
          />
          <h2 className="text-display-2 max-w-[20ch] text-tdf-025">
            Your next offer, designed before lunch.
          </h2>
          <div className="flex flex-wrap items-center gap-3">
            <Link
              href="/signup"
              className="inline-flex h-12 items-center rounded-full bg-tdf-025 px-8 text-[15px] font-medium text-tdf-950 transition-colors duration-180 ease-tdf hover:bg-accent-300"
            >
              Create account
            </Link>
            <Link
              href="/signin"
              className="inline-flex h-12 items-center rounded-full px-6 text-[15px] font-medium text-tdf-025 transition-colors duration-180 ease-tdf hover:bg-tdf-025/10"
            >
              Sign in
            </Link>
            <a
              href="#support"
              className="inline-flex h-12 items-center rounded-full border border-tdf-800 px-6 text-[15px] font-medium text-tdf-300 transition-colors duration-180 ease-tdf hover:border-tdf-700 hover:text-tdf-025"
            >
              Request support
            </a>
          </div>
        </div>
      </section>
    </main>
  );
}
