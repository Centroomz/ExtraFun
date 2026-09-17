# EF — wspólna prawa kolumna (SiteRail) na desktop

Data: 2026-09-17. Faza A z planu „EF consistency" (faza B = mobile snap feed, osobny spec).

## Cel
Każda strona treściowa EF ma na desktop (lg+) tę samą prawą kolumnę. Okładki sprzedają —
moduły pokazują miniatury okładek, nie same tytuły.

## Zakres
Nowy `src/components/SiteRail.jsx` zastępuje `MagazynSidebar.jsx` i `RightRail` z
`ArticleDetailPage.jsx`. Nowy wrapper `src/components/PageWithRail.jsx`
(`lg:grid lg:grid-cols-12 gap-x-12`, treść `col-span-8`, aside `col-span-4`, `sticky top-8`,
`hidden lg:block`). Mobile w tej fazie bez zmian.

## Moduły (kolejność)
1. Powiązane — tylko artykuł (prop `related`).
2. Najczęściej czytane — top 5 wg `views`, miniatura + tytuł.
3. Najnowsze — 5 wg `publish_date`, miniatura + tytuł.
4. Dziś w klubach — `/api/events?from=today&to=today`. Brak imprez ⇒ moduł nie renderuje się.
5. Zeszły Temat Miesiąca — `MONTH_THEMES[m-1]` (okładka+tytuł, link `/magazyn/rubryka/<slug>`).
   Brak wpisu ⇒ moduł nie renderuje się.
6. Miejsca blisko — istniejący NearbyModule; bez geolokalizacji domyślnie Warszawa.
7. Słówko dnia — istniejący.
8. Quiz — tylko Magazyn (prop `onStartQuiz`).

Prop `exclude` = slug bieżącego artykułu (wykluczony z 2–3). Dane: jeden `/api/articles` per mount.

## Strony z railem
Magazyn, Artykuł, Aktualności, Rubryka, Imprezy, Plaże, Miejsca (hub: pod istniejącą kolumną
redakcyjną; miasto: pełny rail), Słownik, Hasło słownika, Ogłoszenia (lista).
Bez railu: Czat, Wiadomości, Admin, login/profil, formularz dodawania ogłoszenia.

## Zasady
Tokeny z DESIGN.md (klasy `font-body text-label-caps`, `text-primary-container` itd.), zero
wartości „na oko". Żadnych placeholderów — pusty moduł znika.

## Dowód
Zrzuty prod desktop: /magazyn, /magazyn/:slug, /imprezy, /miejsca, /ogloszenia.
