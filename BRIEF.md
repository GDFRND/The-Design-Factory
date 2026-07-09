# Build Prompt — The Design Factory · Hospitality Marketing Platform
**v2 · scoped to Ship One**
> Paste this whole file into Claude Code as the initial brief. Keep it at the repo root as `BRIEF.md` so it stays in context. Everything in §2 is a hard constraint; everything in §8 is deliberately out of scope.
---
## 0. Read this before writing any code
Four assumptions in the reference material are wrong. Do not implement them literally.
1. **There is no "Projects" concept in the Anthropic API.** Projects are a claude.ai UI feature, not an API primitive. "One project per hotel" is implemented as a **`Workspace` row in our own database** plus a **brand dossier** we assemble and inject as a cached system-prompt block on every request. Verify the current API surface at `https://docs.claude.com/en/api/overview` before wiring anything.
2. **Claude does not generate images.** Text, reasoning and prompt expansion go to Claude. Images go to a separate provider behind an `ImageEngine` adapter. Neither vendor is ever named in the UI, in `alt` text, in filenames, or in any response the browser can see.
3. **The reference components (VEX hero, `premium-auth.tsx`, `v0-ai-chat.tsx`, `ai-gen.tsx`, `footer-1.tsx`) are structural references only.** Their colours, radii, fonts and copy are all off-brand. Rebuild each against §2. `purple`, `indigo`, `fuchsia`, `violet`, `#1B004D`, `#2E0A6F`, `neutral-*` and `zinc-*` must not survive to the final codebase.
4. **There is no hero video.** See §5.1 — a three-image cycle replaces it.
Model IDs, headers and SDK signatures change. Read the live docs rather than trusting anything hardcoded in this brief.
---
## 1. Stack
- **Next.js (App Router) + TypeScript.** Not Vite. We need server route handlers to hold the Anthropic key and the image-provider key; a static SPA cannot.
- **Tailwind CSS**, configured against the tokens in §2 — no raw hex in components.
- **shadcn/ui**, components in `@/components/ui`. Keep this path exactly; the supplied code imports from it and the shadcn CLI writes there by default.
- **Prisma + PostgreSQL** (Neon).
- **Vercel Blob** (or S3-compatible) for brand assets and generated output. Signed URLs only.
- **Auth:** email + password (`argon2`) **and Google OAuth**. Sessions in httpOnly cookies.
- `lucide-react`, `zod` at every boundary, `@anthropic-ai/sdk` server-side only.
Scaffold, then commit before building features.
---
## 2. Brand system — non-negotiable
Source: `TDF-SYS-01` (marketing) and `TDF-BRD-01` (logo & colour). Encode all of this as CSS custom properties in `app/globals.css` and mirror it into `tailwind.config.ts`. **A component that hardcodes a colour, radius, duration or spacing value is a bug.**
### 2.1 Colour
| Token | Hex | Role |
|---|---|---|
| Graphite `--tdf-950` | `#0D0F13` | Primary |
| Iron `--tdf-700` | `#3B3F48` | Secondary |
| Fog `--tdf-200` | `#DBDCDA` | Line |
| Paper `--tdf-025` | `#FAFAF9` | Surface |
| Blueprint `--tdf-accent-500` | `#1F3FD8` | Accent |
| Blueprint Lt | `#7C90F0` | Accent, dark surfaces only |
Full 13-step ramp: `#FFFFFF #FAFAF9 #F4F4F3 #EAEAE8 #DBDCDA #C2C4C2 #9A9DA1 #71757B #545862 #3B3F48 #262A31 #171A1F #0D0F13`.
Accent ramp: `050 #EEF1FE · 100 #DDE3FC · 400 #4E67E4 · 500 #1F3FD8 · 600 #1832AE · 700 #142887`.
Semantic: success `#10714F`, warning `#8A5A00`, danger `#B0302A`.
**Rules that must survive review:**
- Working ratio per composition: **60 Paper / 25 Graphite / 9 Iron / 4 Fog / 2 Blueprint**.
- **Blueprint appears once per viewport**, on the one thing you want clicked. Two blueprint elements on a screen means one is decorative — remove it. Never tint it to make it "fit".
- **Blueprint on Graphite is 2.52:1 and fails WCAG.** On dark surfaces the accent switches to Blueprint Lt (6.49:1). Enforce via `[data-theme="dark"] { --accent:#7C90F0 }`, never per-component.
- Ship light + dark. Dark: `--bg:#0D0F13 --bg-raised:#171A1F --bg-sunken:#08090C --fg:#F4F4F3 --line:#262A31`.
### 2.2 Type
Load via `next/font/google`: **Newsreader** (300, 400, 300 italic), **Inter** (300–700), **JetBrains Mono** (400, 500).
- **Newsreader** — display only. Never below 24px. Never in buttons, labels, inputs, or any repeated UI text.
- **Inter** — every heading, every control, everything a person reads twice. Body 17px on marketing surfaces, 15px in product. Measure never exceeds 68 characters.
- **JetBrains Mono** — eyebrows, spec labels, the tagline, stat keys. Uppercase, 0.12–0.16em tracking, 10–12px. Never forms a sentence.
Scale: Display 1 `Newsreader 300 · 64/1.04 · −0.02em`. Display 2 `48/1.08 · −0.018em`. Display Italic `Newsreader 300 italic · 28/1.2` — **one phrase per page, in Blueprint**. H1 `Inter 600 · 28/1.2 · −0.02em`. H2 `Inter 600 · 22/1.3`. Body `Inter 400 · 17/1.65`. Caption `Inter 400 · 12/1.5`. Mono label `JetBrains Mono 500 · 12 · 0.12em`.
### 2.3 Space, radius, elevation, motion
- Base unit **4px**. Steps `4 8 12 16 24 32 48 64 96 128`. **Never invent a value — round to the nearest step.** Sections breathe at 96px desktop, 64px mobile.
- Radius `0 flush · 2 chip · 4 input · 8 card · 12 panel · 20 band · full button`. Buttons are **pill-shaped**, not `rounded-lg`.
- Elevation 0–4 (flat / raised / floating / popover / modal), shadows tinted `rgba(13,15,19,·)`.
- Durations `120 / 180 / 260 / 420ms`. Easing `cubic-bezier(.2,.6,.2,1)`.
  **One documented exception:** `--d-ambient: 1200ms` and `--d-hold: 6000ms` exist solely for the hero image cycle (§5.1). They are ambient, not interactive. No other component may use them.
