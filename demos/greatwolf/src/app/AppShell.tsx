import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { Badge } from '@anvil/components/ui/badge'
import { Button } from '@anvil/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@anvil/components/ui/dropdown-menu'
import { ArrowLeftIcon, ArrowRightIcon, EllipsisIcon, Icon, MoonIcon, PawPrintIcon, RotateCcwIcon, SunIcon } from '@anvil/components/ui/icon'
import { ToggleGroup, ToggleGroupItem } from '@anvil/components/ui/toggle-group'
import { MOMENTS, STAGES, momentAt, momentById, type StageId } from './journey'
import { useTheme } from './useTheme'
import { StoreProvider, useStore } from '~/state/store'

function Shell() {
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { dark, toggle } = useTheme()
  const { session, patch, reset } = useStore()
  const moment = momentAt(pathname)
  const index = MOMENTS.indexOf(moment)
  const last = index === MOMENTS.length - 1

  const go = (id: (typeof MOMENTS)[number]['id']) => navigate(momentById(id).path + (id === 'staff' && moment.id === 'after' ? '?agent=feedback' : ''))

  const next = () => {
    // A guest who skipped the refund request still gets the staff story: the request is filed for them.
    if (moment.id === 'charges' && session.ticket === 'none') patch({ ticket: 'requested' })
    if (last) return navigate('/discover')
    go(MOMENTS[index + 1].id)
  }

  const stageHome = (stage: StageId) => (MOMENTS.find((m) => m.stage === stage && m.side === moment.side) ?? MOMENTS.find((m) => m.stage === stage)!).id

  return (
    <div className="flex h-svh min-h-0 flex-col bg-[var(--gwl-canvas)] text-foreground">
      <header className="flex shrink-0 flex-wrap items-center gap-x-4 gap-y-2 border-b bg-background px-4 py-2.5 sm:px-6">
        <div className="flex items-center gap-2.5">
          <span className="grid size-8 place-items-center rounded-lg bg-primary text-primary-foreground"><Icon icon={PawPrintIcon} /></span>
          <span className="type-text-sm-semibold leading-tight">
            Great Wolf Lodge
            <span className="type-text-xs-normal block text-muted-foreground">AI journey demo</span>
          </span>
        </div>

        <nav aria-label="Guest journey" className="order-last flex w-full min-w-0 justify-center overflow-x-auto xl:order-none xl:w-auto xl:flex-1">
          <ol className="flex items-center gap-1">
            {STAGES.map((s, i) => {
              const active = moment.stage === s.id
              return (
                <li key={s.id} className="flex items-center gap-1">
                  {i > 0 && <span aria-hidden className="h-px w-3 bg-border-strong sm:w-5" />}
                  <button
                    type="button"
                    aria-current={active ? 'step' : undefined}
                    onClick={() => go(stageHome(s.id))}
                    className="type-text-sm-medium rounded-full px-3 py-1.5 whitespace-nowrap text-muted-foreground outline-none transition-colors hover:bg-muted hover:text-foreground focus-visible:focus-ring aria-[current=step]:bg-primary aria-[current=step]:text-primary-foreground"
                  >
                    {s.label}
                  </button>
                </li>
              )
            })}
          </ol>
        </nav>

        <div className="ml-auto flex items-center gap-2 xl:ml-0">
          <ToggleGroup
            type="single"
            variant="outline"
            size="sm"
            aria-label="Whose view"
            value={moment.side}
            onValueChange={(v) => v && v !== moment.side && go(moment.counterpart)}
          >
            <ToggleGroupItem value="guest">Guest</ToggleGroupItem>
            <ToggleGroupItem value="staff">Staff</ToggleGroupItem>
          </ToggleGroup>
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" intent="neutral" size="icon-sm" aria-label="More"><Icon icon={EllipsisIcon} /></Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end">
              <DropdownMenuItem onSelect={toggle}>
                <Icon icon={dark ? SunIcon : MoonIcon} />
                {dark ? 'Switch to light mode' : 'Switch to dark mode'}
              </DropdownMenuItem>
              <DropdownMenuItem onSelect={reset}>
                <Icon icon={RotateCcwIcon} />
                Reset the demo
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
          <Button variant="outline" intent="neutral" size="icon-sm" aria-label="Previous moment" disabled={index === 0} onClick={() => go(MOMENTS[index - 1].id)}>
            <Icon icon={ArrowLeftIcon} />
          </Button>
          <Button onClick={next}>
            {last ? 'Back to the homepage' : 'Next moment'}
            <Icon icon={ArrowRightIcon} />
          </Button>
        </div>
      </header>

      <div className="flex shrink-0 flex-wrap items-center gap-x-3 gap-y-1 border-b bg-background px-4 py-2 sm:px-6">
        <span className="type-text-xs-medium text-muted-foreground">Moment {index + 1} of {MOMENTS.length}</span>
        <span className="type-text-sm-semibold">{moment.title}</span>
        <Badge variant="subtle" tone="neutral" size="sm">{moment.side === 'guest' ? 'Guest view' : 'Staff view'}</Badge>
        <Badge variant="outline" tone="agent" size="sm" title="Roadmap phase, from slide 6 of the deck">Roadmap {moment.phase}</Badge>
        <p className="type-text-sm-normal min-w-0 flex-1 basis-80 text-muted-foreground">{moment.note}</p>
      </div>

      <main className="flex min-h-0 flex-1 items-stretch justify-center overflow-auto p-3 sm:p-5">
        <Outlet />
      </main>

      <footer className="type-text-xs-normal shrink-0 border-t bg-background px-4 py-1.5 text-center text-muted-foreground">
        Illustrative prototype, sample data. A scripted demo: nothing is booked, charged or sent.
      </footer>
    </div>
  )
}

export function AppShell() {
  return (
    <StoreProvider>
      <Shell />
    </StoreProvider>
  )
}
