import { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import { useNavigate } from 'react-router-dom'
import { money, rateOf, suiteById, type RateKey } from '~/data/fixtures'
import { extraById } from '~/data/extras'
import { guestsLong, longDates, partySize, type Stay } from './stay'
import { stayReply } from '~/wiley/scripts/stay'
import { reveal } from '~/lib/reveal'
import { afterJoinPickRate, afterJoinWithRate, scripts } from '~/wiley/scripts'
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
  /** The phrase Wiley shows while it thinks, or null. */
  thinking: string | null
  /** The words appearing in the composer while a voice request transcribes. */
  draft: string
  playing: boolean
  composer: 'idle' | 'live' | 'transcribing'
  desktop: boolean
  framed: boolean
  /** The window has room for the full desktop nav. */
  roomyNav: boolean
  deviceMode: DeviceMode
  setDeviceMode: (m: DeviceMode) => void
  barHidden: boolean
  endCard: null | 'checkout' | 'companion' | 'plan' | 'stay'
  setEndCard: (c: null | 'checkout' | 'companion' | 'plan' | 'stay') => void
  patch: (p: Partial<DemoState>) => void
  run: (actions: Action[]) => void
  say: (text: string, voice?: boolean) => void
  play: (beats: Beat[]) => Promise<void>
  joinVoyagers: () => void
  chooseRate: (suite: string, key: RateKey) => void
  /** The family changed the stay in the Your stay bar; the chat shows it and Wiley answers. */
  changeStay: (next: Partial<Stay>, what: 'dates' | 'guests' | 'clear') => void
  /** The family moved a plan item themselves; Wiley confirms it (and says if it clashes with check-out). */
  movePlanItem: (id: string, day: 'fri' | 'sat' | 'sun', time: string, reply: string) => void
  /** Journey 3: open the notification on the phone's screen and let Wiley carry on there. */
  tapBanner: () => void
  /** Journey 3: ask Wiley from a screen; the chat opens as a sheet over it (or in the Chat tab). */
  ask: (opt: Option) => void
  /** Add or remove a Trip Builder extra from the page; the chat shows it and Wiley answers. */
  toggleExtra: (id: string) => void
  payApple: () => void
  listen: () => void
  pick: (msgId: number, opt: Option) => void
  submitCard: (msgId: number, payload: unknown) => void
  setSnap: (snap: Snap) => void
  toggleWiley: () => void
  clearChat: () => void
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
  const [composer, setComposer] = useState<'idle' | 'live' | 'transcribing'>('idle')
  const [thinking, setThinking] = useState<string | null>(null)
  const [draft, setDraft] = useState('')
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
  const stepRef = useRef(step)
  stepRef.current = step
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
  const loadTimer = useRef<number | undefined>(undefined)
  msgsRef.current = msgs
  sRef.current = s

  // Journey 3 is the phone app: always a phone, framed whenever the window is wider than one.
  const framed = journey === 3 ? w >= 480 : deviceMode === 'mobile' && w >= 480
  const desktop = journey !== 3 && (deviceMode === 'desktop' || (deviceMode === 'auto' && w >= 768))
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
          case 'scrollTo': {
            // Wait for the target to exist (e.g. suites still loading), then let the layout settle before scrolling.
            // '@highlight' is whatever Wiley just highlighted (read when it scrolls, after the patch that set it).
            let tries = 0
            const attempt = () => {
              const id = a.id === '@highlight' ? sRef.current.highlight : a.id
              if (!id) return
              if (document.getElementById(id) || tries > 25) return window.setTimeout(() => reveal(id), 220)
              tries++
              window.setTimeout(attempt, 120)
            }
            window.setTimeout(attempt, 300)
            break
          }
          case 'setStay':
            setS((x) => ({ ...x, stay: { ...x.stay, ...a.stay, by: 'wiley' } }))
            break
          case 'loadSuites':
            setS((x) => ({ ...x, loadingSuites: true }))
            window.clearTimeout(loadTimer.current)
            loadTimer.current = window.setTimeout(() => setS((x) => ({ ...x, loadingSuites: false })), a.ms)
            break
          case 'expandRates':
            setS((x) => ({ ...x, expanded: a.suite }))
            break
          case 'selectRate':
            setS((x) => {
              const key: RateKey = a.rate === 'Standard' ? (x.signedIn ? 'std-voy' : 'std-non') : a.rate === 'Flexible' ? (x.signedIn ? 'flex-voy' : 'flex-non') : a.rate
              // '@current' is the suite whose rates are open (the favorite unless the family chose another).
              const suite = a.suite === '@current' ? (x.expanded ?? 'pup-den-jr') : a.suite
              return { ...x, selected: { suite, rate: key } }
            })
            break
          case 'addToCart':
            setS((x) => {
              const e = extraById(a.item)
              if (!e || x.cart.some((c) => c.id === e.id)) return x
              // One birthday package and one dining credit per trip: a new one replaces the old.
              const others = x.cart.filter((c) => !(e.group && extraById(c.id)?.group === e.group))
              const line = { id: e.id, label: e.qty ? `${e.name} ${e.qty.label}` : e.name, amount: e.amount, price: e.sample ? `${money(e.amount)}*` : undefined, kind: e.kind, fresh: true }
              return { ...x, cart: [...others.map((c) => ({ ...c, fresh: false })), line] }
            })
            break
          case 'removeFromCart':
            setS((x) => ({ ...x, cart: x.cart.filter((c) => c.id !== a.item) }))
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
          case 'app':
            setS((x) => ({ ...x, app: { ...x.app, ...(typeof a.set === 'function' ? a.set(x.app) : a.set) } }))
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

  const update = useCallback((id: number, patch: Partial<Msg>) => setMsgs((all) => all.map((m) => (m.id === id ? { ...m, ...patch } : m))), [])

  /** Voice: the composer listens (waveform), then the words land in it one by one before the message sends. */
  const speak = useCallback(
    async (text: string, alive: () => boolean) => {
      // A beat first, so the page settles before the mic opens.
      await sleep(600)
      if (!alive()) return false
      setComposer('live')
      await sleep(2400)
      if (!alive()) return false
      setComposer('transcribing')
      const words = text.split(' ')
      for (let i = 1; i <= words.length; i++) {
        setDraft(words.slice(0, i).join(' '))
        await sleep(95)
        if (!alive()) return false
      }
      await sleep(450)
      setDraft('')
      setComposer('idle')
      return alive()
    },
    [sleep],
  )

  /** Thinking: what Wiley is doing, a phrase at a time. The first reply of a turn shows more than a follow-up. */
  const think = useCallback(
    async (phrases: string[], first: boolean, alive: () => boolean) => {
      const list = (phrases.length ? phrases : ['Thinking']).slice(0, first ? 3 : 1)
      for (let i = 0; i < list.length; i++) {
        setThinking(list[i])
        await sleep(i === 0 ? (first ? 1100 : 750) : 900)
        if (!alive()) return false
      }
      return true
    },
    [sleep],
  )

  const play = useCallback(
    async (beats: Beat[]) => {
      const my = ++token.current
      skip.current = false
      wake.current?.()
      playingRef.current = true
      setPlaying(true)
      const alive = () => token.current === my
      const stepThinking = scripts[`${sRef.current.journey}.${stepRef.current}`]?.thinking ?? []
      let firstReply = true
      for (const b of beats) {
        if (!alive()) return
        if (b.type === 'agent' && b.desktopOnly && !deskRef.current) continue
        // A beat with `when` plays only if the trip is in that state when Wiley reaches it.
        if ('when' in b && b.when && !b.when(sRef.current)) continue
        if (b.type === 'user') {
          const text = typeof b.text === 'function' ? b.text(sRef.current) : b.text
          const last = msgsRef.current[msgsRef.current.length - 1]
          if (last?.role === 'user' && last.text === text) continue
          const voice = b.voice === 'mobile' ? !deskRef.current : b.voice
          if (voice) {
            if (!(await speak(text, alive))) return
          } else {
            await sleep(700)
            if (!alive()) return
          }
          push({ role: 'user', text, voice: voice || b.voiceTag?.(sRef.current), reaction: b.reaction })
          await sleep(500)
          firstReply = true
        } else if (b.type === 'wait') {
          await sleep(b.ms)
        } else if (b.type === 'note') {
          await sleep(400)
          if (!alive()) return
          push({ role: 'note', text: b.text })
          await sleep(500)
        } else if (b.type === 'agent') {
          // A person types; Wiley thinks.
          const phrases = b.from === 'staff' ? ['Jordan is typing'] : (b.thinking ?? stepThinking)
          if (!(await think(phrases, b.from === 'staff' ? true : firstReply, alive))) return
          // State-aware lines are read after thinking, so they see what the effects before them changed.
          const text = typeof b.text === 'function' ? b.text(sRef.current) : b.text
          const textMobile = typeof b.textMobile === 'function' ? b.textMobile(sRef.current) : b.textMobile
          setThinking(null)
          const id = push({ role: 'agent', from: b.from, text, textMobile, source: b.source, reveal: 0 })
          // The reply streams in, a few words at a time, at an easy reading pace.
          const words = (deskRef.current ? text : (textMobile ?? text)).split(' ').length
          const steps = Math.max(4, Math.min(28, Math.ceil(words / 2)))
          for (let i = 1; i <= steps; i++) {
            await sleep(Math.min(1700, words * 34) / steps)
            if (!alive()) return update(id, { reveal: undefined })
            update(id, { reveal: i === steps ? undefined : i / steps })
          }
          firstReply = false
          await sleep(250)
        } else if (b.type === 'chips') {
          await sleep(300)
          const options = typeof b.options === 'function' ? b.options(sRef.current) : b.options
          if (options.length) push({ role: 'agent', chips: { style: b.style, options } })
        } else if (b.type === 'card') {
          await sleep(300)
          push({ role: 'agent', card: { component: b.component, props: b.props, then: b.then } })
          await sleep(400)
        } else {
          run(b.actions)
          firstReply = true
        }
      }
      if (alive()) {
        skip.current = false
        setComposer('idle')
        setDraft('')
        setThinking(null)
        playingRef.current = false
        setPlaying(false)
        setTyping(false)
      }
    },
    [push, run, sleep, speak, think, update],
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
      // Journey 3: while a person from the lodge team is in the chat, they answer.
      if (journey === 3 && sRef.current.app.team === 'live') {
        return void play([{ type: 'agent', from: 'staff', text: 'Thanks, give me a moment to check on that for you.' }])
      }
      void play([
        { type: 'agent', text: 'I’m a demo version of Wiley. Try one of these:' },
        { type: 'chips', style: 'ai', options: sc?.fallback ?? [] },
      ])
    },
    [journey, step, play, push],
  )

  const listen = useCallback(() => {
    const line = scripts[`${journey}.${step}`]?.voiceLine ?? 'Show me what you can do'
    const my = token.current
    void speak(line, () => token.current === my).then((ok) => ok && say(line, true))
  }, [journey, step, say, speak])

  const setSnap = useCallback((snap: Snap) => setS((x) => ({ ...x, snap })), [])
  const openWiley = useCallback((snap: Snap = 'half') => setS((x) => ({ ...x, open: true, snap })), [])
  const closeWiley = useCallback(() => setS((x) => ({ ...x, open: false })), [])
  const clearChat = useCallback(() => {
    token.current++
    setMsgs([])
    setTyping(false)
    setPlaying(false)
    playingRef.current = false
    setComposer('idle')
    setThinking(null)
    setDraft('')
  }, [])
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
    setThinking(null)
    setDraft('')
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
    // Joining keeps a rate the family already picked (at the member price); it never picks one for them.
    const had = sRef.current.selected
    const actions: Action[] = [{ do: 'sheet', which: null }, { do: 'signIn' }, { do: 'toast', text: 'Welcome to Voyagers Club' }]
    if (had) actions.push({ do: 'selectRate', suite: had.suite, rate: had.rate.startsWith('flex') ? 'flex-voy' : 'std-voy' })
    run(actions)
    void play(had ? afterJoinWithRate : afterJoinPickRate)
  }, [run, play])

  /** A rate card's Select: the choice shows in the chat as the family's message, and Wiley answers it. */
  const chooseRate = useCallback(
    (suite: string, key: RateKey) => {
      const sc = scripts[`${journey}.${step}`]
      if (!sc?.onRate) return patch({ selected: { suite, rate: key } })
      const r = rateOf(suite, key)
      const who = r.member ? (sRef.current.signedIn ? 'at our Voyagers Club rate' : 'at the Voyagers Club rate') : 'as a guest'
      setS((x) => ({ ...x, open: true, snap: x.snap === 'peek' ? 'half' : x.snap }))
      push({ role: 'user', text: `${r.plan} ${who}, please` })
      void play(sc.onRate(key))
    },
    [journey, step, patch, push, play],
  )

  const toggleExtra = useCallback(
    (id: string) => {
      const e = extraById(id)
      if (!e) return
      const added = !sRef.current.cart.some((c) => c.id === id)
      run([{ do: added ? 'addToCart' : 'removeFromCart', item: id }])
      const sc = scripts[`${journey}.${step}`]
      if (!sc?.onExtra) return
      setS((x) => ({ ...x, open: true, snap: x.snap === 'peek' ? 'half' : x.snap }))
      push({ role: 'user', text: added ? `Add ${e.short ?? e.name}` : `Remove ${e.short ?? e.name}` })
      void play(sc.onExtra(id, added))
    },
    [journey, step, run, push, play],
  )

  const changeStay = useCallback(
    (next: Partial<Stay>, what: 'dates' | 'guests' | 'clear') => {
      const stay = { ...sRef.current.stay, ...next, by: 'you' as const }
      const party = partySize(stay)
      // The "Sleeps N+" filter chip follows the guests.
      setS((x) => ({ ...x, stay, filters: x.filters.map((f) => (f.startsWith('Sleeps ') ? `Sleeps ${party}+` : f)), open: true, snap: x.snap === 'peek' ? 'half' : x.snap }))
      // On the suites list (not once it's the Trip Builder), the list reloads for the new stay.
      const onList = (journey === 1 ? [2, 3] : [2, 5]).includes(stepRef.current) && !sRef.current.selected
      if (onList && what !== 'clear') run([{ do: 'loadSuites', ms: 900 }])
      push({ role: 'user', text: what === 'dates' ? `Change our dates to ${longDates(stay)}` : what === 'clear' ? 'Clear our dates' : `We’re ${guestsLong(stay)}` })
      // No chips after it: the step's suggestions may point at suites the change just hid.
      void play(stayReply(what))
    },
    [journey, run, push, play],
  )

  const movePlanItem = useCallback(
    (id: string, day: 'fri' | 'sat' | 'sun', time: string, reply: string) => {
      setS((x) => ({ ...x, planEdits: { ...x.planEdits, [id]: { day, time } }, planDay: day }))
      // Only when Wiley isn't mid-script: a move never interrupts what it's saying.
      if (!playingRef.current) void play([{ type: 'agent', text: reply, thinking: ['Updating your plan'] }])
    },
    [play],
  )

  const tapBanner = useCallback(() => {
    const b = sRef.current.app.banner
    if (!b) return
    run([{ do: 'app', set: { banner: null, tab: b.to.tab, screen: b.to.screen ?? null, sheet: false } }])
    if (b.then) void play(b.then)
  }, [run, play])

  const ask = useCallback(
    (opt: Option) => {
      if (sRef.current.app.tab !== 'chat') run([{ do: 'app', set: { sheet: true } }])
      push({ role: 'user', text: opt.say ?? opt.label })
      void play(opt.then)
    },
    [run, push, play],
  )

  const payApple = useCallback(() => {
    run([{ do: 'sheet', which: null }])
    go('j1/6')
  }, [run, go])

  const next = useCallback(() => {
    if (sRef.current.sheet === 'join') return joinVoyagers()
    if (sRef.current.sheet === 'apple') return payApple()
    if (sRef.current.sheet === 'share' || sRef.current.sheet === 'plan') return run([{ do: 'sheet', which: null }])
    if (sRef.current.app.banner && !playingRef.current) return tapBanner()
    if (playingRef.current) {
      skip.current = true
      wake.current?.()
      return
    }
    const sc = scripts[`${journey}.${step}`]
    const last = [...msgsRef.current].reverse().find((m) => m.chips)
    if (last?.chips && sc?.path) {
      const opt = last.chips.options.find((o) => sc.path!.includes(o.key ?? o.label))
      if (opt) return pick(last.id, opt)
    }
    const waiting = [...msgsRef.current].reverse().find((m) => m.card && !m.card.done)
    if (waiting?.card?.component === 'questions') {
      return submitCard(waiting.id, { weekend: sRef.current.stay.start ? undefined : 'Mar 5 – 7', priority: 'bunks' })
    }
    if (waiting?.card?.component === 'capture') {
      return submitCard(waiting.id, { to: 'you@example.com' })
    }
    if (waiting?.card && sc?.cardDefaults && waiting.card.component in sc.cardDefaults) {
      return submitCard(waiting.id, sc.cardDefaults[waiting.card.component])
    }
    if (step >= STEPS) return setEndCard(journey === 1 ? 'companion' : journey === 2 ? 'plan' : 'stay')
    goStep(step + 1)
  }, [journey, step, pick, submitCard, goStep, joinVoyagers, payApple, run, tapBanner])

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
      else if (e.key === '3') startJourney(3)
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
      thinking,
      draft,
      playing,
      composer,
      desktop: framed ? false : desktop,
      framed,
      roomyNav: w >= 1180,
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
      chooseRate,
      toggleExtra,
      tapBanner,
      ask,
      changeStay,
      movePlanItem,
      payApple,
      listen,
      pick,
      submitCard,
      setSnap,
      toggleWiley,
      clearChat,
      closeWiley,
      openWiley,
      next,
      back,
      goStep,
      startJourney,
      reset,
      go,
    }),
    [s, step, journey, msgs, typing, thinking, draft, playing, composer, desktop, framed, w, deviceMode, setDeviceMode, barHidden, endCard, patch, run, say, play, joinVoyagers, chooseRate, toggleExtra, tapBanner, ask, changeStay, movePlanItem, payApple, listen, pick, submitCard, setSnap, toggleWiley, clearChat, closeWiley, openWiley, next, back, goStep, startJourney, reset, go],
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
    { id: 'suite', label: `${suite.name.replace(/ Suite$/, '')}, ${nights} nights`, detail: rate.plan, amount: base, price: undefined as string | undefined },
    { id: 'passes', label: 'Water park passes', detail: '', amount: 0, price: undefined as string | undefined },
    ...s.cart.map((c) => ({ id: c.id, label: c.label, detail: c.fresh ? 'Just added' : '', amount: c.amount, price: c.price })),
  ]
  const total = Math.round((base + s.cart.reduce((n, c) => n + c.amount, 0)) * 100) / 100
  /** Some lines use sample prices (the lodge lists none); they're starred. */
  const sample = s.cart.some((c) => c.price)
  return { lines, total, rate, suite, sample }
}
