import { useEffect, useRef } from 'react'
import { ChatShell, ChatShellComposer, ChatShellHeader, ChatShellThread } from '@anvil/components/agent/chat-shell'
import { MessageRow } from '@anvil/components/agent/message-row'
import { PromptInput } from '@anvil/components/agent/prompt-input'
import { ToolLogLine } from '@anvil/components/agent/tool-log-line'
import { Badge } from '@anvil/components/ui/badge'
import { Button } from '@anvil/components/ui/button'
import { BookOpenIcon, Icon, MicIcon, SparklesIcon, XIcon } from '@anvil/components/ui/icon'
import { MessageScrollerItem, useMessageScroller } from '@anvil/components/ui/message-scroller'
import { cn } from '@anvil/lib/utils'
import { lodge } from '~/data/fixtures'
import { useDemo } from '~/state/demo'
import type { Msg, Snap } from '~/wiley/types'
import { WileyAvatar } from '../Brand/Brand'
import { scripts } from '~/wiley/scripts'
import { AiChip, CaptureCard, Chips, QuestionsCard, TripQuote } from '../WileyCards/WileyCards'

// ANVIL-CANDIDATE (the sheet): a chat that docks into a host page instead of covering it. Below 768px a bottom sheet
// with peek / half / full snap points that shrinks the page above it (never a modal); from 768px a 420px sidebar
// that pushes the page, with a context bar. Built on Anvil's Chat Shell, Message Row and Prompt Input.

const PAGES: Record<string, string> = {
  '1.1': 'Home',
  '1.2': 'Choose a suite',
  '1.3': 'Junior Wolf Pup Den rates',
  '1.4': 'Weekend plan',
  '1.5': 'Checkout',
  '1.6': 'Confirmation',
  '2.1': 'Home',
  '2.2': 'Choose a suite',
  '2.3': 'Water park',
  '2.4': 'Things to do',
  '2.5': 'Junior Wolf Pup Den rates',
  '2.6': 'Your plan',
}

const HEIGHT: Record<Snap, string> = { peek: '148px', half: '50%', full: '92%' }
const ORDER: Snap[] = ['peek', 'half', 'full']

function FollowEnd({ signal }: { signal: string }) {
  const { scrollToEnd } = useMessageScroller()
  useEffect(() => {
    scrollToEnd({ behavior: 'smooth' })
    const late = window.setTimeout(() => scrollToEnd({ behavior: 'auto' }), 700)
    return () => window.clearTimeout(late)
  }, [signal, scrollToEnd])
  return null
}

function Item({ m }: { m: Msg }) {
  const { desktop, pick, submitCard } = useDemo()
  if (m.role === 'user') {
    return (
      <MessageScrollerItem messageId={String(m.id)}>
        <div className="flex flex-col items-end gap-1.5">
          {m.voice && (
            <Badge variant="subtle" size="xs">
              <Icon icon={MicIcon} />
              Voice · transcribed
            </Badge>
          )}
          <MessageRow role="user">{m.voice ? `“${m.text}”` : m.text}</MessageRow>
          {m.reaction && (
            <Badge tone="agent" variant="subtle" size="xs" className="gwl-in">
              Wiley reacted · {m.reaction}
            </Badge>
          )}
        </div>
      </MessageScrollerItem>
    )
  }
  if (m.chips) {
    return (
      <MessageScrollerItem messageId={String(m.id)}>
        <Chips style={m.chips.style} options={m.chips.options} onPick={(o) => pick(m.id, o)} />
      </MessageScrollerItem>
    )
  }
  if (m.card) {
    const c = m.card
    return (
      <MessageScrollerItem messageId={String(m.id)}>
        {c.component === 'quote' && <TripQuote />}
        {c.component === 'questions' && <QuestionsCard done={c.done} answer={c.answer as never} onDone={(p) => submitCard(m.id, p)} />}
        {c.component === 'capture' && <CaptureCard done={c.done} onDone={(p) => submitCard(m.id, p)} />}
      </MessageScrollerItem>
    )
  }
  return (
    <MessageScrollerItem messageId={String(m.id)}>
      <MessageRow
        role="assistant"
        author="Wiley"
        widget={
          m.source ? (
            <span className="flex items-center gap-1.5 type-text-xs-normal text-muted-foreground">
              Source:
              <Badge variant="subtle" size="xs">
                <Icon icon={BookOpenIcon} />
                {m.source}
              </Badge>
            </span>
          ) : undefined
        }
      >
        {desktop ? m.text : (m.textMobile ?? m.text)}
      </MessageRow>
    </MessageScrollerItem>
  )
}

