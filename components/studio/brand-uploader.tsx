"use client";

import * as React from "react";
import { Upload } from "lucide-react";
import { MonoLabel } from "@/components/brand/mono-label";
import { useReducedMotion } from "@/components/motion/fade-in";
import { cn } from "@/lib/utils";

/* Brand onboarding uploader (BRIEF §5.6). Each accepted upload bumps
   the score with a 420ms count-up and a mono receipt line:
   "+8% · LOGO RECEIVED". */

const KINDS: { kind: string; label: string; hint: string; accept: string }[] = [
  { kind: "LOGO", label: "Logo", hint: "PNG with transparency works best", accept: "image/*" },
  { kind: "GUIDELINES", label: "Brand guidelines", hint: "PDF or images", accept: "image/*,application/pdf" },
  { kind: "FONT", label: "Fonts", hint: "TTF, OTF or WOFF", accept: ".ttf,.otf,.woff,.woff2" },
  { kind: "PHOTOGRAPHY", label: "Photography", hint: "The property, food, people", accept: "image/*" },
  { kind: "POSTER", label: "Old posters", hint: "Anything you've printed", accept: "image/*,application/pdf" },
  { kind: "MENU", label: "Menus", hint: "Restaurant or buffet menus", accept: "image/*,application/pdf" },
  { kind: "ROOM_IMAGE", label: "Room images", hint: "One per room type", accept: "image/*" },
  { kind: "BROCHURE", label: "Brochures", hint: "PDF or scans", accept: "image/*,application/pdf" },
  { kind: "PAST_CAMPAIGN", label: "Past campaigns", hint: "Artwork that ran before", accept: "image/*,application/pdf" },
  { kind: "WEBSITE_SHOT", label: "Website screenshots", hint: "Your homepage counts", accept: "image/*" },
  { kind: "SOCIAL_SAMPLE", label: "Social samples", hint: "Posts you liked", accept: "image/*" },
  { kind: "REFERENCE", label: "Reference brands", hint: "Brands you admire", accept: "image/*,application/pdf" },
];

export function BrandUploader({
  initialPercent,
  counts,
}: {
  initialPercent: number;
  counts: Record<string, number>;
}) {
  const [percent, setPercent] = React.useState(initialPercent);
  const [displayed, setDisplayed] = React.useState(initialPercent);
  const [receipts, setReceipts] = React.useState<string[]>([]);
  const [uploadCounts, setUploadCounts] = React.useState(counts);
  const [busyKind, setBusyKind] = React.useState<string | null>(null);
  const [error, setError] = React.useState<string | null>(null);
  const reduced = useReducedMotion();
  const inputRefs = React.useRef<Record<string, HTMLInputElement | null>>({});

  // 420ms count-up toward the current percent
  React.useEffect(() => {
    if (reduced || displayed === percent) {
      setDisplayed(percent);
      return;
    }
    const from = displayed;
    const start = performance.now();
    let raf: number;
    const tick = (now: number) => {
      const t = Math.min(1, (now - start) / 420);
      const eased = 1 - Math.pow(1 - t, 3);
      setDisplayed(Math.round(from + (percent - from) * eased));
      if (t < 1) raf = requestAnimationFrame(tick);
    };
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [percent, reduced]);

  async function upload(kind: string, label: string, files: FileList) {
    setBusyKind(kind);
    setError(null);
    for (const file of Array.from(files)) {
      const body = new FormData();
      body.append("file", file);
      body.append("kind", kind);
      try {
        const res = await fetch("/api/uploads", { method: "POST", body });
        if (!res.ok) {
          const json = (await res.json().catch(() => null)) as { error?: string } | null;
          throw new Error(json?.error ?? "Upload failed.");
        }
        const json = (await res.json()) as { completion: { percent: number } };
        const delta = json.completion.percent - percent;
        setUploadCounts((c) => ({ ...c, [kind]: (c[kind] ?? 0) + 1 }));
        setReceipts((r) => [
          `${delta > 0 ? `+${delta}% · ` : ""}${label.toUpperCase()} RECEIVED`,
          ...r.slice(0, 4),
        ]);
        setPercent(json.completion.percent);
      } catch (e) {
        setError(e instanceof Error ? e.message : "Upload failed.");
      }
    }
    setBusyKind(null);
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-baseline justify-between gap-4">
        <MonoLabel size="sm" className="text-muted-foreground">
          Brand profile
        </MonoLabel>
        <MonoLabel
          size="sm"
          className={cn(displayed < 60 ? "text-warning" : "text-success")}
        >
          {displayed}% complete
        </MonoLabel>
      </div>
      <div className="h-1 w-full overflow-hidden rounded-full bg-sunken">
        <div
          className="h-full rounded-full bg-blueprint transition-[width] duration-420 ease-tdf"
          style={{ width: `${displayed}%` }}
        />
      </div>

      {receipts.length ? (
        <ul aria-live="polite" className="flex flex-col gap-1">
          {receipts.map((r, i) => (
            <li key={`${r}-${i}`}>
              <MonoLabel size="xs" className={i === 0 ? "text-success" : "text-muted-foreground"}>
                {r}
              </MonoLabel>
            </li>
          ))}
        </ul>
      ) : null}
      {error ? (
        <p className="text-caption text-danger" role="alert">
          {error}
        </p>
      ) : null}

      <ul className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
        {KINDS.map((k) => {
          const n = uploadCounts[k.kind] ?? 0;
          return (
            <li
              key={k.kind}
              className="flex flex-col gap-2 rounded-card border border-line bg-raised p-4"
            >
              <div className="flex items-center justify-between gap-2">
                <span className="text-[15px] font-medium">{k.label}</span>
                {n > 0 ? (
                  <MonoLabel size="xs" className="text-success">
                    {n} on file
                  </MonoLabel>
                ) : null}
              </div>
              <p className="text-caption text-muted-foreground">{k.hint}</p>
              <button
                type="button"
                disabled={busyKind === k.kind}
                onClick={() => inputRefs.current[k.kind]?.click()}
                className="mt-1 inline-flex h-8 w-fit items-center gap-2 rounded-full border border-line px-4 text-[13px] text-secondary-foreground transition-colors duration-180 ease-tdf hover:bg-sunken disabled:opacity-50"
              >
                <Upload className="size-3.5" aria-hidden />
                {busyKind === k.kind ? "Uploading…" : n > 0 ? "Add more" : "Upload"}
              </button>
              <input
                ref={(el) => {
                  inputRefs.current[k.kind] = el;
                }}
                type="file"
                multiple
                accept={k.accept}
                className="hidden"
                onChange={(e) => {
                  if (e.target.files?.length) upload(k.kind, k.label, e.target.files);
                  e.target.value = "";
                }}
              />
            </li>
          );
        })}
      </ul>
    </div>
  );
}
