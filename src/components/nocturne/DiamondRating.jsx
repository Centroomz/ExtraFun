// 5 gold diamonds; `value` 0–5 (rounded to nearest).
export function DiamondRating({ value = 0, size = 14 }) {
  const filled = Math.round(value)
  return (
    <span className="inline-flex gap-1" aria-label={`Ocena ${value} z 5`}>
      {[0, 1, 2, 3, 4].map((i) => (
        <span
          key={i}
          style={{ width: size, height: size, transform: 'rotate(45deg)' }}
          className={i < filled ? 'bg-primary-container' : 'bg-outline-variant/40'}
        />
      ))}
    </span>
  )
}
