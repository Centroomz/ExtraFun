# Graph Report - morefun  (2026-07-27)

## Corpus Check
- 72 files · ~142,978 words
- Verdict: corpus is large enough that graph structure adds value.

## Summary
- 267 nodes · 470 edges · 19 communities (16 shown, 3 thin omitted)
- Extraction: 100% EXTRACTED · 0% INFERRED · 0% AMBIGUOUS · INFERRED: 2 edges (avg confidence: 0.5)
- Token cost: 0 input · 0 output

## Graph Freshness
- Built from commit: `75332fa6`
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

## God Nodes (most connected - your core abstractions)
1. `apiFetch()` - 27 edges
2. `useAuth()` - 12 edges
3. `Button()` - 10 edges
4. `formatDistance()` - 10 edges
5. `Hero()` - 9 edges
6. `Aktualnosci()` - 9 edges
7. `Plaze()` - 9 edges
8. `useGeolocation()` - 8 edges
9. `Przewodnik()` - 8 edges
10. `Ogloszenia()` - 7 edges

## Surprising Connections (you probably didn't know these)
- `sendDictTermHtml()` --references--> `DICTIONARY_TERMS`  [EXTRACTED]
  server/meta.js → src/lib/dictionary.js
- `ProfilePage()` --calls--> `apiFetch()`  [EXTRACTED]
  src/App.jsx → src/lib/api.js
- `AppInner()` --calls--> `apiFetch()`  [EXTRACTED]
  src/App.jsx → src/lib/api.js
- `CalendarWidget()` --calls--> `apiFetch()`  [EXTRACTED]
  src/components/CalendarWidget.jsx → src/lib/api.js
- `AdsTab()` --calls--> `apiFetch()`  [EXTRACTED]
  src/pages/Admin.jsx → src/lib/api.js

## Import Cycles
- None detected.

## Communities (19 total, 3 thin omitted)

### Community 0 - "Geolocation and Guides"
Cohesion: 0.11
Nodes (32): useGeolocation(), calculateDistance(), formatDistance(), getUserLocation(), sortByDistance(), AdDetail(), chip(), DEMO_ADS (+24 more)

### Community 1 - "Authentication Flow"
Cohesion: 0.11
Nodes (23): ADMIN_EMAILS, App(), AppInner(), DesktopNav(), isAdmin(), NAV_ITEMS, LoginPage(), SignupPage() (+15 more)

### Community 2 - "Profile and Admin Management"
Cohesion: 0.09
Nodes (25): ProfilePage(), apiFetch(), ADMIN_EMAILS, AdsTab(), ArticleForm(), ArticlesTab(), AUDIENCE_DAYS, btnDanger (+17 more)

### Community 3 - "Server Authentication Logic"
Cohesion: 0.14
Nodes (18): ADMIN_EMAILS, isAdmin(), isAdminEmail(), app, __dirname, DIST, ROOT, esc() (+10 more)

### Community 4 - "Frontend Build Setup"
Cohesion: 0.10
Nodes (20): autoprefixer, devDependencies, autoprefixer, postcss, tailwindcss, vite, @vitejs/plugin-react, name (+12 more)

### Community 5 - "Content and Quiz Display"
Cohesion: 0.15
Nodes (14): CalendarWidget(), TYPE_ICON, TYPE_LABEL, ARTICLES, CATEGORIES, getWordOfTheDay(), interpretQuizResult(), QUIZ_QUESTIONS (+6 more)

### Community 6 - "Shared UI Components"
Cohesion: 0.18
Nodes (10): ArticleCard(), Button(), DiamondRating(), Hero(), SectionHeader(), DAY_PL, formatDate(), groupByDate() (+2 more)

### Community 7 - "Core Framework Dependencies"
Cohesion: 0.13
Nodes (15): express, dependencies, express, react, react-dom, react-helmet-async, serve, @supabase/supabase-js (+7 more)

### Community 8 - "Article Detail View"
Cohesion: 0.18
Nodes (8): ArticleDetailPage(), CATEGORY_COLORS, CTA_DEFAULT, CTA_MAP, mapRail(), parseBold(), renderContent(), SLUG_TO_DISPLAY

### Community 9 - "PWA Manifest Configuration"
Cohesion: 0.18
Nodes (10): background_color, description, display, icons, lang, name, orientation, short_name (+2 more)

### Community 10 - "Vocabulary Lookup Tool"
Cohesion: 0.36
Nodes (5): DICTIONARY_TERMS, getTerm(), getTermsByCategory(), Slownik(), SlownikTerm()

### Community 11 - "News Feed and Translation"
Cohesion: 0.24
Nodes (9): AuthContext, AuthProvider(), supabase, CATEGORIES, DEMO_THREADS, formatTimeAgo(), Forum(), SORT_OPTIONS (+1 more)

### Community 12 - "Deployment Configuration File"
Cohesion: 0.25
Nodes (7): build, buildCommand, builder, deploy, healthcheckPath, startCommand, $schema

## Knowledge Gaps
- **83 isolated node(s):** `python`, `name`, `private`, `version`, `type` (+78 more)
  These have ≤1 connection - possible missing edges or undocumented components.
- **3 thin communities (<3 nodes) omitted from report** — run `graphify query` to explore isolated nodes.

## Suggested Questions
_Questions this graph is uniquely positioned to answer:_

- **Why does `apiFetch()` connect `Profile and Admin Management` to `Geolocation and Guides`, `Authentication Flow`, `Content and Quiz Display`, `Shared UI Components`, `Article Detail View`, `News Feed and Translation`?**
  _High betweenness centrality (0.088) - this node is a cross-community bridge._
- **Why does `DICTIONARY_TERMS` connect `Vocabulary Lookup Tool` to `Server Authentication Logic`?**
  _High betweenness centrality (0.040) - this node is a cross-community bridge._
- **Why does `Hero()` connect `Shared UI Components` to `Geolocation and Guides`, `Authentication Flow`, `Vocabulary Lookup Tool`, `Content and Quiz Display`?**
  _High betweenness centrality (0.017) - this node is a cross-community bridge._
- **What connects `python`, `name`, `private` to the rest of the system?**
  _83 weakly-connected nodes found - possible documentation gaps or missing edges._
- **Should `Geolocation and Guides` be split into smaller, more focused modules?**
  _Cohesion score 0.11025641025641025 - nodes in this community are weakly interconnected._
- **Should `Authentication Flow` be split into smaller, more focused modules?**
  _Cohesion score 0.10685483870967742 - nodes in this community are weakly interconnected._
- **Should `Profile and Admin Management` be split into smaller, more focused modules?**
  _Cohesion score 0.08866995073891626 - nodes in this community are weakly interconnected._