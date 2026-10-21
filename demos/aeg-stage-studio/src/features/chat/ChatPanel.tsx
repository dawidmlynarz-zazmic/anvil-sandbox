import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { MessageScrollerItem, useMessageScroller } from '@anvil/components/ui/message-scroller'
import { ChatShell, ChatShellComposer, ChatShellHeader, ChatShellThread } from '@anvil/components/agent/chat-shell'
import { MessageRow } from '@anvil/components/agent/message-row'
import { PromptInput } from '@anvil/components/agent/prompt-input'
import { QuickReply, QuickReplyGroup } from '@anvil/components/agent/quick-reply'
import { Attachment, AttachmentContent, AttachmentDescription, AttachmentMedia, AttachmentTitle } from '@anvil/components/ui/attachment'
import { FileTextIcon, Icon } from '@anvil/components/ui/icon'
import { moodArt } from '~/mocks/art'
import { moodBoard } from '~/mocks/project'
import { generation } from '~/services/generation'
import { briefThinking } from '~/services/reasoning'
import { ThinkingPanel, ThinkingPanelContent, ThinkingPanelStep, ThinkingPanelSteps, ThinkingPanelTrigger } from '@anvil/components/agent/thinking-panel'
import { ToolCallItem, ToolCallItemCode, ToolCallItemContent, ToolCallItemSection, ToolCallItemTrigger } from '@anvil/components/agent/tool-call-item'
import type { ChatTurn } from '~/state/types'
import { clipKey, useProject } from '~/state/ProjectContext'

const PLACEHOLDER: Record<string, string> = {
  setup: 'Answer the question, or use a suggestion',
  brief: 'Describe the show, or ask me to change the brief…',
  stills: 'Feedback for the next round, or “B1: …” for one concept',
  motion: 'Change the open clip, e.g. “slow the split”',
  review: 'Ask about the review, e.g. “what’s comment 2?”',
  handoff: 'Ask about the package or the decision log',
}

/** The step in a project URL: /p/:id/<step>. */
const stepOf = (pathname: string) => pathname.split('/')[3] || 'brief'

/** One conversation for the whole collaboration: it lives in the app shell, so it survives every route change. */
/** The agent's reasoning, steps and tool calls for one answer. Collapsed by default; the header says what it did. */
function Reasoning({ turn }: { turn: ChatTurn }) {
  const t = turn.thinking
  if (!t) return undefined
  return (
    <ThinkingPanel status={turn.pending ? 'running' : 'done'}>
      <ThinkingPanelTrigger
        title={turn.pending ? `${t.title}…` : t.title}
        duration={turn.pending ? undefined : `Thought for ${t.seconds ?? 1}s`}
      />
      <ThinkingPanelContent>
        <p>{t.reasoning}</p>
        <ThinkingPanelSteps>
          {t.steps.map((step) => (
            <ThinkingPanelStep key={step}>{step}</ThinkingPanelStep>
          ))}
        </ThinkingPanelSteps>
        {t.tools.map((tool) => (
          <ToolCallItem key={tool.name} status={tool.status}>
            <ToolCallItemTrigger
              name={tool.name}
              summary={tool.summary}
              duration={tool.seconds ? `${tool.seconds}s` : undefined}
            />
            <ToolCallItemContent>
              <ToolCallItemSection label="Prompt drafted by Gemini">
                <ToolCallItemCode>{tool.input}</ToolCallItemCode>
              </ToolCallItemSection>
              {tool.output && (
                <ToolCallItemSection label="Result">
                  <ToolCallItemCode>{tool.output}</ToolCallItemCode>
                </ToolCallItemSection>
              )}
            </ToolCallItemContent>
          </ToolCallItem>
        ))}
      </ThinkingPanelContent>
    </ThinkingPanel>
  )
}

/** Keeps the newest content in view: runs whenever a turn or one of its reasoning steps is added. Renders nothing. */
function FollowEnd({ signal }: { signal: string }) {
  const { scrollToEnd } = useMessageScroller()
  useEffect(() => {
    scrollToEnd({ behavior: 'smooth' })
    // Content keeps growing while the scroll runs (reasoning opens, text streams in), so settle once more.
    const settle = setTimeout(() => scrollToEnd({ behavior: 'smooth' }), 350)
    return () => clearTimeout(settle)
  }, [signal, scrollToEnd])
  return null
}

