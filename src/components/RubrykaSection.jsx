import { ArticleCard, SectionHeader } from './nocturne'

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
//   layout   — 'row' (3 across) | 'feature' (1 large + up to 2 small)
//   limit    — max cards
export function RubrykaSection({
  id, label, articles, onOpen, onMore, moreLabel = 'Więcej →',
  layout = 'row', limit = 3,
}) {
  if (!articles || articles.length === 0) return null
  const items = articles.slice(0, limit)

  return (
    <section id={id} className="scroll-mt-24 mb-4">
      <SectionHeader title={label} linkLabel={onMore ? moreLabel : undefined} onLink={onMore} />

      {layout === 'feature' ? (
        <div className="grid grid-cols-1 md:grid-cols-12 gap-x-8 gap-y-10 mb-16">
          <div className="md:col-span-8">
            <ArticleCard
              image={items[0].cover_image || undefined}
              tag={items[0].category}
              title={items[0].title}
              lead={items[0].description}
              meta={`${items[0].reading_time} min czytania`}
              variant="large"
              onClick={() => onOpen(items[0])}
            />
          </div>
          {items.length > 1 && (
            <div className="md:col-span-4 flex flex-col gap-10">
              {items.slice(1, 3).map(a => (
                <ArticleCard
                  key={a.id}
                  image={a.cover_image || undefined}
                  tag={a.category}
                  title={a.title}
                  meta={`${a.reading_time} min`}
                  variant="small"
                  onClick={() => onOpen(a)}
                />
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-12 mb-16">
          {items.map(a => (
            <ArticleCard
              key={a.id}
              image={a.cover_image || undefined}
              tag={a.category}
              title={a.title}
              lead={a.description}
              meta={`${a.reading_time} min`}
              variant="small"
              onClick={() => onOpen(a)}
            />
          ))}
        </div>
      )}
    </section>
  )
}
