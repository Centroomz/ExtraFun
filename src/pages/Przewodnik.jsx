import { useState, useEffect, useRef } from 'react'
import { useLocation } from 'wouter'
import { Helmet } from 'react-helmet-async'
import { apiFetch } from '../lib/api'
import { useGeolocation } from '../hooks/useGeolocation'
import { calculateDistance, formatDistance } from '../lib/geo'
import { Hero, Button } from '../components/nocturne'
import { PageWithRail } from '../components/PageWithRail'
import { SiteRail } from '../components/SiteRail'
import { MiejscaMobileFeed } from '../components/MiejscaMobileFeed'
import { slugify, venueSlug } from '../lib/venueSlug'
import { useImpression, trackClick } from '../lib/cardStats'
import { CardStatBadge } from '../components/CardStatBadge'

// ─── TYPE CONFIG (DB uses English keys) ───────────────────────────────────────
const TYPE_CONFIG = {
  club:      { label: 'Klub',    color: '#d4af37', bg: 'rgba(233,193,118,0.12)',   icon: '🎭' },
  sauna:     { label: 'Sauna',   color: '#d4af37', bg: 'rgba(212,175,55,0.12)', icon: '♨️' },
  bar:       { label: 'Bar',     color: '#d4af37', bg: 'rgba(212,175,55,0.12)',   icon: '🍸' },
  dungeon:   { label: 'Dungeon', color: '#FF4500', bg: 'rgba(255,69,0,0.12)',    icon: '⛓️' },
  spa:       { label: 'Spa',     color: '#00FF96', bg: 'rgba(0,255,150,0.12)',   icon: '🛁' },
  party:     { label: 'Impreza', color: '#FFA500', bg: 'rgba(255,165,0,0.12)',   icon: '🎉' },
  plaża:     { label: 'Plaża',   color: '#39c0ed', bg: 'rgba(57,192,237,0.12)',  icon: '🏖️' },
  other:     { label: 'Inne',    color: '#888',    bg: 'rgba(136,136,136,0.12)', icon: '📍' },
}

function getTypeConfig(type) {
  return TYPE_CONFIG[type] || TYPE_CONFIG.other
}

