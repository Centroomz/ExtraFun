// Quiz miesiąca — Lipiec 2026: "Jakim typem plażowicza jesteś?"
// Silnik typowy (4 persony). Każda odpowiedź punktuje jeden typ wg indeksu.

export const QUIZ_TITLE = 'Jakim typem plażowicza jesteś?'
export const QUIZ_INTRO = 'Sezon na plaże bez tabu. 12 pytań, 4 typy — sprawdź, kim jesteś na piasku.'

export const QUIZ_QUESTIONS = [
  {
    question: 'Pierwsze, co robisz na kocu?',
    options: [
      'Zrzucam wszystko — nago czuję się najlepiej',
      'Rozglądam się, na razie zostaję w stroju',
      'Szukam sympatycznych sąsiadów do pogawędki',
      'Otwieram coś zimnego i kładę się',
    ],
  },
  {
    question: 'Naturyzm to dla Ciebie...',
    options: [
      'Styl życia — wolność i słońce na całym ciele',
      'Ciekawość, której dopiero próbuję',
      'Okazja, żeby poznać otwartych ludzi',
      'Po prostu wygodniejsze opalanie',
    ],
  },
  {
    question: 'Sąsiedzi z koca zagadują. Ty?',
    options: [
      'Z luzem — nagość zdejmuje bariery',
      'Trochę spięty, ale odpowiadam grzecznie',
      'Świetnie! Po chwili wymieniacie numery',
      'Krótko — wolę swój relaks',
    ],
  },
  {
    question: 'Twój plażowy must-have?',
    options: [
      'Olejek i zero opasek od kostiumu',
      'Ręcznik, którym mogę się szybko zakryć',
      'Coś do poczęstowania nowych znajomych',
      'Wino, koc i playlista',
    ],
  },
  {
    question: 'Para obok proponuje wspólne piwo. Reakcja?',
    options: [
      'Czemu nie — plaża łączy',
      'Ostrożnie się zgadzam, zobaczymy',
      'Super, uwielbiam nowe znajomości',
      'Dzięki, ale dziś chcę poleniuchować',
    ],
  },
  {
    question: 'Idealna plaża bez tabu to...',
    options: [
      'W pełni naturystyczna, bez spojrzeń z ukosa',
      'Spokojna, gdzie wchodzę we własnym tempie',
      'Towarzyska, z otwartą, ciekawą ekipą',
      'Cicha zatoczka tylko do relaksu',
    ],
  },
  {
    question: 'Co Cię najbardziej kręci w takim miejscu?',
    options: [
      'Poczucie wolności i akceptacji ciała',
      'Że mogę przekraczać granice po swojemu',
      'Ludzie i energia otwartości',
      'Święty spokój i brak pośpiechu',
    ],
  },
  {
    question: 'Ktoś robi grupowe zdjęcie. Ty?',
    options: [
      'Wchodzę w kadr bez kompleksów',
      'Wolę z boku, jeszcze nie teraz',
      'Organizuję wszystkich do wspólnej fotki',
      'Macham ręką i wracam do leżenia',
    ],
  },
  {
    question: 'Wieczór na plaży się rozkręca. Zostajesz?',
    options: [
      'Tak, nago przy ognisku jest najlepiej',
      'Chwilę — sprawdzam, jak się czuję',
      'Oczywiście, tu robi się najciekawiej',
      'Zostaję, ale z boku, z winem',
    ],
  },
  {
    question: 'Granice na plaży bez tabu są dla Ciebie...',
    options: [
      'Naturalne — szanuję cudze, mam luz do swoich',
      'Bardzo ważne — pilnuję ich uważnie',
      'Tematem do otwartej rozmowy z innymi',
      'Proste: nie przeszkadzać i nie być przeszkadzanym',
    ],
  },
  {
    question: 'Co zabierasz z takiego dnia?',
    options: [
      'Naładowaną pewność siebie',
      'Małe zwycięstwo — przesunąłem swoją granicę',
      'Garść nowych kontaktów',
      'Czysty, głęboki relaks',
    ],
  },
  {
    question: 'Plaża bez tabu w jednym słowie?',
    options: [
      'Wolność',
      'Odkrywanie',
      'Ludzie',
      'Spokój',
    ],
  },
]

export const TYPE_MAP = ['slonce', 'odkrywca', 'serca', 'hedonista']

export const RESULTS = {
  slonce: {
    title: 'Dziecko Słońca',
    emoji: '☀️',
    color: '#d4af37',
    description:
      'Nagość to dla Ciebie wolność, nie odwaga. Na plaży bez tabu czujesz się jak w domu — bez opasek, bez spięć, bez tłumaczenia się komukolwiek.',
    advice:
      'Twoja swoboda jest zaraźliwa. Pamiętaj tylko, że nie każdy obok jest na tym samym etapie — Twój luz potrafi być dla kogoś pierwszą lekcją akceptacji.',
  },
  odkrywca: {
    title: 'Ostrożny Odkrywca',
    emoji: '👀',
    color: '#7fb3d5',
    description:
      'Jesteś tu, ale po swojemu. Ciekawość prowadzi Cię dalej niż strach, choć wchodzisz w to ostrożnie, krok po kroku.',
    advice:
      'Idziesz dobrym tempem — granice przesuwa się powoli i świadomie. Nie porównuj się z innymi; Twoja droga jest tak samo ważna jak ich.',
  },
  serca: {
    title: 'Otwarte Serca',
    emoji: '💞',
    color: '#e0729a',
    description:
      'Przychodzisz dla ludzi. Plaża bez tabu to dla Ciebie przestrzeń spotkań — rozmów, znajomości, otwartości w obie strony.',
    advice:
      'Twoja otwartość buduje wspólnotę. Pamiętaj o złotej zasadzie tego świata: zawsze pytaj, zanim założysz, że druga osoba chce tego samego.',
  },
  hedonista: {
    title: 'Leniwy Hedonista',
    emoji: '🍷',
    color: '#b08d57',
    description:
      'Nie szukasz wrażeń ani towarzystwa — szukasz spokoju. Koc, wino, słońce i zero zobowiązań. Relaks w czystej postaci.',
    advice:
      'Twój spokój to luksus. Czasem jednak warto unieść wzrok znad koca — najlepsze chwile w tym miejscu bywają nieplanowane.',
  },
}

// scores: array długości 4 (wg TYPE_MAP). Zwraca obiekt wyniku.
export function interpretQuizResult(scores) {
  const winnerIdx = scores.indexOf(Math.max(...scores))
  return RESULTS[TYPE_MAP[winnerIdx]]
}
