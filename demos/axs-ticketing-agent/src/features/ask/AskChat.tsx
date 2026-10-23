import { useEffect } from 'react'
import { ChatShell, ChatShellComposer, ChatShellHeader, ChatShellThread } from '@anvil/components/agent/chat-shell'
import { MessageRow } from '@anvil/components/agent/message-row'
import { PromptInput } from '@anvil/components/agent/prompt-input'
import { QuickReply, QuickReplyGroup } from '@anvil/components/agent/quick-reply'
import { StarterPromptCard } from '@anvil/components/agent/starter-prompt-card'
import { ToolLogLine } from '@anvil/components/agent/tool-log-line'
import { WelcomeState } from '@anvil/components/agent/welcome-state'
import { Button } from '@anvil/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@anvil/components/ui/dropdown-menu'
import { EllipsisIcon, Icon, MoonIcon, RotateCcwIcon, SearchIcon, SunIcon, TicketIcon, UsersIcon, XIcon } from '@anvil/components/ui/icon'
import { MessageScrollerItem, useMessageScroller } from '@anvil/components/ui/message-scroller'
import { useTheme } from '~/app/useTheme'
import { BorderBeam } from '~/components/local/BorderBeam/BorderBeam'
import { STARTERS } from '~/services/agent'
import { useSession } from '~/state/session'
import { BlockView } from './blocks'

/** Keeps the newest message in view as turns arrive. A throttled window may skip the smooth scroll, so land once more. */
function FollowEnd({ signal, empty }: { signal: string; empty: boolean }) {
  const { scrollToEnd, scrollToStart } = useMessageScroller()
  useEffect(() => {
    // The welcome screen reads from its top; the thread follows its newest message.
    if (empty) {
      scrollToStart({ behavior: 'auto' })
      const late = setTimeout(() => scrollToStart({ behavior: 'auto' }), 600)
      return () => clearTimeout(late)
    }
    scrollToEnd({ behavior: 'smooth' })
    const settle = setTimeout(() => scrollToEnd({ behavior: 'smooth' }), 350)
    const late = setTimeout(() => scrollToEnd({ behavior: 'auto' }), 1000)
    return () => {
      clearTimeout(settle)
      clearTimeout(late)
    }
  }, [signal, empty, scrollToEnd, scrollToStart])
  return null
}

const STARTER_ICONS = [UsersIcon, SearchIcon, TicketIcon]
const STARTER_NOTES = ['Budget and group size', 'A venue and a season', 'A venue and a number']

export function AskChat({ onClose }: { onClose: () => void }) {
  const { session, busy, send, reset } = useSession()
  const { dark, toggle: toggleTheme } = useTheme()
  const { turns } = session
  const lastAgent = [...turns].reverse().find((t) => t.role === 'agent')

  return (
    <ChatShell surface="mobile" className="min-h-0 flex-1">
      <ChatShellHeader
        title="Ask AXS"
        // The title sits at the start, where the logo was: the mobile header centres it by default.
        className="*:data-[slot=shell-header-text]:items-start *:data-[slot=shell-header-text]:text-start"
        actions={
          <>
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" intent="neutral" size="icon-sm" shape="circle" className="touch-target" aria-label="More">
                  <Icon icon={EllipsisIcon} />
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end">
                <DropdownMenuItem onSelect={toggleTheme}>
                  <Icon icon={dark ? SunIcon : MoonIcon} />
                  {dark ? 'Switch to light mode' : 'Switch to dark mode'}
                </DropdownMenuItem>
                <DropdownMenuItem onSelect={reset}>
                  <Icon icon={RotateCcwIcon} />
                  Reset the demo
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
            <Button variant="ghost" intent="neutral" size="icon-sm" shape="circle" className="touch-target" aria-label="Close Ask AXS" onClick={onClose}>
              <Icon icon={XIcon} />
            </Button>
          </>
        }
      />
      <ChatShellThread>
        <FollowEnd signal={`${turns.length}:${busy}`} empty={turns.length === 0} />
        {turns.length === 0 && (
          <WelcomeState
            greeting="Find your next show"
            subtitle="Tell me how many tickets, your budget and when. I search the sample London shows in this demo."
          >
            {STARTERS.map((s, i) => (
              <StarterPromptCard
                key={s}
                icon={STARTER_ICONS[i]}
                title={s}
                description={STARTER_NOTES[i]}
                onClick={() => void send({ type: 'text', text: s })}
              />
            ))}
          </WelcomeState>
        )}
        {turns.map((turn) => (
          <MessageScrollerItem key={turn.id} messageId={turn.id}>
            {turn.role === 'user' ? (
              <MessageRow role="user">{turn.text}</MessageRow>
            ) : (
              <MessageRow
                role="assistant"
                author="Ask AXS"
                widget={
                  turn.tools?.length || turn.blocks?.length || (turn === lastAgent && !busy && turn.chips?.length) ? (
                    <div className="flex w-full min-w-0 flex-col gap-3">
                      {turn.tools?.map((t) => (
                        <ToolLogLine key={t.label + t.detail} status="done">
                          {t.label}
                          {t.detail ? ` · ${t.detail}` : ''}
                        </ToolLogLine>
                      ))}
                      {turn.blocks?.map((b, i) => (
                        <BlockView key={i} block={b} session={session} active={turn === lastAgent && !busy} send={(a) => void send(a)} />
                      ))}
                      {turn === lastAgent && !busy && turn.chips && turn.chips.length > 0 && (
                        <QuickReplyGroup>
                          {turn.chips.map((c) => (
                            <QuickReply key={c.label} onClick={() => void send(c.action)}>
                              {c.label}
                            </QuickReply>
                          ))}
                        </QuickReplyGroup>
                      )}
                    </div>
                  ) : undefined
                }
              >
                {turn.text}
              </MessageRow>
            )}
          </MessageScrollerItem>
        ))}
        {busy && (
          <MessageScrollerItem messageId="working">
            <MessageRow role="assistant" author="Ask AXS" widget={<ToolLogLine status="running">Checking AXS…</ToolLogLine>} />
          </MessageScrollerItem>
        )}
      </ChatShellThread>
      <ChatShellComposer disclaimer="AI-powered assistant. Responses may not always be accurate.">
        <BorderBeam>
          <PromptInput aria-label="Message Ask AXS" size="compact" placeholder="Ask about shows, dates or seats" onSubmit={(text) => void send({ type: 'text', text })} />
        </BorderBeam>
      </ChatShellComposer>
    </ChatShell>
  )
}
