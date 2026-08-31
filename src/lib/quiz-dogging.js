// Quiz miesiąca — Wrzesień 2026: "Jaki typ doggera w tobie drzemie?"
// 12 pytań, 4 typy. Każda odpowiedź punktuje jeden typ wg indeksu.

export const QUIZ_TITLE = 'Jaki typ doggera w tobie drzemie?'
export const QUIZ_INTRO = 'Dogging to nie jeden styl — to cztery różne temperamenty. 12 pytań pokaże, który z nich masz we krwi.'

export const QUIZ_QUESTIONS = [
  {
    question: 'Piątkowy wieczór, ciepło, partner/ka mówi: „pojedziemy?". Twoja pierwsza myśl?',
    options: [
      'Nareszcie — sprawdzę, jak to wygląda naprawdę',
      'Zaraz, muszę sprawdzić pogodę i znaleźć miejsce',
      'Ciekawe, kto tam dziś będzie',
      'Pora na nasz show',
    ],
  },
  {
    question: 'Parkujesz na leśnym parkingu. Co robisz najpierw?',
    options: [
      'Siedzę w aucie i obserwuję — chcę zrozumieć zasady',
      'Sprawdzam oświetlenie, widoczność, kierunek wiatru',
      'Rozglądam się za innymi autami — ktoś miga światłami?',
      'Opuszczam szybę — niech wiedzą, że jesteśmy',
    ],
  },
  {
    question: 'Inna para zaparkowała obok i zerka w waszą stronę. Twoja reakcja?',
    options: [
      'Przyśpieszony puls — to naprawdę się dzieje',
      'Notuję w głowie: profil, auto, sygnały',
      'Kiwam głową na powitanie — może dojdzie do rozmowy',
      'Świetnie — widownia',
    ],
  },
  {
    question: 'Co cię najbardziej pociąga w doggingu?',
    options: [
      'Przekroczenie własnej granicy — zrobienie czegoś, czego nigdy bym się nie spodziewał',
      'Precyzja operacji — wszystko zaplanowane, nic przypadkowe',
      'Energia między obcymi ludźmi, którzy grają w tę samą grę',
      'Podniecenie z bycia obserwowanym',
    ],
  },
  {
    question: 'Partner/ka jest spięty/a. Jak reagujesz?',
    options: [
      'Ja też — ale to chyba część uroku',
      'Mam plan B: jedziemy do drugiego miejsca, spokojniejszego',
      'Rozmawiam — słowa rozładowują napięcie',
      'Całuję go/ją — niech poczuje, że to o nas, nie o nich',
    ],
  },
  {
    question: 'Ktoś podchodzi za blisko. Co robisz?',
    options: [
      'Zamykam szybę — nie na to się pisałem/am',
      'Spokojne „stop" i gest ręką — mam to przećwiczone',
      'Rozmowa: „hej, za blisko, cofnij się"',
      'Zależy — jeśli to część gry, OK. Jeśli nie, jasny sygnał',
    ],
  },
  {
    question: 'Twój idealny dogging to...',
    options: [
      'Jeden raz — żeby wiedzieć, jak to jest',
      'Zaplanowany weekend z listą lokalizacji i backupami',
      'Spotkanie z inną parą, która gra fair',
      'Regularne wyjścia — każde lepsze od poprzedniego',
    ],
  },
  {
    question: 'Co zabierasz ze sobą?',
    options: [
      'Odwagę — i chyba nic więcej nie potrzebuję',
      'Latarkę, koc, prezerwatywy, mokre chusteczki i zapasowy koc',
      'Numer telefonu do pary, którą poznaliśmy online',
      'Nic zbędnego — wolne ręce i dobry nastrój',
    ],
  },
  {
    question: 'Co czujesz, jadąc do domu po wszystkim?',
    options: [
      'Niedowierzanie — naprawdę to zrobiliśmy',
      'Satysfakcję — plan zadziałał',
      'Chęć powtórzenia — i następnym razem z tamtą parą',
      'Euforię — dawno się tak nie czułem/am',
    ],
  },
  {
    question: 'Znajomy pyta „co robiliście w piątek?". Odpowiadasz:',
    options: [
      '„Przejażdżka za miasto" — i zmieniam temat',
      '„Nic specjalnego" — z doskonale obojętną miną',
      '„Coś nowego" — z uśmiechem, który daje do myślenia',
      '„O, to byłby materiał na książkę" — i opowiadasz',
    ],
  },
  {
    question: 'Co myślisz o tych, którzy patrzą?',
    options: [
      'To dziwne uczucie, ale ciekawi mnie ich perspektywa',
      'Muszą trzymać dystans — to warunek konieczny',
      'Są częścią układu — dopóki grają według reguł',
      'Potrzebuję ich — bez widowni to nie to samo',
    ],
  },
  {
    question: 'Dogging w jednym słowie?',
    options: [
      'Przygoda',
      'Logistyka',
      'Spotkanie',
      'Spektakl',
    ],
  },
]

