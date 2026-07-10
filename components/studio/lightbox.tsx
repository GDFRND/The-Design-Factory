"use client";

import * as React from "react";
import { ChevronLeft, ChevronRight, Minus, Plus, X } from "lucide-react";
import { Dialog, DialogContent, DialogTitle } from "@/components/ui/dialog";
import { MonoLabel } from "@/components/brand/mono-label";
import { cn } from "@/lib/utils";

/* Attachment lightbox (BRIEF §5.4 — "this viewer is not optional").
   Zoom, pan, arrow-key paging, and the Use-as-reference / Brand-this-
   image toggle per attachment. */

export type LightboxItem = {
  id: string;
  url: string;
  name: string;
  intent: "reference" | "brand";
};

export function Lightbox({
  items,
  index,
  onClose,
  onNavigate,
  onIntentChange,
}: {
  items: LightboxItem[];
  index: number | null;
  onClose: () => void;
  onNavigate: (index: number) => void;
  onIntentChange: (id: string, intent: LightboxItem["intent"]) => void;
}) {
  const [zoom, setZoom] = React.useState(1);
  const [pan, setPan] = React.useState({ x: 0, y: 0 });
  const dragging = React.useRef<{ x: number; y: number } | null>(null);

  const item = index === null ? null : items[index];

  React.useEffect(() => {
    setZoom(1);
    setPan({ x: 0, y: 0 });
  }, [index]);

  React.useEffect(() => {
    if (index === null) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" && index < items.length - 1) onNavigate(index + 1);
      if (e.key === "ArrowLeft" && index > 0) onNavigate(index - 1);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [index, items.length, onNavigate]);

  if (!item) return null;

  return (
    <Dialog open onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className="flex h-[85svh] max-w-4xl flex-col gap-4 p-4"
        aria-describedby={undefined}
      >
        <DialogTitle className="sr-only">{item.name}</DialogTitle>

        <div className="flex items-center justify-between gap-4 pr-8">
          <MonoLabel size="sm" className="truncate text-muted-foreground">
            {item.name}
          </MonoLabel>
          <div className="flex items-center gap-1">
            <button
              type="button"
              aria-label="Zoom out"
              onClick={() => setZoom((z) => Math.max(1, z - 0.5))}
              className="flex size-8 items-center justify-center rounded-full border border-line transition-colors duration-180 ease-tdf hover:bg-sunken"
            >
              <Minus className="size-4" aria-hidden />
            </button>
            <button
              type="button"
              aria-label="Zoom in"
              onClick={() => setZoom((z) => Math.min(4, z + 0.5))}
              className="flex size-8 items-center justify-center rounded-full border border-line transition-colors duration-180 ease-tdf hover:bg-sunken"
            >
              <Plus className="size-4" aria-hidden />
            </button>
          </div>
        </div>

        <div
          className="relative flex-1 overflow-hidden rounded-card border border-line bg-sunken"
          onPointerDown={(e) => {
            if (zoom === 1) return;
            dragging.current = { x: e.clientX - pan.x, y: e.clientY - pan.y };
          }}
          onPointerMove={(e) => {
            if (!dragging.current) return;
            setPan({
              x: e.clientX - dragging.current.x,
              y: e.clientY - dragging.current.y,
            });
          }}
          onPointerUp={() => (dragging.current = null)}
          onPointerLeave={() => (dragging.current = null)}
          style={{ cursor: zoom > 1 ? "grab" : "default", touchAction: "none" }}
        >
          {/* Plain img: attachment previews come from signed, short-lived
              URLs (often blob: object URLs), which next/image can't
              optimize. Generated output uses next/image. */}
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={item.url}
            alt={item.name}
            className="absolute inset-0 m-auto max-h-full max-w-full select-none object-contain transition-transform duration-120 ease-tdf"
            style={{ transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})` }}
            draggable={false}
          />

          {index !== null && index > 0 ? (
            <button
              type="button"
              aria-label="Previous image"
              onClick={() => onNavigate(index - 1)}
              className="absolute left-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-background/80 transition-colors duration-180 ease-tdf hover:bg-background"
            >
              <ChevronLeft className="size-4" aria-hidden />
            </button>
          ) : null}
          {index !== null && index < items.length - 1 ? (
            <button
              type="button"
              aria-label="Next image"
              onClick={() => onNavigate(index + 1)}
              className="absolute right-3 top-1/2 flex size-9 -translate-y-1/2 items-center justify-center rounded-full border border-line bg-background/80 transition-colors duration-180 ease-tdf hover:bg-background"
            >
              <ChevronRight className="size-4" aria-hidden />
            </button>
          ) : null}
        </div>

        <div
          role="radiogroup"
          aria-label="How should we use this image?"
          className="grid grid-cols-2 gap-0.5 rounded-input border border-line p-0.5"
        >
          {(
            [
              ["reference", "Use as reference"],
              ["brand", "Brand this image"],
            ] as const
          ).map(([intent, label]) => (
            <button
              key={intent}
              role="radio"
              aria-checked={item.intent === intent}
              onClick={() => onIntentChange(item.id, intent)}
              className={cn(
                "h-9 rounded-chip font-mono text-[11px] font-medium uppercase tracking-[0.14em] transition-colors duration-180 ease-tdf",
                item.intent === intent
                  ? "bg-foreground text-background"
                  : "text-muted-foreground hover:text-foreground"
              )}
            >
              {label}
            </button>
          ))}
        </div>
      </DialogContent>
    </Dialog>
  );
}
