import { MagCard, MagSectionHeader } from './MagCard'

// One magazine rubric block: header + latest cards. Renders nothing when the
// rubric is empty (hard rule: hidden, never a placeholder).
//
// Props:
//   id       — anchor id (weekly-rhythm rail scrolls here)
//   label    — section title
//   articles — already filtered + newest-first list for this rubric
//   onOpen   — (article) => void, card click
//   onMore   — () => void, "więcej" link (optional)
//   moreLabel
//   layout   — 'row'     : up to `limit` cards, 3 across
//              'feature' : 1 big image card + text-only headline list beside it
//              'wide'    : single horizontal card, image spans half + text beside
//   limit    — max cards

// Text-only headline (no thumbnail) — lets more items fit in the feature rail.
function HeadlineItem({ a, onOpen }) {
  return (
    <button onClick={() => onOpen(a)} className="group text-left block w-full">
      <div className="font-body text-label-caps uppercase text-primary-container mb-1">{a.category}</div>
      <h3 className="font-display font-medium text-body-lg text-on-surface leading-snug group-hover:text-primary-container transition-colors">{a.title}</h3>
      <div className="font-body text-label-caps uppercase text-outline mt-1">{a.reading_time} min</div>
    </button>
  )
}

export function RubrykaSection({
  id, label, articles, onOpen, onMore, moreLabel = 'Więcej →',
  layout = 'row', limit = 3,
}) {
  if (!articles || articles.length === 0) return null
  const items = articles.slice(0, limit)

  return (
    <section id={id} className="scroll-mt-24 mb-4">
      <MagSectionHeader label={label} moreLabel={moreLabel} onMore={onMore} />

      {layout === 'feature' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-10 gap-y-8 mb-16">
          <div className="md:col-span-7">
            <MagCard
              id={items[0].id}
              image={items[0].cover_image}
              tag={items[0].category}
              title={items[0].title}
              lead={items[0].description}
              meta={`${items[0].reading_time} min czytania`}
              size="lg"
              onClick={() => onOpen(items[0])}
            />
          </div>
          {items.length > 1 && (
            <div className="md:col-span-5 flex flex-col divide-y divide-outline-variant/20">
              {items.slice(1).map(a => (
                <div key={a.id} className="py-4 first:pt-0 last:pb-0">
                  <HeadlineItem a={a} onOpen={onOpen} />
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {layout === 'wide' && (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-10 gap-y-6 items-center mb-16">
          <div
            onClick={() => onOpen(items[0])}
            className="group cursor-pointer md:col-span-7 relative w-full aspect-[16/9] overflow-hidden bg-surface-container"
          >
            {items[0].cover_image ? (
              <div
                className="absolute inset-0 bg-cover bg-center transition-transform duration-700 group-hover:scale-105"
                style={{ backgroundImage: `url('${items[0].cover_image}')` }}
              />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-surface-container-high to-surface-container-lowest" />
            )}
          </div>
          <div className="md:col-span-5">
            <div className="font-body text-label-caps uppercase text-primary-container mb-2">{items[0].category}</div>
            <h3 className="font-display font-medium text-headline-sm text-on-surface leading-tight mb-3 cursor-pointer hover:text-primary-container transition-colors" onClick={() => onOpen(items[0])}>{items[0].title}</h3>
            {items[0].description && <p className="font-body text-body-md text-on-surface-variant leading-relaxed mb-3">{items[0].description}</p>}
            <div className="font-body text-label-caps uppercase text-outline">{items[0].reading_time} min czytania</div>
          </div>
        </div>
      )}

      {layout === 'row' && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-12 mb-16">
          {items.map(a => (
            <MagCard
              key={a.id}
              id={a.id}
              image={a.cover_image}
              tag={a.category}
              title={a.title}
              lead={a.description}
              meta={`${a.reading_time} min`}
              size="sm"
              onClick={() => onOpen(a)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
