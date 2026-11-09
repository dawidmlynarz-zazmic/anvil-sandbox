import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useLocation, useNavigate } from 'react-router-dom'
import { respond } from '~/services/agent'
import type { Filters, Guest, Session, Trip } from './types'

const KEY = 'travelpass-ai:session'

export const emptySession = (): Session => ({
  turns: [],
  trip: {},
  filters: { sort: 'recommended', amenities: [] },
  draft: {},
  saved: [],
  compare: [],
  comparing: false,
  live: 'off',
})

function load(): Session {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (raw) return { ...emptySession(), ...(JSON.parse(raw) as Session) }
  } catch {
    // No storage, or it held something else: start fresh.
  }
  return emptySession()
}

export type MobileView = 'chat' | 'canvas'

interface StoreApi {
  session: Session
  /** True while the agent is working on an answer. */
  busy: boolean
  /** Types a message to the agent. `silent` skips the echo (a click the agent narrates). */
  send: (text: string, opts?: { silent?: boolean }) => Promise<void>
  /** Edits made on the page: the agent is told, so the conversation and the page agree. */
  /** Stops the answer that is on its way. */
  stop: () => void
  /** A file shared in the chat: the preview can't read it, and says so. */
  shareFile: (name: string) => void
  editTrip: (patch: Partial<Trip>) => void
  setDraft: (patch: Partial<Guest>) => void
  setFilters: (filters: Filters) => void
  setLive: (live: Session['live']) => void
  toggleSaved: (id: string) => void
  toggleCompare: (id: string) => void
  setComparing: (open: boolean) => void
  /** "Reset the demo": back to the seeded start. */
  reset: () => void
  view: MobileView
  setView: (view: MobileView) => void
}

const Ctx = createContext<StoreApi | null>(null)

/** Demo state lives in sessionStorage behind this one store: a reload keeps the demo where it was, a new tab starts fresh. */
export function StoreProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session>(load)
  const [busy, setBusy] = useState(false)
  const navigate = useNavigate()
  const { pathname } = useLocation()
  // A deep link opens the page itself on a phone; the start screen opens on the chat.
  const [view, setView] = useState<MobileView>(pathname === '/' ? 'chat' : 'canvas')
  const latest = useRef(session)
  latest.current = session
  const path = useRef(pathname)
  path.current = pathname
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

  const send = useCallback(
    async (text: string, opts?: { silent?: boolean }) => {
      const said = text.trim()
      // One answer at a time: a second message while the agent is working is ignored.
      if (!said || working.current) return
      working.current = true
      const mine = epoch.current
      if (!opts?.silent) {
        setSession((s) => ({ ...s, turns: [...s.turns, { id: `u${Date.now().toString(36)}`, role: 'user', text: said, at: Date.now() }] }))
      }
      setBusy(true)
      try {
        await new Promise((r) => setTimeout(r, 650))
        if (mine !== epoch.current) return
        const result = respond(said, { session: latest.current, path: path.current })
        setSession((s) => ({ ...s, ...result.patch, turns: [...s.turns, ...result.turns] }))
        if (result.navigate) {
          navigate(result.navigate)
          setView('canvas')
        }
      } finally {
        working.current = false
        if (mine === epoch.current) setBusy(false)
      }
    },
    [navigate],
  )

  const stop = useCallback(() => {
    epoch.current++
    working.current = false
    setBusy(false)
  }, [])

  const shareFile = useCallback((name: string) => {
    const at = Date.now()
    setSession((s) => ({
      ...s,
      turns: [
        ...s.turns,
        { id: `u${at.toString(36)}`, role: 'user', text: `Shared a file: ${name}`, at },
        { id: `a${at.toString(36)}`, role: 'agent', at, text: 'Thanks. This preview can’t look inside files yet, so I haven’t used it. Tell me what you like about it, like “whitewashed villages by the sea”, and I’ll plan from that.' },
      ],
    }))
  }, [])

  const editTrip = useCallback((patch: Partial<Trip>) => {
    setSession((s) => {
      const trip = { ...s.trip, ...patch, updatedAt: Date.now() }
      const text = 'Got it. I’ve updated the trip details, and the stays on the page follow them.'
      return { ...s, trip, turns: [...s.turns, { id: `a${Date.now().toString(36)}`, role: 'agent', text, at: Date.now(), tools: ['Updated trip details'] }] }
    })
  }, [])

  const setDraft = useCallback((patch: Partial<Guest>) => setSession((s) => ({ ...s, draft: { ...s.draft, ...patch } })), [])
  const setFilters = useCallback((filters: Filters) => setSession((s) => ({ ...s, filters })), [])
  const setLive = useCallback((live: Session['live']) => setSession((s) => ({ ...s, live })), [])

  const toggleSaved = useCallback((id: string) => setSession((s) => ({ ...s, saved: s.saved.includes(id) ? s.saved.filter((x) => x !== id) : [...s.saved, id] })), [])
  const toggleCompare = useCallback(
    (id: string) => setSession((s) => ({ ...s, compare: s.compare.includes(id) ? s.compare.filter((x) => x !== id) : [...s.compare, id].slice(-3) })),
    [],
  )
  const setComparing = useCallback((comparing: boolean) => setSession((s) => ({ ...s, comparing })), [])

  const reset = useCallback(() => {
    epoch.current++
    working.current = false
    setBusy(false)
    setSession(emptySession())
    setView('chat')
    navigate('/')
  }, [navigate])

  const api = useMemo<StoreApi>(
    () => ({ session, busy, send, stop, shareFile, editTrip, setDraft, setFilters, setLive, toggleSaved, toggleCompare, setComparing, reset, view, setView }),
    [session, busy, send, stop, shareFile, editTrip, setDraft, setFilters, setLive, toggleSaved, toggleCompare, setComparing, reset, view],
  )
  return <Ctx.Provider value={api}>{children}</Ctx.Provider>
}

export function useStore() {
  const ctx = useContext(Ctx)
  if (!ctx) throw new Error('useStore needs a StoreProvider')
  return ctx
}
