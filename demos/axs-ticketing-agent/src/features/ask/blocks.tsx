import { useState } from 'react'
import { Link } from 'react-router-dom'
import { ActionStatus } from '@anvil/components/agent/action-status'
import { ApprovalCard, ApprovalCardField } from '@anvil/components/agent/approval-card'
import { AvailabilityCalendar } from '@anvil/components/agent/availability-calendar'
import { OfferCard } from '@anvil/components/agent/offer-card'
import { QuantitySelector } from '@anvil/components/agent/quantity-selector'
import { ChoiceCard } from '@anvil/components/anvil/choice-card'
import { ShellFooter } from '@anvil/components/anvil/shell'
import { Alert, AlertDescription } from '@anvil/components/ui/alert'
import { Badge } from '@anvil/components/ui/badge'
import { Button } from '@anvil/components/ui/button'
import { Icon, TriangleAlertIcon } from '@anvil/components/ui/icon'
import { RadioGroup } from '@anvil/components/ui/radio-group'
import { ShowCarousel } from '~/components/local/ShowCarousel/ShowCarousel'
import { HoldCountdown } from '~/components/local/HoldCountdown/HoldCountdown'
import { SeatMapCard } from '~/components/local/SeatMapCard/SeatMapCard'
import { clock, DEMO_TODAY, gbp, showDateLine, spoken } from '~/lib/format'
import { ARENA } from '~/mocks/arena'
import { findDate, fromPrice, HOLD_SECONDS } from '~/services/axsTools'
import type { Action, Block, Session } from '~/state/types'

interface BlockProps {
  block: Block
  session: Session
  /** Only the newest agent turn can be acted on; older cards are a record. */
  active: boolean
  send: (action: Action) => void
}

