"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { MonoLabel } from "@/components/brand/mono-label";
import { createSupportTicket, type StudioActionState } from "@/lib/studio/actions";

/* "Need help improving this?" (BRIEF §5.4 · §06) — opens a
   SupportTicket against the assigned Creative Support Assistant. */

const QUICK_PROMPTS = [
  "I'm not sure what campaign to run for Easter.",
  "Help me build a package for business travellers.",
  "What should I post this week?",
];

const initialState: StudioActionState = { ok: false };

export function SupportPanel({
  assistantName,
}: {
  assistantName: string | null;
}) {
  const [body, setBody] = React.useState("");
  const [state, formAction, pending] = React.useActionState(
    createSupportTicket,
    initialState
  );

  const name = assistantName ?? "your creative support assistant";
  const initials = (assistantName ?? "Creative Support")
    .split(" ")
    .map((w) => w[0])
    .slice(0, 2)
    .join("")
    .toUpperCase();

  return (
    <aside className="panel flex flex-col gap-4 p-5">
      <div className="flex items-center gap-3">
        <span
          aria-hidden
          className="flex size-9 items-center justify-center rounded-full bg-sunken font-mono text-[11px] font-medium text-secondary-foreground"
        >
          {initials}
        </span>
        <div className="flex flex-col">
          <span className="text-[15px] font-medium">Need help improving this?</span>
          <span className="text-caption text-muted-foreground">
            Ask {name} — a person, not a bot.
          </span>
        </div>
      </div>

      {state.ok ? (
        <p className="rounded-card border border-line bg-sunken p-3 text-[14px] text-secondary-foreground">
          Sent. {assistantName ?? "The team"} will reply by email.
        </p>
      ) : (
        <form action={formAction} className="flex flex-col gap-3">
          <Textarea
            name="body"
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="Describe what you're trying to market…"
            rows={3}
          />
          <div className="flex flex-wrap gap-2">
            {QUICK_PROMPTS.map((p) => (
              <button
                key={p}
                type="button"
                onClick={() => setBody(p)}
                className="rounded-full border border-line px-3 py-1 text-caption text-secondary-foreground transition-colors duration-180 ease-tdf hover:bg-sunken"
              >
                {p}
              </button>
            ))}
          </div>
          {state.error ? (
            <p className="text-caption text-danger" role="alert">
              {state.error}
            </p>
          ) : null}
          <Button
            type="submit"
            variant="outline"
            size="sm"
            disabled={pending || body.trim().length < 5}
            className="self-start"
          >
            {pending ? "Sending…" : "Send to support"}
          </Button>
        </form>
      )}

      <MonoLabel size="xs" className="text-muted-foreground">
        Human support · Digital Media Factory
      </MonoLabel>
    </aside>
  );
}
