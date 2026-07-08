# ExtraFun — kalendarium imprez klubów swingers (PL), do 31.07.2026

**Data:** 2026-07-08
**Repo:** morefun (ExtraFun), branch `superpowers`
**Baza:** Supabase `lvxaycjuhchoqhnttyjj`

## Problem

Przewodnik swingers na extrafun.pl (`/miejsca`) pokazuje kluby z **tygodniowym**
rozkładem (`recurring_events`, `day_of_week` 0–6), który powtarza się co tydzień.
Kluby swingerskie działają w rytmie **miesięcznym** — konkretne imprezy tematyczne
w danych datach (np. Elysium: „Sobota 11.07 Divine Femmes", „Piątek 31.07 Summer
Sinners Night"). Tygodniowy rozkład dla nich **kłamie**: pokazuje event w każdą
sobotę, choć realnie każda sobota to inna (lub żadna) impreza.

## Cel

Dla każdego polskiego klubu swingers w przewodniku zbudować **konkretny kalendarz
dat do 31.07.2026** na podstawie programu z jego strony WWW. Frontend już renderuje
daty (`one_time_events`) nad tygodniowym rozkładem — wykorzystujemy istniejący
mechanizm, zero zmian schematu.

## Zakres

**12 polskich klubów** (Blue Sauna Gay/Katowice **pominięty** — gay-sauna, nie klub par):

| id | Klub | Miasto | www | weekly (rec_ev) |
|----|------|--------|-----|-----------------|
| 402 | Jacuzzi Club | Chwaszczyno k.Gdańska | jacuzziclub.pl | 3 |
| 392 | Red Fox | Czeladź | redfoxswing.pl | 0 |
| 329 | Bordeaux Club | Łódź | bordeauxclub.pl | 2 |
| 399 | PurPur Zmysły | Łódź | purpur-zmysly.pl | 0 |
| 474 | Prive | Lubliniec | prive-lubliniec.pl | 2 |
| 351 | Elysium Club | Warszawa | elysium.warszawa.pl | 3 |
| 233 | Galla sauna | Warszawa | saunagalla.pl | 7 |
| 336 | Lava Club | Warszawa | lava-club.pl | 6 |
| 234 | Sauna Heaven | Warszawa | heavensauna.pl | 7 |
| 415 | Sauna Utopia | Warszawa | utopia-club.pl | 0 |
| 374 | Origami | Wrocław | origamiclub.pl | 2 |
| 364 | Ray Club | Wysogotowo k.Poznania | ray-club.pl | 0 |

Poza zakresem: kluby zagraniczne (Amsterdam/Berlin/Barcelona/…), plaże.

## Model danych

- **Konkretne daty** → `one_time_events`. Wymagane kolumny: `venue_id`, `event_date`
  (timestamp), `event_name`, `start_time` (text). Opcjonalne: `end_time`, `price`,
  `description`, `tags`, `external_link`.
- **`venue_id` = `coalesce(legacy_swing_id, id)`** — przestrzeń kluczy swingers
  (routes.js: `key = v.legacy_swing_id || v.id`). Wpis pod złym id = niewidoczny.
- **Weekly (`recurring_events`)**: zasada **„weekly tylko gdzie realny stały motyw"**.
  - Klub z realnym cotygodniowym stałym motywem (np. „każda sobota Naked", stała
    godzina/cena bez zmiennej tematyki) → weekly **zostaje**.
  - Klub ze zmiennym miesięcznym programem → weekly dla lipcowych dni **wyłączyć**
    (`is_active=false`), żeby dni bez wpisanej daty nie pokazywały fałszywej imprezy.
    Decyzja per klub podczas scrapingu, na podstawie tego co realnie publikują.

Frontend: `one_time_events` z `event_date >= today` nadpisuje weekly danego dnia
(routes.js `/api/places`). Zero zmian w kodzie frontendu — czysto dane.

## Proces (pipeline per klub, human-in-loop)

1. **Scrape** strony głównej (WebFetch; firecrawl jako zapas gdy wróci limit).
2. **Znajdź podstronę programu/kalendarza** (`/kalendarz`, `/imprezy`,
   `/planowane-imprezy…`) i zescrapuj daty + nazwa + godziny + cena lipca.
3. **Pokaż użytkownikowi tabelę** (klub → data → nazwa → godz → cena → źródło URL)
   **do akceptacji przed wpisem**. Zero zmyślania (memory: anti-halucynacja,
   „nie zmyślać imprez"). Braki (godzina/cena) zostają puste, nie wymyślane.
4. **Po akceptacji** — INSERT do `one_time_events` (batch per klub, `venue_id`
   = coalesce(legacy_swing_id,id)). Gdzie trzeba: `UPDATE recurring_events SET
   is_active=false` dla klubów o zmiennym programie.
5. **Idempotencja**: przed insertem usunąć istniejące przyszłe `one_time_events`
   danego venue (`event_date >= today`), by re-run nie dublował.

## Weryfikacja

- Po wpisie: `GET /api/places` (prod) lub SQL — sprawdzić że każdy klub ma
  `oneTime` z datami lipca i że znikły fałszywe weekly.
- Wizualnie: `/miejsca` na prod — klub pokazuje realne daty, nie zmyślony weekly.

## Ryzyka / granice

- **Jakość danych**: część stron może nie mieć jawnego programu (Bordeaux → podstrona;
  strony na JS mogą wymagać firecrawl z `waitFor`). Klub bez publikowanego programu →
  zostawić jak jest, oznaczyć do ręcznego uzupełnienia, nie zmyślać.
- **Horyzont 31.07**: po tej dacie kalendarz się kończy → dni bez dat pokażą
  (dozwolony) realny weekly lub pusto. Odświeżenie sierpnia = powtórka pipeline'u
  (poza zakresem tego spec).
- **Firecrawl**: dziś wyczerpany darmowy limit → WebFetch jako główne narzędzie.

## Nie robimy (YAGNI)

- Brak nowej tabeli / kolumny „week_of_month".
- Brak zmian frontendu (mechanizm dat już działa).
- Brak automatycznego cron-scrapingu — jednorazowe wypełnienie lipca, człowiek w pętli.
