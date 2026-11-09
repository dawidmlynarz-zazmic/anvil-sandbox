import { useState } from 'react'
import { Badge } from '@anvil/components/ui/badge'
import { Button } from '@anvil/components/ui/button'
import { Card } from '@anvil/components/ui/card'
import { CalendarPlusIcon, CheckIcon, Icon, QrCodeIcon, SmartphoneIcon } from '@anvil/components/ui/icon'
import { Progress } from '@anvil/components/ui/progress'
import { ToggleGroup, ToggleGroupItem } from '@anvil/components/ui/toggle-group'
import { cn } from '@anvil/lib/utils'
import { dates, families, money, nearby } from '~/data/fixtures'
import { Photo, WileyAvatar, WileyTag } from '~/components/local/Brand/Brand'
import { TripQuote } from '~/components/local/WileyCards/WileyCards'
import { quoteOf, useDemo } from '~/state/demo'
import type { PlanItem } from '~/wiley/types'
import { Page, PlanRow, Title } from './shared'

const fam = families.martinez

function WileyNote({ children }: { children: string }) {
  return (
    <div className="flex items-start gap-3 rounded-2xl border-2 border-dashed border-agent-muted bg-agent-subtle/60 p-4 type-text-sm-normal">
      <WileyAvatar size={28} />
      <p className="pt-0.5">{children}</p>
    </div>
  )
}

/** J1·1: the lodge home, personalized for a signed-in family. Wiley waits in the launcher. */
export function J1Home() {
  const { desktop, go } = useDemo()
  const toPlan = () => go('j1/2')
  const intro = (
    <div className="flex flex-col gap-3">
      <h1 className={cn('gwl-display leading-tight', desktop ? 'text-4xl' : 'text-[28px]')}>Welcome back, {fam.name} family</h1>
      <p className="type-text-md-normal text-muted-foreground">Mia turns 7 on March 13. Your favorite Junior Wolf Pup Den Suite is open that weekend.</p>
      <Button shape="pill" size="lg" className={cn(desktop ? 'w-fit px-8' : 'w-full')} onClick={toPlan}>
        Plan Mia’s birthday weekend
      </Button>
    </div>
  )
  const weekend = (
    <Card className="gap-1 rounded-2xl p-5">
      <p className="type-text-xs-semibold tracking-wide text-muted-foreground uppercase">Your weekend</p>
      <p className="mt-1 type-text-sm-normal">{dates.j1.long}</p>
      <p className="gwl-display text-lg">Junior Wolf Pup Den Suite</p>
      <p className="type-text-sm-normal text-muted-foreground">from {money(119)} / night</p>
      <Button shape="pill" variant="outline" intent="neutral" className="mt-3 w-fit" onClick={toPlan}>
        Hold these dates
      </Button>
    </Card>
  )
  const lastVisit = (
    <Card className="gap-1 rounded-2xl p-5">
      <p className="type-text-xs-semibold tracking-wide text-muted-foreground uppercase">Last visit</p>
      <p className="mt-1 type-text-sm-normal">December 2025</p>
      <p className="gwl-display text-lg">Junior Wolf Pup Den Suite</p>
      <p className="type-text-sm-normal text-muted-foreground">With MagiQuest for Mia and Leo</p>
      <Button shape="pill" variant="outline" intent="neutral" className="mt-3 w-fit" onClick={toPlan}>
        Repeat last trip
      </Button>
    </Card>
  )
  const around = [
    { name: 'Family dance party', where: 'In the lodge', tag: 'Included', tone: 'lake' as const },
    { name: nearby[0].name, where: 'Near the lodge', tag: 'Feed the giraffes', tone: 'forest' as const },
    { name: nearby[1].name, where: 'Near the lodge', tag: 'Free', tone: 'dusk' as const },
  ]
  return (
    <Page className={cn(!desktop && 'pb-24')} wide>
      {desktop ? (
        <div className="grid grid-cols-[1.4fr_1fr] gap-6">
          <div className="flex flex-col gap-5">
            <Photo label="Generated hero · Martinez family" tone="dusk" className="h-72 rounded-3xl">
              <Badge className="absolute bottom-4 left-4">Made for the Martinez family</Badge>
            </Photo>
            {intro}
          </div>
          <div className="flex flex-col gap-4">
            {weekend}
            {lastVisit}
          </div>
        </div>
      ) : (
        <>
          <Photo label="Generated hero · Martinez family" tone="dusk" className="h-44 rounded-3xl">
            <Badge className="absolute bottom-3 left-3">Made for the Martinez family</Badge>
          </Photo>
          {intro}
          {weekend}
          {lastVisit}
        </>
      )}
      <section aria-labelledby="around" className="flex flex-col gap-3">
        <h2 id="around" className="gwl-display text-lg">
          In and around the lodge that weekend
        </h2>
        <div className={cn('grid gap-3', desktop ? 'grid-cols-3' : 'grid-cols-1')}>
          {around.map((a) => (
            <Card key={a.name} className="flex-row items-center gap-3 overflow-hidden rounded-2xl p-0">
              <Photo label={a.where} tone={a.tone} className="h-20 w-24 shrink-0 [&>span]:hidden" />
              <div className="flex min-w-0 flex-col py-3 pe-3">
                <span className="type-text-sm-semibold">{a.name}</span>
                <span className="type-text-xs-normal text-muted-foreground">{a.where}</span>
                <Badge variant="subtle" size="xs" className="mt-1 w-fit">
                  {a.tag}
                </Badge>
              </div>
            </Card>
          ))}
        </div>
      </section>
    </Page>
  )
}