export const TYPE_MAP = ['odkrywca', 'organizator', 'voyeur', 'showman']

export const RESULTS = {
  odkrywca: {
    title: 'Odkrywca',
    emoji: '🔦',
    color: '#7fb3d5',
    description:
      'Ciekawość prowadzi cię dalej niż strach. Dogging to dla ciebie ekspedycja w nieznane — chcesz zobaczyć, poczuć, zrozumieć. Nie wiesz jeszcze, czy to twoje na stałe, ale wiesz, że musiałeś/aś spróbować.',
    advice:
      'Twoja otwartość jest wartością. Idź we własnym tempie — nie musisz niczego udowadniać. Pierwszy raz nie musi być ostatnim, ale nie musi być też początkiem — może być po prostu doświadczeniem.',
  },
  organizator: {
    title: 'Organizator',
    emoji: '📋',
    color: '#d4af37',
    description:
      'Bez planu nie ruszasz. Lokalizacja, pogoda, sygnały, plan B — wszystko masz w głowie, zanim silnik ruszy. Dla ciebie dogging to operacja, nie spontan. I właśnie dlatego czujesz się bezpiecznie.',
    advice:
      'Twoja precyzja chroni ciebie i twoją partnerkę/partnera. Pamiętaj tylko, że nie wszystko da się zaplanować — i że część uroku leży właśnie w tym, czego nie przewidzisz.',
  },
  voyeur: {
    title: 'Obserwator',
    emoji: '👁️',
    color: '#9D4EDD',
    description:
      'Czerpiesz z atmosfery, nie z kontaktu. Patrzysz, szanujesz granice, trzymasz dystans. Podniecenie bierze się z bliskości sceny — nie z bycia na niej. Dla ciebie dogging to teatr, w którym widownia jest częścią sztuki.',
    advice:
      'Twój szacunek do przestrzeni innych to fundament tego świata. Pamiętaj, że obserwowanie bez zaproszenia to inna rozmowa — zawsze czekaj na sygnał.',
  },
  showman: {
    title: 'Showman',
    emoji: '🔥',
    color: '#FF7F50',
    description:
      'Lubisz wiedzieć, że ktoś patrzy. Partner/ka jest twoim współproducentem spektaklu, a adrenalina z otwartości jest tym, co cię napędza. Dla ciebie dogging to scena — i na niej czujesz się najlepiej.',
    advice:
      'Twoja odwaga jest zaraźliwa — ale pamiętaj, że show działa tylko za wzajemną zgodą. Spektakl, w którym widownia nie ma wyjścia, nie jest spektaklem. Dbaj o granice tak samo, jak o efekt.',
  },
}

export function interpretQuizResult(scores) {
  const winnerIdx = scores.indexOf(Math.max(...scores))
  return RESULTS[TYPE_MAP[winnerIdx]]
}
