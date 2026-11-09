import { useEffect, useState } from 'react'
import { ElementSpotlight } from '@anvil/components/agent/element-spotlight'
import { Badge } from '@anvil/components/ui/badge'
import { Button } from '@anvil/components/ui/button'
import { Card } from '@anvil/components/ui/card'
import { ArrowLeftIcon, ArrowUpIcon, CalendarIcon, CheckIcon, ChevronRightIcon, Icon, MicIcon, SparklesIcon, UsersIcon } from '@anvil/components/ui/icon'
import { cn } from '@anvil/lib/utils'
import { activityById, lodge, nearby, waterPark } from '~/data/fixtures'
import { Photo, WileyAvatar, WileyTag } from '~/components/local/Brand/Brand'
import { AiChip } from '~/components/local/WileyCards/WileyCards'
import { useDemo } from '~/state/demo'
import type { Beat } from '~/wiley/types'
import { Page, Popular, Title } from './shared'

const PROMPT = 'A weekend in March with a 3 and 6 year old'

const BEST_DEAL: Beat[] = [
  { type: 'user', text: 'What’s the best deal for my stay?' },
  {
    type: 'agent',
    text: 'Voyagers Club rates are the lowest for each suite, and joining is free. Tell me your weekend and who’s coming, and I’ll show you the member rate next to each suite.',
  },
  { type: 'chips', style: 'ai', options: [{ label: 'Suite for my family vacation', then: [{ type: 'effect', actions: [{ do: 'go', to: 'j2/2' }] }] }] },
]

/** J2·1: the lodge landing page for a first-time visitor. "Describe your trip" sits beside the usual dates & guests. */
export function J2Landing() {
  const { desktop, go, openWiley, play } = useDemo()
  const [tab, setTab] = useState<'dates' | 'describe'>('describe')
  const [typed, setTyped] = useState('')
  useEffect(() => {
    if (tab !== 'describe') return
    setTyped('')
    let i = 0
    const t = window.setInterval(() => {
      i++
      setTyped(PROMPT.slice(0, i))
      if (i >= PROMPT.length) window.clearInterval(t)
    }, 38)
    return () => window.clearInterval(t)
  }, [tab])
  const done = typed.length === PROMPT.length
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
        'inline-flex h-9 items-center gap-1.5 rounded-full px-3.5 type-text-sm-semibold outline-none focus-visible:focus-ring',
        key === 'describe' ? 'border border-dashed border-foreground/70' : 'border',
        tab === key ? 'bg-accent' : 'bg-background',
      )}
    >
      {key === 'describe' && <Icon icon={SparklesIcon} size="xs" />}
      {label}
    </button>
  )
  const actions = (
    <div className="flex shrink-0 gap-2">
      <Button shape="circle" size="icon" aria-label="Talk to Wiley" onClick={() => go('j2/2')}>
        <Icon icon={MicIcon} />
      </Button>
      <Button shape="circle" size="icon" variant="outline" intent="neutral" aria-label="Send to Wiley" onClick={() => go('j2/2')}>
        <Icon icon={ArrowUpIcon} />
      </Button>
    </div>
  )
  const text = (
    <p className={cn('min-w-0 flex-1 type-text-md-normal', !done && 'gwl-caret')} aria-label="Your trip">
      {typed}
    </p>
  )
  const widget = (
    <div className="flex flex-col gap-4">
      <h1 className={cn('gwl-display leading-tight', desktop ? 'text-4xl' : 'text-2xl')}>Welcome to Great Wolf Lodge – {lodge.city}</h1>
      <p className="type-text-md-normal text-muted-foreground">Tell Wiley what you need. It finds the right suite and plans things to do here.</p>
      <div role="tablist" aria-label="How to search" className="flex flex-wrap gap-2">
        {tabBtn('dates', 'Dates & guests')}
        {tabBtn('describe', 'Describe your trip')}
      </div>
      {tab === 'describe' ? (
        <>
          {desktop ? (
            <div className="flex items-center gap-3 rounded-full border-2 border-foreground bg-background py-2 ps-5 pe-2">
              {text}
              {actions}
            </div>
          ) : (
            <div className="flex flex-col gap-3 rounded-2xl border-2 border-foreground bg-background p-4">
              <div className="flex items-start gap-3">
                <WileyAvatar size={28} />
                {text}
              </div>
              <div className="flex justify-end">{actions}</div>
            </div>
          )}
          <div className="flex flex-wrap gap-2">
            <AiChip onClick={bestDeal}>What’s the best deal for my stay?</AiChip>
            <AiChip onClick={() => go('j2/2')}>Suite for my family vacation</AiChip>
            <AiChip onClick={() => go('j2/4')}>Things to do nearby</AiChip>
          </div>
        </>
      ) : (
        <div className="flex flex-col gap-3">
          <span className="flex h-12 items-center gap-2 rounded-lg border border-input px-3 type-text-md-normal">
            <Icon icon={CalendarIcon} /> Select dates
          </span>
          <span className="flex h-12 items-center gap-2 rounded-lg border border-input px-3 type-text-md-normal">
            <Icon icon={UsersIcon} /> 2 Guests
          </span>
          <Button shape="pill" size="lg" onClick={() => go('j2/2')}>
            Search
          </Button>
        </div>
      )}
    </div>
  )
  return (
    <Page className="pb-24">
      {desktop ? (
        <Card className="grid grid-cols-[1.15fr_1fr] items-center gap-8 rounded-3xl p-8">
          {widget}
          <Photo label="Hero video · Colorado Springs lodge" tone="lake" className="h-80 rounded-2xl" />
        </Card>
      ) : (
        <Card className="gap-4 rounded-3xl p-4">
          <Photo label="Hero video · Colorado Springs lodge" tone="lake" className="h-36 rounded-2xl" />
          {widget}
        </Card>
      )}
      <Popular />
    </Page>
  )
}

