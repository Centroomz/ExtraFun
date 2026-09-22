import { useRef, useState } from 'react'
import { Button } from './Button'
import { useDeferredVideo } from '../../lib/useDeferredVideo'

// Full-bleed editorial hero spread: moody image + vignette + left-aligned Bodoni headline.
// Optional `aside` renders a panel on the right (desktop) — hidden on mobile.
// `footer` — optional strip pinned to the hero's bottom edge, inside the scrim
// (magazine uses it for the weekly-rhythm rail, so the rail costs no extra
// vertical space above the fold). Text block tightens its bottom padding when set.
export function Hero({ image, video, imagePosition = 'center', label, onLabel, title, lead, ctaLabel, onCta, aside, footer, italic = true, mobileCompact = false }) {
  const videoRef = useRef(null)
  const [muted, setMuted] = useState(true)
  const videoReady = useDeferredVideo(image, !!video)
  const toggleSound = () => {
    const v = videoRef.current
    if (!v) return
    v.muted = !v.muted
    if (!v.muted) v.play?.().catch(() => {})
    setMuted(v.muted)
  }
  return (
    <section className="relative w-full h-[58vh] min-h-[420px] flex flex-col justify-end overflow-hidden mb-16">
      <div className="absolute inset-0">
        {/* Clip is deferred (useDeferredVideo) and layered over the still image,
            which stays underneath so the LCP is the image, not the clip's first frame. */}
        {video && videoReady && (
          <video
            ref={videoRef}
            className="lg:hidden absolute inset-0 w-full h-full object-cover"
            autoPlay muted loop playsInline
            poster={image || undefined}
            src={video}
          />
        )}
        {image
          ? <div className="w-full h-full bg-cover" style={{ backgroundImage: `url('${image}')`, backgroundPosition: imagePosition }} />
          : <div className={`${video ? 'hidden lg:block ' : ''}w-full h-full bg-gradient-to-br from-surface-container-high to-surface-container-lowest`} />}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, rgba(18,20,20,.95) 5%, rgba(18,20,20,.4) 45%, rgba(18,20,20,.2) 100%)' }} />
      </div>
      {video && (
        <button
          onClick={toggleSound}
          aria-label={muted ? 'Włącz dźwięk' : 'Wycisz'}
          className="lg:hidden absolute top-4 right-4 z-20 w-11 h-11 rounded-full flex items-center justify-center border border-white/20"
          style={{ background: 'rgba(18,20,20,0.55)', backdropFilter: 'blur(4px)' }}
        >
          <span className="text-xl leading-none">{muted ? '🔇' : '🔊'}</span>
        </button>
      )}
      <div className={`relative z-10 px-6 md:px-16 ${footer ? 'pb-8' : (mobileCompact ? 'pb-6 md:pb-16' : 'pb-16')} ${aside ? 'flex flex-col md:flex-row md:items-end md:justify-between gap-8' : ''}`}>
        <div className="max-w-3xl">
          {label && (onLabel
            ? <button onClick={onLabel} className={`font-body text-label-caps uppercase text-primary-container block hover:opacity-80 transition-opacity ${mobileCompact ? 'mb-2 md:mb-4' : 'mb-4'}`}>{label} →</button>
            : <span className={`font-body text-label-caps uppercase text-primary-container block ${mobileCompact ? 'mb-2 md:mb-4' : 'mb-4'}`}>{label}</span>)}
          <h1 className={`font-display ${italic ? 'italic ' : ''}font-semibold text-display-lg-mobile md:text-display-lg text-on-surface leading-none ${mobileCompact ? 'mb-3 md:mb-6' : 'mb-6'}`}>{title}</h1>
          {lead && <p className={`font-body text-body-lg text-on-surface-variant max-w-2xl leading-relaxed ${mobileCompact ? 'mb-0 md:mb-8' : 'mb-8'}`}>{lead}</p>}
          {ctaLabel && <Button onClick={onCta}>{ctaLabel}</Button>}
        </div>
        {aside && <div className="hidden md:block shrink-0 w-[320px]">{aside}</div>}
      </div>
      {footer && (
        <div className="relative z-10 border-t border-outline-variant/30" style={{ background: 'rgba(18,20,20,0.55)', backdropFilter: 'blur(4px)' }}>
          {footer}
        </div>
      )}
    </section>
  )
}
