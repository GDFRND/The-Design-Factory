import { randomInt } from "node:crypto";
import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { createSession } from "@/lib/auth/session";

/* Google OAuth callback: exchanges the code, finds or creates the user
   (with workspace + membership + brand system for first-time users),
   then opens a session. Google accounts arrive email-verified. */

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${base || "property"}-${randomInt(1000, 9999)}`;
}

export async function GET(request: Request) {
  const url = new URL(request.url);
  const code = url.searchParams.get("code");
  const state = url.searchParams.get("state");
  const jar = await cookies();
  const expectedState = jar.get("tdf_oauth_state")?.value;
  jar.delete("tdf_oauth_state");

  const fail = () =>
    NextResponse.redirect(new URL("/signin?error=google-failed", request.url));

  if (!code || !state || !expectedState || state !== expectedState) return fail();

  const clientId = process.env.GOOGLE_CLIENT_ID;
  const clientSecret = process.env.GOOGLE_CLIENT_SECRET;
  if (!clientId || !clientSecret) return fail();

  const appUrl = process.env.APP_URL ?? url.origin;

  const tokenRes = await fetch("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "Content-Type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      code,
      client_id: clientId,
      client_secret: clientSecret,
      redirect_uri: `${appUrl}/api/auth/google/callback`,
      grant_type: "authorization_code",
    }),
  });
  if (!tokenRes.ok) return fail();
  const tokens = (await tokenRes.json()) as { access_token?: string };
  if (!tokens.access_token) return fail();

  const infoRes = await fetch("https://openidconnect.googleapis.com/v1/userinfo", {
    headers: { Authorization: `Bearer ${tokens.access_token}` },
  });
  if (!infoRes.ok) return fail();
  const info = (await infoRes.json()) as {
    sub?: string;
    email?: string;
    email_verified?: boolean;
    name?: string;
  };
  if (!info.sub || !info.email) return fail();
  const email = info.email.toLowerCase();

  let user = await db.user.findFirst({
    where: { OR: [{ googleId: info.sub }, { email }] },
  });

  if (user) {
    user = await db.user.update({
      where: { id: user.id },
      data: {
        googleId: user.googleId ?? info.sub,
        emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
      },
    });
  } else {
    const name = info.name?.trim() || email.split("@")[0];
    user = await db.$transaction(async (tx) => {
      const created = await tx.user.create({
        data: {
          email,
          name,
          googleId: info.sub,
          emailVerifiedAt: new Date(),
        },
      });
      const workspace = await tx.workspace.create({
        data: {
          hotelName: `${name.split(" ")[0]}'s property`,
          slug: slugify(name),
        },
      });
      await tx.membership.create({
        data: {
          userId: created.id,
          workspaceId: workspace.id,
          role: "HOTEL_MARKETER",
          isOwner: true,
        },
      });
      await tx.brandSystem.create({
        data: { workspaceId: workspace.id, completion: 0 },
      });
      return created;
    });
  }

  await createSession(user.id);
  return NextResponse.redirect(new URL("/dashboard", request.url));
}
