import { useState } from 'react'
import { OfferCard } from '@anvil/components/agent/offer-card'
import { ProgressStep, ProgressSteps } from '@anvil/components/anvil/progress-steps'
import { Badge } from '@anvil/components/ui/badge'
import { Button } from '@anvil/components/ui/button'
import { Card } from '@anvil/components/ui/card'
import { CheckIcon, CircleCheckIcon, Icon, InfoIcon } from '@anvil/components/ui/icon'
import { cn } from '@anvil/lib/utils'
import { money, suiteById } from '~/data/fixtures'
import { extras, SECTIONS, type Extra, type ExtraKind } from '~/data/extras'
import { suitePhotos } from '~/data/photos'
import { Photo, Sample, WileyTag } from '~/components/local/Brand/Brand'
import { CompactRates, SuiteCard } from '~/components/local/SuiteCard/SuiteCard'
import { TripQuote } from '~/components/local/WileyCards/WileyCards'
import { quoteOf, useDemo } from '~/state/demo'
import { j1Plan, j2Plan } from '~/state/plan'
import { guestsLong, shortDates } from '~/state/stay'
import { usePageWide } from '~/state/layout'
import { Page, Title } from './shared'

// The Trip Builder: once a rate is chosen, the rates page becomes the trip. The suite is the first item; passes,
// dining, the birthday package and more lodge experiences add to it, from the page or from Wiley, and the weekend
// plan sits beside it. Both sides read the same cart, so the page and the chat never disagree.

/** Which sections each journey shows, in order (Journey 2 is not a birthday trip). */
const KINDS: Record<1 | 2 | 3, ExtraKind[]> = { 1: ['birthday', 'pass', 'dining', 'experience'], 2: ['pass', 'dining', 'experience'], 3: [] }

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
  // Both journeys preview the same day plan their weekend page shows (J1·4, J2·6), built from this trip.
  const items = (journey === 1 ? j1Plan(s) : j2Plan(s))
    .filter((p) => p.status !== 'Suggested' && p.id !== 'checkin')
    .slice(0, 6)
    .map((p) => ({ id: p.id, title: p.title, when: `${p.day === 'fri' ? 'Fri' : p.day === 'sat' ? 'Sat' : 'Sun'} ${p.time}`, note: p.status === 'Included' ? p.sub : undefined }))
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
      <Button shape="pill" variant="outline" intent="neutral" className="w-fit" onClick={() => go(journey === 1 ? 'j1/4' : 'j2/6')}>
        Open the weekend plan
      </Button>
    </Card>
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
      <Title tag={<WileyTag>Built with Wiley</WileyTag>} sub={`${shortDates(s.stay) ?? 'Dates to pick'} · ${guestsLong(s.stay)}${desktop ? ' · Wiley suggests, you decide' : ''}`} actions={primary}>
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
          <div className="sticky top-20 flex flex-col gap-4">
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

