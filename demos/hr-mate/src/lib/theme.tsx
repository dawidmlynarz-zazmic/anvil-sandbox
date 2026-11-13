import { createContext, useContext, useEffect, useLayoutEffect, useMemo, useState, type ReactNode } from 'react'

export type Theme = 'light' | 'dark' | 'system'
const KEY = 'hr-mate:theme'

const read = (): Theme => {
  try {
    const t = localStorage.getItem(KEY)
    if (t === 'light' || t === 'dark' || t === 'system') return t
  } catch {
    // Without storage the theme resets to light on reload.
  }
  return 'light'
}

const prefersDark = () => matchMedia('(prefers-color-scheme: dark)').matches

interface Ctx {
  theme: Theme
  resolved: 'light' | 'dark'
  setTheme: (t: Theme) => void
}
const ThemeContext = createContext<Ctx | null>(null)

export function ThemeProvider({ children }: { children: ReactNode }) {
  const [theme, setThemeState] = useState<Theme>(read)
  const [dark, setDark] = useState(prefersDark)
  const resolved = theme === 'system' ? (dark ? 'dark' : 'light') : theme

  useEffect(() => {
    const mq = matchMedia('(prefers-color-scheme: dark)')
    const on = () => setDark(mq.matches)
    mq.addEventListener('change', on)
    return () => mq.removeEventListener('change', on)
  }, [])

  useLayoutEffect(() => {
    document.documentElement.classList.toggle('dark', resolved === 'dark')
  }, [resolved])

  const value = useMemo<Ctx>(
    () => ({
      theme,
      resolved,
      setTheme: (t) => {
        setThemeState(t)
        try {
          localStorage.setItem(KEY, t)
        } catch {
          // Not persisting is fine.
        }
      },
    }),
    [theme, resolved],
  )
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>
}

export function useTheme() {
  const ctx = useContext(ThemeContext)
  if (!ctx) throw new Error('useTheme must be used inside ThemeProvider')
  return ctx
}
