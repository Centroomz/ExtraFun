import { useEffect, useState } from 'react'

// Autoplay hero clips (3–4 MB from the bucket) competed with the bundle, fonts
// and article covers on first paint and were the LCP element (6.7s on 4G).
// Mount the <video> only after (a) window.load + 1.5s and (b) the poster image
// has been decoded — so the clip never shares bandwidth with the frame the
// visitor is actually looking at. Until then the poster stays on screen.
export function useDeferredVideo(poster, delay = 1500) {
  const [ready, setReady] = useState(false)
  useEffect(() => {
    let t, cancelled = false
    const loaded = new Promise(resolve => {
      const go = () => { t = setTimeout(resolve, delay) }
      if (document.readyState === 'complete') go()
      else window.addEventListener('load', go, { once: true })
    })
    const decoded = poster
      ? new Promise(resolve => { const im = new Image(); im.onload = im.onerror = resolve; im.src = poster })
      : Promise.resolve()
    Promise.all([loaded, decoded]).then(() => { if (!cancelled) setReady(true) })
    return () => { cancelled = true; clearTimeout(t) }
  }, [poster, delay])
  return ready
}
