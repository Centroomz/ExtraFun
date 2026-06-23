// Image-led editorial card. variant: 'hero' | 'large' | 'small'.
// `image` optional — falls back to a gold-tinted gradient + vignette.
export function ArticleCard({ image, tag, title, lead, meta, onClick, variant = 'large' }) {
  const heights = { hero: 'h-[60vh] min-h-[420px]', large: 'h-80', small: 'h-56' }
  const titleSize = { hero: 'text-display-lg-mobile font-display', large: 'text-headline-sm font-display', small: 'text-body-lg font-display' }
  return (
    <article onClick={onClick} className="group cursor-pointer">
      <div className={`relative w-full ${heights[variant]} overflow-hidden`}>
        {image ? (
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-[1.2s] group-hover:scale-105"
            style={{ backgroundImage: `url('${image}')` }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-surface-container-high to-surface-container-lowest" />
        )}
        <div className="absolute inset-0" style={{ background: 'radial-gradient(120% 100% at 30% 100%, rgba(0,0,0,.75), transparent 70%)' }} />
        {tag && <span className="absolute top-4 left-4 font-body text-label-caps uppercase text-primary-container">{tag}</span>}
      </div>
      <div className="pt-5">
        <h3 className={`${titleSize[variant]} text-on-surface leading-tight mb-2`}>{title}</h3>
        {lead && <p className="font-body text-body-md text-on-surface-variant leading-relaxed">{lead}</p>}
        {meta && <div className="font-body text-label-caps uppercase text-outline mt-3">{meta}</div>}
      </div>
    </article>
  )
}
