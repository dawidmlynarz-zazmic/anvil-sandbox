import { useRef, useState } from 'react'
import { Timeline, TimelineItem } from '@anvil/components/anvil/timeline'
import { Badge } from '@anvil/components/ui/badge'
import { Card, CardContent, CardHeader, CardTitle } from '@anvil/components/ui/card'
import { Icon, SunIcon } from '@anvil/components/ui/icon'
import { Label } from '@anvil/components/ui/label'
import { Switch } from '@anvil/components/ui/switch'
import { useNavigate } from 'react-router-dom'
import { AgentChat } from '~/components/local/AgentChat/AgentChat'
import { DeviceFrame } from '~/components/local/DeviceFrame/DeviceFrame'
import { HandoffCard } from '~/components/local/HandoffCard/HandoffCard'
import { LockScreen } from '~/components/local/LockScreen/LockScreen'
import { family } from '~/data/family'
import { match, useChat, type Reply } from '~/lib/chat'
import { useStore } from '~/state/store'

interface Item {
  time: string
  title: string
  detail?: string
  tag?: string
  booked?: boolean
}

function itemsFor(sensory: boolean, partyMoved: boolean, dining: boolean): Item[] {
  const party = partyMoved ? '12:00 pm' : '11:30 am'
  return sensory
    ? [
        { time: '7:00 am', title: 'Quiet swim before the doors open', detail: 'Low noise, dimmed lights', tag: 'Low noise' },
        { time: '9:00 am', title: 'Breakfast in your suite', detail: dining ? 'Dining plan' : 'Room service menu', booked: dining },
        { time: party, title: `${family.kids[0].name}’s birthday party`, detail: 'The small party room, lights down', tag: `Age ${family.kids[0].age}`, booked: true },
        { time: '1:00 pm', title: 'Cabana 12', detail: 'Shaded, away from the slides', booked: true },
        { time: '3:00 pm', title: 'Break in the suite', detail: 'Nothing scheduled' },
        { time: '4:00 pm', title: 'Arcade, quiet corner', detail: 'Fewer sounds, lower lights', tag: 'Ages 4–8' },
      ]
    : [
        { time: '8:00 am', title: 'Breakfast at the lodge café', detail: dining ? 'Dining plan' : 'Walk in, no wait before 9', booked: dining },
        { time: '9:00 am', title: 'Water park opens', detail: 'Quiet hour until 11. Short lines at the big slide.', tag: 'All ages' },
        { time: party, title: `${family.kids[0].name}’s birthday party`, detail: 'Party room, 90 minutes', tag: `Age ${family.kids[0].age}`, booked: true },
        { time: '1:00 pm', title: 'Cabana 12', detail: 'Until 3 pm', booked: true },
        { time: '3:30 pm', title: 'Arcade open play', detail: 'Busiest at 4. Go now for shorter waits.', tag: 'Ages 4–8' },
        { time: '5:30 pm', title: 'Evening story time', detail: 'In the lobby', tag: 'Ages 3–8' },
      ]
}

function DayPlan() {
  const { session, patch } = useStore()
  const items = itemsFor(session.sensory, session.partyMoved, session.trip.dining)
  return (
    <Card size="sm" className="w-full" data-slot="day-plan">
      <CardHeader>
        <CardTitle className="flex items-center justify-between gap-2">
          <span>Your Saturday</span>
          <span className="flex items-center gap-2">
            <Label htmlFor="sensory" className="type-text-xs-medium">Sensory-friendly</Label>
            <Switch id="sensory" size="sm" checked={session.sensory} onCheckedChange={(v) => patch({ sensory: v })} />
          </span>
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Timeline>
          {items.map((it, i) => (
            <TimelineItem
              key={it.title}
              time={it.time}
              title={it.title}
              detail={it.detail}
              tone={it.booked ? 'success' : 'neutral'}
              last={i === items.length - 1}
              trailing={
                <span className="flex gap-1">
                  {it.booked && <Badge variant="subtle" tone="success" size="xs">Booked</Badge>}
                  {it.tag && <Badge variant="subtle" tone="neutral" size="xs">{it.tag}</Badge>}
                </span>
              }
            />
          ))}
        </Timeline>
      </CardContent>
    </Card>
  )
}

/** A static schematic: the guest's suite, the towels and the walk between them. */
function MapCard() {
  return (
    <Card size="sm" className="w-full overflow-hidden pt-0" data-slot="map-card">
      <svg viewBox="0 0 320 140" role="img" aria-label="Map: from Suite 412 to the towels at the water park entrance, a 3 minute walk" className="h-auto w-full bg-muted">
        <rect x="14" y="16" width="86" height="52" rx="8" className="fill-background stroke-border-strong" />
        <text x="57" y="46" textAnchor="middle" className="fill-foreground" fontSize="11">Suite 412</text>
        <rect x="210" y="70" width="96" height="54" rx="8" className="fill-background stroke-border-strong" />
        <text x="258" y="94" textAnchor="middle" className="fill-foreground" fontSize="11">Water park</text>
        <text x="258" y="108" textAnchor="middle" className="fill-muted-foreground" fontSize="10">entrance</text>
        <path d="M57 68 V100 H160 V97 H210" fill="none" className="stroke-primary" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" strokeDasharray="1 7" />
        <circle cx="210" cy="97" r="7" className="fill-primary" />
        <text x="216" y="60" className="fill-primary" fontSize="10" fontWeight="600">Towels</text>
      </svg>
      <CardContent className="type-text-sm-normal pt-2">
        <strong>Towels are at the water park entrance</strong>, left of the lockers.
        <p className="type-text-xs-normal mt-1 text-muted-foreground">3 minute walk from Suite 412. Elevator B, then follow the blue floor signs.</p>
      </CardContent>
    </Card>
  )
}

