import type { ReactNode } from 'react'
import { ArrowLeftIcon, BatteryFullIcon, BinocularsIcon, ChevronDownIcon, HouseIcon, Icon, MenuIcon, MessagesSquareIcon, SignalIcon, UserRoundIcon, UtensilsIcon, WifiIcon, PawPrintIcon, type LucideIcon } from '@anvil/components/ui/icon'
import { cn } from '@anvil/lib/utils'
import { Logo, WileyAvatar } from '~/components/local/Brand/Brand'
import { eventById, rideById } from '~/data/lodgeApp'
import { useDemo } from '~/state/demo'
import type { AppTab } from '~/wiley/types'
import { Participants, Thread, WileySheet } from './Concierge'
import { DiningScreen, EventDetail, EventsScreen, HomeScreen, MoreScreen, ParkScreen, RemindersScreen, RideDetail, ThingsToDo } from './Screens'

// ANVIL-CANDIDATE (native app chrome): Journey 3 is the Great Wolf iOS app, drawn after the client's screenshots: a
// status bar, the logo header with the lodge, five tabs, pushed screens with a back arrow, and iOS notifications.
// Wiley lives in the Chat tab ("Concierge") and in an Ask Wiley sheet over any screen.

const TABS: { id: AppTab; label: string; icon: LucideIcon }[] = [
  { id: 'home', label: 'Home', icon: HouseIcon },
  { id: 'dining', label: 'Dining', icon: UtensilsIcon },
  { id: 'todo', label: 'Things To Do', icon: BinocularsIcon },
  { id: 'chat', label: 'Chat', icon: MessagesSquareIcon },
  { id: 'more', label: 'More', icon: MenuIcon },
]

function StatusBar() {
  const { s, framed } = useDemo()
  // On a real phone the phone draws its own.
  if (!framed) return null
  const time = s.app.clock.split(' ').slice(1, 2).join(' ')
  return (
    <div className="flex h-[54px] shrink-0 items-end justify-between bg-background px-8 pb-2 text-[15px] font-semibold text-foreground" aria-hidden>
      <span>{time}</span>
      <span className="flex items-center gap-1.5">
        <Icon className="size-4" icon={SignalIcon} />
        <Icon className="size-4" icon={WifiIcon} />
        <Icon className="size-5" icon={BatteryFullIcon} />
      </span>
    </div>
  )
}

function LodgeHeader() {
  return (
    <header className="relative flex h-[64px] shrink-0 flex-col items-center justify-center bg-background shadow-[0_2px_10px_rgb(7_39_69/0.08)]">
      <span className="absolute start-4 top-1/2 -translate-y-1/2 text-[var(--gwl-teal)]" aria-label="Account">
        <Icon className="size-5" icon={UserRoundIcon} />
      </span>
      <Logo className="h-[18px]" />
      <span className="mt-0.5 inline-flex items-center gap-1 type-text-sm-semibold text-[var(--gwl-teal)]">
        Colorado Springs, CO <Icon className="size-4" icon={ChevronDownIcon} />
      </span>
    </header>
  )
}

export function TitleHeader({ title, onBack, children }: { title: string; onBack?: () => void; children?: ReactNode }) {
  return (
    <header className="relative z-10 flex h-[52px] shrink-0 items-center justify-center bg-background shadow-[0_2px_10px_rgb(7_39_69/0.08)]">
      {onBack && (
        <button type="button" onClick={onBack} aria-label="Back" className="absolute start-3 grid size-10 place-items-center rounded-full text-[var(--gwl-teal)] outline-none focus-visible:focus-ring">
          <Icon className="size-5" icon={ArrowLeftIcon} />
        </button>
      )}
      <h1 className="gwl-display text-[19px] text-[var(--gwl-navy)]">{title}</h1>
      {children}
    </header>
  )
}

