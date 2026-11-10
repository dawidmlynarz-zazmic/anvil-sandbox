import { useEffect, useState } from 'react'
import { Badge } from '@anvil/components/ui/badge'
import { Button } from '@anvil/components/ui/button'
import { Card } from '@anvil/components/ui/card'
import { CalendarPlusIcon, CheckIcon, Icon, PrinterIcon, QrCodeIcon, SparklesIcon } from '@anvil/components/ui/icon'
import { Progress } from '@anvil/components/ui/progress'
import { ToggleGroup, ToggleGroupItem } from '@anvil/components/ui/toggle-group'
import { cn } from '@anvil/lib/utils'
import { dates, families, lodge, money } from '~/data/fixtures'
import { downloadCalendar } from '~/lib/calendar'
import { art, photos } from '~/data/photos'
import { Logo, Photo, WileyAvatar, WileyTag } from '~/components/local/Brand/Brand'
import { TripQuote } from '~/components/local/WileyCards/WileyCards'
import { quoteOf, useDemo } from '~/state/demo'
import { j1Plan } from '~/state/plan'
import { usePageWide } from '~/state/layout'
import type { PlanItem } from '~/wiley/types'
import { Page, PlanRow, Popular, Title } from './shared'

const fam = families.martinez

function WileyNote({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-3 rounded-2xl border-2 border-dashed border-agent-muted bg-agent-subtle/60 p-4 type-text-sm-normal">
      <WileyAvatar size={28} />
      <p>{children}</p>
    </div>
  )
}

function Label({ children }: { children: string }) {
  return <p className="type-text-xs-semibold tracking-wide text-muted-foreground uppercase">{children}</p>
}

/** J1·1: the lodge home, personalized for a signed-in family. Wiley waits in the launcher. */
export function J1Home() {
  const { go } = useDemo()
  const desktop = usePageWide()
  const toPlan = () => go('j1/2')
  const tag = (
    <Badge variant="subtle" size="sm" className="w-fit">
      Made for the Martinez family
    </Badge>
  )
  const intro = (
    <div className="flex flex-col gap-3">
      {desktop && tag}
      <h1 className={cn('gwl-display leading-tight', desktop ? 'text-4xl' : 'text-[28px]')}>Welcome back, {fam.name} family</h1>
      <p className="type-text-md-normal text-muted-foreground">Mia turns 7 on March 13. Your favorite Junior Wolf Pup Den Suite is open that weekend.</p>
      <div className={cn('flex gap-3', desktop ? 'flex-row' : 'flex-col')}>
        <Button shape="pill" size="lg" className={cn(!desktop && 'w-full')} onClick={toPlan}>
          <Icon icon={SparklesIcon} /> Plan Mia’s birthday weekend
        </Button>
        {desktop && (
          <Button shape="pill" size="lg" variant="outline" intent="neutral" onClick={toPlan}>
            See other dates
          </Button>
        )}
      </div>
    </div>
  )
  const weekend = (
    <Card className="gap-1 rounded-2xl p-5">
      <Label>Your weekend</Label>
      <p className="mt-1 type-text-sm-normal">{dates.j1.long}</p>
      <p className="gwl-display text-lg">Junior Wolf Pup Den Suite</p>
      <p className="type-text-sm-normal text-muted-foreground">from {money(119)} / night</p>
      <Button shape="pill" variant="outline" intent="neutral" className="mt-3 w-fit" onClick={toPlan}>
        Check these dates
      </Button>
    </Card>
  )
  const lastVisit = (
    <Card className="gap-1 rounded-2xl p-5">
      <Label>Last visit</Label>
      <p className="mt-1 type-text-sm-normal">December 2025</p>
      <p className="gwl-display text-lg">Junior Wolf Pup Den Suite</p>
      <p className="type-text-sm-normal text-muted-foreground">With MagiQuest for Mia and Leo</p>
      <Button shape="pill" variant="outline" intent="neutral" className="mt-3 w-fit" onClick={toPlan}>
        Repeat last trip
      </Button>
    </Card>
  )
  if (desktop) {
    return (
      <Page>
        <Card className="grid grid-cols-[1.1fr_1fr] items-center gap-8 rounded-3xl p-8">
          {intro}
          <Photo src={photos.den} label="Junior Wolf Pup Den Suite, the family’s favorite" className="h-72 rounded-2xl" />
        </Card>
        <div className="grid grid-cols-2 gap-4">
          {weekend}
          {lastVisit}
        </div>
        <Popular />
      </Page>
    )
  }
  return (
    <Page className="pb-24">
      <Photo src={photos.den} label="Junior Wolf Pup Den Suite, the family’s favorite" className="h-48 rounded-3xl" />
      {tag}
      {intro}
      {/* On a phone the page stays on the one thing that matters: this weekend. */}
      {weekend}
    </Page>
  )
}

