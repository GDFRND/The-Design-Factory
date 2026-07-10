"use client";

import * as React from "react";
import Image from "next/image";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Download, Search, Send } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogTitle,
} from "@/components/ui/dialog";
import { MonoLabel } from "@/components/brand/mono-label";
import type { ExpandedPrompt } from "@/lib/ai/expanded-prompt";
import { requestApproval } from "@/lib/studio/approval-actions";
import { cn } from "@/lib/utils";

/* Creation workspace (BRIEF §5.5). Left rail: the editable plan.
   Centre: variants by outputKind — IMAGE gallery / TEXT document /
   COMPOSITE split view. Right rail: history with prompt search,
   approval status, download. */

type CopyBlocks = {
  headline: string;
  subhead: string;
  body: string;
  cta: string;
  sections: { heading: string; body: string }[];
};

type ApprovalInfo = {
  id: string;
  stage: string;
  decision: string;
  reviewerName: string;
  note: string | null;
};

type Variant = {
  id: string;
  imageUrl: string | null;
  copy: CopyBlocks | null;
  selected: boolean;
  refinements: { instruction: string; at: string }[];
  createdAt: string;
  approvals: ApprovalInfo[];
};

type RecentGeneration = {
  id: string;
  assetType: string;
  status: string;
  brief: string;
  createdAt: string;
};

const REFINE_CHIPS = [
  "More premium",
  "More local",
  "More corporate",
  "More youthful",
  "More luxurious",
  "More family-friendly",
  "Apply brand colours",
  "Use different image",
  "Regenerate",
];

const LOADING_CAPTIONS = [
  "Composing the layout…",
  "Setting the type…",
  "Placing the offer…",
  "Checking the brand…",
];

type Phase = "expanding" | "plan" | "generating" | "variants" | "failed";

