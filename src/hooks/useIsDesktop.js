import { useEffect, useState } from 'react'

// `hidden lg:block` hides the rail on mobile but React still mounts it, so its
// modules kept fetching /api/places (34 kB gz), /api/articles and /api/events
// and loading 11 thumbnails that no phone ever shows. This gates the mount
// itself. Breakpoint = Tailwind `lg`.
const LG = '(min-width: 1024px)'

export function useIsDesktop() {
  const [isDesktop, setIsDesktop] = useState(() =>
    typeof window !== 'undefined' && window.matchMedia(LG).matches
  )
  useEffect(() => {
    const mq = window.matchMedia(LG)
    const onChange = () => setIsDesktop(mq.matches)
    onChange()
    mq.addEventListener('change', onChange)
    return () => mq.removeEventListener('change', onChange)
  }, [])
  return isDesktop
}
