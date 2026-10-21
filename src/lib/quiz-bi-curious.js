// Quiz miesiąca — Listopad 2026: "Jaka ciekawość w tobie siedzi?"
// Silnik typowy (4 typy). Każda odpowiedź punktuje jeden typ wg indeksu.
// To zabawa o stylu ciekawości, nie test orientacji i nie diagnoza.

export const QUIZ_TITLE = 'Jaka ciekawość w tobie siedzi?'
export const QUIZ_INTRO = 'Temat miesiąca: Bi Curious. 12 pytań, 4 style ciekawości. To zabawa, nie test orientacji: sprawdź, jak obchodzisz się z pytaniami, na które nie musisz mieć jeszcze odpowiedzi.'

export const QUIZ_QUESTIONS = [
  {
    question: 'Ktoś atrakcyjny, tej samej płci co ty, mówi ci komplement. Pierwsza myśl?',
    options: [
      'Miło. Zapamiętuję to i wracam do tego później w myślach',
      'Ciekawe, co to we mnie uruchamia. Muszę się tym zainteresować',
      'Uśmiecham się i zobaczę, co z tego wyniknie',
      'Przyjmuję komplement i nie szukam w nim znaczenia',
    ],
  },
  {
    question: 'Fantazje o osobie tej samej płci co ty to dla ciebie...',
    options: [
      'Prywatny teren, wolę, żeby tak zostało',
      'Temat do zrozumienia: skąd się biorą i co znaczą',
      'Coś, o czym kiedyś chcę powiedzieć głośno',
      'Zwykła część wyobraźni, bez komentarza',
    ],
  },
  {
    question: 'Trafiasz na artykuł o biseksualności. Co robisz?',
    options: [
      'Czytam po cichu i zamykam kartę',
      'Czytam do końca i szukam kolejnych źródeł',
      'Wysyłam link komuś zaufanemu',
      'Czytam jak każdy inny tekst o ludziach',
    ],
  },
  {
    question: 'Partner/ka mówi: „jestem ciekaw/a tej strony siebie". Reakcja?',
    options: [
      'Zaskoczenie. Potrzebuję czasu, żeby to oswoić',
      'Dopytuję, czego szuka i czego się boi',
      'Proponuję rozmowę o zasadach, które nam pasują',
      'Spokojnie. Ciekawość to nie zagrożenie',
    ],
  },
  {
    question: 'Nazwa „bi curious" brzmi dla ciebie...',
    options: [
      'Za głośno jak na to, co czuję',
      'Jak etykieta, którą warto sprawdzić',
      'Jak wygodne słowo na początek',
      'Niepotrzebnie. Wolę żyć bez etykiet',
    ],
  },
  {
    question: 'Z kim rozmawiasz o swojej ciekawości?',
    options: [
      'Z nikim, to zostaje u mnie',
      'Z jedną zaufaną osobą',
      'Z partnerem/partnerką',
      'Otwarcie, jeśli ktoś zapyta',
    ],
  },
  {
    question: 'Impreza, na której nikt cię nie zna. Jaką rolę wybierasz?',
    options: [
      'Obserwuję z boku',
      'Rozmawiam i zbieram informacje',
      'Wchodzę w rozmowy i patrzę, dokąd to prowadzi',
      'Jestem sobą i niczego nie udaję',
    ],
  },
  {
    question: 'Pierwszy krok, który mógłbyś/mogłabyś zrobić, to...',
    options: [
      'Zapisać swoje myśli w notatniku',
      'Poczytać i posłuchać historii innych ludzi',
      'Porozmawiać o tym z partnerem/partnerką',
      'Powiedzieć wprost, kim jestem i czego jeszcze nie wiem',
    ],
  },
  {
    question: 'Czego boisz się najbardziej?',
    options: [
      'Że ktoś się dowie, zanim sam/a to zrozumiem',
      'Że źle odczytam własne uczucia',
      'Że kogoś zranię, jeśli pójdę za ciekawością',
      'Niczego szczególnego, najbardziej cudzych szufladek',
    ],
  },
  {
    question: 'Granice w ciekawości to dla ciebie...',
    options: [
      'Zamknięte drzwi, które chcę uchylać powoli',
      'Lista, którą trzeba spisać i przedyskutować',
      'Umowa, która pozwala próbować bezpiecznie',
      'Coś, co ustawiam w trakcie, słuchając siebie',
    ],
  },
  {
    question: 'Ktoś mówi: „to tylko faza". Co robisz?',
    options: [
      'Zastanawiam się, czy może ma rację',
      'Szukam danych, które to potwierdzą albo obalą',
      'Odpowiadam: może, ale sprawdzam to uczciwie',
      'Nie muszę tego komentować',
    ],
  },
  {
    question: 'Ciekawość jest dla ciebie...',
    options: [
      'Cichym pytaniem w głowie',
      'Projektem badawczym',
      'Zaproszeniem do próby',
      'Częścią mnie, która nie potrzebuje opisu',
    ],
  },
]

