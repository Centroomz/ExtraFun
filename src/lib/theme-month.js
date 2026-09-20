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
}

export function getMonthTheme(date = new Date()) {
  return MONTH_THEMES[date.getMonth() + 1] || null
}
