"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { decideApproval } from "@/lib/studio/approval-actions";

/* Reviewer decision form on the magic-link page (BRIEF §4.7). */

export function ReviewDecision({ token }: { token: string }) {
  const [note, setNote] = React.useState("");
  const [pending, setPending] = React.useState<null | "APPROVED" | "CHANGES_REQUESTED">(null);
  const [done, setDone] = React.useState<null | "APPROVED" | "CHANGES_REQUESTED">(null);
  const [error, setError] = React.useState<string | null>(null);

  async function decide(decision: "APPROVED" | "CHANGES_REQUESTED") {
    setPending(decision);
    setError(null);
    const result = await decideApproval({ token, decision, note: note.trim() || undefined });
    setPending(null);
    if (result.ok) setDone(decision);
    else setError(result.error ?? "Something went wrong.");
  }

  if (done) {
    return (
      <p className="rounded-card border border-line bg-raised p-4 text-body text-secondary-foreground" role="status">
        {done === "APPROVED"
          ? "Approved. The team can publish this asset."
          : "Changes requested. The team has been notified."}
      </p>
    );
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="grid gap-1.5">
        <Label htmlFor="rv-note" className="text-[13px] text-secondary-foreground">
          Note (optional — required context if you request changes)
        </Label>
        <Textarea
          id="rv-note"
          rows={3}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="What should change, or why it's approved…"
        />
      </div>
      {error ? (
        <p className="text-caption text-danger" role="alert">{error}</p>
      ) : null}
      <div className="flex flex-wrap gap-3">
        <Button
          variant="accent"
          disabled={pending !== null}
          onClick={() => decide("APPROVED")}
        >
          {pending === "APPROVED" ? "Approving…" : "Approve"}
        </Button>
        <Button
          variant="outline"
          disabled={pending !== null}
          onClick={() => decide("CHANGES_REQUESTED")}
        >
          {pending === "CHANGES_REQUESTED" ? "Sending…" : "Request changes"}
        </Button>
      </div>
    </div>
  );
}
