"use client";

import * as React from "react";
import { ArrowUp, Paperclip, X } from "lucide-react";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { MonoLabel } from "@/components/brand/mono-label";
import { Lightbox, type LightboxItem } from "@/components/studio/lightbox";
import { useAutoResizeTextarea } from "@/hooks/use-auto-resize-textarea";
import { createGeneration, type StudioActionState } from "@/lib/studio/actions";
import { ASSET_TYPES } from "@/lib/studio/asset-types";
import { cn } from "@/lib/utils";

/* The intake (BRIEF §5.4): asset type, the brief, attachments.
   The Send arrow is the screen's one Blueprint element — Fog until the
   brief is non-empty. No engine picker, ever. */

type Attachment = LightboxItem & { size: number; uploading?: boolean };

const QUICK_ACTIONS = [
  { label: "Weekend buffet", assetType: "Restaurant or buffet promotion", brief: "A weekend buffet promotion. " },
  { label: "Room offer", assetType: "Room promotion", brief: "A room offer. " },
  { label: "Conference package", assetType: "Conference or event package", brief: "A conference package for corporate groups. " },
  { label: "Brand an image", assetType: "Branding an uploaded image", brief: "Brand the attached image with our identity. " },
  { label: "Follow-up message", assetType: "Customer follow-up message", brief: "A follow-up message to guests who stayed with us. " },
];

const PLACEHOLDER =
  "e.g. A poster for our weekend family buffet. KES 2,500 per adult, children under 12 half price, every Saturday and Sunday from 12:30pm. Aimed at Nairobi families. We want bookings via WhatsApp.";

const initialState: StudioActionState = { ok: false };

