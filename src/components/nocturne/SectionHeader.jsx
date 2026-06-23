import { Button } from './Button'

// Bodoni section title with optional "see all" link + bottom divider.
export function SectionHeader({ title, linkLabel, onLink, href }) {
  return (
    <div className="flex items-baseline justify-between mb-12 border-b border-outline-variant/20 pb-4">
      <h2 className="font-display font-medium text-headline-md text-on-surface">{title}</h2>
      {linkLabel && (
        <Button variant="link" as="a" href={href || '#'} onClick={onLink}>{linkLabel}</Button>
      )}
    </div>
  )
}
