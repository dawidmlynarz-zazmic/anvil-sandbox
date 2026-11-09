import { Link } from 'react-router-dom'
import { Button } from '@anvil/components/ui/button'
import { Card } from '@anvil/components/ui/card'
import { ArrowRightIcon, Icon } from '@anvil/components/ui/icon'
import { Logo, WileyAvatar } from '~/components/local/Brand/Brand'

const resume = () => {
  try {
    const v = localStorage.getItem('gwl-v2:resume')
    return v && /^\/j[12]\/[1-6]$/.test(v) ? v : null
  } catch {
    return null
  }
}

const JOURNEYS = [
  {
    to: '/j1/1',
    title: 'Journey 1 · Returning family',
    body: 'The Martinez family, signed in, books Mia’s 7th birthday weekend by voice: member rates, a party, a weekend plan and native checkout.',
  },
  {
    to: '/j2/1',
    title: 'Journey 2 · First-time visitor',
    body: 'A signed-out family with kids aged 3 and 6 describes their trip. Wiley re-ranks suites, tours the water park, finds things nearby and saves the plan.',
  },
]

/** The presenter's start screen. */
export function Picker() {
  const last = resume()
  return (
    <main className="min-h-dvh bg-[var(--gwl-page)] px-4 py-10 text-foreground">
      <div className="mx-auto flex max-w-3xl flex-col gap-6">
        <div className="flex items-center gap-3">
          <Logo />
          <span className="type-text-sm-medium text-muted-foreground">Colorado Springs, CO · Journeys v2 prototype</span>
        </div>
        <div className="flex items-start gap-3">
          <WileyAvatar size={40} online />
          <div>
            <h1 className="gwl-display text-3xl leading-tight">Wiley, built into greatwolf.com</h1>
            <p className="mt-2 type-text-md-normal text-muted-foreground">
              Two journeys through the current site, with the AI Planner upgraded to Anvil. Scripted and mocked: no live model, booking or payment.
            </p>
          </div>
        </div>
        <div className="grid gap-4 sm:grid-cols-2">
          {JOURNEYS.map((j) => (
            <Card key={j.to} className="gap-3 rounded-3xl p-5">
              <h2 className="gwl-display text-lg">{j.title}</h2>
              <p className="flex-1 type-text-sm-normal text-muted-foreground">{j.body}</p>
              <Button asChild shape="pill" variant="outline" intent="neutral" className="w-fit">
                <Link to={j.to}>
                  Start <Icon icon={ArrowRightIcon} />
                </Link>
              </Button>
            </Card>
          ))}
        </div>
        {last && (
          <Button asChild shape="pill" className="w-fit">
            <Link to={last}>
              Resume where you were <Icon icon={ArrowRightIcon} />
            </Link>
          </Button>
        )}
        <p className="type-text-xs-normal text-muted-foreground">
          Presenter keys: → / ← step · R reset · D device · 1 / 2 journey · H hides the demo bar. Fictional family; prices marked “sample” are placeholders.
        </p>
      </div>
    </main>
  )
}
