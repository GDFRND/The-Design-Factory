"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MonoLabel } from "@/components/brand/mono-label";
import { confirmBrandSystem, type StudioActionState } from "@/lib/studio/actions";

/* Provisional brand system spec sheet (BRIEF §5.6). Inferred parts are
   labelled PROVISIONAL in mono until the hotel confirms. Nothing is
   treated as approved until confirmed. */

const initialState: StudioActionState = { ok: false };

export function ProvisionalSystem({
  palette,
  provisional,
  toneOfVoice,
  imageStyle,
}: {
  palette: string[];
  provisional: boolean;
  toneOfVoice: string | null;
  imageStyle: string | null;
}) {
  const [state, formAction, pending] = React.useActionState(
    confirmBrandSystem,
    initialState
  );

  const confirmed = state.ok || !provisional;

  return (
    <div className="flex flex-col gap-5 rounded-panel border border-line bg-raised p-6">
      <div className="flex items-center justify-between gap-4">
        <MonoLabel size="sm" className="text-muted-foreground">
          Brand system
        </MonoLabel>
        <MonoLabel size="xs" className={confirmed ? "text-success" : "text-warning"}>
          {confirmed ? "Confirmed" : "Provisional"}
        </MonoLabel>
      </div>

      {palette.length ? (
        <div className="flex flex-col gap-2">
          <span className="text-[13px] text-secondary-foreground">
            Palette, sampled from your logo
          </span>
          <div className="flex gap-2">
            {palette.map((hex) => (
              <span key={hex} className="flex flex-col items-center gap-1">
                <span
                  className="size-10 rounded-chip border border-line"
                  style={{ backgroundColor: hex }}
                  aria-label={hex}
                />
                <MonoLabel size="xs" className="text-muted-foreground">
                  {hex}
                </MonoLabel>
              </span>
            ))}
          </div>
        </div>
      ) : (
        <p className="text-caption text-muted-foreground">
          Upload a PNG logo and we&apos;ll sample a provisional palette from it.
        </p>
      )}

      <form action={formAction} className="flex flex-col gap-4">
        <div className="grid gap-1.5">
          <Label htmlFor="bs-tone" className="text-[13px] text-secondary-foreground">
            Tone of voice
          </Label>
          <Input
            id="bs-tone"
            name="toneOfVoice"
            defaultValue={toneOfVoice ?? ""}
            placeholder="Warm, unhurried, quietly confident"
          />
        </div>
        <div className="grid gap-1.5">
          <Label htmlFor="bs-image" className="text-[13px] text-secondary-foreground">
            Image style
          </Label>
          <Input
            id="bs-image"
            name="imageStyle"
            defaultValue={imageStyle ?? ""}
            placeholder="Natural light, real guests, no heavy filters"
          />
        </div>
        {state.error ? (
          <p className="text-caption text-danger" role="alert">{state.error}</p>
        ) : null}
        <Button type="submit" variant="outline" size="sm" disabled={pending} className="self-start">
          {pending ? "Confirming…" : confirmed ? "Update" : "Confirm as ours"}
        </Button>
      </form>
    </div>
  );
}
