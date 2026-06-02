# ExtraFun → Backend Rewrite (v1)

**Date:** 2026-06-03
**Status:** Approved design
**Goal:** Convert ExtraFun from a front-only Vite + Supabase-anon SPA into a proper
Express backend (matching gay.pl / bizarriusz), fix the current white-screen
breakage, and make article pages indexable.

---

## Scope (v1)

In:
- **Magazyn** — articles where `site = 'extrafun'`, `status = 'published'`
- **Miejsca** — `swingers_venues`
- **Czat** — shared with bizarriusz (same `shoutbox_messages` stream, so it is not dead)
- **Ogłoszenia** — shared `ads` pool (bizarriusz + extrafun)
- Auth: login / signup / profil
- Admin: article CRUD

Out (later):
- **Forum** — currently a mockup, remove from nav
- **Imprezy** — deferred until there is event content

Shared DB: `lvxaycjuhchoqhnttyjj` (same Supabase project as gay.pl + bizarriusz).
No new tables required for v1.

> Audience note: bizarriusz = Warsaw sex/gay club, ExtraFun = CNM/swing/poly
> lifestyle. Sharing chat + ads mixes audiences. Accepted for launch ("not dead");
> trivially split later by `source`.

---

## Architecture (Approach A — Express + Supabase service-role)

Split the existing `server.js` into a `server/` directory:

- `server/index.js` — Express bootstrap. Existing domain redirect
  (`extrafun.fun` / `.club` → `.pl`), mount API routes, static serve of `dist/`,
  SPA fallback.
- `server/supabase.js` — service-role client built from `SUPABASE_URL` +
  `SUPABASE_SERVICE_ROLE_KEY` (server-only env).
- `server/auth.js` — `verifyJWT` middleware (Bearer token →
  `supabaseAdmin.auth.getUser(token)`, sets `req.user`), `isAdmin`
  (email allowlist via `ADMIN_EMAIL`).
- `server/routes.js` — `/api/*` endpoints + `/sitemap.xml` + `/robots.txt`.
- `server/meta.js` — read `dist/index.html`, inject per-article `<title>` / OG
  tags for `/magazyn/:slug` requests (crawler-facing SEO).

Client (`src/`): replace every `supabase.from(...)` data call with
`fetch('/api/...')`. Supabase-JS stays **only for auth** (signin / signup /
session); the anon key is public by design, so this is fine. All data access
moves behind the service-role API.

### Boundaries / units
- supabase.js: owns the privileged DB client. Nothing else imports the service key.
- auth.js: token → user. Pure middleware, no business logic.
- routes.js: request → query → JSON. Thin; delegates DB to supabase.js.
- meta.js: HTML templating for crawlers. No DB writes.
- client lib `api.js`: single `apiFetch(path, opts)` helper that attaches the
  bearer token from the current Supabase session. All pages call this.

---

## API surface

Reads (public):
- `GET /api/articles?site=extrafun&status=published&limit=` → Magazyn list
- `GET /api/articles/:slug` → ArticleDetail
- `GET /api/places` → Miejsca (`swingers_venues`)
- `GET /api/shoutbox?limit=` → Czat (shared stream)
- `GET /api/ads` → Ogłoszenia (active, shared pool)
- `GET /api/dictionary` → if the glossary is still used (else drop)

Writes (auth via `verifyJWT`):
- `POST /api/shoutbox` — post chat message (shared `source`)
- `POST /api/ads` — create classified
- `GET /api/profile` / `PUT /api/profile` — own profile
- `POST /api/track` — page_views insert (analytics, task #3)

Admin (`verifyJWT` + `isAdmin`):
- `POST /api/articles`, `PUT /api/articles/:id`, `DELETE /api/articles/:id`

### Shared-content rules
- **Czat:** read + write the same `shoutbox_messages` stream as bizarriusz, so
  both clubs' users chat together (avoids an empty feed). Exact `source` value
  to confirm at implementation (reuse bizarriusz's so existing messages show).
- **Ogłoszenia:** list active `ads` from the shared pool (bizarriusz + extrafun).
  New ExtraFun ads tagged `source='extrafun'`.

---

## SEO (primary win)

- `GET /sitemap.xml` — dynamic: `/`, `/magazyn`, `/miejsca`, `/czat`,
  `/ogloszenia` + one `<loc>` per published `site='extrafun'` article
  (`/magazyn/:slug`).
- `GET /robots.txt` — allow crawl, point to sitemap, disallow `/admin` `/profil`.
- **Per-article meta injection:** for `/magazyn/:slug`, the server reads the
  article and injects real `<title>`, description, and OG tags into `index.html`
  before sending. Solves the SPA indexing problem — crawlers get real metadata
  even though React renders client-side.

---

## Auth flow

- Client keeps Supabase Auth: `signInWithPassword`, `signUp`, `getSession`
  (anon key, public).
- API writes send `Authorization: Bearer <access_token>`; server verifies with
  `supabaseAdmin.auth.getUser(token)` and sets `req.user`.
- Admin gate: `req.user.email` ∈ `ADMIN_EMAIL` allowlist.

---

## Rollout / verification

1. Build (`vite build`) + run new `server/index.js`.
2. Deploy to Railway (project ExtraFun, service `4cc080de-...`).
3. Verify each section loads: Magazyn, Miejsca, Czat (shows shared messages),
   Ogłoszenia, login/signup/profil, admin CRUD.
4. Verify `/sitemap.xml`, `/robots.txt`, and `/magazyn/:slug` meta injection
   (curl, check `<title>`/OG in raw HTML).
5. Confirm white screen gone.

Env required on Railway service: `SUPABASE_URL`, `SUPABASE_SERVICE_ROLE_KEY`,
`ADMIN_EMAIL`, plus existing `VITE_SUPABASE_URL` / `VITE_SUPABASE_ANON_KEY`
(client auth).

---

## Risks
- Shared chat/ads audience mix (accepted; splittable by `source`).
- White screen root cause unknown — must confirm it is resolved, not masked.
- Service-role key must never reach the client bundle (only `server/` imports it).
