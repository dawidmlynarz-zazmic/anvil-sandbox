import { createContext, useCallback, useContext, useEffect, useMemo, useReducer, useRef, type ReactNode } from 'react'
import { seedProjects } from '~/mocks/seeds'
import { QUESTIONS } from '~/services/interview'
import { newProject, projectReducer, settle, type Action, type ProjectState } from './project'

// All projects live here. Each project's own state is changed through `projectReducer`.
// The store is kept in sessionStorage, so a reload keeps the demo where it was; close the tab to reset.

interface StoreState {
  projects: Record<string, ProjectState>
}

type StoreAction = { type: 'create'; project: ProjectState } | { type: 'in'; id: string; action: Action } | { type: 'reset'; state: StoreState }

const KEY = 'stage-studio:v1'

function reducer(state: StoreState, action: StoreAction): StoreState {
  switch (action.type) {
    case 'create':
      return { projects: { ...state.projects, [action.project.meta.id]: action.project } }
    case 'in': {
      const current = state.projects[action.id]
      if (!current) return state
      return { projects: { ...state.projects, [action.id]: projectReducer(current, action.action) } }
    }
    case 'reset':
      return action.state
  }
}

/** The demo opens on a brand-new project (the first use case), with the three samples further down the list. */
const FIRST_PROJECT = 'new-show'

function seeded(): StoreState {
  const first = QUESTIONS[0]!
  const blank = newProject(FIRST_PROJECT, [{ id: 900, role: 'assistant', text: first.ask, suggestions: first.suggestions }])
  return { projects: Object.fromEntries([...seedProjects(), blank].map((p) => [p.meta.id, p])) }
}

function load(): StoreState {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (raw) {
      const parsed = JSON.parse(raw) as StoreState
      return { projects: Object.fromEntries(Object.entries(parsed.projects).map(([id, p]) => [id, settle(p)])) }
    }
  } catch {
    // Storage blocked or unreadable: start from the samples.
  }
  return seeded()
}

interface StoreApi {
  state: StoreState
  ref: React.RefObject<StoreState>
  dispatchIn: (id: string, action: Action) => void
  /** A message or comment id that's unique across every project. */
  nextId: () => number
  /** Starts a new project with the agent's first interview question, and returns its id. */
  createProject: () => string
  /** Drops all changes: back to a new, empty project plus the three samples. */
  resetDemo: () => void
  /** Projects, most recently active first. */
  list: ProjectState[]
}

const StoreContext = createContext<StoreApi | null>(null)

export function StoreProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)
  const ref = useRef(state)
  ref.current = state
  const counter = useRef(
    1 + Math.max(1000, ...Object.values(state.projects).flatMap((p) => p.messages.map((m) => m.id))),
  )

  useEffect(() => {
    const t = window.setTimeout(() => {
      try {
        sessionStorage.setItem(KEY, JSON.stringify(state))
      } catch {
        // Full or blocked storage only loses persistence across reloads.
      }
    }, 300)
    return () => window.clearTimeout(t)
  }, [state])

  const dispatchIn = useCallback((id: string, action: Action) => dispatch({ type: 'in', id, action }), [])
  const nextId = useCallback(() => counter.current++, [])

  const createProject = useCallback(() => {
    const id = `p${Date.now().toString(36)}`
    const first = QUESTIONS[0]!
    dispatch({
      type: 'create',
      project: newProject(id, [{ id: counter.current++, role: 'assistant', text: first.ask, suggestions: first.suggestions }]),
    })
    return id
  }, [])

  const resetDemo = useCallback(() => {
    try {
      sessionStorage.removeItem(KEY)
      localStorage.removeItem('stage-studio:next-hint-dismissed')
    } catch {
      // Ignore: the in-memory reset below is what matters.
    }
    dispatch({ type: 'reset', state: seeded() })
  }, [])

  const api = useMemo<StoreApi>(
    () => ({
      state,
      ref,
      dispatchIn,
      nextId,
      createProject,
      resetDemo,
      list: Object.values(state.projects).sort((a, b) => b.meta.updatedAt - a.meta.updatedAt),
    }),
    [state, dispatchIn, nextId, createProject, resetDemo],
  )

  return <StoreContext value={api}>{children}</StoreContext>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useStore() {
  const ctx = useContext(StoreContext)
  if (!ctx) throw new Error('useStore must be used inside StoreProvider')
  return ctx
}
