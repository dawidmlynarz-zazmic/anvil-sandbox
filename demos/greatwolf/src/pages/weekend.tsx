import { useEffect, useRef, useState, type ReactNode } from 'react'
import {
  DndContext,
  DragOverlay,
  MouseSensor,
  TouchSensor,
  pointerWithin,
  rectIntersection,
  useDraggable,
  useDroppable,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@anvil/components/ui/dropdown-menu'
import { cn } from '@anvil/lib/utils'
import { Button } from '@anvil/components/ui/button'
import { Card } from '@anvil/components/ui/card'
import { CalendarPlusIcon, EllipsisIcon, GripVerticalIcon, Icon, LockIcon, PrinterIcon } from '@anvil/components/ui/icon'
import { ToggleGroup, ToggleGroupItem } from '@anvil/components/ui/toggle-group'
import { lodge } from '~/data/fixtures'
import { art } from '~/data/photos'
import { Logo, Photo } from '~/components/local/Brand/Brand'
import { downloadCalendar } from '~/lib/calendar'
import { useDemo } from '~/state/demo'
import { usePageWide } from '~/state/layout'
import { isLocked, minutesOf, slotBetween, timeOf } from '~/state/plan'
import { stayDays } from '~/state/stay'
import type { PlanItem } from '~/wiley/types'
import { Page, PlanRow, Title } from './shared'

// The weekend by day, for both journeys (J1·4 and J2·6): day tabs on a phone (Friday first, following the day Wiley
// points at), three columns on desktop, plus calendar export and a print layout with every day.
//
// The family can rearrange it themselves. Desktop: drag a card by its grip into another day or between two cards; a
// line shows where it lands and the time is set from its neighbours. Phone: long-press the grip to drag within the
// day, or onto a day tab to move it there (holding over a tab opens that day). Every movable card also has a Move menu
// (another day, earlier, later), the dependable path on a phone and for keyboard users. Check-in, check-out and booked
// items are set by the lodge and stay put. Wiley confirms each move and says if it clashes with check-out.

export type Day = 'fri' | 'sat' | 'sun'

const MORE = [
  { id: 'garden', name: 'Garden of the Gods', sub: 'Free · red rock trails', tone: 'dusk' as const },
  { id: 'manitou', name: 'Manitou Springs', sub: 'Historic downtown', tone: 'den' as const },
  { id: 'wolf-center', name: 'Colorado Wolf and Wildlife Center', sub: 'About an hour away', tone: 'forest' as const },
]

interface Props {
  plan: PlanItem[]
  title: string
  tag?: ReactNode
  /** The page's primary action, after Add to calendar and Print. */
  primary?: ReactNode
  /** Before the days: e.g. the saved trip on J2·6. */
  lead?: ReactNode
  /** Print header: when, who and which suite. */
  printWhen: string
  printWho: string
  file: string
}

/** The full weekend for print: every day in order, whatever tab is open on screen. */
function PrintablePlan({ plan, when, who, days }: { plan: PlanItem[]; when: string; who: string; days: { key: Day; long: string; date: string }[] }) {
  return (
    <div className="hidden flex-col gap-5 print:flex">
      <div className="flex flex-col gap-1 border-b pb-4">
        <Logo className="h-6 self-start" />
        <p className="mt-3 type-text-lg-semibold">Your weekend · {when}</p>
        <p className="type-text-sm-normal">
          {who} · {lodge.name}, {lodge.city}
        </p>
      </div>
      {days.map((d) => (
        <section key={d.key} className="flex flex-col gap-2 break-inside-avoid">
          <h2 className="type-text-sm-semibold uppercase">
            {d.long} {d.date}
          </h2>
          <table className="w-full type-text-sm-normal">
            <tbody>
              {plan.filter((p) => p.day === d.key).map((p) => (
                <tr key={p.id} className="border-b align-top">
                  <td className="w-24 py-1.5 font-semibold">{p.time}</td>
                  <td className="py-1.5">
                    {p.title}
                    {p.sub && <span className="text-muted-foreground"> · {p.sub}</span>}
                  </td>
                  <td className="w-24 py-1.5 text-right">{p.status ?? ''}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </section>
      ))}
      <p className="type-text-xs-normal">Prototype itinerary. Times are planned, not reserved, unless marked Booked.</p>
    </div>
  )
}


/** Where a dragged card would land: before or after a card, or at the end of a day. */
type Target = { day: Day; row?: string; after?: boolean }

/** Prefer the card under the pointer, then the day (column or tab) under it. */
const collide: CollisionDetection = (args) => {
  const hits = pointerWithin(args)
  const rows = hits.filter((h) => String(h.id).startsWith('row:'))
  if (rows.length) return rows
  if (hits.length) return hits
  return rectIntersection(args)
}

function targetOf(e: DragOverEvent | DragEndEvent, plan: PlanItem[]): Target | null {
  const over = e.over
  if (!over) return null
  const [kind, key] = String(over.id).split(':')
  if (kind === 'day' || kind === 'tab') return { day: key as Day }
  const row = plan.find((p) => p.id === key)
  if (!row || row.id === String(e.active.id).slice(4)) return null
  const a = e.active.rect.current.translated
  const after = a ? a.top + a.height / 2 > over.rect.top + over.rect.height / 2 : false
  return { day: row.day, row: row.id, after }
}

/** The day and time a card gets at a target, read from the cards around it. */
function placeAt(plan: PlanItem[], id: string, t: Target) {
  const list = plan.filter((p) => p.day === t.day && p.id !== id)
  const i = t.row ? list.findIndex((p) => p.id === t.row) + (t.after ? 1 : 0) : list.filter((p) => p.id !== 'checkout').length
  return { day: t.day, time: slotBetween(list[i - 1], list[i]) }
}

/** What Wiley says about a move: where it went, and whether it clashes with check-out or another plan. */
function replyFor(plan: PlanItem[], item: PlanItem, day: Day, time: string, names: Record<Day, string>) {
  const parts = [`Moved ${item.title} to ${names[day]} at ${time}.`]
  const out = plan.find((p) => p.id === 'checkout')
  if (day === 'sun' && out && minutesOf(time) > minutesOf(out.time)) parts.push(`That’s after check-out at ${out.time} on ${names.sun}; your water park passes still work until closing, but the suite won’t be yours.`)
  const clash = plan.find((p) => p.id !== item.id && p.day === day && Math.abs(minutesOf(p.time) - minutesOf(time)) < 30)
  if (clash) parts.push(`It’s close to ${clash.title} at ${clash.time}, so check you have time for both.`)
  return parts.join(' ')
}

/** A day tab that also takes drops; holding a card over it opens that day. */
function DayTab({ d, children, onHover }: { d: Day; children: ReactNode; onHover: (d: Day) => void }) {
  const { setNodeRef, isOver } = useDroppable({ id: `tab:${d}` })
  useEffect(() => {
    if (!isOver) return
    const t = window.setTimeout(() => onHover(d), 450)
    return () => window.clearTimeout(t)
  }, [isOver, d, onHover])
  return (
    <span ref={setNodeRef} className={cn('rounded-full transition-shadow', isOver && 'ring-2 ring-primary')}>
      {children}
    </span>
  )
}

/** A day's list (a column on desktop): takes drops at its end. */
function DayList({ d, children, active }: { d: Day; children: ReactNode; active: boolean }) {
  const { setNodeRef, isOver } = useDroppable({ id: `day:${d}` })
  return (
    <ul ref={setNodeRef} className={cn('flex min-h-24 flex-col gap-3 rounded-2xl transition-shadow', active && 'outline-2 -outline-offset-2 outline-dashed outline-transparent', isOver && 'outline-primary/60')}>
      {children}
    </ul>
  )
}

function MoveMenu({ item, onMove, names }: { item: PlanItem; onMove: (day: Day, time: string) => void; names: Record<Day, string> }) {
  const mins = minutesOf(item.time)
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="ghost" intent="neutral" size="icon-sm" aria-label={`Move ${item.title}`} className="shrink-0">
          <Icon icon={EllipsisIcon} />
        </Button>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end">
        <DropdownMenuLabel>Move {item.title}</DropdownMenuLabel>
        {(['fri', 'sat', 'sun'] as const)
          .filter((d) => d !== item.day)
          .map((d) => (
            <DropdownMenuItem key={d} onSelect={() => onMove(d, item.time)}>
              To {names[d]}, {item.time}
            </DropdownMenuItem>
          ))}
        <DropdownMenuSeparator />
        <DropdownMenuItem disabled={mins <= 7 * 60} onSelect={() => onMove(item.day, timeOf(Math.max(7 * 60, mins - 30)))}>
          30 minutes earlier
        </DropdownMenuItem>
        <DropdownMenuItem disabled={mins >= 21 * 60} onSelect={() => onMove(item.day, timeOf(Math.min(21 * 60, mins + 30)))}>
          30 minutes later
        </DropdownMenuItem>
      </DropdownMenuContent>
    </DropdownMenu>
  )
}

/** A plan card that can be dragged by its grip and dropped on; locked cards show why they don't move. */
function MovableRow({ item, target, dragging, onMove, names }: { item: PlanItem; target: Target | null; dragging: boolean; onMove: (day: Day, time: string) => void; names: Record<Day, string> }) {
  const locked = isLocked(item)
  const drag = useDraggable({ id: `row:${item.id}`, disabled: locked })
  const drop = useDroppable({ id: `row:${item.id}` })
  const here = target?.row === item.id
  return (
    <PlanRow
      ref={(el) => {
        drag.setNodeRef(el)
        drop.setNodeRef(el)
      }}
      item={item}
      className={cn(
        dragging && 'opacity-40',
        // Where the card will land: a line above or below this one.
        here && 'before:absolute before:inset-x-3 before:h-1 before:rounded-full before:bg-primary',
        here && (target?.after ? 'before:-bottom-2.5' : 'before:-top-2.5'),
      )}
      handle={
        locked ? (
          <span className="grid size-8 shrink-0 place-items-center text-muted-foreground" title="Set by the lodge">
            <Icon icon={LockIcon} size="xs" />
            <span className="sr-only">Set by the lodge, can’t be moved</span>
          </span>
        ) : (
          // Pointer and touch only; the Move menu is the keyboard path.
          <span
            ref={drag.setActivatorNodeRef}
            {...drag.listeners}
            aria-hidden
            className="grid size-8 shrink-0 cursor-grab touch-none place-items-center rounded-lg text-muted-foreground hover:bg-accent active:cursor-grabbing"
          >
            <Icon icon={GripVerticalIcon} />
          </span>
        )
      }
      menu={locked ? undefined : <MoveMenu item={item} onMove={onMove} names={names} />}
    />
  )
}

export function WeekendPlan({ plan, title, tag, primary, lead, printWhen, printWho, file }: Props) {
  const { s, run, movePlanItem } = useDemo()
  const desktop = usePageWide()
  // The three days of the stay, named by their real dates (a Sat–Mon stay shows Sat, Sun, Mon).
  const days = stayDays(s.stay)
  const names = Object.fromEntries(days.map((d) => [d.key, d.long])) as Record<Day, string>
  const iso = Object.fromEntries(days.map((d) => [d.key, d.iso])) as Record<Day, string>
  const [day, setDay] = useState<Day>('fri')
  const [active, setActive] = useState<PlanItem | null>(null)
  const [target, setTarget] = useState<Target | null>(null)
  const setDayRef = useRef(setDay)
  // Mouse: a small move starts the drag. Touch: a short press on the grip, so swiping the page still scrolls it.
  const sensors = useSensors(useSensor(MouseSensor, { activationConstraint: { distance: 6 } }), useSensor(TouchSensor, { activationConstraint: { delay: 180, tolerance: 8 } }))
  const move = (item: PlanItem, to: { day: Day; time: string }) => {
    if (to.day === item.day && to.time === item.time) return
    movePlanItem(item.id, to.day, to.time, replyFor(plan, item, to.day, to.time, names))
    run([{ do: 'toast', text: `${item.title}: ${names[to.day]} ${to.time}` }])
  }
  const onStart = (e: DragStartEvent) => setActive(plan.find((p) => `row:${p.id}` === e.active.id) ?? null)
  const onOver = (e: DragOverEvent) => setTarget(targetOf(e, plan))
  const onEnd = (e: DragEndEvent) => {
    const t = targetOf(e, plan)
    if (active && t) move(active, placeAt(plan, active.id, t))
    setActive(null)
    setTarget(null)
  }
  const rows = (d: Day) =>
    plan.filter((p) => p.day === d).map((p) => <MovableRow key={p.id} item={p} target={target} dragging={active?.id === p.id} names={names} onMove={(dd, tt) => move(p, { day: dd, time: tt })} />)
  // When Wiley points at a day (Sunday's suggestion, MagiQuest moved to Friday), the tabs follow.
  useEffect(() => {
    if (s.planDay) setDay(s.planDay)
  }, [s.planDay])
  const exportCalendar = () => {
    downloadCalendar(
      file,
      plan.map((p) => ({
        title: p.status === 'Suggested' ? `${p.title} (suggested)` : p.title,
        date: iso[p.day],
        time: p.time,
        location: p.sub?.startsWith('Near') ? p.title : `${lodge.name}, ${lodge.city}`,
        description: [p.sub, p.status].filter(Boolean).join(' · '),
      })),
    )
    run([{ do: 'toast', text: 'Calendar file downloaded' }])
  }
  // On a phone the secondary actions are icons, so the primary sits beside them on one row.
  const actions = desktop ? (
    <>
      <Button shape="pill" variant="outline" intent="neutral" onClick={exportCalendar}>
        <Icon icon={CalendarPlusIcon} /> Add to calendar
      </Button>
      <Button shape="pill" variant="outline" intent="neutral" onClick={() => window.print()}>
        <Icon icon={PrinterIcon} /> Print
      </Button>
      {primary}
    </>
  ) : (
    <>
      <Button shape="pill" variant="outline" intent="neutral" size="icon" aria-label="Add to calendar" onClick={exportCalendar}>
        <Icon icon={CalendarPlusIcon} />
      </Button>
      <Button shape="pill" variant="outline" intent="neutral" size="icon" aria-label="Print" onClick={() => window.print()}>
        <Icon icon={PrinterIcon} />
      </Button>
      {primary}
    </>
  )
  return (
    <Page>
      <DndContext
        sensors={sensors}
        collisionDetection={collide}
        onDragStart={onStart}
        onDragOver={onOver}
        onDragEnd={onEnd}
        onDragCancel={() => (setActive(null), setTarget(null))}
        accessibility={{
          announcements: {
            onDragStart: ({ active: a }) => `Picked up ${plan.find((p) => `row:${p.id}` === a.id)?.title ?? 'an item'}.`,
            onDragOver: ({ over }) => (over ? `Over ${String(over.id).split(':')[1]}.` : 'Not over a day.'),
            onDragEnd: ({ over }) => (over ? 'Moved.' : 'Not moved.'),
            onDragCancel: () => 'Move cancelled.',
          },
        }}
      >
      <div className="flex flex-col gap-5 print:hidden">
        <Title tag={tag} actions={actions}>
          {title}
        </Title>
        {lead}
        {desktop ? (
          <>
            <div className="grid grid-cols-3 gap-4">
              {days.map((d) => (
                <section key={d.key} aria-label={d.long} className="flex flex-col gap-3">
                  <h2 className="type-text-xs-semibold tracking-wide text-muted-foreground uppercase">{d.long}</h2>
                  <DayList d={d.key} active={Boolean(active)}>
                    {rows(d.key)}
                  </DayList>
                </section>
              ))}
            </div>
            <section aria-labelledby="more-near" className="flex flex-col gap-3">
              <h2 id="more-near" className="type-text-xs-semibold tracking-wide text-muted-foreground uppercase">
                More near the lodge
              </h2>
              <div className="grid grid-cols-3 gap-4">
                {MORE.filter((m) => !plan.some((p) => p.id === m.id)).map((m) => (
                  <Card key={m.id} className="gap-2 rounded-2xl p-3">
                    <Photo icon={art[m.id]} label={m.name} tone={m.tone} className="h-24 rounded-xl" />
                    <span className="type-text-sm-semibold">{m.name}</span>
                    <span className="-mt-1.5 type-text-xs-normal text-muted-foreground">{m.sub}</span>
                  </Card>
                ))}
              </div>
            </section>
          </>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <ToggleGroup type="single" value={day} onValueChange={(v) => v && setDay(v as Day)} aria-label="Day" className="gap-2">
                {days.map((d) => (
                  <DayTab key={d.key} d={d.key} onHover={setDayRef.current}>
                    <ToggleGroupItem value={d.key} className="h-9 rounded-full border px-4">
                      {d.label}
                    </ToggleGroupItem>
                  </DayTab>
                ))}
              </ToggleGroup>
              <p className="type-text-xs-normal text-muted-foreground">{active ? 'Drop on a day to move it there' : 'Hold the grip to drag, or use ⋯ to move'}</p>
            </div>
            <DayList d={day} active={Boolean(active)}>
              {rows(day)}
            </DayList>
          </>
        )}
      </div>
        {/* On a phone the card often lands on another day (a tab), so it doesn't fly back to a row that isn't shown. */}
        <DragOverlay dropAnimation={desktop ? { duration: 180, easing: 'ease-out' } : null}>
          {active ? <PlanRow item={active} id={`drag-${active.id}`} className="gwl-lift cursor-grabbing list-none shadow-xl" handle={<span className="grid size-8 shrink-0 place-items-center text-muted-foreground"><Icon icon={GripVerticalIcon} /></span>} /> : null}
        </DragOverlay>
      </DndContext>
      <PrintablePlan plan={plan} when={printWhen} who={printWho} days={days} />
    </Page>
  )
}
