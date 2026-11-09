import { useState } from 'react'
import { Badge } from '@anvil/components/ui/badge'
import { Button } from '@anvil/components/ui/button'
import { Card } from '@anvil/components/ui/card'
import { CheckIcon, ChevronDownIcon, ChevronUpIcon, CircleCheckIcon, Icon, InfoIcon } from '@anvil/components/ui/icon'
import { cn } from '@anvil/lib/utils'
import { money, ratesFor, type Rate, type RateKey, type Suite } from '~/data/fixtures'
import { suitePhotos } from '~/data/photos'
import { Sample } from '../Brand/Brand'

// ANVIL-CANDIDATE: the live greatwolf.com suite card (gallery with tier tag and counter, details, water park info box,
// "Starting Rate" price block, View / Hide Rates) and its rate cards. Anvil's Offer Card holds one product and one CTA;
// this needs an expanding set of rates with member pricing and a selected state.


export function Gallery({ suite, className }: { suite: Suite; className?: string }) {
  const [i, setI] = useState(0)
  const shots = suitePhotos[suite.id] ?? []
  return (
    <div className={cn('relative overflow-hidden', className)}>
      <div
        className="gwl-noscroll absolute inset-0 flex snap-x snap-mandatory overflow-x-auto"
        onScroll={(e) => {
          const el = e.currentTarget
          setI(Math.round(el.scrollLeft / el.clientWidth))
        }}
        aria-label={`${suite.name} photos`}
      >
        {shots.map((p, n) => (
          <img
            key={p.src}
            src={p.src}
            alt={`${suite.name}: ${p.alt} (${n + 1} of ${shots.length})`}
            loading={n === 0 ? 'eager' : 'lazy'}
            draggable={false}
            className={cn('h-full w-full shrink-0 snap-center', p.plan ? 'bg-[#ffffff] object-contain p-2' : 'object-cover')}
          />
        ))}
      </div>
      <span className="absolute top-3 left-3 rounded-sm border border-[#ffffff] bg-[#000000] px-2 py-0.5 type-text-xs-semibold text-[#ffffff]">{suite.tier}</span>
      <span className="absolute top-3 right-3 rounded-sm border border-[#ffffff] bg-[#000000] px-2 py-0.5 type-text-xs-semibold text-[#ffffff]" aria-live="polite">
        {i + 1} / {shots.length}
      </span>
      <span className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5" aria-hidden>
        {shots.map((_, n) => (
          <span key={n} className={cn('size-2 rounded-full', n === i ? 'bg-[#ffffff]' : 'bg-[#ffffff80]')} />
        ))}
      </span>
    </div>
  )
}

export function RateCard({ rate, signedIn, selected, onSelect, sample }: { rate: Rate; signedIn: boolean; selected: boolean; onSelect: () => void; sample?: boolean }) {
  return (
    <div
      id={`rate-${rate.key}`}
      className={cn(
        'flex flex-col gap-2 rounded-2xl border bg-background p-5 transition-shadow',
        selected && 'gwl-pulse border-primary ring-2 ring-primary',
      )}
    >
      <p className="gwl-display text-lg text-foreground">{rate.plan}</p>
      <p className="type-text-sm-normal">{rate.policy}</p>
      <div className="mt-auto flex flex-col gap-1 pt-3">
        <p className="type-text-sm-semibold">{rate.member ? (signedIn ? 'Your Voyagers Club rate' : 'Voyagers Club rate') : 'Non-member rate'}</p>
        {rate.member && !signedIn && <span className="w-fit bg-[var(--gwl-yellow)] px-2 py-0.5 type-text-sm-medium text-[var(--gwl-yellow-foreground)]">Join for Free</span>}
      </div>
      <div className="flex items-end justify-between gap-3">
        <div>
          <p className="gwl-display text-2xl">
            {money(rate.price)} {sample && <Sample className="align-middle" />}
          </p>
          <p className="type-text-xs-normal">Night Avg.</p>
        </div>
        <Button shape="pill" variant={rate.member ? 'default' : 'outline'} intent={rate.member ? 'brand' : 'neutral'} onClick={onSelect} aria-pressed={selected} className="min-w-28">
          {selected ? (
            <>
              <Icon icon={CheckIcon} /> Selected
            </>
          ) : (
            'Select'
          )}
        </Button>
      </div>
    </div>
  )
}

interface Props {
  suite: Suite
  desktop: boolean
  signedIn: boolean
  tag?: string
  highlighted?: boolean
  dimmed?: boolean
  expanded?: boolean
  selected?: RateKey | null
  /** Signed-in members only see their two Voyagers rates. */
  onToggleRates: () => void
  onSelectRate: (key: RateKey) => void
  datesLabel?: string
}

