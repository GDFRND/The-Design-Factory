import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth/session";

/* "Explore demo" — signs the visitor into a seeded demo workspace so
   the studio feels real on first contact. Demo workspaces are flagged
   isDemo and rebuilt by the seed script. */

export async function GET(request: Request) {
  try {
    const membership = await db.membership.findFirst({
      where: { workspace: { isDemo: true } },
      orderBy: { createdAt: "asc" },
      include: { user: true },
    });

    if (!membership) {
      // Seed hasn't run — fall back to sign-up.
      return NextResponse.redirect(new URL("/signup", request.url));
    }

    await createSession(membership.user.id, false);
    return NextResponse.redirect(new URL("/dashboard", request.url));
  } catch (e) {
    // Database unreachable — send to sign-in with a flag instead of 500.
    console.error("[/api/demo] database error", e);
    return NextResponse.redirect(
      new URL("/signin?error=database-unavailable", request.url)
    );
  }
}
