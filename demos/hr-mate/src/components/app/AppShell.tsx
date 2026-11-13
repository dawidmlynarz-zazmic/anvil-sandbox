import { useEffect, useState } from 'react'
import { Outlet, useLocation, useNavigate } from 'react-router-dom'
import { LogOut, Search, Settings, User } from 'lucide-react'
import { toast } from 'sonner'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from '@/components/ui/dropdown-menu'
import { useDemo } from '@/lib/demo-state'
import { CommandMenu } from './CommandMenu'
import { Notifications } from './Notifications'
import { Sidebar } from './Sidebar'

export function AppShell() {
  const [collapsed, setCollapsed] = useState(() => window.innerWidth < 1024)
  const [cmd, setCmd] = useState(false)
  const { pathname } = useLocation()
  const navigate = useNavigate()
  const { state } = useDemo()
  const owner = state.team[0]

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        setCmd((o) => !o)
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  useEffect(() => {
    document.getElementById('main')?.scrollTo({ top: 0 })
  }, [pathname])

  return (
    <div className="flex h-svh">
      <a href="#main" className="bg-primary text-primary-foreground sr-only z-50 rounded-md px-3 py-2 focus:not-sr-only focus:absolute focus:top-2 focus:left-2">
        Skip to content
      </a>
      <Sidebar collapsed={collapsed} onToggle={() => setCollapsed((c) => !c)} />
      <div className="flex min-w-0 flex-1 flex-col">
        <header className="border-border flex h-14 shrink-0 items-center justify-between gap-3 border-b px-4 lg:px-8">
          <Button variant="outline" className="text-muted-foreground min-w-0 flex-1 max-w-sm justify-start font-normal" onClick={() => setCmd(true)} aria-label="Search screens, workflows and people">
            <Search aria-hidden />
            <span className="min-w-0 flex-1 truncate text-left">Search screens, workflows, people</span>
            <kbd className="bg-muted hidden rounded px-1.5 py-0.5 text-[11px] sm:block">⌘K</kbd>
          </Button>
          <div className="flex items-center gap-1">
            <Notifications />
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="icon" aria-label="Account menu">
                  <Avatar className="size-7">
                    <AvatarFallback className="bg-secondary text-xs">{owner?.initials ?? 'AM'}</AvatarFallback>
                  </Avatar>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-60">
                <DropdownMenuLabel>
                  <span className="block">{owner?.name}</span>
                  <span className="text-muted-foreground block text-xs font-normal">Owner · {state.workspace.name}</span>
                </DropdownMenuLabel>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => navigate('/settings/workspace')}>
                  <Settings /> Workspace settings
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={() => navigate('/settings/team')}>
                  <User /> Team & roles
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onSelect={() => toast('Signing out is not part of the prototype')}>
                  <LogOut /> Sign out
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>
        <main id="main" tabIndex={-1} className="flex-1 overflow-y-auto outline-none">
          <div className="mx-auto w-full max-w-[1280px] px-4 py-6 lg:px-8">
            <Outlet />
          </div>
        </main>
      </div>
      <CommandMenu open={cmd} onOpenChange={setCmd} />
    </div>
  )
}
