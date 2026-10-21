// Shared rubric taxonomy for the magazine — SINGLE SOURCE OF TRUTH.
// Used by Magazyn front, KategoriaPage, ArticleDetailPage (public) and
// Admin (category picker). Add a new month's slug here ONCE; every consumer
// picks it up automatically. Names here match the DB `article_categories`
// table (public.article_categories.name) where a row exists.

export const SLUG_TO_DISPLAY = {
  'cnm-101':        'CNM 101',
  'bez-osadu':      'Bez Osądu',
  'pierwszy-raz':   'Pierwszy Raz',
  'slownik':        'Słownik',
  'tam-i-tam':      'Tam i Tam',
  'temat-miesiaca': 'Temat Miesiąca',
  'temat-2026-10':  'Temat Miesiąca',
  'temat-2026-11':  'Temat Miesiąca',
  'plazing':        'Plażing',
  'dogging':        'Dogging',
  'naga-sroda':     'Naga Środa',
  'bezpieczenstwo': 'Bezpieczeństwo',
  'felieton':       'Felieton',
  'fetysz':         'Fetysz',
  'kultura':        'Kultura',
  'wellness':       'Zdrowie i wellness',
  'miejsca':        'Miejsca',
}

// Umbrella rubrics that map to several DB slugs. 'temat' is resolved
// dynamically from the monthly theme (see KategoriaPage), so it's not here.
export const RUBRYKA_GROUPS = {
  wiedza: { label: 'Wiedza', slugs: ['cnm-101', 'pierwszy-raz', 'bez-osadu'] },
}