// ─── STATIC ARTICLE CONTENT ───────────────────────────────────────────────────
const ARTICLES = [
  {
    id: 'top10-europa',
    hero: true,
    emoji: '🏆',
    tag: 'Ranking',
    tagColor: '#FFD700',
    title: 'TOP 10 Klubów Lifestyle w Europie',
    lead: 'Fun4Two w Holandii, Les Chandelles w Paryżu, Insomnia w Berlinie — gdzie realnie jeździ scena lifestyle, z adresami.',
    city: 'Europa',
    readTime: '5 min',
    content: [
      { h: 'Jak tworzyliśmy ranking?' },
      { p: 'Nie wymyślamy klubów. Ranking opiera się na opiniach i przewodnikach branżowych (TripAdvisor, Yelp, lokalne portale lifestyle) — każda pozycja ma realny adres i sprawdzalne źródło. Jeśli jakiś klub zamknął się albo zmienił adres, dajcie znać.' },
      { h: '#1 – Fun4Two (Moordrecht, Holandia)' },
      { p: 'Najczęściej wymieniany przez doświadczone pary jako najlepszy klub w Europie. Zabytkowa holenderska farma z lat 50. XIX w. zamieniona na kompleks z playroomami. Middelweg 18, Moordrecht.' },
      { h: '#2 – Les Chandelles (Paryż, Francja)' },
      { p: 'Najpierw restauracja, potem klub libertine — dyskretne wejście tuż przy Palais-Royal. 1 Rue Thérèse, 75001 Paryż.' },
      { h: '#3 – Insomnia (Berlin, Niemcy)' },
      { p: 'Klub lifestyle dla par i singli, otwarty na sex-positive, queer, swinger i genderfluid — bez podziału na "tylko mężczyzn". Eventy typu Couples Connected. Alt Tempelhof 17-19, 12099 Berlin.' },
      { h: '#4 – Club Equinoxe (Hamburg, Niemcy)' },
      { p: 'Największy swingers club północnych Niemiec, w budynku starego kina. Eiffestraße 584, 20537 Hamburg.' },
      { h: '#5 – Hellfire Club (Londyn/Sunbury-on-Thames, Wielka Brytania)' },
      { p: 'Najstarszy swingers club w Londynie — tematyczne playroomy i duża przestrzeń dungeon. Gartside House, Harris Way, Sunbury-on-Thames TW16 7EL.' },
      { h: '#6 – SwingerGaarden (Slagelse, Dania)' },
      { p: 'Największy klub lifestyle zachodniej Zelandii, na wsi, z dużym naciskiem na wygodę gości. Kindertofte skolevej 2, 4200 Slagelse.' },
      { h: '#7 – Encuentros VIP (Madryt, Hiszpania)' },
      { p: 'Jeden z bardziej znanych klubów swingerskich stolicy Hiszpanii. C. Vicente Caballero 14, Retiro, 28007 Madryt.' },
      { h: '#8 – Bad Romance Swingers Club Privè (Rzym, Włochy)' },
      { p: 'Klub prywatny w Rzymie, regularnie polecany w lokalnych przewodnikach lifestyle. Via Beniamino Franklin 3/A, 00153 Rzym.' },
      { h: '#9 – Swingers Club Nirvana (Praga, Czechy)' },
      { p: 'Jeden z działających klubów praskich, w dzielnicy Vršovice. Vršovické nám. 1012/4, 102 00 Praga 10.' },
      { h: '#10 – Le Duquesnoy (Bruksela, Belgia)' },
      { p: 'Klub w centrum Brukseli, blisko głównego dworca. 12 Rue Duquesnoy, Bruksela.' },
    ],
  },
  {
    id: 'mapa-polski-bialych-plam',
    emoji: '🇵🇱',
    tag: 'Polska',
    tagColor: '#E63946',
    title: 'Mapa Polski, na której nie ma białych plam. Prawie',
    lead: 'Nie objechałyśmy żadnego z jedenastu klubów. Usiadłyśmy nad arkuszem i policzyłyśmy, co o nich mówią inni — gwiazdki, opinie i to, co ludzie napisali w ostatnim kwartale.',
    city: 'Polska',
    readTime: '7 min',
    content: [
      { p: 'Zacznijmy od wyznania, bo inaczej ten tekst byłby ściemą. Nie byłyśmy tam. Żadna z nas nie przekroczyła w tym kwartale progu jedenastu klubów, o których zaraz przeczytacie. Nie ma tu wrażeń z parkietu, zapachu z szatni ani pani z recepcji widzianej na własne oczy. Jest arkusz kalkulacyjny, jedenaście kolumn i redakcyjne liczydło, które przemieliło wszystko, co ludzie napisali publicznie w Google. To nie jest reportaż. To jest rachunek.' },
      { p: 'Jest taka teoria, że w klubie liczą się ludzie, nie ściany. Że atmosferę robi towarzystwo, a nie jacuzzi. Piękna teoria. Powtarzają ją wszyscy właściciele, zwłaszcza ci, którzy oszczędzili na wentylacji. Otóż nie do końca.' },
      { p: 'Bo ktoś w końcu zrobił to, czego nie robi się w tej branży — policzył. Wziął jedenaście polskich klubów, ich oceny w Google, liczbę opinii, świeżość tych opinii i to, co ludzie naprawdę napisali w ostatnich trzech miesiącach. Nie legendę sprzed dekady. To, co było w czerwcu. Wyszła liczba od 0 do 100. I wyszła prawda, która czasem gryzie. Zaczynamy od góry.' },
      { h: 'Podium — czyli gdzie liczby wypadły najlepiej' },
      { p: 'Elysium, Warszawa — 87,4 pkt (4,9★, 19 opinii). Najmłodszy i najbardziej rozpieszczony przez recenzentów klub. "Czysto tak, że można jeść z podłogi" — pisze ktoś w czerwcu. Nota 4,9 to prawie podejrzane, więc uczciwie: dziewiętnaście opinii to nie jest tłum, to sala kameralna. Ta sama recenzentka dodaje: "co prawda jeszcze trochę mało gości". Piękne, świeże, puste-ale-pełne-obietnicy.' },
      { p: 'PurPur, Łódź — 84,4 pkt (4,7★, 128 opinii). PurPur to nie klub — to kino dla dorosłych, inny gatunek. Nota wysoka, opinii sto dwadzieścia osiem, obsługa chwalona. Ale w grudniu ktoś zauważył coś, czego w tej branży nie wybacza się: "naliczać podwójną opłatę za wiek powyżej 26 roku życia u panów. Wiek weryfikować za pomocą dokumentu". Dokumentem. W miejscu, którego całą walutą jest anonimowość.' },
      { p: 'Gravitacja, Wodzisław Śląski — 71,5 pkt (4,6★, 88 opinii). Klub, o którym pół Polski nie słyszało, z sentymentem świeższych opinii na poziomie 4,83 — najwyższym realnym w stawce. "Wspaniała atmosfera, przemili właściciele" — lipiec. Dark room, dwa glory hole, jacuzzi, sauna fińska, pokój w stylu Greya. Cały katalog fantazji w mieście, które kojarzy się z kopalnią.' },
      { h: 'Środek stawki — legendy i ich kłopoty' },
      { p: 'Jacuzzi Club, Chwaszczyno — 66,7 pkt (4,6★, 26 opinii). Święty Graal polskiego swingu. Na forach od lat to samo nabożne westchnienie: "bezkonkurencyjny", "najlepszy klub w jakim byłem". A w Google? Dwadzieścia sześć opinii. Bo do Jacuzzi nie wchodzi się z ulicy — wchodzi się z zaproszeniem, po egzaminie z regulaminu. Klub tak ekskluzywny, że sam siebie ukrywa przed statystyką.' },
      { p: 'Origami, Wrocław — 65,7 pkt (4,6★, 94 opinie). I tu kalkulator zaczyna kłamać. Nota 4,6 wygląda ślicznie, dopóki nie przeczytasz lutego: "totalnie pusto... smród zgnilizny i wilgoci, okropny brud, szkło i niezmienione prześcieradła". I czerwca: "obsługa nieprzyjemna, zapach stęchlizny, nigdy więcej". Sześćset metrów kwadratowych azjatyckiego luksusu — na papierze. Gwiazdki są stare. Zapach jest nowy.' },
      { p: 'Prive, Lubliniec — 52,6 pkt (4,5★, 126 opinii). Duma polskiego swingu, na forach stawiana obok najlepszych klubów Europy. "Najbardziej rozbudowany, największe możliwości" — piszą weterani z rozmarzeniem. A w najnowszej opinii, z 24 lipca: "uważajcie tam na siebie naprawdę!!! reszty nie możemy napisać, od razu blokowane". Sentyment świeżych opinii — 3,38, najniższy z całego podium reputacji.' },
      { h: 'Dół tabeli — czyli gdzie robi się smutno' },
      { p: 'Ray Club, Poznań — 47,5 pkt (4,4★, 64 opinie). Klub z potencjałem i z grzechem, który boli najbardziej — nierówne traktowanie. Para na imprezie "urodziny Kobiety": "od razu było widać, iż stali bywalcy zostali wpuszczeni" mimo dress code\'u. Zaraz obok singiel, debiut w urodziny: "dwie najlepsze imprezy". Ray to loteria.' },
      { p: 'Lava, Warszawa — 34,7 pkt (4,2★, 18 opinii). Tu wzorzec jest zbyt spójny, by ironizować: "wyrzuciła nas z klubu tylko dlatego, że mówimy w innym języku", "pani w okularach... nie miła i opryskliwa od wejścia", "obskurna buda śmierdząca szambem". Trzy różne osoby, trzy różne wieczory, jedna diagnoza.' },
      { p: 'Bordeaux (Łódź, 26,9 pkt) i Red Fox (Czeladź, 23,0 pkt) — dwa kluby, które zamierają na naszych oczach. Po dwie świeże opinie na kwartał. "Impreza miała trwać 5 godzin, po 2 przyszły 3 osoby". "Przyjeżdżamy 24:30, nie wpuszczają, mówią że zamknięte". To nie recenzje. To nekrolog pisany ratami.' },
      { h: 'Na koniec' },
      { p: 'Gwiazdka to przeszłość, a sentyment to teraźniejszość. Najlepsze kluby chowają się przed statystyką, a najgorsze mają świetne noty sprzed remontu. Możesz mieć sześćset metrów i glory hole w dwóch wersjach, a i tak wszystko rozbije się o to, czy pani z recepcji ma dobry dzień. Ludzie robią klimat. To akurat prawda. Szkoda tylko, że czasem tymi ludźmi jest obsługa.' },
      { p: 'Metodologia: oceny i opinie z Google Maps (zebrane 27.07.2026), okno świeżości 90 dni. Wynik = ocena ważona liczbą opinii (50%) + tempo świeżych opinii (30%) + sentyment treści z ostatnich 90 dni (20%). Żadnej z opisanych wizyt nie odbyła redakcja — wszystkie cytaty pochodzą z publicznych opinii.' },
    ],
  },
  {
    id: 'berlin-guide',
    emoji: '🇩🇪',
    tag: 'Europa',
    tagColor: '#d4af37',
    title: 'Berlin: Stolica Swingingu Europy',
    lead: 'Ponad 20 klubów, darkroomy, fetysz i wolność – dlaczego Berlin przyciąga co roku tysiące swingersów z całego świata.',
    city: 'Berlin',
    readTime: '4 min',
    content: [
      { h: 'Dlaczego Berlin?' },
      { p: 'Liberalne prawo, otwarta kultura i ogromna społeczność – Berlin od lat 90. jest europejskim centrum sceny lifestyle i fetyszu. Tylko tutaj znajdziesz tak gęstą koncentrację miejsc na km².' },
      { h: 'KitKatClub – legenda w akcji' },
      { p: 'Sobotnia impreza Carneball Bizarre to jedno z najsłynniejszych wydarzeń fetyszowych na świecie. Dress code absolutnie egzekwowany, darkroom na 3 poziomach, pełna swoboda.' },
      { h: 'Lab.oratory (Berghain)' },
      { p: 'Piwnica Berghainu to Lab.oratory – otwarty w weekendy dla miłośników fetyszu i hard play. Jedno z najbardziej selekcjonowanych miejsc na Ziemi.' },
      { h: 'Reszta sceny: FM, SchwuZ, Insomnia' },
      { p: 'Fetisch Melanege (FM) to comiesięczne imprezy tematyczne. SchwuZ – queerowa przestrzeń z playrooms. Insomnia – prywatne imprezy dla par, bardzo eleganckie.' },
      { h: 'Jak się przygotować?' },
      { p: 'Berlińskie kluby są surowe w kwestii dress code. Skóra, lateks, mundury, nagie ciało – tak. Jeansy i podkoszulek – nie. Sprawdź zasady każdego miejsca przed wyjazdem.' },
    ],
  },
]

