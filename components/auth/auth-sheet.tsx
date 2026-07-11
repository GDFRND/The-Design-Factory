"use client";

import * as React from "react";
import Image from "next/image";
import { useRouter } from "next/navigation";
import * as DialogPrimitive from "@radix-ui/react-dialog";
import { ArrowRight, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { CodeInput } from "@/components/auth/code-input";
import { MonoLabel } from "@/components/brand/mono-label";
import {
  login,
  requestReset,
  resendCode,
  resetPassword,
  signup,
  verifyEmail,
  type AuthState,
} from "@/lib/auth/actions";
import { cn } from "@/lib/utils";

/* Split auth panel (TDF-06 §3.2): imagery left, form right, centred on
   a heavy graphite backdrop. Radix handles focus trap, Esc and focus
   restore. localStorage holds the remembered email only — no tokens
   client-side, ever. On mobile the left column drops and the panel is
   a full-height sheet. */

type Mode = "login" | "signup" | "reset";
type Step = "details" | "verification" | "complete";

const REMEMBER_KEY = "tdf-remembered-email";
const initialState: AuthState = { ok: false, step: "details" };

function strength(pw: string) {
  let s = 0;
  if (pw.length >= 8) s++;
  if (pw.length >= 12) s++;
  if (/[a-z]/.test(pw) && /[A-Z]/.test(pw)) s++;
  if (/\d/.test(pw)) s++;
  if (/[^a-zA-Z0-9]/.test(pw)) s++;
  return Math.min(s, 5);
}

const STRENGTH_CLASSES = [
  "bg-danger",
  "bg-danger",
  "bg-warning",
  "bg-tdf-400",
  "bg-accent-400",
  "bg-success",
];

function StrengthMeter({ password }: { password: string }) {
  const s = strength(password);
  if (!password) return null;
  return (
    <div className="flex items-center gap-1" aria-hidden>
      {[1, 2, 3, 4, 5].map((i) => (
        <span
          key={i}
          className={cn(
            "h-1 flex-1 rounded-full transition-colors duration-180 ease-tdf",
            i <= s ? STRENGTH_CLASSES[s] : "bg-sunken"
          )}
        />
      ))}
    </div>
  );
}

function Field({
  id,
  label,
  error,
  children,
}: {
  id: string;
  label: string;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="grid gap-1.5">
      <Label htmlFor={id} className="text-[13px] text-secondary-foreground">
        {label}
      </Label>
      {children}
      {error ? (
        <p className="text-caption text-danger" role="alert">
          {error}
        </p>
      ) : null}
    </div>
  );
}

export function AuthSheet({ mode: initialMode }: { mode: "login" | "signup" }) {
  const router = useRouter();
  const [mode, setMode] = React.useState<Mode>(initialMode);
  const [step, setStep] = React.useState<Step>("details");
  const [password, setPassword] = React.useState("");
  const [remember, setRemember] = React.useState(true);
  const [rememberedEmail, setRememberedEmail] = React.useState("");
  const [touched, setTouched] = React.useState<Record<string, boolean>>({});

  const [signupState, signupAction, signupPending] = React.useActionState(signup, initialState);
  const [loginState, loginAction, loginPending] = React.useActionState(login, initialState);
  const [verifyState, verifyAction, verifyPending] = React.useActionState(verifyEmail, initialState);
  const [resendState, resendAction] = React.useActionState(resendCode, initialState);
  const [resetReqState, resetReqAction, resetReqPending] = React.useActionState(requestReset, initialState);
  const [resetPwState, resetPwAction, resetPwPending] = React.useActionState(resetPassword, initialState);

  // The action that owns the current step's server response.
  const detailsState =
    mode === "signup" ? signupState : mode === "login" ? loginState : resetReqState;
  const verifyOwner = mode === "reset" ? resetPwState : verifyState;
  const email =
    verifyOwner.email ?? detailsState.email ?? rememberedEmail ?? "";

  React.useEffect(() => {
    try {
      setRememberedEmail(localStorage.getItem(REMEMBER_KEY) ?? "");
    } catch {}
  }, []);

  // Follow server-directed step changes.
  React.useEffect(() => {
    if (detailsState.ok && detailsState.step === "verification") setStep("verification");
  }, [detailsState]);
  React.useEffect(() => {
    if (verifyOwner.ok && verifyOwner.step === "complete") setStep("complete");
  }, [verifyOwner]);

  function close() {
    router.push("/");
  }

  function switchMode(next: Mode) {
    setMode(next);
    setStep("details");
    setTouched({});
    setPassword("");
  }

  function rememberEmail(formData: FormData) {
    try {
      const em = String(formData.get("email") ?? "");
      if (remember && em) localStorage.setItem(REMEMBER_KEY, em);
      else localStorage.removeItem(REMEMBER_KEY);
    } catch {}
  }

  const blur = (name: string) => () => setTouched((t) => ({ ...t, [name]: true }));
  const fieldError = (name: string) =>
    touched[name] || detailsState.fieldErrors?.[name]
      ? detailsState.fieldErrors?.[name]
      : undefined;

  return (
    <DialogPrimitive.Root open onOpenChange={(open) => !open && close()}>
      <DialogPrimitive.Portal>
        <DialogPrimitive.Overlay
          data-theme="dark"
          className="fixed inset-0 z-50 bg-(--glass-heavy) backdrop-blur-[8px] duration-260 ease-tdf data-[state=open]:animate-in data-[state=open]:fade-in-0"
        >
          <div aria-hidden className="grain" />
        </DialogPrimitive.Overlay>
        <DialogPrimitive.Content
          data-theme="dark"
          aria-describedby={undefined}
          className="fixed inset-0 z-50 grid overflow-hidden bg-raised text-foreground shadow-(--lift-3) duration-260 ease-tdf data-[state=open]:animate-in data-[state=open]:fade-in-0 data-[state=open]:slide-in-from-bottom-4 md:inset-auto md:left-1/2 md:top-1/2 md:max-h-[92svh] md:w-[min(880px,92vw)] md:-translate-x-1/2 md:-translate-y-1/2 md:grid-cols-[45fr_55fr] md:rounded-panel"
        >
          {/* Left column — imagery, orb, mark, the page's one italic phrase */}
          <div className="relative hidden overflow-hidden md:block">
            <Image
              src="/hero/1.jpg"
              alt=""
              fill
              sizes="(min-width: 768px) 25rem, 0vw"
              className="object-cover"
            />
            <div
              aria-hidden
              className="orb orb--blueprint bottom-[-25%] left-[-30%] size-[120%] mix-blend-screen opacity-45"
            />
            <div aria-hidden className="grain" />
            <div className="absolute bottom-8 left-8 z-10 flex flex-col gap-4">
              <Image
                src="/brand/tdf/tdf-mark-paper.png"
                alt="The Design Factory"
                width={48}
                height={48}
              />
              <p className="font-display text-[28px] font-light italic leading-[1.2] text-tdf-050">
                Built to be built on.
              </p>
            </div>
          </div>

          {/* Right column — the form on raised graphite */}
          <div className="relative flex flex-col overflow-y-auto bg-raised p-8">
            <DialogPrimitive.Close
              aria-label="Close"
              className="absolute right-4 top-4 rounded-full p-1 text-(--fg-subtle) transition-colors duration-180 ease-tdf hover:text-foreground"
            >
              <X className="size-4" aria-hidden />
            </DialogPrimitive.Close>
            <DialogPrimitive.Title className="text-h1">
              {step === "complete"
                ? "You're in."
                : mode === "reset"
                  ? "Reset your password"
                  : mode === "signup"
                    ? "Create your account"
                    : "Welcome back"}
            </DialogPrimitive.Title>
            <p className="mt-1 text-[15px] text-muted-foreground">
              {step === "verification"
                ? `We sent a 6-digit code to ${email || "your email"}.`
                : step === "complete"
                  ? "Your workspace is ready."
                  : mode === "signup"
                    ? "Your property's marketing department starts here."
                    : mode === "reset"
                      ? "We'll email you a reset code."
                      : "Sign in to your workspace."}
            </p>

        {step === "details" ? (
          <div className="mt-8 flex flex-col gap-6">
            {/* Google first — least friction on a phone. */}
            {mode !== "reset" ? (
              <>
                {/* White fill, Graphite text, official mark (TDF-06 §3.2) */}
                <a
                  href="/api/auth/google"
                  className="inline-flex h-11 w-full items-center justify-center gap-3 rounded-full bg-tdf-000 text-[15px] font-medium text-tdf-950 transition-shadow duration-180 ease-tdf hover:shadow-(--lift-accent)"
                >
                  <Image src="/brand/google-g.svg" alt="" width={16} height={16} />
                  Continue with Google
                </a>
                <div className="flex items-center gap-4" aria-hidden>
                  <span className="h-px flex-1 bg-line" />
                  <MonoLabel size="xs" className="text-muted-foreground">
                    or
                  </MonoLabel>
                  <span className="h-px flex-1 bg-line" />
                </div>
              </>
            ) : null}

            {/* Segmented control */}
            {mode !== "reset" ? (
              <div
                role="tablist"
                aria-label="Sign in or create account"
                className="grid grid-cols-2 gap-0.5 rounded-input border border-line p-0.5"
              >
                {(
                  [
                    ["login", "Sign in"],
                    ["signup", "Create account"],
                  ] as const
                ).map(([m, label]) => (
                  <button
                    key={m}
                    role="tab"
                    aria-selected={mode === m}
                    onClick={() => switchMode(m)}
                    className={cn(
                      "h-9 rounded-chip font-mono text-[11px] font-medium uppercase tracking-[0.14em] transition-colors duration-180 ease-tdf",
                      mode === m
                        ? "bg-foreground text-background"
                        : "text-muted-foreground hover:text-foreground"
                    )}
                  >
                    {label}
                  </button>
                ))}
              </div>
            ) : null}

            {mode === "signup" ? (
              <form action={signupAction} onSubmit={(e) => rememberEmail(new FormData(e.currentTarget))} className="flex flex-col gap-4">
                <Field id="su-name" label="Your name" error={fieldError("name")}>
                  <Input id="su-name" name="name" autoComplete="name" onBlur={blur("name")} required />
                </Field>
                <Field id="su-hotel" label="Hotel or property name" error={fieldError("hotelName")}>
                  <Input id="su-hotel" name="hotelName" onBlur={blur("hotelName")} required />
                </Field>
                <Field id="su-email" label="Email" error={fieldError("email")}>
                  <Input id="su-email" name="email" type="email" autoComplete="email" defaultValue={rememberedEmail} onBlur={blur("email")} required />
                </Field>
                <Field id="su-phone" label="Phone (optional)" error={fieldError("phone")}>
                  <Input id="su-phone" name="phone" type="tel" autoComplete="tel" />
                </Field>
                <Field id="su-password" label="Password" error={fieldError("password")}>
                  <Input
                    id="su-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    onBlur={blur("password")}
                    required
                    minLength={8}
                  />
                  <StrengthMeter password={password} />
                </Field>
                {detailsState.error ? (
                  <p className="text-caption text-danger" role="alert">{detailsState.error}</p>
                ) : null}
                <Button type="submit" variant="accent" disabled={signupPending} className="mt-2 w-full">
                  {signupPending ? "Creating…" : "Create account"}
                  <ArrowRight aria-hidden />
                </Button>
              </form>
            ) : mode === "login" ? (
              <form action={loginAction} onSubmit={(e) => rememberEmail(new FormData(e.currentTarget))} className="flex flex-col gap-4">
                <Field id="li-email" label="Email" error={fieldError("email")}>
                  <Input id="li-email" name="email" type="email" autoComplete="email" defaultValue={rememberedEmail} onBlur={blur("email")} required />
                </Field>
                <Field id="li-password" label="Password" error={fieldError("password")}>
                  <Input id="li-password" name="password" type="password" autoComplete="current-password" onBlur={blur("password")} required />
                </Field>
                <div className="flex items-center justify-between">
                  <label className="flex items-center gap-2 text-[13px] text-secondary-foreground">
                    <input
                      type="checkbox"
                      name="remember"
                      checked={remember}
                      onChange={(e) => setRemember(e.target.checked)}
                      className="size-4 rounded-chip border-line accent-current"
                    />
                    Remember me
                  </label>
                  <button
                    type="button"
                    onClick={() => switchMode("reset")}
                    className="text-[13px] text-muted-foreground underline-offset-4 hover:underline"
                  >
                    Forgot password?
                  </button>
                </div>
                {loginState.error ? (
                  <p className="text-caption text-danger" role="alert">{loginState.error}</p>
                ) : null}
                <Button type="submit" variant="accent" disabled={loginPending} className="mt-2 w-full">
                  {loginPending ? "Signing in…" : "Sign in"}
                  <ArrowRight aria-hidden />
                </Button>
              </form>
            ) : (
              <form action={resetReqAction} className="flex flex-col gap-4">
                <Field id="rs-email" label="Email" error={resetReqState.fieldErrors?.email}>
                  <Input id="rs-email" name="email" type="email" autoComplete="email" defaultValue={rememberedEmail} required />
                </Field>
                {resetReqState.error ? (
                  <p className="text-caption text-danger" role="alert">{resetReqState.error}</p>
                ) : null}
                <Button type="submit" variant="accent" disabled={resetReqPending} className="mt-2 w-full">
                  {resetReqPending ? "Sending…" : "Send reset code"}
                </Button>
                <button
                  type="button"
                  onClick={() => switchMode("login")}
                  className="text-[13px] text-muted-foreground underline-offset-4 hover:underline"
                >
                  Back to sign in
                </button>
              </form>
            )}
          </div>
        ) : step === "verification" ? (
          <div className="mt-8 flex flex-col gap-6">
            <form
              action={mode === "reset" ? resetPwAction : verifyAction}
              className="flex flex-col gap-5"
            >
              <input type="hidden" name="email" value={email} />
              <div className="grid gap-1.5">
                <Label className="text-[13px] text-secondary-foreground">
                  Verification code
                </Label>
                <CodeInput />
              </div>
              {mode === "reset" ? (
                <Field id="rp-password" label="New password">
                  <Input
                    id="rp-password"
                    name="password"
                    type="password"
                    autoComplete="new-password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={8}
                  />
                  <StrengthMeter password={password} />
                </Field>
              ) : null}
              {verifyOwner.error ? (
                <p className="text-caption text-danger" role="alert">{verifyOwner.error}</p>
              ) : null}
              <Button
                type="submit"
                variant="accent"
                disabled={mode === "reset" ? resetPwPending : verifyPending}
                className="w-full"
              >
                {mode === "reset"
                  ? resetPwPending
                    ? "Resetting…"
                    : "Reset password"
                  : verifyPending
                    ? "Verifying…"
                    : "Verify email"}
              </Button>
            </form>
            {mode !== "reset" ? (
              <form action={resendAction} className="text-center">
                <input type="hidden" name="email" value={email} />
                <button
                  type="submit"
                  className="text-[13px] text-muted-foreground underline-offset-4 hover:underline"
                >
                  {resendState.ok ? "Code sent again." : "Resend code"}
                </button>
              </form>
            ) : null}
          </div>
        ) : (
          <div className="mt-8 flex flex-col gap-6">
            <div className="flex items-center gap-3 rounded-card border border-line bg-raised p-4">
              <span className="flex size-8 items-center justify-center rounded-full bg-success/10 text-success">
                <Check className="size-4" aria-hidden />
              </span>
              <p className="text-[15px] text-secondary-foreground">
                {mode === "reset"
                  ? "Password updated. You're signed in."
                  : "Email verified. Your workspace is ready."}
              </p>
            </div>
            <Button variant="accent" className="w-full" onClick={() => router.push("/studio")}>
              Continue to the studio
              <ArrowRight aria-hidden />
            </Button>
          </div>
        )}
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
