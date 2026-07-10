import "server-only";
import { cache } from "react";
import { cookies } from "next/headers";
import { db } from "@/lib/db";

const COOKIE = "tdf_session";
const THIRTY_DAYS = 30 * 24 * 60 * 60 * 1000;

export async function createSession(userId: string, remember = true) {
  const session = await db.session.create({
    data: {
      userId,
      expiresAt: new Date(Date.now() + THIRTY_DAYS),
    },
  });
  const jar = await cookies();
  jar.set(COOKIE, session.id, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    // Session cookie (cleared on browser close) unless "remember me".
    ...(remember ? { maxAge: THIRTY_DAYS / 1000 } : {}),
  });
  return session;
}

export async function destroySession() {
  const jar = await cookies();
  const sid = jar.get(COOKIE)?.value;
  if (sid) {
    await db.session.deleteMany({ where: { id: sid } });
    jar.delete(COOKIE);
  }
}

/** Current user, memoized per request. Null when signed out. */
export const getCurrentUser = cache(async () => {
  const jar = await cookies();
  const sid = jar.get(COOKIE)?.value;
  if (!sid) return null;
  const session = await db.session.findUnique({
    where: { id: sid },
    include: { user: true },
  });
  if (!session || session.expiresAt < new Date()) return null;
  return session.user;
});
