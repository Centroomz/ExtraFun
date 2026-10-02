// Quiz miesiąca — Październik 2026: "Jaki jesteś w miłości, zazdrości i swingu?"
// Silnik typowy (4 persony). Każda odpowiedź punktuje jeden typ wg indeksu.

export const QUIZ_TITLE = 'Jaki jesteś w miłości, zazdrości i swingu?'
export const QUIZ_INTRO = 'Temat miesiąca: miłość, zazdrość, swing. 12 pytań, 4 typy — sprawdź, jak reagujesz, gdy umowa na wyłączność przestaje być oczywistością.'

export const QUIZ_QUESTIONS = [
  {
    question: 'Partner wraca z imprezy i mówi, że świetnie bawił/a się z kimś atrakcyjnym. Reakcja?',
    options: [
      'Ściska mi żołądek, chcę wiedzieć wszystko natychmiast',
      'Pytam spokojnie, ale chcę ustalić zasady na przyszłość',
      'Czuję ukłucie, ale staram się cieszyć, że mu/jej dobrze',
      'Fajnie, chcę usłyszeć całą historię',
    ],
  },
  {
    question: 'Słowo "zazdrość" kojarzy ci się z...',
    options: [
      'Dowodem, że komuś naprawdę zależy',
      'Sygnałem, że trzeba usiąść i pogadać o granicach',
      'Czymś, nad czym pracuję, żeby mną nie rządziło',
      'Uczuciem, które rzadko mnie odwiedza',
    ],
  },
  {
    question: 'Co myślisz o "kompersji" (radości z radości partnera z kimś innym)?',
    options: [
      'Brzmi jak wymówka, żeby się nie angażować',
      'Ciekawa idea, ale wymaga ćwiczeń',
      'Ćwiczę to i czasem naprawdę czuję',
      'To dokładnie to, co czuję na co dzień',
    ],
  },
  {
    question: 'Partner proponuje wspólne wyjście na imprezę dla par. Ty?',
    options: [
      'Zdecydowane nie, to nie dla nas',
      'Najpierw długa rozmowa o zasadach i granicach',
      'Idę, trochę spięty/a, ale chcę spróbować',
      'Już mam to w kalendarzu, nie mogę się doczekać',
    ],
  },
  {
    question: 'Ile zasad potrzebujesz w relacji, żeby czuć się bezpiecznie?',
    options: [
      'Jedną, najważniejszą: wyłączność',
      'Sporo, spisanych i wspólnie przedyskutowanych',
      'Kilka podstawowych, reszta dogrywa się w trakcie',
      'Minimum — zaufanie ważniejsze niż lista',
    ],
  },
  {
    question: 'Widzisz zdjęcie partnera przytulonego z kimś na imprezie. Pierwsza myśl?',
    options: [
      'Dlaczego mi o tym nie powiedział/a?',
      'Muszę zapytać, co to było i jak się umówili',
      'Oddycham i przypominam sobie, że ufam',
      'Fajnie mu/jej z kimś — super',
    ],
  },
  {
    question: 'Twoja definicja wierności to...',
    options: [
      'Ciało i uwaga wyłącznie dla mnie',
      'To, co razem ustaliliśmy — słowem lub na piśmie',
      'Szczerość i trzymanie się umów, nawet gdy trudno',
      'Uczciwość, nie geografia ciała',
    ],
  },
  {
    question: 'Co robisz, gdy czujesz zazdrość?',
    options: [
      'Mówię partnerowi, że ma to natychmiast przerwać',
      'Nazywam uczucie i proszę o rozmowę, zanim coś się wydarzy',
      'Siedzę z tym uczuciem i analizuję, skąd się bierze',
      'Rzadko się zdarza, a jak już — śmieję się z siebie',
    ],
  },
  {
    question: 'Impreza dla par w klubie. Co cię tam ciągnie?',
    options: [
      'Nic, wolę spokojny wieczór we dwoje',
      'Ciekawość — chcę poznać zasady z bezpiecznej odległości',
      'Chęć przełamania swoich granic, mały krok na raz',
      'Energia, ludzie, możliwości — uwielbiam takie miejsca',
    ],
  },
  {
    question: 'Gdyby partner zakochał się (nie tylko fizycznie) w kimś innym...',
    options: [
      'To byłby koniec naszego związku',
      'Musielibyśmy usiąść i renegocjować całą relację',
      'Bolałoby, ale wierzę, że da się to przepracować razem',
      'Miłość nie jest zasobem ograniczonym — damy radę',
    ],
  },
  {
    question: 'Najważniejsza rozmowa przed jakimkolwiek eksperymentem to...',
    options: [
      'Nie ma takiej — eksperymentów nie planuję',
      'Długa, szczegółowa, z listą granic i słowem bezpieczeństwa',
      'Krótka, ale szczera — reszta wyjdzie w praniu',
      'Właściwie już ją mamy za sobą, działamy z marszu',
    ],
  },
  {
    question: 'Miłość, zazdrość i swing w jednym zdaniu to dla ciebie...',
    options: [
      'Miłość i swing się wykluczają',
      'Da się to pogodzić, ale tylko na podstawie umowy',
      'Droga, której uczę się krok po kroku',
      'Trzy słowa opisujące moje życie',
    ],
  },
]

