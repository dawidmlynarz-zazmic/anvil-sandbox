import { Badge } from '@anvil/components/ui/badge'
import { Button } from '@anvil/components/ui/button'
import { Card } from '@anvil/components/ui/card'
import { CheckIcon, Icon, QrCodeIcon, SparklesIcon } from '@anvil/components/ui/icon'
import { Progress } from '@anvil/components/ui/progress'
import { cn } from '@anvil/lib/utils'
import { dates, families, money } from '~/data/fixtures'
import { photos } from '~/data/photos'
import { Photo, WileyAvatar, WileyTag } from '~/components/local/Brand/Brand'
import { TripQuote } from '~/components/local/WileyCards/WileyCards'
import { quoteOf, useDemo } from '~/state/demo'
import { j1Plan } from '~/state/plan'
import { guestsLong, longDates, shortDates, toDate } from '~/state/stay'
import { usePageWide } from '~/state/layout'
import { Page, Popular, Title } from './shared'
import { WeekendPlan } from './weekend'

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

/** The plan as the page shows it, read against the trip (passes, birthday package, dining, late check-out). */
function usePlan() {
  const { s } = useDemo()
  return j1Plan(s)
}

/** J1·6: after booking, the weekend in and around the lodge, drafted by Wiley from the trip. */
export function J1Plan() {
  const { s, run } = useDemo()
  const plan = usePlan()
  const suite = quoteOf(s)?.suite.name ?? 'Junior Wolf Pup Den Suite'
  return (
    <WeekendPlan
      plan={plan}
      title={`Your weekend · ${shortDates(s.stay) ?? 'dates to pick'}`}
      tag={<WileyTag>Built with Wiley</WileyTag>}
      primary={
        <Button shape="pill" onClick={() => run([{ do: 'toast', text: 'Plan sent to the app' }, { do: 'end', card: 'companion' }])}>
          Send to the app
        </Button>
      }
      printWhen={longDates(s.stay)}
      printWho={`${fam.name} family · ${guestsLong(s.stay)} · ${suite}`}
      file="great-wolf-weekend.ics"
    />
  )
}

/** Who is checking out: the Martinez family's account in Journey 1; the new member (fictional) in Journey 2. */
function useGuest() {
  const { s, journey } = useDemo()
  return journey === 1
    ? { name: `${fam.lead} ${fam.name}`, kids: 'Mia (7), Leo (4)', card: `${fam.card} (Saved card)`, badge: 'Prefilled from your account', note: 'I filled everything in from your account.' }
    : s.signedIn
      ? { name: 'Alex Rivera', kids: guestsLong(s.stay), card: 'Pay with a card', badge: 'Prefilled from your new Voyagers Club account', note: 'I filled in what you gave Voyagers Club.' }
      : { name: 'Alex Rivera', kids: guestsLong(s.stay), card: 'Pay with a card', badge: 'Guest checkout', note: 'Check your details, then pay.' }
}

