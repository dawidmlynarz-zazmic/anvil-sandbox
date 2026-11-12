import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Button } from '@anvil/components/ui/button'
import { ChevronLeftIcon, ChevronRightIcon, Icon, MoonIcon, RotateCcwIcon, SunIcon } from '@anvil/components/ui/icon'
import { ToggleGroup, ToggleGroupItem } from '@anvil/components/ui/toggle-group'
import { cn } from '@anvil/lib/utils'
import { AppHeader } from '~/components/local/AppHeader/AppHeader'
import { EndCard, Launcher, NativeSheets, Toast } from '~/components/local/Overlays/Overlays'
import { WileyPanel } from '~/components/local/WileyPanel/WileyPanel'
import { DemoProvider, useDemo } from '~/state/demo'
import { PageWidthProvider } from '~/state/layout'
import { StayBar } from '~/components/local/StayBar/StayBar'
import type { DeviceMode, Journey } from '~/wiley/types'
import { useTheme } from './useTheme'

const TITLES: Record<string, string> = {
  '1.1': 'Personalized lodge home',
  '1.2': 'Voice; the booking page reacts',
  '1.3': 'Member rates, then one add-on',
  '1.4': 'Plan the weekend',
  '1.5': 'Checkout handoff, native payment',
  '1.6': 'Booked, the plan moves to the app',
  '2.1': 'Landing: describe your trip',
  '2.2': 'Two questions, suites re-rank',
  '2.3': 'Guided tour of the water park',
  '2.4': 'Things to do around the lodge',
  '2.5': 'Rates: book as guest or join free',
  '2.6': 'Not ready? Save the plan',
  '3.1': 'Two days before: Wiley checks you in',
  '3.2': 'Arrival: suite ready, today planned',
  '3.3': 'Picks that fit each kid',
  '3.4': 'Handover to a person',
  '3.5': 'Check-out morning',
  '3.6': 'After the stay',
}

/** Presenter controls, outside the product. Hide with H. */
function DemoBar() {
  const { journey, step, startJourney, goStep, back, next, reset, deviceMode, setDeviceMode, playing } = useDemo()
  const { dark, toggle } = useTheme()
  return (
    <div className="gwl-noprint dark flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5 border-b bg-background px-3 py-1.5 text-foreground">
      <ToggleGroup type="single" variant="outline" size="sm" value={String(journey)} onValueChange={(v) => v && startJourney(Number(v) as Journey)} aria-label="Journey">
        <ToggleGroupItem value="1">Journey 1</ToggleGroupItem>
        <ToggleGroupItem value="2">Journey 2</ToggleGroupItem>
        <ToggleGroupItem value="3">Journey 3</ToggleGroupItem>
      </ToggleGroup>
      <div className="flex items-center gap-1" role="group" aria-label="Steps">
        {[1, 2, 3, 4, 5, 6].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => goStep(n)}
            aria-current={n === step ? 'step' : undefined}
            aria-label={`Step ${n}: ${TITLES[`${journey}.${n}`]}`}
            className={cn('grid size-6 place-items-center rounded-full type-text-xs-semibold outline-none focus-visible:focus-ring', n === step ? 'bg-primary text-primary-foreground' : 'text-muted-foreground hover:bg-accent')}
          >
            {n}
          </button>
        ))}
      </div>
      <span className="flex-1" />
      <div className="flex items-center gap-1">
        <Button size="sm" variant="ghost" intent="neutral" onClick={back} disabled={step === 1} aria-label="Back">
          <Icon icon={ChevronLeftIcon} />
        </Button>
        <Button size="sm" onClick={next}>
          {playing ? 'Skip ahead' : 'Next'} <Icon icon={ChevronRightIcon} />
        </Button>
        <Button size="sm" variant="ghost" intent="neutral" onClick={reset} aria-label="Reset this journey">
          <Icon icon={RotateCcwIcon} />
        </Button>
      </div>
      {journey !== 3 && (
      <ToggleGroup type="single" variant="outline" size="sm" value={deviceMode} onValueChange={(v) => v && setDeviceMode(v as DeviceMode)} aria-label="Device">
        <ToggleGroupItem value="auto">Auto</ToggleGroupItem>
        <ToggleGroupItem value="mobile">Mobile 390</ToggleGroupItem>
        <ToggleGroupItem value="desktop">Desktop</ToggleGroupItem>
      </ToggleGroup>
      )}
      <Button size="icon-sm" variant="ghost" intent="neutral" onClick={toggle} aria-label={dark ? 'Light mode' : 'Dark mode'}>
        <Icon icon={dark ? SunIcon : MoonIcon} />
      </Button>
    </div>
  )
}