// ─── ARTICLE READER ────────────────────────────────────────────────────────────
function ArticleReader({ article, onBack }) {
  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={onBack}
          className="text-[22px]"
          style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 0 }}
        >←</button>
        <h1 className="text-body-md">Artykuł</h1>
      </div>
      <div style={{ padding: '0 0 80px' }}>
        {/* Header */}
        <div style={{
          background: 'linear-gradient(135deg, rgba(212,175,55,0.28), rgba(233,193,118,0.10))',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          padding: '28px 20px 24px',
          marginBottom: 0,
        }}>
          <div className="text-[40px]" style={{ marginBottom: 12 }}>{article.emoji}</div>
          <div className="text-label-caps uppercase" style={{
            display: 'inline-block',
            color: article.tagColor, background: `${article.tagColor}22`,
            border: `1px solid ${article.tagColor}44`,
            borderRadius: 20, padding: '3px 10px', marginBottom: 12,
          }}>{article.tag} · {article.readTime} czytania</div>
          <h2 className="font-display italic font-semibold text-headline-md text-on-surface" style={{ lineHeight: 1.2, marginBottom: 12 }}>{article.title}</h2>
          <p className="text-body-md" style={{ color: 'var(--text-dim)', lineHeight: 1.6 }}>{article.lead}</p>
        </div>
        {/* Body */}
        <div className="max-w-2xl" style={{ padding: '24px 20px' }}>
          {article.content.map((block, i) =>
            block.h ? (
              <h3 key={i} className="font-display italic font-medium text-headline-sm text-on-surface" style={{ marginTop: i === 0 ? 0 : 28, marginBottom: 10 }}>
                {block.h}
              </h3>
            ) : (
              <p key={i} className="font-body text-body-md" style={{ color: 'var(--text-dim)', lineHeight: 1.75, marginBottom: 16 }}>
                {block.p}
              </p>
            )
          )}
        </div>
      </div>
    </div>
  )
}

