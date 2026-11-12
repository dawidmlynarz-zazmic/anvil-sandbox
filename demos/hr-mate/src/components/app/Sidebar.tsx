import { NavLink, Link, useLocation } from 'react-router-dom'
import { ListChecks, PanelLeftClose, PanelLeftOpen } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { SETUP_STEPS, setupComplete, setupDoneCount, useDemo } from '@/lib/demo-state'
import { cn } from '@/lib/utils'
import { DemoControls } from './DemoControls'
import { NAV, type NavItem } from './nav'

export function Wordmark({ collapsed }: { collapsed?: boolean }) {
  return (
    <Link to="/" className="flex items-center gap-2 rounded-md px-1" aria-label="HR Mate home">
      <span className="bg-primary text-primary-foreground flex size-7 items-center justify-center rounded-md text-sm font-semibold" aria-hidden>
        H
      </span>
      {!collapsed && <span className="text-base font-semibold">HR Mate</span>}
    </Link>
  )
}

function Item({ item, collapsed, failed }: { item: NavItem; collapsed: boolean; failed: number }) {
  const { pathname } = useLocation()
  const active = item.children ? pathname.startsWith(item.to) : item.to === '/' ? pathname === '/' : pathname.startsWith(item.to)
  const target = item.children ? item.children[0].to : item.to
  const top = (
    <NavLink
      to={target}
      aria-label={collapsed ? item.label : undefined}
      aria-current={active && !item.children ? 'page' : undefined}
      className={cn(
        'relative flex h-9 items-center rounded-md text-sm font-medium transition-colors',
        collapsed ? 'w-10 justify-center' : 'gap-3 px-2.5',
        active ? 'bg-sidebar-accent text-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-foreground',
      )}
    >
      <item.icon className="size-4 shrink-0" aria-hidden />
      {!collapsed && <span className="flex-1">{item.label}</span>}
      {!collapsed && item.prototype && (
        <Badge variant="outline" className="text-[11px]">
          Prototype
        </Badge>
      )}
      {collapsed && item.to === '/automations' && failed > 0 && <span className="bg-destructive-soft absolute top-1 right-1 size-2 rounded-full" aria-label={`${failed} failed runs`} />}
    </NavLink>
  )
  return (
    <li className={cn(collapsed && 'relative flex justify-center')}>
      {collapsed ? (
        <Tooltip>
          <TooltipTrigger asChild>{top}</TooltipTrigger>
          <TooltipContent side="right">{item.label}</TooltipContent>
        </Tooltip>
      ) : (
        top
      )}
      {!collapsed && item.children && (
        <ul className="border-sidebar-border mt-1 ml-5 space-y-0.5 border-l pl-2">
          {item.children.map((c) => (
            <li key={c.to}>
              <NavLink
                to={c.to}
                className={({ isActive }) =>
                  cn('flex h-8 items-center justify-between rounded-md px-2.5 text-[13px] font-medium transition-colors', isActive ? 'bg-sidebar-accent text-foreground' : 'text-sidebar-foreground/70 hover:bg-sidebar-accent/60 hover:text-foreground')
                }
              >
                {c.label}
                {c.to.endsWith('runs') && failed > 0 && (
                  <span className="bg-destructive text-destructive-foreground ml-2 rounded-full px-1.5 text-[11px]" aria-label={`${failed} failed`}>
                    {failed}
                  </span>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      )}
    </li>
  )
}

export function Sidebar({ collapsed, onToggle }: { collapsed: boolean; onToggle: () => void }) {
  const { state } = useDemo()
  const failed = state.runs.filter((r) => r.status === 'failed').length
  const done = setupDoneCount(state)
  const showSetup = !setupComplete(state)
  return (
    <aside className={cn('bg-sidebar border-sidebar-border flex h-svh shrink-0 flex-col border-r transition-[width]', collapsed ? 'w-16' : 'w-60')} aria-label="Sidebar">
      <div className={cn('flex items-center', collapsed ? 'flex-col gap-2 pt-3 pb-1' : 'h-14 justify-between px-4')}>
        <Wordmark collapsed={collapsed} />
        <Button variant="ghost" size="icon" onClick={onToggle} aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}>
          {collapsed ? <PanelLeftOpen /> : <PanelLeftClose />}
        </Button>
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-2" aria-label="Main">
        <ul className="space-y-1">
          {NAV.map((item) => (
            <Item key={item.to} item={item} collapsed={collapsed} failed={failed} />
          ))}
        </ul>
      </nav>
      <div className={cn('space-y-2 p-3', collapsed && 'flex flex-col items-center')}>
        {showSetup && (
          <Link
            to={`/setup/${SETUP_STEPS.find((k) => state.setup[k] === 'todo') ?? 'directory'}`}
            className={cn('bg-card border-border hover:bg-accent flex items-center rounded-lg border text-[13px] font-medium', collapsed ? 'mx-auto size-10 justify-center' : 'gap-2 p-2.5')}
            aria-label={`Setup: ${done} of ${SETUP_STEPS.length} done`}
          >
            <ListChecks className="text-muted-foreground size-4 shrink-0" aria-hidden />
            {!collapsed && (
              <span className="flex-1">
                Finish setup
                <span className="text-muted-foreground block text-xs font-normal">
                  {done} of {SETUP_STEPS.length} done
                </span>
              </span>
            )}
          </Link>
        )}
        <DemoControls collapsed={collapsed} />
      </div>
    </aside>
  )
}
