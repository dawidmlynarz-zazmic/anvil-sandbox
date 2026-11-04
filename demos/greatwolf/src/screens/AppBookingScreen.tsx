import { useEffect, useRef, useState } from 'react'
import { OfferCard } from '@anvil/components/agent/offer-card'
import { Price } from '@anvil/components/anvil/price'
import { Alert, AlertDescription } from '@anvil/components/ui/alert'
import { Button } from '@anvil/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@anvil/components/ui/card'
import { ArrowLeftIcon, Icon, InfoIcon } from '@anvil/components/ui/icon'
import { AgentChat } from '~/components/local/AgentChat/AgentChat'
import { DeviceFrame } from '~/components/local/DeviceFrame/DeviceFrame'
import { family, stay } from '~/data/family'
import { inventory } from '~/data/inventory'
import { match, useChat, type Reply } from '~/lib/chat'
import { money } from '~/lib/format'
import { useStore } from '~/state/store'

// The requests the mic "hears". Pre-written: the demo does no speech recognition.
const VOICE_LINES = [
  'Show me suites for Mia’s birthday weekend',
  'Make sure the cabana for Saturday afternoon is locked in',
  'Add the dining plan',
  'What else is included in our stay?',
]

function Compare() {
  const wolf = inventory.suites['wolf-den']
  const kid = inventory.suites.kidkamp
  const rows: [string, string, string][] = [
    ['Price per night', money(wolf.nightly), money(kid.nightly)],
    ['Sleeps', String(wolf.sleeps), String(kid.sleeps)],
    ['Good for', 'A separate living area', 'Kids who love a tent'],
  ]
  return (
    <Card size="sm" className="w-full">
      <CardContent className="type-text-sm-normal grid grid-cols-[1fr_1fr_1fr] gap-x-2 gap-y-2">
        <span />
        <strong className="type-text-xs-semibold">Wolf Den (yours)</strong>
        <strong className="type-text-xs-semibold">KidKamp</strong>
        {rows.map(([k, a, b]) => (
          <div key={k} className="contents">
            <span className="type-text-xs-normal text-muted-foreground">{k}</span>
            <span>{a}</span>
            <span>{b}</span>
          </div>
        ))}
      </CardContent>
    </Card>
  )
}

/** Stands in for the app's own checkout: the agent hands over here, the guest finishes, the agent picks up again. */
function ExistingCheckout({ onBack, onConfirm }: { onBack: () => void; onConfirm: () => void }) {
  const wolf = inventory.suites['wolf-den']
  const kid = inventory.suites.kidkamp
  return (
    <div className="flex min-h-0 flex-1 flex-col" data-slot="existing-checkout">
      <div className="flex h-12 shrink-0 items-center gap-2 border-b px-2">
        <Button variant="ghost" intent="neutral" size="icon-sm" aria-label="Back to the chat" onClick={onBack}><Icon icon={ArrowLeftIcon} /></Button>
        <span className="type-text-sm-semibold">Change your booking</span>
      </div>
      <div className="flex min-h-0 flex-1 flex-col gap-3 overflow-auto p-4">
        <Alert>
          <Icon icon={InfoIcon} />
          <AlertDescription>This is the lodge’s existing app checkout. The agent handed you here and will pick up again when you finish.</AlertDescription>
        </Alert>
        <Card size="sm">
          <CardHeader><CardTitle>Stay</CardTitle></CardHeader>
          <CardContent className="type-text-sm-normal flex flex-col gap-1.5">
            <div className="flex justify-between"><span className="text-muted-foreground">Dates</span><span>{stay.spring.short}, 2027</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">Current suite</span><span>{wolf.name}</span></div>
            <div className="flex justify-between"><span className="text-muted-foreground">New suite</span><span className="font-medium">{kid.name}</span></div>
            <div className="type-text-sm-semibold flex justify-between border-t pt-2"><span>Change in price</span><span>{money(0)}</span></div>
          </CardContent>
        </Card>
      </div>
      <div className="flex gap-2 border-t p-3">
        <Button variant="outline" intent="neutral" className="flex-1" onClick={onBack}>Keep my suite</Button>
        <Button className="flex-1" onClick={onConfirm}>Confirm change</Button>
      </div>
    </div>
  )
}

