import type { ReactNode } from 'react'
import { Badge } from '@anvil/components/ui/badge'
import { Button } from '@anvil/components/ui/button'
import {
  BellIcon,
  BellRingIcon,
  CalendarHeartIcon,
  CheckIcon,
  CircleCheckIcon,
  ClockIcon,
  GaugeIcon,
  Icon,
  KeyRoundIcon,
  PackageSearchIcon,
  RulerIcon,
  SparklesIcon,
  WavesIcon,
  WandSparklesIcon,
  type LucideIcon,
} from '@anvil/components/ui/icon'
import { cn } from '@anvil/lib/utils'
import { Photo, Sample, WileyAvatar } from '~/components/local/Brand/Brand'
import { AiChip } from '~/components/local/WileyCards/WileyCards'
import { dining, eventById, events, fits, heightRule, ROOM, rides, type LodgeEvent, type Ride } from '~/data/lodgeApp'
import { photos } from '~/data/photos'
import { useDemo } from '~/state/demo'
import { canTheyRide, checkIn, checkOut, nextBirthday, orderAhead, pack, swimEarly } from '~/wiley/scripts/j3'
import type { AppState } from '~/wiley/types'
import { TitleHeader } from './App'

// Journey 3 screens, after the client's app screenshots: Home (changes with the stay), Things To Do, the water park,
// events, ride and event pages, Dining and More. Wiley adds to them: a reason under each pick, who fits each ride,
// reminders it set, and Ask Wiley where a question comes up.

const Scroll = ({ children, className }: { children: ReactNode; className?: string }) => <div className={cn('gwl-noscroll min-h-0 flex-1 overflow-y-auto pb-24', className)}>{children}</div>

const H2 = ({ children, action }: { children: ReactNode; action?: ReactNode }) => (
  <div className="flex items-baseline justify-between px-5 pt-6 pb-3">
    <h2 className="gwl-display text-[21px] text-[var(--gwl-navy)]">{children}</h2>
    {action}
  </div>
)

const ViewAll = ({ onClick }: { onClick: () => void }) => (
  <button type="button" onClick={onClick} className="type-text-sm-semibold text-[var(--gwl-teal)] underline underline-offset-4 outline-none focus-visible:focus-ring">
    View All
  </button>
)

function useApp() {
  const d = useDemo()
  const set = (p: Partial<AppState> | ((a: AppState) => Partial<AppState>)) => d.run([{ do: 'app', set: p }])
  return { ...d, a: d.s.app, set }
}

/** Wiley's reason for a pick, under the card. */
function Why({ children }: { children: ReactNode }) {
  return (
    <span className="flex items-start gap-1.5 type-text-xs-medium text-[var(--gwl-agent-text)]">
      <Icon icon={SparklesIcon} size="xs" className="mt-0.5 shrink-0" />
      <span>{children}</span>
    </span>
  )
}

function fitLabel(r: Ride, h: AppState['heights']) {
  if (!h) return null
  const mia = fits(r, h.mia)
  const leo = fits(r, h.leo)
  return mia && leo ? 'Fits Mia and Leo' : mia ? 'Mia only' : leo ? 'Leo only' : 'Not yet'
}

function FitBadge({ r }: { r: Ride }) {
  const { a } = useApp()
  const label = fitLabel(r, a.heights)
  if (!label) return null
  const both = label === 'Fits Mia and Leo'
  return (
    <Badge tone={both ? 'success' : undefined} variant="subtle" size="xs" className="gwl-fade">
      {label}
    </Badge>
  )
}

function Bell({ id, name }: { id: string; name: string }) {
  const { a, set } = useApp()
  const on = a.reminders.includes(id)
  return (
    <button
      type="button"
      aria-pressed={on}
      aria-label={on ? `Turn off the reminder for ${name}` : `Remind me about ${name}`}
      onClick={(e) => {
        e.stopPropagation()
        set((x) => ({ reminders: on ? x.reminders.filter((r) => r !== id) : [...x.reminders, id] }))
      }}
      className="grid size-9 shrink-0 place-items-center rounded-full text-[var(--gwl-teal)] outline-none hover:bg-accent focus-visible:focus-ring"
    >
      <Icon className="size-5" icon={on ? BellRingIcon : BellIcon} />
    </button>
  )
}

