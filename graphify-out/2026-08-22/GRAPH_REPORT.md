# Graph Report - morefun  (2026-08-22)

## Corpus Check
- 75 files · ~149,444 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 309 nodes · 452 edges · 27 communities (22 shown, 5 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `a0e371be`
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

## God Nodes (most connected - your core abstractions)
1. `apiFetch()` - 18 edges
2. `ExtraFun Finder + soft removal of biz discovery — design` - 10 edges
3. `useAuth()` - 10 edges
4. `Plaze()` - 9 edges
5. `Aktualnosci()` - 8 edges
6. `Button()` - 8 edges
7. `Ogloszenia()` - 7 edges
8. `esc()` - 6 edges
9. `Przewodnik()` - 6 edges
10. `ExtraFun Finder Implementation Plan` - 6 edges

## Surprising Connections (you probably didn't know these)
- `ProfilePage()` --calls--> `apiFetch()`  [EXTRACTED]
  src/App.jsx → src/lib/api.js
- `AppInner()` --calls--> `apiFetch()`  [EXTRACTED]
  src/App.jsx → src/lib/api.js
- `CalendarWidget()` --calls--> `apiFetch()`  [EXTRACTED]
  src/components/CalendarWidget.jsx → src/lib/api.js
- `AdsTab()` --calls--> `apiFetch()`  [EXTRACTED]
  src/pages/Admin.jsx → src/lib/api.js
- `ArticlesTab()` --calls--> `apiFetch()`  [EXTRACTED]
  src/pages/Admin.jsx → src/lib/api.js

## Import Cycles
- None detected.

## Communities (27 total, 5 thin omitted)

### Community 0 - "Geolocation and Guides"
Cohesion: 0.17
Nodes (22): useGeolocation(), calculateDistance(), formatDistance(), getUserLocation(), sortByDistance(), AdDetail(), chip(), DEMO_ADS (+14 more)

### Community 1 - "Authentication Flow"
Cohesion: 0.09
Nodes (25): ADMIN_EMAILS, App(), AppInner(), DesktopNav(), isAdmin(), NAV_ITEMS, LoginPage(), SignupPage() (+17 more)

### Community 2 - "Profile and Admin Management"
Cohesion: 0.09
Nodes (27): ProfilePage(), CalendarWidget(), TYPE_ICON, TYPE_LABEL, apiFetch(), ADMIN_EMAILS, AdsTab(), ArticleForm() (+19 more)

### Community 3 - "Server Authentication Logic"
Cohesion: 0.20
Nodes (16): app, __dirname, DIST, ROOT, esc(), sendArticleHtml(), sendDictTermHtml(), sendHomeHtml() (+8 more)

### Community 4 - "Frontend Build Setup"
Cohesion: 0.10
Nodes (20): autoprefixer, devDependencies, autoprefixer, postcss, tailwindcss, vite, @vitejs/plugin-react, name (+12 more)

### Community 5 - "Content and Quiz Display"
Cohesion: 0.40
Nodes (3): QUIZ_QUESTIONS, RESULTS, TYPE_MAP

### Community 6 - "Shared UI Components"
Cohesion: 0.24
Nodes (7): AgeGate(), ArticleCard(), Button(), DiamondRating(), Hero(), SectionHeader(), Wiadomosci()

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
Cohesion: 0.50
Nodes (3): estimateReadingTime(), Magazyn(), SLUG_TO_DISPLAY

## Knowledge Gaps
- **105 isolated node(s):** `__dirname`, `ROOT`, `DIST`, `app`, `trCache` (+100 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **5 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `apiFetch()` connect `Profile and Admin Management` to `Geolocation and Guides`, `Authentication Flow`, `Shared UI Components`?**
  _High betweenness centrality (0.027) - this node is a cross-community bridge._
- **Why does `useAuth()` connect `Authentication Flow` to `Profile and Admin Management`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **Why does `Aktualnosci()` connect `Aktualnosci.jsx` to `Authentication Flow`?**
  _High betweenness centrality (0.010) - this node is a cross-community bridge._
- **What connects `__dirname`, `ROOT`, `DIST` to the rest of the system?**
  _105 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Authentication Flow` be split into smaller, more focused modules?**
  _Cohesion score 0.08717948717948718 - nodes in this community are weakly interconnected._
- **Should `Profile and Admin Management` be split into smaller, more focused modules?**
  _Cohesion score 0.08505747126436781 - nodes in this community are weakly interconnected._
- **Should `Frontend Build Setup` be split into smaller, more focused modules?**
  _Cohesion score 0.09523809523809523 - nodes in this community are weakly interconnected._