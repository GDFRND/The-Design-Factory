# TDF-10 · FIX-04
**Close the loop: download, navigation, brand demo logins, deploy.**
Supersedes the download/navigation gaps left by TDF-06. Everything else stands.

## Select-and-download (§1)
- Gallery cells get a single-selection accent ring (Blueprint Lt, 2px); selection unlocks the action bar, the one accent on the screen.
- Download is the primary (accent) action. It does the Pro 2K re-render of the *selected draft* via refine() on the final model (image_config image_size:2K, aspect from the draft), shows "Preparing 2K…", then triggers an <a download> at /api/variants/[id]/download?format=webp|png. Filename {slug}-{assetType}-{yyyymmdd}. Format toggle offers PNG.
- Double-charge guarded: an in-flight finalize is shared, the finished 2K is cached on Variant.finalKey, a second download reuses it. downloadedAt recorded; the variant shows DOWNLOADED · HH:MM and a Done → /dashboard button.
- Demo assets keep the DEMO watermark; the 2K render inherits it via the isDemo flag on the workspace.

## Navigation (§2)
- Sticky glass app bar on every authenticated route (studio + dashboard layouts): the hotel's own logo (plated where flagged) links to /dashboard, Home/Create/Brand mono nav with the active route lit, completion pill, avatar menu (switch brand for demo users · sign out).
- /dashboard is the new home: greeting strip, a grid of the workspace's generations newest-first with derived status badges (DRAFT/AWAITING APPROVAL/APPROVED/DOWNLOADED), the three-card empty-state explainer, one accent New asset. All post-auth redirects land here.

## Demo logins (§3)
- Three seeded owner accounts (demo@rhinofort/theregent/elmara.co.ke, argon2, verified, isDemo, 100% brand), single source of truth in lib/demo/brands.ts.
- Enter-as-brand buttons on the auth sheet call the real login path server-side (enterAsDemoBrand) — a genuine scoped session, no bypass. Buttons + /demo cheat sheet gated on APP_ENV !== production; the seed throws on APP_ENV=production.

## Deploy (§4)
- The repo is the deliverable; Vercel runs the server (keys live in route handlers). README carries the full path: build clean, .env.local ignored, env vars typed into the Vercel dashboard, Neon for DATABASE_URL, Blob/R2 for storage, APP_ENV=demo vs production, four prepaid spend caps before sharing.

*The Design Factory · FIX-04 · Loop closed · A Genesis project · Supported by the Tourism Fund · Powered by Jitume*