function EventCard({ ev, why }: { ev: LodgeEvent; why?: string }) {
  const { set } = useApp()
  return (
    <div
      role="button"
      tabIndex={0}
      onClick={() => set({ screen: `event:${ev.id}` })}
      onKeyDown={(e) => e.key === 'Enter' && set({ screen: `event:${ev.id}` })}
      className="flex min-h-[124px] overflow-hidden rounded-2xl bg-background text-start shadow-[0_2px_14px_rgb(28_55_80/0.12)] outline-none focus-visible:focus-ring"
    >
      <Photo label={ev.name} icon={ev.icon} tone={ev.tone} className="w-[104px] shrink-0 rounded-e-[28px]" />
      <span className="flex min-w-0 flex-1 flex-col gap-1 p-3 ps-3.5">
        <span className="flex items-start justify-between gap-1">
          <span className="pt-1.5 type-text-md-semibold text-[var(--gwl-teal)]">{ev.name}</span>
          <Bell id={ev.id} name={ev.name} />
        </span>
        <span className="line-clamp-2 type-text-sm-normal">{ev.blurb}</span>
        <span className="mt-auto flex items-center gap-1.5 type-text-xs-normal text-muted-foreground">
          <Icon icon={ClockIcon} size="xs" className="text-[var(--gwl-teal)]" />
          {ev.times.join(', ')}
        </span>
        {why && <Why>{why}</Why>}
      </span>
    </div>
  )
}

function RideCircle({ r }: { r: Ride }) {
  const { set } = useApp()
  return (
    <button type="button" onClick={() => set({ screen: `ride:${r.id}` })} className="flex w-[124px] shrink-0 flex-col items-center gap-2 outline-none focus-visible:focus-ring">
      <Photo label={r.name} icon={r.icon} tone={r.tone} className="size-[112px] rounded-full" />
      <span className="text-center type-text-sm-semibold text-[var(--gwl-teal)]">{r.name}</span>
      <FitBadge r={r} />
    </button>
  )
}

function WaterParkRow() {
  const { set } = useApp()
  return (
    <section className="bg-background pb-5">
      <H2 action={<ViewAll onClick={() => set({ tab: 'todo', screen: 'park' })} />}>Explore Our Water Park</H2>
      <p className="-mt-1 flex items-center gap-2 px-5 pb-3 type-text-sm-normal">
        <strong>Today’s Park Hours</strong> 9:00am – 9:00pm <Sample />
      </p>
      <div className="gwl-noscroll flex gap-2 overflow-x-auto px-4">
        {rides.slice(0, 6).map((r) => (
          <RideCircle key={r.id} r={r} />
        ))}
      </div>
    </section>
  )
}

function EventsRow({ only }: { only?: string[] }) {
  const { set } = useApp()
  const list = only ? events.filter((e) => only.includes(e.id)) : events
  return (
    <section className="bg-[var(--gwl-app-band)] pb-6">
      <H2 action={<ViewAll onClick={() => set({ tab: 'todo', screen: 'events' })} />}>Today’s Events</H2>
      <div className="gwl-noscroll flex snap-x gap-3 overflow-x-auto px-5 pb-2 [&>*]:w-[300px] [&>*]:shrink-0 [&>*]:snap-start">
        {list.map((e) => (
          <EventCard key={e.id} ev={e} />
        ))}
      </div>
    </section>
  )
}

function Hero({ title, sub, children }: { title: string; sub?: string; children?: ReactNode }) {
  return (
    <Photo label="The indoor water park" src={photos.waterpark} className="h-[300px] shrink-0">
      <div className="absolute inset-0 bg-gradient-to-t from-[rgb(12_33_52/0.92)] via-[rgb(12_33_52/0.35)] to-transparent" />
      <div className="absolute inset-x-5 bottom-5 flex flex-col gap-3 text-[#fff]">
        <div>
          <h1 className="gwl-display text-[26px] leading-[1.15] text-[#fff]">{title}</h1>
          {sub && <p className="mt-1 type-text-sm-medium text-[rgb(255_255_255/0.85)]">{sub}</p>}
        </div>
        {children}
      </div>
    </Photo>
  )
}

