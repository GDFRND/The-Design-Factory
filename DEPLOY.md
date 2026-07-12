# Deploying The Design Factory

The app is a **server**, not a static bundle — route handlers hold the
Anthropic and OpenRouter keys, so it can't ship as HTML. The repo is the
deliverable; Vercel runs it. Database and image storage both live in the
**Supabase project "The Design Factory"** (`sojvisyrcxbvtplggkoh`), which is
already provisioned.

This guide is the git-connected path: you push to GitHub and import the repo
into Vercel. No secret value appears in this file — you paste them into the
Vercel dashboard, where they belong.

---

## 1. Push to GitHub

```sh
git remote add origin git@github.com:<you>/the-design-factory.git   # the repo you created
git push -u origin main
```

Confirm on github.com that **`.env.local` is not in the file list**. It's
git-ignored; if it somehow appears, stop and rotate the keys.

## 2. Import into Vercel

vercel.com → **Add New → Project** → import the repo. It auto-detects Next.js.
The build command is pinned in `vercel.json`:
`prisma migrate deploy && next build` — so the **first deploy migrates the
database automatically**.

## 3. Environment variables (Settings → Environment Variables)

Add each of these. The two `*_API_KEY` values are the ones already in your
local `.env.local` — copy them across; never commit them.

| Name | Value |
|---|---|
| `ANTHROPIC_API_KEY` | *(from your `.env.local`)* |
| `ANTHROPIC_MODEL` | `claude-sonnet-5` |
| `ANTHROPIC_MODEL_CHEAP` | `claude-haiku-4-5-20251001` |
| `OPENROUTER_API_KEY` | *(from your `.env.local`)* |
| `IMAGE_MODEL_DRAFT` | `google/gemini-3.1-flash-image` |
| `IMAGE_MODEL_FINAL` | `google/gemini-3-pro-image` |
| `IMAGE_VARIANT_COUNT` | `4` |
| `MONTHLY_GENERATION_QUOTA` | `30` |
| `DATABASE_URL` | Supabase → **Connect → Session mode** URL (IPv4, supports migrations) |
| `SESSION_SECRET` | a 48-byte secret — generate with `node -e "console.log(require('crypto').randomBytes(48).toString('base64url'))"` |
| `SUPABASE_URL` | `https://sojvisyrcxbvtplggkoh.supabase.co` |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → **Settings → API → service_role** (secret) |
| `SUPABASE_STORAGE_BUCKET` | `assets` |
| `APP_ENV` | `demo` — shows the brand buttons, lets the seed run. Use `production` for a real pilot. |
| `APP_URL` | your `*.vercel.app` URL (set after the first deploy, then redeploy) |
| `OPENROUTER_APP_URL` | your `*.vercel.app` URL |
| `OPENROUTER_APP_NAME` | `The Design Factory` |

Google OAuth, Resend email and Vercel Blob are optional — leave them unset
and the app falls back gracefully (Google button errors politely, email logs
server-side, storage uses Supabase).

## 4. Deploy, then seed the demo brands

The first deploy runs the migrations and gives you a URL. The database is now
schema-complete but empty. Seed it **once**, from your machine, with the same
Supabase values you put in Vercel:

```sh
DATABASE_URL="<session-pooler-url>" \
SUPABASE_URL="https://sojvisyrcxbvtplggkoh.supabase.co" \
SUPABASE_SERVICE_ROLE_KEY="<service-role-key>" \
APP_ENV=demo \
npm run seed
```

This creates the three demo workspaces and uploads their assets to the
Supabase `assets` bucket. It's idempotent and refuses to run when
`APP_ENV=production`.

Then set `APP_URL` / `OPENROUTER_APP_URL` to the real URL and redeploy so
sign-in redirects and attribution resolve.

## 5. Spend caps — before you share the link

- **Anthropic** — prepaid credit cap (console.anthropic.com → Billing)
- **OpenRouter** — prepaid credit cap (openrouter.ai → Credits; no auto-top-up)
- **Vercel** — Spend Management limit
- **Supabase** — usage/spend cap

`MONTHLY_GENERATION_QUOTA` (30/workspace) is the in-app rail, but the prepaid
caps are the hard backstop.

---

## Demo logins

Gated to `APP_ENV != production` — also on the sign-in sheet as one-click
**Enter as …** buttons, and at `/demo`.

| Brand | Email | Password |
|---|---|---|
| Rhino Fort Hotel | `demo@rhinofort.co.ke` | `RhinoFort2026` |
| The Regent Hotel & Travel | `demo@theregent.co.ke` | `Regent2026` |
| El Mara Hotels & Resorts | `demo@elmara.co.ke` | `ElMara2026` |

## Notes

- **Migrations:** the initial schema is already applied to the Supabase
  project (both migrations recorded in `_prisma_migrations`), so the build is
  just `next build`. For future schema changes, run `prisma migrate deploy`
  locally against the Session-mode `DATABASE_URL` before deploying.
- **Storage precedence** (`lib/storage.ts`): Supabase when its two vars are
  set, else Vercel Blob, else local `.uploads/`. The deployed app uses
  Supabase; the bucket is private and the browser only sees signed URLs.
- **Rotate the keys** that passed through local files before going wide — see
  the note in the session history.
