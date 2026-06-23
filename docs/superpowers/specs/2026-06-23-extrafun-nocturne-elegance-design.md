# ExtraFun → Nocturne Elegance — re-layout (design)

Data: 2026-06-23
Status: zatwierdzony (do planu)

## Cel

Odświeżyć ExtraFun (Vite + React, front-only, repo pinksservice/ExtraFun, lokalnie `Downloads/morefun`) do edytorialnego luksusowego layoutu **Nocturne Elegance** wg eksportu Stitch (`/tmp`/dostarczony zip → screeny + `nocturne_elegance/DESIGN.md`). Pełny re-layout WSZYSTKICH sekcji, wprowadzając Tailwind, fazowo (strona nie pada w trakcie).

Punkt wyjścia: ExtraFun stoi na inline-style + CSS `:root` vars (`src/index.css`), nagłówki Playfair, body Inter, akcent #e9c176, bg #05050D (reskin z 2026-06-17 „Wyrafinowana Intymność"). Nocturne to ewolucja: głębszy, Bodoni Moda, #d4af37, #121414, magazynowa siatka.

## Decyzje (zatwierdzone)

1. **Zakres:** pełny re-layout wszystkich sekcji.
2. **Stack:** wprowadzić Tailwind (Approach A — współistnienie + migracja per-sekcja).
3. **Czcionka body:** Montserrat (świadomy override DM Sans z eksportu DESIGN.md).
4. **Zdjęcia:** generowane przez skill `banana`.
5. **Sekcje spoza eksportu:** też nowy design.
6. **Weryfikacja:** istniejący ekran `src/components/AgeGate.jsx` (18+ gate) — re-skin wyglądu, logika bez zmian.

## Architektura — integracja Tailwind (Approach A)

- Dodać do morefun: `tailwindcss`, `postcss`, `autoprefixer` (devDeps). `tailwind.config.js` (`darkMode:'class'`, content `./index.html`, `./src/**/*.{js,jsx}`), `postcss.config.js`.
- `src/index.css`: na górze dyrektywy `@tailwind base; @tailwind components; @tailwind utilities;`. Istniejące `:root` vars i klasy ZOSTAJĄ na czas migracji (współistnienie dwóch systemów). Nowe/migrowane sekcje używają klas Tailwind + tokenów; stare inline-style działają aż do przepisania.
- **Ryzyko preflight:** Tailwind base resetuje style globalne (margin, font, box-sizing) → może ruszyć obecny wygląd niemigrowanych stron. Mitygacja: w fazie 0 zweryfikować całą stronę po włączeniu preflight; w razie kolizji rozważyć `corePlugins.preflight` zawężony lub własny reset zgodny z obecnym. Decyzja w planie fazy 0 na podstawie testu.
- `<html class="dark">` (eksport zakłada dark) — ustawić na stałe (ExtraFun jest dark-only).

## Tokeny + typografia

Źródło: `nocturne_elegance/DESIGN.md`. Port do `tailwind.config` `theme.extend`:

- **Kolory** (kluczowe): `background`/`surface`/`surface-dim` `#121414`; skala: `surface-container-lowest #0c0f0f`, `-low #1a1c1c`, `-container #1e2020`, `-high #282a2b`, `-highest #333535`; `on-surface #e2e2e2`, `on-surface-variant #d0c5af`; `outline #99907c`, `outline-variant #4d4635`; **akcent**: `primary #f2ca50`, `primary-container #d4af37` (główny szampański akcent: CTA, diamenty, linie separujące), `on-primary #3c2f00`; `secondary #c6c4df`; `error #ffb4ab`.
- **Typografia** — skala z DESIGN.md, ale rodziny: nagłówki **Bodoni Moda**, body **Montserrat** (override). Tokeny: `display-lg` 64/1.1/-0.02em (mobile 40), `headline-md` 32/1.3, `headline-sm` 24/1.4, `body-lg` 18/1.6/0.01em Montserrat, `body-md` Montserrat, `label-caps` (uppercase, tracking 0.3em — etykiety/CTA).
- **Fonty:** w `index.html` doładować `Bodoni Moda` (ital,opsz,wght) + `Montserrat`. Usunąć/zostawić istniejące wg użycia (Inter/Playfair zostają dopóki są niemigrowane strony, potem sprzątnąć). Ryzyko ładowania jak Anton na bizarriuszu — NIE traktować lokalnego renderu jako dowodu; weryfikować na prod.
- `material-symbols-outlined` (ikony w eksporcie) — dodać lub zmapować na obecny zestaw ikon ExtraFun (decyzja w planie; preferencja: użyć istniejących SVG/ikon, nie dokładać Material Symbols jeśli ExtraFun ma już zestaw).

## Layout

