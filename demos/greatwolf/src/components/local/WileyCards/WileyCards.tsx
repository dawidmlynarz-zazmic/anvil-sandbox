import { useState } from 'react'
import { Button } from '@anvil/components/ui/button'
import { Card } from '@anvil/components/ui/card'
import { Checkbox } from '@anvil/components/ui/checkbox'
import { CheckIcon, Icon, SparklesIcon } from '@anvil/components/ui/icon'
import { Input } from '@anvil/components/ui/input'
import { cn } from '@anvil/lib/utils'
import { money } from '~/data/fixtures'
import { quoteOf, useDemo } from '~/state/demo'
import type { Option } from '~/wiley/types'

// ANVIL-CANDIDATE (AiChip): a suggested next prompt. Styled as greatwolf.com's AI Planner options (an outlined box
// with bold navy text), plus a sparkle so it reads as "ask the AI this". Anvil's Quick Reply is one style for all.
const CHIP =
  'gwl-in inline-flex min-h-11 items-center gap-2 rounded-xl border-[1.5px] px-4 py-2.5 text-left type-text-sm-semibold font-bold transition-colors outline-none focus-visible:focus-ring'

export function AiChip({ children, onClick, block }: { children: string; onClick: () => void; block?: boolean }) {
  return (
    <button type="button" onClick={onClick} className={cn(CHIP, 'border-[var(--border-action)] bg-background text-foreground hover:bg-accent', block && 'w-full')}>
      <Icon icon={SparklesIcon} size="xs" className="shrink-0" />
      {children}
    </button>
  )
}

export function AnswerChip({ children, onClick, pressed }: { children: string; onClick: () => void; pressed?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-pressed={pressed}
      className={cn(CHIP, pressed ? 'border-[var(--gwl-navy)] bg-[var(--gwl-navy)] text-[var(--gwl-navy-foreground)]' : 'border-[var(--border-action)] bg-background text-foreground hover:bg-accent')}
    >
      {pressed && <Icon icon={CheckIcon} size="xs" />}
      {children}
    </button>
  )
}

export function Chips({ style, options, onPick }: { style: 'answer' | 'ai'; options: Option[]; onPick: (o: Option) => void }) {
  return (
    <div className="flex flex-wrap gap-2" role="group" aria-label="Suggested replies">
      {options.map((o) =>
        style === 'ai' ? (
          <AiChip key={o.label} onClick={() => onPick(o)}>
            {o.label}
          </AiChip>
        ) : (
          <AnswerChip key={o.label} onClick={() => onPick(o)}>
            {o.label}
          </AnswerChip>
        ),
      )}
    </div>
  )
}

/** The running trip total. Reads the chosen rate and the cart, so it updates when Wiley adds something. */
export function TripQuote({ title = 'Your trip · sample prices', className, checkout }: { title?: string; className?: string; checkout?: boolean }) {
  const { s } = useDemo()
  const q = quoteOf(s)
  if (!q) return null
  if (checkout) {
    // Checkout summary: the rate under the suite, no water park line, no "Just added" tags.
    const extras = q.lines.filter((l) => l.id !== 'suite' && l.id !== 'passes')
    const suite = q.lines[0]
    return (
      <Card className={cn('w-full gap-0 p-4', className)}>
        <p className="type-text-xs-semibold tracking-wide text-muted-foreground uppercase">{title}</p>
        <ul className="mt-2 flex flex-col gap-1.5 type-text-sm-normal">
          <li className="flex items-baseline justify-between gap-3">
            <span>{suite.label}</span>
            <span className="type-text-sm-semibold">{money(suite.amount)}</span>
          </li>
          <li className="text-muted-foreground">
            {q.rate.plan} · {q.rate.member ? 'Voyagers Club rate' : 'Non-member rate'}
          </li>
          {extras.map((l) => (
            <li key={l.id} className="flex items-baseline justify-between gap-3">
              <span>{l.label}</span>
              <span className="type-text-sm-semibold">{l.id === 'magiquest' ? 'from $—' : money(l.amount)}</span>
            </li>
          ))}
        </ul>
        <div className="mt-3 flex items-baseline justify-between border-t pt-3">
          <span className="type-text-sm-semibold">Total</span>
          <span className="type-text-lg-semibold">{money(q.total)}</span>
        </div>
      </Card>
    )
  }
  return (
    <Card className={cn('w-full gap-0 p-4', className)} aria-live="polite">
      <p className="type-text-xs-semibold tracking-wide text-muted-foreground uppercase">{title}</p>
      <ul className="mt-2 flex flex-col gap-1.5">
        {q.lines.map((l) => (
          <li key={l.id} className="flex items-baseline justify-between gap-3 type-text-sm-normal">
            <span>
              {l.label}
              {l.detail && l.detail !== 'Just added' && ` · ${l.detail}`}
              {l.detail === 'Just added' && <span className="ms-2 rounded-sm bg-success-soft px-1.5 py-0.5 type-text-xs-medium whitespace-nowrap text-success-strong">Just added</span>}
            </span>
            <span className="type-text-sm-semibold whitespace-nowrap">{l.id === 'passes' ? 'Included' : l.id === 'magiquest' ? 'from $—' : money(l.amount)}</span>
          </li>
        ))}
      </ul>
      <div className="mt-3 flex items-baseline justify-between border-t pt-3">
        <span className="type-text-sm-semibold">Total</span>
        <span className="type-text-lg-semibold">{money(q.total)}</span>
      </div>
    </Card>
  )
}

