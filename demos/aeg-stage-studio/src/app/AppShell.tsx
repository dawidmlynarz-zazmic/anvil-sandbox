import { useEffect, useRef, useState } from 'react'
import { Outlet, useLocation, useSearchParams } from 'react-router-dom'
import { Badge } from '@anvil/components/ui/badge'
import { Button } from '@anvil/components/ui/button'
import { Icon, MoonIcon, PanelRightIcon, SunIcon } from '@anvil/components/ui/icon'
import { ResizableHandle, ResizablePanel, ResizablePanelGroup } from '@anvil/components/ui/resizable'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@anvil/components/ui/sidebar'
import { ChatPanel } from '~/features/chat/ChatPanel'
import { useProject } from '~/state/ProjectContext'
import { AboutDemo } from './AboutDemo'
import { InviteDialog } from './InviteDialog'
import { LoopRail } from './LoopRail'
import { NextHint } from './NextHint'
import { ProjectsSidebar } from './ProjectsSidebar'

const CHAT_WIDTH_KEY = 'stage-studio:chat-width'
const CHAT_WIDTH = { default: 352, min: 300, max: 560 }

/** The agent panel's width in pixels, as the user last dragged it (the default without storage). */
const readChatWidth = () => {
  try {
    const saved = Number(localStorage.getItem(CHAT_WIDTH_KEY))
    return saved >= CHAT_WIDTH.min && saved <= CHAT_WIDTH.max ? saved : CHAT_WIDTH.default
  } catch {
    return CHAT_WIDTH.default
  }
}

/** Three plain states, next to the project's name: being worked on, with the artist, or signed off. */
const STATUS_BADGE = {
  progress: { tone: 'warning', text: 'In progress' },
  review: { tone: 'agent', text: 'In review' },
  approved: { tone: 'success', text: 'Approved' },
} as const

/**
 * Projects (collapsible, like a chat history) · the project's conversation · the step's work · the loop.
 * The projects list starts collapsed to icons so the work keeps its room.
 */
export function AppShell() {
  const { meta, status } = useProject()
  const { pathname } = useLocation()
  // Previewing as the artist: show only what the artist would see (no agent, no progress rail, no internal status).
  const [params] = useSearchParams()
  const asArtist = pathname.endsWith('/review') && params.get('as') === 'artist'
  const [dark, setDark] = useState(() => document.documentElement.classList.contains('dark'))
  // The agent is always open (it's how you work with the project); only the progress rail can be hidden.
  const [railOpen, setRailOpen] = useState(() => window.innerWidth >= 1280)
  const first = useRef(true)
  const [chatWidth, setChatWidth] = useState(readChatWidth)
  const chatPixels = useRef(chatWidth)
  // Save the width only when the user drags it, in pixels, so it's the same on any window size.
  const saveChatWidth = (_: unknown, meta: { isUserInteraction: boolean }) => {
    if (!meta.isUserInteraction) return
    const width = Math.round(chatPixels.current)
    setChatWidth(width)
    try {
      localStorage.setItem(CHAT_WIDTH_KEY, String(width))
    } catch {
      // Not saved; the default width comes back next time.
    }
  }

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

  const badge = STATUS_BADGE[status === 'approved' ? 'approved' : status === 'awaiting-artist' || status === 'feedback' ? 'review' : 'progress']

  return (
    <SidebarProvider defaultOpen={false} className="h-svh min-h-0 min-w-3xl">
      <ProjectsSidebar />
      <SidebarInset className="h-svh min-h-0 min-w-0">
        <header className="border-border flex h-14 shrink-0 items-center gap-2 border-b px-3">
          <SidebarTrigger aria-label="Show or hide projects" />
          <span className="ms-1 min-w-0 truncate type-text-sm-semibold">
            {meta.artist} · {meta.event}
          </span>
          {!asArtist && (
            <Badge tone={badge.tone} variant="subtle" shape="pill" indicator className="shrink-0">
              {badge.text}
            </Badge>
          )}
          <div className="flex-1" />
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
          {/* Drag the line between the agent and the work to give either more room; the width is remembered. */}
          <ResizablePanelGroup orientation="horizontal" className="min-w-0 flex-1" onLayoutChanged={saveChatWidth}>
            {!asArtist && (
              <>
                <ResizablePanel
                  id="chat"
                  defaultSize={chatWidth}
                  minSize={CHAT_WIDTH.min}
                  maxSize={CHAT_WIDTH.max}
                  groupResizeBehavior="preserve-pixel-size"
                  onResize={(size) => (chatPixels.current = size.inPixels)}
                >
                  <ChatPanel />
                </ResizablePanel>
                <ResizableHandle withHandle aria-label="Resize the agent panel" />
              </>
            )}
            <ResizablePanel id="work" minSize={360}>
              <main className="relative h-full min-w-0 overflow-hidden">
                <Outlet />
                {!asArtist && <NextHint />}
              </main>
            </ResizablePanel>
          </ResizablePanelGroup>
          {railOpen && !asArtist && <LoopRail />}
        </div>
      </SidebarInset>
    </SidebarProvider>
  )
}
