import { useEffect, useState } from 'react'
import { ChatShell, ChatShellComposer, ChatShellThread } from '@anvil/components/agent/chat-shell'
import { MessageRow } from '@anvil/components/agent/message-row'
import { PromptInput } from '@anvil/components/agent/prompt-input'
import { Rating } from '@anvil/components/agent/rating'
import { TextShimmer } from '@anvil/components/agent/text-shimmer'
import { Badge } from '@anvil/components/ui/badge'
import { Button } from '@anvil/components/ui/button'
import { Card } from '@anvil/components/ui/card'
import { BellIcon, BellRingIcon, CheckIcon, Icon, MicIcon, UserRoundIcon, XIcon } from '@anvil/components/ui/icon'
import { MessageScrollerItem, useMessageScroller } from '@anvil/components/ui/message-scroller'
import { ToggleGroup, ToggleGroupItem } from '@anvil/components/ui/toggle-group'
import { cn } from '@anvil/lib/utils'
import { WileyAvatar } from '~/components/local/Brand/Brand'
import { Chips } from '~/components/local/WileyCards/WileyCards'
import { families, money } from '~/data/fixtures'
import { fits, heightRule, ROOM, rides, staff } from '~/data/lodgeApp'
import { quoteOf, useDemo } from '~/state/demo'
import { toPerson } from '~/wiley/scripts/j3'
import type { Msg } from '~/wiley/types'

// ANVIL-CANDIDATE (Concierge thread): one chat where the AI assistant and people on the lodge team take turns. A
// person's messages carry their name, role and a "Person" tag; joins and leaves are system lines; Wiley's summary goes
// to the person first. Built on Anvil's Chat Shell, Message Row and Prompt Input.

export function StaffAvatar({ size = 28 }: { size?: number }) {
  return (
    <span className="inline-grid shrink-0 place-items-center rounded-full bg-[var(--gwl-staff-strong)] font-bold text-[#fff]" style={{ width: size, height: size, fontSize: size * 0.42 }} aria-hidden>
      {staff.initials}
    </span>
  )
}

function FollowEnd({ signal }: { signal: string }) {
  const { scrollToEnd } = useMessageScroller()
  useEffect(() => {
    scrollToEnd({ behavior: 'smooth' })
    const late = window.setTimeout(() => scrollToEnd({ behavior: 'auto' }), 700)
    return () => window.clearTimeout(late)
  }, [signal, scrollToEnd])
  return null
}

const streamed = (text: string, reveal?: number) => (reveal === undefined ? text : text.split(' ').slice(0, Math.max(1, Math.ceil(text.split(' ').length * reveal))).join(' '))

// ── Cards ───────────────────────────────────────────────────────────────────────────────────────────────────────

const ARRIVALS = ['Around 1 pm', 'Around 4 pm', 'After 6 pm']

function CheckInCard({ done, answer, onDone }: { done?: boolean; answer?: { arrival: string }; onDone: (p: { arrival: string }) => void }) {
  const [arrival, setArrival] = useState(answer?.arrival ?? ARRIVALS[0])
  return (
    <Card className="gwl-in w-full gap-3 rounded-2xl p-4">
      <div>
        <p className="type-text-sm-semibold">Check in for Fri Mar 12</p>
        <p className="type-text-xs-normal text-muted-foreground">Junior Wolf Pup Den Suite · 2 adults, 2 kids</p>
      </div>
      <div className="flex flex-col gap-1.5">
        <span className="type-text-xs-semibold">When will you get to the lodge?</span>
        <ToggleGroup type="single" variant="outline" size="sm" value={arrival} onValueChange={(v) => v && setArrival(v)} disabled={done} aria-label="Arrival time" className="flex-wrap justify-start">
          {ARRIVALS.map((a) => (
            <ToggleGroupItem key={a} value={a}>
              {a}
            </ToggleGroupItem>
          ))}
        </ToggleGroup>
      </div>
      <ul className="flex flex-col gap-1 type-text-xs-normal text-muted-foreground">
        <li>Charges go on the {families.martinez.card}.</li>
        <li>The guest checking in must be 21 or older, with an ID.</li>
      </ul>
      {done ? (
        <p className="flex items-center gap-1.5 type-text-sm-semibold text-success-strong">
          <Icon icon={CheckIcon} size="xs" /> Checked in
        </p>
      ) : (
        <Button shape="pill" onClick={() => onDone({ arrival })}>
          Check in
        </Button>
      )}
    </Card>
  )
}

export const TODAY = [
  { id: 'water', time: 'Now', title: 'Water park', sub: 'Open until closing tonight' },
  { id: 'dinner', time: '6:30 pm', title: 'Dinner at Loose Moose Family Kitchen', sub: 'From your weekend plan' },
  { id: 'story', time: '8:15 pm', title: 'Epic Story Time', sub: 'Grand Lobby fireplace · free' },
]