const WEEKENDS = ['Mar 5 – 7', 'Mar 12 – 14', 'Cheapest one']
const PRIORITIES = [
  { label: 'Bunk beds for the kids', value: 'bunks' },
  { label: 'Balcony & view', value: 'view' },
  { label: 'Lowest price', value: 'price' },
] as const

/** Two quick questions. Desktop shows both; mobile asks the second once the first is answered. */
export function QuestionsCard({ done, answer: given, onDone }: { done?: boolean; answer?: { weekend: string; priority: string }; onDone: (p: { weekend: string; priority: string }) => void }) {
  const { desktop } = useDemo()
  const [picked, setWeekend] = useState<string | null>(null)
  const [chosen, setPriority] = useState<string | null>(null)
  const weekend = given?.weekend ?? picked
  const priority = given?.priority ?? chosen
  const answer = (w: string | null, p: string | null) => {
    if (w && p && !done) onDone({ weekend: w, priority: p })
  }
  return (
    <Card className="w-full gap-4 p-4">
      <p className="type-text-xs-semibold tracking-wide text-muted-foreground uppercase">Quick questions</p>
      <fieldset className="flex flex-col gap-2" disabled={done}>
        <legend className="mb-2 type-text-sm-semibold">Which March weekend?</legend>
        <div className="flex flex-wrap gap-2">
          {WEEKENDS.map((w) => (
            <AnswerChip key={w} pressed={weekend === w} onClick={() => (setWeekend(w), answer(w, priority))}>
              {w}
            </AnswerChip>
          ))}
        </div>
      </fieldset>
      {(desktop || weekend) && (
        <fieldset className="gwl-in flex flex-col gap-2" disabled={done}>
          <legend className="mb-2 type-text-sm-semibold">What matters most?</legend>
          <div className="flex flex-wrap gap-2">
            {PRIORITIES.map((p) => (
              <AnswerChip key={p.value} pressed={priority === p.value} onClick={() => (setPriority(p.value), answer(weekend, p.value))}>
                {p.label}
              </AnswerChip>
            ))}
          </div>
        </fieldset>
      )}
    </Card>
  )
}

/** Sends the saved plan to a phone or email. No account needed. */
export function CaptureCard({ done, onDone }: { done?: boolean; onDone: (p: { to: string }) => void }) {
  const { desktop } = useDemo()
  const [to, setTo] = useState('')
  const [error, setError] = useState(false)
  if (done) {
    return (
      <Card className="w-full flex-row items-center gap-2 p-4 type-text-sm-medium">
        <Icon icon={CheckIcon} className="text-success" />
        Plan sent{to ? ` to ${to}` : ''}
      </Card>
    )
  }
  return (
    <Card className="w-full gap-3 p-4">
      <form
        className="flex flex-col gap-3"
        onSubmit={(e) => {
          e.preventDefault()
          if (!to.trim()) return setError(true)
          onDone({ to: to.trim() })
        }}
      >
        <label htmlFor="capture-to" className="type-text-xs-semibold tracking-wide text-muted-foreground uppercase">
          Send my plan
        </label>
        <Input id="capture-to" value={to} onChange={(e) => (setTo(e.target.value), setError(false))} placeholder="Mobile number or email" aria-invalid={error || undefined} aria-describedby={error ? 'capture-error' : undefined} />
        {error && (
          <p id="capture-error" className="type-text-xs-normal text-danger-medium">
            Add a mobile number or email.
          </p>
        )}
        {desktop && (
          <label className="flex items-center gap-2 type-text-sm-normal">
            <Checkbox />
            Text me if the price drops (optional)
          </label>
        )}
        <Button type="submit" shape="pill" className="w-full">
          Send my plan
        </Button>
      </form>
    </Card>
  )
}
