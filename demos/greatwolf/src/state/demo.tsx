import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { addons, rateOf, suiteById, type RateKey } from '~/data/fixtures'
import { reveal } from '~/lib/reveal'
import { afterRate, scripts } from '~/wiley/scripts'
import type { Action, Beat, DemoState, DeviceMode, Journey, Msg, Option, Snap } from '~/wiley/types'
import { seed } from './seed'

// One provider holds the demo state, the Wiley conversation and the engine that plays scripted beats.
// A beat is a user line, an agent line (with typing time), chips, a card, or an effect on the page.

const STEPS = 6

interface Demo {
  s: DemoState
  step: number
  journey: Journey
  msgs: Msg[]
  typing: boolean
  playing: boolean
  composer: 'idle' | 'live'
  desktop: boolean
  framed: boolean
  deviceMode: DeviceMode
  setDeviceMode: (m: DeviceMode) => void
  barHidden: boolean
  endCard: null | 'checkout' | 'companion' | 'plan'
  setEndCard: (c: null | 'checkout' | 'companion' | 'plan') => void
  patch: (p: Partial<DemoState>) => void
  run: (actions: Action[]) => void
  say: (text: string, voice?: boolean) => void
  play: (beats: Beat[]) => Promise<void>
  joinVoyagers: () => void
  payApple: () => void
  listen: () => void
  pick: (msgId: number, opt: Option) => void
  submitCard: (msgId: number, payload: unknown) => void
  setSnap: (snap: Snap) => void
  toggleWiley: () => void
  closeWiley: () => void
  openWiley: (snap?: Snap) => void
  next: () => void
  back: () => void
  goStep: (n: number) => void
  startJourney: (j: Journey) => void
  reset: () => void
  go: (to: string) => void
}

const Ctx = createContext<Demo | null>(null)

export function useDemo() {
  const v = useContext(Ctx)
  if (!v) throw new Error('useDemo outside DemoProvider')
  return v
}

function useViewport() {
  const [size, setSize] = useState(() => ({ w: window.innerWidth, h: window.innerHeight }))
  useEffect(() => {
    const on = () => setSize({ w: window.innerWidth, h: window.innerHeight })
    window.addEventListener('resize', on)
    return () => window.removeEventListener('resize', on)
  }, [])
  return size
}

const DEVICE_KEY = 'gwl-v2:device'

