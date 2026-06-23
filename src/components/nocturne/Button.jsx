// Gold editorial button + text-link-with-arrow variant.
export function Button({ children, variant = 'solid', as = 'button', className = '', ...props }) {
  if (variant === 'link') {
    return (
      <a
        className={`inline-flex items-center gap-2 font-body text-label-caps uppercase text-primary-container hover:opacity-80 transition-opacity border-b border-primary-container/40 pb-0.5 ${className}`}
        {...props}
      >
        {children}
        <span aria-hidden>→</span>
      </a>
    )
  }
  const Tag = as
  return (
    <Tag
      className={`inline-block bg-primary-container text-[#1a1400] px-10 py-4 font-body text-label-caps uppercase font-semibold hover:opacity-90 transition-all active:scale-95 ${className}`}
      {...props}
    >
      {children}
    </Tag>
  )
}
