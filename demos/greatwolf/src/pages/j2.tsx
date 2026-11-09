import { useEffect, useState } from 'react'
import { ElementSpotlight } from '@anvil/components/agent/element-spotlight'
import { Badge } from '@anvil/components/ui/badge'
import { Button } from '@anvil/components/ui/button'
import { Card } from '@anvil/components/ui/card'
import { ArrowLeftIcon, ArrowUpIcon, CalendarIcon, CheckIcon, ChevronRightIcon, Icon, MicIcon, PlusIcon, SparklesIcon, UsersIcon } from '@anvil/components/ui/icon'
import { cn } from '@anvil/lib/utils'
import { activityById, lodge, moreWaterPark, nearby, waterPark, WATER } from '~/data/fixtures'
import { Photo, WileyAvatar, WileyTag } from '~/components/local/Brand/Brand'
import { AiChip } from '~/components/local/WileyCards/WileyCards'
import { useDemo } from '~/state/demo'
import { Page, Title } from './shared'

const PROMPT = 'A weekend in March with a 3 and 6 year old'

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
  const dayPass = () => {
    openWiley('half')
    void play([
      { type: 'user', text: 'Day pass or overnight?' },
      { type: 'agent', text: 'Day passes are an option, but every overnight suite includes water park passes for 3 days. Want me to find a suite that fits?' },
      { type: 'chips', style: 'ai', options: [{ label: 'Which suite fits us?', then: [{ type: 'effect', actions: [{ do: 'go', to: 'j2/2' }] }] }] },
    ])
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
  const widget = (
    <Card className="gap-4 rounded-3xl p-5">
      <h1 className={cn('gwl-display leading-tight', desktop ? 'text-3xl' : 'text-2xl')}>Welcome to Great Wolf Lodge – {lodge.city}</h1>
      <p className="type-text-md-normal text-muted-foreground">Tell Wiley what you need. It finds the right suite and plans things to do here.</p>
      <div role="tablist" aria-label="How to search" className="flex flex-wrap gap-2">
        {tabBtn('dates', 'Dates & guests')}
        {tabBtn('describe', 'Describe your trip')}
      </div>
      {tab === 'describe' ? (
        <>
          <div className="flex flex-col gap-3 rounded-2xl border-2 border-foreground bg-background p-4">
            <div className="flex items-start gap-3">
              <WileyAvatar size={28} />
              <p className={cn('min-h-12 flex-1 type-text-md-normal', !done && 'gwl-caret')} aria-label="Your trip">
                {typed}
              </p>
            </div>
            <div className="flex justify-end gap-2">
              <Button shape="circle" size="icon" aria-label="Talk to Wiley" onClick={() => go('j2/2')}>
                <Icon icon={MicIcon} />
              </Button>
              <Button shape="circle" size="icon" variant="outline" intent="neutral" aria-label="Send to Wiley" onClick={() => go('j2/2')}>
                <Icon icon={ArrowUpIcon} />
              </Button>
            </div>
          </div>
          <div className="flex flex-wrap gap-2">
            <AiChip onClick={() => go('j2/2')}>Which suite fits us?</AiChip>
            <AiChip onClick={() => go('j2/4')}>Things to do nearby</AiChip>
            <AiChip onClick={() => go('j2/3')}>Good for a 3-year-old?</AiChip>
            <AiChip onClick={dayPass}>Day pass or overnight?</AiChip>
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
    </Card>
  )
  const popular = ['Indoor Water Park', 'Themed Suites', 'MagiQuest', 'Things to do nearby']
  return (
    <Page className="pb-24" wide>
      {desktop ? (
        <div className="grid grid-cols-[1.2fr_1fr] items-stretch gap-6">
          <Photo label="Hero video · Colorado Springs lodge" tone="lake" className="min-h-96 rounded-3xl" />
          {widget}
        </div>
      ) : (
        <>
          <Photo label="Hero video · Colorado Springs lodge" tone="lake" className="h-40 rounded-3xl" />
          {widget}
        </>
      )}
      <section aria-labelledby="popular" className="flex flex-col gap-3">
        <h2 id="popular" className="type-text-xs-semibold tracking-wide text-muted-foreground uppercase">
          Popular at this lodge
        </h2>
        <div className={cn('gap-3', desktop ? 'grid grid-cols-4' : 'gwl-noscroll -mx-4 flex overflow-x-auto px-4')}>
          {popular.map((p, i) => (
            <Photo key={p} label={p} tone={(['lake', 'den', 'dusk', 'forest'] as const)[i]} className={cn('h-32 rounded-2xl', !desktop && 'w-56 shrink-0')} />
          ))}
        </div>
      </section>
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
            <Card className={cn('gap-0 overflow-hidden rounded-2xl p-0', s.dim.includes(a.id) && 'opacity-45')}>
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
      <section aria-labelledby="more-wp" className="flex flex-col gap-2">
        <h2 id="more-wp" className="type-text-xs-semibold tracking-wide text-muted-foreground uppercase">
          More in the water park
        </h2>
        <div className="flex flex-wrap gap-2">
          {moreWaterPark.map((n) => (
            <Badge key={n} variant="outline" className="rounded-full px-3">
              {n}
            </Badge>
          ))}
        </div>
        <p className="type-text-xs-normal text-muted-foreground">Source: {WATER}.</p>
      </section>
    </Page>
  )
}

/** J2·4: things to do around the lodge, filtered by Wiley for kids aged 3 and 6. */
export function J2ThingsToDo() {
  const { s, desktop, run } = useDemo()
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
      <ul className={cn('grid gap-3', desktop ? 'grid-cols-2' : 'grid-cols-1')}>
        {list.map((a) => {
          const hi = filtered && (a.fit === 'great' || a.fit === 'free')
          const dim = filtered && (a.fit === 'older' || a.fit === 'no')
          const inPlan = s.ideas.includes(a.id)
          return (
            <li key={a.id} id={`act-${a.id}`} className="scroll-mt-4">
              <Card className={cn('flex-row items-center gap-3 rounded-2xl p-3 transition-opacity', hi && 'gwl-pulse ring-2 ring-primary', dim && 'opacity-45')}>
                <Photo label={a.name} tone={a.fit === 'free' ? 'dusk' : 'forest'} className="size-20 shrink-0 rounded-xl [&>span]:hidden" />
                <div className="flex min-w-0 flex-1 flex-col gap-0.5">
                  <span className="type-text-md-semibold">{a.name}</span>
                  <span className="type-text-xs-normal text-muted-foreground">{a.blurb}</span>
                  {inPlan ? (
                    <span className="mt-1 inline-flex items-center gap-1 type-text-xs-semibold text-success-medium dark:text-success">
                      <Icon icon={CheckIcon} size="xs" /> In your plan
                    </span>
                  ) : (
                    !dim && (
                      <button type="button" className="mt-1 inline-flex w-fit items-center gap-1 type-text-xs-semibold text-[var(--gwl-teal)] underline-offset-2 hover:underline" onClick={() => run([{ do: 'addToPlan', item: a.id }, { do: 'toast', text: 'Added to your plan' }])}>
                        <Icon icon={PlusIcon} size="xs" /> Add to plan
                      </button>
                    )
                  )}
                </div>
                <Badge variant={hi ? 'default' : 'subtle'} size="sm" className="shrink-0">
                  {a.tag}
                </Badge>
              </Card>
            </li>
          )
        })}
      </ul>
      <p className="type-text-xs-normal text-muted-foreground">From the GWL Things To Do guide.</p>
    </Page>
  )
}

/** J2·6: the plan Wiley saved, with booking and sharing on the page itself. */
export function J2SavedPlan() {
  const { s, run } = useDemo()
  const things = [
    { id: 'cub-paw', name: 'Cub Paw Pool', where: 'In the lodge', note: 'Included' },
    ...s.ideas.map((id) => {
      const a = activityById(id)!
      return { id, name: a.name, where: 'Near the lodge', note: id === 'zoo' ? 'Sunday morning' : a.tag }
    }),
  ]
  return (
    <Page>
      <Title tag={<WileyTag>Saved by Wiley</WileyTag>}>Your plan</Title>
      <Card className="gap-3 rounded-2xl p-5">
        <p className="gwl-display text-lg">Junior Wolf Pup Den Suite · {s.weekend}</p>
        <p className="type-text-sm-normal text-muted-foreground">2 adults, 2 kids (3, 6) · water park passes included · from $119 / night</p>
        <div className="flex flex-col gap-2 sm:flex-row">
          <Button shape="pill" size="lg" className="flex-1" onClick={() => run([{ do: 'end', card: 'checkout' }])}>
            Book now
          </Button>
          <Button shape="pill" size="lg" variant="outline" intent="neutral" className="flex-1" onClick={() => run([{ do: 'sheet', which: 'share' }])}>
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
            <li key={t.id} className="flex items-center gap-3 rounded-2xl border bg-background p-3">
              <Photo label={t.name} tone={t.where === 'In the lodge' ? 'lake' : 'forest'} className="size-14 shrink-0 rounded-lg [&>span]:hidden" />
              <span className="flex min-w-0 flex-1 flex-col">
                <span className="type-text-sm-semibold">{t.name}</span>
                <span className="type-text-xs-normal text-muted-foreground">{t.where}</span>
              </span>
              <Badge variant="subtle" size="sm">
                {t.note}
              </Badge>
            </li>
          ))}
        </ul>
        {s.ideas.length === 0 && <p className="type-text-sm-normal text-muted-foreground">Ask Wiley for things to do near the lodge and they’ll show up here.</p>}
      </section>
    </Page>
  )
}
