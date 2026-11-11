import { useEffect, useRef, type HTMLAttributes, type ReactNode, type Ref } from 'react'
import { Card } from '@anvil/components/ui/card'
import { partySize } from '~/state/stay'
import { Chip } from '@anvil/components/anvil/chip'
import { type LucideIcon } from '@anvil/components/ui/icon'
import { cn } from '@anvil/lib/utils'
import { suiteById, suites } from '~/data/fixtures'
import { art, photos } from '~/data/photos'
import { SuiteCard, SuiteCardSkeleton } from '~/components/local/SuiteCard/SuiteCard'
import { reveal } from '~/lib/reveal'
import { TextShimmer } from '@anvil/components/agent/text-shimmer'
import { Photo, WileyTag } from '~/components/local/Brand/Brand'
import { useDemo } from '~/state/demo'
import { usePageWide } from '~/state/layout'
import type { PlanItem } from '~/wiley/types'
import { TripBuilder } from './trip'

/** The page column: full width on mobile, a shared max width on desktop. */
export function Page({ children, className, wide }: { children: ReactNode; className?: string; wide?: boolean }) {
  const desktop = usePageWide()
  return <div className={cn('gwl-page mx-auto flex w-full flex-col gap-5', desktop ? cn('px-8 py-8', wide ? 'max-w-7xl' : 'max-w-6xl') : 'px-4 py-5', className)}>{children}</div>
}

export function Title({ children, tag, sub, actions }: { children: ReactNode; tag?: ReactNode; sub?: ReactNode; actions?: ReactNode }) {
  const desktop = usePageWide()
  return (
    <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3">
      <div className="flex flex-col gap-2">
        <div className="flex flex-wrap items-center gap-x-3 gap-y-2">
          <h1 className={cn('gwl-display leading-tight text-foreground', desktop ? 'text-3xl' : 'text-2xl')}>{children}</h1>
          {tag}
        </div>
        {sub && <p className="type-text-sm-normal text-muted-foreground">{sub}</p>}
      </div>
      {actions && <div className="flex flex-wrap gap-2 print:hidden">{actions}</div>}
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

/**
 * ANVIL-CANDIDATE (PlanRow): an itinerary row with a status tag; "Suggested" is dashed until it's accepted. Optional
 * `handle` (drag grip) and `menu` (Move menu) sit at either end when the plan can be rearranged.
 */
export function PlanRow({ item, handle, menu, className, ref, ...rest }: { item: PlanItem; handle?: ReactNode; menu?: ReactNode; ref?: Ref<HTMLLIElement> } & HTMLAttributes<HTMLLIElement>) {
  const suggested = item.status === 'Suggested'
  return (
    <li
      ref={ref}
      id={`plan-${item.id}`}
      className={cn('gwl-in relative flex scroll-mt-4 items-center gap-3 rounded-2xl border bg-background p-4', handle && 'ps-2', menu && 'pe-2', suggested && 'border-2 border-dashed border-foreground/50', className)}
      {...rest}
    >
      {handle}
      <span className="w-14 shrink-0 type-text-sm-semibold text-muted-foreground tabular-nums">{item.time}</span>
      <span className="flex min-w-0 flex-1 flex-col gap-0.5">
        {/* The status wraps under the title in narrow columns instead of squeezing it. */}
        <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="type-text-md-semibold">{item.title}</span>
          {item.status && <span className={cn('shrink-0 rounded-md px-2 py-0.5 type-text-xs-semibold', STATUS[item.status])}>{item.status}</span>}
        </span>
        {item.sub && <span className="type-text-xs-normal text-muted-foreground">{item.sub}</span>}
      </span>
      {menu}
    </li>
  )
}

/**
 * J1·2–3 and J2·2, J2·5: the suites page. Wiley sets the filter chips, ranks and highlights; removing a chip shows all
 * again. View Rates opens a suite's rates inside its card, like an accordion (one at a time), and the other suites stay
 * where they are. Opening rates from the suites step moves the journey to its rates step, where Wiley follows the
 * choice; the page itself doesn't change. Once a rate is chosen on the rates step, the page becomes the Trip Builder.
 */
export function SuitesPage() {
  const { s, step, journey, patch, go, chooseRate } = useDemo()
  const desktop = usePageWide()
  const ratesStep = journey === 1 ? 3 : 5
  const onRates = step === ratesStep
  // The open card's rates come into view (under the header, above the Wiley sheet) when it opens.
  const opened = useRef(s.expanded)
  useEffect(() => {
    if (s.expanded && s.expanded !== opened.current && !s.selected) window.setTimeout(() => reveal(`rates-${s.expanded}`), 260)
    opened.current = s.expanded
  }, [s.expanded, s.selected])
  const ranked = s.ranked.length > 0
  const narrowed = ranked && !s.widened
  const order = ranked ? [...s.ranked, ...suites.map((x) => x.id).filter((id) => !s.ranked.includes(id))] : suites.map((x) => x.id)
  // Suites that sleep fewer than the party never show; the Your stay bar's guests decide it.
  const party = partySize(s.stay)
  const shown = (narrowed ? order.filter((id) => s.ranked.includes(id)) : order).filter((id) => suiteById(id).sleeps >= party)
  if (onRates && s.selected) return <TripBuilder />
  return (
    <Page>
      <Title tag={s.setByWiley && s.filters.length > 0 ? <WileyTag>Set by Wiley</WileyTag> : undefined}>{journey === 1 ? 'Choose a suite' : 'Suites for your family'}</Title>
      {s.filters.length > 0 && <div className="flex flex-wrap gap-2" aria-label="Filters">
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
        ) : null}
      </div>}
      {s.loadingSuites ? (
        <div role="status" aria-label="Finding suites" className="flex flex-col gap-5">
          <TextShimmer className="type-text-sm-medium">{s.setByWiley ? 'Updating suites for your family…' : 'Finding suites for your dates…'}</TextShimmer>
          {Array.from({ length: Math.max(2, Math.min(3, shown.length)) }, (_, i) => (
            <SuiteCardSkeleton key={i} desktop={desktop} />
          ))}
        </div>
      ) : (
      <div className="gwl-fade flex flex-col gap-5">
        {shown.length === 0 && (
          <Card className="gap-1 rounded-2xl p-5">
            <p className="type-text-md-semibold">No suite here sleeps {party}</p>
            <p className="type-text-sm-normal text-muted-foreground">The lodge’s largest suites sleep up to 8 (not in this demo). Change the guests in the bar above, or ask Wiley about two suites.</p>
          </Card>
        )}
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
                if (!onRates) go(`j${journey}/${ratesStep}`)
              }}
              onSelectRate={(rate) => chooseRate(id, rate)}
            />
          )
        })}
      </div>
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
