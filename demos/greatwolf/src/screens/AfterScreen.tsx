import { useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { OfferCard } from '@anvil/components/agent/offer-card'
import { RatingScale } from '@anvil/components/agent/rating-scale'
import { Price } from '@anvil/components/anvil/price'
import { Button } from '@anvil/components/ui/button'
import { Card, CardContent, CardHeader, CardTitle } from '@anvil/components/ui/card'
import { Icon, MailIcon } from '@anvil/components/ui/icon'
import { AgentChat } from '~/components/local/AgentChat/AgentChat'
import { DeviceFrame } from '~/components/local/DeviceFrame/DeviceFrame'
import { LockScreen } from '~/components/local/LockScreen/LockScreen'
import { family, stay } from '~/data/family'
import { inventory } from '~/data/inventory'
import { match, useChat, type Chat, type Reply } from '~/lib/chat'
import { money } from '~/lib/format'
import { useStore } from '~/state/store'

function Email({ onOpen }: { onOpen: () => void }) {
  return (
    <Card className="w-full max-w-md self-start" data-slot="email-preview">
      <CardHeader>
        <CardTitle className="flex items-center gap-2"><Icon icon={MailIcon} />How was {family.kids[0].name}’s weekend?</CardTitle>
        <p className="type-text-xs-normal text-muted-foreground">From Great Wolf Lodge · Sunday, Mar 14, 4:10 pm</p>
      </CardHeader>
      <CardContent className="type-text-sm-normal flex flex-col gap-3">
        <p>Hi {family.guest}, thanks for staying with us. Happy birthday to {family.kids[0].name}! It takes a minute to tell us how it went.</p>
        <Button className="w-fit" variant="outline" intent="neutral" onClick={onOpen}>Share how it went</Button>
        <p className="type-text-xs-normal text-muted-foreground">The same check-in also reaches the guest as an app notification. Both open the chat on the phone.</p>
      </CardContent>
    </Card>
  )
}

export function AfterScreen() {
  const { session, patch } = useStore()
  const navigate = useNavigate()
  const [phase, setPhase] = useState<'lock' | 'app'>('lock')
  const chatRef = useRef<Chat | null>(null)
  const rating = useRef<number | undefined>(session.feedback?.rating)
  const sessionRef = useRef(session)
  sessionRef.current = session
  const kid = family.kids[0].name

  const rate = (n: number) => {
    rating.current = n
    chatRef.current?.say(`${n} out of 5`)
  }
  const scale = { widget: <RatingScale scale="faces" aria-label="Rate your stay" onValueChange={rate} />, widgetKey: 'scale' }

  const hold = () => {
    patch({ offerAccepted: true, trip: { season: 'summer', suite: sessionRef.current.trip.suite, nights: 2, dining: false, booked: false } })
    chatRef.current?.agentSay({ text: 'Held for you. Your homepage now shows the summer weekend.', chips: [{ label: 'See my updated homepage', onPick: () => navigate('/discover') }] })
  }
  const offer = (
    <OfferCard
      layout="horizontal"
      className="w-full"
      media={<div aria-hidden className="h-full w-full bg-gradient-to-br from-[#f2d997] to-[#088f96]" />}
      badge="Picked for your family"
      title="Summer weekend, same suite"
      subtitle={`${inventory.suites[session.trip.suite].name}, ${stay.summer.label}`}
      meta="2 nights, with a Saturday cabana"
      price={<span className="flex items-baseline gap-1"><Price current={money(inventory.suites['wolf-den'].nightly * 2)} size="sm" /><span className="type-text-xs-normal text-muted-foreground">suite, 2 nights</span></span>}
      ctaLabel="Hold this weekend"
      onCta={hold}
    />
  )

  const respond = (text: string): Reply => {
    const s = sessionRef.current
    if (s.offerAccepted) {
      return match<Reply>(text, [[/homepage|see|updated/i, { text: 'Opening your homepage.', effect: () => navigate('/discover'), delay: 300 }]], { text: 'Your summer weekend is held. Want to see it on your homepage?', chips: [{ label: 'See my updated homepage', onPick: () => navigate('/discover') }] })
    }
    if (/^\d out of 5$/.test(text)) {
      const n = Number(text[0])
      return { text: n >= 4 ? `Glad to hear it. What stood out most about ${kid}’s weekend?` : 'Sorry it fell short. What went wrong, in your words?', chips: [{ label: 'The party' }, { label: 'The water park' }, { label: 'Check-in' }] }
    }
    if (rating.current === undefined) {
      return { text: 'Thanks. First, how would you rate the stay?', ...scale }
    }
    // Any free text counts as the one written answer.
    return {
      text: 'Thank you. I passed this to the team, and I picked a weekend you might like.',
      effect: () => patch({ feedback: { rating: rating.current ?? 5, text: text.length > 140 ? `${text.slice(0, 137)}…` : text } }),
      widget: offer,
      widgetKey: 'offer',
    }
  }

  const chat = useChat(respond, {
    text: `Thanks for staying with us, ${family.guest}. How was ${kid}’s weekend?`,
    ...scale,
  })
  chatRef.current = chat

  return (
    <div className="flex min-h-0 w-full flex-1 flex-col items-center justify-center gap-6 lg:flex-row lg:items-stretch lg:gap-10">
      <div className="flex min-h-0 flex-col justify-center">
        <Email onOpen={() => setPhase('app')} />
      </div>
      <div className="flex min-h-[700px] w-full justify-center lg:min-h-0 lg:w-auto">
        <DeviceFrame kind="phone" statusBar={phase === 'app'}>
          {phase === 'lock' ? (
            <LockScreen
              date="Sunday, March 14"
              time="4:10"
              title={`How was ${kid}’s weekend?`}
              body="One minute to tell us how it went."
              actions={[{ label: 'Open', primary: true, onClick: () => setPhase('app') }, { label: 'Later', onClick: () => setPhase('app') }]}
            />
          ) : (
            <>
              <div className="flex h-12 shrink-0 items-center justify-between border-b px-4">
                <span className="type-text-sm-semibold">Great Wolf Lodge</span>
                <span className="type-text-xs-medium text-muted-foreground">After your stay</span>
              </div>
              <AgentChat chat={chat} name="Concierge" subtitle="A quick check-in" surface="mobile" placeholder="Type your answer" disclaimer="Scripted demo. Your answer goes to the sample staff view." />
            </>
          )}
        </DeviceFrame>
      </div>
    </div>
  )
}