export const TYPE_MAP = ['obserwator', 'badacz', 'smialek', 'bez_etykiety']

export const RESULTS = {
  obserwator: {
    title: 'Cichy Obserwator',
    emoji: '🌙',
    color: '#7a8fb5',
    description:
      'Twoja ciekawość mieszka w głowie i na razie tam jej dobrze. Zauważasz, zapamiętujesz, wracasz do tego myślami, ale nie spieszysz się z odpowiedzią ani z deklaracją.',
    advice:
      'Nie musisz niczego robić, żeby ciekawość była prawdziwa. Warto tylko mieć jedną zaufaną osobę albo jeden dobry tekst, który pozwoli ci powiedzieć to na głos, gdy będziesz gotowy/a. Bez terminu.',
  },
  badacz: {
    title: 'Badacz',
    emoji: '🔍',
    color: '#7fb3d5',
    description:
      'Lubisz rozumieć, zanim ruszysz. Czytasz, dopytujesz, porównujesz historie. Ciekawość zamieniasz w pytania i szukasz na nie odpowiedzi.',
    advice:
      'Wiedza pomaga, ale nie zastąpi doświadczenia ani rozmowy z ludźmi. Pilnuj, żeby szukanie odpowiedzi nie stało się sposobem na odkładanie pytania o to, czego chcesz ty.',
  },
  smialek: {
    title: 'Śmiałek',
    emoji: '🧭',
    color: '#e0729a',
    description:
      'Ciekawość chcesz sprawdzić w praktyce, najlepiej w rozmowie z kimś bliskim i na jasnych zasadach. Wolisz spróbować i zobaczyć, niż w nieskończoność analizować.',
    advice:
      'Odwaga to dobry początek, ale tempo muszą akceptować wszyscy, których to dotyczy. Zanim zrobisz krok, upewnij się, że granice są spisane w głowie obu stron, a nie tylko twojej.',
  },
  bez_etykiety: {
    title: 'Człowiek Bez Etykiety',
    emoji: '🌊',
    color: '#d4af37',
    description:
      'Twoja ciekawość nie potrzebuje nazwy. Przyjmujesz ją jak każdą inną część siebie i nie czujesz presji, żeby się z niej tłumaczyć ani jej definiować.',
    advice:
      'Brak etykiety to pełnoprawny wybór. Pamiętaj tylko, że partnerzy i partnerki mogą potrzebować słów, żeby cię zrozumieć. Czasem jedno zdanie wyjaśnienia oszczędza długą rozmowę.',
  },
}

// scores: array długości 4 (wg TYPE_MAP). Zwraca obiekt wyniku.
export function interpretQuizResult(scores) {
  const winnerIdx = scores.indexOf(Math.max(...scores))
  return RESULTS[TYPE_MAP[winnerIdx]]
}

// Consolidated shape for quiz-month.js's MONTH_QUIZZES registry.
export const QUIZ = {
  slug: 'bi-curious',
  title: QUIZ_TITLE,
  intro: QUIZ_INTRO,
  questions: QUIZ_QUESTIONS,
  interpretResult: interpretQuizResult,
}
