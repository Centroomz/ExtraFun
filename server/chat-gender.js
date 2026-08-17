// ── Bramka czatu: „damski nick" + treść-tabu ─────────────────────────────────
// PORT 1:1 z bizarriusz/server/routes/chat-gender.ts. ExtraFun /czat to TEN SAM
// stream co bizarriusz.pl/czat (source='bizarriusz'), więc musi stosować te same
// reguły poczekalni. Trzymaj zsynchronizowane z wersją biz (słownik!).
//
// Model: post gościa chowany DOMYŚLNIE (held=true), przechodzi tylko gdy autor
// jest na whiteliście (biz_chat_whitelist) LUB nick „damski" (panie / pary
// JanMonika / CD-trans). Panowie → poczekalnia aż recepcja wpuści (na biz).
// BRAK reguły „-a" (Kuba, Barnaba) — wymagamy słownika lub markera.

export function normalizePl(s) {
  return s
    .toLowerCase()
    .normalize("NFD").replace(/[̀-ͯ]/g, "") // ogonki (combining marks)
    .replace(/ł/g, "l")
    .replace(/[^a-z0-9 ]+/g, " ")                      // znaki → spacja (_ też)
    .replace(/\s+/g, " ")
    .trim();
}

// ── Treść-tabu (twarde, niezależne od whitelisty) ────────────────────────────
const TABOO_WORD_EXACT = new Set([
  "kupa", "kupy", "kupe", "kupke", "kupka", "kupki",
  "stolec", "stolca", "stolcem", "stolce", "stolcu",
]);
const TABOO_WORD_STEMS = ["koprofag", "kaprofag"];
const TABOO_SUBSTRINGS = [
  "oplacona pani", "oplacona para", "oplacone panie", "oplacona kobieta",
];

export function isTabooContent(content) {
  const n = normalizePl(content);
  if (!n) return false;
  if (TABOO_SUBSTRINGS.some(s => n.includes(s))) return true;
  const tokens = n.split(" ");
  return tokens.some(t =>
    TABOO_WORD_EXACT.has(t) || TABOO_WORD_STEMS.some(s => t.startsWith(s))
  );
}

// ── Damski nick ──────────────────────────────────────────────────────────────
const TRANS_TOKENS = new Set(["cd", "ts", "tv"]);
const TRANS_SUBSTR = ["trans", "crossdress", "cdka", "transka", "travesti", "shemale"];

const FEMALE_NAMES = new Set([
  "anna", "ania", "anka", "aneczka", "hania", "hanna", "hanka",
  "maria", "marysia", "marysienka", "mania",
  "katarzyna", "kasia", "kaska", "kasieńka",
  "malgorzata", "gosia", "goska", "megi",
  "agnieszka", "aga", "agnes",
  "barbara", "basia", "baska",
  "ewa", "ewelina", "ewka", "ewusia",
  "krystyna", "krysia", "kryska",
  "elzbieta", "ela", "elzunia", "elka",
  "zofia", "zosia", "zocha",
  "teresa", "tereska", "terenia",
  "janina", "janka",
  "joanna", "asia", "joasia", "aska",
  "magdalena", "magda", "madzia", "magdusia",
  "monika", "monia",
  "danuta", "danka", "danusia",
  "halina", "halinka",
  "irena", "irenka", "irka",
  "jadwiga", "jadzia",
  "beata", "beatka",
  "aleksandra", "ola", "olka", "oleńka", "olcia",
  "marta", "martusia", "martynka", "martyna",
  "dorota", "dorotka", "dosia",
  "marianna",
  "grazyna", "grazynka",
  "jolanta", "jola", "jolka",
  "kazimiera",
  "stanislawa", "stasia",
  "urszula", "ula", "ulka", "ulcia",
  "wanda", "wandzia",
  "weronika", "wera", "weronka",
  "zdzislawa",
  "agata", "agatka",
  "alicja", "ala", "alicija",
  "sylwia", "sylwka", "sylwusia",
  "renata", "renatka",
  "iwona", "iwonka",
  "edyta", "edytka",
  "justyna", "justynka",
  "klaudia", "klaudka",
  "natalia", "natalka", "nati",
  "paulina", "paula", "paulinka",
  "patrycja", "patka", "pati",
  "sandra", "sandrra",
  "karolina", "karolinka", "karola", "karolcia",
  "kinga", "kinia",
  "dominika", "domi", "dominia",
  "izabela", "iza", "izabella", "izunia",
  "wiktoria", "wika", "wiki",
  "julia", "julka", "julcia", "julita",
  "zuzanna", "zuzia", "zuza",
  "oliwia", "oliwka",
  "maja", "majka",
  "lena", "lenka",
  "amelia", "amelka",
  "nadia", "nadzia",
  "nikola", "nikoletta", "niki",
  "roksana", "roksanka",
  "angelika", "angela", "andzia",
  "adrianna", "ada", "adrianka",
  "gabriela", "gabi", "gabrysia",
  "michalina", "michasia",
  "antonina", "antosia", "tosia",
  "helena", "hela", "helenka",
  "cecylia", "cesia",
  "lucja", "lucyna", "lucynka",
  "mirella",
  "miroslawa", "mira", "mirka",
  "boguslawa", "bogusia",
  "czeslawa", "czesia",
  "felicja",
  "franciszka", "franka",
  "kornelia", "kornelka",
  "liliana", "lila", "lilka",
  "lidia", "lidka",
  "malwina",
  "marlena", "marlenka",
  "melania",
  "olga", "olgunia",
  "otylia",
  "rozalia", "roza", "rozka",
  "sabina", "sabinka",
  "salomea",
  "stefania", "stefcia",
  "walentyna", "wala",
  "wioletta", "wiola", "wiolka",
  "zaneta", "zanetka",
  "blanka",
  "laura", "laurka",
  "liwia",
  "milena", "milenka",
  "nela", "nelka",
  "pola",
  "rita",
  "sonia", "sonja",
  "tola",
  "kamila", "kama", "kamilka",
  "emilia", "emilka", "emi",
  "cornelia",
  "lucia",
  "wioleta",
  // Uzupełnienia z preseedu (realne damskie nicki z historii, których brakowało).
  "aneta", "sofia", "lola", "krycha", "emila", "nika", "rebecca",
]);

function splitSegments(raw) {
  return raw
    .replace(/([a-ząćęłńóśźż])([A-ZĄĆĘŁŃÓŚŹŻ])/g, "$1 $2")
    .split(/[\s_\-.]+/)
    .filter(Boolean);
}

export function isFemaleNick(username) {
  if (!username) return false;
  const norm = normalizePl(username);
  if (!norm) return false;

  const candidates = new Set([
    ...norm.split(" "),
    ...splitSegments(username).map(normalizePl),
  ]);
  candidates.delete("");

  for (const c of candidates) if (TRANS_TOKENS.has(c)) return true;
  const glued = norm.replace(/ /g, "");
  if (TRANS_SUBSTR.some(s => glued.includes(s))) return true;

  for (const c of candidates) if (FEMALE_NAMES.has(c)) return true;

  for (const name of FEMALE_NAMES) {
    if (name.length >= 5 && glued.includes(name)) return true;
  }

  return false;
}
