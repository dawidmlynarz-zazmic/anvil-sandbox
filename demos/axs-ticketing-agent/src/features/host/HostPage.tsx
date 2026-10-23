import { useNavigate, useMatch } from 'react-router-dom'
import { Card } from '@anvil/components/ui/card'
import { Icon, SearchIcon } from '@anvil/components/ui/icon'
import { InputGroup, InputGroupAddon, InputGroupInput } from '@anvil/components/ui/input-group'
import { AxsLogo } from '~/components/AxsLogo'
import { AskLauncher } from '~/components/local/AskLauncher/AskLauncher'
import { showDateLine } from '~/lib/format'
import { SHOWS } from '~/mocks/shows'
import { useSession } from '~/state/session'
import { AskChat } from '../ask/AskChat'

/**
 * A minimal stand-in for the AXS mobile site, so the agent has a page to sit in. It is a backdrop: its search box and
 * show tiles open Ask AXS, and nothing else on it does anything.
 */
export function HostPage() {
  const navigate = useNavigate()
  const open = !!useMatch('/ask')
  const { send } = useSession()
  const ask = () => navigate('/ask')

  return (
    <>
      <header className="flex shrink-0 flex-col gap-3 border-b border-border bg-card px-4 pt-4 pb-4 text-card-foreground">
        <AxsLogo className="h-7" />
        <form
          role="search"
          onSubmit={(e) => {
            e.preventDefault()
            const q = new FormData(e.currentTarget).get('q')?.toString().trim()
            ask()
            if (q) void send({ type: 'text', text: q })
          }}
        >
          <InputGroup className="rounded-full">
            <InputGroupAddon>
              <Icon icon={SearchIcon} />
            </InputGroupAddon>
            <InputGroupInput name="q" aria-label="Search events, performers or venues" placeholder="Events, performers or venues" />
          </InputGroup>
        </form>
      </header>
      <main className="flex min-h-0 flex-1 flex-col gap-4 overflow-y-auto px-4 pt-5 pb-24">
        <h1 className="type-heading-2xl text-foreground">Discover events</h1>
        <p className="-mt-2 type-text-sm-normal text-muted-foreground">London · sample listings</p>
        <ul className="flex flex-col gap-4">
          {SHOWS.map((s) => (
            <li key={s.id}>
              <Card asChild className="gap-0 overflow-hidden rounded-xl py-0 text-start">
                <button
                  type="button"
                  onClick={() => {
                    ask()
                    void send({ type: 'view-dates', showId: s.id })
                  }}
                >
                  <img src={s.cover} alt={s.coverAlt} className="aspect-video w-full object-cover" />
                  <span className="flex flex-col gap-0.5 p-4">
                    <span className="type-text-xs-medium text-muted-foreground">{showDateLine(s.dates[0].date, s.dates[0].time)}</span>
                    <span className="type-text-base-semibold text-foreground">{s.subtitle ? `${s.title}: ${s.subtitle}` : s.title}</span>
                    <span className="type-text-sm-normal text-muted-foreground">
                      {s.venue}, {s.city}
                    </span>
                  </span>
                </button>
              </Card>
            </li>
          ))}
        </ul>
      </main>
      <AskLauncher open={open} onOpenChange={(o) => navigate(o ? '/ask' : '/')}>
        <AskChat onClose={() => navigate('/')} />
      </AskLauncher>
    </>
  )
}