export function DemoProvider({ journey, step, children }: { journey: Journey; step: number; children: ReactNode }) {
  const navigate = useNavigate()
  const { w } = useViewport()
  const [s, setS] = useState<DemoState>(() => seed(journey))
  const [msgs, setMsgs] = useState<Msg[]>([])
  const [typing, setTyping] = useState(false)
  const [playing, setPlaying] = useState(false)
  const [composer, setComposer] = useState<'idle' | 'live'>('idle')
  const [endCard, setEndCard] = useState<Demo['endCard']>(null)
  const [barHidden, setBarHidden] = useState(false)
  const [deviceMode, setDeviceModeState] = useState<DeviceMode>(() => {
    try {
      const v = localStorage.getItem(DEVICE_KEY)
      return v === 'mobile' || v === 'desktop' ? v : 'auto'
    } catch {
      return 'auto'
    }
  })

  const token = useRef(0)
  const nextId = useRef(0)
  const played = useRef(new Set<string>())
  const msgsRef = useRef<Msg[]>([])
  const sRef = useRef(s)
  const playingRef = useRef(false)
  const deskRef = useRef(false)
  // Next while Wiley is mid-script fast-forwards: pending pauses end at once and the rest play without delays.
  const skip = useRef(false)
  const wake = useRef<(() => void) | null>(null)
  const sleep = useCallback(
    (ms: number) =>
      skip.current
        ? Promise.resolve()
        : new Promise<void>((r) => {
            const t = window.setTimeout(() => ((wake.current = null), r()), ms)
            wake.current = () => (window.clearTimeout(t), (wake.current = null), r())
          }),
    [],
  )
  const toastTimer = useRef<number | undefined>(undefined)
  msgsRef.current = msgs
  sRef.current = s

  const framed = deviceMode === 'mobile' && w >= 480
  const desktop = deviceMode === 'desktop' || (deviceMode === 'auto' && w >= 768)
  deskRef.current = framed ? false : desktop

  const setDeviceMode = useCallback((m: DeviceMode) => {
    setDeviceModeState(m)
    try {
      localStorage.setItem(DEVICE_KEY, m)
    } catch {
      // Without storage the choice lasts until reload.
    }
  }, [])

  const patch = useCallback((p: Partial<DemoState>) => setS((x) => ({ ...x, ...p })), [])

  const go = useCallback(
    (to: string) => {
      navigate(to.startsWith('/') ? to : `/${to}`)
    },
    [navigate],
  )

  const run = useCallback(
    (actions: Action[]) => {
      for (const a of actions) {
        switch (a.do) {
          case 'setFilters':
            setS((x) => ({ ...x, filters: a.chips, setByWiley: true, widened: false }))
            break
          case 'rank':
            setS((x) => ({ ...x, ranked: a.order, tags: a.tag ? { ...x.tags, [a.tag.id]: a.tag.label } : x.tags }))
            break
          case 'highlight':
            setS((x) => ({ ...x, highlight: a.id }))
            break
          case 'dim':
            setS((x) => ({ ...x, dim: a.ids }))
            break
          case 'spotlight':
            setS((x) => ({ ...x, spotlight: a.id }))
            break
          case 'scrollTo':
            window.setTimeout(() => reveal(a.id), 420)
            break
          case 'expandRates':
            setS((x) => ({ ...x, expanded: a.suite }))
            break
          case 'selectRate':
            setS((x) => {
              const key: RateKey = a.rate === 'Standard' ? (x.signedIn ? 'std-voy' : 'std-non') : a.rate === 'Flexible' ? (x.signedIn ? 'flex-voy' : 'flex-non') : a.rate
              return { ...x, selected: { suite: a.suite, rate: key } }
            })
            break
          case 'addToCart':
            setS((x) => {
              const item = addons[a.item as keyof typeof addons]
              if (!item || x.cart.some((c) => c.id === item.id)) return x
              return { ...x, cart: [...x.cart.map((c) => ({ ...c, fresh: false })), { ...item, fresh: true }] }
            })
            break
          case 'addToPlan':
            setS((x) => {
              if (x.journey === 2) {
                if (x.ideas.includes(a.item)) return x
                return { ...x, ideas: [...x.ideas, a.item], planCount: x.planCount + 1 }
              }
              if (a.item === 'zoo') return { ...x, plan: x.plan.map((p) => (p.id === 'zoo' ? { ...p, status: 'Added' } : p)) }
              if (a.item === 'garden') {
                return { ...x, plan: x.plan.map((p) => (p.id === 'zoo' ? { ...p, id: 'garden', title: 'Garden of the Gods', sub: 'Near the lodge · red rock trails', status: 'Free' } : p)) }
              }
              return x
            })
            break
          case 'go':
            go(a.to)
            break
          case 'toast':
            setS((x) => ({ ...x, toast: a.text }))
            window.clearTimeout(toastTimer.current)
            toastTimer.current = window.setTimeout(() => setS((x) => ({ ...x, toast: null })), 2600)
            break
          case 'openSheet':
            setS((x) => ({ ...x, open: true, snap: a.snap }))
            break
          case 'closeSheet':
            setS((x) => ({ ...x, open: false }))
            break
          case 'signIn':
            setS((x) => ({
              ...x,
              signedIn: true,
              selected: x.selected && x.selected.rate === 'std-non' ? { ...x.selected, rate: 'std-voy' } : x.selected,
            }))
            break
          case 'sheet':
            setS((x) => ({ ...x, sheet: a.which }))
            break
          case 'patch':
            setS((x) => ({ ...x, ...a.fn(x) }))
            break
          case 'end':
            setEndCard(a.card)
            break
        }
      }
    },
    [go],
  )

  const push = useCallback((m: Omit<Msg, 'id'>) => {
    const id = ++nextId.current
    // Chips are only live on the newest turn: a chips-only row disappears once anything new arrives.
    setMsgs((all) => [...all.filter((x) => !x.chips), { ...m, id }])
    return id
  }, [])

  const play = useCallback(
    async (beats: Beat[]) => {
      const my = ++token.current
      skip.current = false
      wake.current?.()
      playingRef.current = true
      setPlaying(true)
      const alive = () => token.current === my
      for (const b of beats) {
        if (!alive()) return
        if (b.type === 'agent' && b.desktopOnly && !deskRef.current) continue
        if (b.type === 'user') {
          const last = msgsRef.current[msgsRef.current.length - 1]
          if (last?.role === 'user' && last.text === b.text) continue
          const voice = b.voice === 'mobile' ? !deskRef.current : b.voice
          if (voice) {
            setComposer('live')
            await sleep(1500)
            if (!alive()) return
            setComposer('idle')
          } else {
            await sleep(450)
            if (!alive()) return
          }
          push({ role: 'user', text: b.text, voice, reaction: b.reaction })
          await sleep(350)
        } else if (b.type === 'agent') {
          setTyping(true)
          await sleep(b.delayMs ?? Math.min(600 + 15 * b.text.length, 1800))
          if (!alive()) return
          setTyping(false)
          push({ role: 'agent', text: b.text, textMobile: b.textMobile, source: b.source })
        } else if (b.type === 'chips') {
          push({ role: 'agent', chips: { style: b.style, options: b.options } })
        } else if (b.type === 'card') {
          push({ role: 'agent', card: { component: b.component, props: b.props, then: b.then } })
        } else {
          run(b.actions)
        }
      }
      if (alive()) {
        skip.current = false
        setComposer('idle')
        playingRef.current = false
        setPlaying(false)
        setTyping(false)
      }
    },
    [push, run, sleep],
  )

  const pick = useCallback(
    (_msgId: number, opt: Option) => {
      push({ role: 'user', text: opt.say ?? opt.label })
      void play(opt.then)
    },
    [play, push],
  )

  const submitCard = useCallback(
    (msgId: number, payload: unknown) => {
      const card = msgsRef.current.find((m) => m.id === msgId)?.card
      if (!card || card.done) return
      setMsgs((all) => all.map((m) => (m.id === msgId && m.card ? { ...m, card: { ...m.card, done: true, answer: payload } } : m)))
      if (card.then) void play(card.then(payload))
    },
    [play],
  )

  const key = `${journey}.${step}`

  const say = useCallback(
    (text: string, voice?: boolean) => {
      push({ role: 'user', text, voice })
      const sc = scripts[`${journey}.${step}`]
      const hit = sc?.rules?.find(([re]) => re.test(text))
      if (hit) return void play(hit[1])
      void play([
        { type: 'agent', text: 'I’m a demo version of Wiley. Try one of these:' },
        { type: 'chips', style: 'ai', options: sc?.fallback ?? [] },
      ])
    },
    [journey, step, play, push],
  )

  const listen = useCallback(() => {
    setComposer('live')
    window.setTimeout(() => {
      setComposer('idle')
      say(scripts[`${journey}.${step}`]?.voiceLine ?? 'Show me what you can do', true)
    }, 1500)
  }, [journey, step, say])

  const setSnap = useCallback((snap: Snap) => setS((x) => ({ ...x, snap })), [])
  const openWiley = useCallback((snap: Snap = 'half') => setS((x) => ({ ...x, open: true, snap })), [])
  const closeWiley = useCallback(() => setS((x) => ({ ...x, open: false })), [])
  const toggleWiley = useCallback(() => setS((x) => ({ ...x, open: !x.open, snap: x.open ? x.snap : 'half' })), [])

  const goStep = useCallback((n: number) => go(`j${journey}/${Math.min(STEPS, Math.max(1, n))}`), [go, journey])

  const startJourney = useCallback((j: Journey) => go(`j${j}/1`), [go])

  const reset = useCallback(() => {
    token.current++
    for (const k of [...played.current]) if (k.startsWith(`${journey}.`)) played.current.delete(k)
    setMsgs([])
    setTyping(false)
    setPlaying(false)
    playingRef.current = false
    setComposer('idle')
    setEndCard(null)
    setS(seed(journey))
    if (step === 1) {
      // Already on step 1: the enter effect won't fire again, so play it now.
      window.setTimeout(() => {
        const sc = scripts[`${journey}.1`]
        played.current.add(`${journey}.1`)
        if (sc.enter) run(sc.enter)
        void play(sc.beats)
      }, 0)
    } else {
      go(`j${journey}/1`)
    }
  }, [journey, step, go, run, play])

  const joinVoyagers = useCallback(() => {
    run([{ do: 'sheet', which: null }, { do: 'signIn' }, { do: 'selectRate', suite: 'pup-den-jr', rate: 'std-voy' }, { do: 'toast', text: 'Welcome to Voyagers Club' }])
    void play(afterRate)
  }, [run, play])

  const payApple = useCallback(() => {
    run([{ do: 'sheet', which: null }])
    go('j1/6')
  }, [run, go])

  const next = useCallback(() => {
    if (sRef.current.sheet === 'join') return joinVoyagers()
    if (sRef.current.sheet === 'apple') return payApple()
    if (sRef.current.sheet === 'share') return run([{ do: 'sheet', which: null }])
    if (playingRef.current) {
      skip.current = true
      wake.current?.()
      return
    }
    const sc = scripts[`${journey}.${step}`]
    const last = [...msgsRef.current].reverse().find((m) => m.chips)
    if (last?.chips && sc?.path) {
      const opt = last.chips.options.find((o) => sc.path!.includes(o.label))
      if (opt) return pick(last.id, opt)
    }
    const waiting = [...msgsRef.current].reverse().find((m) => m.card && !m.card.done)
    if (waiting?.card?.component === 'questions') {
      return submitCard(waiting.id, { weekend: 'Mar 5 – 7', priority: 'bunks' })
    }
    if (waiting?.card?.component === 'capture') {
      return submitCard(waiting.id, { to: 'you@example.com' })
    }
    if (step >= STEPS) return setEndCard(journey === 1 ? 'companion' : 'plan')
    goStep(step + 1)
  }, [journey, step, pick, submitCard, goStep, joinVoyagers, payApple, run])

  const back = useCallback(() => {
    if (step > 1) goStep(step - 1)
  }, [step, goStep])

  // Entering a step: set page state, then let Wiley speak once. Coming back to a played step keeps the thread as it was.
  useEffect(() => {
    if (sRef.current.journey !== journey) {
      token.current++
      for (const k of [...played.current]) if (!k.startsWith(`${journey}.`)) played.current.delete(k)
      setMsgs([])
      setTyping(false)
      setPlaying(false)
      playingRef.current = false
      setComposer('idle')
      setEndCard(null)
      setS(seed(journey))
    }
    const sc = scripts[key]
    if (!sc) return
    if (sc.enter) run(sc.enter)
    if (!played.current.has(key)) {
      played.current.add(key)
      void play(sc.beats)
    }
  }, [key, journey, run, play])

  useEffect(() => {
    try {
      localStorage.setItem('gwl-v2:resume', `/j${journey}/${step}`)
    } catch {
      // Resume is a convenience only.
    }
  }, [journey, step])

  useEffect(() => {
    const on = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (e.metaKey || e.ctrlKey || e.altKey) return
      if (e.key === 'ArrowRight') next()
      else if (e.key === 'ArrowLeft') back()
      else if (e.key === 'r' || e.key === 'R') reset()
      else if (e.key === 'd' || e.key === 'D') setDeviceMode(deviceMode === 'auto' ? 'mobile' : deviceMode === 'mobile' ? 'desktop' : 'auto')
      else if (e.key === 'h' || e.key === 'H') setBarHidden((v) => !v)
      else if (e.key === '1') startJourney(1)
      else if (e.key === '2') startJourney(2)
    }
    window.addEventListener('keydown', on)
    return () => window.removeEventListener('keydown', on)
  }, [next, back, reset, deviceMode, setDeviceMode, startJourney])

  const value = useMemo<Demo>(
    () => ({
      s,
      step,
      journey,
      msgs,
      typing,
      playing,
      composer,
      desktop: framed ? false : desktop,
      framed,
      deviceMode,
      setDeviceMode,
      barHidden,
      endCard,
      setEndCard,
      patch,
      run,
      say,
      play,
      joinVoyagers,
      payApple,
      listen,
      pick,
      submitCard,
      setSnap,
      toggleWiley,
      closeWiley,
      openWiley,
      next,
      back,
      goStep,
      startJourney,
      reset,
      go,
    }),
    [s, step, journey, msgs, typing, playing, composer, desktop, framed, deviceMode, setDeviceMode, barHidden, endCard, patch, run, say, play, joinVoyagers, payApple, listen, pick, submitCard, setSnap, toggleWiley, closeWiley, openWiley, next, back, goStep, startJourney, reset, go],
  )

  return <Ctx.Provider value={value}>{children}</Ctx.Provider>
}

/** Quote lines for the trip so far, derived from the chosen rate and the cart. */
export function quoteOf(s: DemoState, nights = 2) {
  if (!s.selected) return null
  const suite = suiteById(s.selected.suite)
  const rate = rateOf(s.selected.suite, s.selected.rate)
  const base = rate.price * nights
  const lines = [
    { id: 'suite', label: `${suite.name}, ${nights} nights`, detail: rate.plan, amount: base },
    { id: 'passes', label: 'Water park passes', detail: '', amount: 0 },
    ...s.cart.map((c) => ({ id: c.id, label: c.label, detail: c.fresh ? 'Just added' : '', amount: c.amount })),
  ]
  const total = base + s.cart.reduce((n, c) => n + c.amount, 0)
  return { lines, total, rate, suite }
}