/** J2·3: Wiley walks the page to the water park and points at what fits a 3-year-old. */
export function J2WaterPark() {
  const { s, desktop, go } = useDemo()
  return (
    <Page>
      <nav aria-label="Breadcrumb" className="flex flex-wrap items-center gap-1 type-text-sm-medium text-muted-foreground">
        <button type="button" onClick={() => go('j2/2')} className="inline-flex items-center gap-1 underline-offset-2 hover:underline">
          <Icon icon={ArrowLeftIcon} size="xs" /> Back to suites
        </button>
        <span aria-hidden>/</span> Explore <Icon icon={ChevronRightIcon} size="xs" /> <span className="text-foreground">Water Park</span>
      </nav>
      <Title>Explore our Indoor Water Park</Title>
      <div className={cn('grid gap-5 pt-2', desktop ? 'grid-cols-3' : 'grid-cols-1')}>
        {waterPark.map((a) => {
          const card = (
            <Card className={cn('gap-0 overflow-hidden rounded-2xl p-0 transition-opacity', s.dim.includes(a.id) && 'opacity-45')}>
              <Photo label={a.name} tone={a.id === 'cub-paw' ? 'lake' : a.id === 'fort-mackenzie' ? 'den' : 'dusk'} className="h-40" />
              <div className="flex flex-col gap-1 p-4">
                <span className="type-text-xs-semibold text-muted-foreground">{a.kind}</span>
                <span className="gwl-display text-lg">{a.name}</span>
                {a.blurb && <span className="type-text-sm-normal text-muted-foreground">{a.blurb}</span>}
              </div>
            </Card>
          )
          return (
            <div key={a.id} id={`att-${a.id}`} className="scroll-mt-10">
              {s.spotlight === a.id ? (
                <ElementSpotlight status="referenced" label="Wiley is showing you this" className="gwl-pulse mt-7 rounded-2xl">
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
  const { s, desktop } = useDemo()
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
                <Photo label={a.name} tone={a.fit === 'free' ? 'dusk' : 'forest'} className={cn('shrink-0 rounded-xl [&>span]:hidden', desktop ? 'h-20 w-24' : 'size-16')} />
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

const SUBS: Record<string, { sub: string; tag: string }> = {
  zoo: { sub: 'Near the lodge · Sunday morning', tag: 'Nearby' },
  garden: { sub: 'Near the lodge · free', tag: 'Free' },
}

/** J2·6: the plan Wiley saved, with booking and sharing on the page itself. */
export function J2SavedPlan() {
  const { s, desktop, run } = useDemo()
  const things = [
    { id: 'cub-paw', name: 'Cub Paw Pool', sub: 'In the lodge · kiddie splash pad', tag: 'Included' },
    ...s.ideas.map((id) => {
      const a = activityById(id)!
      return { id, name: a.name, sub: SUBS[id]?.sub ?? 'Near the lodge', tag: SUBS[id]?.tag ?? a.tag }
    }),
  ]
  return (
    <Page>
      <Title tag={<WileyTag>Saved by Wiley</WileyTag>}>Your plan</Title>
      <Card className="gap-3 rounded-2xl p-5">
        <p className="gwl-display text-lg">Junior Wolf Pup Den Suite · {s.weekend}</p>
        <p className="type-text-sm-normal text-muted-foreground">2 adults, 2 kids (3, 6) · water park passes included · from $119 / night</p>
        <div className={cn('flex gap-2', desktop ? 'flex-row' : 'flex-col')}>
          <Button shape="pill" size="lg" onClick={() => run([{ do: 'end', card: 'checkout' }])}>
            Book now
          </Button>
          <Button shape="pill" size="lg" variant="outline" intent="neutral" onClick={() => run([{ do: 'sheet', which: 'share' }])}>
            Share with my partner
          </Button>
        </div>
      </Card>
      <section aria-labelledby="things" className="flex flex-col gap-3">
        <h2 id="things" className="type-text-xs-semibold tracking-wide text-muted-foreground uppercase">
          Things to do
        </h2>
        <ul className="flex flex-col gap-3">
          {things.map((t) => (
            <li key={t.id} className="flex items-center gap-4 rounded-2xl border bg-background p-3">
              <Photo label={t.name} tone={t.id === 'cub-paw' ? 'lake' : 'forest'} className="h-16 w-20 shrink-0 rounded-lg [&>span]:hidden" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="type-text-sm-semibold">{t.name}</span>
                <span className="type-text-xs-normal text-muted-foreground">{t.sub}</span>
              </span>
              <Badge variant="subtle" size="sm">
                {t.tag}
              </Badge>
            </li>
          ))}
        </ul>
      </section>
    </Page>
  )
}