const HeroPill = ({ icon, children }: { icon: LucideIcon; children: ReactNode }) => (
  <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-[rgb(255_255_255/0.18)] px-3 py-1.5 type-text-xs-semibold text-[#fff] backdrop-blur">
    <Icon icon={icon} size="xs" />
    {children}
  </span>
)

function Tile({ children, className }: { children: ReactNode; className?: string }) {
  return <div className={cn('mx-5 rounded-2xl border border-[var(--gwl-hairline)] bg-background p-4 shadow-[0_2px_14px_rgb(28_55_80/0.1)]', className)}>{children}</div>
}

/** The Wiley card on Home: ask anything, any time. */
function AskWileyTile({ prompts, line }: { prompts: { label: string; then: never[] | import('~/wiley/types').Beat[] }[]; line: string }) {
  const { ask, playing } = useApp()
  return (
    <Tile className="flex flex-col gap-3 bg-[var(--gwl-sky)]">
      <span className="flex items-center gap-2.5">
        <WileyAvatar size={36} online />
        <span>
          <span className="block type-text-sm-semibold">Wiley, your AI concierge</span>
          <span className="block type-text-xs-normal text-muted-foreground">{line}</span>
        </span>
      </span>
      <div className="flex flex-col gap-2">
        {prompts.map((o) => (
          <AiChip key={o.label} block onClick={() => !playing && ask(o)}>
            {o.label}
          </AiChip>
        ))}
      </div>
    </Tile>
  )
}

type Day = 'fri' | 'sat' | 'sun'
const dayOf = (clock: string): Day => (clock.startsWith('Sat') ? 'sat' : clock.startsWith('Sun') ? 'sun' : 'fri')
const DAY_NAME: Record<Day, string> = { fri: 'Fri Mar 12', sat: 'Sat Mar 13', sun: 'Sun Mar 14' }

/** Today, from the weekend plan the family made in Journey 1, plus what Wiley added. */
function TodayTile() {
  const { s, a } = useApp()
  const day = dayOf(a.clock)
  const items = [
    ...s.plan.filter((p) => p.day === day && p.id !== 'checkout').map((p) => ({ id: p.id === 'party' ? 'party' : p.id, time: p.time, title: p.title, sub: p.sub })),
    ...(day === 'fri' ? [{ id: 'story', time: '8:15 pm', title: 'Epic Story Time', sub: 'Grand Lobby fireplace · free' }] : []),
    ...(day === 'sun' ? [{ id: 'checkout', time: '11:00', title: a.lateCheckout ? 'Check out by 2:00 pm' : 'Check out', sub: 'Water park open until closing' }] : []),
  ].sort((x, y) => toMin(x.time) - toMin(y.time))
  return (
    <section>
      <H2 action={<span className="type-text-xs-semibold text-muted-foreground">{DAY_NAME[day]}</span>}>Today for your pack</H2>
      <Tile className="p-0">
        <ul>
          {items.map((t) => (
            <li key={t.id} className="flex items-center gap-3 border-t px-4 py-3 first:border-t-0">
              <span className="w-16 shrink-0 type-text-xs-semibold text-[var(--gwl-teal)]">{t.time}</span>
              <span className="min-w-0 flex-1">
                <span className="block type-text-sm-medium">{t.title}</span>
                {t.sub && <span className="block truncate type-text-xs-normal text-muted-foreground">{t.sub}</span>}
              </span>
              {a.reminders.includes(t.id) && <Icon icon={BellRingIcon} className="size-4 shrink-0 text-[var(--gwl-teal)]" aria-label="Reminder on" />}
            </li>
          ))}
        </ul>
        {a.reminders.length > 0 && (
          <p className="flex items-center gap-1.5 border-t px-4 py-2 type-text-xs-medium text-[var(--gwl-agent-text)]">
            <Icon icon={SparklesIcon} size="xs" /> Reminders set by Wiley
          </p>
        )}
      </Tile>
    </section>
  )
}

function toMin(t: string) {
  const m = /(\d+):(\d+)\s*(am|pm)?/i.exec(t)
  if (!m) return -1
  let h = Number(m[1]) % 12
  if ((m[3] ?? '').toLowerCase() === 'pm') h += 12
  if (!m[3] && Number(m[1]) < 7) h += 12
  return h * 60 + Number(m[2])
}

/** Wiley's picks for right now: what fits Mia (7) and Leo (4). */
function PicksRow() {
  const { a, set } = useApp()
  const h = a.heights
  const picks: { title: string; why: string; icon: LucideIcon; tone: 'lake' | 'forest' | 'dusk' | 'den'; to: string }[] = h
    ? [
        { title: 'Whooping Hollow', why: 'Both of them fit (52" and under)', icon: rides[6].icon, tone: 'forest', to: 'ride:whooping-hollow' },
        { title: 'Alberta Falls', why: 'Mia rides with you; Leo’s 2" short', icon: rides[0].icon, tone: 'lake', to: 'ride:alberta-falls' },
        { title: 'Epic Story Time', why: 'At 8:15 pm, right before bed', icon: eventById('story').icon, tone: 'forest', to: 'event:story' },
      ]
    : [
        { title: 'Cub Paw Pool', why: 'Small slides for Leo, 52" and under', icon: rides[5].icon, tone: 'lake', to: 'ride:cub-paw' },
        { title: 'Alberta Falls', why: 'A tube ride for two, 42" and up', icon: rides[0].icon, tone: 'lake', to: 'ride:alberta-falls' },
        { title: 'Epic Story Time', why: 'At 8:15 pm, right before bed', icon: eventById('story').icon, tone: 'forest', to: 'event:story' },
      ]
  return (
    <section>
      <H2>
        <span className="inline-flex items-center gap-2">
          Picks for Mia and Leo <Icon icon={SparklesIcon} className="size-4 text-[var(--gwl-agent-text)]" />
        </span>
      </H2>
      <div className="gwl-noscroll flex gap-3 overflow-x-auto px-5 pb-2">
        {picks.map((p) => (
          <button key={p.title} type="button" onClick={() => set({ screen: p.to, tab: p.to.startsWith('ride') ? 'todo' : 'todo' })} className="flex w-[180px] shrink-0 flex-col overflow-hidden rounded-2xl bg-background text-start shadow-[0_2px_14px_rgb(28_55_80/0.12)] outline-none focus-visible:focus-ring">
            <Photo label={p.title} icon={p.icon} tone={p.tone} className="h-24" />
            <span className="flex flex-col gap-1.5 p-3">
              <span className="type-text-sm-semibold text-[var(--gwl-teal)]">{p.title}</span>
              <Why>{p.why}</Why>
            </span>
          </button>
        ))}
      </div>
    </section>
  )
}

function OrderTile() {
  const { ask } = useApp()
  return (
    <Tile className="flex flex-col gap-2">
      <span className="type-text-md-semibold text-[var(--gwl-teal)]">Hungry? Order from the app!</span>
      <span className="type-text-sm-normal">Order pizza and pasta ahead from Hungry As A Wolf and pick it up when it’s ready.</span>
      <button type="button" onClick={() => ask(orderAhead)} className="w-fit type-text-sm-semibold text-[var(--gwl-teal)] outline-none focus-visible:focus-ring">
        Check Out Our Mobile Ordering Options
      </button>
    </Tile>
  )
}

export function HomeScreen() {
  const { a, ask, s } = useApp()
  if (a.phase === 'before') {
    return (
      <Scroll>
        <Hero title="Mia’s birthday weekend starts Friday" sub="Junior Wolf Pup Den Suite · Mar 12 – 14">
          <HeroPill icon={CalendarHeartIcon}>2 days to go</HeroPill>
        </Hero>
        <div className="flex flex-col gap-4 pt-5">
          {a.checkedIn ? (
            <Tile className="flex items-center gap-3">
              <Icon icon={CircleCheckIcon} className="size-6 shrink-0 text-success-strong" />
              <span>
                <span className="block type-text-sm-semibold">You’re checked in</span>
                <span className="block type-text-xs-normal text-muted-foreground">Arriving {a.arrival?.toLowerCase()}. Pick up wristbands at a kiosk or the Front Desk.</span>
              </span>
            </Tile>
          ) : (
            <Tile className="flex flex-col gap-3">
              <span>
                <span className="block type-text-md-semibold text-[var(--gwl-navy)]">Check in before you arrive</span>
                <span className="block type-text-sm-normal text-muted-foreground">Then on Friday you only pick up your wristbands, and Wiley messages you when your suite is ready.</span>
              </span>
              <Button shape="pill" className="w-full" onClick={() => ask(checkIn)}>
                Check In Now
              </Button>
            </Tile>
          )}
          <Tile className="flex flex-col gap-1.5">
            <span className="type-text-xs-semibold tracking-wide text-muted-foreground uppercase">Your reservation</span>
            <span className="type-text-md-semibold">Junior Wolf Pup Den Suite</span>
            <span className="type-text-sm-normal">Fri Mar 12 – Sun Mar 14, 2027 · 2 adults, 2 kids</span>
            <span className="type-text-sm-normal text-muted-foreground">{s.cart.map((c) => c.label).join(' · ')} · Mia’s party Sat 1:00 pm</span>
          </Tile>
          <AskWileyTile line="Any time: before, during and after your stay" prompts={[pack, swimEarly]} />
        </div>
        <WaterParkRow />
      </Scroll>
    )
  }
  if (a.phase === 'checkout') {
    return (
      <Scroll>
        <Hero title={a.checkedOut ? 'Have a great last swim!' : 'Check-out day'} sub={a.checkedOut ? 'You’re checked out. The water park is yours until closing.' : `Suite ${ROOM} · check out by ${a.lateCheckout ? '2:00 pm' : '11:00 am'}`}>
          <HeroPill icon={WavesIcon}>Water park open until closing</HeroPill>
        </Hero>
        <div className="flex flex-col gap-4 pt-5">
          {!a.checkedOut && (
            <Tile className="flex flex-col gap-3">
              <span>
                <span className="block type-text-md-semibold text-[var(--gwl-navy)]">Check out from your phone</span>
                <span className="block type-text-sm-normal text-muted-foreground">See your bill, then skip the Front Desk line.</span>
              </span>
              <Button shape="pill" className="w-full" onClick={() => ask(checkOut)}>
                Check Out
              </Button>
            </Tile>
          )}
          <TodayTile />
        </div>
        <WaterParkRow />
      </Scroll>
    )
  }
  if (a.phase === 'after') {
    return (
      <Scroll>
        <Hero title="Thanks for staying, Martinez pack!" sub="Colorado Springs · Mar 12 – 14, 2027">
          <HeroPill icon={CalendarHeartIcon}>Happy 7th birthday, Mia</HeroPill>
        </Hero>
        <div className="flex flex-col gap-4 pt-5">
          {a.lostReported && (
            <Tile className="flex items-center gap-3">
              <Icon icon={a.lostFound ? CircleCheckIcon : PackageSearchIcon} className={cn('size-6 shrink-0', a.lostFound ? 'text-success-strong' : 'text-[var(--gwl-teal)]')} />
              <span>
                <span className="block type-text-sm-semibold">{a.lostFound ? 'Leo’s wolf was found' : 'Lost and found: report sent'}</span>
                <span className="block type-text-xs-normal text-muted-foreground">{a.lostFound ? 'The lodge team will email you about getting it home.' : 'Items are kept for 30 days.'}</span>
              </span>
            </Tile>
          )}
          {a.nextTrip ? (
            <Tile className="flex flex-col gap-1.5">
              <span className="flex items-center gap-1.5 type-text-xs-semibold text-[var(--gwl-agent-text)]">
                <Icon icon={SparklesIcon} size="xs" /> Saved by Wiley
              </span>
              <span className="type-text-md-semibold">Mia’s 8th birthday weekend</span>
              <span className="type-text-sm-normal">Fri Mar 10 – Sun Mar 12, 2028 · Junior Wolf Pup Den Suite</span>
            </Tile>
          ) : (
            <AskWileyTile line="Still here after your stay" prompts={[nextBirthday]} />
          )}
        </div>
        <WaterParkRow />
      </Scroll>
    )
  }
  return (
    <Scroll>
      {a.phase === 'arrival' ? (
        <Hero title="You’re here! Your suite is almost ready" sub="Your passes work now. Wiley will message you when your suite is ready.">
          <HeroPill icon={WavesIcon}>Water park open</HeroPill>
        </Hero>
      ) : (
        <Hero title="Welcome, Martinez pack" sub={`Suite ${ROOM} · Fri Mar 12 – Sun Mar 14`}>
          <HeroPill icon={KeyRoundIcon}>Your wristband opens your suite</HeroPill>
        </Hero>
      )}
      <div className="flex flex-col pt-1 pb-5">
        <TodayTile />
        <PicksRow />
      </div>
      <WaterParkRow />
      <EventsRow />
      <div className="py-5">
        <OrderTile />
      </div>
    </Scroll>
  )
}

const TODO = [
  { id: 'park', title: 'Water Park Attractions', body: 'Explore slides, rides and all the park has to offer.', icon: WavesIcon, tone: 'lake' as const },
  { id: 'attractions', title: 'Attractions', body: 'From Northern Lights Arcade to MagiQuest, fun on dry land (at an extra cost).', icon: WandSparklesIcon, tone: 'den' as const },
  { id: 'events', title: 'Events', body: 'Family events all day at the lodge, free and included with your stay.', icon: eventById('pack').icon, tone: 'dusk' as const },
]

export function ThingsToDo() {
  const { a, set } = useApp()
  const pill = (on: boolean) => cn('shrink-0 rounded-full border-2 px-4 py-2 text-[12px] font-bold tracking-wide uppercase outline-none focus-visible:focus-ring', on ? 'border-[#fff] bg-[#fff] text-[var(--gwl-navy-deep)]' : 'border-[rgb(255_255_255/0.8)] text-[#fff]')
  return (
    <>
      <TitleHeader title="Things To Do" />
      <div className="gwl-noscroll flex shrink-0 gap-2 overflow-x-auto bg-[var(--gwl-navy-deep)] px-5 py-4">
        <button type="button" className={pill(!a.forPack)} onClick={() => set({ forPack: false })}>
          All
        </button>
        <button type="button" className={pill(false)}>
          Open Now
        </button>
        <button type="button" className={cn(pill(a.forPack), 'inline-flex items-center gap-1.5')} onClick={() => set({ forPack: !a.forPack })} aria-pressed={a.forPack}>
          <Icon icon={SparklesIcon} size="xs" /> For Your Pack
        </button>
      </div>
      <Scroll className="bg-[var(--gwl-app-band)] px-5 pt-5">
        {a.forPack ? (
          <div className="flex flex-col gap-3">
            <p className="flex items-center gap-1.5 type-text-sm-medium text-[var(--gwl-agent-text)]">
              <Icon icon={SparklesIcon} size="xs" /> Wiley picked these for Mia (7) and Leo (4){a.heights ? `, by height` : ''}.
            </p>
            {rides
              .filter((r) => !a.heights || fitLabel(r, a.heights) !== 'Not yet')
              .map((r) => (
                <RideRow key={r.id} r={r} />
              ))}
            <EventCard ev={eventById('story')} why="Right before bed, in the Grand Lobby" />
          </div>
        ) : (
          <div className="flex flex-col gap-4">
            {TODO.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => (t.id === 'park' || t.id === 'events' ? set({ screen: t.id }) : undefined)}
                className="flex min-h-[140px] overflow-hidden rounded-2xl bg-background text-start shadow-[0_2px_14px_rgb(28_55_80/0.12)] outline-none focus-visible:focus-ring"
              >
                <span className="flex flex-1 flex-col gap-1.5 p-4">
                  <span className="type-text-lg-semibold text-[var(--gwl-teal)]">{t.title}</span>
                  <span className="type-text-sm-normal">{t.body}</span>
                </span>
                <Photo label={t.title} icon={t.icon} tone={t.tone} className="w-[116px] shrink-0 rounded-s-[28px]" />
              </button>
            ))}
          </div>
        )}
      </Scroll>
    </>
  )
}