function Conversation() {
  const { msgs, typing, composer, say, listen, closeWiley, clearChat, pick, desktop, journey, step } = useDemo()
  const live = composer === 'live'
  const suggestions = scripts[`${journey}.${step}`]?.fallback ?? []
  return (
    <ChatShell surface={desktop ? 'side-panel' : 'mobile'} className="gwl-chat min-h-0 flex-1">
      <ChatShellHeader
        media={<WileyAvatar online />}
        title="Wiley"
        subtitle={desktop ? 'Great Wolf AI assistant' : undefined}
        actions={
          <span className="flex items-center gap-2">
            {msgs.length > 0 && (
              <button type="button" onClick={clearChat} className="type-text-sm-semibold text-foreground underline underline-offset-2 outline-none focus-visible:focus-ring">
                Clear chat
              </button>
            )}
            <Button variant="ghost" intent="neutral" size="icon-sm" aria-label="Close Wiley" onClick={closeWiley}>
              <Icon icon={XIcon} />
            </Button>
          </span>
        }
      />
      {desktop && (
        <p className="flex items-center gap-2 border-b bg-[var(--gwl-sky)] px-4 py-2 type-text-xs-medium text-muted-foreground">
          <Icon icon={SparklesIcon} size="xs" />
          Context: {lodge.city.split(',')[0]} lodge · {PAGES[`${journey}.${step}`]}
        </p>
      )}
      <ChatShellThread>
        <FollowEnd signal={`${msgs.length}:${typing}`} />
        {msgs.length === 0 && !typing && (
          <MessageScrollerItem messageId="hello">
            <div className="flex flex-col items-center gap-3 px-2 pt-6 pb-2 text-center">
              <WileyAvatar size={64} />
              <p className="gwl-display text-xl leading-tight text-foreground">Howls! Ready to book your next adventure?</p>
              <p className="type-text-sm-normal text-foreground">From picking a suite to planning things to do around the lodge, I’m here to help you plan and book your stay.</p>
              <div className="mt-2 flex w-full flex-col gap-2">
                {suggestions.map((o) => (
                  <AiChip key={o.label} block onClick={() => pick(0, o)}>
                    {o.label}
                  </AiChip>
                ))}
              </div>
            </div>
          </MessageScrollerItem>
        )}
        {msgs.map((m) => (
          <Item key={m.id} m={m} />
        ))}
        {typing && (
          <MessageScrollerItem messageId="typing">
            <MessageRow role="assistant" author="Wiley" widget={<ToolLogLine status="running">Wiley is typing…</ToolLogLine>} />
          </MessageScrollerItem>
        )}
      </ChatShellThread>
      <ChatShellComposer
        disclaimer={
          <span className="block text-center">
            AI can make mistakes. By using AI Mode you agree to our <span className="underline">Terms</span> and <span className="underline">Privacy Policy</span>.
          </span>
        }
      >
        <PromptInput
          size="compact"
          aria-label="Message Wiley"
          placeholder={live ? 'Listening…' : desktop ? 'Ask me anything about your stay…' : 'Ask about your stay…'}
          onVoice={listen}
          listening={live}
          leading={
            live ? (
              <Badge tone="destructive" size="xs" className="ms-1">
                LIVE
              </Badge>
            ) : undefined
          }
          onSubmit={(t) => t.trim() && say(t.trim())}
        />
      </ChatShellComposer>
    </ChatShell>
  )
}

/** Mobile: the bottom sheet. Drag or tap the handle to move between peek, half and full. */
function Sheet() {
  const { s, setSnap, closeWiley } = useDemo()
  const start = useRef<number | null>(null)
  const move = (dir: 1 | -1) => {
    const i = ORDER.indexOf(s.snap) + dir
    if (i < 0) return closeWiley()
    setSnap(ORDER[Math.min(ORDER.length - 1, i)])
  }
  return (
    <section
      aria-label="Wiley"
      className="gwl-up relative z-10 flex shrink-0 flex-col overflow-hidden rounded-t-2xl border-t bg-background shadow-[0_-8px_24px_rgb(7_39_69/0.15)] transition-[height] duration-300 ease-out"
      style={{ height: HEIGHT[s.snap] }}
    >
      <button
        type="button"
        aria-label={`Resize Wiley (now ${s.snap})`}
        className="flex h-5 w-full shrink-0 cursor-grab touch-none items-center justify-center outline-none focus-visible:focus-ring"
        onPointerDown={(e) => {
          start.current = e.clientY
          e.currentTarget.setPointerCapture(e.pointerId)
        }}
        onPointerUp={(e) => {
          const dy = start.current === null ? 0 : e.clientY - start.current
          start.current = null
          if (Math.abs(dy) < 8) return setSnap(s.snap === 'full' ? 'peek' : ORDER[ORDER.indexOf(s.snap) + 1])
          move(dy < 0 ? 1 : -1)
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowUp') (e.preventDefault(), move(1))
          if (e.key === 'ArrowDown') (e.preventDefault(), move(-1))
        }}
      >
        <span className="h-1 w-10 rounded-full bg-border-strong" />
      </button>
      <Conversation />
    </section>
  )
}

export function WileyPanel() {
  const { s, desktop } = useDemo()
  if (!s.open) return null
  if (!desktop) return <Sheet />
  return (
    <aside aria-label="Wiley" className={cn('gwl-in flex w-[420px] shrink-0 flex-col border-l bg-background')}>
      <Conversation />
    </aside>
  )
}
