# ExtraFun — przebudowa strony głównej Magazynu (desktop) na layout magazynowy

**Data:** 2026-09-16
**Autor:** Sławomir Starosta + Claude
**Status:** zatwierdzony (mockup + 3 decyzje zaakceptowane)

## Cel

Strona główna EF (`/magazyn`, `src/pages/Magazyn.jsx`) wyświetla artykuły jednym
płaskim gridem (co 3. kafel duży, filtr generyczny) — „bez ładu i składu".
Przebudować desktop na układ magazynowy: hero = Temat Miesiąca, sekcje per
rubryka w kolejności rytmu tygodnia, archiwum z filtrem na dole. Zakres:
**desktop**. Mobile bez zmian w tej iteracji.

## Diagnoza (badanie, nie założenia)

- EF nie jest zanieczyszczony treścią innych portali. `/api/articles`
  (`server/routes.js:163`) filtruje `.eq('site','extrafun')`. Wcześniejszy
  licznik bez `site` mylnie pokazywał gay.pl/biz.
- Realny EF (`site='extrafun'`), published: cnm-101 6 · dogging 6 · pierwszy-raz 5
  · felieton 4 · naga-sroda 4 · bez-osadu 3 · plazing 2 · miejsca 1 · slownik 1
  · tam-i-tam 1 · wellness 1 · temat-miesiaca 0 (7 sched, 4 draft).
- „bez ładu i składu" = problem **layoutu**, nie zgniłych danych. Tab „Temat
  Miesiąca" jest pusty bo treść tematu siedzi pod slugiem miesiąca (`dogging`),
  nie pod `temat-miesiaca`. `SLUG_TO_DISPLAY` nie zna paru slugów.

## Taksonomia rubryk (po redukcji)

**Kręgosłup — rytm tygodnia (kolejność sekcji na stronie):**
1. **Temat Miesiąca** (Pon+Pt) — parasol. Treść zostaje pod slugiem miesiąca
   (np. `dogging`); nagłówek/hero mówi „Temat Miesiąca: <motyw>". Sterowane
   configiem, **zero migracji danych**.
2. **Tam i Tam** (Wt) — `tam-i-tam`.
3. **Naga Środa** (Śr) — `naga-sroda`.
4. **Felieton** (Sob) — `felieton`.

**Wiedza (evergreen, jeden blok):** `cnm-101` + `pierwszy-raz` + `bez-osadu`
pokazywane razem pod nagłówkiem „Wiedza". Slugi/filtry pozostają osobne.

**Plażing** (`plazing`) — sezonowy temat. Domyślnie w archiwum; wraca do Hero
gdy jest tematem miesiąca (przez config).

**Poza magazynem-frontem:** `miejsca` → własna strona `/miejsca`; `slownik` →
własna strona `/slownik` (nie renderować jako blok rubryki).

## Sprzątanie danych (2 rekordy, bramka zatwierdzenia PRZED UPDATE)

- id220 „Suchość — temat, o którym nie mówi się w sypialni" `wellness` → `bez-osadu`
- id32 „Słownik CNM: 50 pojęć, które musisz znać" `slownik` → `cnm-101`

Pokazać dokładne wiersze, czekać na zgodę usera, dopiero UPDATE. Podmiana
category_slug nie dotyka publish_date.

## Struktura strony (desktop)

1. **Hero** — Temat Miesiąca. Obraz pełnej szerokości kolumny, **tekst na
   zdjęciu** (label złoty caps + tytuł Bodoni + lead), ciemny scrim od dołu dla
   czytelności.
2. **Pasek „Rytm tygodnia"** — 4 wejścia (Pon/Pt Temat Miesiąca · Wt Tam i Tam ·
   Śr Naga Środa · Sob Felieton), linkują do sekcji/filtra.
3. **Bloki per rubryka** (kolumna główna, 8/12): nagłówek (label caps + rule +
   „więcej →") + 3-4 najnowsze karty. Blok z 1 wpisem → wide-feature.
   **Pusta rubryka = ukryta** (zero placeholderów — zasada twarda).
   Kolejność: Temat Miesiąca → Naga Środa → Tam i Tam → Felieton → Wiedza.
4. **Archiwum** — cały katalog z filtrem kategorii (obecny grid, teraz jako ogon).
5. **Sidebar** (4/12): **Quiz na górze**, pod nim **Słówko dnia**, dalej
   Najczęściej czytane, Miejsca blisko. Usunąć zdublowany `ThemeModule`
   (hero go zastępuje).

## Granice komponentów

- `src/lib/theme-month.js` (nowy) — config parasola: `{ month, label, title,
  lead, image, slugs: [] }` na miesiąc; helper `getMonthTheme(date)`. Jedno
  źródło prawdy dla Hero + sekcji Temat Miesiąca. Miesiąc bez configu → hero
  pokazuje najnowszy z kręgosłupa (fallback bez placeholderu).
- `src/components/nocturne` — reuse `ArticleCard`, `SectionHeader`, `Hero`
  (Hero rozszerzyć o wariant overlay albo nowy `HeroOverlay`).
- `RubrykaSection` (nowy, mały) — props: `label`, `slugs[]`, `articles`,
  `href`, `limit`, `variant`. Renderuje nagłówek + karty; zwraca `null` gdy brak
  artykułów. Jeden cel, testowalny w izolacji.
- `Magazyn.jsx` — orkiestracja: pobiera artykuły, grupuje wg rubryk, renderuje
  Hero + rail + sekcje + archiwum. Chudnie (logika kart wychodzi do
  `RubrykaSection`).
- `MagazynSidebar.jsx` — kolejność: Quiz → Słówko → Popular → Nearby; wyciąć
  `ThemeModule`.
- `SLUG_TO_DISPLAY` + `CATEGORIES` — uzupełnić o wszystkie realne slugi EF,
  wyciąć martwe. Filtr archiwum = realne rubryki EF.

## Zasady twarde

- Tylko tokeny design-systemu (Tailwind nocturne / zmienne CSS). Zero surowych
  `fontSize`/kolorów w `style={{}}`. Brak tokena → zapytać, nie zgadywać.
- Pusta rubryka ukryta, nigdy placeholder.
- Dowód „zrobione" = zrzut ŻYWEJ strony obok makiety, side-by-side. Nie grep/build.
- Commit + push po skończeniu.

## Poza zakresem (YAGNI)

- Redesign mobile (osobna iteracja).
- Zmiany schedulera / kalendarza publikacji (rytm tygodnia to kolejność sekcji,
  nie zmiana logiki publikacji).
- Kuratorskie „editor picks" (to był wariant C, odrzucony).

## Weryfikacja

Strona wymaga API + (admin osobno). Publiczny `/magazyn` czyta `/api/articles`
z prod — zweryfikować na żywej stronie po deployu (Railway), zrzut side-by-side
z makietą. Puste rubryki faktycznie znikają. Hero czytelny na zdjęciu.
