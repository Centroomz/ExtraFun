// Shared rubric taxonomy for the magazine (used by Magazyn front + KategoriaPage).

export const SLUG_TO_DISPLAY = {
  'cnm-101':        'CNM 101',
  'pierwszy-raz':   'Pierwszy Raz',
  'bez-osadu':      'Bez Osądu',
  'tam-i-tam':      'Tam i Tam',
  'slownik':        'Słownik',
  'temat-miesiaca': 'Temat Miesiąca',
  'felieton':       'Felieton',
  'plazing':        'Plażing',
  'dogging':        'Dogging',
  'naga-sroda':     'Naga Środa',
  'miejsca':        'Miejsca',
}

// Umbrella rubrics that map to several DB slugs. 'temat' is resolved
// dynamically from the monthly theme (see KategoriaPage), so it's not here.
export const RUBRYKA_GROUPS = {
  wiedza: { label: 'Wiedza', slugs: ['cnm-101', 'pierwszy-raz', 'bez-osadu'] },
}