function Rates({ suite, desktop, signedIn, selected, onSelectRate }: Pick<Props, 'suite' | 'desktop' | 'signedIn' | 'selected' | 'onSelectRate'>) {
  const rates = ratesFor(suite.id).filter((r) => !signedIn || r.member)
  const sample = !suite.real
  return (
    <div className={cn('grid gap-4 border-t bg-muted/40 p-4', desktop && (rates.length > 2 ? 'grid-cols-4 p-6' : 'grid-cols-2 p-6'))}>
      {rates.map((r) => (
        <RateCard key={r.key} rate={r} signedIn={signedIn} selected={selected === r.key} onSelect={() => onSelectRate(r.key)} sample={sample} />
      ))}
    </div>
  )
}

export function SuiteCard(p: Props) {
  const { suite, desktop, tag, highlighted, dimmed, expanded } = p
  const details = (
    <div className="flex min-w-0 flex-col gap-2">
      {tag && <Badge className="gwl-in w-fit">{tag}</Badge>}
      <h3 className="gwl-display text-xl leading-tight text-foreground">{suite.name}</h3>
      <div className="flex flex-wrap items-center gap-x-4 gap-y-1">
        <button type="button" className="gwl-link type-text-sm-semibold">
          Rate Calendar
        </button>
        <span className="type-text-sm-normal">Sleeps up to {suite.sleeps}</span>
      </div>
      {suite.variant && (
        <span className="inline-flex w-fit items-center gap-6 rounded-lg border px-3 py-2 type-text-sm-normal">
          {suite.variant}
          <Icon icon={ChevronDownIcon} size="xs" />
        </span>
      )}
      <p className="type-text-sm-normal">
        <strong>{suite.lead}</strong>
        {suite.rest}{' '}
        <button type="button" className="gwl-link">
          View Suite Details
        </button>
      </p>
      <p className="flex items-center gap-2 rounded-lg bg-muted px-3 py-2.5 type-text-sm-normal">
        <Icon icon={InfoIcon} size="xs" className="shrink-0" />
        <span>
          Includes <strong>Water Park passes</strong> for 3 days
        </span>
      </p>
    </div>
  )
  const price = (
    <div className={cn('flex flex-col gap-1', desktop ? 'items-end text-right' : 'items-start')}>
      <p className="gwl-display text-base">Starting Rate:</p>
      <p className="flex items-center gap-1 type-text-sm-medium text-success-medium dark:text-success">
        <Icon icon={CircleCheckIcon} size="xs" /> Promo Applied
      </p>
      <p className="gwl-display text-3xl">
        {money(suite.from)} {!suite.real && <Sample className="align-middle" />}
      </p>
      <p className="type-text-xs-semibold">Night Avg.</p>
      <Button
        shape="pill"
        variant="outline"
        intent="neutral"
        size="lg"
        className={cn('mt-2', desktop ? 'w-56' : 'w-full', expanded && 'ring-2 ring-info')}
        onClick={p.onToggleRates}
        aria-expanded={expanded}
      >
        {expanded ? 'Hide Rates' : 'View Rates'}
        {expanded && <Icon icon={ChevronUpIcon} />}
      </Button>
    </div>
  )
  return (
    <Card
      id={`suite-${suite.id}`}
      className={cn(
        'scroll-mt-4 gap-0 overflow-hidden rounded-3xl p-0 shadow-md transition-opacity',
        highlighted && 'gwl-pulse ring-2 ring-primary',
        dimmed && 'opacity-50',
      )}
    >
      {desktop ? (
        <div className="grid grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)_auto]">
          <Gallery suite={suite} className="min-h-72" />
          <div className="p-6">{details}</div>
          <div className="flex items-center border-l p-6 my-6">{price}</div>
        </div>
      ) : (
        <>
          <Gallery suite={suite} className="h-52" />
          <div className="flex flex-col gap-4 p-4">
            {details}
            {price}
          </div>
        </>
      )}
      {expanded && <Rates {...p} />}
    </Card>
  )
}

/** Mobile rates view: a compact suite header and the stacked rate cards. */
export function CompactRates(p: Omit<Props, 'desktop' | 'tag' | 'highlighted' | 'dimmed' | 'expanded'>) {
  return (
    <Card id={`suite-${p.suite.id}`} className="gap-0 overflow-hidden rounded-3xl p-0 shadow-md">
      <div className="flex items-start justify-between gap-3 p-4">
        <div className="min-w-0">
          <h2 className="gwl-display text-lg leading-tight">{p.suite.name}</h2>
          {p.datesLabel && <p className="type-text-sm-normal text-muted-foreground">{p.datesLabel}</p>}
        </div>
        <Button shape="pill" variant="outline" intent="neutral" onClick={p.onToggleRates} aria-expanded>
          Hide Rates <Icon icon={ChevronUpIcon} />
        </Button>
      </div>
      <Rates suite={p.suite} desktop={false} signedIn={p.signedIn} selected={p.selected} onSelectRate={p.onSelectRate} />
    </Card>
  )
}