export function StudioIntake() {
  const [assetType, setAssetType] = React.useState<string>("");
  const [brief, setBrief] = React.useState("");
  const [attachments, setAttachments] = React.useState<Attachment[]>([]);
  const [lightboxIndex, setLightboxIndex] = React.useState<number | null>(null);
  const [dragOver, setDragOver] = React.useState(false);
  const fileInputRef = React.useRef<HTMLInputElement>(null);
  const formRef = React.useRef<HTMLFormElement>(null);
  const { textareaRef, adjustHeight } = useAutoResizeTextarea({ minHeight: 60, maxHeight: 200 });

  const [state, formAction, pending] = React.useActionState(createGeneration, initialState);

  const ready = brief.trim().length > 0 && assetType && !pending;

  async function uploadFiles(files: FileList | File[]) {
    for (const file of Array.from(files)) {
      if (!/^image\/|^application\/pdf$/.test(file.type)) continue;
      const localUrl = URL.createObjectURL(file);
      const tempId = `tmp-${Math.random().toString(36).slice(2)}`;
      setAttachments((a) => [
        ...a,
        { id: tempId, url: localUrl, name: file.name, size: file.size, intent: "reference", uploading: true },
      ]);
      const body = new FormData();
      body.append("file", file);
      body.append("kind", "REFERENCE");
      try {
        const res = await fetch("/api/uploads", { method: "POST", body });
        if (!res.ok) throw new Error(await res.text());
        const json = (await res.json()) as { asset: { id: string } };
        setAttachments((a) =>
          a.map((att) =>
            att.id === tempId ? { ...att, id: json.asset.id, uploading: false } : att
          )
        );
      } catch {
        setAttachments((a) => a.filter((att) => att.id !== tempId));
        URL.revokeObjectURL(localUrl);
      }
    }
  }

  function removeAttachment(id: string) {
    setAttachments((a) => a.filter((att) => att.id !== id));
  }

  function applyQuickAction(qa: (typeof QUICK_ACTIONS)[number]) {
    setAssetType(qa.assetType);
    setBrief(qa.brief);
    requestAnimationFrame(() => {
      adjustHeight();
      textareaRef.current?.focus();
      const el = textareaRef.current;
      if (el) el.setSelectionRange(el.value.length, el.value.length);
    });
  }

  function onKeyDown(e: React.KeyboardEvent<HTMLTextAreaElement>) {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      if (ready) formRef.current?.requestSubmit();
    }
  }

  const uploadedIds = attachments.filter((a) => !a.uploading && !a.id.startsWith("tmp-"));

  return (
    <form
      ref={formRef}
      action={formAction}
      className="flex w-full max-w-2xl flex-col gap-6"
    >
      <input type="hidden" name="assetType" value={assetType} />
      <input type="hidden" name="brief" value={brief} />
      <input
        type="hidden"
        name="attachmentIds"
        value={JSON.stringify(uploadedIds.map((a) => a.id))}
      />

      {/* 1 — Asset type */}
      <div className="grid gap-2">
        <Label htmlFor="intake-type">What do you want to create?</Label>
        <Select value={assetType} onValueChange={setAssetType}>
          <SelectTrigger id="intake-type" className="w-full">
            <SelectValue placeholder="Choose an asset type" />
          </SelectTrigger>
          <SelectContent>
            {ASSET_TYPES.map((t) => (
              <SelectItem key={t.label} value={t.label}>
                {t.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* 2 — The brief */}
      <div className="grid gap-2">
        <Label htmlFor="intake-brief">
          Describe the asset you want to create in detail.
        </Label>
        <div
          className={cn(
            "rounded-panel border bg-raised transition-colors duration-180 ease-tdf",
            dragOver ? "border-tdf-400" : "border-line"
          )}
          onDragOver={(e) => {
            e.preventDefault();
            setDragOver(true);
          }}
          onDragLeave={() => setDragOver(false)}
          onDrop={(e) => {
            e.preventDefault();
            setDragOver(false);
            uploadFiles(e.dataTransfer.files);
          }}
        >
          <textarea
            id="intake-brief"
            ref={textareaRef}
            value={brief}
            placeholder={PLACEHOLDER}
            onChange={(e) => {
              setBrief(e.target.value);
              adjustHeight();
            }}
            onKeyDown={onKeyDown}
            onPaste={(e) => {
              const files = [...e.clipboardData.items]
                .filter((i) => i.kind === "file")
                .map((i) => i.getAsFile())
                .filter((f): f is File => Boolean(f));
              if (files.length) uploadFiles(files);
            }}
            className="min-h-[60px] w-full resize-none bg-transparent px-4 py-3 text-[15px] leading-relaxed outline-none placeholder:text-muted-foreground"
          />

          {attachments.length ? (
            <ul className="flex flex-wrap gap-2 px-4 pb-1">
              {attachments.map((att, i) => (
                <li
                  key={att.id}
                  className="flex items-center gap-2 rounded-input border border-line bg-background py-1 pl-1 pr-2"
                >
                  <button
                    type="button"
                    onClick={() => setLightboxIndex(i)}
                    aria-label={`Open ${att.name}`}
                    className="block"
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={att.url}
                      alt=""
                      className={cn(
                        "size-8 rounded-chip object-cover",
                        att.uploading && "opacity-40"
                      )}
                    />
                  </button>
                  <span className="max-w-32 truncate text-caption text-secondary-foreground">
                    {att.name}
                  </span>
                  <span className="text-caption text-muted-foreground">
                    {Math.max(1, Math.round(att.size / 1024))}KB
                  </span>
                  <button
                    type="button"
                    aria-label={`Remove ${att.name}`}
                    onClick={() => removeAttachment(att.id)}
                    className="text-muted-foreground transition-colors duration-120 ease-tdf hover:text-foreground"
                  >
                    <X className="size-3.5" aria-hidden />
                  </button>
                </li>
              ))}
            </ul>
          ) : null}

          <div className="flex items-center justify-between border-t border-line px-3 py-2">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="flex items-center gap-2 rounded-full px-3 py-1.5 text-[13px] text-muted-foreground transition-colors duration-180 ease-tdf hover:bg-sunken hover:text-foreground"
            >
              <Paperclip className="size-4" aria-hidden />
              Attach
            </button>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept="image/*,application/pdf"
              className="hidden"
              onChange={(e) => {
                if (e.target.files) uploadFiles(e.target.files);
                e.target.value = "";
              }}
            />
            <button
              type="submit"
              disabled={!ready}
              aria-label="Create"
              className={cn(
                "flex size-9 items-center justify-center rounded-full transition-colors duration-180 ease-tdf",
                ready
                  ? "bg-blueprint text-tdf-025 hover:bg-accent-600 dark:text-tdf-950"
                  : "bg-sunken text-muted-foreground"
              )}
            >
              <ArrowUp className="size-4" aria-hidden />
            </button>
          </div>
        </div>
        <p className="text-caption text-muted-foreground">
          Include who it&apos;s for, the offer, the price, the dates, the
          location, the tone, the platform, and how guests should respond.
        </p>
        {state.error ? (
          <p className="text-caption text-danger" role="alert">
            {state.error}
          </p>
        ) : null}
      </div>

      {/* Quick actions */}
      <div className="flex flex-wrap gap-2">
        {QUICK_ACTIONS.map((qa) => (
          <button
            key={qa.label}
            type="button"
            onClick={() => applyQuickAction(qa)}
            className="rounded-full border border-line bg-raised px-4 py-1.5 text-[13px] text-secondary-foreground transition-colors duration-180 ease-tdf hover:bg-sunken"
          >
            {qa.label}
          </button>
        ))}
      </div>

      <MonoLabel size="xs" className="text-muted-foreground">
        Enter to create · Shift+Enter for a new line
      </MonoLabel>

      <Lightbox
        items={attachments}
        index={lightboxIndex}
        onClose={() => setLightboxIndex(null)}
        onNavigate={setLightboxIndex}
        onIntentChange={(id, intent) =>
          setAttachments((a) =>
            a.map((att) => (att.id === id ? { ...att, intent } : att))
          )
        }
      />
    </form>
  );
}