- Honour `prefers-reduced-motion: reduce` globally.
- Container `1200px`. Gutter `clamp(20px, 5vw, 64px)`.
- Focus `2px solid var(--focus)` at `2px` offset. Never removed.
### 2.4 Logo & the brand family
Four marks are supplied for The Design Factory:
| File | Use |
|---|---|
| `markgraphite.png` | Positive — on Paper |
| `markpaper.png` | Reversed — on imagery and dark surfaces |
| `markblueprint.png` | Single-colour accent use, once |
| `markdimensional.png` | **Dark surfaces only. Never on Paper.** |
- Wordmark is **Newsreader 400 at −0.015em**, with *Factory* in **400 italic, Blueprint** (Blueprint Lt on dark).
- Tagline **"Built to be built on"** — JetBrains Mono, 8px, 0.22em tracking, uppercase, Ash. Never italicised, never oversized, never without the wordmark, never translated.
- Clear space `x = ¼ mark height` on all sides. Nothing enters that field.
- Minimum sizes: lockup 96px, mark 40px, app-icon-in-container 32px. Never rotate, stretch, shadow, outline, re-hue, or redraw.
**The brand family — get this right, it is the most-misread part of the brief:**
| Entity | Role | Treatment |
|---|---|---|
| **The Design Factory** | The product. The hero. | Full lockup: mark + wordmark + tagline. Owns the site. |
| **Tourism Fund** | Institutional partner / funder | **Logo only. Rendered larger than ours.** |
| **Genesis** | Parent company | **Logo only.** No wordmark, no tagline. |
| **Digital Media Factory** | Sibling standalone project | **Logo only.** No wordmark, no tagline. |
Assets live in `/public/brand/`: `tdf-mark-{graphite,paper,blueprint,dimensional}.png`, `tourism-fund.{svg,png}`, `genesis.{svg,png}`, `digital-media-factory.{svg,png}`.
**Two lockup components. Build both once, use them everywhere:**
```tsx
<InstitutionalLockup variant="reversed" />
// TDF mark  ·  1px Fog rule at 1x clearance  ·  mono "SUPPORTED BY"  ·  Tourism Fund mark
// Tourism Fund cap height = 1.4× TDF cap height.
// TDF leads (left). The Fund is larger because it endorses; we lead because it is our surface.
<PartnerStrip />
// Footer only. Genesis · Digital Media Factory. Marks at equal cap height, Fog rule between,
// mono caption "A GENESIS PROJECT" above. Never larger than the TDF lockup.
```
> **Deviation flag:** `TDF-BRD-01 §10` specifies equal cap height for co-branding. The Tourism Fund at 1.4× is a deliberate, approved exception for institutional endorsement. Add it to the brand doc as a documented variant rather than letting it become an undocumented habit. Do not let it propagate to Genesis or Digital Media Factory.
### 2.5 The spec plate
The signature device. A hairline rule above, then `§NN` + section name in mono, and a right-aligned mono note. Build as `<SpecPlate no="§03" name="Create marketing assets" note="Three steps · no AI knowledge required" />` and open every marketing section with it.
---
## 3. Data model (Prisma)
```
User            id, email, passwordHash?, googleId?, name, phone, emailVerifiedAt, createdAt
Membership      userId, workspaceId, role
Role            HOTEL_MARKETER | HOTEL_APPROVER | CREATIVE_SUPPORT_ASSISTANT | ADMIN
Workspace       id, hotelName, slug, county, propertyType, roomCount, isDemo, createdAt
Assignment      assistantId (User), workspaceId
HotelProfile    workspaceId, location, roomCategories[], restaurant, conference,
                wellness, spa, buffet, targetCustomers[], sellingPoints[],
                seasonalOffers[], contact, bookingUrl, socials, websiteUrl
BrandAsset      id, workspaceId, kind, storageKey, mime, bytes, extracted Json
                kind = LOGO | GUIDELINES | FONT | PHOTOGRAPHY | POSTER | SOCIAL_SAMPLE
                     | MENU | ROOM_IMAGE | BROCHURE | PAST_CAMPAIGN | WEBSITE_SHOT | REFERENCE
BrandSystem     workspaceId, palette Json, typography Json, imageStyle, toneOfVoice,
                layoutApproach, campaignStyle, provisional Boolean, completion Int
Conversation    id, workspaceId, userId, title, createdAt
Message         conversationId, role, content Json, attachments[]
Generation      id, workspaceId, conversationId, assetType, outputKind, rawBrief,
                expandedPrompt Json, status, createdAt
                outputKind = IMAGE | TEXT | COMPOSITE
Variant         id, generationId, imageKey?, copy Json?, selected, refinements Json[]
                // COMPOSITE variants carry both: imageKey AND copy blocks
Approval        id, variantId, stage, reviewerId, decision, note, createdAt
                stage    = SUPPORT_REVIEW | HOTEL_APPROVAL
                decision = PENDING | CHANGES_REQUESTED | APPROVED
SupportTicket   id, workspaceId, authorId, assigneeId, body, status, createdAt
```
Every query is scoped by `workspaceId` derived from the session. Enforce it in a single `withWorkspace()` guard, not per-route. Add Postgres row-level security as a second line of defence.
---
## 4. AI layer
### 4.1 Brand dossier injection
On login, resolve the user's workspace. Before any Claude call, assemble a **brand dossier** — a markdown block built from `HotelProfile` + `BrandSystem` + a manifest of `BrandAsset`s with their extracted palette/typography metadata. Send it as a **system-prompt block marked for prompt caching** so it isn't re-billed every turn. Check the current caching syntax in the docs first.
The dossier should read like a brief, not a JSON dump: name, location, property type, room categories, F&B, facilities, who they sell to, what they're proud of, approved tone, palette hexes, typefaces, image style, layout habits, three sentences summarising past campaigns.
### 4.2 System prompt
The assistant **is the platform**. It has no other name.
- Never mention Claude, Anthropic, Google, Gemini, Nano Banana, OpenAI, Midjourney, DALL·E, or any model or vendor. If asked what it is: *"I'm the platform's creative assistant."*
- Brand voice: plain, structural, unhurried. Short sentences. No exclamation marks. No *unleash*, *elevate*, *game-changer*, *supercharge*.
- It never asks the user to think about AI. It asks about the offer, the guest, the date, the price.
- Kenyan hospitality is the default frame: counties, seasons, domestic vs international guests, travel trade, MICE, coastal vs safari vs city.
### 4.3 Prompt expansion — the step before generation
The user's short brief is **never sent straight to an image engine.** Claude expands it into a structured, editable creative prompt. Ask for JSON only, no prose, no fences; parse defensively (strip fences, `try/catch`, one retry with a repair instruction).
```ts
type ExpandedPrompt = {
  assetType: string
  outputKind: 'IMAGE' | 'TEXT' | 'COMPOSITE'
  targetAudience: string
  marketingObjective: string
  keyMessage: string
  offerDetails: { price?: string; validity?: string; inclusions?: string[]; terms?: string }
  toneOfVoice: string
  visualDirection: string      // omitted when outputKind === 'TEXT'
  suggestedLayout: string
  brandApplication: string     // how this hotel's palette / type / imagery apply
  callToAction: string
  outputFormat: string         // e.g. 1080×1350, IG feed
  missingDetails: string[]
}
```
Render as an **editable form**, one field per key. `missingDetails` shown as amber prompts. Then a single **Create** button — the only Blueprint element on that screen.
### 4.4 Image generation
**Provider: Nano Banana** (Google's Gemini image model), via `GOOGLE_IMAGE_API_KEY`. Look up the current model identifier in Google's docs; do not hardcode one from memory. It stays behind an adapter so we can swap it without touching a component:
```ts
interface ImageEngine {
  generate(p: ExpandedPrompt, brand: BrandDossier, n: number): Promise<Buffer[]>
  refine(base: Buffer, instruction: string, brand: BrandDossier): Promise<Buffer[]>
}
// implementations/nano-banana.ts — the only file that imports the provider SDK
```
**No engine selector in the UI.** The assistant chooses. The user picks an asset type and describes an offer; everything else is our job. Strip provider metadata (EXIF, response headers, model fields) server-side before anything reaches the client. Generated files are named `gen_{nanoid}.webp`.
### 4.5 Output kinds
- **`IMAGE`** — poster, social post, story, room promotion. Variant gallery.
- **`TEXT`** — email sales letter, WhatsApp message, landing page copy, follow-up message. A **document editor** (contenteditable or Tiptap), not a gallery, with tone chips down the side.
- **`COMPOSITE`** — brochure, newsletter, offer campaign. **Split view:** imagery on the left, copy blocks on the right, sharing one brand context, exported together. This is the common case for hospitality — a brochure is branded artwork *and* branded words — so build `COMPOSITE` first and treat `IMAGE`/`TEXT` as degenerate cases of it, not the other way round.
### 4.6 Refinement
Refinement chips post the instruction plus the selected variant back through `refine()`, appending to `Variant.refinements`. Chips: Refine · Regenerate · Edit text · More premium · More local · More corporate · More youthful · More luxurious · More family-friendly · Apply brand colours · Use different image · Download · Send for approval. Free-text refinement box below the chips.
### 4.7 Approval — two sequential stages
`Send for approval` opens a stage picker:
1. **`SUPPORT_REVIEW`** *(optional, skippable)* — the assigned Creative Support Assistant checks the asset, can request changes.
2. **`HOTEL_APPROVAL`** *(required before download-for-publishing)* — a workspace member with role `HOTEL_APPROVER` signs off.
The person creating the asset is almost never the person who may publish it. Model that: an approval is a row, not a boolean; it records who, when, and what they said. Notify by email with a magic link into the variant. The full CSA dashboard is Ship Two (§8) — Ship One only needs: create the `Approval`, email the reviewer, show a `PENDING · AWAITING {name}` mono badge on the variant, and let the reviewer approve or request changes from the variant page.
### 4.8 Brand completion score
One pure function over `BrandAsset` + `HotelProfile` returning `{ percent, missing: {label, weight, cta}[] }`, so the number can never disagree with itself across screens. Copy is instructional, never nagging: *"Add your room types so we can build better offers."*
If a hotel has only a logo and a few old posters, run inference: sample the logo for a palette, classify the poster typography, propose a provisional system, and label it **Provisional** in mono until the user confirms.
**Gate:** a workspace cannot generate until (a) the owner's email is verified and (b) `BrandSystem.completion ≥ 25%` — i.e. at least a logo and the hotel basics. Show the gate as an encouraging card, not an error.
---
## 5. Screens
### 5.1 Hero (`/`) — image cycle, no video
Three full-bleed images at `/public/hero/1.jpg`, `2.jpg`, `3.jpg` (Kenyan hospitality: lodge, coast, city hotel). Cross-fade between them.
- Each layer `absolute inset-0 object-cover`, rendered with `next/image`, `priority` on the first, `sizes="100vw"`.
- **Hold `--d-hold` (6s), cross-fade `--d-ambient` (1200ms)**, linear opacity, looping 1→2→3→1. Simultaneously a slow **Ken Burns** drift: `scale(1.00) → scale(1.06)` over the full 7.2s cycle, `transform-origin` alternating between layers so it doesn't pulse.
- Preload all three; never render a blank frame between layers.
- `prefers-reduced-motion: reduce` → render image 1 only, static, no drift, no cycle.
- **No dimming overlay.** Legibility comes from the reversed lockup and the glass panels, per `TDF-BRD-01`: *on imagery — reversed only*. Choose the three images with a dark lower-left quadrant; if the supplied crops don't have one, tell me rather than adding a scrim.
- Progress: three 24px mono rules bottom-right, the active one Paper, the others Fog at 30%. Clickable — this is the only interactive element in the background layer, so it must be focusable and labelled.
**Navbar** — inside `px-6 md:px-12 lg:px-16 pt-6`. A `.tdf-glass` bar, radius 12, `px-4 py-2`, `flex items-center justify-between`.
- Left: `<InstitutionalLockup variant="reversed" />` — TDF mark, Fog rule, `SUPPORTED BY`, Tourism Fund mark at 1.4× cap height.
- Centre (`hidden md:flex`, `gap-8`): How it works · Brand system · Support. Mono, 11px, uppercase, `0.14em`, Fog → Paper on hover, `180ms`.
- Right: **Sign in** (ghost, Paper text) · **Create account** (pill, Paper bg, Graphite text, hover → Blueprint Lt bg / Graphite text). One accent. Create account wins.
**Content** — bottom-anchored: `flex-1 flex flex-col justify-end`, `pb-12 lg:pb-16`, `lg:grid lg:grid-cols-2 lg:items-end`.
- Eyebrow, mono: `A GENESIS PROJECT · SUPPORTED BY THE TOURISM FUND`
- **Headline**, Newsreader 300, `clamp(2.75rem, 7vw, 5.25rem)`, `line-height 1.02`, `letter-spacing −0.02em`, `max-width 16ch`, Paper, italic Blueprint Lt on one word:
  > The Design *Factory*
- Sub-headline, Inter 400, `clamp(1rem, 1.6vw, 1.2rem)`, `max-width 52ch`, `--tdf-300`:
  > An AI marketing department for every hotel, lodge and resort in Kenya. Describe the offer. We handle the rest.
- Buttons: **Create account** (pill, Paper/Graphite) · **Explore demo** (pill, `.tdf-glass`, `1px rgba(219,220,218,.2)` border, Paper text, hover → Paper bg / Graphite text).
- Right column, bottom-right: `.tdf-glass` card, radius 12, `px-6 py-3`, mono uppercase `0.14em`: `POSTERS · CAMPAIGNS · OFFERS · FOLLOW-UP`.
**Entrance animation.** Keep the character stagger from the reference, retuned to our tokens: 200ms initial delay, `charDelay 30ms`, per-character transition **260ms** (not 500), from `opacity 0 / translateX(−18px)`. Spaces render as ` `. Then `<FadeIn>` the sub-headline at 800ms, buttons at 1200ms, tag at 1400ms, each over **420ms**.
Build `<AnimatedHeading text speed />` and `<FadeIn delay duration>` as two small client components. `AnimatedHeading` splits on `\n` into lines, then into characters, each an `inline-block` span. Put a plain-text `aria-label` on the heading and `aria-hidden` on the spans, or a screen reader will read it letter by letter. Under `prefers-reduced-motion`, render the final state immediately.
**Glass utility** — recoloured to Graphite:
```css
.tdf-glass{
  background: rgba(13,15,19,.40);
  background-blend-mode: luminosity;
  backdrop-filter: blur(4px);
  -webkit-backdrop-filter: blur(4px);
  border: none;
  box-shadow: inset 0 1px 1px rgba(250,250,249,.10);
  position: relative; overflow: hidden;
}
.tdf-glass::before{
  content:''; position:absolute; inset:0; border-radius:inherit; padding:1.4px;
  background:linear-gradient(180deg,
    rgba(250,250,249,.30) 0%, rgba(250,250,249,.10) 20%,
    rgba(250,250,249,0) 40%, rgba(250,250,249,0) 60%,
    rgba(250,250,249,.10) 80%, rgba(250,250,249,.30) 100%);
  -webkit-mask:linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0);
  -webkit-mask-composite:xor; mask-composite:exclude; pointer-events:none;
}
```
### 5.2 Marketing sections below the fold
Each opens with a `<SpecPlate>`. Sections are `96px` vertical padding with a `1px Fog` bottom rule. No section invents a new page shape — stated hero, evidence grid, closing band.
`§01 Why this exists` — the Tourism Fund's mandate; the levy returning as a tool. Restrained, institutional.
`§02 Build your hotel brand system` — upload logo, guidelines, fonts, photos, old posters, menus, room images, brochures, past artwork, reference brands. We infer a provisional system from whatever exists.
`§03 Complete your brand profile` — the gamified counter, as a live demo widget stepping 35% → 60% → 100%.
`§04 Create marketing assets` — three numbered cards in the `01 — INTAKE` style from `TDF-SYS-01`: *Choose what you want · Describe your offer · Review and create.*
`§05 Refine and approve` — variant gallery, chips, comments, the two approval stages.
`§06 Human support layer` — the Creative Support Assistant, drawn from the Digital Media Factory. Each assistant carries 5–10 properties.
`§07 Built for Kenyan hospitality` — client-strip pattern; hotel categories as mono labels.
`§08 Closing band` — Graphite band, Newsreader display, `Create account` / `Sign in` / `Request support`.
### 5.3 Auth — right-hand sheet, not a page
**Sign in** / **Create account** slide a panel in from the right **over** the hero. Width `min(440px, 100vw)`, full height, Paper surface, radius `12px 0 0 12px`, elevation 4, backdrop `rgba(13,15,19,.5)` with `blur(2px)`. Slide `260ms cubic-bezier(.2,.6,.2,1)`. Trap focus, `Esc` closes, restore focus to the trigger, `role="dialog" aria-modal="true"`.
Adapt `premium-auth.tsx`:
- **Keep:** modes (`login | signup | reset`), steps (`details | verification | complete`), real-time validation, blur-to-touch, password-strength meter, remember-me, 6-digit verification.
- **Add:** *Continue with Google* as the first option, above a `1px Fog` rule with a mono `OR` label. It is the least friction for a hotel marketer on a phone.
- **Strip:** `localStorage` for everything except the remembered email. No tokens client-side, ever.
- **Restyle:** inputs radius **4** (not `rounded-xl`); buttons **pill**; strength bar recoloured `danger → warning → --tdf-400 → accent-400 → success`; tabs become a Fog-bordered segmented control, not a `bg-muted` pill; every `text-primary` → `--accent`, every `border-input` → `--line`. Headings Inter 600, **not** Newsreader. Tab labels mono uppercase.
- **Server actions:** `signup`, `login`, `googleCallback`, `verifyEmail`, `requestReset`. Rate-limit by IP + email. Generic errors — never reveal whether an email exists.
- **On signup:** create `User` + `Workspace` + `Membership(HOTEL_MARKETER, owner)` in one transaction, seed `BrandSystem` at 0%, send verification email, redirect into onboarding. **Email verification is required before the workspace can generate anything.**
### 5.4 "What are we building today?" (`/studio`)
A modal over the hero on first visit; thereafter it *is* the dashboard.
- Greeting, Newsreader 300, 48px: **Hello, {firstName}. What are we building today?**
- Under it, the completion pill, mono: `BRAND PROFILE · 35% COMPLETE` → links to onboarding. Amber below 60%. If below 25%, generation is disabled and the pill becomes the primary action.
Three input areas, stacked:
1. **Asset type** — shadcn `Select`, radius 4. Poster · Social media post · Instagram story · Facebook post · LinkedIn post · Email sales letter · WhatsApp marketing message · Hotel offer campaign · Room promotion · Restaurant or buffet promotion · Wellness package · Conference or event package · Branding an uploaded image · Brochure · Landing page copy · Newsletter · Customer follow-up message · Lead generation campaign · Other. Each option carries its `outputKind` (§4.5) so the workspace knows which surface to open.
2. **The brief** — auto-resizing textarea (min 60px, max 200px; the `useAutoResizeTextarea` hook from `v0-ai-chat.tsx` is correct — keep it). Label: *Describe the asset you want to create in detail.* Placeholder is the weekend-buffet example. Helper text lists what to include: who it's for, the offer, the objective, audience, price, dates, location, CTA, tone, platform, guest segment.
   - Toolbar: **Attach** (paperclip → multi-file, images + PDF, drag-and-drop, paste) and **Send** (arrow, pill, Blueprint when the field is non-empty, Fog when empty — the screen's one accent). **No engine picker.**
   - Attachments render as thumbnail chips with name, size, remove. Clicking one opens a **lightbox viewer** — zoom, pan, arrow-key paging, and a `Use as reference` / `Brand this image` toggle. Hoteliers attach images more than anything else; this viewer is not optional.
   - `Enter` sends, `Shift+Enter` newlines.
3. **Need help improving this?** — a smaller panel opening a `SupportTicket` against the assigned Creative Support Assistant, with their name and avatar. Quick prompts: *"I'm not sure what campaign to run for Easter." · "Help me build a package for business travellers." · "What should I post this week?"*
Quick-action row (from `v0-ai-chat.tsx`, restyled to Fog-bordered pills on Paper): Weekend buffet · Room offer · Conference package · Brand an image · Follow-up message.
Submit → prompt expansion (§4.3) → editable form → **Create**.
### 5.5 Creation workspace (`/studio/[generationId]`)
Adapt `ai-gen.tsx`, stripped of its three-tab structure.
- **Left rail:** the expanded prompt, still editable. Variant count.
- **Centre**, by `outputKind`:
  - `IMAGE` → 2×2 gallery, `aspect-[4/5]`, radius 8, Fog border.
  - `TEXT` → document editor, 68-character measure, tone chips in the left margin.
  - `COMPOSITE` → split view: artwork left, copy blocks right, one **Export together** action.
- **Loading state:** mono rotating captions on a Fog progress rail — *Composing the layout… / Setting the type… / Placing the offer…* The ring is `--tdf-400`, the bar is Blueprint. **Never a fuchsia spinner.**
- Select a variant → detail view → refinement chips + comment box (§4.6) + `Send for approval` (§4.7).
- **Right rail:** recent generations, approval status, download.
- Meta strip: format, dimensions. **No vendor names anywhere** — not in the UI, not in `alt` text, not in filenames, not in network responses.
- History drawer with prompt search, from `renderHistory()`.
Use `next/image` throughout. Never a bare `<img>` for generated content.
### 5.6 Brand onboarding (`/studio/brand`)
Uploader with the twelve asset kinds. Each accepted upload bumps the score with a `420ms` count-up and a mono line: `+8% · LOGO RECEIVED`. Missing items are cards with a one-line reason and a CTA.
When we propose a provisional system, show it as a spec sheet — palette swatches with hexes, type specimens, image-style board, tone-of-voice paragraph — each row with **Confirm** / **Change**. Nothing is treated as approved until confirmed.
### 5.7 Footer
Discard `footer-1.tsx` entirely — the gradient and the purple are both wrong.
- Graphite band, Paper text, `96px` top padding.
- `<InstitutionalLockup variant="reversed" />`, centred: TDF mark + wordmark (Paper, *Factory* in Blueprint Lt) + tagline, Fog rule at 1x clearance, `SUPPORTED BY`, Tourism Fund mark at 1.4× cap height.
- One sentence, `max-width 52ch`, `--tdf-400`: *Every hospitality business deserves consistent, professional, high-quality marketing. This gives them the tools, the intelligence and the creative support to get there.*
- Three link columns: Platform · Support · Legal.
- Bottom rule (`1px #262A31`), then `<PartnerStrip />` — mono caption `A GENESIS PROJECT`, then the Genesis and Digital Media Factory marks at equal cap height with a Fog rule between. These are smaller than the TDF lockup and carry no wordmarks.
- Final mono line, 9px, `0.12em`, uppercase: `THE DESIGN FACTORY · © 2026`.
- The tagline **Built to be built on** appears only inside the lockup, at 8px / 0.22em / uppercase / Ash. Nowhere else on the page.
---
## 6. Demo seed data
`isDemo: true`. Three fictional properties, one per hero image, so *Explore demo* lands somewhere that feels real. Invent plausible brand kits — logo wordmark, two-colour palette, a rate sheet, three room categories, one restaurant, one past poster. Mark every seeded asset `PROVISIONAL` so nothing pretends to be a real client's approved system.
Suggested: a Maasai Mara tented camp, a Diani beach resort, a Nairobi business hotel. Seed one `Generation` per property with two `Variant`s and one `Approval` at `HOTEL_APPROVAL / PENDING`, so the approval badge has something to render. Keep the seed script idempotent.
---
## 7. Build order
1. Scaffold + tokens + `tailwind.config.ts` + fonts + theme toggle. Commit.
2. Primitives: `Button`, `Input`, `Select`, `Textarea`, `Card`, `Sheet`, `Dialog`, `SpecPlate`, `MonoLabel`, `InstitutionalLockup`, `PartnerStrip`, `FadeIn`, `AnimatedHeading`, `HeroCycle`. Expose them on a `/kitchen-sink` route.
3. Hero + marketing sections + footer. Static, no auth.
4. Prisma schema + migrations + auth (password + Google) + verification + the sheet.
5. Workspace scoping, brand dossier assembly, completion scorer, the 25% gate.
6. `/studio` — three input areas, uploads, lightbox viewer.
7. Claude route handler: streaming chat + prompt expansion + JSON repair.
8. `ImageEngine` + Nano Banana adapter + `COMPOSITE` workspace + refinement.
9. Approval rows, reviewer email, `PENDING` badge.
10. Seed script, a11y pass, Lighthouse, deploy to Vercel.
Commit at every numbered step. Write Vitest coverage for the completion scorer and the JSON-repair parser — those two are where this will break.
---
## 8. Explicitly out of scope for Ship One
Do not build these. Do not stub them with `TODO` components in the nav. Leave the routes absent.
- Campaign library and campaign folders
- Templates section (the twenty hospitality templates)
- Creative Support Assistant dashboard (assignments, ticket queue, asset approvals across properties)
- Multi-workspace switching
- Analytics, publishing integrations, scheduled posting
Ship One is: **hero → auth → brand onboarding → studio → prompt expansion → generation → refinement → approval → download.**
---
## 9. Acceptance checklist
- [ ] `rg -i 'purple|indigo|fuchsia|violet|zinc-|neutral-|#1B004D|#2E0A6F|VEX|prebuiltui'` returns nothing.
- [ ] `rg -i 'claude|anthropic|gemini|nano.?banana|openai|midjourney|dall|stable.?diffusion'` returns nothing under `app/**` and `components/**` except server route handlers, `lib/ai/**`, and `.env.example`.
- [ ] No raw hex in `components/**`. Every colour is a token.
- [ ] Newsreader never renders below 24px and never inside a button, input or label.
- [ ] Exactly one Blueprint element per viewport on hero, auth sheet, `/studio`, creation workspace.
- [ ] Blueprint never sits on Graphite; dark theme uses Blueprint Lt.
- [ ] Contrast: Graphite/Paper 18.37:1 · Iron/Paper 10.10:1 · Blueprint/Paper 7.28:1. Ash only at ≥18px.
- [ ] Tourism Fund mark renders at 1.4× TDF cap height; Genesis and Digital Media Factory at 1.0×; clear space `x = ¼ mark height` honoured everywhere.
- [ ] Lockup never below 96px; mark never below 40px.
- [ ] `prefers-reduced-motion` freezes the hero cycle on image 1 and short-circuits every stagger and `FadeIn`.
- [ ] Heading has a plain-text `aria-label`; character spans are `aria-hidden`. Hero progress rules are focusable and labelled.
- [ ] Auth sheet traps focus, closes on `Esc`, restores focus. Google button is keyboard-reachable first.
- [ ] Generation is blocked until email is verified **and** completion ≥ 25%.
- [ ] `ANTHROPIC_API_KEY` and `GOOGLE_IMAGE_API_KEY` appear only in server code. Grep the client bundle to prove it.
- [ ] Every DB read is workspace-scoped. Attempting to read another workspace's `Generation` returns 404, not 403.
- [ ] Uploads validated by magic bytes, not extension. Size-capped. Served from signed URLs.
- [ ] Generated images carry no provider EXIF and no vendor string in the filename.
- [ ] Lighthouse ≥ 95 performance and accessibility on `/`.
---
*The Design Factory · A Genesis project · Supported by the Tourism Fund · Built to be built on*
