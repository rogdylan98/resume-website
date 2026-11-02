# Design system — "The Brief"

Concept: the site reads like a beautifully typeset strategy report from a top-tier consultancy,
engineered like a product built by a senior design-engineer. Editorial restraint + data exhibits +
precise micro-interactions. Think: printed annual report meets Linear/Stripe-grade frontend craft.
NOT: generic dark portfolio, gradients-everywhere, glassmorphism, emoji, stock icons, template look.

## Principles
1. Typography carries the design. Large serif display, disciplined sans for UI, mono for data labels.
2. Every number is an "Exhibit": numbered (Exhibit 01, 02…), titled, with a source/footnote line in mono
   (e.g. "Note: 96% is a 5-year projection; 79% realized across 4 releases."). Honesty is a design feature.
3. Hairline rules (1px, --rule), a strict 12-col grid, generous whitespace. Align everything.
4. One accent color, used sparingly for data and focus. No decorative gradients.
5. Motion is purposeful, fast (≤600ms), eased with --ease-out; everything respects prefers-reduced-motion.
6. Craft details: tabular numerals, optical sizing, text-wrap: balance/pretty, hanging punctuation,
   :focus-visible rings, skip link, semantic landmarks, 44px touch targets, no layout shift.

## Tokens (defined in src/css/tokens.css — USE THESE, never hardcode colors/fonts)
Colors (light): --paper #F5F3EE, --paper-2 #ECE9E1 (raised/alt band), --ink #0D1117, --ink-2 #3A3F47 (body),
--ink-3 #6B7079 (muted/meta), --rule rgba(13,17,23,.12), --accent #2F4BFF (ultramarine), --accent-ink #fff,
--accent-soft rgba(47,75,255,.10), --data-2 #9AA6FF (secondary series / projected), --hl rgba(47,75,255,.14).
Dark theme ([data-theme="dark"] or prefers-color-scheme): --paper #0B0E13, --paper-2 #11151C, --ink #F2F0EA,
--ink-2 #C4C7CE, --ink-3 #8A9099, --rule rgba(242,240,234,.12), --accent #7C8CFF, --data-2 #3B4699.
Fonts: --f-display "Instrument Serif" (display, italic for emphasis); --f-sans "Inter" (UI/body, variable);
--f-mono "JetBrains Mono" (exhibit labels, meta, dates, numbers in captions).
Type scale (fluid clamp): --t-hero, --t-h1, --t-h2, --t-h3, --t-body, --t-small, --t-micro.
Space: --s-1..--s-10 (4px base, fluid at the top end). Radius: --r-1 4px, --r-2 10px (use sparingly).
Easing: --ease-out cubic-bezier(.16,1,.3,1); --dur-1 160ms, --dur-2 320ms, --dur-3 600ms.
Layout: .wrap (max 1240px, fluid gutters, 16px min on mobile), .grid (12 col, gap var(--gutter)).

## Shared components (in src/css/base.css — reuse, don't redefine)
- .eyebrow — mono, micro, uppercase, letter-spaced, --ink-3, with optional index ("01 — Impact").
- .section — vertical rhythm; each section begins with a hairline rule + .section-head (index, eyebrow, h2).
- .exhibit — figure wrapper: .exhibit__label ("EXHIBIT 01"), .exhibit__title, body, .exhibit__note (mono, small).
- .btn, .btn--primary, .btn--ghost; .link-arrow (animated arrow on hover).
- .reveal — elements fade/translate in when [data-inview] is set by core.js IntersectionObserver.
- Capture mode: <html class="capture"> (set by ?capture in URL) disables ALL animation/transition and shows
  final states (counters at final values, charts drawn). Every section MUST look complete in capture mode —
  the visual critic judges screenshots taken in capture mode.

## Section map (order) and ownership
00 nav (sticky, minimal, progress hairline, theme toggle, ⌘K trigger)  → partials/nav.html, css/nav.css, js/nav.js
01 hero (name, positioning, lead, focus, CTAs, portrait + one signature data element) → hero.*
02 impact (exhibits: metrics + STP chart realized vs projected + career timeline/Gantt) → impact.*
03 experience (roles, client sub-sections, bullets, skill tags cross-linked) → experience.*
04 capabilities (4 groups; hover/focus a skill highlights evidencing roles) + education → capabilities.*
05 contact + footer (big serif CTA, email copy-to-clipboard, links, colophon) → contact.*
global: palette (⌘K command palette), print stylesheet (site prints as a clean 1-page resume),
head meta/SEO/JSON-LD/OG → partials/head.html, css/print.css, css/palette.css, js/palette.js

## Engineering rules
- Vanilla HTML/CSS/JS, no frameworks, no build deps beyond tools/build.py (concatenates). Deployed on GitHub Pages.
- Each owner edits ONLY their own files. Section root: <section id="..." class="section" aria-labelledby="...">.
- Prefix all classes with the section name (BEM-ish): .hero__name, .xp__role, etc. No global selectors in section CSS.
- JS: each file is an IIFE or registers via window.Site.register(name, initFn); no globals otherwise.
- Use modern CSS (container queries, :has(), clamp, color-mix, scroll-driven animations with @supports fallback).
- Responsive: must be excellent at 390px, 768px, 1440px. No horizontal scroll ever.
- Accessibility: WCAG AA contrast in both themes, keyboard operable, aria where needed, alt text.
- Performance: no images beyond assets/, inline SVG for charts/icons, fonts via Google Fonts with display=swap.
