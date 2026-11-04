import { useEffect, useRef } from 'react'
import { Badge } from '@anvil/components/ui/badge'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@anvil/components/ui/card'
import { Icon, TriangleAlertIcon } from '@anvil/components/ui/icon'
import { AgentChat } from '~/components/local/AgentChat/AgentChat'
import { DeviceFrame } from '~/components/local/DeviceFrame/DeviceFrame'
import { TicketStatusCard } from '~/components/local/TicketStatusCard/TicketStatusCard'
import { family } from '~/data/family'
import { inventory } from '~/data/inventory'
import { match, useChat, type Reply } from '~/lib/chat'
import { money } from '~/lib/format'
import { useStore, type Session } from '~/state/store'

interface Line {
  id: string
  label: string
  plain: string
  amount: number
  flag?: boolean
  credit?: boolean
}

export function folioOf(s: Session): { lines: Line[]; total: number } {
  const suite = inventory.suites[s.trip.suite]
  const nights = s.trip.season === 'spring' ? s.trip.nights : 2
  const lines: Line[] = [
    { id: 'suite', label: `${suite.name}, ${nights} nights`, plain: 'Your room, with water park passes for everyone.', amount: suite.nightly * nights },
    { id: 'party', label: inventory.party.name, plain: 'The party room for 90 minutes, a host and cake.', amount: inventory.party.price },
    { id: 'cabana', label: 'Cabana 12, Sat 1–3 pm', plain: 'Your pool-side cabana.', amount: inventory.cabana.price },
    { id: 'cabana2', label: 'Cabana 12, Sat 1–3 pm', plain: 'The same cabana, charged a second time.', amount: inventory.cabana.price, flag: s.ticket !== 'resolved' },
  ]
  if (s.trip.season === 'spring' && s.trip.dining) lines.push({ id: 'dining', label: inventory.dining.name, plain: 'Meals for two days.', amount: inventory.dining.price })
  if (s.ticket === 'resolved') lines.push({ id: 'credit', label: 'Refund: duplicate cabana charge', plain: 'Credited by the front desk.', amount: -inventory.cabana.price, credit: true })
  return { lines, total: lines.reduce((sum, l) => sum + l.amount, 0) }
}

function Folio() {
  const { session } = useStore()
  const { lines, total } = folioOf(session)
  return (
    <Card size="sm" className="w-full" data-slot="folio">
      <CardHeader>
        <CardTitle>Your bill so far</CardTitle>
        <CardDescription>Suite {family.suite} · Mar 12 to 14</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-3">
        <ul className="flex flex-col gap-3">
          {lines.map((l) => (
            <li key={l.id} className="flex items-start justify-between gap-3">
              <span className="flex min-w-0 flex-col gap-0.5">
                <span className="type-text-sm-medium">{l.label}</span>
                <span className="type-text-xs-normal text-muted-foreground">{l.plain}</span>
                {l.flag && <Badge variant="subtle" tone="warning" size="xs" className="mt-1 w-fit"><Icon icon={TriangleAlertIcon} />Looks like a duplicate</Badge>}
              </span>
              <span className={`type-text-sm-normal shrink-0 tabular-nums ${l.credit ? 'text-success-medium' : ''}`}>{money(l.amount)}</span>
            </li>
          ))}
        </ul>
        <div className="type-text-sm-semibold flex justify-between border-t pt-3">
          <span>Total so far</span>
          <span className="tabular-nums">{money(total)}</span>
        </div>
      </CardContent>
    </Card>
  )
}

function LiveTicket() {
  const { session } = useStore()
  const done = session.ticket === 'resolved'
  return (
    <TicketStatusCard
      title="Refund for the second cabana charge"
      reference="GW-4821"
      stage={done ? 'resolved' : 'reviewing'}
      message={done ? `Refunded ${money(inventory.cabana.price)}. The credit is on your bill above.` : 'The front desk has your request. This usually takes a few minutes.'}
    />
  )
}

