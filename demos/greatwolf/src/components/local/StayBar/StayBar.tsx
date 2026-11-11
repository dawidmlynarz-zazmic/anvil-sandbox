import { useEffect, useRef, useState } from 'react'
import { Stepper } from '@anvil/components/anvil/stepper'
import { Button } from '@anvil/components/ui/button'
import { Calendar } from '@anvil/components/ui/calendar'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@anvil/components/ui/collapsible'
import { CalendarIcon, CheckIcon, ChevronDownIcon, Icon, UsersIcon, XIcon } from '@anvil/components/ui/icon'
import { Popover, PopoverContent, PopoverTrigger } from '@anvil/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@anvil/components/ui/select'
import { cn } from '@anvil/lib/utils'
import { money } from '~/data/fixtures'
import { WileyTag } from '~/components/local/Brand/Brand'
import { reveal } from '~/lib/reveal'
import { quoteOf, useDemo } from '~/state/demo'
import { usePageWide } from '~/state/layout'
import { FIRST_DAY, guestsShort, LAST_DAY, NIGHTS, shortDates, stayDays, toDate, toIso, type Stay } from '~/state/stay'

/**
 * ANVIL-CANDIDATE (StayBar): the stay pinned under the header on every booking step, as greatwolf.com's booking bar
 * does. Dates open a calendar (two-night stays), guests open steppers with each child's age, and × clears the dates.
 * A change shows in the chat as the family's message and Wiley answers it. On a phone, once there's a trip, the bar
 * also holds the trip total and opens to every line (one pinned bar, not two), and says "Just added" when something
 * is added from the page or by Wiley.
 */

const STEPS: Record<1 | 2, number[]> = { 1: [2, 3, 4], 2: [2, 3, 4, 5, 6] }

/** Pickers stay inside the page area, so they fit the framed phone preview too, not just the window. */
const pageArea = () => document.getElementById('page-scroll')

function DatesField({ compact }: { compact: boolean }) {
  const { s, changeStay } = useDemo()
  const [open, setOpen] = useState(false)
  const start = s.stay.start ? toDate(s.stay.start) : undefined
  const days = start ? stayDays(s.stay) : null
  const label = shortDates(s.stay)
  return (
    // The dates never shrink (the × sits on them); the guests label truncates first on a narrow phone.
    <span className="relative inline-flex shrink-0">
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            shape="pill"
            variant="outline"
            intent="neutral"
            size={compact ? 'sm' : 'default'}
            className={cn('min-w-0 justify-start', label && 'pe-9', !label && 'border-dashed')}
            aria-label={label ? `Dates: ${label}. Change dates` : 'Add dates'}
          >
            <Icon icon={CalendarIcon} />
            <span className="truncate">{label ?? 'Add dates'}</span>
          </Button>
        </PopoverTrigger>
        <PopoverContent align="start" collisionBoundary={pageArea()} collisionPadding={8} className="w-auto p-2">
          <Calendar
            mode="single"
            selected={start}
            defaultMonth={start ?? toDate(FIRST_DAY)}
            startMonth={toDate(FIRST_DAY)}
            endMonth={toDate(LAST_DAY)}
            disabled={[{ before: toDate(FIRST_DAY) }, { after: toDate(LAST_DAY) }]}
            modifiers={start ? { stay: { from: start, to: new Date(start.getFullYear(), start.getMonth(), start.getDate() + NIGHTS) } } : undefined}
            modifiersClassNames={{ stay: 'gwl-stay-day' }}
            onSelect={(d) => {
              if (!d) return
              setOpen(false)
              if (toIso(d) !== s.stay.start) changeStay({ start: toIso(d) }, 'dates')
            }}
          />
          <p className="px-2 pb-1 type-text-xs-normal text-muted-foreground">
            {days ? `Check-in ${days[0].label} ${days[0].date} · check-out ${days[2].label} ${days[2].date} · ${NIGHTS} nights` : `Pick your check-in day. The demo plans ${NIGHTS}-night stays.`}
          </p>
        </PopoverContent>
      </Popover>
      {label && (
        <button
          type="button"
          aria-label="Clear dates"
          onClick={() => changeStay({ start: null }, 'clear')}
          className="absolute end-1.5 top-1/2 grid size-6 -translate-y-1/2 place-items-center rounded-full text-muted-foreground outline-none hover:bg-accent focus-visible:focus-ring"
        >
          <Icon icon={XIcon} size="xs" />
        </button>
      )}
    </span>
  )
}

