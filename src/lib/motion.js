// prefers-reduced-motion: zapętlone klipy startują zatrzymane (WCAG 2.2.2),
// użytkownik włącza je przyciskiem ▶. Bezpieczne w SSR / bez matchMedia.
export function prefersReducedMotion() {
  return typeof window !== 'undefined'
    && typeof window.matchMedia === 'function'
    && window.matchMedia('(prefers-reduced-motion: reduce)').matches
}
