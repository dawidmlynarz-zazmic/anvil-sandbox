/**
 * Brings an element to the top of its scroll area: smoothly where the browser animates, and guaranteed either way
 * (a background or throttled window may never run the animation, so it jumps there if it hasn't arrived).
 */
export function reveal(el: Element | null | undefined) {
  if (!el) return
  const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
  el.scrollIntoView({ behavior: reduce ? 'auto' : 'smooth', block: 'start' })
  if (reduce) return
  const target = el.getBoundingClientRect().top
  window.setTimeout(() => {
    // Still where it was: the smooth scroll didn't run.
    if (Math.abs(el.getBoundingClientRect().top - target) < 2) el.scrollIntoView({ block: 'start' })
  }, 600)
}

/** Scrolls an area back to its top, with the same fallback. */
export function revealTop(area: Element | null | undefined) {
  if (!area) return
  area.scrollTo({ top: 0, behavior: 'smooth' })
  window.setTimeout(() => {
    if (area.scrollTop > 2) area.scrollTo({ top: 0 })
  }, 600)
}
