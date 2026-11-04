import { useRef, useState } from 'react'
import { Badge } from '@anvil/components/ui/badge'
import { Button } from '@anvil/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@anvil/components/ui/card'
import { CakeIcon, CalendarDaysIcon, CircleCheckIcon, Icon, PauseIcon, PawPrintIcon, PlayIcon, SparklesIcon } from '@anvil/components/ui/icon'
import { AgentChat } from '~/components/local/AgentChat/AgentChat'
import { DeviceFrame } from '~/components/local/DeviceFrame/DeviceFrame'
import { QuoteCard } from '~/components/local/QuoteCard/QuoteCard'
import { family } from '~/data/family'
import { inventory } from '~/data/inventory'
import { match, useChat, type Chat, type Reply } from '~/lib/chat'
import { money } from '~/lib/format'
import { datesOf, quoteOf, useStore } from '~/state/store'

function LiveQuote({ onBook }: { onBook: () => void }) {
  const { session } = useStore()
  const q = quoteOf(session.trip)
  return (
    <QuoteCard
      title="Your weekend"
      lines={q.lines}
      total={q.total}
      actionLabel={`Book for ${money(q.total)}`}
      onAction={onBook}
      doneLabel={session.trip.booked ? 'Booked. Confirmation MZ-0312' : undefined}
    />
  )
}

function Hero() {
  const { session } = useStore()
  const { trip } = session
  const summer = trip.season === 'summer'
  return (
    <section className="relative isolate overflow-hidden rounded-xl text-[#ffffff]" aria-label="Welcome">
      <div aria-hidden className="gwl-drift absolute inset-0 -z-10 bg-gradient-to-br from-[#0f2f2a] via-[#1d6b52] to-[#2f8f9d]">
        <svg viewBox="0 0 400 160" preserveAspectRatio="xMidYMax slice" className="absolute inset-x-0 bottom-0 h-3/4 w-full opacity-30">
          <path d="M0 160V120l20-30 20 30 20-50 25 50 22-36 22 36 18-60 26 60 24-40 24 40 20-48 22 48 24-32 24 32 18-44 22 44 20-30 20 30v40z" fill="#06201a" />
        </svg>
        <span className="absolute top-6 right-10 size-12 rounded-full bg-[#fdecc8cc] blur-[1px]" />
      </div>
      <div className="flex min-h-48 flex-col justify-end gap-2 p-6 sm:min-h-56">
        <Badge variant="default" tone="neutral" size="sm" className="w-fit bg-[#ffffff33] text-[#ffffff] backdrop-blur">
          <Icon icon={SparklesIcon} />Made for the {family.name} family
        </Badge>
        <h1 className="type-heading-2xl">Welcome back, {family.name} family</h1>
        <p className="type-text-base-normal max-w-xl text-[#ffffffe6]">
          {trip.booked ? `You’re booked for ${datesOf(trip).label}.` : summer ? 'Your summer weekend is waiting, in the suite you love.' : 'The wolf pack is ready for another weekend.'}
        </p>
        <span className="type-text-2xs-normal absolute top-3 left-4 text-[#ffffffb3]">Image generated for this family (placeholder)</span>
      </div>
    </section>
  )
}

function Milestone() {
  const { session } = useStore()
  const summer = session.trip.season === 'summer'
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Icon icon={CakeIcon} tone="agent" />{summer ? 'Your summer weekend is held' : 'Mia turns 7 on March 13'}</CardTitle>
        <CardDescription>
          {summer
            ? 'Same Wolf Den Suite, Friday to Sunday. We kept Saturday afternoon for a cabana.'
            : `Your favorite suite is open that weekend. The ${family.favoriteSuite} sleeps the whole family, and the party room has a slot on Saturday.`}
        </CardDescription>
      </CardHeader>
    </Card>
  )
}

