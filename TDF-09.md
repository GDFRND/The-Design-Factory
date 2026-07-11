# TDF-09 · FIX-03
**Image provider: OpenRouter, not Google direct.**
Supersedes the image-provider sections of `TDF-06 §4.4`, `PROCUREMENT §2`, and `FIX-02 §6`. Everything else stands.

- Nano Banana is called through OpenRouter (OpenAI-compatible; one SDK, one key, draft + Pro tiers, automatic provider failover). Text still goes to Claude via Anthropic directly.
- Trade-off on record: briefs and reference images pass through a third-party router before reaching Google — two hops, not one. Fine for demo data; must enter the Kenya-DPA conversation with the Fund before real hotel data flows. The ImageEngine adapter keeps this a one-file swap back to direct.
- Keys: `OPENROUTER_API_KEY` replaces `GOOGLE_IMAGE_API_KEY` (dead — removed from the tree). Same hand-off discipline as FIX-02 §6: keys are typed into `.env.local` locally, never pasted in chat.
- Models (confirmed live against openrouter.ai/models 2026-07-11 — the -preview slugs are promoted): draft `google/gemini-3.1-flash-image` (the 4-variant gallery), final `google/gemini-3-pro-image` (the one selected asset, re-rendered from the chosen draft so the download matches the thumbnail), fallback `google/gemini-2.5-flash-image`.
- Adapter (`lib/ai/image/openrouter.ts`, server-only): N parallel draft calls with Promise.allSettled (partial failure still returns a gallery), one retry per call, aspect ratio via image_config driven from outputFormat, data-URL decode tolerant of PNG/JPEG/WebP.
- Metadata: every output re-encoded to WebP on receipt (drops EXIF, normalises format), stored as gen_{nanoid}.webp; no provider name in bytes, filenames, headers or JSON reaching the client. SynthID left intact by design — it is honest, and not ours to strip.
- Guards: `openrouter|fal.ai|synthid` never in app/** or components/**; `openrouter` confined to lib/ai/** and .env.example.
- Cost: per finished asset ~$0.30; MONTHLY_GENERATION_QUOTA per-workspace cap enforced at intake (default 30). Set a hard prepaid credit cap on the OpenRouter account.

*The Design Factory · FIX-03 · Image via OpenRouter · A Genesis project · Supported by the Tourism Fund · Powered by Jitume*
