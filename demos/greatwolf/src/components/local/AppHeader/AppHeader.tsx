import { Badge } from '@anvil/components/ui/badge'
import { Button } from '@anvil/components/ui/button'
import { Icon, MenuIcon, SparklesIcon, UserIcon } from '@anvil/components/ui/icon'
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
        'relative inline-flex h-9 shrink-0 items-center gap-1.5 rounded-full border-2 px-3 type-text-sm-semibold transition-colors outline-none focus-visible:focus-ring',
        s.open ? 'border-primary bg-primary text-primary-foreground' : 'border-foreground bg-background text-foreground hover:bg-accent',
        className,
      )}
    >
      <Icon icon={SparklesIcon} />
      Ask Wiley
      <Badge tone="agent" size="xs" className={cn(s.open && 'bg-primary-foreground text-primary')}>
        AI
      </Badge>
      {s.planCount > 0 && (
        <span className="gwl-in absolute -top-2 -right-2 grid size-5 place-items-center rounded-full bg-[#b5232f] text-[11px] font-bold text-[#ffffff] ring-2 ring-background" aria-label={`${s.planCount} saved to your plan`}>
          {s.planCount}
        </span>
      )}
    </button>
  )
}

function Account() {
  const { s } = useDemo()
  return s.signedIn ? (
    <span className="inline-flex items-center gap-1 type-text-sm-semibold">
      <Icon icon={UserIcon} size="xs" />
      My account
    </span>
  ) : (
    <span className="type-text-sm-semibold">
      <span className="underline underline-offset-2">Log In</span> / <span className="underline underline-offset-2">Sign Up</span>
    </span>
  )
}

/** Mobile lodge bar: the account as an icon, so the bar stays on one line at 390px. */
function AccountIcon() {
  const { s } = useDemo()
  return (
    <span className="inline-flex shrink-0 items-center gap-1 type-text-xs-semibold whitespace-nowrap">
      <Icon icon={UserIcon} size="xs" />
      {s.signedIn ? 'Account' : 'Log In'}
    </span>
  )
}

export function AppHeader() {
  const { desktop } = useDemo()
  if (desktop) {
    return (
      <header className="shrink-0 border-b bg-background">
        <div className="flex h-9 items-center justify-between gap-4 bg-[var(--gwl-sky)] px-6 type-text-xs-medium">
          <span>
            {lodge.name} · {lodge.city} · {lodge.phone}
          </span>
          <Account />
        </div>
        <div className="flex h-16 items-center gap-6 px-6">
          <Logo />
          <nav aria-label="Main" className="flex flex-1 items-center gap-5 type-text-sm-semibold">
            {['Explore', 'Stay', 'Day Visits', 'Deals', 'Celebrate'].map((n) => (
              <span key={n} className="cursor-default">
                {n}
              </span>
            ))}
          </nav>
          <AskWileyPill />
          <Button shape="pill" size="lg">
            Book Now
          </Button>
        </div>
      </header>
    )
  }
  return (
    <header className="shrink-0 border-b bg-background">
      <div className="flex h-14 items-center gap-3 px-4">
        <Logo />
        <span className="flex-1" />
        <AskWileyPill />
        <Button variant="ghost" intent="neutral" size="icon" aria-label="Menu">
          <Icon icon={MenuIcon} />
        </Button>
      </div>
      <div className="flex h-11 items-center gap-3 bg-[var(--gwl-sky)] px-4">
        <span className="min-w-0 flex-1 truncate type-text-sm-semibold">{lodge.city}</span>
        <AccountIcon />
        <Button shape="pill" size="sm">
          Book Now
        </Button>
      </div>
    </header>
  )
}