function TripPreview() {
  const [playing, setPlaying] = useState(false)
  return (
    <Card size="sm" className="max-w-xl overflow-hidden pt-0">
      <div className="relative grid aspect-video place-items-center bg-gradient-to-br from-[#244a63] to-[#1d6b52]">
        <Button variant="default" intent="inverse" size="icon-lg" shape="circle" aria-label={playing ? 'Pause the trip preview' : 'Play the trip preview'} onClick={() => setPlaying((p) => !p)}>
          <Icon icon={playing ? PauseIcon : PlayIcon} />
        </Button>
        {playing && (
          <div className="absolute inset-x-3 bottom-3 h-1 overflow-hidden rounded-full bg-[#ffffff4d]" aria-hidden>
            <div className="h-full origin-left animate-[gwl-grow_24s_linear_forwards] bg-[#ffffff]" />
          </div>
        )}
        <span className="type-text-2xs-normal absolute top-2 left-3 text-[#ffffffcc]">Video generated for this trip (placeholder)</span>
      </div>
      <CardHeader>
        <CardTitle>Your trip preview, 0:24</CardTitle>
        <CardDescription>{playing ? 'Playing: your suite, the party room and Cabana 12.' : 'See your suite, the party room and the cabana before you book.'}</CardDescription>
      </CardHeader>
    </Card>
  )
}

function Weekend() {
  const { session } = useStore()
  const { trip } = session
  const q = quoteOf(trip)
  return (
    <Card size="sm">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Icon icon={CalendarDaysIcon} />Your weekend</CardTitle>
        <CardDescription>{datesOf(trip).label}</CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-2">
        <ul className="flex flex-col gap-1.5">
          {q.lines.map((l) => (
            <li key={l.id} className="type-text-sm-normal flex justify-between gap-3">
              <span>{l.label}{l.detail ? <span className="text-muted-foreground">, {l.detail}</span> : null}</span>
              <span className="tabular-nums">{money(l.amount)}</span>
            </li>
          ))}
        </ul>
        <div className="type-text-sm-semibold flex items-center justify-between border-t pt-2">
          <span className="flex items-center gap-2">Total {trip.booked && <Badge variant="subtle" tone="success" size="sm"><Icon icon={CircleCheckIcon} />Booked</Badge>}</span>
          <span className="tabular-nums">{money(q.total)}</span>
        </div>
      </CardContent>
    </Card>
  )
}

