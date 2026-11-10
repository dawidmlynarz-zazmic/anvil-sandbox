import { useEffect, useRef, useState } from 'react'
import { ElementSpotlight } from '@anvil/components/agent/element-spotlight'
import { PromptInput } from '@anvil/components/agent/prompt-input'
import { Badge } from '@anvil/components/ui/badge'
import { Button } from '@anvil/components/ui/button'
import { Card } from '@anvil/components/ui/card'
import { ArrowLeftIcon, CalendarIcon, CheckIcon, ChevronDownIcon, ChevronRightIcon, EyeIcon, Icon, SparklesIcon, TagIcon, UsersIcon } from '@anvil/components/ui/icon'
import { cn } from '@anvil/lib/utils'
import { dates, lodge, money, nearby, waterPark } from '~/data/fixtures'
import { art, photos } from '~/data/photos'
import { Photo, WileyAvatar, WileyTag } from '~/components/local/Brand/Brand'
import { AiChip } from '~/components/local/WileyCards/WileyCards'
import { j2Plan, savedPlan } from '~/state/plan'
import { quoteOf, useDemo } from '~/state/demo'
import { usePageWide } from '~/state/layout'
import type { Beat } from '~/wiley/types'
import { Page, Popular, Title } from './shared'
import { WeekendPlan } from './weekend'

const PROMPT = 'A weekend in March with a 3 and 6 year old'

/** Sample requests that type, hold, erase and loop in the trip field. The first is the one Wiley's script answers. */
const SAMPLES = [
  PROMPT,
  'A birthday party for an 8-year-old and 6 friends',
  'Spring break with the grandparents and three kids',
  'Which suite has bunk beds for two kids?',
  'Things to do near the lodge with a toddler',
  'Cheapest weekend in April for a family of five',
]

/** Types each sample out, holds it, erases it and moves on. Under reduced motion it just swaps them. */
function useTypewriter(samples: string[], running: boolean) {
  const [text, setText] = useState('')
  useEffect(() => {
    if (!running) return
    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    let i = 0
    let pos = 0
    let phase: 'type' | 'hold' | 'erase' | 'pause' = 'type'
    let timer = 0
    const tick = () => {
      const s = samples[i]
      if (reduced) {
        setText(s)
        i = (i + 1) % samples.length
        timer = window.setTimeout(tick, 3200)
        return
      }
      if (phase === 'type') {
        pos++
        setText(s.slice(0, pos))
        if (pos >= s.length) phase = 'hold'
        timer = window.setTimeout(tick, phase === 'hold' ? 2000 : 42)
      } else if (phase === 'hold') {
        phase = 'erase'
        timer = window.setTimeout(tick, 22)
      } else if (phase === 'erase') {
        pos--
        setText(s.slice(0, pos))
        if (pos <= 0) phase = 'pause'
        timer = window.setTimeout(tick, phase === 'pause' ? 450 : 22)
      } else {
        i = (i + 1) % samples.length
        phase = 'type'
        timer = window.setTimeout(tick, 42)
      }
    }
    timer = window.setTimeout(tick, 300)
    return () => window.clearTimeout(timer)
  }, [samples, running])
  return text
}

const BEST_DEAL: Beat[] = [
  { type: 'user', text: 'What’s the best deal for my stay?' },
  {
    type: 'agent',
    text: 'Voyagers Club rates are the lowest for each suite, and joining is free. Tell me your weekend and who’s coming, and I’ll show you the member rate next to each suite.',
  },
  { type: 'chips', style: 'ai', options: [{ label: 'Suite for my family vacation', then: [{ type: 'effect', actions: [{ do: 'go', to: 'j2/2' }] }] }] },
]

/** The three-arc wave mark greatwolf.com sets under the hero's welcome line. */
function Wave() {
  return (
    <svg aria-hidden viewBox="0 0 76 14" className="h-3.5 w-[76px] text-[#7cc0fe]" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round">
      <path d="M2 3c4 9 18 9 22 0M27 3c4 9 18 9 22 0M52 3c4 9 18 9 22 0" />
    </svg>
  )
}