/** Mobile 390 on a laptop: the app in a clean 390 × 844 viewport (no device bezel), scaled down to fit short windows. */
function PhoneFrame({ children, ios }: { children: ReactNode; ios?: boolean }) {
  const [zoom, setZoom] = useState(1)
  useEffect(() => {
    const fit = () => setZoom(Math.min(1, (window.innerHeight - (ios ? 100 : 72)) / 852))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [ios])
  return (
    <div className={cn('grid h-full place-items-center overflow-auto bg-[var(--gwl-canvas)] p-4', ios && 'min-w-0 flex-1 lg:flex-none lg:px-12')}>
      {/* Journey 3 is a native app: an iPhone-shaped screen with a thin bezel. */}
      <div
        style={{ zoom }}
        className={cn(
          'gwl-phone relative h-[844px] w-[390px] shrink-0 overflow-hidden bg-background [transform:translateZ(0)]',
          ios ? 'rounded-[54px] shadow-[0_0_0_10px_#11161c,0_0_0_11px_#3a434d,0_30px_70px_rgb(7_39_69/0.35)]' : 'rounded-[10px] shadow-[0_0_0_1px_rgb(0_0_0/0.08),0_24px_60px_rgb(7_39_69/0.25)]',
        )}
      >
        {children}
      </div>
    </div>
  )
}

/** What each Journey 3 step shows, beside the phone, for whoever is presenting. */
const NOTES: Record<number, string> = {
  1: 'Today the lodge chat opens only within 24 hours of arrival. Wiley is there from the booking on: it reaches out, checks the family in and answers packing questions.',
  2: 'The suite-ready text arrives in the app. Wiley turns the booked weekend into today’s plan and sets the reminders.',
  3: 'Ride pages answer “can my kid go on this?” with each child’s height, and Things To Do filters to what fits the pack.',
  4: 'A lost wristband is the suite key and a payment method, so Wiley brings in a person. The lodge team gets a summary; the family never repeats themselves.',
  5: 'Check-out from the phone: the bill, a late check-out and the water park until closing.',
  6: 'After check-out Wiley is still there: lost and found with the lodge team, feedback, and the next birthday.',
}

/** Journey 3: the Great Wolf app on a phone, with the step's note beside it on a wide window. */
function AppFrame() {
  const { framed, barHidden, step } = useDemo()
  const app = (
    <div className="gwl-site gwl-app relative flex h-full w-full flex-col overflow-hidden bg-[var(--gwl-app-bg)] text-foreground">
      <Outlet />
      <EndCard />
    </div>
  )
  return (
    <div className="flex h-dvh flex-col bg-[var(--gwl-canvas)]">
      {!barHidden && <DemoBar />}
      <div className="flex min-h-0 flex-1 items-stretch justify-center">
        {framed ? <PhoneFrame ios>{app}</PhoneFrame> : app}
        {framed && (
          <aside aria-label="About this step" className="hidden w-80 shrink-0 flex-col justify-center gap-2 pe-10 lg:flex">
            <span className="type-text-xs-semibold tracking-wide text-muted-foreground uppercase">Journey 3 · Step {step} of 6</span>
            <h2 className="gwl-display text-2xl leading-tight">{TITLES[`3.${step}`]}</h2>
            <p className="type-text-sm-normal text-muted-foreground">{NOTES[step]}</p>
          </aside>
        )}
      </div>
    </div>
  )
}

function Frame() {
  const { journey } = useDemo()
  return journey === 3 ? <AppFrame /> : <SiteFrame />
}

function SiteFrame() {
  const { framed, barHidden, desktop, s, journey, step, go, openWiley, listen } = useDemo()
  const key = `${journey}.${step}`
  const pageRef = useRef<HTMLElement | null>(null)
  // Ask Wiley lives in the header; only J1·1 on mobile also shows the bottom "Ask away…" bar from the wireframe.
  const launcher = !s.open && key === '1.1' && !desktop ? 'bar' : null
  // Each step starts at the top of its page; Wiley's own scroll-to effects run after this.
  useEffect(() => {
    if (pageRef.current) pageRef.current.scrollTop = 0
  }, [key])
  const toStep2 = () => {
    go('j1/2')
  }
  const app = (
    <div className="gwl-site relative flex h-full w-full flex-col overflow-hidden bg-[var(--gwl-page)] text-foreground">
      <AppHeader />
      <div className={cn('flex min-h-0 flex-1', !desktop && 'flex-col')}>
        <main id="page-scroll" ref={pageRef} className="min-h-0 min-w-0 flex-1 overflow-y-auto">
          <PageWidthProvider target={pageRef}>
            <StayBar />
            <Outlet />
          </PageWidthProvider>
        </main>
        <WileyPanel />
      </div>
      {launcher && (
        <Launcher
          variant={launcher}
          onOpen={key === '1.1' ? toStep2 : () => openWiley('half')}
          onMic={key === '1.1' ? toStep2 : () => (openWiley('half'), listen())}
        />
      )}
      <Toast />
      <NativeSheets />
      <EndCard />
    </div>
  )
  return (
    <div className="flex h-dvh flex-col bg-[var(--gwl-canvas)]">
      {!barHidden && <DemoBar />}
      <div className="min-h-0 flex-1">{framed ? <PhoneFrame>{app}</PhoneFrame> : app}</div>
    </div>
  )
}

export function JourneyShell() {
  const { pathname } = useLocation()
  const m = /\/j([123])\/(\d)/.exec(pathname)
  const journey = (m ? Number(m[1]) : 1) as Journey
  const step = m ? Math.min(6, Math.max(1, Number(m[2]))) : 1
  return (
    <DemoProvider journey={journey} step={step}>
      <Frame />
    </DemoProvider>
  )
}
