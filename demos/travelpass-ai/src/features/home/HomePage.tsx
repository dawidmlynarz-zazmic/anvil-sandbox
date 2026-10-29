import { useState } from 'react'
import { QuickReply, QuickReplyGroup } from '@anvil/components/agent/quick-reply'
import { Button } from '@anvil/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@anvil/components/ui/card'
import { Icon, MessageSquareIcon, SearchIcon, ShieldCheckIcon, WalletIcon } from '@anvil/components/ui/icon'
import { Input } from '@anvil/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@anvil/components/ui/select'
import { HeroBackdrop } from '~/components/local/HeroBackdrop/HeroBackdrop'
import { DEMO_TODAY, MONTHS, addDays, toDate } from '~/lib/format'
import { photo } from '~/lib/scenic'
import { DESTINATIONS, destinationById, type DestinationId } from '~/mocks/hotels'
import { STARTERS } from '~/services/agent'
import { useStore } from '~/state/store'

const HERO = photo('coast', 5, 24)

/** "May 12" for the agent's date parser. */
const spoken = (iso: string) => {
  const d = toDate(iso)
  return `${MONTHS[d.getUTCMonth()][0].toUpperCase()}${MONTHS[d.getUTCMonth()].slice(1)} ${d.getUTCDate()}`
}

const FEATURES = [
  { icon: MessageSquareIcon, title: 'Say it your way', text: 'Type or talk about the trip. The page follows what you say.' },
  { icon: WalletIcon, title: 'Checked against your budget', text: 'Every stay says whether it fits, before you open it.' },
  { icon: ShieldCheckIcon, title: 'See before you book', text: 'Photos, a map and room details for each stay. Nothing is charged in this demo.' },
]

export function HomePage() {
  const { send, busy } = useStore()
  const [where, setWhere] = useState<string>('')
  const [checkIn, setCheckIn] = useState('')
  const [checkOut, setCheckOut] = useState('')
  const [adults, setAdults] = useState('2')
  const datesOk = !checkIn || !checkOut || checkOut > checkIn

  // The form says the same thing you could type: it goes to the assistant, which updates the page.
  const search = (e: React.FormEvent) => {
    e.preventDefault()
    if (!datesOk) return
    const place = where ? `in ${destinationById(where as DestinationId).name}` : ''
    const dates = checkIn && checkOut ? `from ${spoken(checkIn)} to ${spoken(checkOut)}` : ''
    void send(['Hotels', place, dates, adults ? `for ${adults}` : ''].filter(Boolean).join(' '))
  }

  return (
    <div className="flex flex-col gap-8">
      <HeroBackdrop image={HERO} align="start" className="min-h-96 flex-none">
        <h1 className="type-heading-3xl max-w-2xl text-balance" style={{ color: '#fff' }}>
          Tell me what you wish for your trip<span className="text-primary">.</span>
        </h1>
        <p className="type-text-lg-normal max-w-xl" style={{ color: 'rgb(255 255 255 / 0.9)' }}>
          Chat on the left, or search here. Hotels, photos and bookings show up on this page as we talk.
        </p>
        <form onSubmit={search} className="grid w-full gap-2 rounded-xl bg-background p-2 text-foreground shadow-elevation-modal md:grid-cols-[1.2fr_1fr_1fr_6rem_auto]" aria-label="Search stays">
          <Select value={where} onValueChange={setWhere}>
            <SelectTrigger aria-label="Where to" id="home-where">
              <SelectValue placeholder="Where to?" />
            </SelectTrigger>
            <SelectContent>
              {DESTINATIONS.map((d) => <SelectItem key={d.id} value={d.id}>{d.name}</SelectItem>)}
            </SelectContent>
          </Select>
          <Input id="home-in" type="date" aria-label="Check-in" min={DEMO_TODAY} value={checkIn} onChange={(e) => setCheckIn(e.target.value)} />
          <Input
            id="home-out"
            type="date"
            aria-label="Check-out"
            min={checkIn ? addDays(checkIn, 1) : DEMO_TODAY}
            value={checkOut}
            aria-invalid={!datesOk || undefined}
            onChange={(e) => setCheckOut(e.target.value)}
          />
          <Input id="home-adults" type="number" inputMode="numeric" min={1} max={6} aria-label="Adults" value={adults} onChange={(e) => setAdults(e.target.value)} />
          <Button type="submit" disabled={busy || !datesOk}>
            <Icon icon={SearchIcon} />
            Search
          </Button>
        </form>
      </HeroBackdrop>

      <QuickReplyGroup label="Or try asking">
        {STARTERS.map((s) => (
          <QuickReply key={s.title} disabled={busy} onClick={() => void send(s.say)}>{s.title}</QuickReply>
        ))}
      </QuickReplyGroup>

      <ul className="grid gap-4 md:grid-cols-3">
        {FEATURES.map((f) => (
          <li key={f.title}>
            <Card className="h-full">
              <CardHeader>
                <Icon icon={f.icon} className="text-primary" />
                <CardTitle>{f.title}</CardTitle>
              </CardHeader>
              <CardContent><CardDescription>{f.text}</CardDescription></CardContent>
            </Card>
          </li>
        ))}
      </ul>
    </div>
  )
}
