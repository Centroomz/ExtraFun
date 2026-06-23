import { Button } from './Button'

// Full-bleed editorial hero spread: moody image + vignette + left-aligned Bodoni headline.
export function Hero({ image, label, title, lead, ctaLabel, onCta }) {
  return (
    <section className="relative w-full h-[80vh] min-h-[560px] flex flex-col justify-end overflow-hidden mb-24">
      <div className="absolute inset-0">
        {image
          ? <div className="w-full h-full bg-cover bg-center" style={{ backgroundImage: `url('${image}')` }} />
          : <div className="w-full h-full bg-gradient-to-br from-surface-container-high to-surface-container-lowest" />}
        <div className="absolute inset-0" style={{ background: 'linear-gradient(0deg, rgba(18,20,20,.95) 5%, rgba(18,20,20,.4) 45%, rgba(18,20,20,.2) 100%)' }} />
      </div>
      <div className="relative z-10 px-6 md:px-16 pb-16 max-w-4xl">
        {label && <span className="font-body text-label-caps uppercase text-primary-container mb-4 block">{label}</span>}
        <h1 className="font-display text-display-lg-mobile md:text-display-lg text-on-surface mb-6 leading-none">{title}</h1>
        {lead && <p className="font-body text-body-lg text-on-surface-variant max-w-2xl mb-8 leading-relaxed">{lead}</p>}
        {ctaLabel && <Button onClick={onCta}>{ctaLabel}</Button>}
      </div>
    </section>
  )
}
