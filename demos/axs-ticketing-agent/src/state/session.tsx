import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { echo, respond } from '~/services/agent'
import type { Action, Session } from './types'

const KEY = 'axs-ticketing-agent:session'

export const emptySession = (): Session => ({ turns: [], criteria: {}, consent: 'unset', selection: {} })

function load(): Session {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (raw) return { ...emptySession(), ...(JSON.parse(raw) as Session) }
  } catch {
    // No storage, or it held something else: start fresh.
  }
  return emptySession()
}

interface SessionApi {
  session: Session
  /** True while the agent is working on an answer. */
  busy: boolean
  send: (action: Action) => Promise<void>
  /** "Reset the demo": back to the seeded start. */
  reset: () => void
}

const Ctx = createContext<SessionApi | null>(null)

/** Demo state lives in sessionStorage behind this one store: a reload keeps the demo where it was, a new tab starts fresh. */
export function SessionProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(load)
  const [busy, setBusy] = useState(false)
  const latest = useRef(session)
  latest.current = session
  const working = useRef(false)
  // A reset while an answer is on its way must drop that answer.
  const epoch = useRef(0)

  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(session))
    } catch {
      // Without storage the demo still runs; it just won't survive a reload.
    }
  }, [session])

  const send = useCallback(async (action: Action) => {
    // One answer at a time: a second tap while the agent is working is ignored.
    if (working.current) return
    working.current = true
    const mine = epoch.current
    const before = latest.current
    const said = echo(action, before)
    if (said) {
      setSession((s) => ({ ...s, turns: [...s.turns, { id: `u${Date.now().toString(36)}`, role: 'user', text: said, at: Date.now() }] }))
    }
    setBusy(true)
    try {
      const result = await respond(action, before)
      if (mine !== epoch.current) return
      setSession((s) => ({ ...s, ...result.patch, turns: [...s.turns, ...result.turns] }))
    } finally {
      working.current = false
      if (mine === epoch.current) setBusy(false)
    }
  }, [])

  const reset = useCallback(() => {
    epoch.current++
    working.current = false
    setBusy(false)
    setSession(emptySession())
  }, [])

  const api = useMemo(() => ({ session, busy, send, reset }), [session, busy, send, reset])
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useSession() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useSession needs a SessionProvider')
  return ctx
}
