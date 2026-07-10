"use client";

import * as React from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { saveProfile, type StudioActionState } from "@/lib/studio/actions";

/* Hotel profile form — the non-upload half of the completion score. */

const initialState: StudioActionState = { ok: false };

function F({
  id,
  label,
  hint,
  children,
}: {
  id: string;
  label: string;
  hint?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-[13px] text-secondary-foreground">
        {label}
      </Label>
      {children}
      {hint ? <p className="text-caption text-muted-foreground">{hint}</p> : null}
    </div>
  );
}

export function ProfileForm({
  defaults,
}: {
  defaults: Record<string, string>;
}) {
  const [state, formAction, pending] = React.useActionState(saveProfile, initialState);

  return (
    <form action={formAction} className="flex flex-col gap-5">
      <div className="grid gap-5 sm:grid-cols-2">
        <F id="pf-location" label="Location" hint="Town and county, e.g. Diani, Kwale">
          <Input id="pf-location" name="location" defaultValue={defaults.location} />
        </F>
        <F id="pf-type" label="Property type" hint="Beach resort, tented camp, city hotel…">
          <Input id="pf-type" name="propertyType" defaultValue={defaults.propertyType} />
        </F>
        <F id="pf-county" label="County">
          <Input id="pf-county" name="county" defaultValue={defaults.county} />
        </F>
        <F id="pf-rooms" label="Room count">
          <Input id="pf-rooms" name="roomCount" type="number" min={1} defaultValue={defaults.roomCount} />
        </F>
      </div>
      <F id="pf-roomcats" label="Room types" hint="Comma-separated, e.g. Garden room, Ocean suite, Family villa">
        <Textarea id="pf-roomcats" name="roomCategories" rows={2} defaultValue={defaults.roomCategories} />
      </F>
      <div className="grid gap-5 sm:grid-cols-2">
        <F id="pf-restaurant" label="Restaurant">
          <Input id="pf-restaurant" name="restaurant" defaultValue={defaults.restaurant} />
        </F>
        <F id="pf-buffet" label="Buffet">
          <Input id="pf-buffet" name="buffet" defaultValue={defaults.buffet} />
        </F>
        <F id="pf-conference" label="Conference facilities">
          <Input id="pf-conference" name="conference" defaultValue={defaults.conference} />
        </F>
        <F id="pf-wellness" label="Wellness or spa">
          <Input id="pf-wellness" name="wellness" defaultValue={defaults.wellness} />
        </F>
      </div>
      <F id="pf-customers" label="Who do you sell to?" hint="Comma-separated, e.g. Nairobi families, business travellers, tour operators">
        <Textarea id="pf-customers" name="targetCustomers" rows={2} defaultValue={defaults.targetCustomers} />
      </F>
      <F id="pf-selling" label="What are you proud of?" hint="Comma-separated, e.g. beachfront, award-winning kitchen, conference garden">
        <Textarea id="pf-selling" name="sellingPoints" rows={2} defaultValue={defaults.sellingPoints} />
      </F>
      <div className="grid gap-5 sm:grid-cols-2">
        <F id="pf-contact" label="Contact for bookings">
          <Input id="pf-contact" name="contact" defaultValue={defaults.contact} placeholder="+254 7…" />
        </F>
        <F id="pf-booking" label="Booking link">
          <Input id="pf-booking" name="bookingUrl" defaultValue={defaults.bookingUrl} placeholder="https://" />
        </F>
      </div>
      <F id="pf-website" label="Website">
        <Input id="pf-website" name="websiteUrl" defaultValue={defaults.websiteUrl} placeholder="https://" />
      </F>

      {state.error ? (
        <p className="text-caption text-danger" role="alert">{state.error}</p>
      ) : null}
      {state.ok ? (
        <p className="text-caption text-success" role="status">
          Saved. Brand profile at {state.completion}%.
        </p>
      ) : null}

      <Button type="submit" disabled={pending} className="self-start">
        {pending ? "Saving…" : "Save profile"}
      </Button>
    </form>
  );
}