export function HomeScreen() {
  const { session, editTrip } = useStore()
  const { trip } = session
  const chatRef = useRef<Chat | null>(null)
  const sessionRef = useRef(session)
  sessionRef.current = session

  const book = () => {
    const t = sessionRef.current.trip
    editTrip({ booked: true })
    chatRef.current?.agentSay({
      text: `Booked. Your ${inventory.suites[t.suite].name} is held for ${datesOf(t).label}, and your confirmation is MZ-0312. In the app, I can plan Mia’s Saturday with you.`,
    })
  }
  const bookRef = useRef(book)
  bookRef.current = book

  const quote = (key = 'quote'): Pick<Reply, 'widget' | 'widgetKey'> => ({ widget: <LiveQuote onBook={() => bookRef.current()} />, widgetKey: key })
  const total = (t = sessionRef.current.trip) => money(quoteOf(t).total)

  const respond = (text: string): Reply => {
    const t = sessionRef.current.trip
    if (t.booked) {
      return match<Reply>(text, [
        [/included|what/i, { text: `Your trip has the ${inventory.suites[t.suite].name} with water park passes, ${inventory.party.name.toLowerCase()} and ${inventory.cabana.name} ${inventory.cabana.slot.toLowerCase()}.` }],
        [/app|plan|saturday|concierge/i, { text: 'Open the app and I’ll plan Mia’s Saturday around the party and the cabana.' }],
      ], { text: 'Your trip is booked. To change it, use the app or talk to the front desk. I can tell you what’s included.', chips: [{ label: 'What’s included?' }] })
    }
    return match<Reply>(
      text,
      [
        [/dining|food|eat|meal/i, {
          tools: ['Checked dining plans for your dates'],
          text: `Added the dining plan for two days, ${money(inventory.dining.price)}. Your total is ${total({ ...t, dining: true })}.`,
          effect: () => editTrip({ dining: true }),
          ...quote(),
          chips: [{ label: 'Add a night' }, { label: 'Book this trip', say: 'Book it' }],
        }],
        [/change.*date|different date|other date|move/i, {
          text: t.nights === 3
            ? 'You’re staying three nights now. Want to go back to the weekend you had?'
            : 'These dates cover Mia’s birthday on Saturday. If you want more time, I can add Sunday night (checkout Monday) for $389.',
          chips: t.nights === 3 ? [{ label: 'Back to two nights' }] : [{ label: 'Add a night' }, { label: 'Keep my dates' }],
        }],
        [/keep my dates/i, { text: 'Sure, you’re keeping Friday to Sunday.', ...quote(), chips: [{ label: 'Add dining' }] }],
        [/two nights|back to/i, {
          text: `Back to two nights. Your total is ${total({ ...t, nights: 2 })}.`,
          effect: () => editTrip({ nights: 2 }),
          ...quote(),
        }],
        [/night|sunday|extra|longer/i, {
          text: `Added Sunday night, with checkout on Monday. Your total is ${total({ ...t, nights: 3 })}.`,
          effect: () => editTrip({ nights: 3 }),
          ...quote(),
          chips: [{ label: 'Add dining' }, { label: 'Book this trip', say: 'Book it' }],
        }],
        [/book|reserve|confirm|buy/i, { text: 'Booking it now.', effect: () => bookRef.current(), delay: 500 }],
        [/total|price|cost|how much/i, { text: `Your total is ${total()}. That’s everything on the trip card, before any changes.`, ...quote() }],
        [/party|birthday|cake/i, { text: `${inventory.party.name}: ${inventory.party.note}. It’s on your trip for ${money(inventory.party.price)}.` }],
        [/cabana|pool|water/i, { text: `${inventory.cabana.name} is held ${inventory.cabana.slot.toLowerCase()} for ${money(inventory.cabana.price)}.` }],
      ],
      {
        text: 'I can add a dining plan, change the dates, or book this trip. Which one?',
        chips: [{ label: 'Add dining' }, { label: 'Change dates' }, { label: 'Book this trip', say: 'Book it' }],
      },
    )
  }

  const summer = trip.season === 'summer'
  const opening: Reply = summer
    ? {
        text: `Welcome back, ${family.guest}. I held the summer weekend you accepted: ${inventory.suites['wolf-den'].name}, ${datesOf(trip).short}, with a Saturday cabana. Want a dining plan too?`,
        ...quote(),
        chips: [{ label: 'Add dining' }, { label: 'Book this trip', say: 'Book it' }],
      }
    : trip.booked
      ? { text: `You’re booked for ${datesOf(trip).label}. Anything you’d like to know about the weekend?`, chips: [{ label: 'What’s included?' }] }
      : {
          text: `Hi ${family.guest}. Mia turns 7 on March 13, and the ${family.favoriteSuite} is open that weekend. I built a trip: the suite for two nights, the birthday party package and a Saturday cabana. Change anything you like.`,
          ...quote(),
          chips: [{ label: 'Add dining' }, { label: 'Change dates' }],
        }

  const chat = useChat(respond, opening)
  chatRef.current = chat

  return (
    <DeviceFrame kind="desktop" url="greatwolf.example/welcome-back" className="max-lg:h-auto">
      <div className="flex h-12 shrink-0 items-center gap-6 border-b px-5">
        <span className="type-text-sm-semibold flex items-center gap-2"><Icon icon={PawPrintIcon} tone="brand" />Great Wolf Lodge</span>
        <nav aria-label="Site" className="type-text-sm-normal hidden gap-5 text-muted-foreground sm:flex">
          <span>Rooms</span><span>Water park</span><span>Dining</span><span>Offers</span>
        </nav>
        <span className="type-text-sm-medium ml-auto text-muted-foreground">{family.name} family</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col max-lg:flex-none lg:flex-row">
        <div className="flex min-h-0 min-w-0 flex-1 flex-col gap-4 p-5 max-lg:flex-none lg:overflow-auto [&>*]:shrink-0">
          <Hero />
          <div className="grid gap-4 xl:grid-cols-2">
            <Milestone />
            <Weekend />
          </div>
          <TripPreview />
        </div>
        <aside aria-label="Booking agent" className="flex h-[560px] shrink-0 border-t lg:h-auto lg:w-[360px] lg:border-t-0 lg:border-l">
          <AgentChat chat={chat} name="Booking agent" subtitle="Builds your trip with you" placeholder="Ask to change your trip" disclaimer="A scripted demo. Nothing is booked or charged." />
        </aside>
      </div>
    </DeviceFrame>
  )
}
