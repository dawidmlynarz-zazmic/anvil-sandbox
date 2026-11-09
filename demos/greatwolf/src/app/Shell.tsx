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
}

/** Presenter controls, outside the product. Hide with H. */
function DemoBar() {
  const { journey, step, startJourney, goStep, back, next, reset, deviceMode, setDeviceMode, playing } = useDemo()
  const { dark, toggle } = useTheme()
  return (
    <div className="dark flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1.5 border-b bg-background px-3 py-1.5 text-foreground">
      <ToggleGroup type="single" variant="outline" size="sm" value={String(journey)} onValueChange={(v) => v && startJourney(Number(v) as Journey)} aria-label="Journey">
        <ToggleGroupItem value="1">Journey 1</ToggleGroupItem>
        <ToggleGroupItem value="2">Journey 2</ToggleGroupItem>
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
      <span className="hidden min-w-0 truncate type-text-xs-medium text-muted-foreground md:inline">
        J{journey}·{step} · {TITLES[`${journey}.${step}`]}
      </span>
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
      <ToggleGroup type="single" variant="outline" size="sm" value={deviceMode} onValueChange={(v) => v && setDeviceMode(v as DeviceMode)} aria-label="Device">
        <ToggleGroupItem value="auto">Auto</ToggleGroupItem>
        <ToggleGroupItem value="mobile">Mobile 390</ToggleGroupItem>
        <ToggleGroupItem value="desktop">Desktop</ToggleGroupItem>
      </ToggleGroup>
      <Button size="icon-sm" variant="ghost" intent="neutral" onClick={toggle} aria-label={dark ? 'Light mode' : 'Dark mode'}>
        <Icon icon={dark ? SunIcon : MoonIcon} />
      </Button>
    </div>
  )
}

/** Mobile 390 on a laptop: the app inside a 390 × 844 phone, scaled down to fit short windows. */
function PhoneFrame({ children }: { children: ReactNode }) {
  const [zoom, setZoom] = useState(1)
  useEffect(() => {
    const fit = () => setZoom(Math.min(1, (window.innerHeight - 80) / 864))
    fit()
    window.addEventListener('resize', fit)
    return () => window.removeEventListener('resize', fit)
  }, [])
  return (
    <div className="grid h-full place-items-center overflow-auto bg-[var(--gwl-canvas)] p-4">
      <div style={{ zoom }} className="relative h-[844px] w-[390px] shrink-0 overflow-hidden rounded-[48px] border-[10px] border-[#0b1520] bg-background shadow-2xl [transform:translateZ(0)]">
        {children}
      </div>
    </div>
  )
}

function Frame() {
  const { framed, barHidden, desktop, s, journey, step, go, openWiley, listen } = useDemo()
  const key = `${journey}.${step}`
  const pageRef = useRef<HTMLElement | null>(null)
  // Ask Wiley lives in the header; only J1·1 on mobile also shows the bottom "Ask away…" bar from the wireframe.
  const launcher = !s.open && key === '1.1' && !desktop ? 'bar' : null
  const toStep2 = () => {
    go('j1/2')
  }
  const app = (
    <div className="gwl-site relative flex h-full w-full flex-col overflow-hidden bg-[var(--gwl-page)] text-foreground">
      <AppHeader />
      <div className={cn('flex min-h-0 flex-1', !desktop && 'flex-col')}>
        <main id="page-scroll" ref={pageRef} className="min-h-0 min-w-0 flex-1 overflow-y-auto">
          <PageWidthProvider target={pageRef}>
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
  const m = /\/j([12])\/(\d)/.exec(pathname)
  const journey = (m ? Number(m[1]) : 1) as Journey
  const step = m ? Math.min(6, Math.max(1, Number(m[2]))) : 1
  return (
    <DemoProvider journey={journey} step={step}>
      <Frame />
    </DemoProvider>
  )
}