// ─── VENUE DETAIL ──────────────────────────────────────────────────────────────
function VenueDetail({ venue, onBack }) {
  const t = getTypeConfig(venue.type)
  return (
    <div>
      <div className="page-header" style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <button
          onClick={onBack}
          className="text-[22px]"
          style={{ background: 'none', border: 'none', color: 'var(--text-dim)', cursor: 'pointer', padding: 0 }}
        >←</button>
        <h1 className="text-body-md">Szczegóły</h1>
      </div>
      <div className="max-w-3xl mx-auto" style={{ padding: '0 0 80px' }}>
        <div style={{ padding: '20px 16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, marginBottom: 12 }}>
            <div style={{ width: 72, height: 72, flexShrink: 0, background: venue.logo_url ? '#000' : t.bg, display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
              {venue.logo_url
                ? <img src={venue.logo_url} alt={venue.name} style={{ width: '100%', height: '100%', objectFit: 'contain', padding: 8, boxSizing: 'border-box' }} />
                : <span className="text-[34px]">{t.icon}</span>}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <h2 className="font-display italic font-semibold text-headline-md text-on-surface">{venue.name}</h2>
              {venue.distance != null && (
                <span className="venue-card-distance">{formatDistance(venue.distance)}</span>
              )}
            </div>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 16, flexWrap: 'wrap' }}>
            <span className="venue-type-badge" style={{ background: t.bg, color: t.color }}>
              {t.icon} {t.label}
            </span>
            <span className="text-body-md" style={{ color: 'var(--text-dim)' }}>📍 {venue.city}</span>
          </div>
          {venue.description && (
            <p className="text-body-md" style={{ color: '#fff', lineHeight: 1.7, marginBottom: 20 }}>
              {venue.description}
            </p>
          )}
          {venue.events && venue.events.length > 0 && (
            <div className="glass-card" style={{ padding: 16, marginBottom: 12 }}>
              <div className="font-display italic font-medium text-headline-sm text-on-surface" style={{ marginBottom: 12 }}>Najbliższe dni</div>
              {(() => {
                const DNI = ['niedziela', 'poniedziałek', 'wtorek', 'środa', 'czwartek', 'piątek', 'sobota']
                const MIES = ['sty', 'lut', 'mar', 'kwi', 'maj', 'cze', 'lip', 'sie', 'wrz', 'paź', 'lis', 'gru']
                const today = new Date()
                return [0, 1, 2, 3, 4, 5, 6].map(off => {
                  const d = new Date(today); d.setDate(d.getDate() + off)
                  const dow = d.getDay()
                  const dymd = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
                  const special = (venue.oneTime || []).find(e => (e.event_date || '').slice(0, 10) === dymd)
                  const evs = venue.events.filter(e => e.day_of_week === dow)
                  const label = off === 0 ? 'Dziś' : off === 1 ? 'Jutro'
                    : `${DNI[dow][0].toUpperCase()}${DNI[dow].slice(1)} ${d.getDate()} ${MIES[d.getMonth()]}`
                  const isToday = off === 0
                  return (
                    <div key={off} style={{ marginBottom: 12, paddingLeft: isToday ? 10 : 0, borderLeft: isToday ? '3px solid #d4af37' : 'none' }}>
                      <div className="text-body-md font-extrabold" style={{ color: isToday ? '#d4af37' : 'var(--text)', marginBottom: 4 }}>
                        {label}{off > 1 ? '' : ` · ${DNI[dow]} ${d.getDate()} ${MIES[d.getMonth()]}`}
                      </div>
                      {special ? (
                        <div className="text-body-md" style={{ color: '#fff', lineHeight: 1.55 }}>
                          <strong style={{ color: '#FFC824' }}>⭐ {special.event_name}</strong>
                          {(special.start_time || special.end_time) && <> · {special.start_time}{special.end_time ? `–${special.end_time}` : ''}</>}
                          {special.price && <><br /><span className="text-body-md font-semibold">{special.price}</span></>}
                        </div>
                      ) : evs.length === 0 ? (
                        <div className="text-body-md" style={{ color: 'var(--text-dim)', opacity: .6 }}>Zamknięte</div>
                      ) : evs.map(e => (
                        <div key={e.id} className="text-body-md" style={{ color: '#fff', lineHeight: 1.55, marginBottom: 3 }}>
                          <strong style={{ color: 'var(--text)' }}>{e.event_name}</strong>
                          {e.audience && <span className="text-label-caps uppercase" style={{ marginLeft: 6, color: '#d4af37', background: 'rgba(233,193,118,.12)', padding: '1px 6px', borderRadius: 6 }}>{e.audience}</span>}
                          {(e.start_time || e.end_time) && <> · {e.start_time}{e.end_time ? `–${e.end_time}` : ''}</>}
                          {e.price && <><br /><span className="text-body-md font-semibold">{e.price}</span></>}
                        </div>
                      ))}
                    </div>
                  )
                })
              })()}
            </div>
          )}
          {(!venue.events || venue.events.length === 0) && (
            <div className="glass-card" style={{ padding: 16, marginBottom: 12 }}>
              <div className="text-body-md" style={{ color: 'var(--text-dim)', lineHeight: 1.6 }}>
                📅 Klub eventowy — terminy i ceny zmieniają się. Sprawdź aktualne imprezy {venue.website ? 'na stronie poniżej.' : 'u źródła.'}
              </div>
            </div>
          )}
          <div className="glass-card" style={{ padding: 16, marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 10, marginBottom: venue.website ? 10 : 0 }}>
              <span className="text-[16px]">📍</span>
              <span className="text-body-md" style={{ color: '#fff' }}>{venue.address}</span>
            </div>
            {venue.website && (
              <div style={{ display: 'flex', gap: 10 }}>
                <span className="text-[16px]">🌐</span>
                <a href={venue.website} target="_blank" rel="noopener noreferrer" className="text-body-md" style={{ color: '#d4af37', wordBreak: 'break-all' }}>{venue.website}</a>
              </div>
            )}
          </div>
          {venue.website && (
            <a href={venue.website} target="_blank" rel="noopener noreferrer" style={{ textDecoration: 'none', marginTop: 16, display: 'block' }}>
              <button className="btn-primary" style={{ width: '100%' }}>🌐 Przejdź do strony</button>
            </a>
          )}
        </div>
      </div>
    </div>
  )
}

// ─── ARTICLE CARD ─────────────────────────────────────────────────────────────
function ArticleCard({ article, hero, onClick }) {
  if (hero) {
    return (
      <div onClick={onClick} className="group cursor-pointer border border-outline-variant/20 p-6 hover:border-primary-container/40 transition-colors h-full">
        <div className="flex items-center gap-3 mb-4">
          <span className="font-body text-label-caps uppercase text-primary-container">{article.tag}</span>
          <span className="font-body text-label-caps uppercase text-outline">{article.readTime} czytania</span>
        </div>
        <div className="font-display italic font-semibold text-headline-md text-on-surface leading-tight mb-3 group-hover:text-primary-container transition-colors">
          {article.title}
        </div>
        <p className="font-body text-body-md text-on-surface-variant leading-relaxed">{article.lead}</p>
        <div className="mt-6 font-body text-label-caps uppercase text-primary-container">Czytaj dalej →</div>
      </div>
    )
  }
  return (
    <div onClick={onClick} className="group cursor-pointer border border-outline-variant/20 p-5 hover:border-primary-container/40 transition-colors">
      <div className="font-body text-label-caps uppercase text-primary-container mb-2">{article.tag}</div>
      <div className="font-display italic font-medium text-body-lg text-on-surface leading-tight mb-2 group-hover:text-primary-container transition-colors">
        {article.title}
      </div>
      <p className="font-body text-body-md text-on-surface-variant leading-relaxed">{article.lead.slice(0, 80)}…</p>
    </div>
  )
}

// ─── City helpers ─────────────────────────────────────────────────────────────
const PL_CITY_SET = ['Warszawa', 'Kraków', 'Wrocław', 'Gdańsk', 'Poznań', 'Łódź', 'Katowice', 'Sopot', 'Szczecin', 'Lublin', 'Czeladź', 'Lubliniec']

// On ExtraFun a venue counts as a swing venue only on its swing_days (when set).
// swing_days null/[] = no restriction (swing every day). Mirrors the server's
// allow() in /api/places so a mostly-gay venue (e.g. Sauna Heaven — swing only on
// Tuesdays) is not shown as an open swing club the rest of the week.
function swingDayOk(v, dow) {
  const sd = v.swing_days
  return !sd || sd.length === 0 || sd.includes(dow)
}

// The chosen day's status line (special / weekly events / event-club / closed).
// Shared by the grid card (VenueRow) and the compact hub row (VenueRowCompact).
function VenueStatus({ venue }) {
  if (venue.type === 'plaża') return <span className="font-body text-body-md text-on-surface-variant">Plaża naturystyczna / FKK</span>
  if (venue._special) return (
    <span className="font-body text-body-md text-on-surface">
      <span className="text-primary-container font-semibold">★ {venue._special.event_name}</span>
      {(venue._special.start_time || venue._special.end_time) && <> · {venue._special.start_time}{venue._special.end_time ? `–${venue._special.end_time}` : ''}</>}
      {venue._special.price && <> · {venue._special.price}</>}
    </span>
  )
  if (venue._eventClub) return <span className="font-body text-body-md text-primary-container">Otwarte — sprawdź imprezę na stronie</span>
  if (venue._dayEvents && venue._dayEvents.length > 0) return (
    <span className="block space-y-1">
      {venue._dayEvents.map(e => (
        <span key={e.id} className="block font-body text-body-md text-on-surface">
          <span className="font-semibold">{e.event_name}</span>
          {(e.start_time || e.end_time) && <> · {e.start_time}{e.end_time ? `–${e.end_time}` : ''}</>}
          {e.price && <> · {e.price}</>}
        </span>
      ))}
    </span>
  )
  return <span className="font-body text-body-md text-on-surface-variant/60">Dziś nieczynne</span>
}

// Compact horizontal row — used in the hub club column (narrow). Logo thumb in
// a gold frame + name + status. Big 4/3 cards (VenueRow) are for the city grids.
function VenueRowCompact({ venue, onClick }) {
  const t = getTypeConfig(venue.type)
  const ref = useImpression('venue', venue.id)
  return (
    <article ref={ref} onClick={() => { trackClick('venue', venue.id); onClick() }} className="group relative flex gap-5 py-5 border-b border-outline-variant/15 cursor-pointer">
      <CardStatBadge kind="venue" id={venue.id} className="absolute top-1 right-0 z-10" />
      <div className="w-20 h-20 flex-shrink-0 border border-primary-container/20 bg-surface-container-low flex items-center justify-center overflow-hidden transition-colors group-hover:border-primary-container/50">
        {venue.logo_url
          ? <img src={venue.logo_url} alt={venue.name} className="max-w-[78%] max-h-[78%] object-contain" />
          : <span className="text-2xl opacity-30">{t.icon}</span>}
      </div>
      <div className="flex-1 min-w-0">
        <div className="flex items-baseline justify-between gap-3">
          <h4 className="font-display italic font-medium text-headline-sm text-on-surface group-hover:text-primary-container transition-colors truncate">{venue.name}</h4>
          {venue.distance != null && <span className="font-body text-label-caps uppercase text-outline flex-shrink-0">{formatDistance(venue.distance)}</span>}
        </div>
        <div className="font-body text-label-caps uppercase text-primary-container/70 mt-1">{t.label} · {venue.city}</div>
        <div className="mt-2"><VenueStatus venue={venue} /></div>
      </div>
    </article>
  )
}

// Image-tile card (4/3, logo-forward) — used in the city grids.
function VenueRow({ venue, onClick }) {
  const t = getTypeConfig(venue.type)
  const ref = useImpression('venue', venue.id)
  return (
    <article ref={ref} onClick={() => { trackClick('venue', venue.id); onClick() }} className="group relative flex flex-col gap-5 cursor-pointer">
      <CardStatBadge kind="venue" id={venue.id} className="absolute top-3 left-3 z-10" />
      {/* Logo-forward tile — colour logo, framed centre, gold hairline. Shorter
          than a photo card (4/3) because the asset is a wordmark, not a photo. */}
      <div className="relative aspect-[4/3] overflow-hidden border border-primary-container/20 bg-surface-container-low flex items-center justify-center transition-colors duration-500 group-hover:border-primary-container/50">
        <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 90% at 50% 0%, rgba(212,175,55,0.08), transparent 70%)' }} />
        {venue.logo_url ? (
          <img
            src={venue.logo_url}
            alt={venue.name}
            className="relative max-w-[62%] max-h-[58%] object-contain grayscale opacity-90 transition-all duration-700 group-hover:grayscale-0 group-hover:opacity-100 group-hover:scale-105"
          />
        ) : (
          <span className="relative text-5xl opacity-25">{t.icon}</span>
        )}
        {venue.distance != null && (
          <span className="absolute top-3 right-3 font-body text-label-caps uppercase text-primary-container bg-surface/70 backdrop-blur-sm px-2 py-1">
            {formatDistance(venue.distance)}
          </span>
        )}
      </div>
      {/* Info — left gold rule, district label, Bodoni name, arrow */}
      <div className="flex flex-col gap-3 border-l border-primary-container/25 pl-5">
        <div className="flex justify-between items-start gap-3">
          <div className="min-w-0">
            <span className="font-body text-label-caps uppercase text-primary-container/70 block mb-1">{t.label} · {venue.city}</span>
            <h4 className="font-display italic font-medium text-headline-sm text-on-surface group-hover:text-primary-container transition-colors leading-tight">{venue.name}</h4>
          </div>
          <span className="text-primary-container/40 group-hover:text-primary-container transition-colors text-xl leading-none flex-shrink-0" aria-hidden="true">↗</span>
        </div>
        <VenueStatus venue={venue} />
        <span className="font-body text-label-caps uppercase text-primary-container border-b border-primary-container/20 pb-1 w-fit group-hover:tracking-widest transition-all mt-1">Zobacz lokal</span>
      </div>
    </article>
  )
}

// ─── MAIN COMPONENT ───────────────────────────────────────────────────────────
export function Przewodnik({ city: cityParam }) {
  const [, navigate] = useLocation()
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeCity, setActiveCity] = useState('all') // show all cities by default (GPS narrows to distance)
  const [activeType, setActiveType] = useState('all')
  const [dayOffset, setDayOffset] = useState(0)   // 0=dziś, 1=jutro, 2=pojutrze
  const [scene, setScene] = useState('all')        // 'all' | 'swing' | 'lgbt' — show everything by default
  const [radiusKm, setRadiusKm] = useState(Infinity) // GPS scope; Infinity = all, sorted by distance
  const [selectedVenue, setSelectedVenue] = useState(null)
  const [selectedArticle, setSelectedArticle] = useState(null)
  const [hubScope, setHubScope] = useState(null)   // hub club column: 'nearby' | city name
  const { location, error: geoError, loading: geoLoading, requestLocation } = useGeolocation()
  const geoApplied = useRef(false)
  // List scroll position captured when opening an article, restored on Back so the
  // user lands back on the card they clicked. `.page-content` scrolls on desktop,
  // the window on mobile — restore both.
  const listScroll = useRef(null)
  const setScroll = (pc, win) => {
    document.querySelector('.page-content')?.scrollTo(0, pc)
    window.scrollTo(0, win)
  }

  useEffect(() => {
    loadVenues()
    requestLocation()
  }, [])

  // When GPS first arrives, switch to radius mode (all cities, ≤ radiusKm).
  useEffect(() => {
    if (location && !geoApplied.current) { geoApplied.current = true; setActiveCity('all') }
  }, [location])

  // Open a venue/article = a history entry, so the hardware/gesture Back closes
  // the detail and returns to the list instead of leaving the page.
  useEffect(() => {
    if (selectedVenue == null && selectedArticle == null) return
    setScroll(0, 0) // detail opens via pushState (not a route change), so scroll to top manually
    window.history.pushState({ efDetail: true }, '')
    const onPop = () => { setSelectedVenue(null); setSelectedArticle(null) }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
  }, [selectedVenue, selectedArticle])

  // Returning from an article detail: restore the list scroll after re-mount, so
  // Back returns to the clicked card instead of the top of the list.
  useEffect(() => {
    if (selectedArticle != null || listScroll.current == null) return
    const { pc, win } = listScroll.current
    listScroll.current = null
    requestAnimationFrame(() => setScroll(pc, win))
  }, [selectedArticle])

  async function loadVenues() {
    try {
      const data = await apiFetch('/api/places')
      if (data && data.length > 0) {
        // normalize to lat/lng for distance calc; drop gay beaches from the swing guide (they live on /plaze)
        setVenues(data.filter(v => v.type !== 'plaża').map(v => ({ ...v, lat: v.latitude, lng: v.longitude })))
      }
    } catch {
      // silent fail
    } finally {
      setLoading(false)
    }
  }

  // Distance sorting
  const venuesWithDist = location
    ? venues.map(v => ({
        ...v,
        distance: v.lat && v.lng
          ? calculateDistance(location.lat, location.lng, parseFloat(v.lat), parseFloat(v.lng))
          : null,
      })).sort((a, b) => {
        if (a.distance === null) return 1
        if (b.distance === null) return -1
        return a.distance - b.distance
      })
    : venues

  // Unique cities
  const cities = ['all', ...Array.from(new Set(venues.map(v => v.city))).sort()]

  // Polish cities first
  const PL_CITIES = ['Warszawa', 'Kraków', 'Wrocław', 'Gdańsk', 'Poznań', 'Łódź']
  const sortedCities = ['all', ...cities.filter(c => c !== 'all').sort((a, b) => {
    const apl = PL_CITIES.includes(a)
    const bpl = PL_CITIES.includes(b)
    if (apl && !bpl) return -1
    if (!apl && bpl) return 1
    return a.localeCompare(b, 'pl')
  })]

  // Client-centric: show what's ON the chosen day, near me.
  const _targetDate = new Date(); _targetDate.setDate(_targetDate.getDate() + dayOffset)
  const targetDow = _targetDate.getDay()
  const ymd = d => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
  const targetYmd = ymd(_targetDate)
  const sceneOk = v => scene === 'all' || v.scene === scene || v.scene === 'mixed'
  const filtered = venuesWithDist
    // Scope: a chosen city → that city; otherwise, with GPS → within radiusKm.
    .filter(v => {
      if (activeCity !== 'all') return v.city === activeCity
      if (location && radiusKm !== Infinity) return v.distance != null && v.distance <= radiusKm
      return true
    })
    .filter(v => activeType === 'all' || v.type === activeType)
    .filter(sceneOk)
    .map(v => {
      const evs = v.events || []
      // A dated special on that exact date overrides the weekly schedule.
      const special = (v.oneTime || []).find(e => (e.event_date || '').slice(0, 10) === targetYmd)
      return { ...v, _special: special, _dayEvents: evs.filter(e => e.day_of_week === targetDow), _eventClub: evs.length === 0 && swingDayOk(v, targetDow) }
    })
    // Open that day: special OR weekly event OR event-club (no fixed schedule).
    .filter(v => v._special || v._dayEvents.length > 0 || v._eventClub)

  const types = ['all', ...Array.from(new Set(venues.map(v => v.type))).sort()]

  // Attach the chosen day's status to a venue (special / weekly / event-club).
  const statusOf = (v) => {
    const evs = v.events || []
    const special = (v.oneTime || []).find(e => (e.event_date || '').slice(0, 10) === targetYmd)
    return { ...v, _special: special, _dayEvents: evs.filter(e => e.day_of_week === targetDow), _eventClub: evs.length === 0 && swingDayOk(v, targetDow) }
  }
  const isOpenToday = (v) => v._special || (v._dayEvents && v._dayEvents.length > 0) || v._eventClub

  // City hub data
  const cityCounts = {}
  venues.forEach(v => { cityCounts[v.city] = (cityCounts[v.city] || 0) + 1 })
  const plCount = venues.filter(v => PL_CITY_SET.includes(v.city)).length
  const foreignCities = Object.keys(cityCounts)
    .filter(c => !PL_CITY_SET.includes(c))
    .sort((a, b) => cityCounts[b] - cityCounts[a])

  // "Blisko Ciebie" — open today, within range, nearest first (only with GPS)
  const nearby = location
    ? venuesWithDist.map(statusOf).filter(sceneOk).filter(isOpenToday)
        .filter(v => radiusKm === Infinity || (v.distance != null && v.distance <= radiusKm))
        .slice(0, 8)
    : []

  // ─── Hub club column: city chooser + venues for chosen scope ───
  // Cities sorted by venue count, Polish first. Used by the chooser buttons.
  const chooserCities = [
    ...Object.keys(cityCounts).filter(c => PL_CITY_SET.includes(c)).sort((a, b) => cityCounts[b] - cityCounts[a]),
    ...foreignCities,
  ]
  // Default: GPS nearby if available, else the busiest city.
  const effectiveScope = hubScope || (location ? 'nearby' : chooserCities[0])
  const hubVenues = effectiveScope === 'nearby'
    ? nearby
    : venuesWithDist
        .filter(v => v.city === effectiveScope)
        .map(statusOf).filter(sceneOk).filter(isOpenToday)
        .sort((a, b) => (location && a.distance != null && b.distance != null)
          ? a.distance - b.distance
          : String(a.name).localeCompare(String(b.name), 'pl'))

  // City page resolution
  const isPolska = cityParam === 'polska'
  const cityName = isPolska ? 'Polska' : (Object.keys(cityCounts).find(c => slugify(c) === cityParam) || cityParam)
  const cityVenues = venuesWithDist
    .filter(v => isPolska ? PL_CITY_SET.includes(v.city) : v.city === cityName)
    .map(statusOf)
    .filter(sceneOk)
    .filter(v => activeType === 'all' || v.type === activeType)
    .sort((a, b) => {
      if (location && a.distance != null && b.distance != null) return a.distance - b.distance
      return String(a.name).localeCompare(String(b.name), 'pl')
    })

  // Views
  if (selectedArticle) {
    return <ArticleReader article={selectedArticle} onBack={() => window.history.back()} />
  }
  // Venue deep-link: /miejsca/{id}-slug → own page (shareable, indexable, AI-citable)
  if (cityParam && /^\d+(-|$)/.test(cityParam)) {
    const vid = parseInt(cityParam, 10)
    const v = venuesWithDist.find(x => x.id === vid)
    if (v) return <VenueDetail venue={v} onBack={() => navigate('/miejsca')} />
    if (loading) return <div className="empty-state"><div className="spinner" style={{ margin: '0 auto' }} /></div>
    // unknown id → fall through to hub
  }
  if (selectedVenue) {
    const v = venuesWithDist.find(v => v.id === selectedVenue)
    if (v) return <VenueDetail venue={v} onBack={() => window.history.back()} />
  }

  return (
    <div className="bg-background min-h-screen text-on-surface">
      <Helmet>
        <title>Przewodnik po klubach lifestyle – swing, BDSM, fetysz | ExtraFun</title>
        <meta name="description" content="Mapa i lista klubów lifestyle, swing i BDSM w Polsce. Znajdź miejsce blisko siebie — filtruj po mieście, typie i dniu tygodnia." />
        <link rel="canonical" href="https://www.extrafun.pl/miejsca" />
      </Helmet>
      {cityParam ? (
        /* ════════ CITY PAGE ════════ */
        <main className="max-w-container-max mx-auto px-6 md:px-16 pt-12 pb-24">
        <PageWithRail>
          <button onClick={() => navigate('/miejsca')} className="font-body text-label-caps uppercase text-primary-container mb-6 inline-block hover:opacity-80">← Przewodnik</button>
          <h1 className="font-display italic font-semibold text-display-lg-mobile md:text-display-lg text-on-surface mb-2 leading-none">
            {isPolska ? 'Polska' : cityName}
          </h1>
          <p className="font-body text-body-md text-on-surface-variant mb-10">
            {loading ? 'Ładowanie…' : `${cityVenues.length} ${cityVenues.length === 1 ? 'lokal' : 'lokali'} · ${dayOffset === 0 ? 'dziś' : dayOffset === 1 ? 'jutro' : 'pojutrze'}`}
          </p>

          <div className="flex gap-3 mb-8">
            {[['Dziś', 0], ['Jutro', 1], ['Pojutrze', 2]].map(([label, off]) => (
              <button key={off} onClick={() => setDayOffset(off)}
                className={`font-body text-label-caps uppercase pb-1 border-b-2 transition-colors ${dayOffset === off ? 'border-primary-container text-primary-container' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>
                {label}
              </button>
            ))}
          </div>

          {loading ? (
            <div className="py-24 text-center font-body text-body-md text-on-surface-variant">Ładowanie…</div>
          ) : cityVenues.length === 0 ? (
            <div className="py-24 text-center font-display italic text-headline-sm text-on-surface">Brak lokali</div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-x-12 gap-y-16">
              {cityVenues.map(v => <VenueRow key={v.id} venue={v} onClick={() => navigate('/miejsca/' + venueSlug(v))} />)}
            </div>
          )}
        </PageWithRail>
      </main>
      ) : (
        /* ════════ HUB ════════ */
        <>
          {/* Mobile: full-screen tiles (scope+day hero, then venues open that day) */}
          <MiejscaMobileFeed
            venues={hubVenues}
            scope={effectiveScope}
            cities={chooserCities}
            onScope={setHubScope}
            dayOffset={dayOffset}
            onDay={setDayOffset}
            hasLocation={!!location}
            geoLoading={geoLoading}
            geoError={geoError}
            onRequestLocation={requestLocation}
            loading={loading}
            renderStatus={(v) => <VenueStatus venue={v} />}
            typeCfgOf={getTypeConfig}
            onOpenVenue={(v) => navigate('/miejsca/' + venueSlug(v))}
          />

          <div className="hidden lg:block">
          <Hero
            image="/editorial/hero-przewodnik.jpg"
            label="PRZEWODNIK"
            title="Scena lifestyle — blisko Ciebie"
            lead="Kluby, sauny i miejsca dla par i singli. Filtruj po mieście, typie i dniu."
          />
          </div>
          <main className="hidden lg:block max-w-container-max mx-auto px-6 md:px-16 pb-24">
            <div className="grid grid-cols-1 md:grid-cols-12 gap-x-10 gap-y-16">

              {/* LEFT — club column: city chooser + day tabs + list (narrow) */}
              <div className="md:col-span-7">
                {/* City chooser — compact dropdown (Blisko Mnie + every guide city) */}
                <div className="flex items-center gap-3 mb-6">
                  <span className="font-body text-label-caps uppercase text-on-surface-variant">Pokaż</span>
                  <div className="relative">
                    <select
                      value={effectiveScope || ''}
                      onChange={(e) => { const v = e.target.value; if (v === 'nearby' && !location) requestLocation(); setHubScope(v) }}
                      style={{ colorScheme: 'dark' }}
                      className="appearance-none bg-transparent border-b border-primary-container/40 focus:border-primary-container outline-none font-display italic text-headline-sm text-on-surface pr-8 py-1 cursor-pointer">
                      <option value="nearby">Blisko Mnie</option>
                      {chooserCities.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                    <span className="pointer-events-none absolute right-1 top-1/2 -translate-y-1/2 text-primary-container">▾</span>
                  </div>
                </div>

                {/* Day tabs */}
                <div className="flex gap-4 mb-8">
                  {[['Dziś', 0], ['Jutro', 1], ['Pojutrze', 2]].map(([label, off]) => (
                    <button key={off} onClick={() => setDayOffset(off)}
                      className={`font-body text-label-caps uppercase pb-1 border-b-2 transition-colors ${dayOffset === off ? 'border-primary-container text-primary-container' : 'border-transparent text-on-surface-variant hover:text-on-surface'}`}>
                      {label}
                    </button>
                  ))}
                </div>

                {/* Club list (or GPS prompt when "Blisko Mnie" chosen without location) */}
                {effectiveScope === 'nearby' && !location ? (
                  <div className="flex items-center gap-4 flex-wrap p-4 border border-outline-variant/30">
                    <span className="flex-1 min-w-[150px] font-body text-body-md text-on-surface-variant">
                      {geoLoading ? 'Szukam lokalizacji…' : geoError ? geoError : 'Pozwól na lokalizację — pokażę najbliższe otwarte.'}
                    </span>
                    {!geoLoading && <Button onClick={requestLocation}>{geoError ? 'Ponów' : 'Włącz GPS'}</Button>}
                  </div>
                ) : loading ? (
                  <div className="py-24 text-center font-body text-body-md text-on-surface-variant">Ładowanie…</div>
                ) : hubVenues.length === 0 ? (
                  <div className="py-16 font-display italic text-headline-sm text-on-surface-variant">Dziś nic otwartego — zmień dzień lub miasto.</div>
                ) : (
                  <>
                    {/* Mobile: big logo-forward cards */}
                    <div className="flex flex-col gap-12 md:hidden">
                      {hubVenues.map(v => <VenueRow key={v.id} venue={v} onClick={() => navigate('/miejsca/' + venueSlug(v))} />)}
                    </div>
                    {/* Desktop: compact rows (narrow column) */}
                    <div className="hidden md:flex md:flex-col">
                      {hubVenues.map(v => <VenueRowCompact key={v.id} venue={v} onClick={() => navigate('/miejsca/' + venueSlug(v))} />)}
                    </div>
                  </>
                )}
              </div>

              {/* RIGHT — editorial: ranking on top, then city guides, then Plaże */}
              <aside className="md:col-span-5 flex flex-col gap-8">
                <ArticleCard article={ARTICLES[0]} hero onClick={() => { listScroll.current = { pc: document.querySelector('.page-content')?.scrollTop || 0, win: window.scrollY || 0 }; setSelectedArticle(ARTICLES[0]) }} />
                {ARTICLES.slice(1).map(a => <ArticleCard key={a.id} article={a} onClick={() => { listScroll.current = { pc: document.querySelector('.page-content')?.scrollTop || 0, win: window.scrollY || 0 }; setSelectedArticle(a) }} />)}

                <div onClick={() => navigate('/plaze')}
                  className="group flex items-center gap-4 p-6 border border-outline-variant/20 cursor-pointer hover:border-primary-container/40 transition-colors">
                  <span className="text-3xl">🏖️</span>
                  <div className="min-w-0">
                    <div className="font-display italic font-medium text-headline-sm text-on-surface group-hover:text-primary-container transition-colors">Plaże</div>
                    <div className="font-body text-body-md text-on-surface-variant mt-1">Naturystyczne i FKK w Polsce i Europie</div>
                  </div>
                  <span className="ml-auto text-primary-container text-xl">→</span>
                </div>
                <div className="hidden lg:block"><SiteRail /></div>
              </aside>

            </div>
          </main>
        </>
      )}
    </div>
  )
}
