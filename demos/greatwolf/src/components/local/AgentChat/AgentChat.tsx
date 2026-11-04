import { useEffect, type ReactNode } from 'react'
import { ChatShell, ChatShellComposer, ChatShellHeader, ChatShellThread, type ChatSurface } from '@anvil/components/agent/chat-shell'
import { MessageRow } from '@anvil/components/agent/message-row'
import { PromptInput } from '@anvil/components/agent/prompt-input'
import { QuickReply, QuickReplyGroup } from '@anvil/components/agent/quick-reply'
import { ToolLogLine } from '@anvil/components/agent/tool-log-line'
import { Icon, MicIcon, SparklesIcon } from '@anvil/components/ui/icon'
import { MessageScrollerItem, useMessageScroller } from '@anvil/components/ui/message-scroller'
import type { Chat } from '~/lib/chat'

/** Keeps the newest message in view. A throttled window may skip the smooth scroll, so land once more. */
function FollowEnd({ signal }: { signal: string }) {
  const { scrollToEnd } = useMessageScroller()
  useEffect(() => {
    scrollToEnd({ behavior: 'smooth' })
    const late = setTimeout(() => scrollToEnd({ behavior: 'auto' }), 700)
    return () => clearTimeout(late)
  }, [signal, scrollToEnd])
  return null
}

interface Props {
  chat: Chat
  name: string
  subtitle?: string
  surface?: ChatSurface
  placeholder?: string
  disclaimer?: string
  /** Buttons at the end of the header. */
  actions?: ReactNode
  /** Shows the mic. `listening` swaps the field for a waveform. */
  onVoice?: () => void
  listening?: boolean
  /** Shown above the first message, e.g. a short orientation. */
  intro?: ReactNode
  /** Rendered between the thread and the composer (e.g. a context strip). */
  aboveComposer?: ReactNode
  noHeader?: boolean
  className?: string
}

/** The conversation used on every screen: Anvil's chat shell, a scripted thread, quick replies. */
export function AgentChat({ chat, name, subtitle, surface = 'side-panel', placeholder = 'Ask a question', disclaimer, actions, onVoice, listening, intro, aboveComposer, noHeader, className }: Props) {
  const { turns, busy, say, pick } = chat
  const last = turns[turns.length - 1]
  const newest = new Map<string, string>()
  turns.forEach((t) => t.widgetKey && newest.set(t.widgetKey, t.id))

  return (
    <ChatShell surface={surface} className={className ?? 'min-h-0 flex-1'}>
      {!noHeader && (
        <ChatShellHeader
          media={<span className="grid size-8 place-items-center rounded-lg bg-agent-subtle text-agent"><Icon icon={SparklesIcon} /></span>}
          title={name}
          subtitle={subtitle}
          online
          actions={actions}
        />
      )}
      <ChatShellThread>
        <FollowEnd signal={`${turns.length}:${busy}`} />
        {intro}
        {turns.map((t) => (
          <MessageScrollerItem key={t.id} messageId={t.id}>
            {t.role === 'user' ? (
              <MessageRow role="user">
                {t.voice ? (
                  <span className="flex items-start gap-2">
                    <Icon icon={MicIcon} className="mt-0.5 shrink-0" />
                    <span>“{t.text}”</span>
                  </span>
                ) : (
                  t.text
                )}
              </MessageRow>
            ) : (
              <MessageRow
                role="assistant"
                author={name}
                citations={t.citations}
                widget={
                  t.tools?.length || (t.widget && (!t.widgetKey || newest.get(t.widgetKey) === t.id)) || (t === last && !busy && t.chips?.length) ? (
                    <div className="flex w-full min-w-0 flex-col gap-3">
                      {t.tools?.map((x) => <ToolLogLine key={x} status="done">{x}</ToolLogLine>)}
                      {(!t.widgetKey || newest.get(t.widgetKey) === t.id) && t.widget}
                      {t === last && !busy && t.chips && t.chips.length > 0 && (
                        <QuickReplyGroup>
                          {t.chips.map((c) => <QuickReply key={c.label} onClick={() => pick(c)}>{c.label}</QuickReply>)}
                        </QuickReplyGroup>
                      )}
                    </div>
                  ) : undefined
                }
              >
                {t.text}
              </MessageRow>
            )}
          </MessageScrollerItem>
        ))}
        {busy && (
          <MessageScrollerItem messageId="working">
            <MessageRow role="assistant" author={name} widget={<ToolLogLine status="running">Working on it…</ToolLogLine>} />
          </MessageScrollerItem>
        )}
      </ChatShellThread>
      {aboveComposer}
      <ChatShellComposer disclaimer={disclaimer}>
        <PromptInput
          aria-label={`Message ${name}`}
          placeholder={placeholder}
          status="idle"
          onVoice={onVoice}
          listening={listening}
          onSubmit={(text) => say(text)}
        />
      </ChatShellComposer>
    </ChatShell>
  )
}
