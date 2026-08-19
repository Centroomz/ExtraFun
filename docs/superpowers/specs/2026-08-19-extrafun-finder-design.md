# ExtraFun Finder + soft removal of biz discovery — design

Date: 2026-08-19
Status: approved (brainstorming), pending implementation plan

## Problem / goal

bizarriusz.pl carries a member catalog ("Szukaj"/Finder): browse other guests'
profiles, like/match, block/report. It is an online-dating surface that competes
with the club's north star (bodies through the door) instead of feeding it — the
same concern that drove the ads cross-portal gate. Decision: move the *dating
catalog* to extrafun.pl (the swing/lifestyle portal), while the profile stays on
biz purely as identity for chat / RSVP / groups.

All three portals (gay.pl, bizarriusz, extrafun) share ONE Supabase project
(`lvxaycjuhchoqhnttyjj`): one auth (`user_metadata` holds profiles), shared
tables `profile_likes` / `profile_blocks` / `profile_reports` / `user_gallery`.
So this is a routing/visibility + build problem, NOT a data migration. ExtraFun
currently has NO profile catalog (only an own-profile upsert) — the finder must
be built there.

Current finder usage (2026-08-19): 283 likes from 85 distinct users, 2 blocks,
1 report. The feature is live and used — not dead. Removing it from biz without a
replacement would lose active engagement, hence the move rather than a delete.

## Non-goals

- No data migration (shared DB).
- No club-specific bits on the extrafun profile: biz groups, club check-in badge,
  biz ads are omitted (cross-context noise on a swing portal).
- Not touching chat / RSVP / groups on biz — profile-as-identity stays there.

## Consent / privacy model

Users consented to being listed in Szukaj **on biz** (a launch broadcast told
them so). Exposure on extrafun is a new context and needs its own control.

- New per-user opt-out flag `user_metadata.hidden_from_extrafun` (mirrors the
  existing `hidden_from_search`).
- Visibility rule on extrafun finder: a profile shows iff it has a name AND
  `hidden_from_search !== true` AND `hidden_from_extrafun !== true`.
- Heads-up DM broadcast (idempotent via a `site_config` marker, same pattern as
  the biz finder launch): "your profile will also appear on extrafun.pl — hide
  there with one click." Only after the broadcast are profiles exposed (see
  phasing: default hidden until consent step).
- Profile editor (biz `/profil` and extrafun profile) gets a toggle "Ukryj mnie
  w Szukaj na extrafun".
- New accounts: a line in the welcome DM.
- Gallery: the shared `user_gallery` photos appear on the extrafun profile (same
  photos as the biz profile). Covered by the heads-up DM consent.

## Biz-side changes (soft removal)

- Remove the discovery grid: drop the `/szukaj` nav entry (`BizLayout.tsx:71`)
  and the browse-grid page.
- Keep `/profil/:id` (profile detail) and likes ("kto Cię polubił"): if someone
  likes or DMs you, you can still view their profile on biz. Only active browsing
  moves to extrafun.
- Consequence: on biz, likes become effectively read (you see who liked you); to
  like back / browse you go to extrafun. The shared `profile_likes` table makes
  matches work across both portals.

## ExtraFun build (Lean v1)

Stack: extrafun is JS (Vite + Express), not TS. Port the biz `finder.ts` logic
to `morefun/server/routes.js` and add a `Finder.jsx` page.

### Server (`morefun/server/routes.js`)
- `GET /api/finder` (optional auth): guest → `{ count, locked: true }` (rows stay
  server-side, no leak). Logged-in → paged list of `PublicProfile`
  `{ id, displayName, age, lookingFor, avatarUrl, createdAt, lastSeen }` from
  `supabaseAdmin.auth.admin.listUsers`, projecting only safe public fields (never
  email). Excludes `hidden_from_search`, `hidden_from_extrafun`, blocked pairs,
  and self. Cache the visible list ~60s (as biz does). Fallback avatar from newest
  `user_gallery` photo. Modes: `all` (recently-active first), `photos`, `new`,
  `active` (last-seen < 30d). Age range + free-text (name/lookingFor) filters.
- `GET /api/finder/:id`: full public profile — name/age/about/lookingFor/avatar/
  gallery/prompts + like state (likedByMe / likesMe / isMatch). 404 on hidden/empty
  or blocked. NO biz groups, NO club check-in, NO biz ads.
- `POST /api/finder/:id/like` (toggle, push to liked user), `GET /api/finder/likes/me`,
  `POST /api/finder/:id/block` (bidirectional, clears likes both ways),
  `POST /api/finder/:id/report` (stored + admin ping).
- Reuse shared tables `profile_likes/profile_blocks/profile_reports/user_gallery`.
- Sanitize `prompts` the same way biz does (`sanitizePrompts`) — port the helper.

### Client (`morefun/src/`)
- `pages/Finder.jsx`: grid of profile cards in extrafun's existing Nocturne style
  (mirror `Ogloszenia.jsx` card patterns), mode chips, age + search filters,
  profile detail (modal or route), like/block/report controls, "kto Cię polubił".
- Nav entry in `components/BottomNav.jsx`.
- Own-profile visibility toggle `hidden_from_extrafun` wired through the existing
  `PUT /api/profile` (extend it to persist the flag into `user_metadata`).

## Cross-portal notes

- `profile_likes` shared → a like on extrafun surfaces on biz "kto Cię polubił",
  and a match is a match on both. Documented, intentional.
- The biz `/api/finder` listing endpoint stays but is no longer reached from the
  (removed) grid; leaving it is harmless. `/profil/:id` + likes stay wired.

## Phasing (de-risk, ship incrementally)

1. **Phase 1 — read-only finder on extrafun.** Grid + profile detail (no
   like/block yet), `hidden_from_extrafun` flag + profile toggle, guest = count.
   Profiles DEFAULT HIDDEN on extrafun until the consent broadcast (Phase 3), so
   nothing is exposed early. Verify on prod.
2. **Phase 2 — engagement.** Likes/match/block/report on extrafun.
3. **Phase 3 — consent + biz cutover.** Heads-up DM broadcast (flips exposure on),
   then remove the discovery grid + `/szukaj` nav from biz.

## Verification

ExtraFun is JS with no test suite and local preview does not run (no DATABASE_URL
locally — known pattern for biz/extrafun). Verify each phase on prod: count-only
for guests, listing/detail shapes, like/block/report round-trips, and the
visibility flags (hidden_from_search / hidden_from_extrafun both honored).

## Open risks

- Exposing club members' gallery photos on a swing portal — mitigated by the
  heads-up DM + per-portal opt-out, and Phase-1 default-hidden.
- Cross-portal like UX split (see notes) — accepted.