export function ChargeScreen() {
  const { session, patch } = useStore()
  const sessionRef = useRef(session)
  sessionRef.current = session
  const folio = { widget: <Folio />, widgetKey: 'folio' }
  const ticket = { widget: <LiveTicket />, widgetKey: 'ticket' }
  const both = { widget: <div className="flex w-full flex-col gap-3"><Folio /><LiveTicket /></div>, widgetKey: 'folio' }

  const respond = (text: string): Reply => {
    const s = sessionRef.current
    return match<Reply>(
      text,
      [
        [/refund|request|yes|dispute|fix|ask the front/i, s.ticket === 'none'
          ? {
              tools: ['Filed a refund request with the front desk'],
              text: `Done. I asked the front desk to refund the second cabana charge, ${money(inventory.cabana.price)}. They can see the bill and my notes. This usually takes a few minutes, and the status is below.`,
              effect: () => patch({ ticket: 'requested' }),
              ...ticket,
            }
          : { text: s.ticket === 'resolved' ? 'Already done: the refund is on your bill.' : 'The request is with the front desk. This usually takes a few minutes.', ...ticket }],
        [/twice|duplicate|double|cabana|wrong|off|why/i, {
          tools: ['Checked the bill against your bookings'],
          text: s.ticket === 'resolved'
            ? 'The second cabana charge was a duplicate, and it has been refunded.'
            : `Cabana 12 for Saturday, 1 to 3 pm, shows up twice at ${money(inventory.cabana.price)}. You booked it once, so the second charge looks like a duplicate. I can ask the front desk to refund it.`,
          chips: s.ticket === 'none' ? [{ label: 'Request a refund' }, { label: 'Leave it for now' }] : [{ label: 'Where is my request?' }],
        }],
        [/status|where is|ticket|update/i, { text: s.ticket === 'none' ? 'You haven’t asked for a refund yet. Want me to?' : 'Here’s where it stands.', ...(s.ticket === 'none' ? { chips: [{ label: 'Request a refund' }] } : ticket) }],
        [/leave|later|no\b|never mind/i, { text: 'No problem. The charge stays on your bill until you decide. I’m here if you change your mind.', chips: s.ticket === 'none' ? [{ label: 'Request a refund' }] : undefined }],
        [/party|cake|birthday/i, { text: `The ${inventory.party.name.toLowerCase()} is ${money(inventory.party.price)}: ${inventory.party.note.toLowerCase()}.` }],
        [/suite|night|room/i, { text: 'The suite line is your room for two nights, with water park passes for everyone.' }],
        [/person|human|front desk/i, { text: 'The front desk can already see your bill and this chat, so you won’t need to explain again.' }],
      ],
      {
        text: 'I can explain any line on your bill, or ask the front desk to fix one. Which line looks wrong?',
        chips: [{ label: 'Why is the cabana on here twice?' }, { label: 'What is the party charge?' }],
      },
    )
  }

  const opening: Reply =
    session.ticket === 'none'
      ? { text: 'Here’s your bill so far, in plain words. One line looks off.', ...folio, chips: [{ label: 'Why is the cabana on here twice?' }, { label: 'What is the party charge?' }] }
      : session.ticket === 'requested'
        ? { text: 'Here’s your bill. Your refund request is with the front desk.', ...both }
        : { text: 'Here’s your bill. The refund went through.', ...both }

  const chat = useChat(respond, opening)

  // When the front desk refunds while this screen is open, the agent says so.
  const was = useRef(session.ticket)
  useEffect(() => {
    if (was.current !== 'resolved' && session.ticket === 'resolved') chat.agentSay({ text: `Good news: the front desk refunded ${money(inventory.cabana.price)}. Your bill is updated.`, ...ticket, delay: 400 })
    was.current = session.ticket
  })

  return (
    <DeviceFrame kind="phone">
      <div className="flex h-12 shrink-0 items-center justify-between border-b px-4">
        <span className="type-text-sm-semibold">Your bill</span>
        <span className="type-text-xs-medium text-muted-foreground">Suite {family.suite}</span>
      </div>
      <AgentChat chat={chat} name="Concierge" subtitle="Explains your bill" surface="mobile" placeholder="Ask about a charge" disclaimer="Scripted demo. Nothing is charged or refunded for real." />
    </DeviceFrame>
  )
}
