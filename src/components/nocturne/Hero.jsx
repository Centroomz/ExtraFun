import { Button } from './Button'

// Full-bleed editorial hero spread: moody image + vignette + left-aligned Bodoni headline.
// Optional `aside` renders a panel on the right (desktop) — hidden on mobile.
export function Hero({ image, video, imagePosition = 'center', label, title, lead, ctaLabel, onCta, aside, italic = true, mobileCompact = false }) {
  return (
    <section className="relative w-full h-[58vh] min-h-[420px] flex flex-col justify-end overflow-hidden mb-16">
      <div className="absolute inset-0">
        {video && (
          <video
            className="lg:hidden w-full h-full object-cover"
            autoPlay muted loop playsInline
            poster={image || undefined}
            src={video}
          />
        )}
        {image
          ? <div className={`${video ? 'hidden lg:block ' : ''}w-full h-full bg-cover`} style={{ backgroundImage: `url('${image}')`, backgroundPosition: imagePosition }} />
          : <div className={`${video ? 'hidden lg:block ' : ''}w-full h-full bg-gradient-to-br from-surface-container-high to-surface-container-lowest`} />}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, rgba(18,20,20,.95) 5%, rgba(18,20,20,.4) 45%, rgba(18,20,20,.2) 100%)' }} />
      </div>
      <div className={`relative z-10 px-6 md:px-16 ${mobileCompact ? 'pb-6 md:pb-16' : 'pb-16'} ${aside ? 'flex flex-col md:flex-row md:items-end md:justify-between gap-8' : ''}`}>
        <div className="max-w-3xl">
          {label && <span className={`font-body text-label-caps uppercase text-primary-container block ${mobileCompact ? 'mb-2 md:mb-4' : 'mb-4'}`}>{label}</span>}
          <h1 className={`font-display ${italic ? 'italic ' : ''}font-semibold text-display-lg-mobile md:text-display-lg text-on-surface leading-none ${mobileCompact ? 'mb-0 md:mb-6' : 'mb-6'}`}>{title}</h1>
          {lead && <p className={`font-body text-body-lg text-on-surface-variant max-w-2xl mb-8 leading-relaxed ${mobileCompact ? 'hidden md:block' : ''}`}>{lead}</p>}
          {ctaLabel && <Button onClick={onCta}>{ctaLabel}</Button>}
        </div>
        {aside && <div className="hidden md:block shrink-0 w-[320px]">{aside}</div>}
      </div>
    </section>
  )
}
