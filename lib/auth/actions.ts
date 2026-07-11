"use server";

import { createHash, randomInt } from "node:crypto";
import { headers } from "next/headers";
import { redirect } from "next/navigation";
import { z } from "zod";
import { db } from "@/lib/db";
import { sendEmail } from "@/lib/email";
import { rateLimit } from "@/lib/rate-limit";
import { hashPassword, verifyPassword } from "@/lib/auth/password";
import { createSession, destroySession, getCurrentUser } from "@/lib/auth/session";
import { DEMO_BRANDS } from "@/lib/demo/brands";
import { demoFeaturesEnabled } from "@/lib/env";

/* Server actions for the auth sheet (BRIEF §5.3).
   Errors are generic on purpose — they never reveal whether an email
   exists. Rate-limited by IP + email. */

export type AuthState = {
  ok: boolean;
  step?: "details" | "verification" | "complete";
  error?: string;
  fieldErrors?: Record<string, string>;
  email?: string;
};

const GENERIC_ERROR = "We couldn't complete that. Check the details and try again.";
const RATE_ERROR = "Too many attempts. Wait a few minutes and try again.";

const emailSchema = z.string().trim().toLowerCase().email();

const signupSchema = z.object({
  name: z.string().trim().min(2, "Enter your name."),
  hotelName: z.string().trim().min(2, "Enter your property's name."),
  email: emailSchema,
  phone: z.string().trim().optional(),
  password: z.string().min(8, "Use at least 8 characters."),
});

const loginSchema = z.object({
  email: emailSchema,
  password: z.string().min(1, "Enter your password."),
  remember: z.coerce.boolean().optional(),
});

function hashCode(code: string) {
  return createHash("sha256")
    .update(`${code}:${process.env.SESSION_SECRET ?? ""}`)
    .digest("hex");
}

async function clientIp() {
  const h = await headers();
  return (
    h.get("x-forwarded-for")?.split(",")[0]?.trim() ??
    h.get("x-real-ip") ??
    "local"
  );
}

function slugify(name: string) {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  return `${base || "property"}-${randomInt(1000, 9999)}`;
}

async function issueCode(email: string, purpose: "EMAIL_VERIFY" | "PASSWORD_RESET") {
  const code = String(randomInt(0, 1_000_000)).padStart(6, "0");
  await db.verificationToken.deleteMany({ where: { email, purpose } });
  await db.verificationToken.create({
    data: {
      email,
      purpose,
      codeHash: hashCode(code),
      expiresAt: new Date(Date.now() + 15 * 60 * 1000),
    },
  });
  const subjects = {
    EMAIL_VERIFY: "Your verification code",
    PASSWORD_RESET: "Your password reset code",
  } as const;
  await sendEmail({
    to: email,
    subject: `${subjects[purpose]} · The Design Factory`,
    text: `Your code is ${code}. It expires in 15 minutes.\n\nIf you didn't request this, you can ignore this email.`,
  });
}

async function consumeCode(
  email: string,
  purpose: "EMAIL_VERIFY" | "PASSWORD_RESET",
  code: string
) {
  const token = await db.verificationToken.findFirst({
    where: { email, purpose },
    orderBy: { createdAt: "desc" },
  });
  if (!token) return false;
  if (token.expiresAt < new Date() || token.attempts >= 5) return false;
  if (token.codeHash !== hashCode(code)) {
    await db.verificationToken.update({
      where: { id: token.id },
      data: { attempts: { increment: 1 } },
    });
    return false;
  }
  await db.verificationToken.deleteMany({ where: { email, purpose } });
  return true;
}

// ------------------------------------------------------------- signup

export async function signup(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = signupSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      step: "details",
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((i) => [String(i.path[0]), i.message])
      ),
    };
  }
  const { name, hotelName, email, phone, password } = parsed.data;

  const ip = await clientIp();
  if (!rateLimit(`signup:${ip}`) || !rateLimit(`signup:${email}`)) {
    return { ok: false, step: "details", error: RATE_ERROR };
  }

  const existing = await db.user.findUnique({ where: { email } });
  if (!existing) {
    const passwordHash = await hashPassword(password);
    await db.$transaction(async (tx) => {
      const user = await tx.user.create({
        data: { name, email, phone: phone || null, passwordHash },
      });
      const workspace = await tx.workspace.create({
        data: { hotelName, slug: slugify(hotelName) },
      });
      await tx.membership.create({
        data: {
          userId: user.id,
          workspaceId: workspace.id,
          role: "HOTEL_MARKETER",
          isOwner: true,
        },
      });
      await tx.brandSystem.create({
        data: { workspaceId: workspace.id, completion: 0 },
      });
    });
    await issueCode(email, "EMAIL_VERIFY");
  }
  // Same response either way — no account enumeration.
  return { ok: true, step: "verification", email };
}

// -------------------------------------------------------------- login

