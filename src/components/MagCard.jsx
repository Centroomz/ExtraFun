import { useImpression, trackClick } from '../lib/cardStats'
import { CardStatBadge } from './CardStatBadge'
// Magazine card matching the approved mockup: clean 16:10 thumb, gold caps tag
// ABOVE a non-italic Bodoni title, optional lead, muted meta. Deliberately not
// the shared nocturne ArticleCard (italic + tag-on-image) — the magazine front
// wants this quieter, more editorial treatment.
//
// size: 'lg' (feature) | 'sm' (grid/row)
export function MagCard({ id, image, tag, title, lead, meta, size = 'sm', onClick }) {
  const titleSize = size === 'lg' ? 'text-headline-md' : 'text-body-lg'
  const ref = useImpression('article', id)
  return (
    <article ref={ref} onClick={() => { if (id != null) trackClick('article', id); onClick?.() }} className="group cursor-pointer">
      <div className="relative w-full aspect-[16/10] overflow-hidden mb-4 bg-surface-container">
        <CardStatBadge kind="article" id={id} className="absolute top-2 left-2 z-10" />
        {image ? (
          <div
            className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
            style={{ backgroundImage: `url('${image}')` }}
          />
        ) : (
          <div className="absolute inset-0 bg-gradient-to-br from-surface-container-high to-surface-container-lowest" />
        )}
      </div>
      {tag && <div className="font-body text-label-caps uppercase text-primary-container mb-2">{tag}</div>}
      <h3 className={`font-display font-medium ${titleSize} text-on-surface leading-tight mb-2 group-hover:text-primary-container transition-colors`}>{title}</h3>
      {lead && <p className="font-body text-body-md text-on-surface-variant leading-relaxed">{lead}</p>}
      {meta && <div className="font-body text-label-caps uppercase text-outline mt-3">{meta}</div>}
    </article>
  )
}

// Magazine section header: small gold caps label + hairline rule + optional link.
export function MagSectionHeader({ label, moreLabel, onMore }) {
  return (
    <div className="flex items-center gap-4 mb-7">
      <span className="font-body text-label-caps uppercase text-primary-container whitespace-nowrap">{label}</span>
      <span className="flex-1 h-px bg-outline-variant/40" />
      {onMore && (
        <button onClick={onMore} className="font-body text-label-caps uppercase text-on-surface-variant hover:text-on-surface whitespace-nowrap transition-colors">
          {moreLabel || 'Więcej →'}
        </button>
      )}
    </div>
  )
}