const DAYS = [
  { key: 'fri', label: 'Fri', long: 'Friday' },
  { key: 'sat', label: 'Sat', long: 'Saturday' },
  { key: 'sun', label: 'Sun', long: 'Sunday' },
] as const

/** The plan as the page shows it, read against the trip (passes, birthday package, dining, late check-out). */
function usePlan() {
  const { s } = useDemo()
  return j1Plan(s)
}

const MORE = [
  { id: 'garden', name: 'Garden of the Gods', sub: 'Free · red rock trails', tone: 'dusk' as const },
  { id: 'manitou', name: 'Manitou Springs', sub: 'Historic downtown', tone: 'den' as const },
  { id: 'wolf-center', name: 'Colorado Wolf and Wildlife Center', sub: 'About an hour away', tone: 'forest' as const },
]

/** J1·4: the weekend in and around the lodge, built with Wiley. Day tabs on mobile, three columns on desktop. */
const DAY_DATE = { fri: '2027-03-12', sat: '2027-03-13', sun: '2027-03-14' } as const

/** The full weekend for print: every day in order, whatever tab is open on screen. */
function PrintablePlan({ plan, suite }: { plan: PlanItem[]; suite: string }) {
  return (
    <div className="hidden flex-col gap-5 print:flex">
      <div className="flex flex-col gap-1 border-b pb-4">
        <Logo className="h-6 self-start" />
        <p className="mt-3 type-text-lg-semibold">Your weekend · {dates.j1.long}</p>
        <p className="type-text-sm-normal">
          {fam.name} family · 2 adults, 2 kids (Mia 7, Leo 4) · {suite} · {lodge.name}, {lodge.city}
        </p>
      </div>
      {DAYS.map((d) => (
        <section key={d.key} className="flex flex-col gap-2 break-inside-avoid">
          <h2 className="type-text-sm-semibold uppercase">{d.long}</h2>
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

/** J1·4: the weekend in and around the lodge, built with Wiley. Day tabs on mobile (Friday first), three columns on desktop. */
export function J1Plan() {
  const { s, run } = useDemo()
  const desktop = usePageWide()
  const plan = usePlan()
  const [day, setDay] = useState<'fri' | 'sat' | 'sun'>('fri')
  // When Wiley points at a day (Sunday's suggestion, MagiQuest moved to Friday), the tabs follow.
  useEffect(() => {
    if (s.planDay) setDay(s.planDay)
  }, [s.planDay])
  const suite = quoteOf(s)?.suite.name ?? 'Junior Wolf Pup Den Suite'
  const exportCalendar = () => {
    downloadCalendar(
      'great-wolf-weekend.ics',
      plan.map((p) => ({
        title: p.status === 'Suggested' ? `${p.title} (suggested)` : p.title,
        date: DAY_DATE[p.day],
        time: p.time,
        location: p.sub?.startsWith('Near') ? p.title : `${lodge.name}, ${lodge.city}`,
        description: [p.sub, p.status].filter(Boolean).join(' · '),
      })),
    )
    run([{ do: 'toast', text: 'Calendar file downloaded' }])
  }
  const actions = (
    <>
      <Button shape="pill" variant="outline" intent="neutral" onClick={exportCalendar}>
        <Icon icon={CalendarPlusIcon} /> Add to calendar
      </Button>
      <Button shape="pill" variant="outline" intent="neutral" onClick={() => window.print()}>
        <Icon icon={PrinterIcon} /> Print
      </Button>
    </>
  )
  return (
    <Page>
      <div className="flex flex-col gap-5 print:hidden">
        <Title tag={<WileyTag>Built with Wiley</WileyTag>} actions={actions}>
          Your weekend · {dates.j1.short}
        </Title>
        {desktop ? (
          <>
            <div className="grid grid-cols-3 gap-4">
              {DAYS.map((d) => (
                <section key={d.key} aria-label={d.long} className="flex flex-col gap-3">
                  <h2 className="type-text-xs-semibold tracking-wide text-muted-foreground uppercase">{d.long}</h2>
                  <ul className="flex flex-col gap-3">
                    {plan.filter((p) => p.day === d.key).map((p) => (
                      <PlanRow key={p.id} item={p} />
                    ))}
                  </ul>
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
            <ToggleGroup type="single" value={day} onValueChange={(v) => v && setDay(v as typeof day)} aria-label="Day" className="gap-2">
              {DAYS.map((d) => (
                <ToggleGroupItem key={d.key} value={d.key} className="h-9 rounded-full border px-4">
                  {d.label}
                </ToggleGroupItem>
              ))}
            </ToggleGroup>
            <ul className="flex flex-col gap-3">
              {plan.filter((p) => p.day === day).map((p) => (
                <PlanRow key={p.id} item={p} />
              ))}
            </ul>
          </>
        )}
      </div>
      <PrintablePlan plan={plan} suite={suite} />
    </Page>
  )
}

/** J1·5: checkout, prefilled from the account. Payment is native; Wiley stays out of it. */
export function J1Checkout() {
  const { s, run, go } = useDemo()
  const desktop = usePageWide()
  const total = quoteOf(s)?.total ?? 0
  const applePay = (
    <Button shape="pill" size="lg" className="w-full bg-[#000000] text-[#ffffff] hover:bg-[#222222] dark:bg-[#ffffff] dark:text-[#000000]" onClick={() => run([{ do: 'sheet', which: 'apple' }])}>
      {desktop ? 'Pay with Apple Pay' : `Pay with Apple Pay · ${money(total)}`}
    </Button>
  )
  const savedCard = (
    <Button shape="pill" size="lg" variant="outline" intent="neutral" className="w-full" onClick={() => go('j1/6')}>
      {fam.card} (Saved card)
    </Button>
  )
  const prefilled = (
    <Badge variant="subtle" size="sm">
      Prefilled from your account
    </Badge>
  )
  const step = (
    <div className="flex flex-col gap-2">
      <h1 className="type-text-sm-semibold">Step 4 of 4 · Review and pay</h1>
      <Progress value={100} aria-label="Checkout progress" />
    </div>
  )
  const title = `Your trip · ${dates.j1.short} · sample prices`
  if (desktop) {
    return (
      <Page>
        {step}
        <WileyNote>I filled everything in from your account. Just review and pay. I’ll never ask for card details in chat.</WileyNote>
        <div className="grid grid-cols-[1.4fr_1fr] items-start gap-5">
          <div className="flex flex-col gap-4">
            <Card className="gap-2 rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <Label>Guest details</Label>
                {prefilled}
              </div>
              <dl className="grid grid-cols-[1fr_auto] gap-y-1 type-text-sm-normal">
                <dt>Lead guest</dt>
                <dd className="type-text-sm-semibold">
                  {fam.lead} {fam.name}
                </dd>
                <dt>Kids</dt>
                <dd className="type-text-sm-semibold">Mia (7), Leo (4)</dd>
              </dl>
            </Card>
            <Card className="gap-3 rounded-2xl p-4">
              <Label>Payment</Label>
              {applePay}
              {savedCard}
            </Card>
          </div>
          <TripQuote checkout title={title} />
        </div>
      </Page>
    )
  }
  return (
    <Page className="pb-24">
      {step}
      <WileyNote>I filled everything in from your account. I’ll never ask for card details in chat.</WileyNote>
      <TripQuote checkout title={title} />
      <Card className="items-start gap-1.5 rounded-2xl p-4">
        {prefilled}
        <span className="type-text-sm-semibold">
          {fam.lead} {fam.name} · 2 adults, 2 kids
        </span>
        <span className="type-text-xs-normal text-muted-foreground">Mia (7), Leo (4)</span>
      </Card>
      {applePay}
      {savedCard}
    </Page>
  )
}

/** J1·6: booked. The plan moves to the app. */
export function J1Booked() {
  const { s, run } = useDemo()
  const desktop = usePageWide()
  const plan = usePlan()
  const q = quoteOf(s)
  const sunday = plan.find((p) => p.day === 'sun' && (p.id === 'zoo' || p.id === 'garden'))
  const items = [...plan.filter((p) => ['magiquest', 'party', 'dinner', 'ropes', 'dance'].includes(p.id) && p.status !== 'Suggested'), ...(sunday ? [sunday] : [])]
  const when = (p: PlanItem) => `${p.day === 'sat' ? 'Sat' : p.day === 'sun' ? 'Sun' : 'Fri'} ${p.time}`
  const hasParty = s.cart.some((c) => c.kind === 'birthday')
  const list = (
    <div className="flex min-w-0 flex-1 flex-col gap-3">
      <Label>Your weekend plan, in the app</Label>
      <ul className="flex flex-col gap-1.5">
        {items.map((p) => (
          <li key={p.id} className="flex justify-between gap-3 type-text-sm-normal">
            <span>
              {p.title}
              {p.status === 'Suggested' && ' (suggested)'}
            </span>
            <span className="type-text-sm-semibold whitespace-nowrap">{when(p)}</span>
          </li>
        ))}
      </ul>
    </div>
  )
  return (
    <Page className={cn(!desktop && 'pb-24')}>
      <Badge variant="subtle" size="sm" className="w-fit">
        <Icon icon={CheckIcon} /> Confirmed
      </Badge>
      <Title sub={`Confirmation GWL-48213 · ${q?.suite.name ?? 'Junior Wolf Pup Den Suite'} · ${dates.j1.long}`}>You’re booked! See you March 12.</Title>
      <Card className="gap-4 rounded-2xl border-2 border-foreground p-5">
        {desktop ? (
          <div className="flex items-start gap-8">
            <div className="flex min-w-0 flex-1 flex-col gap-4">
              {list}
              <div className="flex gap-2">
                <Button shape="pill" onClick={() => run([{ do: 'toast', text: 'App link sent' }, { do: 'end', card: 'companion' }])}>
                  Text me the app link
                </Button>
                <Button shape="pill" variant="outline" intent="neutral" onClick={() => run([{ do: 'toast', text: 'Added to your calendar' }])}>
                  Add to calendar
                </Button>
              </div>
            </div>
            <div className="flex shrink-0 flex-col items-center gap-2">
              <span className="grid size-32 place-items-center rounded-xl border-2 border-dashed text-muted-foreground" aria-hidden>
                <Icon icon={QrCodeIcon} className="size-14" />
              </span>
              <span className="type-text-xs-normal text-muted-foreground">Scan to get the app</span>
            </div>
          </div>
        ) : (
          <>
            {list}
            <Button shape="pill" size="lg" onClick={() => run([{ do: 'end', card: 'companion' }])}>
              Open in the Great Wolf app
            </Button>
            <Button shape="pill" size="lg" variant="outline" intent="neutral" onClick={() => run([{ do: 'toast', text: 'Added to your calendar' }])}>
              Add to calendar
            </Button>
          </>
        )}
      </Card>
      <WileyNote>
        {hasParty ? 'Mia’s going to love this! I’ll be in the app when you arrive, with Saturday planned around the party.' : 'I’ll be in the app when you arrive, with your Saturday ready.'}
      </WileyNote>
    </Page>
  )
}
