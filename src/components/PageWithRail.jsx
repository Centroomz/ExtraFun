import { SiteRail } from './SiteRail'

// Desktop 8/4 grid: page content left, shared SiteRail right (sticky).
// `narrow` keeps prose columns at max-w-2xl (single-article pages).
// Rail is desktop-only (lg+); on mobile children render full width, unchanged.
export function PageWithRail({ children, rail = {}, narrow = false }) {
  return (
    <div className="lg:grid lg:grid-cols-12 lg:gap-x-12">
      <div className={`lg:col-span-8 min-w-0${narrow ? ' max-w-2xl' : ''}`}>{children}</div>
      <aside className="hidden lg:block lg:col-span-4">
        <div className="sticky top-8">
          <SiteRail {...rail} />
        </div>
      </aside>
    </div>
  )
}
