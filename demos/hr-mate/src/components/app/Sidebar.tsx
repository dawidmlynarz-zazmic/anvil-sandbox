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
  const inGroup = item.children ? pathname.startsWith(item.to) : false
  const linkClass = ({ isActive }: { isActive: boolean }) =>
    cn(
      'flex h-9 items-center gap-3 rounded-md px-2.5 text-sm font-medium transition-colors',
      isActive ? 'bg-primary text-primary-foreground' : 'text-sidebar-foreground/80 hover:bg-sidebar-accent hover:text-sidebar-foreground',
      collapsed && 'justify-center px-0',
    )
  const target = item.children ? item.children[0].to : item.to
  const top = (
    <NavLink to={target} end={!item.children} className={(p) => linkClass(item.children ? { isActive: false } : p).concat(item.children && inGroup && collapsed ? ' bg-sidebar-accent text-sidebar-foreground' : '')} aria-label={collapsed ? item.label : undefined}>
      <item.icon className="size-4 shrink-0" aria-hidden />
      {!collapsed && <span className="flex-1">{item.label}</span>}
      {!collapsed && item.prototype && <Badge variant="outline" className="text-[11px]">Prototype</Badge>}
    </NavLink>
  )
  return (
    <li>
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
                  cn('flex h-8 items-center justify-between rounded-md px-2.5 text-[13px] font-medium transition-colors', isActive ? 'bg-primary text-primary-foreground' : 'text-sidebar-foreground/75 hover:bg-sidebar-accent hover:text-sidebar-foreground')
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
      <div className={cn('flex h-14 items-center', collapsed ? 'justify-center' : 'justify-between px-4')}>
        <Wordmark collapsed={collapsed} />
        {!collapsed && (
          <Button variant="ghost" size="icon" onClick={onToggle} aria-label="Collapse sidebar">
            <PanelLeftClose />
          </Button>
        )}
      </div>
      <nav className="flex-1 overflow-y-auto px-3 py-2" aria-label="Main">
        <ul className="space-y-1">
          {NAV.map((item) => (
            <Item key={item.to} item={item} collapsed={collapsed} failed={failed} />
          ))}
        </ul>
      </nav>
      <div className="space-y-2 p-3">
        {collapsed && (
          <Button variant="ghost" size="icon" className="w-full" onClick={onToggle} aria-label="Expand sidebar">
            <PanelLeftOpen />
          </Button>
        )}
        {showSetup && (
          <Link
            to={`/setup/${SETUP_STEPS.find((k) => state.setup[k] === 'todo') ?? 'directory'}`}
            className="bg-card border-border hover:bg-accent flex items-center gap-2 rounded-lg border p-2.5 text-[13px] font-medium"
            aria-label={`Setup: ${done} of ${SETUP_STEPS.length} done`}
          >
            <ListChecks className="text-primary size-4 shrink-0" aria-hidden />
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
