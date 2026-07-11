# The Design Factory

An AI marketing department for every hotel, lodge and resort in Kenya —
describe an offer, get a brand-consistent poster, email or campaign back,
refine it in plain words, route it for approval, and download the finished
asset. A Genesis project, supported by the Tourism Fund, powered by Jitume.

The full product brief lives in [BRIEF.md](./BRIEF.md); the visual and
provider amendments in [TDF-06.md](./TDF-06.md) and [TDF-09.md](./TDF-09.md).
Ship One is the closed loop: dashboard → studio → generate → select →
download → dashboard.

## Stack

Next.js (App Router) + TypeScript · Tailwind (TDF-SYS-01 tokens, dark-first
product chrome) · shadcn/ui · Prisma + PostgreSQL · argon2 + Google OAuth ·
text via Anthropic, images via OpenRouter — both server-side behind
`lib/ai/`, no key ever reaches the browser.

## Local development

```sh
npm install
npm run db:start          # project-contained Postgres on :5799 (.pgdata/)
npx prisma migrate dev    # apply migrations
APP_ENV=demo npx tsx --conditions react-server prisma/seed.ts   # demo brands
npm run dev
```

The app runs **without any keys**: the creative assistant and image engine
fall back to deterministic offline implementations so every flow works end
to end. Add real keys to `.env.local` (git-ignored; never commit) to enable
the live providers — `npx tsx scripts/check-env.ts` validates them, printing
only prefix and length.

| Variable | Enables |
|---|---|
| `ANTHROPIC_API_KEY` (+ `ANTHROPIC_MODEL`) | Prompt expansion, copywriting, chat |
| `OPENROUTER_API_KEY` (+ `IMAGE_MODEL_DRAFT` / `IMAGE_MODEL_FINAL`) | Real image generation via the router |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Continue with Google |
| `RESEND_API_KEY` | Real email (otherwise logged to the server console) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage (otherwise `.uploads/`) |
| `DATABASE_URL` | Neon in production |
| `APP_ENV` | `demo` shows the brand buttons and lets the seed run; `production` hides both and the seed refuses |

## Demo brands

Three real brands share one chrome — the whole argument. Each is a genuine
login (argon2-hashed, seeded, `isDemo`), reachable through the normal form
or the one-click **Enter as …** buttons on the sign-in sheet (both hidden
when `APP_ENV=production`). Cheat sheet also at `/demo`.

| Brand | Email | Password | Proves |
|---|---|---|---|
| Rhino Fort Hotel | `demo@rhinofort.co.ke` | `RhinoFort2026` | `IMAGE` — earthen poster |
| The Regent Hotel & Travel | `demo@theregent.co.ke` | `Regent2026` | `TEXT` — aubergine-and-gold agent letter |
| El Mara Hotels & Resorts | `demo@elmara.co.ke` | `ElMara2026` | `COMPOSITE` — scarlet buffet artwork + copy |

## Tests

```sh
npm test   # completion scorer, JSON-repair parser, hero cycle, plating rule
```

## Deploy (Vercel)

The app is a server, not a static bundle — it holds the AI keys in route
handlers, so it can't ship as HTML. The repo is the deliverable; Vercel
runs it.

1. `npm run build` clean, `.env.local` git-ignored (`git check-ignore -v
   .env.local`), guards clean (no keys, vendor names, or hollow logos).
2. Push to a private GitHub repo; confirm `.env.local` is **not** listed.
3. Vercel → import repo → **Settings → Environment Variables**: add every
   name from `.env.example` with its real value, typed into the dashboard,
   never committed. For a demo deploy set `APP_ENV=demo`; for a pilot set
   `APP_ENV=production`.
4. Point `DATABASE_URL` at a Neon database; run `prisma migrate deploy`
   (and the seed, for a demo). Point storage at Vercel Blob / R2 —
   local disk is ephemeral on Vercel.
5. Set `APP_URL` / `OPENROUTER_APP_URL` to the deployed URL and redeploy.
6. Set the four prepaid spend caps (Anthropic, OpenRouter, Vercel, Neon)
   **before** sharing the link.

## Brand assets

`public/brand/tdf/` holds placeholder TDF marks (a factory silhouette);
`public/brand/partners/` and `public/brand/{rhino-fort,the-regent,el-mara}/`
hold the supplied, alpha-keyed logos with `-plated` variants for dark
surfaces (the plating rule — enclosed white bounded by colour — is detected
on upload in `lib/brand/plating.ts`). Replace the TDF placeholders with the
official four marks under the same names when supplied.
