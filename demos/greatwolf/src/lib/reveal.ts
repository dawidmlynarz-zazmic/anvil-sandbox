/** Scrolls the page area so `id` sits near the top, above the Wiley sheet. A throttled window can skip the smooth
 *  scroll, so land it once more if it hasn't arrived. */
export function reveal(id: string) {
  const el = document.getElementById(id)
  const box = document.getElementById('page-scroll')
  if (!el || !box) return
  const top = Math.max(0, box.scrollTop + el.getBoundingClientRect().top - box.getBoundingClientRect().top - 72)
  box.scrollTo({ top, behavior: 'smooth' })
  window.setTimeout(() => {
    if (Math.abs(box.scrollTop - top) > 4) box.scrollTop = top
  }, 700)
}