function RideRow({ r }: { r: Ride }) {
  const { set } = useApp()
  return (
    <button type="button" onClick={() => set({ screen: `ride:${r.id}` })} className="flex min-h-[112px] overflow-hidden rounded-2xl bg-background text-start shadow-[0_2px_14px_rgb(28_55_80/0.12)] outline-none focus-visible:focus-ring">
      <Photo label={r.name} icon={r.icon} tone={r.tone} className="w-[96px] shrink-0 rounded-e-[28px]" />
      <span className="flex min-w-0 flex-1 flex-col gap-1 p-3 ps-3.5">
        <span className="type-text-md-semibold text-[var(--gwl-teal)]">{r.name}</span>
        <span className="line-clamp-2 type-text-sm-normal">{r.blurb}</span>
        <span className="mt-auto flex flex-wrap items-center gap-2 type-text-xs-normal text-muted-foreground">
          {r.thrill} thrill · {heightRule(r)}
          <FitBadge r={r} />
        </span>
      </span>
    </button>
  )
}

export function ParkScreen({ onBack }: { onBack: () => void }) {
  const { a, set } = useApp()
  const list = a.forPack && a.heights ? rides.filter((r) => fitLabel(r, a.heights) !== 'Not yet') : rides
  return (
    <>
      <TitleHeader title="Water Park" onBack={onBack} />
      <Scroll className="bg-[var(--gwl-app-band)] px-5 pt-4">
        <div className="mb-4 flex items-center gap-2">
          <button type="button" aria-pressed={!a.forPack} onClick={() => set({ forPack: false })} className={cn('rounded-full border px-3 py-1.5 type-text-xs-semibold outline-none focus-visible:focus-ring', !a.forPack ? 'border-[var(--gwl-navy)] bg-[var(--gwl-navy)] text-[var(--gwl-navy-foreground)]' : 'bg-background')}>
            All rides
          </button>
          <button type="button" aria-pressed={a.forPack} onClick={() => set({ forPack: true })} className={cn('inline-flex items-center gap-1 rounded-full border px-3 py-1.5 type-text-xs-semibold outline-none focus-visible:focus-ring', a.forPack ? 'border-[var(--gwl-navy)] bg-[var(--gwl-navy)] text-[var(--gwl-navy-foreground)]' : 'bg-background')}>
            <Icon icon={SparklesIcon} size="xs" /> For your pack
          </button>
        </div>
        {a.forPack && !a.heights && <p className="mb-3 type-text-sm-normal text-muted-foreground">Tell Wiley how tall Mia and Leo are to see who fits each ride.</p>}
        <div className="flex flex-col gap-3">
          {list.map((r) => (
            <RideRow key={r.id} r={r} />
          ))}
        </div>
      </Scroll>
    </>
  )
}