export function AppBookingScreen() {
  const { session, patch, editTrip } = useStore()
  const [view, setView] = useState<'chat' | 'checkout'>('chat')
  const [listening, setListening] = useState(false)
  const voiceIndex = useRef(0)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const sessionRef = useRef(session)
  sessionRef.current = session
  const openCheckout = () => setView('checkout')

  const kidkamp = inventory.suites.kidkamp
  const suiteCard = (
    <OfferCard
      layout="horizontal"
      className="w-full"
      media={<div aria-hidden className="h-full w-full bg-gradient-to-br from-[#244a63] to-[#1d6b52]" />}
      badge="Water park passes included"
      title={kidkamp.name}
      subtitle={kidkamp.note}
      meta={`Sleeps ${kidkamp.sleeps} · ${stay.spring.short}`}
      price={<span className="flex items-baseline gap-1"><Price current={money(kidkamp.nightly)} size="sm" /><span className="type-text-xs-normal text-muted-foreground">per night</span></span>}
      ctaLabel="Switch"
      onCta={openCheckout}
    />
  )

  const respond = (text: string): Reply => {
    const t = sessionRef.current.trip
    return match<Reply>(
      text,
      [
        [/compare/i, { text: 'Same price, different feel. Here are both side by side.', widget: <Compare />, chips: [{ label: 'Book the KidKamp Suite', onPick: openCheckout }, { label: 'Lock in the cabana' }] }],
        [/suite|room|stay in/i, {
          tools: ['Checked suites for Mar 12–14'],
          text: `You’re booked in the ${inventory.suites[t.suite].name} for ${stay.spring.short}. If Mia would like something different, the ${kidkamp.name} is open too.`,
          widget: suiteCard,
          chips: [{ label: 'Compare with my suite' }, { label: 'Lock in the cabana' }],
        }],
        [/cabana/i, {
          tools: ['Checked Cabana 12 for Saturday'],
          text: `${inventory.cabana.name} is yours from 1 to 3 pm on Saturday for ${money(inventory.cabana.price)}.`,
          effect: () => patch({ cabanaConfirmed: true }),
          chips: sessionRef.current.trip.dining ? [{ label: 'What else is included?' }] : [{ label: 'Add dining' }, { label: 'What else is included?' }],
        }],
        [/dining|food|eat|meal/i, {
          text: `Added the dining plan for two days, ${money(inventory.dining.price)}. It’s on your booking now.`,
          effect: () => editTrip({ dining: true }),
          chips: [{ label: 'What else is included?' }],
        }],
        [/included|what else|party|birthday/i, {
          text: `Your stay has water park passes, the ${inventory.party.name.toLowerCase()} on Saturday, and the cabana. On arrival day, the concierge plans Saturday with you.`,
        }],
      ],
      {
        text: 'I can show suites, lock in the cabana, or add a dining plan. You can type it or tap the mic.',
        chips: [{ label: 'Show me suites' }, { label: 'Lock in the cabana' }, { label: 'Add dining' }],
      },
    )
  }

  const chat = useChat(respond, {
    text: `Hi ${family.guest}. Tap the mic and tell me what you’d like for ${family.kids[0].name}’s birthday weekend, or type it. In this demo, the mic plays a pre-written request.`,
    chips: [{ label: 'Show me suites' }, { label: 'Lock in the cabana' }, { label: 'Add dining' }],
  })

  useEffect(() => () => clearTimeout(timer.current), [])

  const onVoice = () => {
    if (listening) {
      clearTimeout(timer.current)
      setListening(false)
      return
    }
    setListening(true)
    timer.current = setTimeout(() => {
      setListening(false)
      chat.say(VOICE_LINES[voiceIndex.current++ % VOICE_LINES.length], { voice: true })
    }, 2200)
  }

  const confirmSwitch = () => {
    editTrip({ suite: 'kidkamp' })
    setView('chat')
    chat.agentSay({ text: `Done. You’re in the ${kidkamp.name} for ${stay.spring.short}, and the price hasn’t changed.`, chips: [{ label: 'Lock in the cabana' }] })
  }

  return (
    <DeviceFrame kind="phone" statusBar>
      <div className="flex h-12 shrink-0 items-center justify-between border-b px-4">
        <span className="type-text-sm-semibold">Great Wolf Lodge</span>
        <span className="type-text-xs-medium text-muted-foreground">My trips</span>
      </div>
      {view === 'checkout' ? (
        <ExistingCheckout onBack={() => setView('chat')} onConfirm={confirmSwitch} />
      ) : (
        <AgentChat
          chat={chat}
          name="Concierge"
          subtitle={listening ? 'Live: listening' : 'Voice or text'}
          surface="mobile"
          placeholder="Ask or tap the mic"
          disclaimer="Scripted demo. The mic plays a pre-written request."
          onVoice={onVoice}
          listening={listening}
        />
      )}
    </DeviceFrame>
  )
}
