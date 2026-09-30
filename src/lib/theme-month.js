// "Temat Miesiąca" umbrella config (parasol).
//
// The theme's articles keep their own month slug in the DB (e.g. 'dogging') —
// this file only maps, per month, the editorial umbrella (label/title/lead/image)
// and WHICH slugs belong to the current theme. No data migration: the homepage
// groups by `slugs` here, the hero + section headline say "Temat Miesiąca".
//
// Only months with a REAL theme live here. A month with no entry → getMonthTheme
// returns null and the homepage falls back to the newest article for the hero
// (never a placeholder). Keep in sync with the editorial calendar.

export const MONTH_THEMES = {
  6: {
    label: 'Czerwiec · Temat Miesiąca: CNM 101',
    title: 'ABC niemonogamii.',
    lead: 'Czerwiec od podstaw: co to CNM, czym różni się poliamoria od swingu i otwartego związku, i dlaczego zazdrość nie jest wrogiem.',
    image: '/editorial/hero-cnm101.jpg',
    slugs: ['cnm-101'],
  },
  7: {
    label: 'Lipiec · Temat Miesiąca: Plażing',
    title: 'Skóra, słońce, woda.',
    lead: 'Naturyzm i lifestyle nad polską wodą — gdzie, z kim i bez czego.',
    image: '/editorial/hero-plaze.jpg',
    slugs: ['plazing'],
  },
  8: {
    label: 'Sierpień · Temat Miesiąca: Plażing',
    title: 'Skóra, słońce, woda.',
    lead: 'Naturyzm i lifestyle nad polską wodą — gdzie, z kim i bez czego.',
    image: '/editorial/hero-plaze.jpg',
    slugs: ['plazing'],
  },
  9: {
    label: 'Wrzesień · Temat Miesiąca: Dogging',
    title: 'Las, Wisła, parking.',
    lead: 'Wrzesień w rytmie doggingu: co mówi polskie prawo (i jak rzadko je egzekwuje), savoir-vivre plenerowej sceny i dlaczego część ludzi wybiera krzaki zamiast bezpiecznego klubu.',
    image: 'https://lvxaycjuhchoqhnttyjj.supabase.co/storage/v1/object/public/article-covers/212-1788864401553.webp',
    video: 'https://lvxaycjuhchoqhnttyjj.supabase.co/storage/v1/object/public/article-covers/hero-pola-dogging-540.mp4',
    slugs: ['dogging'],
  },
  10: {
    label: 'Październik · Temat Miesiąca: Miłość, Zazdrość, Swing',
    title: 'Miłość, zazdrość, swing.',
    lead: 'Październik o tym, co się dzieje, gdy miłość przestaje być umową na wyłączność: reguły gry zamiast domysłów, kompersja zamiast zazdrości i rozmowy, które trzeba odbyć, zanim zrobi się o nich głośno.',
    image: 'https://lvxaycjuhchoqhnttyjj.supabase.co/storage/v1/object/public/article-covers/pola_partner_pazdziernik_hero.png',
    video: 'https://lvxaycjuhchoqhnttyjj.supabase.co/storage/v1/object/public/article-covers/Pola_pazdiernik_hero.mp4',
    slugs: ['temat-2026-10'],
  },
}

// Editorial early-start: unveil next month's theme before the calendar does.
// null = no override, follow the real date. Set to a MONTH_THEMES key to force
// it as "current" everywhere (hero, rail history, mobile swipe) — the retired
// month automatically becomes "Zeszły Temat Miesiąca". Clear it once the real
// calendar catches up (harmless to leave — same result either way past that
// point, but a stale override reads as a bug to the next person editing this).
const ACTIVE_MONTH_OVERRIDE = 10

// Exported so quiz-month.js (and anything else keyed by editorial month)
// shares the exact same "what month is it" logic — no separate override to
// drift out of sync with this one.
export function activeMonth(date) {
  return ACTIVE_MONTH_OVERRIDE || (date.getMonth() + 1)
}

export function getMonthTheme(date = new Date()) {
  return MONTH_THEMES[activeMonth(date)] || null
}

// Past themes, most recent first, stopping at the first gap in the config
// (a month with no MONTH_THEMES entry). Used by the rail's history module:
// the newest past month gets the hero-style box, older ones are text-only.
export function getLastMonthTheme(date = new Date()) {
  return getPastThemes(date, 1)[0] || null
}

export function getPastThemes(date = new Date(), max = 6) {
  const currentMonth = activeMonth(date)
  const out = []
  for (let i = 1; i <= max; i++) {
    const m = ((currentMonth - 1 - i) % 12 + 12) % 12 + 1
    const theme = MONTH_THEMES[m]
    if (!theme) break
    out.push(theme)
  }
  return out
}