/** J1·4 and J2·6: checkout, prefilled from the account. Payment is native; Wiley stays out of it. */
export function Checkout() {
  const { s, run, go, journey } = useDemo()
  const desktop = usePageWide()
  const who = useGuest()
  const total = quoteOf(s)?.total ?? 0
  const applePay = (
    <Button shape="pill" size="lg" className="w-full bg-[#000000] text-[#ffffff] hover:bg-[#222222] dark:bg-[#ffffff] dark:text-[#000000]" onClick={() => run([{ do: 'sheet', which: 'apple' }])}>
      {desktop ? 'Pay with Apple Pay' : `Pay with Apple Pay · ${money(total)}`}
    </Button>
  )
  const savedCard = (
    <Button shape="pill" size="lg" variant="outline" intent="neutral" className="w-full" onClick={() => go(journey === 1 ? 'j1/5' : 'j2/7')}>
      {who.card}
    </Button>
  )
  const prefilled = (
    <Badge variant="subtle" size="sm">
      {who.badge}
    </Badge>
  )
  const step = (
    <div className="flex flex-col gap-2">
      <h1 className="type-text-sm-semibold">Step 4 of 4 · Review and pay</h1>
      <Progress value={100} aria-label="Checkout progress" />
    </div>
  )
  const title = `Your trip · ${shortDates(s.stay) ?? 'dates to pick'} · sample prices`
  if (desktop) {
    return (
      <Page>
        {step}
        <WileyNote>{`${who.note} Just review and pay. I’ll never ask for card details in chat.`}</WileyNote>
        <div className="grid grid-cols-[1.4fr_1fr] items-start gap-5">
          <div className="flex flex-col gap-4">
            <Card className="gap-2 rounded-2xl p-4">
              <div className="flex items-center gap-2">
                <Label>Guest details</Label>
                {prefilled}
              </div>
              <dl className="grid grid-cols-[1fr_auto] gap-y-1 type-text-sm-normal">
                <dt>Lead guest</dt>
                <dd className="type-text-sm-semibold">{who.name}</dd>
                <dt>{journey === 1 ? 'Kids' : 'Guests'}</dt>
                <dd className="type-text-sm-semibold">{who.kids}</dd>
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
      <WileyNote>{`${who.note} I’ll never ask for card details in chat.`}</WileyNote>
      <TripQuote checkout title={title} />
      <Card className="items-start gap-1.5 rounded-2xl p-4">
        {prefilled}
        <span className="type-text-sm-semibold">
          {who.name} · {guestsLong(s.stay)}
        </span>
        {journey === 1 && <span className="type-text-xs-normal text-muted-foreground">{who.kids}</span>}
      </Card>
      {applePay}
      {savedCard}
    </Page>
  )
}

/** J1·5 and J2·7: booked. The weekend plan is optional: now on the next page, or later in the app. */
export function Booked() {
  const { s, run, go, journey } = useDemo()
  const desktop = usePageWide()
  const q = quoteOf(s)
  const hasParty = s.cart.some((c) => c.kind === 'birthday')
  const plan = (
    <div className="flex min-w-0 flex-1 flex-col gap-2">
      <Label>Plan your weekend</Label>
      <p className="type-text-sm-normal">
        {hasParty && journey === 1
          ? 'Wiley drafted a weekend around Mia’s party, from your trip. Change it now, or later in the Great Wolf app.'
          : journey === 2 && s.ideas.length
            ? 'Wiley drafted a weekend from your trip and the things you saved. Change it now, or later in the Great Wolf app.'
            : 'Wiley drafted a weekend from your trip. Change it now, or later in the Great Wolf app.'}
      </p>
    </div>
  )
  const planButton = (
    <Button shape="pill" size={desktop ? 'default' : 'lg'} onClick={() => go(journey === 1 ? 'j1/6' : 'j2/8')}>
      Plan our weekend
    </Button>
  )
  const calendar = (
    <Button shape="pill" size={desktop ? 'default' : 'lg'} variant="outline" intent="neutral" onClick={() => run([{ do: 'toast', text: 'Added to your calendar' }])}>
      Add to calendar
    </Button>
  )
  return (
    <Page className={cn(!desktop && 'pb-24')}>
      <Badge variant="subtle" size="sm" className="w-fit">
        <Icon icon={CheckIcon} /> Confirmed
      </Badge>
      <Title sub={`Confirmation ${journey === 1 ? 'GWL-48213' : 'GWL-52907'} · ${q?.suite.name ?? 'Junior Wolf Pup Den Suite'} · ${longDates(s.stay)}`}>{`You’re booked! See you ${s.stay.start ? toDate(s.stay.start).toLocaleDateString('en-US', { month: 'long', day: 'numeric' }) : 'soon'}.`}</Title>
      <Card className="gap-4 rounded-2xl border-2 border-foreground p-5">
        {desktop ? (
          <div className="flex items-start gap-8">
            <div className="flex min-w-0 flex-1 flex-col gap-4">
              {plan}
              <div className="flex gap-2">
                {planButton}
                {calendar}
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
            {plan}
            {planButton}
            {calendar}
          </>
        )}
      </Card>
      <WileyNote>{hasParty && journey === 1 ? 'Mia’s going to love this! I’ll be in the app when you arrive, with your weekend ready.' : 'I’ll be in the app when you arrive, with your weekend ready.'}</WileyNote>
    </Page>
  )
}
