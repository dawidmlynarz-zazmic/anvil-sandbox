import { Button } from '@anvil/components/ui/button'
import { ChevronDownIcon, Icon, MenuIcon, SparklesIcon } from '@anvil/components/ui/icon'
import { cn } from '@anvil/lib/utils'
import { lodge } from '~/data/fixtures'
import { useDemo } from '~/state/demo'
import { Logo } from '../Brand/Brand'

// ANVIL-CANDIDATE (the pill): an entry point to the assistant that lives in a site's own nav, with an active state
// while the assistant is open and a count of things it saved. Anvil's Launcher is a floating button only.

export function AskWileyPill({ className }: { className?: string }) {
  const { s, toggleWiley } = useDemo()
  return (
    <button
      type="button"
      onClick={toggleWiley}
      aria-pressed={s.open}
      className={cn(
        'relative inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full border-2 px-4 type-text-sm-semibold transition-colors outline-none focus-visible:focus-ring',
        s.open ? 'border-primary bg-primary text-primary-foreground' : 'border-foreground bg-background text-foreground hover:bg-accent',
        className,
      )}
    >
      <Icon icon={SparklesIcon} />
      Ask Wiley
      {s.planCount > 0 && (
        <span className="gwl-in absolute -top-2 -right-2 grid size-5 place-items-center rounded-full bg-[#b5232f] text-[11px] font-bold text-[#ffffff] ring-2 ring-background" aria-label={`${s.planCount} saved to your plan`}>
          {s.planCount}
        </span>
      )}
    </button>
  )
}

/** Utility links, as on greatwolf.com: the account links change with sign-in. */
function Utility() {
  const { s } = useDemo()
  const links = ['Groups & Meetings', 'Reservations', ...(s.signedIn ? ['My account'] : ['Log In', 'Sign Up'])]
  return (
    <nav aria-label="Utility" className="flex items-center gap-5">
      {links.map((l) => (
        <button key={l} type="button" className="rounded-sm text-muted-foreground underline-offset-4 outline-none hover:text-foreground hover:underline focus-visible:focus-ring">
          {l}
        </button>
      ))}
    </nav>
  )
}

export function AppHeader() {
  const { desktop, roomyNav } = useDemo()
  if (desktop) {
    return (
      <header className="gwl-noprint shrink-0 border-b bg-background">
        <div className="flex h-9 items-center justify-between gap-4 bg-[var(--gwl-sky)] px-6 type-text-xs-medium">
          <span className="type-text-xs-semibold">
            {lodge.name} · {lodge.city}
          </span>
          <Utility />
        </div>
        <div className="flex h-16 items-center gap-6 px-6">
          <Logo className="h-[26px]" />
          {!roomyNav && <span className="flex-1" />}
          <nav aria-label="Main" className={cn('flex flex-1 items-center justify-end gap-6 type-text-sm-semibold', !roomyNav && 'hidden')}>
            {['Explore', 'Stay', 'Day Visits', 'Deals', 'Celebrate'].map((n) => (
              <button key={n} type="button" aria-haspopup="menu" className="inline-flex items-center gap-0.5 rounded-sm py-1 decoration-2 underline-offset-8 outline-none hover:underline focus-visible:focus-ring">
                {n}
                <Icon icon={ChevronDownIcon} size="xs" />
              </button>
            ))}
          </nav>
          <AskWileyPill />
          {/* Same height as the Ask Wiley pill beside it. */}
          <Button shape="pill" className="h-10 px-5">
            Book Now
          </Button>
          {!roomyNav && (
            <Button variant="ghost" intent="neutral" size="icon" aria-label="Menu">
              <Icon icon={MenuIcon} />
            </Button>
          )}
        </div>
      </header>
    )
  }
  return (
    <header className="gwl-noprint shrink-0 border-b bg-background">
      <div className="flex h-14 items-center gap-3 px-4">
        <Logo className="h-[18px]" />
        <span className="flex-1" />
        <AskWileyPill />
        <Button variant="ghost" intent="neutral" size="icon" aria-label="Menu">
          <Icon icon={MenuIcon} />
        </Button>
      </div>
    </header>
  )
}