const DAYS = [
  { key: 'fri', label: 'Fri', long: 'Friday' },
  { key: 'sat', label: 'Sat', long: 'Saturday' },
  { key: 'sun', label: 'Sun', long: 'Sunday' },
] as const

/** The plan as the page shows it: the party is "Booked" only if it's in the cart. */
function usePlan() {
  const { s } = useDemo()
  const hasParty = s.cart.some((c) => c.id === 'party')
  return s.plan.map((p): PlanItem => (p.id === 'party' && !hasParty ? { ...p, status: 'Suggested' } : p))
}

/** J1·4: the weekend in and around the lodge, built with Wiley. Day tabs on mobile, three columns on desktop. */
export function J1Plan() {
  const { desktop } = useDemo()
  const plan = usePlan()
  const [day, setDay] = useState<'fri' | 'sat' | 'sun'>('sun')
  return (
    <Page wide>
      <Title tag={<WileyTag>Built with Wiley</WileyTag>}>Your weekend · {dates.j1.short}</Title>
      {desktop ? (
        <>
          <div className="grid grid-cols-3 gap-5">
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
            <h2 id="more-near" className="gwl-display text-lg">
              More near the lodge
            </h2>
            <div className="grid grid-cols-3 gap-3">
              {nearby.filter((a) => ['garden', 'manitou', 'wolf-center'].includes(a.id)).map((a) => (
                <Card key={a.id} className="gap-1 rounded-2xl p-4">
                  <span className="type-text-sm-semibold">{a.name}</span>
                  <span className="type-text-xs-normal text-muted-foreground">{a.blurb}</span>
                </Card>
              ))}
            </div>
            <p className="type-text-xs-normal text-muted-foreground">From the GWL Things To Do guide.</p>
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
    </Page>
  )
}

/** J1·5: checkout, prefilled from the account. Payment is native; Wiley stays out of it. */
export function J1Checkout() {
  const { s, desktop, run, go } = useDemo()
  const total = quoteOf(s)?.total ?? 0
  const details = (
    <Card className="flex-row items-center justify-between gap-3 rounded-2xl p-4">
      <div className="flex flex-col">
        <span className="type-text-sm-semibold">
          {fam.lead} {fam.name} · 2 adults, 2 kids
        </span>
        <span className="type-text-xs-normal text-muted-foreground">Mia (7), Leo (4)</span>
      </div>
      <Badge variant="subtle" size="sm">
        Prefilled from your account
      </Badge>
    </Card>
  )
  const pay = (
    <div className="flex flex-col gap-3">
      <Button shape="pill" size="lg" className="w-full bg-[#000000] text-[#ffffff] hover:bg-[#222222] dark:bg-[#ffffff] dark:text-[#000000]" onClick={() => run([{ do: 'sheet', which: 'apple' }])}>
        Pay with Apple Pay · {money(total)}
      </Button>
      <Button shape="pill" size="lg" variant="outline" intent="neutral" className="w-full" onClick={() => go('j1/6')}>
        {fam.card} (Saved card)
      </Button>
    </div>
  )
  return (
    <Page className={cn(!desktop && 'pb-24')}>
      <div className="flex flex-col gap-2">
        <h1 className="type-text-sm-semibold">Step 4 of 4 · Review and pay</h1>
        <Progress value={92} aria-label="Checkout progress" />
      </div>
      <WileyNote>I filled everything in from your account. I’ll never ask for card details in chat.</WileyNote>
      {desktop ? (
        <div className="grid grid-cols-[1.3fr_1fr] items-start gap-6">
          <div className="flex flex-col gap-4">
            <TripQuote title={`Your trip · ${dates.j1.short} · sample prices`} />
            {details}
          </div>
          <Card className="gap-4 rounded-2xl p-5">
            <p className="gwl-display text-lg">Payment</p>
            {pay}
          </Card>
        </div>
      ) : (
        <>
          <TripQuote title={`Your trip · ${dates.j1.short} · sample prices`} />
          {details}
          {pay}
        </>
      )}
    </Page>
  )
}

/** J1·6: booked. The plan moves to the app. */
export function J1Booked() {
  const { s, desktop, run } = useDemo()
  const plan = usePlan()
  const q = quoteOf(s)
  const sunday = plan.find((p) => p.day === 'sun' && (p.id === 'zoo' || p.id === 'garden'))
  const items = [
    ...plan.filter((p) => ['magiquest', 'party', 'dance'].includes(p.id) && p.status !== 'Suggested'),
    ...(sunday ? [sunday] : []),
  ]
  const when = (p: PlanItem) => `${p.day === 'sat' ? 'Sat' : p.day === 'sun' ? 'Sun' : 'Fri'} ${p.time}`
  const hasParty = s.cart.some((c) => c.id === 'party')
  return (
    <Page className={cn(!desktop && 'pb-24')}>
      <Badge tone="success" variant="subtle" className="w-fit">
        <Icon icon={CheckIcon} /> Confirmed
      </Badge>
      <Title sub={`Confirmation GWL-48213 · ${q?.suite.name ?? 'Junior Wolf Pup Den Suite'} · ${dates.j1.long}`}>You’re booked! See you March 12.</Title>
      <div className={cn('grid gap-5', desktop && 'grid-cols-[1.3fr_1fr] items-start')}>
        <Card className="gap-3 rounded-2xl border-2 border-foreground p-5">
          <p className="type-text-xs-semibold tracking-wide text-muted-foreground uppercase">Your weekend plan, in the app</p>
          <ul className="flex flex-col gap-2">
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
          {desktop ? (
            <div className="mt-2 flex flex-wrap gap-2">
              <Button shape="pill" onClick={() => run([{ do: 'toast', text: 'App link sent' }, { do: 'end', card: 'companion' }])}>
                <Icon icon={SmartphoneIcon} /> Text me the app link
              </Button>
              <Button shape="pill" variant="outline" intent="neutral" onClick={() => run([{ do: 'toast', text: 'Added to your calendar' }])}>
                <Icon icon={CalendarPlusIcon} /> Add to calendar
              </Button>
            </div>
          ) : (
            <div className="mt-2 flex flex-col gap-2">
              <Button shape="pill" size="lg" onClick={() => run([{ do: 'end', card: 'companion' }])}>
                Open in the Great Wolf app
              </Button>
              <Button shape="pill" size="lg" variant="outline" intent="neutral" onClick={() => run([{ do: 'toast', text: 'Added to your calendar' }])}>
                Add to calendar
              </Button>
            </div>
          )}
        </Card>
        <div className="flex flex-col gap-4">
          <WileyNote>
            {hasParty ? 'Mia’s going to love this! I’ll be in the app when you arrive, with Saturday planned around the party.' : 'I’ll be in the app when you arrive, with your Saturday ready.'}
          </WileyNote>
          {desktop && (
            <Card className="flex-row items-center gap-4 rounded-2xl p-4">
              <span className="grid size-20 shrink-0 place-items-center rounded-lg border-2 border-dashed text-muted-foreground" aria-hidden>
                <Icon icon={QrCodeIcon} className="size-10" />
              </span>
              <span className="type-text-sm-normal">Scan to open your plan in the Great Wolf app.</span>
            </Card>
          )}
        </div>
      </div>
    </Page>
  )
}