function Fact({ icon, label, children }: { icon: LucideIcon; label: string; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-2 py-3">
      <span className="flex items-center gap-2 type-text-sm-semibold text-[var(--gwl-navy)]">
        <Icon className="size-4" icon={icon} /> {label}
      </span>
      <div className="ps-6 type-text-sm-normal">{children}</div>
    </div>
  )
}

const Tags = ({ list }: { list: string[] }) => (
  <span className="flex flex-wrap gap-2">
    {list.map((t) => (
      <span key={t} className="rounded bg-[var(--gwl-sky)] px-2 py-0.5 type-text-sm-semibold text-[var(--gwl-navy)]">
        {t}
      </span>
    ))}
  </span>
)

export function RideDetail({ ride: r, onBack }: { ride: Ride; onBack: () => void }) {
  const { a, ask, playing } = useApp()
  const h = a.heights
  return (
    <>
      <TitleHeader title={r.name} onBack={onBack} />
      <Scroll className="bg-background">
        <Photo label={r.name} icon={r.icon} tone={r.tone} className="h-[220px]" />
        <div className="relative -mt-6 rounded-tl-[28px] bg-background px-6 pt-6">
          <p className="type-text-sm-normal">{r.blurb}</p>
          {/* Wiley on the ride page: who in the family fits, or ask. */}
          <div className="mt-4 rounded-2xl border border-[var(--gwl-hairline)] bg-[var(--gwl-sky)] p-3.5">
            <span className="flex items-center gap-2 type-text-sm-semibold">
              <WileyAvatar size={24} /> For your pack
            </span>
            {h ? (
              <ul className="mt-2 flex flex-col gap-1 type-text-sm-normal">
                {(
                  [
                    ['Mia', h.mia],
                    ['Leo', h.leo],
                  ] as const
                ).map(([n, inches]) => (
                  <li key={n} className="flex items-center gap-2">
                    <Icon icon={fits(r, inches) ? CheckIcon : ClockIcon} className={cn('size-4', fits(r, inches) ? 'text-success-strong' : 'text-muted-foreground')} />
                    {n}, {inches}": {fits(r, inches) ? 'can ride' : r.min ? `not yet, needs ${r.min - inches}" more` : 'too tall for this one'}
                  </li>
                ))}
              </ul>
            ) : (
              <div className="mt-2">
                <AiChip block onClick={() => !playing && ask(canTheyRide)}>
                  {canTheyRide.label}
                </AiChip>
              </div>
            )}
          </div>
          <div className="mt-2 divide-y">
            <Fact icon={ClockIcon} label="Today’s Hours & Location">
              <span className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <strong className="whitespace-nowrap">9:00am – 9:00pm</strong> Indoor water park <Sample />
              </span>
            </Fact>
            <Fact icon={GaugeIcon} label="Thrill Level">
              {r.thrill} Thrill
            </Fact>
            <Fact icon={RulerIcon} label={r.max ? 'Max. Height' : 'Min. Height'}>
              {r.min ? `${r.min}"` : r.max ? `${r.max}"` : 'None listed'}
            </Fact>
            <Fact icon={CircleCheckIcon} label="Best for">
              <Tags list={r.thrill === 'High' ? ['Adults', 'Teens', 'Children'] : r.max ? ['Children'] : ['Adults', 'Family', 'Teens', 'Children']} />
            </Fact>
          </div>
        </div>
      </Scroll>
    </>
  )
}

export function EventDetail({ ev, onBack }: { ev: LodgeEvent; onBack: () => void }) {
  const { a, set } = useApp()
  const on = a.reminders.includes(ev.id)
  return (
    <>
      <TitleHeader title={ev.name} onBack={onBack} />
      <Scroll className="bg-background">
        <Photo label={ev.name} icon={ev.icon} tone={ev.tone} className="h-[220px]" />
        <div className="relative -mt-6 rounded-tl-[28px] bg-background px-6 pt-6">
          <p className="type-text-sm-normal">{ev.blurb}</p>
          <div className="mt-2 divide-y">
            <Fact icon={ClockIcon} label="Today’s Hours & Location">
              <span className="flex flex-wrap items-center gap-2">
                <strong>{ev.times.join(', ')}</strong> {ev.where} <Sample />
              </span>
              <button type="button" onClick={() => set((x) => ({ reminders: on ? x.reminders.filter((r) => r !== ev.id) : [...x.reminders, ev.id] }))} className="mt-3 inline-flex items-center gap-1.5 type-text-sm-semibold text-[var(--gwl-teal)] outline-none focus-visible:focus-ring">
                {on ? 'Reminder set' : 'Set a reminder'} <Icon className="size-4" icon={on ? BellRingIcon : BellIcon} />
              </button>
            </Fact>
            <Fact icon={CircleCheckIcon} label="Best for">
              <Tags list={ev.best} />
            </Fact>
          </div>
        </div>
      </Scroll>
    </>
  )
}

export function EventsScreen({ onBack }: { onBack: () => void }) {
  const { a } = useApp()
  const today = { fri: 12, sat: 13, sun: 14 }[dayOf(a.clock)]
  const days = [
    ['Fri', 12],
    ['Sat', 13],
    ['Sun', 14],
    ['Mon', 15],
    ['Tue', 16],
    ['Wed', 17],
    ['Thu', 18],
  ] as const
  return (
    <>
      <TitleHeader title="Events" onBack={onBack} />
      <Scroll className="bg-[var(--gwl-app-band)]">
        <div className="rounded-b-[28px] bg-background pb-4 shadow-[0_4px_14px_rgb(28_55_80/0.08)]">
          <Photo label="Meet the Great Wolf Pack" icon={eventById('pack').icon} tone="dusk" className="h-[150px]" />
          <div className="grid grid-cols-7 px-3 pt-3">
            {days.map(([d, n]) => (
              <span key={n} className="flex flex-col items-center gap-1.5">
                <span className="text-[11px] font-bold text-[var(--gwl-teal)] uppercase">{n === today ? 'Today' : d}</span>
                <span className={cn('grid size-10 place-items-center rounded-full border-2 type-text-sm-semibold', n === today ? 'border-[var(--gwl-teal)] bg-[var(--gwl-teal)] text-[#fff]' : 'border-[var(--gwl-teal)]/60 text-[var(--gwl-navy)]')}>{n}</span>
              </span>
            ))}
          </div>
        </div>
        <div className="flex flex-col gap-3 px-5 pt-5">
          {events.map((e) => (
            <EventCard key={e.id} ev={e} why={a.reminders.includes(e.id) && ['dinner', 'story', 'party'].includes(e.id) ? 'Reminder set by Wiley' : undefined} />
          ))}
        </div>
      </Scroll>
    </>
  )
}

export function RemindersScreen({ onBack }: { onBack: () => void }) {
  const { a } = useApp()
  const NAMES: Record<string, string> = { dinner: 'Dinner at Loose Moose Family Kitchen, 6:30 pm', party: 'Mia’s Birthday Bash, 1:00 pm', ...Object.fromEntries(events.map((e) => [e.id, `${e.name}, ${e.times[0]}`])) }
  return (
    <>
      <TitleHeader title="My Reminders" onBack={onBack} />
      <Scroll className="px-5 pt-4">
        {a.reminders.length === 0 ? (
          <p className="type-text-sm-normal text-muted-foreground">No reminders yet. Tap the bell on any event.</p>
        ) : (
          <ul className="flex flex-col divide-y rounded-2xl border bg-background">
            {a.reminders.map((r) => (
              <li key={r} className="flex items-center gap-3 px-4 py-3 type-text-sm-medium">
                <Icon icon={BellRingIcon} className="size-4 text-[var(--gwl-teal)]" />
                {NAMES[r] ?? r}
              </li>
            ))}
          </ul>
        )}
      </Scroll>
    </>
  )
}

export function DiningScreen() {
  const { ask } = useApp()
  return (
    <>
      <TitleHeader title="Dining" />
      <Scroll className="flex flex-col gap-3 bg-[var(--gwl-app-band)] px-5 pt-5">
        {dining.map((d) => (
          <div key={d.id} className="flex flex-col gap-1.5 rounded-2xl bg-background p-4 shadow-[0_2px_14px_rgb(28_55_80/0.1)]">
            <span className="type-text-md-semibold text-[var(--gwl-teal)]">{d.name}</span>
            <span className="type-text-sm-normal">{d.blurb}</span>
            {d.order && (
              <Button shape="pill" size="sm" className="mt-1 w-fit" onClick={() => ask(orderAhead)}>
                Order Ahead
              </Button>
            )}
          </div>
        ))}
      </Scroll>
    </>
  )
}

export function MoreScreen() {
  const { a, set } = useApp()
  const rows: [string, (() => void) | undefined, ReactNode?][] = [
    ['Water Park', () => set({ screen: 'park' })],
    ['Attractions', undefined],
    ['Events', () => set({ screen: 'events' })],
    ['Shopping', undefined],
    ['Order Food', () => set({ tab: 'dining' })],
    ['My Reminders', () => set({ screen: 'reminders' }), a.reminders.length ? <Badge size="xs">{a.reminders.length}</Badge> : null],
    ['Lodge Map', undefined],
  ]
  return (
    <>
      <TitleHeader title="More" />
      <Scroll className="bg-background px-6 pt-4">
        <h2 className="pb-3 type-text-md-semibold text-[var(--gwl-navy)]">Explore the Lodge</h2>
        <ul className="divide-y border-y">
          {rows.map(([label, on, extra]) => (
            <li key={label}>
              <button type="button" onClick={on} className="flex w-full items-center gap-2 py-3.5 text-start type-text-sm-semibold text-[var(--gwl-teal)] outline-none focus-visible:focus-ring">
                {label} {extra}
              </button>
            </li>
          ))}
        </ul>
        <h2 className="pt-6 pb-3 type-text-md-semibold text-[var(--gwl-navy)]">Voyagers Club</h2>
        <p className="type-text-sm-normal text-muted-foreground">Signed in as Carlos Martinez.</p>
      </Scroll>
    </>
  )
}