export function ConciergeScreen() {
  const { session, patch } = useStore()
  const navigate = useNavigate()
  const [phase, setPhase] = useState<'lock' | 'app'>('lock')
  const sessionRef = useRef(session)
  sessionRef.current = session
  const plan = { widget: <DayPlan />, widgetKey: 'plan' }
  const kid = family.kids[0].name

  const respond = (text: string): Reply => {
    const s = sessionRef.current
    return match<Reply>(
      text,
      [
        [/charge|twice|double|bill|folio/i, { text: 'Let me show you the bill and explain it.', effect: () => navigate('/stay/charges'), delay: 400 }],
        [/towel|where|bathroom|locker|find/i, {
          tools: ['Looked up the nearest towel station'],
          text: 'The nearest towels are at the water park entrance.',
          widget: <MapCard />,
          chips: [{ label: 'Change my plan' }, { label: 'Talk to a person' }],
        }],
        [/direction|suite|key|room ready/i, {
          text: 'Suite 412 is on floor 4. Take elevator B from the lobby, turn left, and it’s the fourth door. Your digital key is on this phone.',
          chips: [{ label: 'Show my Saturday' }, { label: 'Where are the towels?' }],
        }],
        [/sensory|quiet|calm|loud|noise/i, {
          text: s.sensory ? 'The sensory-friendly plan is already on. Turn it off any time with the switch.' : 'I switched your Saturday to the sensory-friendly plan: quieter times, dimmer rooms, and a break in the suite.',
          effect: () => patch({ sensory: true }),
          ...plan,
          chips: [{ label: 'Change my plan' }, { label: 'Talk to a person' }],
        }],
        [/move|12|noon|later|earlier/i, {
          text: `Moved ${kid}’s party to 12:00 on your plan.`,
          effect: () => patch({ partyMoved: true }),
          ...plan,
          chips: [{ label: 'Where are the towels?' }, { label: 'Talk to a person' }],
        }],
        [/change|swap|skip|plan/i, {
          text: 'What would you like to change?',
          chips: [{ label: `Move ${kid}’s party to 12:00`, say: 'Move the party to 12:00' }, { label: 'Make it sensory-friendly' }, { label: 'Show my Saturday' }],
        }],
        [/saturday|schedule|today|day/i, { text: 'Here’s your Saturday.', ...plan, chips: [{ label: 'Change my plan' }, { label: 'Where are the towels?' }] }],
        [/person|human|staff|help|agent/i, {
          text: 'I’ve asked the front desk to join. They already have what we talked about.',
          widget: (
            <HandoffCard
              to="The front desk"
              eta="About 2 minutes"
              context={[
                { label: 'Guest', value: `${family.guest} ${family.name}, Suite ${family.suite}` },
                { label: 'Stay', value: 'Fri, Mar 12 to Sun, Mar 14' },
                { label: 'Plan', value: s.sensory ? 'Sensory-friendly Saturday' : 'Standard Saturday' },
                { label: 'Last question', value: 'Towels, and changing the plan' },
              ]}
            />
          ),
          chips: [{ label: 'Why was the cabana charged twice?' }],
        }],
      ],
      {
        text: 'I can show your Saturday, find something in the resort, change your plan, or bring in a person. What would you like?',
        chips: [{ label: 'Show my Saturday' }, { label: 'Where are the towels?' }, { label: 'Talk to a person' }],
      },
    )
  }

  const chat = useChat(respond, {
    text: `Welcome, ${family.guest}. Suite ${family.suite} is ready, and your digital key is on this phone. Here’s Saturday for ${family.name} family.`,
    ...plan,
    chips: [{ label: 'Where are the towels?' }, { label: 'Make it sensory-friendly' }, { label: 'Change my plan' }, { label: 'Talk to a person' }],
  })

  return (
    <DeviceFrame kind="phone" statusBar={phase === 'app'}>
      {phase === 'lock' ? (
        <LockScreen
          title="Your suite is ready"
          body={`Suite ${family.suite} is ready for the ${family.name} family. Your digital key is in the app.`}
          actions={[
            { label: 'Directions', primary: true, onClick: () => { setPhase('app'); chat.say('Directions to my suite') } },
            { label: 'Later', onClick: () => setPhase('app') },
          ]}
        />
      ) : (
        <>
          <div className="flex h-12 shrink-0 items-center justify-between border-b px-4">
            <span className="type-text-sm-semibold">Great Wolf Lodge</span>
            <span className="type-text-xs-medium flex items-center gap-1 text-muted-foreground"><Icon icon={SunIcon} />Fri, Mar 12</span>
          </div>
          <AgentChat chat={chat} name="Concierge" subtitle="Here for your stay" surface="mobile" placeholder="Ask about your stay" disclaimer="Scripted demo. Nothing is booked or changed for real." />
        </>
      )}
    </DeviceFrame>
  )
}
