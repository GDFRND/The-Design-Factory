"use client";

import * as React from "react";
import Image from "next/image";
import { MonoLabel } from "@/components/brand/mono-label";
import { enterAsDemoBrand } from "@/lib/auth/actions";
import { DEMO_BRANDS, brandLogo } from "@/lib/demo/brands";

/* FIX-04 §3.2 — one-click "Enter as [brand]" buttons. Each calls the
   normal login path server-side with the seeded credentials, so it is a
   real session scoped to that workspace, not a bypass. Rendered only
   when APP_ENV !== production (the parent gates on `show`). */

export function DemoBrandButtons() {
  const [pending, setPending] = React.useState<string | null>(null);

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center gap-4" aria-hidden>
        <span className="h-px flex-1 bg-line" />
        <MonoLabel size="xs" className="text-muted-foreground">
          Or explore a demo brand
        </MonoLabel>
        <span className="h-px flex-1 bg-line" />
      </div>
      <div className="flex flex-col gap-2">
        {DEMO_BRANDS.map((brand) => (
          <form
            key={brand.slug}
            action={async () => {
              setPending(brand.slug);
              await enterAsDemoBrand(brand.slug);
            }}
          >
            <button
              type="submit"
              disabled={pending !== null}
              className="flex h-11 w-full items-center gap-3 rounded-full border border-(--line-strong) bg-transparent px-4 text-[14px] text-foreground transition-colors duration-180 ease-tdf hover:bg-sunken disabled:opacity-50"
            >
              <span className="flex size-6 items-center justify-center">
                <Image
                  src={brandLogo(brand.slug, brand.plated)}
                  alt=""
                  width={24}
                  height={24}
                  className="h-6 w-auto object-contain"
                />
              </span>
              <span>
                {pending === brand.slug ? "Entering…" : `Enter as ${brand.hotelName}`}
              </span>
            </button>
          </form>
        ))}
      </div>
    </div>
  );
}
