import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation } from 'react-router-dom'
import { Badge } from '@anvil/components/ui/badge'
import { Button } from '@anvil/components/ui/button'
import { Icon, MessageSquareIcon, MoonIcon, PanelRightIcon, SunIcon } from '@anvil/components/ui/icon'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@anvil/components/ui/sidebar'
import { ChatPanel } from '~/features/chat/ChatPanel'
import { useProject } from '~/state/ProjectContext'
import { AboutDemo } from './AboutDemo'
import { InviteDialog } from './InviteDialog'
import { LoopRail } from './LoopRail'
import { NextHint } from './NextHint'
import { ProjectsSidebar } from './ProjectsSidebar'

const STATUS_BADGE = {
  'awaiting-artist': { tone: 'warning', text: 'Waiting for the artist' },
  feedback: { tone: 'info', text: 'Artist replied' },
  approved: { tone: 'success', text: 'Approved' },
} as const

/**
 * Projects (collapsible, like a chat history) · the project's conversation · the step's work · the loop.
 * The projects list starts collapsed to icons so the work keeps its room.
 */
export function AppShell() {
  const { meta, status, phase } = useProject()
  const { pathname } = useLocation()
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  const [chatOpen, setChatOpen] = useState(true)
  const [railOpen, setRailOpen] = useState(() => window.innerWidth >= 1280)
  const first = useRef(true)

  // Move focus to the new screen's heading, so keyboard and screen-reader users land on what they opened.
  useEffect(() => {
    if (first.current) {
      first.current = false
      return
    }
    requestAnimationFrame(() => document.querySelector<HTMLElement>('main h1')?.focus())
  }, [pathname])

  const toggleTheme = () => {
    document.documentElement.classList.toggle('dark', !dark)
    setDark(!dark)
    try {
      localStorage.setItem('stage-studio:theme', dark ? 'light' : 'dark')
    } catch {
      // Without storage the choice lasts until the next reload.
    }
  }

  const badge = phase === 'setup' ? { tone: 'agent' as const, text: 'Setting up' } : status === 'draft' ? null : STATUS_BADGE[status]

  return (
    <SidebarProvider defaultOpen={false} className="h-svh min-h-0 min-w-5xl">
      <ProjectsSidebar />
      <SidebarInset className="h-svh min-h-0 min-w-0">
        <header className="border-border flex h-14 shrink-0 items-center gap-2 border-b px-3">
          <SidebarTrigger aria-label="Show or hide projects" />
          <Button
            variant="ghost"
            intent="neutral"
            size="icon-sm"
            aria-label={chatOpen ? 'Hide the agent' : 'Show the agent'}
            aria-pressed={chatOpen}
            onClick={() => setChatOpen((o) => !o)}
          >
            <Icon icon={MessageSquareIcon} />
          </Button>
          <div className="ms-1 flex min-w-0 flex-col">
            <span className="truncate type-text-sm-semibold">
              {meta.artist} · {meta.event}
            </span>
            <span className="text-muted-foreground type-text-xs-normal">AEG Presents · on Gemini Enterprise Agent Platform</span>
          </div>
          <div className="flex-1" />
          {badge && (
            <Badge tone={badge.tone} variant="subtle">
              {badge.text}
            </Badge>
          )}
          <AboutDemo />
          <InviteDialog />
          <Button
            variant="ghost"
            intent="neutral"
            size="icon-sm"
            aria-label={dark ? 'Switch to light theme' : 'Switch to dark theme'}
            onClick={toggleTheme}
          >
            <Icon icon={dark ? SunIcon : MoonIcon} />
          </Button>
          <Button
            variant="ghost"
            intent="neutral"
            size="icon-sm"
            aria-label={railOpen ? 'Hide progress' : 'Show progress'}
            aria-pressed={railOpen}
            onClick={() => setRailOpen((o) => !o)}
          >
            <Icon icon={PanelRightIcon} />
          </Button>
        </header>
        <div className="flex min-h-0 flex-1">
          {chatOpen && <ChatPanel />}
          <main className="relative min-w-0 flex-1 overflow-hidden">
            <Outlet />
            <NextHint />
          </main>
          {railOpen && <LoopRail />}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
