import { useEffect, useState } from 'react'

// Autoplay hero clips (3–4 MB from the bucket) competed with the bundle, fonts
// and article covers on first paint and were the LCP element (6.7s on 4G).
// Mount the <video> only after window.load + 1.5s; until then the poster
// image is shown in its place, so the frame on screen is the same.
export function useDeferredVideo(delay = 1500) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let t
    const go = () => { t = setTimeout(() => setReady(true), delay) }
    if (document.readyState === 'complete') go()
    else window.addEventListener('load', go, { once: true })
    return () => { clearTimeout(t); window.removeEventListener('load', go) }
  }, [delay])
  return ready
}
