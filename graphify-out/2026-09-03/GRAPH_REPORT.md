# Graph Report - morefun  (2026-09-03)

## Corpus Check
- 79 files · ~154,024 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 326 nodes · 406 edges · 36 communities (30 shown, 6 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `0dc2699a`
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
- articles.js
- Ogloszenia.jsx
- Forum.jsx
- BottomNav.jsx
- server/index.js
- Magazyn.jsx

## God Nodes (most connected - your core abstractions)
1. `useAuth()` - 12 edges
2. `ExtraFun Finder + soft removal of biz discovery — design` - 10 edges
3. `Plaze()` - 8 edges
4. `Aktualnosci()` - 7 edges
5. `esc()` - 6 edges
6. `ExtraFun Finder Implementation Plan` - 6 edges
7. `isFemaleNick()` - 6 edges
8. `Button()` - 6 edges
9. `apiFetch()` - 6 edges
10. `Przewodnik()` - 5 edges

## Surprising Connections (you probably didn't know these)
- `SignupPage()` --calls--> `useAuth()`  [EXTRACTED]
  src/auth/SignupPage.jsx → src/hooks/useAuth.jsx
- `CalendarWidget()` --calls--> `apiFetch()`  [EXTRACTED]
  src/components/CalendarWidget.jsx → src/lib/api.js
- `Plaze()` --calls--> `apiFetch()`  [EXTRACTED]
  src/pages/Plaze.jsx → src/lib/api.js
- `AppInner()` --calls--> `useAuth()`  [EXTRACTED]
  src/App.jsx → src/hooks/useAuth.jsx
- `ForgotPasswordPage()` --calls--> `useAuth()`  [EXTRACTED]
  src/auth/ForgotPasswordPage.jsx → src/hooks/useAuth.jsx

## Import Cycles
- None detected.

## Communities (36 total, 6 thin omitted)

### Community 0 - "Geolocation and Guides"
Cohesion: 0.23
Nodes (15): useGeolocation(), calculateDistance(), formatDistance(), getUserLocation(), sortByDistance(), BeachCard(), chip(), CITY_TO_COUNTRY (+7 more)

### Community 1 - "Authentication Flow"
Cohesion: 0.20
Nodes (13): ADMIN_EMAILS, App(), AppInner(), DesktopNav(), isAdmin(), NAV_ITEMS, ForgotPasswordPage(), LoginPage() (+5 more)

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
Cohesion: 0.18
Nodes (8): ArticleDetailPage(), CATEGORY_COLORS, CTA_DEFAULT, CTA_MAP, mapRail(), parseBold(), renderContent(), SLUG_TO_DISPLAY

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
Cohesion: 0.23
Nodes (10): ARTICLES, getTypeConfig(), PL_CITY_SET, Przewodnik(), slugify(), TYPE_CONFIG, VenueDetail(), VenueRow() (+2 more)

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

### Community 27 - "Ogloszenia.jsx"
Cohesion: 0.39
Nodes (7): AdDetail(), chip(), DEMO_ADS, DISTANCE_FILTERS, Ogloszenia(), typeLabel(), TYPES

### Community 28 - "Forum.jsx"
Cohesion: 0.19
Nodes (11): CalendarWidget(), TYPE_ICON, TYPE_LABEL, apiFetch(), supabase, CATEGORIES, DEMO_THREADS, formatTimeAgo() (+3 more)

### Community 34 - "server/index.js"
Cohesion: 0.31
Nodes (7): app, __dirname, DIST, ROOT, finderBlockedSet(), loadVisibleProfiles(), registerRoutes()

### Community 35 - "Magazyn.jsx"
Cohesion: 0.19
Nodes (7): dayOfYear(), MagazynSidebar(), MONTH_THEMES, PopularModule(), estimateReadingTime(), Magazyn(), SLUG_TO_DISPLAY

## Knowledge Gaps
- **107 isolated node(s):** `MONTH_THEMES`, `SLUG_TO_DISPLAY`, `QUIZ_QUESTIONS`, `TYPE_MAP`, `RESULTS` (+102 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **6 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `useAuth()` connect `Authentication Flow` to `Forum.jsx`?**
  _High betweenness centrality (0.011) - this node is a cross-community bridge._
- **Why does `dependencies` connect `Core Framework Dependencies` to `Frontend Build Setup`?**
  _High betweenness centrality (0.007) - this node is a cross-community bridge._
- **What connects `MONTH_THEMES`, `SLUG_TO_DISPLAY`, `QUIZ_QUESTIONS` to the rest of the system?**
  _107 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Profile and Admin Management` be split into smaller, more focused modules?**
  _Cohesion score 0.09 - nodes in this community are weakly interconnected._
- **Should `Frontend Build Setup` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._
- **Should `Core Framework Dependencies` be split into smaller, more focused modules?**
  _Cohesion score 0.13333333333333333 - nodes in this community are weakly interconnected._
- **Should `News Feed and Translation` be split into smaller, more focused modules?**
  _Cohesion score 0.125 - nodes in this community are weakly interconnected._