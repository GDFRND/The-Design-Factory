# The Design Factory

An AI marketing department for every hotel, lodge and resort in Kenya.
A Genesis project, supported by the Tourism Fund.

The full product brief lives in [BRIEF.md](./BRIEF.md). Ship One covers:
hero → auth → brand onboarding → studio → prompt expansion → generation →
refinement → approval → download.

## Stack

Next.js (App Router) + TypeScript · Tailwind (TDF-SYS-01 tokens) ·
shadcn/ui · Prisma + PostgreSQL · Vercel Blob (signed local files in dev) ·
argon2 + Google OAuth · server-side AI layer behind `lib/ai/`.

## Local development

```sh
npm install
npm run db:start        # project-contained Postgres on :5799 (.pgdata/)
npx prisma migrate dev  # apply migrations
npx tsx --conditions react-server prisma/seed.ts   # demo data (idempotent)
npm run dev
```

`.env` defaults work without any keys: the creative assistant and image
engine fall back to deterministic offline implementations so every flow
runs end-to-end. Add real keys to enable them:

| Variable | Enables |
|---|---|
| `ANTHROPIC_API_KEY` | Prompt expansion, copywriting, assistant chat |
| `OPENROUTER_API_KEY` (+ `IMAGE_MODEL_DRAFT` / `IMAGE_MODEL_FINAL`) | Real image generation via the router |
| `GOOGLE_CLIENT_ID` / `GOOGLE_CLIENT_SECRET` | Continue with Google |
| `RESEND_API_KEY` | Real email (otherwise logged to the server console) |
| `BLOB_READ_WRITE_TOKEN` | Vercel Blob storage (otherwise `.uploads/`) |
| `DATABASE_URL` | Neon in production |

Demo accounts (after seeding): `naisula@demo.thedesignfactory.local`,
`hamisi@demo.thedesignfactory.local`, `achieng@demo.thedesignfactory.local`
— password `demo-password-2026`. "Explore demo" on the homepage signs into
the first demo workspace.

## Tests

```sh
npm test   # completion scorer + JSON-repair parser (Vitest)
```

## Brand assets

`public/brand/` currently contains **generated placeholder marks** for
The Design Factory and Digital Media Factory, plus white knockouts of the
supplied Tourism Fund and Genesis logos. Replace them with the official
files (same names) when supplied; `scripts/make-brand-assets.js`
regenerates the placeholders.