function TodayCard({ done, onDone }: { done?: boolean; onDone: () => void }) {
  const { s } = useDemo()
  return (
    <Card className="gwl-in w-full gap-0 rounded-2xl p-0">
      <p className="px-4 pt-3 pb-1 type-text-sm-semibold">Today · Fri Mar 12</p>
      <ul className="flex flex-col">
        {TODAY.map((t) => {
          const on = s.app.reminders.includes(t.id)
          return (
            <li key={t.id} className="flex items-center gap-3 border-t px-4 py-2.5 first:border-t-0">
              <span className="w-14 shrink-0 type-text-xs-semibold text-[var(--gwl-teal)]">{t.time}</span>
              <span className="min-w-0 flex-1">
                <span className="block type-text-sm-medium">{t.title}</span>
                <span className="block type-text-xs-normal text-muted-foreground">{t.sub}</span>
              </span>
              {t.id !== 'water' && <Icon icon={on ? BellRingIcon : BellIcon} className={cn('size-4', on ? 'text-[var(--gwl-teal)]' : 'text-muted-foreground')} aria-label={on ? 'Reminder on' : 'No reminder'} />}
            </li>
          )
        })}
      </ul>
      <div className="border-t p-3">
        {done ? (
          <p className="flex items-center gap-1.5 type-text-sm-semibold text-success-strong">
            <Icon icon={CheckIcon} size="xs" /> Reminders on
          </p>
        ) : (
          <Button shape="pill" className="w-full" onClick={onDone}>
            Remind us
          </Button>
        )}
      </div>
    </Card>
  )
}

function HandoverCard({ title, lines }: { title: string; lines: [string, string][] }) {
  return (
    <Card className="gwl-in w-full gap-2 rounded-2xl border-dashed p-4">
      <div className="flex items-center justify-between gap-2">
        <span className="type-text-xs-semibold tracking-wide text-muted-foreground uppercase">Shared with the lodge team</span>
        <Badge variant="subtle" size="xs">
          {title}
        </Badge>
      </div>
      <dl className="grid grid-cols-[auto_1fr] gap-x-3 gap-y-1 type-text-sm-normal">
        {lines.map(([k, v]) => (
          <div key={k} className="contents">
            <dt className="text-muted-foreground">{k}</dt>
            <dd className="font-medium">{v}</dd>
          </div>
        ))}
      </dl>
    </Card>
  )
}

function RidesCard() {
  const { s } = useDemo()
  const h = s.app.heights
  if (!h) return null
  const Mark = ({ ok }: { ok: boolean }) => (ok ? <Icon icon={CheckIcon} className="size-4 text-success-strong" aria-label="Yes" /> : <Icon icon={XIcon} className="size-4 text-muted-foreground" aria-label="Not yet" />)
  return (
    <Card className="gwl-in w-full gap-0 rounded-2xl p-0">
      <div className="grid grid-cols-[1fr_44px_44px] items-center px-4 pt-3 pb-1.5 type-text-xs-semibold text-muted-foreground">
        <span>Ride</span>
        <span className="text-center">Mia</span>
        <span className="text-center">Leo</span>
      </div>
      <ul>
        {rides.map((r) => (
          <li key={r.id} className="grid grid-cols-[1fr_44px_44px] items-center border-t px-4 py-1.5">
            <span className="min-w-0">
              <span className="block truncate type-text-sm-medium">{r.name}</span>
              <span className="block type-text-xs-normal text-muted-foreground">{heightRule(r)}</span>
            </span>
            <span className="grid place-items-center">
              <Mark ok={fits(r, h.mia)} />
            </span>
            <span className="grid place-items-center">
              <Mark ok={fits(r, h.leo)} />
            </span>
          </li>
        ))}
      </ul>
      <p className="border-t px-4 py-2 type-text-xs-normal text-muted-foreground">
        Mia {h.mia}" · Leo {h.leo}". Heights from the lodge’s water park page.
      </p>
    </Card>
  )
}

/** Sample charges on the wristbands and the parking the lodge lists ($20 a night). */
const WRISTBAND = 64.2
const PARKING = 40

