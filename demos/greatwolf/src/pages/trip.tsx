import { useEffect, useRef, useState } from 'react'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@anvil/components/ui/collapsible'
import { OfferCard } from '@anvil/components/agent/offer-card'
import { ProgressStep, ProgressSteps } from '@anvil/components/anvil/progress-steps'
import { Badge } from '@anvil/components/ui/badge'
import { Button } from '@anvil/components/ui/button'
import { Card } from '@anvil/components/ui/card'
import { CheckIcon, ChevronDownIcon, CircleCheckIcon, Icon, InfoIcon } from '@anvil/components/ui/icon'
import { cn } from '@anvil/lib/utils'
import { activityById, money, suiteById } from '~/data/fixtures'
import { extras, SECTIONS, type Extra, type ExtraKind } from '~/data/extras'
import { suitePhotos } from '~/data/photos'
import { Photo, Sample, WileyTag } from '~/components/local/Brand/Brand'
import { CompactRates, SuiteCard } from '~/components/local/SuiteCard/SuiteCard'
import { TripQuote } from '~/components/local/WileyCards/WileyCards'
import { quoteOf, useDemo } from '~/state/demo'
import { j1Plan } from '~/state/plan'
import { usePageWide } from '~/state/layout'
import { reveal } from '~/lib/reveal'
import { Page, Title } from './shared'

// The Trip Builder: once a rate is chosen, the rates page becomes the trip. The suite is the first item; passes,
// dining, the birthday package and more lodge experiences add to it, from the page or from Wiley, and the weekend
// plan sits beside it. Both sides read the same cart, so the page and the chat never disagree.

/** Which sections each journey shows, in order (Journey 2 is not a birthday trip). */
const KINDS: Record<1 | 2, ExtraKind[]> = { 1: ['birthday', 'pass', 'dining', 'experience'], 2: ['pass', 'dining', 'experience'] }

function ExtraOffer({ e, added, suggested, onToggle, desktop }: { e: Extra; added: boolean; suggested: boolean; onToggle: () => void; desktop: boolean }) {
  return (
    <OfferCard
      id={`extra-${e.id}`}
      layout="horizontal"
      // Added cards keep the selected border, but Remove stays an outline button: the page has one primary action.
      className={cn('gwl-in scroll-mt-4 max-w-none rounded-xl', added && 'border-border-action inset-ring-1 inset-ring-border-action', suggested && !added && 'ring-2 ring-primary')}
      media={<Photo icon={e.icon} label={e.name} tone={e.tone} className="h-full min-h-28 w-full" />}
      badge={
        suggested && !added ? (
          <WileyTag>Wiley suggests</WileyTag>
        ) : added ? (
          <Badge variant="subtle" size="sm">
            <Icon icon={CheckIcon} size="xs" /> In your trip
          </Badge>
        ) : undefined
      }
      title={e.name}
      subtitle={e.blurb}
      meta={
        <>
          {e.includes && desktop ? e.includes.join(' · ') : null}
          {e.confidence === 'check' && (
            <span className="mt-1 flex items-center gap-1 text-warning-strong">
              <Icon icon={InfoIcon} size="xs" /> {e.checkNote ?? 'To confirm with the lodge'}
            </span>
          )}
        </>
      }
      price={
        <>
          {e.price}
          {e.sample && <Sample className="ms-1.5 align-middle" />}
        </>
      }
      ctaLabel={added ? 'Remove' : 'Add'}
      onCta={onToggle}
    />
  )
}

function SuiteItem({ onChange, desktop }: { onChange: () => void; desktop: boolean }) {
  const { s } = useDemo()
  const q = quoteOf(s)
  if (!q) return null
  const photo = suitePhotos[q.suite.id]?.[0]
  return (
    <Card id="trip-suite" className="gwl-in flex-row items-center gap-4 overflow-hidden rounded-2xl p-0 shadow-md">
      <Photo src={photo?.src} label={photo?.alt ?? q.suite.name} className={cn('shrink-0 self-stretch', desktop ? 'min-h-28 w-40' : 'w-24')} />
      <div className="flex min-w-0 flex-1 flex-col gap-1 py-3 pe-4">
        <Badge variant="subtle" size="sm" className="w-fit">
          <Icon icon={CircleCheckIcon} size="xs" /> Your suite
        </Badge>
        <p className={cn('gwl-display leading-tight', desktop ? 'text-lg' : 'text-base')}>{q.suite.name}</p>
        <p className="type-text-sm-normal text-muted-foreground">
          {q.rate.plan} · {q.rate.member ? 'Voyagers Club rate' : 'Non-member rate'} · {money(q.rate.price)} a night
        </p>
        {desktop && <p className="type-text-xs-normal text-muted-foreground">Water park passes included for everyone in the suite</p>}
        {!desktop && (
          <button type="button" className="gwl-link w-fit type-text-sm-semibold" onClick={onChange}>
            Change rate
          </button>
        )}
      </div>
      {desktop && (
        <Button shape="pill" variant="ghost" intent="neutral" size="sm" className="me-3 shrink-0" onClick={onChange}>
          Change rate
        </Button>
      )}
    </Card>
  )
}