export function ChatPanel() {
  const latest = useProject()
  const { messages: turns, say, updateMessage } = latest
  // The composer can hold on to an older send handler, so read the step and project at send time, not render time.
  const live = useRef(latest)
  live.current = latest
  const { pathname } = useLocation()

  /** A short agent reply with its reasoning shown, for answers that don't call a model. */
  const reply = async (title: string, reasoning: string, steps: string[], text: string) => {
    const id = say('assistant', '', true)
    updateMessage(id, { thinking: { title, reasoning, steps, tools: [] } })
    await new Promise((r) => setTimeout(r, 1200))
    updateMessage(id, { pending: false, text, thinking: { title, reasoning, steps, tools: [], seconds: 1 } })
  }

  // What a message means depends on the step you're on.
  const send = async (text: string) => {
    const value = text.trim()
    if (!value) return
    const project = live.current
    const { brief, patchBrief } = project
    const step = stepOf(window.location.pathname)

    if (project.phase === 'setup') {
      void project.answerSetup(value)
      return
    }

    if (step === 'motion') {
      const focus = project.motionFocus
      const slot = focus ? project.clips[clipKey(focus.stillId, focus.song)] : undefined
      if (focus && slot?.status === 'ready') {
        say('user', value)
        void project.editClip(focus.stillId, focus.song, value, false)
        return
      }
      say('user', value)
      void reply('Reading your request', 'There is no rendered clip open, so there is nothing to edit yet.', ['Checked the open clip'], 'Pick a song whose clip is ready, then tell me what to change.')
      return
    }

    if (step === 'stills') {
      say('user', value)
      const latest = project.currentRound
      const code = /\b([A-D])(\d+)\b/i.exec(value)
      const target = code && latest?.stills.find((s) => s.concept === code[1]!.toUpperCase() && s.round === Number(code[2]))
      if (target) {
        project.setComment(target.id, value)
        void reply(
          'Adding a note',
          `You named ${target.title}, so this belongs on that concept rather than the whole round.`,
          [`Matched “${code![0]}” to ${target.title}`, 'Saved it as your note on that concept'],
          `Added as your note on ${target.title}. It will shape round ${project.rounds.length + 1}; you can edit it under the concept.`,
        )
      } else {
        project.addFeedback(value)
        void reply(
          'Noting feedback',
          'This is about the round as a whole, so I’ll keep it for the next round instead of tying it to one concept.',
          ['Read your feedback', `Queued it for round ${project.rounds.length + 1}`],
          `Noted for round ${project.rounds.length + 1}. Choose the scene and press Generate when you’re ready. To comment on one concept, mention it, e.g. “B1: sharper top edge”.`,
        )
      }
      return
    }

    if (step === 'review') {
      say('user', value)
      const open = project.review.filter((c) => !c.resolved)
      const n = /\b(\d+)\b/.exec(value)
      const comment = n ? project.review.find((c) => c.number === Number(n[1])) : undefined
      if (!project.review.length) {
        void reply('Checking the review', 'There are no artist comments yet.', ['Looked for artist comments'], project.status === 'awaiting-artist' ? 'The artist hasn’t replied yet. I’ll post here as soon as they do.' : 'Nothing has been sent to the artist yet. Send from the Motion step.')
      } else if (comment) {
        void reply(
          `Reading comment ${comment.number}`,
          `Comment ${comment.number} is about ${comment.target.kind === 'clip' ? `the song ${comment.target.song} clip` : 'the concept image'}.`,
          ['Found the comment', 'Checked what it points at'],
          `Comment ${comment.number}: “${comment.text}” I’d address it in the next round${comment.target.kind === 'clip' ? ' by editing that clip' : ''}. Tick it in Request changes to include it.`,
        )
      } else {
        void reply(
          'Summarising the review',
          'You asked about the review, so here is where it stands.',
          ['Counted open comments', 'Checked what is ready to hand off'],
          open.length
            ? `${open.length} of ${project.review.length} comments are open. The first: “${open[0]!.text}” Approve if they can wait, or request changes to start a new round with them.`
            : 'All comments are resolved. You can approve for production.',
        )
      }
      return
    }

    // Brief: "avoid …" goes to the no-go list; anything else becomes a visual-direction keyword.
    say('user', value)
    const replyId = say('assistant', '', true)
    updateMessage(replyId, { thinking: briefThinking(value, '') })
    await generation.draftBrief({ description: value })
    if (/^(avoid|no|never)\b/i.test(value)) {
      const rule = value.replace(/[.!]$/, '')
      patchBrief({ constraints: { ...brief.constraints, noGo: `${brief.constraints.noGo}\n${rule}` } }, 'agent')
      updateMessage(replyId, {
        pending: false,
        thinking: { ...briefThinking(value, ''), steps: ['Read your message', `Added “${rule}” to the artist’s no-go list`], seconds: 2 },
        text: `Added “${rule}” to the artist’s no-go list. No concept will use it.`,
      })
      return
    }
    const words = value.replace(/^(keep it|make it|go for|try|use|add|i want|we want)\s+/i, '').replace(/[.,!?]$/, '').split(/\s+/).slice(0, 4).join(' ')
    const added = words.charAt(0).toUpperCase() + words.slice(1)
    const keywords = brief.keywords.includes(added) ? brief.keywords : [...brief.keywords, added]
    patchBrief({ keywords }, 'agent')
    updateMessage(replyId, {
      pending: false,
      thinking: { ...briefThinking(value, added), seconds: 2 },
      text: `Added “${added}” to the visual direction. You can edit it in the brief.`,
    })
  }

  return (
    <aside aria-label="Stage agent" className="border-border h-full w-88 shrink-0 border-e">
      <ChatShell surface="side-panel">
        <ChatShellHeader title="Stage agent" subtitle={latest.phase === 'setup' ? 'Setting up the brief with you' : 'Works with you through every round'} online />
        <ChatShellThread>
          <FollowEnd
            signal={turns
              .map((t) => `${t.id}:${t.pending ? 1 : 0}:${t.text.length}:${t.thinking?.steps.length ?? 0}`)
              .join('|')}
          />
          {turns.map((turn, i) => (
            <MessageScrollerItem key={turn.id} messageId={String(turn.id)}>
            {turn.role === 'user' ? (
              <MessageRow role="user" timestamp="Today">
                {turn.attachments && (
                  <div className="mb-2 flex flex-wrap gap-2">
                    {moodBoard.map((seed, n) => (
                      <Attachment key={seed} size="xs" orientation="vertical" className="w-16">
                        <AttachmentMedia variant="image" className="aspect-auto h-14">
                          <img src={moodArt(seed)} alt={`Mood board ${n + 1}`} />
                        </AttachmentMedia>
                      </Attachment>
                    ))}
                    <Attachment size="sm">
                      <AttachmentMedia>
                        <Icon icon={FileTextIcon} />
                      </AttachmentMedia>
                      <AttachmentContent>
                        <AttachmentTitle>setlist_v3.pdf</AttachmentTitle>
                        <AttachmentDescription>PDF · 21 songs</AttachmentDescription>
                      </AttachmentContent>
                    </Attachment>
                  </div>
                )}
                {turn.text}
              </MessageRow>
            ) : (
              <MessageRow
                role="assistant"
                author="Stage agent"
                status={turn.pending && !turn.thinking ? 'streaming' : 'complete'}
                thinking={<Reasoning turn={turn} />}
                widget={
                  turn.suggestions && i === turns.length - 1 && !turn.pending ? (
                    <QuickReplyGroup>
                      {turn.suggestions.map((s) => (
                        <QuickReply key={s} onClick={() => void send(s)}>
                          {s}
                        </QuickReply>
                      ))}
                    </QuickReplyGroup>
                  ) : undefined
                }
              >
                {turn.text}
              </MessageRow>
            )}
            </MessageScrollerItem>
          ))}
        </ChatShellThread>
        <ChatShellComposer disclaimer="The agent can make mistakes. Check venue specs before anything is built.">
          <PromptInput
            aria-label="Message the stage agent"
            placeholder={latest.phase === 'setup' ? PLACEHOLDER.setup : (PLACEHOLDER[stepOf(pathname)] ?? PLACEHOLDER.brief)}
            onSubmit={(text) => void send(text)}
            onAttach={() => live.current.patchBrief({ referenceCount: live.current.brief.referenceCount + 1 }, 'you')}
          />
        </ChatShellComposer>
      </ChatShell>
    </aside>
  )
}