function BillCard({ done, onDone }: { done?: boolean; onDone: () => void }) {
  const { s } = useDemo()
  const q = quoteOf(s)
  if (!q) return null
  const lines = [
    { label: q.lines[0].label, price: money(q.lines[0].amount) },
    ...s.cart.map((c) => ({ label: c.label, price: c.price ?? money(c.amount) })),
    ...(s.app.lateCheckout ? [{ label: 'Late check-out until 2:00 pm', price: '$49.99*' }] : []),
    { label: 'Wristband purchases', price: `${money(WRISTBAND)}*` },
    { label: 'Parking, 2 nights', price: money(PARKING) },
  ]
  const total = q.total + WRISTBAND + PARKING + (s.app.lateCheckout ? 49.99 : 0)
  return (
    <Card className="gwl-in w-full gap-0 rounded-2xl p-0">
      <p className="px-4 pt-3 pb-1 type-text-sm-semibold">Your bill · Suite {ROOM}</p>
      <ul className="px-4">
        {lines.map((l) => (
          <li key={l.label} className="flex justify-between gap-3 py-1 type-text-sm-normal">
            <span className="min-w-0">{l.label}</span>
            <span className="shrink-0 font-medium">{l.price}</span>
          </li>
        ))}
        <li className="flex justify-between gap-3 py-1 type-text-sm-normal text-muted-foreground">
          <span>Taxes and fees</span>
          <span>[amount]</span>
        </li>
      </ul>
      <div className="mt-1 flex items-baseline justify-between border-t px-4 py-2.5">
        <span className="type-text-sm-semibold">Total before taxes</span>
        <span className="type-text-lg-semibold">{money(Math.round(total * 100) / 100)}</span>
      </div>
      <p className="px-4 pb-2 type-text-xs-normal text-muted-foreground">* Sample price · {families.martinez.card}</p>
      <div className="border-t p-3">
        {done ? (
          <p className="flex items-center gap-1.5 type-text-sm-semibold text-success-strong">
            <Icon icon={CheckIcon} size="xs" /> Checked out
          </p>
        ) : (
          <Button shape="pill" className="w-full" onClick={onDone}>
            Check out
          </Button>
        )}
      </div>
    </Card>
  )
}

// ── Thread ──────────────────────────────────────────────────────────────────────────────────────────────────────

function Item({ m }: { m: Msg }) {
  const { pick, submitCard } = useDemo()
  if (m.role === 'note') {
    return (
      <MessageScrollerItem messageId={String(m.id)}>
        <MessageRow role="system">{m.text}</MessageRow>
      </MessageScrollerItem>
    )
  }
  if (m.role === 'user') {
    return (
      <MessageScrollerItem messageId={String(m.id)}>
        <div className="flex flex-col items-end gap-1.5">
          {m.voice && (
            <Badge variant="subtle" size="xs">
              <Icon icon={MicIcon} />
              Voice · transcribed
            </Badge>
          )}
          <MessageRow role="user">{m.voice ? `“${m.text}”` : m.text}</MessageRow>
        </div>
      </MessageScrollerItem>
    )
  }
  if (m.chips) {
    return (
      <MessageScrollerItem messageId={String(m.id)}>
        <Chips style={m.chips.style} options={m.chips.options} onPick={(o) => pick(m.id, o)} />
      </MessageScrollerItem>
    )
  }
  if (m.card) {
    const c = m.card
    const done = () => submitCard(m.id, undefined)
    return (
      <MessageScrollerItem messageId={String(m.id)}>
        {c.component === 'checkin' && <CheckInCard done={c.done} answer={c.answer as never} onDone={(p) => submitCard(m.id, p)} />}
        {c.component === 'today' && <TodayCard done={c.done} onDone={done} />}
        {c.component === 'handover' && <HandoverCard {...(c.props as { title: string; lines: [string, string][] })} />}
        {c.component === 'rides' && <RidesCard />}
        {c.component === 'bill' && <BillCard done={c.done} onDone={done} />}
        {c.component === 'rating' && (
          <Rating
            className="gwl-in w-full"
            question="How was your stay at the Colorado Springs lodge?"
            value={(c.answer as { value?: number } | undefined)?.value}
            onValueChange={(v) => submitCard(m.id, { value: v })}
            thanks="Thanks, the lodge will see it."
          />
        )}
      </MessageScrollerItem>
    )
  }
  const staffMsg = m.from === 'staff'
  return (
    <MessageScrollerItem messageId={String(m.id)}>
      <div className={cn('flex flex-col gap-1', staffMsg && 'gwl-staff')}>
        <span className="flex items-center gap-1.5 type-text-xs-semibold text-muted-foreground">
          {staffMsg ? <StaffAvatar size={20} /> : <WileyAvatar size={20} />}
          {staffMsg ? `${staff.name} · ${staff.role}` : 'Wiley'}
          {staffMsg ? (
            <Badge variant="subtle" size="xs" className="ms-0.5">
              <Icon icon={UserRoundIcon} />
              Person
            </Badge>
          ) : (
            <Badge tone="agent" variant="subtle" size="xs" className="ms-0.5">
              AI
            </Badge>
          )}
        </span>
        <MessageRow role="assistant" status={m.reveal !== undefined ? 'streaming' : 'complete'}>
          {streamed(m.text ?? '', m.reveal)}
        </MessageRow>
      </div>
    </MessageScrollerItem>
  )
}