/** The trip so far, beside the builder on desktop and under it on a phone. */
function PlanPreview() {
  const { s, journey, go } = useDemo()
  const items =
    journey === 1
      ? j1Plan(s).filter((p) => p.status !== 'Suggested').slice(0, 6).map((p) => ({ id: p.id, title: p.title, when: `${p.day === 'fri' ? 'Fri' : p.day === 'sat' ? 'Sat' : 'Sun'} ${p.time}`, note: p.status === 'Included' ? p.sub : undefined }))
      : ['cub-paw', ...s.ideas].map((id) => ({ id, title: id === 'cub-paw' ? 'Cub Paw Pool' : (activityById(id)?.name ?? id), when: '', note: undefined as string | undefined }))
  return (
    <Card className="gap-3 rounded-2xl p-4">
      <p className="type-text-xs-semibold tracking-wide text-muted-foreground uppercase">Your weekend plan</p>
      <ul className="flex flex-col gap-1.5">
        {items.map((p) => (
          <li key={p.id} className="flex justify-between gap-3 type-text-sm-normal">
            <span className="flex min-w-0 flex-col">
              {p.title}
              {p.note && <span className="type-text-xs-normal text-muted-foreground">{p.note}</span>}
            </span>
            {p.when && <span className="type-text-sm-semibold whitespace-nowrap">{p.when}</span>}
          </li>
        ))}
      </ul>
      {journey === 1 && (
        <Button shape="pill" variant="outline" intent="neutral" className="w-fit" onClick={() => go('j1/4')}>
          Open the weekend plan
        </Button>
      )}
    </Card>
  )
}

/**
 * ANVIL-CANDIDATE (PinnedSummary): on a phone, the trip so far stays pinned under the header. Collapsed it is one
 * line (items and total); tapping opens every line, and a line takes you to its card. When something is added, from
 * the page or by Wiley, the bar says so for a moment, so a change in the chat is visible on the page too.
 */
function TripBar() {
  const { s } = useDemo()
  const q = quoteOf(s)
  const [open, setOpen] = useState(false)
  const [flash, setFlash] = useState<string | null>(null)
  const count = s.cart.length
  const prev = useRef(count)
  useEffect(() => {
    if (count > prev.current) {
      const added = s.cart.find((c) => c.fresh)
      if (added) {
        setFlash(added.label)
        const t = window.setTimeout(() => setFlash(null), 2600)
        prev.current = count
        return () => window.clearTimeout(t)
      }
    }
    prev.current = count
  }, [count, s.cart])
  if (!q) return null
  const items = 1 + count
  const go = (id: string) => {
    setOpen(false)
    window.setTimeout(() => reveal(id === 'suite' ? 'trip-suite' : `extra-${id}`), 120)
  }
  return (
    <Collapsible open={open} onOpenChange={setOpen} className="sticky top-0 z-20 -mx-4 -mt-5 border-b bg-background shadow-[0_6px_16px_rgb(7_39_69/0.08)]">
      <CollapsibleTrigger className="flex min-h-14 w-full items-center gap-3 px-4 py-2 text-start outline-none focus-visible:focus-ring">
        <span className="flex min-w-0 flex-1 flex-col">
          <span className="type-text-xs-semibold tracking-wide text-muted-foreground uppercase">Your trip so far</span>
          <span aria-live="polite" className="truncate type-text-sm-semibold">
            {flash ? (
              <span key={flash} className="gwl-fade inline-flex items-center gap-1.5 text-success-strong">
                <Icon icon={CheckIcon} size="xs" /> Just added: {flash}
              </span>
            ) : (
              `${items} ${items === 1 ? 'item' : 'items'} · ${money(q.total)}`
            )}
          </span>
        </span>
        <span className="flex shrink-0 items-center gap-1 type-text-sm-semibold">
          {open ? 'Hide' : 'Show'}
          <Icon icon={ChevronDownIcon} size="xs" className={cn('transition-transform duration-200', open && 'rotate-180')} />
        </span>
      </CollapsibleTrigger>
      <CollapsibleContent className="gwl-collapse overflow-hidden">
        <ul className="flex max-h-[50vh] flex-col overflow-y-auto border-t px-4 py-2">
          {q.lines.map((l) => (
            <li key={l.id}>
              <button
                type="button"
                disabled={l.id === 'passes'}
                onClick={() => go(l.id)}
                className="flex min-h-11 w-full items-center justify-between gap-3 text-start type-text-sm-normal outline-none focus-visible:focus-ring disabled:cursor-default"
              >
                <span className="min-w-0">
                  {l.label}
                  {l.id === 'suite' && <span className="text-muted-foreground"> · {l.detail}</span>}
                </span>
                <span className="shrink-0 type-text-sm-semibold whitespace-nowrap">{l.id === 'passes' ? 'Included' : (l.price ?? money(l.amount))}</span>
              </button>
            </li>
          ))}
        </ul>
        <div className="flex items-baseline justify-between border-t px-4 pt-3 pb-1">
          <span className="type-text-sm-semibold">Total</span>
          <span className="type-text-lg-semibold">{money(q.total)}</span>
        </div>
        {q.sample && <p className="px-4 pb-3 type-text-xs-normal text-muted-foreground">* Sample price: the lodge doesn’t list one</p>}
      </CollapsibleContent>
    </Collapsible>
  )
}

