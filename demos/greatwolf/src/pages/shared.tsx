import type { ReactNode } from 'react'
import { Chip } from '@anvil/components/anvil/chip'
import { Badge } from '@anvil/components/ui/badge'
import { CalendarIcon, Icon, UsersIcon, type LucideIcon } from '@anvil/components/ui/icon'
import { cn } from '@anvil/lib/utils'
import { suiteById, suites } from '~/data/fixtures'
import { art, photos } from '~/data/photos'
import { CompactRates, SuiteCard } from '~/components/local/SuiteCard/SuiteCard'
import { Photo, WileyTag } from '~/components/local/Brand/Brand'
import { useDemo } from '~/state/demo'
import { usePageWide } from '~/state/layout'
import type { PlanItem } from '~/wiley/types'

/** The page column: full width on mobile, a shared max width on desktop. */
export function Page({ children, className, wide }: { children: ReactNode; className?: string; wide?: boolean }) {
  const desktop = usePageWide()
  return <div className={cn('gwl-page mx-auto flex w-full flex-col gap-5', desktop ? cn('px-8 py-8', wide ? 'max-w-7xl' : 'max-w-6xl') : 'px-4 py-5', className)}>{children}</div>
}

export function Title({ children, tag, sub }: { children: ReactNode; tag?: ReactNode; sub?: ReactNode }) {
  const desktop = usePageWide()
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
        <h1 className={cn('gwl-display leading-tight text-foreground', desktop ? 'text-3xl' : 'text-2xl')}>{children}</h1>
        {tag}
      </div>
      {sub && <p className="type-text-sm-normal text-muted-foreground">{sub}</p>}
    </div>
  )
}

const STATUS: Record<NonNullable<PlanItem['status']>, string> = {
  Added: 'bg-muted text-muted-foreground',
  Booked: 'bg-success-soft text-success-strong',
  Included: 'bg-info-subtle text-info-strong',
  Suggested: 'bg-background-inverse text-foreground-inverse',
  Free: 'bg-success-soft text-success-strong',
}

/** ANVIL-CANDIDATE (PlanRow): an itinerary row with a status tag; "Suggested" is dashed until it's accepted. */
export function PlanRow({ item }: { item: PlanItem }) {
  const suggested = item.status === 'Suggested'
  return (
    <li id={`plan-${item.id}`} className={cn('gwl-in flex scroll-mt-4 items-center gap-4 rounded-2xl border bg-background p-4', suggested && 'border-2 border-dashed border-foreground/50')}>
      <span className="w-14 shrink-0 type-text-sm-semibold text-muted-foreground tabular-nums">{item.time}</span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        {/* The status wraps under the title in narrow columns instead of squeezing it. */}
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="type-text-md-semibold">{item.title}</span>
          {item.status && <span className={cn('shrink-0 rounded-md px-2 py-0.5 type-text-xs-semibold', STATUS[item.status])}>{item.status}</span>}
        </span>
        {item.sub && <span className="type-text-xs-normal text-muted-foreground">{item.sub}</span>}
      </span>
    </li>
  )
}