export function CreationWorkspace({
  generation,
  initialVariants,
  recent,
  reviewers,
}: {
  generation: {
    id: string;
    assetType: string;
    outputKind: string;
    rawBrief: string;
    status: string;
    plan: ExpandedPrompt | null;
  };
  initialVariants: Variant[];
  recent: RecentGeneration[];
  reviewers: {
    approvers: { id: string; name: string }[];
    assistant: { id: string; name: string } | null;
  };
}) {
  const router = useRouter();
  const [plan, setPlan] = React.useState<ExpandedPrompt | null>(generation.plan);
  const [variants, setVariants] = React.useState<Variant[]>(initialVariants);
  const [phase, setPhase] = React.useState<Phase>(
    initialVariants.length ? "variants" : generation.plan ? "plan" : "expanding"
  );
  const [selectedId, setSelectedId] = React.useState<string | null>(
    initialVariants[0]?.id ?? null
  );
  const [error, setError] = React.useState<string | null>(null);
  const [busy, setBusy] = React.useState(false);
  const [freeText, setFreeText] = React.useState("");
  const [search, setSearch] = React.useState("");
  const [approvalOpen, setApprovalOpen] = React.useState(false);

  const selected = variants.find((v) => v.id === selectedId) ?? null;

  // Expand on first visit.
  React.useEffect(() => {
    if (phase !== "expanding") return;
    let cancelled = false;
    (async () => {
      try {
        const res = await fetch(`/api/generations/${generation.id}/expand`, {
          method: "POST",
        });
        const json = await res.json();
        if (!res.ok) throw new Error(json.error ?? "Expansion failed.");
        if (!cancelled) {
          setPlan(json.prompt);
          setPhase("plan");
        }
      } catch (e) {
        if (!cancelled) {
          setError(e instanceof Error ? e.message : "Expansion failed.");
          setPhase("failed");
        }
      }
    })();
    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  async function create() {
    if (!plan) return;
    setPhase("generating");
    setError(null);
    try {
      await fetch(`/api/generations/${generation.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt: plan }),
      });
      const res = await fetch(`/api/generations/${generation.id}/generate`, {
        method: "POST",
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Generation failed.");
      const withApprovals = (json.variants as Omit<Variant, "approvals">[]).map((v) => ({
        ...v,
        approvals: [],
      }));
      setVariants(withApprovals);
      setSelectedId(withApprovals[0]?.id ?? null);
      setPhase("variants");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Generation failed.");
      setPhase("plan");
    }
  }

  async function refine(instruction: string) {
    if (!selected || busy) return;
    setBusy(true);
    setError(null);
    try {
      const res = await fetch(`/api/variants/${selected.id}/refine`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ instruction }),
      });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error ?? "Refinement failed.");
      setVariants((vs) =>
        vs.map((v) =>
          v.id === selected.id ? { ...json.variant, approvals: v.approvals } : v
        )
      );
      setFreeText("");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Refinement failed.");
    } finally {
      setBusy(false);
    }
  }

  function download() {
    if (!selected) return;
    if (selected.imageUrl) {
      const a = document.createElement("a");
      a.href = selected.imageUrl;
      a.download = `${generation.assetType.toLowerCase().replace(/\s+/g, "-")}.webp`;
      a.click();
    }
    if (selected.copy) {
      const c = selected.copy;
      const md = [
        `# ${c.headline}`,
        c.subhead,
        "",
        c.body,
        ...c.sections.flatMap((s) => ["", `## ${s.heading}`, s.body]),
        "",
        `**${c.cta}**`,
      ].join("\n");
      const blob = new Blob([md], { type: "text/markdown" });
      const a = document.createElement("a");
      a.href = URL.createObjectURL(blob);
      a.download = `${generation.assetType.toLowerCase().replace(/\s+/g, "-")}-copy.md`;
      a.click();
      URL.revokeObjectURL(a.href);
    }
  }

  const filteredRecent = recent.filter(
    (r) =>
      !search ||
      r.assetType.toLowerCase().includes(search.toLowerCase()) ||
      r.brief.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <main className="container-tdf grid gap-10 py-10 lg:grid-cols-[280px_minmax(0,1fr)_240px]">
      {/* Left rail — the plan, still editable */}
      <aside className="flex flex-col gap-4">
        <MonoLabel size="sm" className="text-muted-foreground">
          {generation.assetType} · {generation.outputKind}
        </MonoLabel>
        {plan ? (
          <PlanForm
            plan={plan}
            onChange={setPlan}
            compact={phase === "variants" || phase === "generating"}
          />
        ) : (
          <p className="text-caption text-muted-foreground">
            Building the creative plan…
          </p>
        )}
        {phase === "variants" ? (
          <MonoLabel size="xs" className="text-muted-foreground">
            {variants.length} variant{variants.length === 1 ? "" : "s"}
          </MonoLabel>
        ) : null}
      </aside>

      {/* Centre */}
      <section className="flex min-h-[60svh] flex-col gap-6">
        {error ? (
          <p className="rounded-card border border-danger/30 bg-danger/5 p-3 text-caption text-danger" role="alert">
            {error}
          </p>
        ) : null}

        {phase === "expanding" ? (
          <LoadingRail label="Reading your brief…" />
        ) : phase === "generating" ? (
          <LoadingRail label={undefined} />
        ) : phase === "plan" && plan ? (
          <div className="flex flex-col gap-6">
            <h1 className="text-h1">Review the plan, then create.</h1>
            {plan.missingDetails.length ? (
              <ul className="flex flex-col gap-2">
                {plan.missingDetails.map((m) => (
                  <li
                    key={m}
                    className="rounded-input border border-warning/40 bg-warning/5 px-3 py-2 text-[14px] text-warning"
                  >
                    {m}
                  </li>
                ))}
              </ul>
            ) : null}
            {/* The only Blueprint element on this screen. */}
            <Button variant="accent" size="lg" onClick={create} className="self-start">
              Create
            </Button>
          </div>
        ) : phase === "variants" && selected ? (
          <>
            {generation.outputKind === "IMAGE" ? (
              <ImageGallery
                variants={variants}
                selectedId={selectedId}
                onSelect={setSelectedId}
              />
            ) : generation.outputKind === "TEXT" ? (
              <TextEditorView variant={selected} onRefine={refine} busy={busy} />
            ) : (
              <CompositeView
                variants={variants}
                selected={selected}
                onSelect={setSelectedId}
              />
            )}

            {/* Refinement chips + free text (§4.6) */}
            <div className="flex flex-col gap-3 border-t border-line pt-4">
              <div className="flex flex-wrap gap-2">
                {REFINE_CHIPS.map((chip) => (
                  <button
                    key={chip}
                    type="button"
                    disabled={busy}
                    onClick={() => refine(chip)}
                    className="rounded-full border border-line bg-raised px-4 py-1.5 text-[13px] text-(--fg-muted) transition-colors duration-180 ease-tdf hover:text-foreground disabled:opacity-50"
                  >
                    {chip}
                  </button>
                ))}
              </div>
              <form
                onSubmit={(e) => {
                  e.preventDefault();
                  if (freeText.trim()) refine(freeText.trim());
                }}
                className="flex gap-2"
              >
                <Input
                  value={freeText}
                  onChange={(e) => setFreeText(e.target.value)}
                  placeholder={busy ? "Refining…" : "Describe a change…"}
                  disabled={busy}
                />
                <Button type="submit" variant="outline" disabled={busy || !freeText.trim()}>
                  Refine
                </Button>
              </form>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={download}>
                  <Download aria-hidden /> Download
                </Button>
                <Button
                  variant="accent"
                  size="sm"
                  onClick={() => setApprovalOpen(true)}
                >
                  <Send aria-hidden /> Send for approval
                </Button>
                {selected.refinements.length ? (
                  <MonoLabel size="xs" className="text-muted-foreground">
                    {selected.refinements.length} refinement
                    {selected.refinements.length === 1 ? "" : "s"}
                  </MonoLabel>
                ) : null}
              </div>
            </div>

            {/* Meta strip — format and dimensions only. */}
            <MonoLabel size="xs" className="text-muted-foreground">
              {plan?.outputFormat || "Custom format"}
            </MonoLabel>
          </>
        ) : phase === "failed" ? (
          <div className="flex flex-col items-start gap-4">
            <p className="text-body text-secondary-foreground">
              We couldn&apos;t build the plan for this brief.
            </p>
            <Button variant="outline" onClick={() => router.refresh()}>
              Try again
            </Button>
          </div>
        ) : null}
      </section>

      {/* Right rail — history, approval status, download */}
      <aside className="flex flex-col gap-6">
        {selected?.approvals.length ? (
          <div className="flex flex-col gap-2">
            <MonoLabel size="sm" className="text-muted-foreground">
              Approval
            </MonoLabel>
            {selected.approvals.map((a) => (
              <div key={a.id} className="rounded-card border border-line bg-raised p-3">
                <MonoLabel
                  size="xs"
                  className={cn(
                    a.decision === "APPROVED"
                      ? "text-success"
                      : a.decision === "CHANGES_REQUESTED"
                        ? "text-danger"
                        : "text-warning"
                  )}
                >
                  {a.decision === "PENDING"
                    ? `Pending · Awaiting ${a.reviewerName}`
                    : `${a.decision.replace("_", " ")} · ${a.reviewerName}`}
                </MonoLabel>
                {a.note ? (
                  <p className="mt-1 text-caption text-secondary-foreground">{a.note}</p>
                ) : null}
              </div>
            ))}
          </div>
        ) : null}

        <div className="flex flex-col gap-3">
          <MonoLabel size="sm" className="text-muted-foreground">
            History
          </MonoLabel>
          <div className="relative">
            <Search
              aria-hidden
              className="pointer-events-none absolute left-3 top-1/2 size-3.5 -translate-y-1/2 text-muted-foreground"
            />
            <Input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search briefs"
              className="h-8 pl-8 text-[13px]"
              aria-label="Search past briefs"
            />
          </div>
          <ul className="flex flex-col gap-1">
            {filteredRecent.map((r) => (
              <li key={r.id}>
                <Link
                  href={`/studio/${r.id}`}
                  className="block rounded-input px-2 py-1.5 transition-colors duration-180 ease-tdf hover:bg-sunken"
                >
                  <span className="block truncate text-[13px]">{r.assetType}</span>
                  <span className="block truncate text-caption text-muted-foreground">
                    {r.brief}
                  </span>
                </Link>
              </li>
            ))}
            {!filteredRecent.length ? (
              <li className="text-caption text-muted-foreground">Nothing here yet.</li>
            ) : null}
          </ul>
        </div>
      </aside>

      {selected ? (
        <ApprovalDialog
          open={approvalOpen}
          onClose={() => setApprovalOpen(false)}
          variantId={selected.id}
          reviewers={reviewers}
          onDone={() => {
            setApprovalOpen(false);
            router.refresh();
          }}
        />
      ) : null}
    </main>
  );
}

/* ------------------------------------------------------------------ */

function LoadingRail({ label }: { label?: string }) {
  const [caption, setCaption] = React.useState(0);
  React.useEffect(() => {
    const t = setInterval(() => setCaption((c) => (c + 1) % LOADING_CAPTIONS.length), 1800);
    return () => clearInterval(t);
  }, []);
  return (
    <div className="flex flex-1 flex-col items-center justify-center gap-6">
      <span
        aria-hidden
        className="size-10 animate-spin rounded-full border-2 border-(--fg-subtle) border-t-transparent [animation-duration:1.2s]"
      />
      <div className="h-1 w-56 overflow-hidden rounded-full bg-(--line)">
        <div className="h-full w-1/3 animate-pulse rounded-full bg-blueprint" />
      </div>
      <MonoLabel size="sm" className="text-muted-foreground" aria-live="polite">
        {label ?? LOADING_CAPTIONS[caption]}
      </MonoLabel>
    </div>
  );
}

function PlanField({
  label,
  value,
  onChange,
  multiline,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  multiline?: boolean;
}) {
  const id = React.useId();
  return (
    <div className="grid gap-1">
      <Label htmlFor={id} className="text-caption text-muted-foreground">
        {label}
      </Label>
      {multiline ? (
        <Textarea
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          rows={2}
          className="text-[13px]"
        />
      ) : (
        <Input
          id={id}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="h-8 text-[13px]"
        />
      )}
    </div>
  );
}

function PlanForm({
  plan,
  onChange,
  compact,
}: {
  plan: ExpandedPrompt;
  onChange: (p: ExpandedPrompt) => void;
  compact: boolean;
}) {
  const [open, setOpen] = React.useState(!compact);
  React.useEffect(() => setOpen(!compact), [compact]);

  const set = (patch: Partial<ExpandedPrompt>) => onChange({ ...plan, ...patch });
  const setOffer = (patch: Partial<ExpandedPrompt["offerDetails"]>) =>
    onChange({ ...plan, offerDetails: { ...plan.offerDetails, ...patch } });

  if (!open) {
    return (
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="rounded-card border border-line bg-raised p-3 text-left transition-colors duration-180 ease-tdf hover:bg-sunken"
      >
        <span className="block text-[13px] font-medium">{plan.keyMessage || "The plan"}</span>
        <span className="mt-1 block text-caption text-muted-foreground">
          Tap to edit the creative plan
        </span>
      </button>
    );
  }

  return (
    <div className="flex flex-col gap-3">
      <PlanField label="Audience" value={plan.targetAudience} onChange={(v) => set({ targetAudience: v })} />
      <PlanField label="Objective" value={plan.marketingObjective} onChange={(v) => set({ marketingObjective: v })} />
      <PlanField label="Key message" value={plan.keyMessage} onChange={(v) => set({ keyMessage: v })} multiline />
      <PlanField label="Price" value={plan.offerDetails.price ?? ""} onChange={(v) => setOffer({ price: v })} />
      <PlanField label="Validity" value={plan.offerDetails.validity ?? ""} onChange={(v) => setOffer({ validity: v })} />
      <PlanField
        label="Inclusions"
        value={(plan.offerDetails.inclusions ?? []).join(", ")}
        onChange={(v) =>
          setOffer({ inclusions: v.split(",").map((s) => s.trim()).filter(Boolean) })
        }
      />
      <PlanField label="Tone of voice" value={plan.toneOfVoice} onChange={(v) => set({ toneOfVoice: v })} />
      {plan.outputKind !== "TEXT" ? (
        <PlanField
          label="Visual direction"
          value={plan.visualDirection ?? ""}
          onChange={(v) => set({ visualDirection: v })}
          multiline
        />
      ) : null}
      <PlanField label="Layout" value={plan.suggestedLayout} onChange={(v) => set({ suggestedLayout: v })} />
      <PlanField label="Brand application" value={plan.brandApplication} onChange={(v) => set({ brandApplication: v })} multiline />
      <PlanField label="Call to action" value={plan.callToAction} onChange={(v) => set({ callToAction: v })} />
      <PlanField label="Format" value={plan.outputFormat} onChange={(v) => set({ outputFormat: v })} />
    </div>
  );
}

function ImageGallery({
  variants,
  selectedId,
  onSelect,
}: {
  variants: Variant[];
  selectedId: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div className="brand-canvas grid grid-cols-2 gap-4 p-4">
      {variants.map((v, i) =>
        v.imageUrl ? (
          <button
            key={v.id}
            type="button"
            onClick={() => onSelect(v.id)}
            aria-pressed={v.id === selectedId}
            className={cn(
              "relative aspect-[4/5] overflow-hidden rounded-card border transition-[border-color,box-shadow] duration-180 ease-tdf",
              v.id === selectedId
                ? "border-(--line-strong) shadow-(--lift-1)"
                : "border-(--line) hover:border-(--line-strong)"
            )}
          >
            <Image
              src={v.imageUrl}
              alt={`Variant ${i + 1}`}
              fill
              sizes="(min-width: 1024px) 30vw, 45vw"
              className="object-cover"
              unoptimized
            />
            <span className="absolute left-2 top-2 rounded-chip bg-background/85 px-1.5 py-0.5 font-mono text-[10px] uppercase tracking-[0.12em] text-secondary-foreground">
              {String(i + 1).padStart(2, "0")}
            </span>
          </button>
        ) : null
      )}
    </div>
  );
}

const TONE_CHIPS = ["More premium", "More local", "Warmer", "Shorter", "More direct"];

function TextEditorView({
  variant,
  onRefine,
  busy,
}: {
  variant: Variant;
  onRefine: (instruction: string) => void;
  busy: boolean;
}) {
  const copy = variant.copy;
  if (!copy) return null;
  return (
    <div className="brand-canvas grid gap-6 p-4 lg:grid-cols-[120px_minmax(0,1fr)] lg:p-6">
      <div className="flex flex-row flex-wrap gap-2 lg:flex-col">
        {TONE_CHIPS.map((t) => (
          <button
            key={t}
            type="button"
            disabled={busy}
            onClick={() => onRefine(t)}
            className="rounded-full border border-line bg-raised px-3 py-1 text-caption text-(--fg-muted) transition-colors duration-180 ease-tdf hover:text-foreground disabled:opacity-50"
          >
            {t}
          </button>
        ))}
      </div>
      <article
        contentEditable
        suppressContentEditableWarning
        className="max-w-[68ch] rounded-card border border-line bg-raised p-8 leading-relaxed outline-none focus-visible:outline-2 focus-visible:outline-offset-2"
        aria-label="Document editor"
      >
        <h2 className="text-h2">{copy.headline}</h2>
        {copy.subhead ? (
          <p className="mt-1 text-[15px] text-muted-foreground">{copy.subhead}</p>
        ) : null}
        <p className="mt-4 whitespace-pre-wrap text-body text-secondary-foreground">
          {copy.body}
        </p>
        {copy.sections.map((s, i) => (
          <React.Fragment key={i}>
            <h3 className="mt-5 text-[17px] font-semibold">{s.heading}</h3>
            <p className="mt-1 whitespace-pre-wrap text-body text-secondary-foreground">
              {s.body}
            </p>
          </React.Fragment>
        ))}
        <p className="mt-5 font-medium">{copy.cta}</p>
      </article>
    </div>
  );
}

function CompositeView({
  variants,
  selected,
  onSelect,
}: {
  variants: Variant[];
  selected: Variant;
  onSelect: (id: string) => void;
}) {
  const copy = selected.copy;
  return (
    <div className="flex flex-col gap-4">
      <div className="brand-canvas grid gap-6 p-4 lg:grid-cols-2">
        <div className="relative aspect-[4/5] overflow-hidden rounded-card border border-line">
          {selected.imageUrl ? (
            <Image
              src={selected.imageUrl}
              alt="Artwork"
              fill
              sizes="(min-width: 1024px) 40vw, 90vw"
              className="object-cover"
              unoptimized
            />
          ) : null}
        </div>
        {copy ? (
          <div className="flex flex-col gap-4 rounded-card border border-line bg-raised p-6">
            <MonoLabel size="xs" className="text-muted-foreground">
              Copy blocks
            </MonoLabel>
            <h2 className="text-h2">{copy.headline}</h2>
            {copy.subhead ? (
              <p className="text-[15px] text-muted-foreground">{copy.subhead}</p>
            ) : null}
            <p className="whitespace-pre-wrap text-[15px] leading-relaxed text-secondary-foreground">
              {copy.body}
            </p>
            {copy.sections.map((s, i) => (
              <div key={i}>
                <h3 className="text-[15px] font-semibold">{s.heading}</h3>
                <p className="mt-1 whitespace-pre-wrap text-[15px] text-secondary-foreground">
                  {s.body}
                </p>
              </div>
            ))}
            <p className="font-medium">{copy.cta}</p>
          </div>
        ) : null}
      </div>
      {variants.length > 1 ? (
        <div className="flex gap-2">
          {variants.map((v, i) => (
            <button
              key={v.id}
              type="button"
              onClick={() => onSelect(v.id)}
              aria-pressed={v.id === selected.id}
              className={cn(
                "rounded-full border px-4 py-1 font-mono text-[11px] uppercase tracking-[0.12em] transition-colors duration-180 ease-tdf",
                v.id === selected.id
                  ? "border-foreground text-foreground"
                  : "border-line text-muted-foreground hover:text-foreground"
              )}
            >
              Variant {String(i + 1).padStart(2, "0")}
            </button>
          ))}
        </div>
      ) : null}
    </div>
  );
}

/* ------------------------------------------------------------- approval */

function ApprovalDialog({
  open,
  onClose,
  variantId,
  reviewers,
  onDone,
}: {
  open: boolean;
  onClose: () => void;
  variantId: string;
  reviewers: {
    approvers: { id: string; name: string }[];
    assistant: { id: string; name: string } | null;
  };
  onDone: () => void;
}) {
  const [stage, setStage] = React.useState<"SUPPORT_REVIEW" | "HOTEL_APPROVAL">(
    "HOTEL_APPROVAL"
  );
  const [reviewerId, setReviewerId] = React.useState(reviewers.approvers[0]?.id ?? "");
  const [note, setNote] = React.useState("");
  const [pending, setPending] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  async function submit() {
    setPending(true);
    setError(null);
    const result = await requestApproval({
      variantId,
      stage,
      reviewerId: stage === "SUPPORT_REVIEW" ? reviewers.assistant?.id ?? "" : reviewerId,
      note: note.trim() || undefined,
    });
    setPending(false);
    if (result.ok) onDone();
    else setError(result.error ?? "Couldn't send for approval.");
  }

  if (!open) return null;

  return (
    <Dialog open onOpenChange={(o) => !o && onClose()}>
      <DialogContent aria-describedby={undefined}>
        <DialogTitle className="text-h2">Send for approval</DialogTitle>
        <DialogDescription className="text-[15px] text-muted-foreground">
          Support review is optional. Hotel approval is required before this
          can be published.
        </DialogDescription>

        <div
          role="radiogroup"
          aria-label="Approval stage"
          className="grid grid-cols-1 gap-2"
        >
          <button
            role="radio"
            aria-checked={stage === "SUPPORT_REVIEW"}
            disabled={!reviewers.assistant}
            onClick={() => setStage("SUPPORT_REVIEW")}
            className={cn(
              "rounded-card border p-4 text-left transition-colors duration-180 ease-tdf disabled:opacity-40",
              stage === "SUPPORT_REVIEW" ? "border-foreground" : "border-line hover:bg-sunken"
            )}
          >
            <MonoLabel size="xs">01 · Support review</MonoLabel>
            <p className="mt-1 text-[14px] text-secondary-foreground">
              {reviewers.assistant
                ? `${reviewers.assistant.name} checks it first. Optional.`
                : "No assistant assigned to this workspace yet."}
            </p>
          </button>
          <button
            role="radio"
            aria-checked={stage === "HOTEL_APPROVAL"}
            onClick={() => setStage("HOTEL_APPROVAL")}
            className={cn(
              "rounded-card border p-4 text-left transition-colors duration-180 ease-tdf",
              stage === "HOTEL_APPROVAL" ? "border-foreground" : "border-line hover:bg-sunken"
            )}
          >
            <MonoLabel size="xs">02 · Hotel approval</MonoLabel>
            <p className="mt-1 text-[14px] text-secondary-foreground">
              Required before download-for-publishing.
            </p>
          </button>
        </div>

        {stage === "HOTEL_APPROVAL" ? (
          <div className="grid gap-1.5">
            <Label htmlFor="apv-reviewer" className="text-[13px] text-secondary-foreground">
              Approver
            </Label>
            <select
              id="apv-reviewer"
              value={reviewerId}
              onChange={(e) => setReviewerId(e.target.value)}
              className="h-10 rounded-input border border-line bg-raised px-3 text-[15px]"
            >
              {reviewers.approvers.map((r) => (
                <option key={r.id} value={r.id}>
                  {r.name}
                </option>
              ))}
            </select>
          </div>
        ) : null}

        <div className="grid gap-1.5">
          <Label htmlFor="apv-note" className="text-[13px] text-secondary-foreground">
            Note (optional)
          </Label>
          <Textarea
            id="apv-note"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="Anything the reviewer should know…"
          />
        </div>

        {error ? (
          <p className="text-caption text-danger" role="alert">{error}</p>
        ) : null}

        <div className="flex justify-end gap-2">
          <Button variant="ghost" onClick={onClose}>
            Cancel
          </Button>
          <Button variant="accent" onClick={submit} disabled={pending}>
            {pending ? "Sending…" : "Send"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}
