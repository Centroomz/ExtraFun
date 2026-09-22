// Covers are stored full-res (1104×1472, 84 kB webp) and were served as-is to
// a 375 px phone tile. The render/image endpoint resizes and re-encodes, and
// honours the browser's Accept header, so Chrome still gets webp:
//   measured on 212-*.webp, 375 px slot @2x → 37 kB instead of 84 kB.
// Both endpoints answer `public, max-age=3600` on GET (a HEAD says `no-cache`
// — that is a CDN quirk, not the real policy; check with GET before believing
// a caching claim here).
// Only bucket objects are rewritten; local files (/editorial/…) pass through.
const OBJECT = '/storage/v1/object/public/'
const RENDER = '/storage/v1/render/image/public/'

// `width` alone does NOT keep the aspect ratio: the default resize mode holds
// the source height, so a 1104×1472 cover came back 420×1472 — squeezed.
// `resize=contain` with a height bound no cover can reach fits the image inside
// the box instead, so 1104×1472 → 750×1000 and 1344×768 → 750×429.
const MAX_H = 4000

export function coverUrl(src, width, quality = 60) {
  if (!src || !src.includes(OBJECT)) return src
  const u = src.replace(OBJECT, RENDER)
  return `${u}${u.includes('?') ? '&' : '?'}width=${width}&height=${MAX_H}&resize=contain&quality=${quality}`
}

// `sizes` tells the browser the slot is one CSS pixel wide per device pixel;
// without it a 3× phone would still pick the smallest candidate.
export function coverSrcSet(src, widths, quality = 60) {
  if (!src || !src.includes(OBJECT)) return undefined
  return widths.map(w => `${coverUrl(src, w, quality)} ${w}w`).join(', ')
}