- Kontener `max-w` + szerokie marginesy boczne; oś lewostronna (brak centrowania); duży pionowy whitespace między sekcjami; siatka 12-col (`grid-cols-12`, gutter) asymetryczna.
- **Hero „editorial spread":** pełnoekranowe nastrojowe zdjęcie + overlay/winieta + nagłówek Bodoni duży lewostronny + label-caps („FEATURED STORY") + CTA prostokąt złoty.
- **Karty:** bez ramek, oparte na zdjęciu (moody), tytuł Bodoni, meta szare. Subtelne winiety.
- **Oceny:** komponent `DiamondRating` — 5 złotych diamentów.
- Mobile-first zostaje + **BottomNav** na mobile; edytorialny układ desktop od `md`. Responsywnie wg breakpointów Stitcha (mobile warianty w eksporcie).

## Komponenty bazowe (faza 1, reużywalne)

- `Hero` (editorial spread, props: image, label, title, lead, cta)
- `ArticleCard` (image-led, warianty: hero/duży/mały)
- `SectionHeader` (Bodoni tytuł + link „WSZYSTKIE …" + dolna linia outline)
- `Button` (złoty prostokąt + wariant link-ze-strzałką, złote podkreślenie)
- `DiamondRating` (5 diamentów)
- `Vignette`/overlay util

## Mapowanie ekran Stitch → strona ExtraFun

| Stitch | Strona | Plik |
|---|---|---|
| magazyn_extrafun_home | Magazyn (home + /magazyn) | `src/pages/Magazyn.jsx` |
| extrafun_przewodnik / extrafun_miejsca | Przewodnik (/miejsca, :city) | `src/pages/Przewodnik.jsx` |
| extrafun_s_ownik (+poj) | Slownik / SlownikTerm | `src/pages/Slownik.jsx`, `SlownikTerm.jsx` |
| extrafun_weryfikacja | AgeGate | `src/components/AgeGate.jsx` |

Bez ekranu (spójne z systemem, nie pixel-perfect): `Imprezy`, `Plaze`, `Ogloszenia`, `ArticleDetailPage`, `Czat`, `Admin`, `LoginPage`/`SignupPage`/profil.

## Zdjęcia (banana)

- Generować kinowe, nastrojowe, edytorialne (prompt bazowy z DESIGN.md: warm champagne gold highlights, midnight blue tailored clothing, low-key dramatic light, velvet/silk, bokeh city lights, minimalist high-end magazine).
- Cele: hero home, hero/akcenty sekcji (Przewodnik, Słownik, Imprezy, Plaze), tło AgeGate. ~1–2 hero na sekcję na start (dokładną liczbę dobrać per strona w planie; YAGNI — nie generować na zapas).
- Przechowywanie: bucket Supabase `extrafun-editorial` (public), referencja po URL w kodzie/danych. Dynamiczne treści bez własnego zdjęcia (artykuły, venues) → fallback gradient + winieta + typografia (bez wymuszania generacji per rekord).

## Fazy (każda: implementacja → build → deploy → weryfikacja na live)

0. **Fundament** — Tailwind + config + tokeny + fonty + test preflight. Bez zmian wizualnych (lub minimalne). Bump SW `CACHE_NAME` (v4→v5) przy pierwszym deployu nowego bundla.
1. **Magazyn/home** + komponenty bazowe (Hero, ArticleCard, DiamondRating, SectionHeader, Button) + hero-zdjęcie banana.
2. **Przewodnik/Miejsca** (+ city pages, istniejąca karta „Plaże").
3. **Słownik** + SlownikTerm.
4. **AgeGate** (weryfikacja) — tylko wygląd, logika 18+ bez zmian.
5. **Reszta sekcji:** Imprezy, Plaze, Ogloszenia, ArticleDetailPage, Czat, Admin, auth.
6. **Zdjęcia banana** — równolegle od fazy 1, per strona.

## Ryzyka i mitygacje

- **SW cache** (`public/sw.js`, cache-first assety): bump `CACHE_NAME` v4→v5 przy pierwszym deployu, by userzy dostali nowy bundle. (Wzorzec z 2026-06-22.)
- **Tailwind preflight × globalne CSS:** test w fazie 0; ewentualnie zawęzić preflight.
- **Ładowanie Bodoni Moda:** weryfikować na prod, nie lokalnie (precedens Anton/bizarriusz).
- **Override Montserrat vs DM Sans:** świadomy; spójnie w configu i index.html.
- **preview lokalny zepsuty** (launch.json odpala npm z Downloads): weryfikacja po deployu (live), jak w sesji 2026-06-22.
- **Baza/Supabase nietknięte** — re-skin czysto front-end; zero zmian schematu/danych.

## Sukces

- Wszystkie sekcje w stylu Nocturne (Bodoni Moda nagłówki, Montserrat body, #d4af37 akcent, #121414 bg, lewostronna siatka 12-col, hero-spready).
- Strona działa na każdym etapie (fazowo, bez globalnej awarii).
- Nowy bundle dociera do userów (SW v5).
- Mobile (BottomNav) + desktop edytorialny responsywnie.