/** A field in the style of greatwolf.com's booking bar: a label over a white box with a blue outline. */
function Field({ label, icon, value, className }: { label: string; icon: typeof CalendarIcon; value: string; className?: string }) {
  return (
    <div className={cn('flex min-w-0 flex-col gap-1.5', className)}>
      <span className="type-text-md-medium text-foreground">{label}</span>
      <span className="flex h-14 items-center gap-3 rounded-[4px] border-[1.5px] border-[var(--border-action)] bg-background px-4 type-text-md-medium text-foreground">
        <Icon icon={icon} />
        <span className="flex-1 truncate">{value}</span>
        {icon !== TagIcon && <Icon icon={ChevronDownIcon} />}
      </span>
    </div>
  )
}

/** J2·1: the lodge home for a first-time visitor. The hero's centre is the trip field; dates & guests is the site's form. */
export function J2Landing() {
  const { go, openWiley, play, patch } = useDemo()
  const desktop = usePageWide()
  const [tab, setTab] = useState<'dates' | 'describe'>('describe')
  // Anvil's extended Prompt Input, in Great Wolf's styling. Sample requests rotate in it (as its placeholder) until the
  // visitor focuses or types. Sending an empty field sends the request Wiley's script answers; their own words are
  // carried into the chat. Voice plays in place: listening, then the words transcribe, a pause, then Wiley opens.
  const [phase, setPhase] = useState<'idle' | 'listening' | 'transcribing' | 'sending'>('idle')
  const [value, setValue] = useState('')
  const [focused, setFocused] = useState(false)
  const idle = phase === 'idle' && !focused && value === ''
  const sample = useTypewriter(SAMPLES, tab === 'describe' && idle)
  const timers = useRef<number[]>([])
  useEffect(() => () => timers.current.forEach((x) => window.clearTimeout(x)), [])
  const later = (fn: () => void, ms: number) => timers.current.push(window.setTimeout(fn, ms))
  const send = (voice = false) => {
    if (phase === 'sending') return
    const text = value.trim()
    if (!text) setValue(PROMPT)
    patch({ tripText: text || null, tripVoice: voice })
    setPhase('sending')
    later(() => go('j2/2'), voice ? 900 : 600)
  }
  const transcribe = () => {
    setPhase('transcribing')
    const words = PROMPT.split(' ')
    words.forEach((_, i) => later(() => setValue(words.slice(0, i + 1).join(' ')), 110 * (i + 1)))
    later(() => send(true), 110 * words.length + 700)
  }
  const voice = () => {
    if (phase === 'listening') {
      // Tapping the mic again ends listening early.
      timers.current.forEach((x) => window.clearTimeout(x))
      timers.current = []
      return transcribe()
    }
    if (phase !== 'idle') return
    setValue('')
    setPhase('listening')
    later(transcribe, 2600)
  }
  const bestDeal = () => {
    openWiley('half')
    void play(BEST_DEAL)
  }
  const tabBtn = (key: 'dates' | 'describe', label: string) => (
    <button
      type="button"
      role="tab"
      aria-selected={tab === key}
      onClick={() => setTab(key)}
      className={cn(
        '-mb-px inline-flex items-center gap-1.5 border-b-[3px] px-1 pb-2 whitespace-nowrap outline-none focus-visible:focus-ring',
        desktop ? 'type-text-md-semibold' : 'type-text-sm-semibold',
        tab === key ? 'border-[var(--gwl-navy)] text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground',
      )}
    >
      {key === 'describe' && <Icon icon={SparklesIcon} size="xs" />}
      {label}
    </button>
  )
  const panel = (
    <div className="w-full rounded-[4px] bg-[#ffffffeb] p-5 text-left text-foreground shadow-xl backdrop-blur dark:bg-[#071828eb]" role="region" aria-label="Plan your stay">
      <div role="tablist" aria-label="How to search" className={cn('mb-5 flex border-b border-[var(--gwl-hairline)]', desktop ? 'gap-6' : 'gap-4')}>
        {tabBtn('describe', 'Describe your trip')}
        {tabBtn('dates', 'Dates & guests')}
      </div>
      {tab === 'describe' ? (
        <div className="flex flex-col gap-4">
          <div className="flex flex-col gap-1.5">
            <span id="trip-label" className="type-text-md-medium">
              Tell Wiley about your trip
            </span>
            <PromptInput
              aria-labelledby="trip-label"
              className="gwl-hero-input"
              value={value}
              onValueChange={(v) => phase === 'idle' && setValue(v)}
              onFocus={() => setFocused(true)}
              onBlur={() => setFocused(false)}
              placeholder={phase === 'listening' ? 'Listening…' : idle ? sample : 'Dates, who’s coming, what matters most…'}
              listening={phase === 'listening'}
              status={phase === 'sending' ? 'streaming' : 'idle'}
              onVoice={voice}
              canSendEmpty
              onSubmit={() => send()}
              leading={
                <span className="flex items-center gap-2 ps-1 type-text-sm-semibold text-foreground" aria-hidden>
                  <WileyAvatar size={26} />
                  {phase === 'listening' ? 'Listening…' : phase === 'transcribing' ? 'Got it' : phase === 'sending' ? 'Opening Wiley…' : 'Wiley'}
                </span>
              }
            />
            <span id="trip-hint" className="sr-only">
              For example: {PROMPT}
            </span>
          </div>
          <div className={cn('flex flex-wrap gap-2', desktop && 'justify-center')}>
            <AiChip onClick={bestDeal}>What’s the best deal for my stay?</AiChip>
            <AiChip onClick={() => go('j2/2')}>Suite for my family vacation</AiChip>
            <AiChip onClick={() => go('j2/4')}>Things to do nearby</AiChip>
          </div>
        </div>
      ) : (
        <div className={cn('flex gap-4', desktop ? 'items-end' : 'flex-col')}>
          <Field label="Check-In / Check-Out" icon={CalendarIcon} value="Select dates" className={desktop ? 'min-w-44 flex-[1.3]' : ''} />
          <Field label="Guests" icon={UsersIcon} value="2 Guests" className={desktop ? 'min-w-36 flex-1' : ''} />
          <Field label="Promo Code" icon={TagIcon} value="" className={desktop ? 'min-w-28 flex-[0.8]' : ''} />
          <div className={cn('flex shrink-0 gap-3', !desktop && 'pt-1')}>
            <Button shape="pill" className="h-14 flex-1 px-7 text-base" onClick={() => go('j2/2')}>
              Book Now
            </Button>
            <Button shape="pill" variant="outline" intent="neutral" className="h-14 flex-1 px-6 text-base" onClick={() => setTab('describe')}>
              <Icon icon={SparklesIcon} /> Plan With AI
            </Button>
          </div>
        </div>
      )}
    </div>
  )
  return (
    <div className="pb-24">
      <section aria-labelledby="hero-title" className="relative isolate text-[#ffffff]">
        {/* The photo is a fixed-height band; the trip panel overlaps its bottom edge, as the booking bar does on greatwolf.com. */}
        <div aria-hidden className={cn('absolute inset-x-0 top-0 -z-10 overflow-hidden bg-[#072745]', desktop ? 'h-[520px]' : 'h-[440px]')}>
          <img src={photos.waterpark} alt="" className="h-full w-full object-cover" />
          {/* Navy wash so the white headline reads over a bright photo. */}
          <div className="absolute inset-0 bg-[linear-gradient(180deg,rgb(7_39_69/0.6)_0%,rgb(7_39_69/0.55)_45%,rgb(7_39_69/0.75)_100%)]" />
        </div>
        <div className={cn('mx-auto flex max-w-6xl flex-col items-center text-center', desktop ? 'gap-5 px-8 pt-16 pb-4' : 'gap-4 px-4 pt-10 pb-2')}>
          <p className={cn('[text-shadow:0_1px_8px_rgb(0_0_0/0.35)]', desktop ? 'type-text-lg-medium' : 'type-text-sm-medium')}>Welcome to Great Wolf Lodge – {lodge.city}</p>
          <Wave />
          <h1 id="hero-title" className={cn('gwl-display uppercase leading-[0.95] text-[#ffffff] [text-shadow:0_2px_18px_rgb(0_0_0/0.35)]', desktop ? 'text-[64px]' : 'text-[34px]')}>
            Great family adventure made easy
          </h1>
          <p className={cn('max-w-xl text-[#ffffff] [text-shadow:0_1px_8px_rgb(0_0_0/0.45)]', desktop ? 'type-text-lg-normal' : 'type-text-sm-normal')}>Tell Wiley what you need. It finds the right suite and plans things to do here.</p>
          <div className={cn('w-full', desktop ? 'mt-4 max-w-5xl' : 'mt-2')}>{panel}</div>
        </div>
      </section>
      {/* On a phone the hero is the page; the tiles would only push the field around. */}
      {desktop && (
        <Page>
          <Popular />
        </Page>
      )}
    </div>
  )
}

