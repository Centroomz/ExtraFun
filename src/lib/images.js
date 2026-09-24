// This used to rewrite the URL to /storage/v1/render/image and let Supabase
// resize on the fly (measured saving: a 1104×1472/84 kB cover → 37 kB on a
// 375 px tile). But Supabase bills image transformations per *distinct origin
// image* per cycle, Pro quota is 100, and this ran on every article-covers
// object across every tile width — it was 1/3 of what pushed the org to
// 1004/100 (995% from bizarriusz avatars, still climbing from this). article-
// covers is 272 objects averaging 244 kB (max 3.46 MB) against a 250 GB/cycle
// egress quota sitting at 10% used — serving originals costs egress headroom
// that exists, not a quota that's already blown. So no more transforms:
// `width`/`quality` are kept so the ~10 call sites need no edit, but both
// just return the original URL now.
export function coverUrl(src, _width, _quality) {
  return src
}

// No more resized variants to offer, so no srcSet — `sizes` on the <img>
// becomes a no-op but callers can leave it, it's harmless without a srcSet.
export function coverSrcSet(_src, _widths, _quality) {
  return undefined
}
