# ExtraFun — kalendarium imprez swingers PL + fix kolizji ID (do 31.07.2026)

**Data:** 2026-07-08
**Repo:** morefun (ExtraFun), branch `superpowers`
**Baza:** Supabase `lvxaycjuhchoqhnttyjj`

## Kontekst / cel biznesowy

Przewodnik swingers na extrafun.pl (`/miejsca`) ma pokazywać dla każdego polskiego
klubu **konkretny kalendarz imprez lipca** (kluby działają w rytmie miesięcznym,
nie stałym tygodniowym). Dane pochodzą ze stron WWW klubów (scrap WebFetch/firecrawl,
human-in-loop, zero zmyślania — memory anti-halucynacja).

Podczas realizacji wykryto **blokujący bug produkcyjny** (patrz niżej). Ten spec
obejmuje **najpierw fix kolizji ID**, potem wypełnienie kalendarza.

## Wykryty bug: kolizja przestrzeni ID → wyciek na gay.pl

- Imprezy klubów swing (`recurring_events`, `one_time_events`) są kluczowane przez
  `venue_id = legacy_swing_id` — stary id z `swingers_venues` (zakres 1–198).
- Te liczby **pokrywają się** z `venues.id` wczesnych lokali **gay** (współdzielona
  tabela `venues`, jedna sekwencja id). Np. `198`=Chakran Sauna (gay) vs Elysium
  (legacy 198); `178`=Termax vs Lava; `179`=U Rudolfa vs Jacuzzi.
- gay.pl `server/routes.ts` `/api/venues/:id` oraz lista eventów czytają eventy po
  **surowym `venue.id`, bez filtra sceny** (`storage.getOneTimeEvents({venueId})`,
  `getRecurringEvents({venueId})`). Skutek: **imprezy swingerskie wyświetlają się
  na aktywnych lokalach gay.pl.**
- Skala: **~18 swing-lokali z eventami** kolidują z aktywnymi lokalami gay (KitKat→
  Sauna The Fire, Fata Morgana→Ganimedes, Libert→Hafen, Tres Rombos→Woof Bar,
  6&9→Lab.oratory, Lava→Termax, Jacuzzi→U Rudolfa, Origami→Piano Bar, Prive→
  Babylon, Uhomo→DJ Station, Bordeaux→Hot Male Gogo, Elysium→Chakran, …).

### Pułapka własności (id=5)
`legacy_swing_id=5` (SameRoom Berlin) koliduje z **Bizarriusz Kino (id 5, scene=swing)**.
Eventy pod `venue_id=5` to „Naga Środa", „Czwartkowy Gang Bang", „Swingers Party" —
należą do **Bizarriusza**, nie SameRoom. SameRoom realnie **nie ma** eventów.
⇒ Migracja NIE może ślepo mapować `legacy→own`; właściciela trzeba potwierdzić per id.

## Fix: prze-kluczowanie eventów na własne `venues.id`

Docelowo eventy swing-lokalu mają `venue_id = <venues.id tego swing-lokalu>`
(np. Elysium 351, Lava 336), a nie stary `legacy_swing_id`.

**Dlaczego to usuwa wyciek:** swing-lokale to `is_active=false` — na gay.pl są
ukryte. Po przeniesieniu eventów na ich własne (unikalne, wysokie) id, żaden
aktywny lokal gay nie dzieli już id z eventem swing. gay.pl **bez zmian w kodzie**
przestaje pokazywać swing-imprezy; nadal pokazuje własne eventy lokali gay.

### Zmiana kodu (tylko morefun)
- `server/routes.js` linia 42: `const key = v.legacy_swing_id || v.id` → `const key = v.id`.
  (Po migracji eventy są pod own id; indirection zbędna.) `legacy_swing_id` zostaje
  w SELECT jako proweniencja, ale nie służy do lookupu.
- Zweryfikować admina eventów: stary admin (`server/routes.js` ~365–394) operuje na
  `swingers_venues` (legacy tabela) i kasuje eventy po `venue_id=swingers_venues.id`.
  Po migracji edycja/kasowanie eventów musi kluczować po `venues.id`. Ustalić czy
  ten admin jest jeszcze używany; jeśli tak — dostosować, jeśli martwy — odnotować.