/** J1·3 and J2·5 after a rate is chosen. */
export function TripBuilder() {
  const { s, journey, go, toggleExtra, chooseRate } = useDemo()
  const desktop = usePageWide()
  const [changing, setChanging] = useState(false)
  const kinds = KINDS[journey]
  const has = (id: string) => s.cart.some((c) => c.id === id)
  const filled = (k: ExtraKind) => s.cart.some((c) => c.kind === k)
  const firstOpen = kinds.find((k) => !filled(k))
  const suiteId = s.selected!.suite
  const primary =
    journey === 1 ? (
      <Button shape="pill" size="lg" onClick={() => go('j1/4')}>
        Plan our weekend
      </Button>
    ) : (
      <Button shape="pill" size="lg" onClick={() => go('j2/6')}>
        Save my trip
      </Button>
    )
  const steps = (
    <ProgressSteps variant="bars" aria-label="Trip progress">
      <ProgressStep status="done" label="Suite" />
      {kinds.map((k) => (
        <ProgressStep key={k} status={filled(k) ? 'done' : k === firstOpen ? 'current' : 'upcoming'} label={SECTIONS[k].step} />
      ))}
    </ProgressSteps>
  )
  const sections = kinds.map((k) => (
    <section key={k} id={`trip-${k}`} aria-labelledby={`trip-${k}-h`} className="flex scroll-mt-4 flex-col gap-3">
      <div className="flex flex-col gap-0.5">
        <h2 id={`trip-${k}-h`} className="gwl-display text-lg">
          {SECTIONS[k].title}
        </h2>
        <p className="type-text-sm-normal text-muted-foreground">{SECTIONS[k].sub}</p>
      </div>
      <div className="grid gap-3">
        {extras
          .filter((e) => e.kind === k && (!e.journeys || e.journeys.includes(journey)))
          .map((e) => (
            <ExtraOffer key={e.id} e={e} desktop={desktop} added={has(e.id)} suggested={s.highlight === `extra-${e.id}`} onToggle={() => toggleExtra(e.id)} />
          ))}
      </div>
    </section>
  ))
  const rates = changing && (
    <div className="gwl-in">
      {desktop ? (
        <SuiteCard suite={suiteById(suiteId)} desktop signedIn={s.signedIn} expanded selected={s.selected!.rate} onToggleRates={() => setChanging(false)} onSelectRate={(r) => (setChanging(false), chooseRate(suiteId, r))} />
      ) : (
        <CompactRates suite={suiteById(suiteId)} signedIn={s.signedIn} selected={s.selected!.rate} onToggleRates={() => setChanging(false)} onSelectRate={(r) => (setChanging(false), chooseRate(suiteId, r))} />
      )}
    </div>
  )
  return (
    <Page wide>
      {!desktop && <TripBar />}
      <Title tag={<WileyTag>Built with Wiley</WileyTag>} sub={`${journey === 1 ? 'Mar 12 – 14' : s.weekend} · 2 adults, 2 kids${desktop ? ' · Wiley suggests, you decide' : ''}`} actions={primary}>
        Your trip
      </Title>
      {steps}
      {desktop ? (
        <div className="grid grid-cols-[minmax(0,1fr)_340px] items-start gap-6">
          <div className="flex min-w-0 flex-col gap-8">
            <SuiteItem desktop={desktop} onChange={() => setChanging((v) => !v)} />
            {rates}
            {sections}
          </div>
          <div className="sticky top-4 flex flex-col gap-4">
            <TripQuote title="Your trip so far" />
            <PlanPreview />
          </div>
        </div>
      ) : (
        <div className="flex flex-col gap-7 pb-24">
          <SuiteItem desktop={desktop} onChange={() => setChanging((v) => !v)} />
          {rates}
          {sections}
          <PlanPreview />
        </div>
      )}
    </Page>
  )
}

