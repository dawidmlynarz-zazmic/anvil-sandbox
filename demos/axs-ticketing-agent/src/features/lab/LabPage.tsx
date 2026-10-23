import { useState } from 'react'
import { gbp, showDateLine } from '~/lib/format'
import { STARTERS } from '~/services/agent'
import { useSession } from '~/state/session'
import type { Action, Block, Turn } from '~/state/types'

// Dev-only, deliberately unstyled: drives the scripted agent and the mock tools so the data and the replies can be
// checked before any screen exists. Not part of the demo.
export function LabPage() {
  const { session, busy, send, reset } = useSession()
  const [text, setText] = useState('')
  const go = (a: Action) => void send(a)

  return (
    <main style={{ font: '14px/1.5 system-ui', maxWidth: 760, margin: '0 auto', padding: 16 }}>
      <h1>Lab: scripted agent</h1>
      <p>
        <button onClick={reset}>Reset</button> {STARTERS.map((s) => (
          <button key={s} onClick={() => go({ type: 'text', text: s })} style={{ marginRight: 4 }}>
            {s}
          </button>
        ))}
      </p>
      <form
        onSubmit={(e) => {
          e.preventDefault()
          if (text.trim()) go({ type: 'text', text })
          setText('')
        }}
      >
        <input aria-label="Message" value={text} onChange={(e) => setText(e.target.value)} style={{ width: '70%' }} /> <button>Send</button>
        {busy && ' …working'}
      </form>
      <pre data-testid="state">{JSON.stringify({ criteria: session.criteria, consent: session.consent, selection: session.selection }, null, 1)}</pre>
      {session.turns.map((t) => (
        <TurnView key={t.id} turn={t} go={go} />
      ))}
    </main>
  )
}

function TurnView({ turn, go }: { turn: Turn; go: (a: Action) => void }) {
  return (
    <section style={{ borderTop: '1px solid #8886', padding: '8px 0' }} data-role={turn.role}>
      <b>{turn.role}:</b> {turn.text}
      {turn.tools?.map((t) => (
        <div key={t.label} style={{ opacity: 0.7 }}>
          ⚙ {t.name} — {t.label} ({t.detail})
        </div>
      ))}
      {turn.blocks?.map((b, i) => <BlockView key={i} block={b} go={go} />)}
      <div>
        {turn.chips?.map((c) => (
          <button key={c.label} onClick={() => go(c.action)} style={{ marginRight: 4 }}>
            {c.label}
          </button>
        ))}
      </div>
    </section>
  )
}

function BlockView({ block, go }: { block: Block; go: (a: Action) => void }) {
  switch (block.kind) {
    case 'shows':
      return (
        <ul>
          {block.shows.map((s) => (
            <li key={s.showId}>
              {s.title} · {s.venue} · from {gbp(s.fromPrice)} each · {s.dates.map((d) => showDateLine(d.date, d.time)).join(' / ')}
              {s.rankedForYou && block.ranked ? ' · Ranked for you' : ''}{' '}
              <button onClick={() => go({ type: 'view-dates', showId: s.showId })}>View dates</button>
            </li>
          ))}
        </ul>
      )
    case 'consent':
      return (
        <p>
          [consent] Personalise results? <button onClick={() => go({ type: 'consent', allow: false })}>Not now</button>{' '}
          <button onClick={() => go({ type: 'consent', allow: true })}>Allow</button>
        </p>
      )
    case 'dates':
      return (
        <p>
          {block.show.dates.map((d) => (
            <button key={d.id} onClick={() => go({ type: 'pick-date', dateId: d.id })} style={{ marginRight: 4 }}>
              {showDateLine(d.date, d.time)} · from {gbp(d.fromPrice)} · {d.level}
            </button>
          ))}
        </p>
      )
    case 'quantity':
      return <p>{[1, 2, 3, 4].map((q) => <button key={q} onClick={() => go({ type: 'set-qty', qty: q })}>{q}</button>)}</p>
    case 'seats':
      return (
        <ul>
          {block.options.map((o) => (
            <li key={o.id}>
              {o.sectionLabel} · row {o.row} · seats {o.seats.slice(0, block.qty).join(', ')} · {gbp(o.total)} each (face {gbp(o.face)} + fee {gbp(o.fee)}) {o.tags.join(' ')}{' '}
              {o.stepFree ? '♿ ' : ''}
              <button onClick={() => go({ type: 'pick-seats', optionId: o.id })}>Choose</button>
            </li>
          ))}
        </ul>
      )
    case 'confirm-hold':
      return (
        <p>
          Hold {block.qty} × {block.option.sectionLabel}: {gbp(block.option.total * block.qty)} total{' '}
          <button onClick={() => go({ type: 'hold', optionId: block.option.id })}>Hold these {block.qty} seats</button>
        </p>
      )
    case 'hold':
      return (
        <p>
          Hold {block.hold.holdId}, expires {new Date(block.hold.expiresAt).toLocaleTimeString()}, total {gbp(block.hold.total)} → <a href={`/checkout/${block.hold.holdId}`}>checkout stub</a>
        </p>
      )
    case 'empty':
      return <p>[nothing to show]</p>
  }
}