/** J2·3: Wiley walks the page to the water park and points at what fits a 3-year-old. */
export function J2WaterPark() {
  const { s, go } = useDemo()
  const desktop = usePageWide()
  return (
    <Page>
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 type-text-sm-medium text-muted-foreground">
        <button type="button" onClick={() => go('j2/2')} className="inline-flex items-center gap-1 underline-offset-2 hover:underline">
          <Icon icon={ArrowLeftIcon} size="xs" /> Back to suites
        </button>
        <span aria-hidden>/</span> Explore <Icon icon={ChevronRightIcon} size="xs" /> <span className="text-foreground">Water Park</span>
      </nav>
      <Title>Explore our Indoor Water Park</Title>
      <div className={cn('grid gap-x-5', desktop ? 'grid-cols-3' : 'grid-cols-1')}>
        {waterPark.map((a) => {
          const card = (
            <Card className={cn('h-full gap-0 overflow-hidden rounded-2xl p-0 transition-opacity', s.dim.includes(a.id) && 'opacity-45')}>
              <Photo icon={art[a.id]} label={a.name} tone={a.id === 'cub-paw' ? 'lake' : a.id === 'fort-mackenzie' ? 'den' : 'dusk'} className="h-40" />
              <div className="flex flex-col gap-1 p-4">
                <span className="type-text-xs-semibold text-muted-foreground">{a.kind}</span>
                <span className="gwl-display text-lg">{a.name}</span>
                {a.blurb && <span className="type-text-sm-normal text-muted-foreground">{a.blurb}</span>}
              </div>
            </Card>
          )
          return (
            <div key={a.id} id={`att-${a.id}`} className="flex scroll-mt-10 flex-col pt-7 [&>*]:flex-1">
              {s.spotlight === a.id ? (
                <ElementSpotlight status="referenced" label="Wiley is showing you this" className="gwl-pulse rounded-2xl [&>[data-slot=card]]:h-full">
                  {card}
                </ElementSpotlight>
              ) : (
                card
              )}
            </div>
          )
        })}
      </div>
    </Page>
  )
}

