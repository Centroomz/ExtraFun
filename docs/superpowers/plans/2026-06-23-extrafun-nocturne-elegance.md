# ExtraFun Nocturne Elegance Re-layout — Implementation Plan

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Re-skin all of ExtraFun to the editorial "Nocturne Elegance" design (Bodoni Moda headings, Montserrat body, #d4af37 champagne-gold accent, #121414 onyx bg, left-aligned 12-col asymmetric layout, editorial hero spreads), introducing Tailwind via coexistence + per-section migration, phased so the live site never breaks.

**Architecture:** Add Tailwind to the existing Vite+React app with `corePlugins.preflight:false` (the app already has a global reset in `src/index.css`, so Tailwind contributes utilities + theme tokens only — no global style upheaval). Nocturne tokens from `nocturne_elegance/DESIGN.md` ported into `tailwind.config.js` (body font overridden to Montserrat). Old inline-style/CSS-var code coexists during migration; pages are converted one phase at a time, each phase deployed and verified on the live site.

**Tech Stack:** Vite 6, React 18, wouter, Tailwind CSS 3, Supabase (untouched), `banana` skill for imagery. No unit-test harness exists; verification per task = `npm run build` passes + (after deploy) visual check on live. Repo: pinksservice/ExtraFun, local `Downloads/morefun`.

**Spec:** `docs/superpowers/specs/2026-06-23-extrafun-nocturne-elegance-design.md`

**Decisions locked:** preflight OFF (keep existing reset); body = Montserrat (override DM Sans); icons = reuse existing ExtraFun icons, add Material Symbols only where missing; 1–2 banana hero images per page.

---

## File Structure

**Created:**
- `tailwind.config.js` — Tailwind config + Nocturne theme tokens (colors, fonts, type scale).
- `postcss.config.js` — PostCSS pipeline (tailwind + autoprefixer).
- `src/components/nocturne/Hero.jsx` — editorial hero spread.
- `src/components/nocturne/ArticleCard.jsx` — image-led card (variants).
- `src/components/nocturne/SectionHeader.jsx` — Bodoni title + "see all" link + divider.
- `src/components/nocturne/Button.jsx` — gold button + link-with-arrow variant.
- `src/components/nocturne/DiamondRating.jsx` — 5 gold diamonds.
- `src/components/nocturne/index.js` — barrel export.

**Modified (in phases):**
- `package.json` — add devDeps + (no script change needed).
- `index.html` — swap font `<link>` to Bodoni Moda + Montserrat.
- `src/index.css` — add `@tailwind` directives; keep existing `:root` + reset.
- `src/pages/Magazyn.jsx`, `Przewodnik.jsx`, `Slownik.jsx`, `SlownikTerm.jsx`, `Imprezy.jsx`, `Plaze.jsx`, `Ogloszenia.jsx`, `ArticleDetailPage.jsx`, `Czat.jsx`, `Admin.jsx` — converted per phase.
- `src/components/AgeGate.jsx` — re-skinned (logic unchanged).
- `src/auth/LoginPage.jsx`, `SignupPage.jsx` — re-skinned.
- `public/sw.js` — bump `CACHE_NAME`.

---

## PHASE 0 — Tailwind foundation (no visual change)

### Task 0.1: Install Tailwind toolchain

**Files:**
- Modify: `package.json` (devDependencies)

- [ ] **Step 1: Install**

Run in `Downloads/morefun`:
```bash
npm install -D tailwindcss@^3.4.0 postcss@^8.4.0 autoprefixer@^10.4.0
```

- [ ] **Step 2: Verify install**

Run: `npx tailwindcss --help`
Expected: prints Tailwind CLI usage (no error).

- [ ] **Step 3: Commit**
```bash
git add package.json package-lock.json
git commit -m "build: add tailwind, postcss, autoprefixer (devDeps)"
```

### Task 0.2: PostCSS + Tailwind config with Nocturne tokens

**Files:**
- Create: `postcss.config.js`
- Create: `tailwind.config.js`

- [ ] **Step 1: Create `postcss.config.js`**
```js
export default {
  plugins: {
    tailwindcss: {},
    autoprefixer: {},
  },
}
```

- [ ] **Step 2: Create `tailwind.config.js`** (preflight OFF; tokens from DESIGN.md, body=Montserrat)
```js
/** @type {import('tailwindcss').Config} */
export default {
  darkMode: 'class',
  content: ['./index.html', './src/**/*.{js,jsx}'],
  corePlugins: { preflight: false }, // keep existing reset in src/index.css
  theme: {
    extend: {
      colors: {
        background: '#121414',
        surface: '#121414',
        'surface-dim': '#121414',
        'surface-container-lowest': '#0c0f0f',
        'surface-container-low': '#1a1c1c',
        'surface-container': '#1e2020',
        'surface-container-high': '#282a2b',
        'surface-container-highest': '#333535',
        'on-surface': '#e2e2e2',
        'on-surface-variant': '#d0c5af',
        outline: '#99907c',
        'outline-variant': '#4d4635',
        primary: '#f2ca50',
        'primary-container': '#d4af37',
        'on-primary': '#3c2f00',
        secondary: '#c6c4df',
        error: '#ffb4ab',
      },
      fontFamily: {
        display: ['"Bodoni Moda"', 'Georgia', 'serif'],
        body: ['Montserrat', 'system-ui', 'sans-serif'],
      },
      fontSize: {
        'display-lg': ['64px', { lineHeight: '1.1', letterSpacing: '-0.02em' }],
        'display-lg-mobile': ['40px', { lineHeight: '1.2', letterSpacing: '-0.01em' }],
        'headline-md': ['32px', { lineHeight: '1.3' }],
        'headline-sm': ['24px', { lineHeight: '1.4' }],
        'body-lg': ['18px', { lineHeight: '1.6', letterSpacing: '0.01em' }],
        'body-md': ['15px', { lineHeight: '1.6' }],
        'label-caps': ['12px', { lineHeight: '1', letterSpacing: '0.3em' }],
      },
      maxWidth: { 'container-max': '1280px' },
    },
  },
  plugins: [],
}
```

- [ ] **Step 3: Verify config parses**

Run: `npx tailwindcss -i src/index.css -o /tmp/tw-check.css --content "./src/**/*.jsx" 2>&1 | head`
Expected: no config error (may warn about no utilities yet — fine).

- [ ] **Step 4: Commit**
```bash
git add postcss.config.js tailwind.config.js
git commit -m "build: tailwind config with Nocturne tokens (preflight off, Montserrat body)"
```

### Task 0.3: Wire Tailwind directives into CSS + fonts

**Files:**
- Modify: `src/index.css` (top of file)
- Modify: `index.html` (font `<link>`)

- [ ] **Step 1: Add Tailwind directives at the TOP of `src/index.css`** (before the existing `:root`)
```css
@tailwind base;
@tailwind components;
@tailwind utilities;
```
Leave the existing `:root {…}` and `*, *::before, *::after { box-sizing… }` reset intact below.

- [ ] **Step 2: Replace the font `<link>` in `index.html`**

Find the existing googleapis `<link href="https://fonts.googleapis.com/css2?family=Outfit…">` and replace with:
```html
<link href="https://fonts.googleapis.com/css2?family=Bodoni+Moda:ital,opsz,wght@0,6..96,400..900;1,6..96,400..900&family=Montserrat:ital,wght@0,400;0,500;0,600;0,700;1,400&family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet" />
```
(Keep Inter temporarily — non-migrated pages still use it. Playfair/Outfit/DM Sans removed; re-add if build flags a missing-font usage on a not-yet-migrated page — if so, keep them until that page is migrated.)

- [ ] **Step 3: Build to confirm no breakage**

Run: `npm run build`
Expected: build succeeds. Tailwind utilities now available; preflight off so existing pages render unchanged.

- [ ] **Step 4: Commit**
```bash
git add src/index.css index.html
git commit -m "build: wire tailwind directives + load Bodoni Moda/Montserrat fonts"
```

### Task 0.4: Bump service worker cache + smoke deploy

**Files:**
- Modify: `public/sw.js`

- [ ] **Step 1: Bump cache name**

In `public/sw.js` change `const CACHE_NAME = 'extrafun-v4';` → `'extrafun-v5';`

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: success.

- [ ] **Step 3: Commit + push (deploy)**
```bash
git add public/sw.js
git commit -m "chore(sw): bump cache v5 for Nocturne foundation"
git push origin HEAD
```

- [ ] **Step 4: Verify on live after deploy**

After Railway deploy succeeds, load extrafun.pl and confirm: site renders unchanged (foundation is invisible), no console errors. (Local preview is unreliable here — verify on live, per spec.)

---

## PHASE 1 — Base components + Magazyn (home)

Reference screen: `magazyn_extrafun_home_luksusowa_lewostronna/code.html`.

### Task 1.1: Button component

**Files:**
- Create: `src/components/nocturne/Button.jsx`

- [ ] **Step 1: Implement**
```jsx
// Gold editorial button + text-link-with-arrow variant.
export function Button({ children, variant = 'solid', as = 'button', className = '', ...props }) {
  if (variant === 'link') {
    return (
      <a
        className={`inline-flex items-center gap-2 font-body text-label-caps uppercase text-primary-container hover:opacity-80 transition-opacity border-b border-primary-container/40 pb-0.5 ${className}`}
        {...props}
      >
        {children}
        <span aria-hidden>→</span>
      </a>
    )
  }
  const Tag = as
  return (
    <Tag
      className={`inline-block bg-primary-container text-[#1a1400] px-10 py-4 font-body text-label-caps uppercase font-semibold hover:opacity-90 transition-all active:scale-95 ${className}`}
      {...props}
    >
      {children}
    </Tag>
  )
}
```

- [ ] **Step 2: Build**

Run: `npm run build`
Expected: success (component unused yet, but compiles).

- [ ] **Step 3: Commit**
```bash
git add src/components/nocturne/Button.jsx
git commit -m "feat(nocturne): Button component (gold + link-arrow)"
```

### Task 1.2: SectionHeader component

**Files:**
- Create: `src/components/nocturne/SectionHeader.jsx`

- [ ] **Step 1: Implement**
```jsx
import { Button } from './Button'