export async function login(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const parsed = loginSchema.safeParse(Object.fromEntries(formData));
  if (!parsed.success) {
    return {
      ok: false,
      step: "details",
      fieldErrors: Object.fromEntries(
        parsed.error.issues.map((i) => [String(i.path[0]), i.message])
      ),
    };
  }
  const { email, password, remember } = parsed.data;

  const ip = await clientIp();
  if (!rateLimit(`login:${ip}`, 10) || !rateLimit(`login:${email}`)) {
    return { ok: false, step: "details", error: RATE_ERROR };
  }

  const user = await db.user.findUnique({ where: { email } });
  if (!user?.passwordHash || !(await verifyPassword(user.passwordHash, password))) {
    return { ok: false, step: "details", error: "Email or password is incorrect." };
  }

  if (!user.emailVerifiedAt) {
    await issueCode(email, "EMAIL_VERIFY");
    return { ok: true, step: "verification", email };
  }

  await createSession(user.id, remember ?? true);
  redirect("/dashboard");
}

// ------------------------------------------------------- verification

export async function verifyEmail(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = emailSchema.safeParse(formData.get("email"));
  const code = z.string().regex(/^\d{6}$/).safeParse(formData.get("code"));
  if (!email.success || !code.success) {
    return { ok: false, step: "verification", error: "Enter the 6-digit code." };
  }

  const ip = await clientIp();
  if (!rateLimit(`verify:${ip}`, 10)) {
    return { ok: false, step: "verification", email: email.data, error: RATE_ERROR };
  }

  const valid = await consumeCode(email.data, "EMAIL_VERIFY", code.data);
  const user = valid
    ? await db.user.findUnique({ where: { email: email.data } })
    : null;
  if (!user) {
    return {
      ok: false,
      step: "verification",
      email: email.data,
      error: "That code is invalid or has expired.",
    };
  }

  await db.user.update({
    where: { id: user.id },
    data: { emailVerifiedAt: new Date() },
  });
  await createSession(user.id);
  return { ok: true, step: "complete", email: email.data };
}

export async function resendCode(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) return { ok: false, step: "verification", error: GENERIC_ERROR };
  const ip = await clientIp();
  if (!rateLimit(`resend:${ip}`) || !rateLimit(`resend:${email.data}`, 3)) {
    return { ok: false, step: "verification", email: email.data, error: RATE_ERROR };
  }
  const user = await db.user.findUnique({ where: { email: email.data } });
  if (user && !user.emailVerifiedAt) await issueCode(email.data, "EMAIL_VERIFY");
  return { ok: true, step: "verification", email: email.data };
}

// -------------------------------------------------------------- reset

export async function requestReset(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = emailSchema.safeParse(formData.get("email"));
  if (!email.success) {
    return { ok: false, step: "details", fieldErrors: { email: "Enter a valid email." } };
  }
  const ip = await clientIp();
  if (!rateLimit(`reset:${ip}`) || !rateLimit(`reset:${email.data}`, 3)) {
    return { ok: false, step: "details", error: RATE_ERROR };
  }
  const user = await db.user.findUnique({ where: { email: email.data } });
  if (user) await issueCode(email.data, "PASSWORD_RESET");
  // Same response either way.
  return { ok: true, step: "verification", email: email.data };
}

export async function resetPassword(_prev: AuthState, formData: FormData): Promise<AuthState> {
  const email = emailSchema.safeParse(formData.get("email"));
  const code = z.string().regex(/^\d{6}$/).safeParse(formData.get("code"));
  const password = z.string().min(8, "Use at least 8 characters.").safeParse(formData.get("password"));
  if (!email.success || !code.success || !password.success) {
    return {
      ok: false,
      step: "verification",
      email: email.success ? email.data : undefined,
      error: "Check the code and choose a password of at least 8 characters.",
    };
  }
  const ip = await clientIp();
  if (!rateLimit(`resetpw:${ip}`, 10)) {
    return { ok: false, step: "verification", email: email.data, error: RATE_ERROR };
  }
  const valid = await consumeCode(email.data, "PASSWORD_RESET", code.data);
  const user = valid
    ? await db.user.findUnique({ where: { email: email.data } })
    : null;
  if (!user) {
    return {
      ok: false,
      step: "verification",
      email: email.data,
      error: "That code is invalid or has expired.",
    };
  }
  await db.user.update({
    where: { id: user.id },
    data: {
      passwordHash: await hashPassword(password.data),
      emailVerifiedAt: user.emailVerifiedAt ?? new Date(),
    },
  });
  await db.session.deleteMany({ where: { userId: user.id } });
  await createSession(user.id);
  return { ok: true, step: "complete", email: email.data };
}

// -------------------------------------------------------------- misc

export async function logout() {
  await destroySession();
  redirect("/");
}

/* Demo brand one-click sign-in (FIX-04 §3.2). Types the seeded
   credentials for you server-side — a real login, no session bypass,
   scoped to that workspace like any other. Gated: never available when
   APP_ENV=production, and only signs in accounts flagged isDemo. */
export async function enterAsDemoBrand(slug: string) {
  if (!demoFeaturesEnabled()) redirect("/signin");

  const brand = DEMO_BRANDS.find((b) => b.slug === slug);
  if (!brand) redirect("/signin");

  const user = await db.user.findUnique({ where: { email: brand.email } });
  if (
    !user?.isDemo ||
    !user.passwordHash ||
    !user.emailVerifiedAt ||
    !(await verifyPassword(user.passwordHash, brand.password))
  ) {
    redirect("/signin?error=demo-unavailable");
  }

  await createSession(user.id, false);
  redirect("/dashboard");
}

export async function currentUserName() {
  const user = await getCurrentUser();
  return user?.name ?? null;
}
