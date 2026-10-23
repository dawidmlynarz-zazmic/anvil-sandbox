import { useState } from 'react'

const KEY = 'axs-ticketing-agent:theme'

/** Dark is the default (the AXS app is dark); a light choice is kept across reloads. */
export function useTheme() {
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const toggle = () => {
    const next = !dark
    document.documentElement.classList.toggle('dark', next)
    try {
      localStorage.setItem(KEY, next ? 'dark' : 'light')
    } catch {
      // Without storage, the choice lasts until the page reloads.
    }
    setDark(next)
  }
  return { dark, toggle }
}