/** J2·4: things to do around the lodge, filtered by Wiley for kids aged 3 and 6. */
export function J2ThingsToDo() {
  const { s } = useDemo()
  const desktop = usePageWide()
  const filtered = s.highlight === 'nearby'
  const list = nearby.filter((a) => a.id !== 'wolf-center')
  return (
    <Page>
      <Title tag={filtered ? <WileyTag>Filtered by Wiley</WileyTag> : undefined}>Things to do around the lodge</Title>
      {filtered && (
        <div className="gwl-in flex flex-wrap gap-2">
          <Badge variant="outline" className="h-9 rounded-full px-3.5">
            Kids 3 and 6 <Icon icon={CheckIcon} />
          </Badge>
          <Badge variant="outline" className="h-9 rounded-full px-3.5">
            Free
          </Badge>
          <Badge variant="outline" className="h-9 rounded-full px-3.5">
            Half day
          </Badge>
        </div>
      )}
      <ul className="flex flex-col gap-3">
        {list.map((a) => {
          const hi = filtered && (a.fit === 'great' || a.fit === 'free')
          const dim = filtered && (a.fit === 'older' || a.fit === 'no')
          return (
            <li key={a.id} id={`act-${a.id}`} className="scroll-mt-4">
              <Card className={cn('flex-row items-center gap-4 rounded-2xl p-3 transition-opacity', hi && 'gwl-pulse ring-2 ring-primary', dim && 'opacity-45')}>
                <Photo icon={art[a.id]} label={a.name} tone={a.fit === 'free' ? 'dusk' : a.fit === 'ok' ? 'den' : 'forest'} className={cn('shrink-0 rounded-xl', desktop ? 'h-20 w-24' : 'size-16')} />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="type-text-md-semibold">{a.name}</span>
                  <span className="type-text-xs-normal text-muted-foreground">{a.blurb}</span>
                </div>
                <Badge variant={hi ? 'default' : 'subtle'} size="sm" className="shrink-0">
                  {a.tag}
                </Badge>
              </Card>
            </li>
          )
        })}
      </ul>
    </Page>
  )
}