function GuestsField({ compact }: { compact: boolean }) {
  const { s, changeStay } = useDemo()
  const [open, setOpen] = useState(false)
  const [draft, setDraft] = useState<Stay>(s.stay)
  const onOpen = (v: boolean) => {
    if (v) setDraft(s.stay)
    setOpen(v)
  }
  const setKids = (n: number) => setDraft((d) => ({ ...d, kids: n > d.kids.length ? [...d.kids, ...Array.from({ length: n - d.kids.length }, () => -1)] : d.kids.slice(0, n) }))
  const changed = draft.adults !== s.stay.adults || draft.kids.join() !== s.stay.kids.join()
  return (
    <Popover open={open} onOpenChange={onOpen}>
      <PopoverTrigger asChild>
        <Button shape="pill" variant="outline" intent="neutral" size={compact ? 'sm' : 'default'} className="min-w-0 justify-start" aria-label={`Guests: ${guestsShort(s.stay)}. Change guests`}>
          <Icon icon={UsersIcon} />
          <span className="truncate">{guestsShort(s.stay)}</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="start" collisionBoundary={pageArea()} collisionPadding={8} className="flex w-72 flex-col gap-3 p-4">
        <div className="flex items-center justify-between gap-3">
          <span className="flex flex-col">
            <span className="type-text-sm-semibold">Adults</span>
            <span className="type-text-xs-normal text-muted-foreground">18 and over</span>
          </span>
          <Stepper label="adults" min={1} max={6} value={draft.adults} onValueChange={(v) => setDraft((d) => ({ ...d, adults: v }))} />
        </div>
        <div className="flex items-center justify-between gap-3">
          <span className="flex flex-col">
            <span className="type-text-sm-semibold">Kids</span>
            <span className="type-text-xs-normal text-muted-foreground">Under 18</span>
          </span>
          <Stepper label="kids" min={0} max={5} value={draft.kids.length} onValueChange={setKids} />
        </div>
        {draft.kids.length > 0 && (
          <div className="grid grid-cols-2 gap-2">
            {draft.kids.map((age, i) => (
              <Select key={i} value={age >= 0 ? String(age) : undefined} onValueChange={(v) => setDraft((d) => ({ ...d, kids: d.kids.map((a, j) => (j === i ? Number(v) : a)) }))}>
                <SelectTrigger aria-label={`Age of kid ${i + 1}`} className="w-full">
                  <SelectValue placeholder={`Kid ${i + 1} age`} />
                </SelectTrigger>
                <SelectContent>
                  {Array.from({ length: 18 }, (_, a) => (
                    <SelectItem key={a} value={String(a)}>
                      {a === 0 ? 'Under 1' : `${a} ${a === 1 ? 'year' : 'years'}`}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            ))}
          </div>
        )}
        <p className="type-text-xs-normal text-muted-foreground">Ages help Wiley suggest the right pools, passes and activities.</p>
        <div className="flex justify-end gap-2">
          <Button shape="pill" size="sm" variant="ghost" intent="neutral" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button
            shape="pill"
            size="sm"
            disabled={!changed}
            onClick={() => {
              setOpen(false)
              changeStay({ adults: draft.adults, kids: draft.kids }, 'guests')
            }}
          >
            Done
          </Button>
        </div>
      </PopoverContent>
    </Popover>
  )
}

/** On a phone: the trip total beside the stay, opening to every line. */
function useFlash() {
  const { s } = useDemo()
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
  return flash
}

export function StayBar() {
  const { s, step, journey } = useDemo()
  const desktop = usePageWide()
  const [open, setOpen] = useState(false)
  const flash = useFlash()
  const q = quoteOf(s)
  if (!STEPS[journey].includes(step)) return null
  const tag = s.stay.by === 'wiley' ? <WileyTag>Set by Wiley</WileyTag> : s.stay.by === 'you' ? <span className="type-text-xs-semibold text-muted-foreground">Set by you</span> : null
  const goLine = (id: string) => {
    setOpen(false)
    window.setTimeout(() => reveal(id === 'suite' ? 'trip-suite' : `extra-${id}`), 120)
  }
  if (desktop) {
    return (
      <div role="region" aria-label="Your stay" className="sticky top-0 z-20 border-b bg-background/95 shadow-[0_6px_16px_rgb(7_39_69/0.06)] backdrop-blur print:hidden">
        <div className="mx-auto flex max-w-7xl items-center gap-3 px-8 py-2.5">
          <span className="type-text-xs-semibold tracking-wide text-muted-foreground uppercase">Your stay</span>
          <DatesField compact={false} />
          <GuestsField compact={false} />
          {tag}
        </div>
      </div>
    )
  }
  const lines = q && (
    <CollapsibleContent className="gwl-collapse overflow-hidden">
      <ul className="flex max-h-[50vh] flex-col overflow-y-auto border-t px-4 py-2">
        {q.lines.map((l) => (
          <li key={l.id}>
            <button type="button" disabled={l.id === 'passes'} onClick={() => goLine(l.id)} className="flex min-h-11 w-full items-center justify-between gap-3 text-start type-text-sm-normal outline-none focus-visible:focus-ring disabled:cursor-default">
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
  )
  return (
    <Collapsible open={open} onOpenChange={setOpen} role="region" aria-label="Your stay" className="sticky top-0 z-20 border-b bg-background shadow-[0_6px_16px_rgb(7_39_69/0.08)] print:hidden">
      <div className="flex items-center gap-2 px-4 py-2">
        <DatesField compact />
        <GuestsField compact />
        {q && (
          <CollapsibleTrigger asChild>
            <Button shape="pill" size="sm" variant="ghost" intent="neutral" className="ms-auto shrink-0 px-2" aria-label={`Trip total ${money(q.total)}. ${open ? 'Hide' : 'Show'} trip`}>
              <span aria-live="polite">
                {flash ? (
                  <span key={flash} className="gwl-fade inline-flex items-center gap-1 text-success-strong">
                    <Icon icon={CheckIcon} size="xs" /> Added
                  </span>
                ) : (
                  money(q.total)
                )}
              </span>
              <Icon icon={ChevronDownIcon} size="xs" className={cn('transition-transform duration-200', open && 'rotate-180')} />
            </Button>
          </CollapsibleTrigger>
        )}
      </div>
      {lines}
    </Collapsible>
  )
}