function TabBar() {
  const { s, run } = useDemo()
  return (
    <nav aria-label="App" className="grid shrink-0 grid-cols-5 border-t bg-background pb-6">
      {TABS.map((t) => {
        const on = s.app.tab === t.id
        return (
          <button
            key={t.id}
            type="button"
            aria-current={on ? 'page' : undefined}
            onClick={() => run([{ do: 'app', set: { tab: t.id, screen: null, sheet: false } }])}
            className={cn('relative flex flex-col items-center gap-1 pt-2.5 pb-1 text-[11px] outline-none focus-visible:focus-ring', on ? 'font-bold text-[var(--gwl-navy)]' : 'text-muted-foreground')}
          >
            {on && <span aria-hidden className="absolute inset-x-3 top-0 h-[3px] rounded-b bg-[var(--gwl-teal)]" />}
            <span className="relative">
              <Icon icon={t.icon} className={cn('size-6', on && 'text-[var(--gwl-teal)]')} strokeWidth={1.5} />
              {/* Wiley is always on in Chat: a small AI dot. */}
              {t.id === 'chat' && <span aria-hidden className="absolute -end-1.5 -top-1 size-2.5 rounded-full bg-[var(--gwl-yellow)] ring-2 ring-background" />}
            </span>
            {t.label}
          </button>
        )
      })}
    </nav>
  )
}

/** An iOS notification sliding in from the top. Tapping it opens the app where it points. */
function Banner() {
  const { s, tapBanner } = useDemo()
  const b = s.app.banner
  if (!b) return null
  return (
    <button
      type="button"
      onClick={tapBanner}
      className="gwl-drop absolute inset-x-2.5 top-[50px] z-40 flex items-start gap-3 rounded-[22px] bg-[rgb(245_245_247/0.92)] p-3 text-start text-[#111] shadow-[0_10px_30px_rgb(0_0_0/0.25)] outline-none backdrop-blur-xl focus-visible:focus-ring dark:bg-[rgb(40_44_52/0.92)] dark:text-[#fff]"
    >
      <span className="grid size-9 shrink-0 place-items-center rounded-[9px] bg-[#1c3750] text-[#fff]">
        <Icon className="size-5" icon={PawPrintIcon} />
      </span>
      <span className="min-w-0 flex-1">
        <span className="flex items-baseline justify-between gap-2">
          <span className="text-[13px] font-semibold">{b.title}</span>
          <span className="text-[12px] opacity-60">now</span>
        </span>
        <span className="block text-[13px] leading-snug">{b.body}</span>
      </span>
    </button>
  )
}

/** Ask Wiley from any screen except Chat. */
function AskButton() {
  const { s, run } = useDemo()
  if (s.app.tab === 'chat' || s.app.sheet) return null
  return (
    <button
      type="button"
      onClick={() => run([{ do: 'app', set: { sheet: true } }])}
      className="gwl-up absolute end-4 bottom-[96px] z-20 inline-flex h-12 items-center gap-2 rounded-full bg-[var(--gwl-navy)] ps-1.5 pe-4 type-text-sm-semibold text-[var(--gwl-navy-foreground)] shadow-[0_8px_24px_rgb(7_39_69/0.3)] outline-none focus-visible:focus-ring"
    >
      <WileyAvatar size={36} online />
      Ask Wiley
    </button>
  )
}

function Screen() {
  const { s, run } = useDemo()
  const back = () => run([{ do: 'app', set: (a) => ({ screen: a.screen?.startsWith('ride:') ? 'park' : a.screen?.startsWith('event:') ? 'events' : null }) }])
  const sc = s.app.screen
  if (sc?.startsWith('ride:')) return <RideDetail ride={rideById(sc.slice(5))} onBack={back} />
  if (sc?.startsWith('event:')) return <EventDetail ev={eventById(sc.slice(6))} onBack={back} />
  if (sc === 'park') return <ParkScreen onBack={back} />
  if (sc === 'events') return <EventsScreen onBack={back} />
  if (sc === 'reminders') return <RemindersScreen onBack={back} />
  switch (s.app.tab) {
    case 'home':
      return (
        <>
          <LodgeHeader />
          <HomeScreen />
        </>
      )
    case 'dining':
      return <DiningScreen />
    case 'todo':
      return <ThingsToDo />
    case 'more':
      return <MoreScreen />
    case 'chat':
      return (
        <>
          <TitleHeader title="Concierge" />
          <Participants />
          <Thread />
        </>
      )
  }
}

export function GwlApp() {
  return (
    <div className="relative flex h-full flex-col">
      <StatusBar />
      <div className="relative flex min-h-0 flex-1 flex-col">
        <Screen />
      </div>
      <TabBar />
      <AskButton />
      <WileySheet />
      <Banner />
    </div>
  )
}