/** J2·6: the weekend Wiley saved, by day, built from the trip. Not booked yet: book, preview the link or share it. */
export function J2SavedPlan() {
  const { s, run } = useDemo()
  const desktop = usePageWide()
  const p = savedPlan(s)
  const q = quoteOf(s)
  const trip = (
    <Card className={cn('gap-0 overflow-hidden rounded-2xl p-0', desktop && 'flex-row')}>
      <Photo src={p.photo} label={p.suite.name} className={cn('shrink-0', desktop ? 'w-56' : 'h-36')} />
      <div className="flex min-w-0 flex-1 flex-col gap-2 p-4">
        <p className="gwl-display text-lg leading-tight">{p.suite.name}</p>
        <p className="type-text-sm-normal text-muted-foreground">
          {p.weekend.long} · {p.guests}
        </p>
        <p className="type-text-sm-semibold">{p.rateLine}</p>
        {p.extras.length > 0 && (
          <ul className="flex flex-wrap gap-1.5" aria-label="Added to your trip">
            {p.extras.map((x) => (
              <li key={x.id}>
                <Badge variant="subtle" size="sm">
                  {x.name}
                </Badge>
              </li>
            ))}
          </ul>
        )}
        <div className="mt-1 flex flex-wrap items-center justify-between gap-3">
          {q ? (
            <p className="type-text-sm-normal">
              Trip total <span className="type-text-md-semibold">{money(q.total)}</span>
              {q.sample && <span className="text-muted-foreground"> · includes sample prices</span>}
            </p>
          ) : (
            <span />
          )}
          <div className="flex gap-2">
            <Button shape="pill" size="sm" variant="outline" intent="neutral" onClick={() => run([{ do: 'sheet', which: 'plan' }])}>
              <Icon icon={EyeIcon} /> Preview link
            </Button>
            <Button shape="pill" size="sm" variant="outline" intent="neutral" onClick={() => run([{ do: 'sheet', which: 'share' }])}>
              Share
            </Button>
          </div>
        </div>
      </div>
    </Card>
  )
  const iso = p.weekend === dates.j2b ? { fri: '2027-03-12', sat: '2027-03-13', sun: '2027-03-14' } : { fri: '2027-03-05', sat: '2027-03-06', sun: '2027-03-07' }
  return (
    <WeekendPlan
      plan={j2Plan(s)}
      title={`Your weekend · ${p.weekend.short}`}
      tag={<WileyTag>Saved by Wiley</WileyTag>}
      primary={
        <Button shape="pill" onClick={() => run([{ do: 'end', card: 'checkout' }])}>
          Book now
        </Button>
      }
      lead={trip}
      iso={iso}
      printWhen={p.weekend.long}
      printWho={`${p.guests} · ${p.suite.name}`}
      file="great-wolf-weekend.ics"
    />
  )
}