const localDate = (iso: string) => {
  const [y, m, d] = iso.split('-').map(Number)
  return new Date(y, m - 1, d)
}
const isoOf = (d: Date) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`

export function BlockView(props: BlockProps) {
  const { block } = props
  switch (block.kind) {
    case 'shows':
      return <Shows {...props} block={block} />
    case 'consent':
      return <Consent {...props} />
    case 'dates':
      return <Dates {...props} block={block} />
    case 'quantity':
      return <Quantity {...props} block={block} />
    case 'seats':
      return <Seats {...props} block={block} />
    case 'confirm-hold':
      return <ConfirmHold {...props} block={block} />
    case 'hold':
      return <Hold {...props} block={block} />
    case 'handoff':
      return <Handoff {...props} block={block} />
    case 'empty':
      return null
  }
}

function Shows({ block, active, send }: BlockProps & { block: Extract<Block, { kind: 'shows' }> }) {
  return (
    <ShowCarousel
      title={block.shows.length === 1 ? '1 show' : `${block.shows.length} shows`}
      count={`${block.qty} ${block.qty === 1 ? 'ticket' : 'tickets'} · all-in prices`}
    >
      {block.shows.map((s) => {
        const first = s.dates[0]
        const meta =
          s.dates.length === 1
            ? showDateLine(first.date, first.time)
            : `${s.dates.length} dates, from ${showDateLine(first.date)}`
        const limited = s.dates.some((d) => d.level === 'limited')
        return (
          <OfferCard
            key={s.showId}
            layout="vertical"
            media={<img src={s.cover} alt={s.coverAlt} className="size-full object-cover" />}
            badge={
              block.ranked && s.rankedForYou ? (
                <Badge variant="subtle" tone="info" size="sm">
                  Ranked for you
                </Badge>
              ) : limited ? (
                <Badge variant="subtle" tone="warning" size="sm">
                  Few seats left
                </Badge>
              ) : undefined
            }
            title={s.subtitle ? `${s.title}: ${s.subtitle}` : s.title}
            subtitle={`${s.venue}, ${s.city}`}
            meta={meta}
            price={`From ${gbp(s.fromPrice)}`}
            ctaLabel="View dates"
            onCta={active ? () => send({ type: 'view-dates', showId: s.showId }) : undefined}
          />
        )
      })}
    </ShowCarousel>
  )
}

function Consent({ session, active, send }: BlockProps) {
  const answered = session.consent !== 'unset'
  return (
    <ApprovalCard
      status={session.consent === 'allowed' ? 'approved' : session.consent === 'declined' ? 'denied' : 'pending'}
      title="Rank shows for you?"
      subtitle="Uses your AXS history"
      badge={session.consent === 'allowed' ? 'Allowed' : session.consent === 'declined' ? 'Not now' : 'Your choice'}
      footer={
        answered ? undefined : (
          <ShellFooter variant="card" note="Off until you allow it. In this preview the history is sample data.">
            <Button variant="outline" intent="neutral" size="lg" disabled={!active} onClick={() => send({ type: 'consent', allow: false })}>
              Not now
            </Button>
            <Button intent="brand" size="lg" disabled={!active} onClick={() => send({ type: 'consent', allow: true })}>
              Allow
            </Button>
          </ShellFooter>
        )
      }
    >
      <ApprovalCardField label="Used">Shows you have viewed or bought on AXS</ApprovalCardField>
      <ApprovalCardField label="Not used">Your location or payment details</ApprovalCardField>
    </ApprovalCard>
  )
}

function Dates({ block, session, active, send }: BlockProps & { block: Extract<Block, { kind: 'dates' }> }) {
  const { show } = block
  const availability = Object.fromEntries(show.dates.map((d) => [d.date, { level: d.level, price: gbp(d.fromPrice) }]))
  const chosen = session.selection.dateId && findDate(session.selection.dateId)?.date.date
  return (
    <AvailabilityCalendar
      defaultMonth={localDate(show.dates[0].date)}
      today={localDate(DEMO_TODAY)}
      availability={availability}
      selected={chosen && show.dates.some((d) => d.date === chosen) ? localDate(chosen) : undefined}
      onSelect={(day) => {
        const entry = day && show.dates.find((d) => d.date === isoOf(day))
        if (entry && active) send({ type: 'pick-date', dateId: entry.id })
      }}
      title={show.title}
      subtitle={`${show.venue}, ${show.city}`}
      legendNote="Prices from, per ticket, all-in"
    />
  )
}

function Quantity({ block, active, send }: BlockProps & { block: Extract<Block, { kind: 'quantity' }> }) {
  const found = block.dateId ? findDate(block.dateId) : undefined
  return (
    <QuantitySelector
      title="How many tickets?"
      subtitle={found ? `${found.show.title} · ${spoken(found.date.date)}, ${clock(found.date.time)}` : block.subtitle}
      types={[{ id: 'ticket', label: 'Tickets', detail: 'From, per ticket, all-in', price: block.dateId ? fromPrice(block.dateId) : (block.price ?? 0) }]}
      defaultValues={{ ticket: 2 }}
      maxTotal={6}
      currency="GBP"
      locale="en-GB"
      summary={(count, total) => `${count} ${count === 1 ? 'ticket' : 'tickets'} · from ${total}`}
      actionLabel="Show seats"
      onAction={active ? (v) => send({ type: 'set-qty', qty: v.ticket ?? 2 }) : undefined}
    />
  )
}

const together = (seats: number[], qty: number) => {
  const s = seats.slice(0, qty)
  // U+2060 after the dash keeps a pair like 17–18 on one line.
  return qty === 1 ? `seat ${s[0]}` : `seats ${s[0]}–\u2060${s[s.length - 1]}`
}

function Seats({ block, active, send }: BlockProps & { block: Extract<Block, { kind: 'seats' }> }) {
  const [chosen, setChosen] = useState<string | undefined>(block.options[0]?.id)
  const option = block.options.find((o) => o.id === chosen)
  const found = findDate(block.dateId)
  return (
    <div className="flex w-full max-w-160 flex-col gap-3">
      {block.overBudget && (
        <Alert tone="warning" size="xs">
          <Icon icon={TriangleAlertIcon} />
          <AlertDescription>These are over your budget. They are the closest prices.</AlertDescription>
        </Alert>
      )}
      <SeatMapCard
        caption={`${found?.show.venue ?? 'Venue'} · highlighted: ${block.qty} together, all-in prices`}
        sections={ARENA}
        highlighted={block.options.map((o) => o.section)}
        selected={option?.section}
        onSelect={(id) => active && setChosen(block.options.find((o) => o.section === id)?.id)}
        describe={(id) => {
          const o = block.options.find((x) => x.section === id)
          return o ? `${o.sectionLabel}, ${gbp(o.total)} each` : id
        }}
      />
      <RadioGroup
        aria-label="Seat options"
        value={chosen}
        onValueChange={active ? setChosen : undefined}
        className="gap-2"
      >
        {block.options.map((o) => (
          <ChoiceCard
            key={o.id}
            value={o.id}
            disabled={!active}
            title={
              <span className="flex flex-wrap items-center gap-1.5">
                {o.sectionLabel}, row {o.row}
                {o.tags.includes('best-value') && (
                  <Badge variant="subtle" tone="success" size="xs">
                    Best value
                  </Badge>
                )}
                {o.tags.includes('closest') && (
                  <Badge variant="subtle" tone="info" size="xs">
                    Closest
                  </Badge>
                )}
              </span>
            }
            detail={`${together(o.seats, block.qty)} together · ${o.note}`}
            trailing={`${gbp(o.total)} each`}
          />
        ))}
      </RadioGroup>
      <p className="type-text-xs-normal text-muted-foreground">Official AXS tickets. Prices include fees. Sample prices and seats.</p>
      <Button intent="brand" size="lg" className="self-end" disabled={!active || !option} onClick={() => option && send({ type: 'pick-seats', optionId: option.id })}>
        Choose these seats
      </Button>
    </div>
  )
}

function ConfirmHold({ block, session, active, send }: BlockProps & { block: Extract<Block, { kind: 'confirm-hold' }> }) {
  const { option, qty } = block
  const found = findDate(option.dateId)
  const held = session.hold?.optionId === option.id
  return (
    <ApprovalCard
      status={held ? 'approved' : 'pending'}
      title="Hold these seats?"
      subtitle={`Holds them for ${HOLD_SECONDS / 60} minutes`}
      badge={held ? 'Held' : 'Your choice'}
      footer={
        held ? undefined : (
          <ShellFooter variant="card" note="Payment completes on AXS.">
            <Button intent="brand" size="lg" disabled={!active} onClick={() => send({ type: 'hold', optionId: option.id })}>
              Hold these {qty} seats
            </Button>
          </ShellFooter>
        )
      }
    >
      {found && <ApprovalCardField label="Show">{found.show.title}</ApprovalCardField>}
      {found && <ApprovalCardField label="When">{showDateLine(found.date.date, found.date.time)}</ApprovalCardField>}
      <ApprovalCardField label="Seats">
        {qty} × {option.sectionLabel}, row {option.row}, {together(option.seats, qty)}
      </ApprovalCardField>
      <ApprovalCardField label="Tickets">{qty} × {gbp(option.face)}</ApprovalCardField>
      <ApprovalCardField label="Fees">{qty} × {gbp(option.fee)}</ApprovalCardField>
      <ApprovalCardField label="Total, all-in">
        <strong className="type-text-sm-semibold">{gbp(option.total * qty)}</strong>
      </ApprovalCardField>
    </ApprovalCard>
  )
}

function Hold({ block, session, active, send }: BlockProps & { block: Extract<Block, { kind: 'hold' }> }) {
  const { hold, option } = block
  const found = findDate(hold.dateId)
  const replaced = session.hold?.holdId !== hold.holdId
  const [timedOut, setTimedOut] = useState(() => Date.now() >= hold.expiresAt)
  const over = replaced || timedOut
  return (
    <ApprovalCard
      status={over ? 'expired' : 'approved'}
      title={over ? (replaced ? 'Hold replaced' : 'Hold expired') : 'Your seats are held'}
      subtitle={found ? `${found.show.title} · ${spoken(found.date.date)}` : undefined}
      badge={over ? (replaced ? 'Replaced' : 'Expired') : 'Held'}
      footer={
        replaced ? (
          <ActionStatus status="expired">A newer hold replaced this one.</ActionStatus>
        ) : (
          <>
            <HoldCountdown
              expiredLabel="Seats released"
              expiresAt={hold.expiresAt}
              duration={HOLD_SECONDS}
              onExpire={() => setTimedOut(true)}
              expiredAction={
                <Button variant="outline" intent="neutral" size="sm" disabled={!active} onClick={() => send({ type: 'hold', optionId: hold.optionId })}>
                  Hold again
                </Button>
              }
            />
            {!over && (
              <ShellFooter variant="card" note="Payment completes on AXS. Nothing is charged here.">
                <Button intent="brand" size="lg" asChild>
                  <Link to={`/checkout/${hold.holdId}`}>Continue on AXS</Link>
                </Button>
              </ShellFooter>
            )}
          </>
        )
      }
    >
      <ApprovalCardField label="Seats">
        {hold.qty} × {option.sectionLabel}, row {option.row}, {together(option.seats, hold.qty)}
      </ApprovalCardField>
      <ApprovalCardField label="Total, all-in">
        <strong className="type-text-sm-semibold">{gbp(hold.total)}</strong>
      </ApprovalCardField>
    </ApprovalCard>
  )
}

function Handoff({ block, active, send }: BlockProps & { block: Extract<Block, { kind: 'handoff' }> }) {
  return (
    <ApprovalCard
      title="Hand over to a person?"
      subtitle="They see this, so you don’t repeat it"
      badge="Your choice"
      footer={
        <ShellFooter variant="card" note="In this preview, nothing reaches a person.">
          <Button intent="brand" size="lg" disabled={!active} onClick={() => send({ type: 'support', topic: 'send' })}>
            Send summary
          </Button>
        </ShellFooter>
      }
    >
      {block.lines.map((l) => (
        <ApprovalCardField key={l.label} label={l.label}>
          {l.value}
        </ApprovalCardField>
      ))}
    </ApprovalCard>
  )
}