export const TYPE_MAP = ['straznik', 'negocjator', 'uczen', 'wolny']

export const RESULTS = {
  straznik: {
    title: 'Strażnik Wyłączności',
    emoji: '🔒',
    color: '#a83244',
    description:
      'Dla ciebie miłość i wyłączność to jedno. Zazdrość nie jest problemem do rozwiązania — jest dowodem, że związek się liczy. Swing i otwartość leżą daleko poza twoją mapą.',
    advice:
      'Nie musisz się z tego tłumaczyć — monogamia to pełnoprawny wybór, nie etap przejściowy. Warto jednak nazywać zazdrość wprost, zamiast czekać, aż sama zniknie.',
  },
  negocjator: {
    title: 'Ostrożny Negocjator',
    emoji: '🗝️',
    color: '#7fb3d5',
    description:
      'Temat cię ciekawi, ale nie ruszasz się bez ustaleń. Zasady, granice, rozmowy przed faktem — to twój sposób na to, żeby ciekawość nie zamieniła się w chaos.',
    advice:
      'Twoja ostrożność chroni związek, nie hamuje go. Pilnuj tylko, żeby zasady nie zastąpiły samej rozmowy o uczuciach — dokument nie zdejmie zazdrości, jeśli nikt jej nie nazwie.',
  },
  uczen: {
    title: 'Uczeń Kompersji',
    emoji: '💞',
    color: '#e0729a',
    description:
      'Jesteś w drodze. Zazdrość wciąż się pojawia, ale zamiast z nią walczyć — próbujesz ją zrozumieć i, coraz częściej, zamienić w radość z cudzego szczęścia.',
    advice:
      'To najtrudniejsza droga i dlatego liczy się najbardziej. Nie oczekuj, że kompersja pojawi się od razu za każdym razem — bądź dla siebie tak cierpliwy/a, jak dla partnera.',
  },
  wolny: {
    title: 'Wolny Duch Pary',
    emoji: '🌊',
    color: '#d4af37',
    description:
      'Swing i otwartość to dla ciebie naturalny język relacji. Zazdrość rzadko się odzywa, a jak już, traktujesz ją jako ciekawą informację, nie alarm.',
    advice:
      'Twój luz jest cenny, ale nie każdy partner startuje z tego samego miejsca. Sprawdzaj czasem, czy druga strona naprawdę nadąża, zanim uznasz temat za zamknięty.',
  },
}

// scores: array długości 4 (wg TYPE_MAP). Zwraca obiekt wyniku.
export function interpretQuizResult(scores) {
  const winnerIdx = scores.indexOf(Math.max(...scores))
  return RESULTS[TYPE_MAP[winnerIdx]]
}

// Consolidated shape for quiz-month.js's MONTH_QUIZZES registry.
export const QUIZ = {
  slug: 'swing',
  title: QUIZ_TITLE,
  intro: QUIZ_INTRO,
  questions: QUIZ_QUESTIONS,
  interpretResult: interpretQuizResult,
}

// Consolidated shape for quiz-month.js's MONTH_QUIZZES registry.
export const QUIZ = {
  slug: 'swing',
  title: QUIZ_TITLE,
  intro: QUIZ_INTRO,
  questions: QUIZ_QUESTIONS,
  interpretResult: interpretQuizResult,
}
