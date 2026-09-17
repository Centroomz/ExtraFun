// Per-venue URL slug — id-prefixed so each club has its own shareable page:
// /miejsca/123-heaven-warszawa. Shared by the guide, the events feed and rails.
export function slugify(s) {
  return String(s).toLowerCase()
    .replace(/ł/g, 'l')
    .normalize('NFD').replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '')
}

export function venueSlug(v) {
  return `${v.id}-${slugify(v.name)}${v.city ? '-' + slugify(v.city) : ''}`
}
