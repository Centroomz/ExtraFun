# Graph Report - morefun  (2026-09-10)

## Corpus Check
- 79 files · ~194,893 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 331 nodes · 393 edges · 40 communities (34 shown, 6 thin omitted)
- Extraction: 99% EXTRACTED · 1% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `3274f0da`
- Run `git rev-parse HEAD` and compare to check if the graph is stale.
- Run `graphify update .` after code changes (no API cost).

## Community Hubs (Navigation)
- Geolocation and Guides
- Authentication Flow
- Profile and Admin Management
- Server Authentication Logic
- Frontend Build Setup
- Content and Quiz Display
- Shared UI Components
- Core Framework Dependencies
- Article Detail View
- PWA Manifest Configuration
- Vocabulary Lookup Tool
- News Feed and Translation
- Deployment Configuration File
- Code Review Graph Tooling
- Quiz Logic and Scoring
- Service Worker Caching
- chat-gender.js
- ExtraFun Finder + soft removal of biz discovery — design
- Przewodnik.jsx
- Aktualnosci.jsx
- auth.js
- Imprezy.jsx
- Magazyn.jsx
- Magazyn.jsx
- Ogloszenia.jsx
- Forum.jsx
- BottomNav.jsx
- Czat.jsx
- server/index.js
- Magazyn.jsx
- routes.js
- App.jsx

## God Nodes (most connected - your core abstractions)
1. `ExtraFun Finder + soft removal of biz discovery — design` - 10 edges
2. `Plaze()` - 8 edges
3. `useAuth()` - 7 edges
4. `Aktualnosci()` - 7 edges
5. `Przewodnik()` - 6 edges
6. `esc()` - 6 edges
7. `ExtraFun Finder Implementation Plan` - 6 edges
8. `isFemaleNick()` - 6 edges
9. `Button()` - 6 edges
10. `Phase 1 — Read-only finder on extrafun (default hidden until consent)` - 5 edges

## Surprising Connections (you probably didn't know these)
- `ForgotPasswordPage()` --calls--> `useAuth()`  [EXTRACTED]
  src/auth/ForgotPasswordPage.jsx → src/hooks/useAuth.jsx
- `LoginPage()` --calls--> `useAuth()`  [EXTRACTED]
  src/auth/LoginPage.jsx → src/hooks/useAuth.jsx
- `ResetPasswordPage()` --calls--> `useAuth()`  [EXTRACTED]
  src/auth/ResetPasswordPage.jsx → src/hooks/useAuth.jsx
- `useGeolocation()` --calls--> `getUserLocation()`  [EXTRACTED]
  src/hooks/useGeolocation.js → src/lib/geo.js
- `Plaze()` --calls--> `useGeolocation()`  [EXTRACTED]
  src/pages/Plaze.jsx → src/hooks/useGeolocation.js

## Import Cycles
- None detected.

## Communities (40 total, 6 thin omitted)

### Community 0 - "Geolocation and Guides"
Cohesion: 0.18
Nodes (17): useGeolocation(), apiFetch(), calculateDistance(), formatDistance(), getUserLocation(), sortByDistance(), supabase, BeachCard() (+9 more)

### Community 1 - "Authentication Flow"
Cohesion: 0.33
Nodes (5): ForgotPasswordPage(), LoginPage(), ResetPasswordPage(), AuthContext, useAuth()

### Community 2 - "Profile and Admin Management"
Cohesion: 0.09
Nodes (18): Admin(), ADMIN_EMAILS, ArticleForm(), AUDIENCE_DAYS, btnDanger, btnGhost, btnPrimary, card (+10 more)

### Community 3 - "Server Authentication Logic"
Cohesion: 0.36
Nodes (8): esc(), sendArticleHtml(), sendDictTermHtml(), sendListPageHtml(), sendSitemap(), sendVenueHtml(), slugify(), venueSlug()

### Community 4 - "Frontend Build Setup"
Cohesion: 0.10
Nodes (20): autoprefixer, devDependencies, autoprefixer, postcss, tailwindcss, vite, @vitejs/plugin-react, name (+12 more)

### Community 5 - "Content and Quiz Display"
Cohesion: 0.40
Nodes (3): QUIZ_QUESTIONS, RESULTS, TYPE_MAP

### Community 6 - "Shared UI Components"
Cohesion: 0.22
Nodes (5): ArticleCard(), Button(), DiamondRating(), Hero(), SectionHeader()

### Community 7 - "Core Framework Dependencies"
Cohesion: 0.13
Nodes (15): express, dependencies, express, react, react-dom, react-helmet-async, serve, @supabase/supabase-js (+7 more)

