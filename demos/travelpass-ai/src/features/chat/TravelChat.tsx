import { useEffect, useRef } from 'react'
import { ChatShell, ChatShellComposer, ChatShellHeader, ChatShellThread } from '@anvil/components/agent/chat-shell'
import { MediaGallery } from '@anvil/components/agent/media-gallery'
import { MessageActions, MessageFeedback } from '@anvil/components/agent/message-actions'
import { MessageRow } from '@anvil/components/agent/message-row'
import { PromptInput } from '@anvil/components/agent/prompt-input'
import { QuickReply, QuickReplyGroup } from '@anvil/components/agent/quick-reply'
import { StarterPromptCard } from '@anvil/components/agent/starter-prompt-card'
import { ToolLogLine } from '@anvil/components/agent/tool-log-line'
import { WelcomeState } from '@anvil/components/agent/welcome-state'
import { Button } from '@anvil/components/ui/button'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@anvil/components/ui/dropdown-menu'
import { EllipsisIcon, Icon, MoonIcon, RotateCcwIcon, SparklesIcon, SunIcon } from '@anvil/components/ui/icon'
import { MessageScrollerItem, useMessageScroller } from '@anvil/components/ui/message-scroller'
import { useTheme } from '~/app/useTheme'
import { destinationById, destinationPhotos, hotelById, hotelPhotos } from '~/mocks/hotels'
import { STARTERS } from '~/services/agent'
import { useStore } from '~/state/store'
import type { Block } from '~/state/types'

/** Keeps the newest message in view as turns arrive. A throttled window may skip the smooth scroll, so land once more. */
function FollowEnd({ signal, empty }: { signal: string; empty: boolean }) {
  const { scrollToEnd, scrollToStart } = useMessageScroller()
  useEffect(() => {
    if (empty) {
      scrollToStart({ behavior: 'auto' })
      return
    }
    scrollToEnd({ behavior: 'smooth' })
    const late = setTimeout(() => scrollToEnd({ behavior: 'auto' }), 700)
    return () => clearTimeout(late)
  }, [signal, empty, scrollToEnd, scrollToStart])
  return null
}

function BlockView({ block }: { block: Block }) {
  if ('hotelId' in block.target) {
    const hotel = hotelById(block.target.hotelId)!
    return <MediaGallery layout="carousel" title={hotel.name} items={hotelPhotos(hotel)} className="max-w-sm" />
  }
  const dest = destinationById(block.target.destination)
  return <MediaGallery layout="carousel" title={dest.name} items={destinationPhotos(dest)} className="max-w-sm" />
}

export function TravelChat({ surface = 'side-panel' }: { surface?: 'side-panel' | 'mobile' }) {
  const { session, busy, send, stop, shareFile, reset } = useStore()
  const { dark, toggle } = useTheme()
  const file = useRef<HTMLInputElement>(null)
  const { turns } = session
  const lastAgent = [...turns].reverse().find((t) => t.role === 'agent')

  return (
    <ChatShell surface={surface} className="min-h-0 flex-1">
      <ChatShellHeader
        media={<span className="grid size-8 place-items-center rounded-lg bg-agent-subtle text-agent"><Icon icon={SparklesIcon} /></span>}
        title="TravelPass AI"
        subtitle="Plans with you · demo"
        online
        actions={
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <Button variant="ghost" intent="neutral" size="icon-sm" aria-label="More">
                <Icon icon={EllipsisIcon} />
              </Button>
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
        }
      />
      <ChatShellThread>
        <FollowEnd signal={`${turns.length}:${busy}`} empty={turns.length === 0} />
        {turns.length === 0 && (
          <WelcomeState icon={SparklesIcon} greeting="Where to next?" subtitle="Tell me about your trip, like you would a friend. I show hotels, photos and bookings on the page as we talk. This demo knows the Amalfi Coast and Cinque Terre.">
            {STARTERS.map((s) => (
              <StarterPromptCard key={s.title} title={s.title} description={s.note} onClick={() => void send(s.say)} />
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
                author="TravelPass AI"
                actions={turn === lastAgent && busy ? undefined : <MessageActions><MessageFeedback /></MessageActions>}
                widget={
                  turn.tools?.length || turn.blocks?.length || (turn === lastAgent && !busy && turn.chips?.length) ? (
                    <div className="flex w-full min-w-0 flex-col gap-3">
                      {turn.tools?.map((t) => <ToolLogLine key={t} status="done">{t}</ToolLogLine>)}
                      {turn.blocks?.map((b, i) => <BlockView key={i} block={b} />)}
                      {turn === lastAgent && !busy && turn.chips && turn.chips.length > 0 && (
                        <QuickReplyGroup>
                          {turn.chips.map((c) => <QuickReply key={c.label} onClick={() => void send(c.say)}>{c.label}</QuickReply>)}
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
            <MessageRow role="assistant" author="TravelPass AI" widget={<ToolLogLine status="running">Thinking…</ToolLogLine>} />
          </MessageScrollerItem>
        )}
      </ChatShellThread>
      <ChatShellComposer disclaimer="A demo with a scripted assistant. Nothing is booked or charged.">
        <input
          ref={file}
          type="file"
          accept="image/*,video/*"
          className="sr-only"
          tabIndex={-1}
          aria-hidden
          onChange={(e) => {
            const f = e.target.files?.[0]
            if (f) shareFile(f.name)
            e.target.value = ''
          }}
        />
        <PromptInput
          aria-label="Message TravelPass AI"
          placeholder="Tell me about your trip"
          status={busy ? 'streaming' : 'idle'}
          onStop={stop}
          onAttach={() => file.current?.click()}
          onVoice={() => void send('Start Live Mode', { silent: true })}
          onSubmit={(text) => void send(text)}
        />
      </ChatShellComposer>
    </ChatShell>
  )
}
