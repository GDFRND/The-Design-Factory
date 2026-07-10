# TDF-06 · Visual Direction Rev 2 + Demo Brands
**Amendment to `BRIEF.md`. Read after §2, before §5. Where the two conflict, this wins.**

## 0. Why this exists
1. **The chrome was too white.** The platform runs dark-first: `data-theme="dark"` is the default on `/studio/**` and the hero. Marketing sections below the fold stay light — the story is on paper, the work happens at night.
2. **The demo hotels are now real brands.** Rhino Fort, The Regent, and El Mara replace every fictional placeholder in `BRIEF.md §6`.

The chrome is Graphite and Blueprint. The canvas belongs to the hotel. These never touch. Recorded as documented variant `TDF-SYS-02 · Product`.

## 1. Dark-first token layer
Dark surfaces get: glass panel tokens (--glass, --glass-heavy, --glass-blur 16px), Fog-at-alpha lines (--line .10, --line-strong .18, --line-hairline .06), --bg-inset #262A31, --fg-muted #9A9DA1, --fg-subtle #71757B, accent Blueprint Lt #7C90F0 with --accent-fg Graphite and --accent-dim rgba(124,144,240,.14), orb gradients (--orb-blueprint, --orb-ash), and lift shadows (glow + border, not drop shadow). Full-strength Blueprint #1F3FD8-family survives only inside blurred orbs — never as text, fill, border or icon on dark.
Working ratio inverted: 62 Graphite · 20 Iron & raised · 10 glass · 6 Fog-at-alpha · 2 Blueprint Lt. Accent once per viewport. Type rules from BRIEF §2.2 unchanged.

## 2. Materials
- **Orbs**: blurred (120px) radial gradients, opacity .30, max two per screen (one Blueprint, one Ash), Blueprint orb never behind body copy, optional 40s translate drift, disabled under reduced motion.
- **Grain**: 2–3% opacity tiled feTurbulence overlay, mix-blend overlay, above orbs below content — kills gradient banding.
- **.panel**: var(--glass) + backdrop blur/saturate + specular top hairline; `@supports not (backdrop-filter)` falls back to solid --bg-raised.
- **Buttons**: primary Paper-on-Graphite (hover adds --lift-accent glow ring), accent Blueprint Lt (one per viewport), ghost 1px --line-strong. All pills. No gradient fills.
- **Inputs**: radius 4, bg --bg-sunken, 1px --line; focus = --accent border + 3px --accent-dim ring.

## 3. Screens
- **Hero**: keep cycle/Ken Burns/stagger/lockup; add Blueprint orb pooling light in the lower-left (mix-blend screen), grain overlay; navbar + tag card become .panel.
- **Auth**: centred split panel min(880px,92vw), --lift-3, on rgba(13,15,19,.72) blur(8px) backdrop. Left 45% (hidden < md): hero image, orb, reversed mark, one Newsreader italic line "Built to be built on." Right 55%: form on --bg-raised, Google first (white fill), OR rule, accent submit. All BRIEF §5.3 behaviour stands.
- **Studio**: Graphite, one Ash orb, grain; stacked .panels (composer --glass-heavy); Send is the only accent; ghost quick pills; inset attachment chips.
- **Creation workspace**: variants sit on .brand-canvas (--bg-inset #262A31 — never Graphite, never Paper); chrome recedes to --fg-muted; loading rail --line with --accent fill.
- **Footer**: Graphite, --line-strong top hairline, partner marks .55 opacity → 1 on hover.

## 4. Demo brands (replace BRIEF §6)
Rhino Fort Hotel (Laikipia conservancy lodge · earth/terracotta · slab serif · IMAGE demo) · The Regent Hotel & Travel (Nairobi city hotel · aubergine/gold · classical serif · TEXT demo) · El Mara Hotels, Resorts & Camps (multi-property group · scarlet/pattern · brush script · COMPOSITE demo, PENDING approval). Full brand systems, profiles and demo briefs are encoded in prisma/seed.ts — hotel palettes never appear in a stylesheet. Logos keyed to alpha with reversed variants in /public/demo/{slug}/; Details sheets stored as GUIDELINES assets. Every generated demo asset carries a DEMO watermark at 40%.

## 5. Amended acceptance
BRIEF §9 still applies, plus: no purple/violet/fuchsia/indigo/magenta words in components/** or globals.css; brand hexes only in seed + .brand-canvas at runtime; #1F3FD8 only inside --orb-blueprint; ≤2 orbs/screen, none behind body copy; grain on hero/auth/studio; @supports fallback on .panel; one accent per viewport; gallery on #262A31; Newsreader rules unchanged; DEMO watermark; alpha logos with reversed variants.

*The Design Factory · TDF-SYS-02 · Product · Rev 2026.07*
