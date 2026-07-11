import Image from "next/image";
import Link from "next/link";
import { InstitutionalLockup } from "@/components/brand/institutional-lockup";
import { MonoLabel } from "@/components/brand/mono-label";
import { AnimatedHeading } from "@/components/motion/animated-heading";
import { FadeIn } from "@/components/motion/fade-in";
import { HeroCycle } from "@/components/motion/hero-cycle";
import hero1 from "@/public/hero/1.jpg";
import hero2 from "@/public/hero/2.jpg";
import hero3 from "@/public/hero/3.jpg";

/* BRIEF §5.1 + FIX-02 §3 — full-bleed three-image cycle, glass navbar,
   bottom-anchored content. The supplied images carry a baked directional
   Graphite scrim (legibility-verified); no runtime scrim may be added on
   top. Static imports give every layer an automatic blurDataURL and
   build-time preload metadata. */

const NAV_LINKS = [
  { href: "#how-it-works", label: "How it works" },
  { href: "#brand-system", label: "Brand system" },
  { href: "#support", label: "Support" },
];

export function Hero() {
  return (
    <header
      data-theme="dark"
      // Fixed 100svh: the three frames differ in aspect, and a fixed
      // height keeps the object-cover crop consistent so Ken Burns
      // never reveals letterboxing (FIX-02 §3.2).
      className="relative flex h-svh flex-col overflow-hidden bg-tdf-950"
    >
      <HeroCycle
        images={[
          { src: hero1, alt: "" },
          { src: hero2, alt: "" },
          { src: hero3, alt: "" },
        ]}
        progressClassName="bottom-6 right-6 md:bottom-8 md:right-8"
      />

      {/* TDF-06 §3.1 — a pool of cool light for the headline to sit in.
          A brand object, not a scrim. */}
      <div
        aria-hidden
        className="orb orb--blueprint bottom-[-20%] left-[-15%] z-[5] size-[75vmin] mix-blend-screen opacity-45"
      />
      <div aria-hidden className="grain z-[6]" />

      {/* Navbar */}
      <div className="relative z-10 px-6 pt-6 md:px-12 lg:px-16">
        <nav className="panel flex items-center justify-between px-4 py-2">
          <Link href="/" aria-label="The Design Factory — home" className="shrink-0">
            {/* Full lockup needs ~320px; below md the mark stands alone
                (40px minimum, TDF-BRD-01 §min-sizes). */}
            <span className="hidden md:block">
              <InstitutionalLockup variant="reversed" />
            </span>
            <Image
              src="/brand/tdf/tdf-mark-paper.png"
              alt="The Design Factory"
              width={40}
              height={40}
              className="m-2.5 md:hidden"
            />
          </Link>
          <div className="hidden items-center gap-8 lg:flex">
            {NAV_LINKS.map((l) => (
              <a
                key={l.href}
                href={l.href}
                className="whitespace-nowrap font-mono text-[11px] font-medium uppercase tracking-[0.14em] text-tdf-200 transition-colors duration-180 ease-tdf hover:text-tdf-025"
              >
                {l.label}
              </a>
            ))}
          </div>
          <div className="flex items-center gap-2">
            <Link
              href="/signin"
              className="inline-flex h-10 items-center whitespace-nowrap rounded-full px-4 text-[15px] font-medium text-tdf-025 transition-colors duration-180 ease-tdf hover:bg-tdf-025/10"
            >
              Sign in
            </Link>
            <Link
              href="/signup"
              className="inline-flex h-10 items-center whitespace-nowrap rounded-full bg-tdf-025 px-6 text-[15px] font-medium text-tdf-950 transition-colors duration-180 ease-tdf hover:bg-accent-300"
            >
              Create account
            </Link>
          </div>
        </nav>
      </div>

      {/* Content — bottom-anchored */}
      <div className="relative z-10 flex flex-1 flex-col justify-end px-6 pb-12 md:px-12 lg:grid lg:grid-cols-2 lg:items-end lg:px-16 lg:pb-16">
        <div className="flex flex-col gap-6">
          <FadeIn delay={100}>
            <MonoLabel size="sm" className="text-tdf-300">
              A Genesis project · Supported by the Tourism Fund
            </MonoLabel>
          </FadeIn>
          <AnimatedHeading
            text="The Design Factory"
            accent="Factory"
            accentClassName="italic text-accent-300"
            as="h1"
            className="max-w-[16ch] font-display text-[clamp(2.75rem,7vw,5.25rem)] font-light leading-[1.02] tracking-[-0.02em] text-tdf-025"
          />
          <FadeIn delay={800}>
            <p className="max-w-[52ch] text-[clamp(1rem,1.6vw,1.2rem)] text-tdf-300">
              An AI marketing department for every hotel, lodge and resort in
              Kenya. Describe the offer. We handle the rest.
            </p>
          </FadeIn>
          <FadeIn delay={1200}>
            <div className="flex flex-wrap items-center gap-3">
              <Link
                href="/signup"
                className="inline-flex h-12 items-center rounded-full bg-tdf-025 px-8 text-[15px] font-medium text-tdf-950 transition-colors duration-180 ease-tdf hover:bg-accent-300"
              >
                Create account
              </Link>
              <a
                href="/api/demo"
                className="tdf-glass inline-flex h-12 items-center rounded-full border border-(--glass-border) px-8 text-[15px] font-medium text-tdf-025 transition-colors duration-180 ease-tdf hover:bg-tdf-025 hover:text-tdf-950"
              >
                Explore demo
              </a>
            </div>
          </FadeIn>
        </div>
        <FadeIn delay={1400} className="mt-10 hidden lg:mt-0 lg:flex lg:justify-end lg:pr-24">
          <div className="panel px-6 py-3">
            <MonoLabel size="sm" className="whitespace-nowrap text-tdf-200">
              Posters · Campaigns · Offers · Follow-up
            </MonoLabel>
          </div>
        </FadeIn>
      </div>
    </header>
  );
}
