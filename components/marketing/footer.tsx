import Link from "next/link";
import { InstitutionalLockup } from "@/components/brand/institutional-lockup";
import { MonoLabel } from "@/components/brand/mono-label";
import { PartnerStrip } from "@/components/brand/partner-strip";

/* BRIEF §5.7 — Graphite band. Full TDF lockup (the only place the
   tagline appears), one sentence, three link columns, then the
   PartnerStrip and the final mono line. */

const COLUMNS: { title: string; links: { label: string; href: string }[] }[] = [
  {
    title: "Platform",
    links: [
      { label: "How it works", href: "/#how-it-works" },
      { label: "Brand system", href: "/#brand-system" },
      { label: "Create account", href: "/signup" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Creative support", href: "/#support" },
      { label: "Sign in", href: "/signin" },
      { label: "Contact", href: "mailto:studio@gdfkenya.com" },
    ],
  },
  {
    title: "Legal",
    links: [
      { label: "Privacy", href: "/privacy" },
      { label: "Terms", href: "/terms" },
    ],
  },
];

export function Footer() {
  return (
    <footer
      data-theme="dark"
      className="border-t border-(--line-strong) bg-tdf-950 pt-24"
    >
      <div className="container-tdf flex flex-col items-center gap-10">
        <InstitutionalLockup
          variant="reversed"
          wordmark
          markSize={48}
          className="max-w-full flex-wrap justify-center gap-y-4"
        />
        <p className="max-w-[52ch] text-center text-body text-tdf-400">
          Every hospitality business deserves consistent, professional,
          high-quality marketing. This gives them the tools, the intelligence
          and the creative support to get there.
        </p>
        <div className="grid w-full max-w-2xl grid-cols-1 gap-10 py-6 text-center sm:grid-cols-3">
          {COLUMNS.map((col) => (
            <div key={col.title} className="flex flex-col items-center gap-4">
              <MonoLabel size="xs" className="text-tdf-500">
                {col.title}
              </MonoLabel>
              <ul className="flex flex-col items-center gap-2">
                {col.links.map((l) => (
                  <li key={l.label}>
                    <Link
                      href={l.href}
                      className="text-[15px] text-tdf-300 transition-colors duration-180 ease-tdf hover:text-tdf-025"
                    >
                      {l.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      </div>
      <div className="border-t border-tdf-800">
        <div className="container-tdf flex flex-col items-center gap-8 py-10">
          <PartnerStrip />
          <span className="font-mono text-[9px] uppercase tracking-[0.12em] text-tdf-500">
            The Design Factory · © 2026
          </span>
        </div>
      </div>
    </footer>
  );
}