// Bodoni section title with optional "see all" link + bottom divider.
export function SectionHeader({ title, linkLabel, onLink, href }) {
  return (
    <div className="flex items-baseline justify-between mb-12 border-b border-outline-variant/20 pb-4">
      <h2 className="font-display text-headline-md text-on-surface">{title}</h2>
      {linkLabel && (
        <Button variant="link" as="a" href={href || '#'} onClick={onLink}>{linkLabel}</Button>
      )}
    </div>
  )
}
```

- [ ] **Step 2: Build** — Run: `npm run build` — Expected: success.
- [ ] **Step 3: Commit**
```bash
git add src/components/nocturne/SectionHeader.jsx
git commit -m "feat(nocturne): SectionHeader component"
```

### Task 1.3: DiamondRating component

**Files:**
- Create: `src/components/nocturne/DiamondRating.jsx`

- [ ] **Step 1: Implement**
```jsx
// 5 gold diamonds; `value` 0–5 (supports halves rounded to nearest).
export function DiamondRating({ value = 0, size = 14 }) {
  const filled = Math.round(value)
  return (
    <span className="inline-flex gap-1" aria-label={`Ocena ${value} z 5`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          style={{ width: size, height: size, transform: 'rotate(45deg)' }}
          className={i < filled ? 'bg-primary-container' : 'bg-outline-variant/40'}
        />
      ))}
    </span>
  )
}
```

- [ ] **Step 2: Build** — Run: `npm run build` — Expected: success.
- [ ] **Step 3: Commit**
```bash
git add src/components/nocturne/DiamondRating.jsx
git commit -m "feat(nocturne): DiamondRating component"
```

### Task 1.4: ArticleCard component

**Files:**
- Create: `src/components/nocturne/ArticleCard.jsx`

- [ ] **Step 1: Implement** (borderless, image-led; variants hero|large|small; gradient fallback when no image)
```jsx
// Image-led editorial card. variant: 'hero' | 'large' | 'small'.
// `image` optional — falls back to a gold-tinted gradient + vignette.
export function ArticleCard({ image, tag, title, lead, meta, onClick, variant = 'large' }) {
  const heights = { hero: 'h-[60vh] min-h-[420px]', large: 'h-80', small: 'h-56' }
  const titleSize = { hero: 'text-display-lg-mobile font-display', large: 'text-headline-sm font-display', small: 'text-body-lg font-display' }
  return (
    <article onClick={onClick} className="group cursor-pointer">
      <div className={`relative w-full ${heights[variant]} overflow-hidden`}>
        {image ? (
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-[1.2s] group-hover:scale-105"
            style={{ backgroundImage: `url('${image}')` }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-surface-container-high to-surface-container-lowest" />
        )}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 100% at 30% 100%, rgba(0,0,0,.75), transparent 70%)' }} />
        {tag && <span className="absolute top-4 left-4 font-body text-label-caps uppercase text-primary-container">{tag}</span>}
      </div>
      <div className="pt-5">
        <h3 className={`${titleSize[variant]} text-on-surface leading-tight mb-2`}>{title}</h3>
        {lead && <p className="font-body text-body-md text-on-surface-variant leading-relaxed">{lead}</p>}
        {meta && <div className="font-body text-label-caps uppercase text-outline mt-3">{meta}</div>}
      </div>
    </article>
  )
}
```

- [ ] **Step 2: Build** — Run: `npm run build` — Expected: success.
- [ ] **Step 3: Commit**
```bash
git add src/components/nocturne/ArticleCard.jsx
git commit -m "feat(nocturne): ArticleCard component (image-led, gradient fallback)"
```

### Task 1.5: Hero component + barrel export

**Files:**
- Create: `src/components/nocturne/Hero.jsx`
- Create: `src/components/nocturne/index.js`

- [ ] **Step 1: Implement `Hero.jsx`**
```jsx
import { Button } from './Button'