/** Who's in the chat: Wiley always; a person from the lodge team while they're here. */
export function Participants({ compact }: { compact?: boolean }) {
  const { s, ask, playing } = useDemo()
  const live = s.app.team === 'live'
  return (
    <div className={cn('flex items-center gap-2.5 border-b bg-background px-4', compact ? 'py-2' : 'py-2.5')}>
      <WileyAvatar size={32} online />
      <span className="min-w-0 flex-1">
        <span className="block type-text-sm-semibold">{live ? `Wiley and ${staff.name}` : 'Wiley'}</span>
        <span className="block truncate type-text-xs-normal text-muted-foreground">{live ? `${staff.name} from ${staff.role} is in the chat` : 'AI concierge · any time'}</span>
      </span>
      {live ? (
        <StaffAvatar size={32} />
      ) : (
        <Button shape="pill" size="sm" variant="outline" intent="neutral" disabled={playing} onClick={() => ask({ label: 'Talk to a person', then: toPerson })}>
          <Icon icon={UserRoundIcon} />
          Talk to a person
        </Button>
      )}
    </div>
  )
}

export function Thread() {
  const { msgs, thinking, composer, draft, playing, say, listen } = useDemo()
  const [text, setText] = useState('')
  const live = composer === 'live'
  return (
    <ChatShell surface="mobile" className="gwl-chat gwl-concierge min-h-0 flex-1">
      <ChatShellThread>
        <FollowEnd signal={`${msgs.length}:${thinking ?? ''}:${msgs.at(-1)?.reveal ?? 1}`} />
        {msgs.length === 0 && !thinking && !playing && (
          <MessageScrollerItem messageId="hello">
            <div className="flex flex-col items-center gap-2 px-4 pt-8 text-center">
              <WileyAvatar size={56} />
              <p className="gwl-display text-lg leading-tight">Hi Carlos, I’m Wiley</p>
              <p className="type-text-sm-normal text-muted-foreground">Ask me anything about your stay, day or night. When you need a person, I’ll bring in the lodge team.</p>
            </div>
          </MessageScrollerItem>
        )}
        {msgs.map((m) => (
          <Item key={m.id} m={m} />
        ))}
        {thinking && (
          <MessageScrollerItem messageId="thinking">
            <div role="status" aria-live="polite" className="flex items-center gap-2 type-text-sm-normal">
              {thinking.startsWith(staff.name) ? <StaffAvatar size={20} /> : <WileyAvatar size={20} />}
              <TextShimmer key={thinking}>{`${thinking}…`}</TextShimmer>
            </div>
          </MessageScrollerItem>
        )}
      </ChatShellThread>
      <ChatShellComposer disclaimer={<span className="block text-center">Wiley is AI and can make mistakes. People on the lodge team are marked “Person”.</span>}>
        <PromptInput
          size="compact"
          aria-label="Message the concierge"
          placeholder={live ? 'Listening…' : 'Message Wiley or the lodge team…'}
          value={composer === 'transcribing' ? draft : text}
          onValueChange={setText}
          onVoice={listen}
          listening={live}
          onSubmit={(t) => {
            if (!t.trim()) return
            say(t.trim())
            setText('')
          }}
        />
      </ChatShellComposer>
    </ChatShell>
  )
}

/** Ask Wiley over any screen: a sheet with the same thread as the Chat tab. */
export function WileySheet() {
  const { s, run } = useDemo()
  if (!s.app.sheet || s.app.tab === 'chat') return null
  const close = () => run([{ do: 'app', set: { sheet: false } }])
  return (
    <div className="absolute inset-0 z-30 flex flex-col justify-end">
      <button type="button" aria-label="Close Wiley" onClick={close} className="gwl-fade absolute inset-0 bg-[rgb(7_24_40/0.35)]" />
      <section role="dialog" aria-label="Wiley" className="gwl-up relative flex h-[78%] flex-col overflow-hidden rounded-t-[28px] bg-background shadow-[0_-12px_40px_rgb(7_39_69/0.25)]">
        <div className="flex items-center justify-between px-4 pt-3">
          <span className="mx-auto h-1.5 w-10 rounded-full bg-border-strong" aria-hidden />
        </div>
        <div className="flex items-center gap-2 px-4 pb-2">
          <span className="gwl-display flex-1 text-lg">Ask Wiley</span>
          <Button size="icon-sm" variant="ghost" intent="neutral" aria-label="Close" onClick={close}>
            <Icon icon={XIcon} />
          </Button>
        </div>
        <Participants compact />
        <Thread />
      </section>
    </div>
  )
}