- gay.pl (`gaypl_complete_supabase`): **bez zmian**.

### Migracja danych (z potwierdzeniem własności)
1. **Snapshot**: `create table recurring_events_bak_20260708 as select * from recurring_events;`
   analogicznie `one_time_events_bak_20260708`.
2. **Zbuduj mapę** swing venue (`legacy_swing_id → own venues.id`) tylko dla lokali,
   które mają eventy (`rec_cnt>0 or ot_cnt>0`).
3. **Potwierdź własność per id** — dla każdego kolidującego id obejrzyj wiersze
   eventów; przenoś tylko te, których treść opisuje swing-lokal. **Wyklucz id=5**
   (Bizarriusz). Gay-kolizyjne lokale zagraniczne nie mają własnych eventów → ich
   id niosą wyłącznie dane swing (bezpieczne do przeniesienia).
4. **UPDATE** `recurring_events`/`one_time_events` `SET venue_id=<own>` dla
   potwierdzonych id. (FK do `venues.id` spełniony — own id istnieje.)
5. **Weryfikacja** (patrz niżej).

## Model kalendarza (po fixie)

- **Konkretne daty** → `one_time_events` (`venue_id=own`, `event_date`, `event_name`,
  `start_time` wymagane). Zero zmian schematu.
- **Weekly (`recurring_events`)**: zasada „weekly tylko gdzie realny stały motyw"
  (np. Lava: Wt Saunowanie / Śr Gang Bang / … — zostaje). Zmienny miesięczny
  program → weekly `is_active=false`, dni bez daty nie kłamią.
- Frontend już nadpisuje weekly datą per dzień; brak zmian frontendu poza `key`.

## Zakres kalendarza (13 PL klubów)

Jacuzzi (Chwaszczyno), Red Fox (Czeladź), Bordeaux + PurPur (Łódź), Prive (Lubliniec),
Elysium/Galla/Lava/Heaven/Utopia (Warszawa), Origami (Wrocław), Ray (Wysogotowo),
Blue Sauna Gay (Katowice — dni pon/wt dla par, jak Heaven).
Pominięte: lokale zagraniczne, plaże.

Dane już zescrapowane (do wpisania po fixie): Elysium (11), Ray (7), Origami (7),
Jacuzzi (9), Prive (7), Utopia (21), Lava (named pt/sob), PurPur (1: NAKED 08.07).
Bez publikowanego programu: Bordeaux, Red Fox (TLS wygasły), Heaven/Galla (realny
weekly — zostaje). Godziny brakujące = default z adnotacją „wg klubu", nie zmyślane.

## Weryfikacja

- **Brak wycieku**: dla każdego kolidującego gay-lokalu (Chakran 198, Termax 178,
  U Rudolfa 179, …): `GET https://<gaypl>/api/venues/:id` → `recurring_events` i
  `upcoming_one_time_events` puste (albo tylko własne gay-eventy). Też lista eventów.
- **ExtraFun dalej działa**: `GET /api/places` (prod) — swing-lokale mają swoje
  eventy pod own id.
- **Bizarriusz**: eventy „Naga Środa" itd. tylko na Bizarriuszu, nie na SameRoom.

## Ryzyka / granice

- **Błędne przeniesienie**: gdyby jakiś gay-lokal miał WŁASNE eventy pod kolidującym
  id, migracja przeniosłaby je do swing-lokalu. Mitygacja: snapshot + inspekcja
  treści per id (krok 3) + wykluczenie id=5.
- **Admin legacy**: jeśli edycja eventów idzie przez `swingers_venues`, po migracji
  wymaga dostosowania kluczowania.
- **Horyzont 31.07**: po tej dacie kalendarz pusty → dozwolony weekly lub pusto.
- **Deploy**: morefun deploy = GitHub Actions na push (memory). gay.pl bez deployu.

## Nie robimy (YAGNI)

- Brak nowej tabeli/kolumny „week_of_month".
- Brak zmian w kodzie gay.pl (fix przez re-key rozwiązuje po stronie danych).
- Brak automatycznego cron-scrapingu — jednorazowe wypełnienie lipca, człowiek w pętli.