/** J1·2 and J2·2: the suites page. Wiley sets the filter chips, ranks and highlights; removing a chip shows all again. */
export function SuitesPage() {
  const { s, journey, patch, go } = useDemo()
  const desktop = usePageWide()
  const ranked = s.ranked.length > 0 && s.filters.length > 0
  const narrowed = ranked && !s.widened
  const order = ranked ? [...s.ranked, ...suites.map((x) => x.id).filter((id) => !s.ranked.includes(id))] : suites.map((x) => x.id)
  const shown = narrowed ? order.filter((id) => s.ranked.includes(id)) : order
  const ratesStep = journey === 1 ? 'j1/3' : 'j2/5'
  return (
    <Page>
      <Title tag={s.setByWiley && s.filters.length > 0 ? <WileyTag>Set by Wiley</WileyTag> : undefined}>{journey === 1 ? 'Choose a suite' : 'Suites for your family'}</Title>
      <div className="flex flex-wrap gap-2" aria-label="Filters">
        {s.filters.length > 0 ? (
          s.filters.map((f) => (
            <Chip
              key={f}
              variant="outline"
              size="lg"
              shape="pill"
              className="gwl-in h-9 px-3.5"
              removeLabel={`Remove ${f}`}
              onRemove={() => patch({ filters: s.filters.filter((x) => x !== f), widened: true, highlight: null })}
            >
              {f}
            </Chip>
          ))
        ) : (
          <>
            <Badge variant="outline" className="h-9 rounded-full px-3.5">
              <Icon icon={CalendarIcon} /> Select dates
            </Badge>
            <Badge variant="outline" className="h-9 rounded-full px-3.5">
              <Icon icon={UsersIcon} /> {journey === 1 ? '4 Guests' : '2 Guests'}
            </Badge>
          </>
        )}
      </div>
      <div className="flex flex-col gap-5">
        {shown.map((id) => {
          const suite = suiteById(id)
          return (
            <SuiteCard
              key={id}
              suite={suite}
              desktop={desktop}
              signedIn={s.signedIn}
              tag={ranked ? s.tags[id] : undefined}
              highlighted={s.highlight === id}
              expanded={s.expanded === id}
              selected={s.selected?.suite === id ? s.selected.rate : null}
              onToggleRates={() => {
                if (s.expanded === id) return patch({ expanded: null })
                patch({ expanded: id })
                if (id === 'pup-den-jr') go(ratesStep)
              }}
              onSelectRate={(rate) => patch({ selected: { suite: id, rate } })}
            />
          )
        })}
      </div>
    </Page>
  )
}

/** J1·3 and J2·5: one suite with its rates open. Signed-in members see their two Voyagers rates only. */
export function RatesPage() {
  const { s, journey, patch, go } = useDemo()
  const desktop = usePageWide()
  const id = s.expanded ?? 'pup-den-jr'
  const suite = suiteById(id)
  const dates = journey === 1 ? 'Mar 12 – 14' : s.weekend
  const back = () => {
    patch({ expanded: null })
    go(journey === 1 ? 'j1/2' : 'j2/2')
  }
  const select = (rate: Parameters<typeof SuiteCard>[0]['selected']) => rate && patch({ selected: { suite: id, rate } })
  return (
    <Page>
      {desktop ? (
        <>
          <Title tag={<WileyTag>Set by Wiley</WileyTag>}>{journey === 1 ? 'Choose a suite' : `Choose a rate · ${dates}`}</Title>
          <SuiteCard suite={suite} desktop signedIn={s.signedIn} tag={journey === 1 ? s.tags[id] : 'Wiley’s pick'} expanded selected={s.selected?.suite === id ? s.selected.rate : null} onToggleRates={back} onSelectRate={select} />
        </>
      ) : (
        <CompactRates suite={suite} signedIn={s.signedIn} selected={s.selected?.suite === id ? s.selected.rate : null} onToggleRates={back} onSelectRate={select} datesLabel={`${dates} · 2 adults, 2 kids`} />
      )}
    </Page>
  )
}

const POPULAR = [
  { name: 'Indoor Water Park', tone: 'lake', src: photos.waterpark },
  { name: 'Themed Suites', tone: 'den', src: photos.bunks },
  { name: 'MagiQuest', tone: 'dusk', icon: art.magiquest },
  { name: 'Things to do nearby', tone: 'forest', icon: art.nearby },
] as { name: string; tone: 'lake' | 'den' | 'dusk' | 'forest'; src?: string; icon?: LucideIcon }[]

/** "Popular at this lodge": four tiles, a row on desktop and a swipeable strip on mobile. */
export function Popular() {
  const desktop = usePageWide()
  return (
    <section aria-labelledby="popular" className="flex flex-col gap-3">
      <h2 id="popular" className="type-text-xs-semibold tracking-wide text-muted-foreground uppercase">
        Popular at this lodge
      </h2>
      <ul className={cn('gap-4', desktop ? 'grid grid-cols-4' : 'gwl-noscroll -mx-4 flex overflow-x-auto px-4')}>
        {POPULAR.map((p) => (
          <li key={p.name} className={cn('flex flex-col gap-2', !desktop && 'w-52 shrink-0')}>
            <Photo src={p.src} icon={p.icon} label={p.name} tone={p.tone} className="h-32 rounded-2xl" />
            <span className="type-text-sm-semibold">{p.name}</span>
          </li>
        ))}
      </ul>
    </section>
  )
}