// Full-bleed editorial hero spread: moody image + vignette + left-aligned Bodoni headline.
export function Hero({ image, label, title, lead, ctaLabel, onCta }) {
  return (
    <section className="relative w-full h-[80vh] min-h-[560px] flex flex-col justify-end overflow-hidden mb-24">
      <div className="absolute inset-0">
        {image
          ? <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url('${image}')` }} />
          : <div className="w-full h-full bg-gradient-to-br from-surface-container-high to-surface-container-lowest" />}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, rgba(18,20,20,.95) 5%, rgba(18,20,20,.4) 45%, rgba(18,20,20,.2) 100%)' }} />
      </div>
      <div className="relative z-10 px-6 md:px-16 pb-16 max-w-4xl">
        {label && <span className="font-body text-label-caps uppercase text-primary-container mb-4 block">{label}</span>}
        <h1 className="font-display text-display-lg-mobile md:text-display-lg text-on-surface mb-6 leading-none">{title}</h1>
        {lead && <p className="font-body text-body-lg text-on-surface-variant max-w-2xl mb-8 leading-relaxed">{lead}</p>}
        {ctaLabel && <Button onClick={onCta}>{ctaLabel}</Button>}
      </div>
    </section>
  )
}
```

- [ ] **Step 2: Implement `index.js`**
```js
export { Hero } from './Hero'
export { ArticleCard } from './ArticleCard'
export { SectionHeader } from './SectionHeader'
export { Button } from './Button'
export { DiamondRating } from './DiamondRating'
```

- [ ] **Step 3: Build** — Run: `npm run build` — Expected: success.
- [ ] **Step 4: Commit**
```bash
git add src/components/nocturne/Hero.jsx src/components/nocturne/index.js
git commit -m "feat(nocturne): Hero component + barrel export"
```

### Task 1.6: Generate home hero + section images (banana)

**Files:**
- (assets) upload to Supabase bucket `extrafun-editorial`

- [ ] **Step 1: Generate 1–2 images via the `banana` skill**

Base prompt (from DESIGN.md): "Cinematic high-fashion editorial portrait, sophisticated person, dimly lit luxury penthouse, warm champagne gold highlights on tailored midnight-blue clothing, moody exclusive atmosphere, soft bokeh city lights through floor-to-ceiling windows, low-key dramatic lighting, velvet and silk textures, minimalist high-end magazine style, 16:9." Generate: 1 home hero + 1 secondary section image.

- [ ] **Step 2: Upload to Supabase Storage**

Create/ensure public bucket `extrafun-editorial`; upload the two images; record their public URLs. (Use the Supabase MCP or the app's existing storage helper; bucket public-read.)

- [ ] **Step 3: Record URLs**

Add the URLs to a small constants block at the top of `Magazyn.jsx` (e.g. `const HERO_IMG = '<url>'`) — used in Task 1.7. No commit yet (used next task).

### Task 1.7: Convert Magazyn (home) to Nocturne layout

**Files:**
- Modify: `src/pages/Magazyn.jsx`

- [ ] **Step 1: Read current `Magazyn.jsx`** to preserve its data fetching (articles query, featured logic) — keep all data hooks; replace only the rendered markup.

- [ ] **Step 2: Rebuild the render** using nocturne components: top = `<Hero>` (featured/newest article, `HERO_IMG`), then for each category section a `<SectionHeader>` + a 12-col grid (`grid grid-cols-1 md:grid-cols-12 gap-8`) with one `large` ArticleCard at `md:col-span-8` and stacked `small` cards at `md:col-span-4`. Container: `<main className="pt-16 pb-24 max-w-container-max mx-auto px-6 md:px-16">`. Left-aligned, `space-y-32` between sections. Wire card `onClick` → existing navigate to `/magazyn/:slug`.

- [ ] **Step 3: Build** — Run: `npm run build` — Expected: success, no unused-import errors.

- [ ] **Step 4: Commit + push (deploy)**
```bash
git add src/pages/Magazyn.jsx
git commit -m "feat(nocturne): rebuild Magazyn home as editorial spread"
git push origin HEAD
```

- [ ] **Step 5: Verify on live**

After deploy: load extrafun.pl — hero spread renders with Bodoni headline + gold CTA + image; article grid is left-aligned 12-col; fonts are Bodoni (headings) / Montserrat (body); no console errors. Hard-reload (SW v5) if stale. Screenshot for the user.

---

## PHASE 2 — Przewodnik / Miejsca

Reference: `extrafun_przewodnik_*` + `extrafun_miejsca_*`. File: `src/pages/Przewodnik.jsx` (also serves `/miejsca/:city`).

### Task 2.1: Convert Przewodnik hub + city pages

**Files:**
- Modify: `src/pages/Przewodnik.jsx`

- [ ] **Step 1:** Read current `Przewodnik.jsx`; keep ALL data/logic (venues fetch, GPS, filtering, the existing "Plaże" category card, VenueDetail/VenueRow). Replace only presentation.
- [ ] **Step 2:** Apply Nocturne: page container `max-w-container-max mx-auto px-6 md:px-16 pt-16 pb-24`; section titles via `<SectionHeader>`; `VenueRow` → image-led row using card styles (borderless, gold type-badge replaced with `text-primary-container` label, `DiamondRating` if a rating field exists else omit); city cards grid restyled to surface-container tiles with Bodoni labels. Keep BottomNav (mobile) and the day/scene filters; restyle chips to gold-outline.
- [ ] **Step 3:** Generate 1 banana hero image for the guide (penthouse/club moody) → upload to `extrafun-editorial` → use as a top hero strip on the hub (`<Hero>` without CTA, or a slimmer band).
- [ ] **Step 4: Build** — Run: `npm run build` — Expected: success.
- [ ] **Step 5: Commit + push + verify on live** (venues list, city pages, /plaze card all render; GPS still works).
```bash
git add src/pages/Przewodnik.jsx && git commit -m "feat(nocturne): rebuild Przewodnik/Miejsca" && git push origin HEAD
```

---

## PHASE 3 — Słownik

Reference: `extrafun_s_ownik_*`. Files: `src/pages/Slownik.jsx`, `src/pages/SlownikTerm.jsx`.

### Task 3.1: Convert Slownik listing

**Files:** Modify `src/pages/Slownik.jsx`
- [ ] **Step 1:** Keep terms data + alphabetical grouping + `featured ⭐` logic. Replace markup: `max-w-container-max` container, Bodoni `headline-md` letter headers, Montserrat term rows, gold ⭐ for featured, `SectionHeader` for the page title. Left-aligned.
- [ ] **Step 2: Build** — `npm run build` — Expected: success.
- [ ] **Step 3: Commit** `feat(nocturne): rebuild Slownik listing`

### Task 3.2: Convert SlownikTerm detail

**Files:** Modify `src/pages/SlownikTerm.jsx`
- [ ] **Step 1:** Keep term fetch + longContent rendering. Replace markup: large Bodoni `display-lg-mobile` term title, Montserrat `body-lg` prose (`max-w-2xl`, generous leading), gold divider lines, back-link via `Button variant="link"`.
- [ ] **Step 2: Build** — `npm run build` — Expected: success.
- [ ] **Step 3: Commit + push + verify on live** `feat(nocturne): rebuild SlownikTerm detail`

---

## PHASE 4 — AgeGate (Weryfikacja)

Reference: `extrafun_weryfikacja_*`. File: `src/components/AgeGate.jsx`. **Logic (18+ confirm + storage) unchanged — visual only.**

### Task 4.1: Re-skin AgeGate

**Files:** Modify `src/components/AgeGate.jsx`
- [ ] **Step 1:** Read current AgeGate; preserve the confirm handler + any localStorage flag exactly. Replace markup: full-screen `bg-background`, optional moody background image (banana, generate 1) with heavy vignette, left-aligned Bodoni `display-lg-mobile` headline ("Masz ukończone 18 lat?" or current copy), Montserrat body, two `Button`s (gold solid "TAK, WCHODZĘ" / link variant "Nie"). Keep exact same callback wiring.
- [ ] **Step 2:** Generate 1 banana background image → upload `extrafun-editorial`.
- [ ] **Step 3: Build** — `npm run build` — Expected: success.
- [ ] **Step 4: Commit + push + verify on live** (gate appears for new visitors, confirm still sets the flag and dismisses).
```bash
git add src/components/AgeGate.jsx && git commit -m "feat(nocturne): re-skin AgeGate (logic unchanged)" && git push origin HEAD
```

---

## PHASE 5 — Remaining sections (system-consistent, no Stitch screen)

Apply tokens + nocturne components for visual consistency; keep all logic. One task per page; each: read page → keep data/handlers → restyle container (`max-w-container-max mx-auto px-6 md:px-16`), headings → `font-display`, body → `font-body`, accents → `primary-container`, cards → borderless/surface-container, buttons → `<Button>` → `npm run build` → commit. Group push at end of phase, then verify on live.

### Task 5.1: Imprezy
- [ ] Modify `src/pages/Imprezy.jsx`: restyle events list/calendar to Nocturne; keep events fetch + `swingers_venues` embed. Build. Commit `feat(nocturne): restyle Imprezy`.

### Task 5.2: Plaze
- [ ] Modify `src/pages/Plaze.jsx`: restyle beach groups/cards to image-led Nocturne (gradient fallback common for beaches). Keep `/api/places` fetch + `type==='plaża'` filter + groupByCountry. Build. Commit `feat(nocturne): restyle Plaze`.

### Task 5.3: Ogloszenia
- [ ] Modify `src/pages/Ogloszenia.jsx`: restyle listing + the AgeGate-related gate usage. Keep data + auth. Build. Commit `feat(nocturne): restyle Ogloszenia`.

### Task 5.4: ArticleDetailPage
- [ ] Modify `src/pages/ArticleDetailPage.jsx`: editorial article layout — Bodoni `display-lg-mobile` title, Montserrat `body-lg` prose, cover image full-bleed, gold dividers, related/"Czytaj dalej" cards via `ArticleCard small`. Keep article fetch + related logic. Build. Commit `feat(nocturne): restyle ArticleDetailPage`.

### Task 5.5: Czat
- [ ] Modify `src/pages/Czat.jsx`: restyle chat surfaces to Nocturne (surface-container bubbles, gold accents). Keep all chat logic. Build. Commit `feat(nocturne): restyle Czat`.

### Task 5.6: Admin
- [ ] Modify `src/pages/Admin.jsx`: restyle admin shell + forms minimally to tokens (functional, not editorial). Keep all admin logic + fetches. Build. Commit `feat(nocturne): restyle Admin`.

### Task 5.7: Auth (Login/Signup/profil)
- [ ] Modify `src/auth/LoginPage.jsx`, `src/auth/SignupPage.jsx`: restyle to Nocturne (left-aligned, Bodoni headline, gold buttons). Keep all auth logic. Build. Commit `feat(nocturne): restyle auth pages`.

### Task 5.8: Cleanup fonts + finalize
- [ ] **Step 1:** Remove now-unused font families from `index.html` (Inter) and stale `:root` vars in `src/index.css` (Playfair `--serif`, old `--cyan`/`--magenta` if no longer referenced — grep first: `grep -rn "var(--serif)\|Playfair\|--cyan\|--magenta" src`). Only remove what grep shows unused.
- [ ] **Step 2: Build** — `npm run build` — Expected: success.
- [ ] **Step 3:** Bump `public/sw.js` `CACHE_NAME` v5→v6 (final asset set).
- [ ] **Step 4: Commit + push + verify whole site on live.**
```bash
git add -A && git commit -m "chore(nocturne): drop unused fonts/tokens, bump sw v6" && git push origin HEAD
```

---

## PHASE 6 — Imagery pass (parallel, ongoing from Phase 1)

Not a blocking phase — fold image generation into each page's task as noted. This phase is the catch-up/polish for any page still on gradient fallback that warrants a real hero.

### Task 6.1: Audit + fill missing heroes
- [ ] List pages still using gradient fallback where a hero would lift quality (Imprezy, Plaze section banners). Generate 1 banana image each (DESIGN.md prompt), upload to `extrafun-editorial`, wire the URL. Build, commit, push, verify per image.

---

## Self-Review notes

- **Spec coverage:** Tailwind-coexistence (Phase 0) ✓; tokens+Montserrat ✓; all sections incl. no-screen pages (Phase 5) ✓; AgeGate=Weryfikacja visual-only (Phase 4) ✓; banana imagery + Supabase bucket (1.6/2.3/4.2/6) ✓; SW bumps (0.4, 5.8) ✓; preflight-off decision ✓; mobile BottomNav retained (Phase 2 note) ✓.
- **Verification reality:** no unit-test harness exists, so steps use `npm run build` + live visual check (per spec; local preview unreliable). This is intentional, not a placeholder.
- **Component interface consistency:** `Hero`, `ArticleCard(variant)`, `SectionHeader`, `Button(variant)`, `DiamondRating(value)` defined in Phase 1, consumed by name in Phases 1–5.
- **Deferred-by-design (not placeholders):** exact image count per page (cap 1–2, generate on demand — YAGNI); icon strategy (reuse existing, add Material Symbols only if a screen needs one with no existing equivalent).