### Community 8 - "Article Detail View"
Cohesion: 0.15
Nodes (10): ADMIN_EMAILS, ArticleDetailPage(), AUTHOR_AVATARS, CATEGORY_COLORS, CTA_DEFAULT, CTA_MAP, mapRail(), parseBold() (+2 more)

### Community 9 - "PWA Manifest Configuration"
Cohesion: 0.18
Nodes (10): background_color, description, display, icons, lang, name, orientation, short_name (+2 more)

### Community 11 - "News Feed and Translation"
Cohesion: 0.12
Nodes (15): ExtraFun Finder Implementation Plan, Open items for the executor, Phase 1 — Read-only finder on extrafun (default hidden until consent), Phase 2 — Engagement (like / match / block / report), Phase 3 — Consent broadcast + biz cutover, Self-Review, Task 1: Visibility helper + listing endpoint (count-only gate), Task 2: Profile detail endpoint (lean — no biz groups/checkin/ads) (+7 more)

### Community 12 - "Deployment Configuration File"
Cohesion: 0.25
Nodes (7): build, buildCommand, builder, deploy, healthcheckPath, startCommand, $schema

### Community 19 - "chat-gender.js"
Cohesion: 0.35
Nodes (10): FEMALE_NAMES, isFemaleNick(), isTabooContent(), normalizePl(), splitSegments(), TABOO_SUBSTRINGS, TABOO_WORD_EXACT, TABOO_WORD_STEMS (+2 more)

### Community 20 - "ExtraFun Finder + soft removal of biz discovery — design"
Cohesion: 0.15
Nodes (12): Biz-side changes (soft removal), Client (`morefun/src/`), Consent / privacy model, Cross-portal notes, ExtraFun build (Lean v1), ExtraFun Finder + soft removal of biz discovery — design, Non-goals, Open risks (+4 more)

### Community 21 - "Przewodnik.jsx"
Cohesion: 0.22
Nodes (11): ARTICLES, getTypeConfig(), PL_CITY_SET, Przewodnik(), slugify(), swingDayOk(), TYPE_CONFIG, VenueDetail() (+3 more)

### Community 22 - "Aktualnosci.jsx"
Cohesion: 0.33
Nodes (8): ADMIN_EMAILS, Aktualnosci(), firstSentence(), hasImg(), isForeign(), timeAgo(), translate(), trCache

### Community 23 - "auth.js"
Cohesion: 0.32
Nodes (4): ADMIN_EMAILS, isAdmin(), isAdminEmail(), supabaseAdmin

### Community 24 - "Imprezy.jsx"
Cohesion: 0.38
Nodes (5): DAY_PL, formatDate(), groupByDate(), Imprezy(), MONTH_PL

### Community 25 - "Magazyn.jsx"
Cohesion: 0.40
Nodes (3): QUIZ_QUESTIONS, RESULTS, TYPE_MAP

### Community 26 - "Magazyn.jsx"
Cohesion: 0.31
Nodes (5): ARTICLES, CATEGORIES, estimateReadingTime(), Magazyn(), SLUG_TO_DISPLAY

### Community 27 - "Ogloszenia.jsx"
Cohesion: 0.29
Nodes (8): AdDetail(), CAT_EMOJI, catEmoji(), chip(), DEMO_ADS, GAY_CATS, Ogloszenia(), POST_CATEGORIES

### Community 28 - "Forum.jsx"
Cohesion: 0.48
Nodes (6): CATEGORIES, DEMO_THREADS, formatTimeAgo(), Forum(), SORT_OPTIONS, ThreadView()

### Community 34 - "server/index.js"
Cohesion: 0.40
Nodes (4): app, __dirname, DIST, ROOT

### Community 35 - "Magazyn.jsx"
Cohesion: 0.29
Nodes (3): dayOfYear(), MONTH_THEMES, PopularModule()

### Community 36 - "routes.js"
Cohesion: 0.83
Nodes (3): finderBlockedSet(), loadVisibleProfiles(), registerRoutes()

### Community 37 - "App.jsx"
Cohesion: 0.33
Nodes (6): ADMIN_EMAILS, App(), AppInner(), DesktopNav(), isAdmin(), NAV_ITEMS

## Knowledge Gaps
- **107 isolated node(s):** `ADMIN_EMAILS`, `CATEGORY_COLORS`, `AUTHOR_AVATARS`, `SLUG_TO_DISPLAY`, `CTA_MAP` (+102 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `dependencies` connect `Core Framework Dependencies` to `Frontend Build Setup`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **What connects `ADMIN_EMAILS`, `CATEGORY_COLORS`, `AUTHOR_AVATARS` to the rest of the system?**
  _107 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Profile and Admin Management` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Frontend Build Setup` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `Core Framework Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Should `News Feed and Translation` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._