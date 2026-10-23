import { useEffect, useRef } from 'react'
import { useLocation } from 'react-router-dom'
import { MessageScrollerItem, useMessageScroller } from '@anvil/components/ui/message-scroller'
import { ChatShell, ChatShellComposer, ChatShellHeader, ChatShellThread } from '@anvil/components/agent/chat-shell'
import { MessageRow } from '@anvil/components/agent/message-row'
import { PromptInput } from '@anvil/components/agent/prompt-input'
import { QuickReply, QuickReplyGroup } from '@anvil/components/agent/quick-reply'
import { ClarifyingAnswers } from '@anvil/components/agent/clarifying-question'
import { answeredQuestions, profileQuestions } from '~/services/interview'
import { ProfileQuestions } from '~/components/local/ProfileQuestions/ProfileQuestions'
import { Attachment, AttachmentContent, AttachmentDescription, AttachmentMedia, AttachmentTitle } from '@anvil/components/ui/attachment'
import { FileTextIcon, Icon } from '@anvil/components/ui/icon'
import { moodArt } from '~/mocks/art'
import { moodBoard } from '~/mocks/project'
import { generation } from '~/services/generation'
import { briefThinking } from '~/services/reasoning'
import { ThinkingPanel, ThinkingPanelContent, ThinkingPanelStep, ThinkingPanelSteps, ThinkingPanelTrigger } from '@anvil/components/agent/thinking-panel'
import { ToolCallItem, ToolCallItemCode, ToolCallItemContent, ToolCallItemSection, ToolCallItemTrigger } from '@anvil/components/agent/tool-call-item'
import type { ChatTurn } from '~/state/types'
import { lowerFirst } from '~/services/shapes'
import { clipKey, useProject } from '~/state/ProjectContext'
import { looksChosen } from '~/state/project'
import { footprint, issues, venueChecks } from '~/services/venueCheck'
import { genById, gensFor, lookFor, MOMENT_STATUS, momentStatus } from '~/state/show'

const PLACEHOLDER: Record<string, string> = {
  setup: 'Answer the question, or use a suggestion',
  brief: 'Describe the show, or ask me to change the brief…',
  show: 'Ask about the show, e.g. “will the set hold in the wind?”',
  m: 'Change the open image, e.g. “narrower, warmer”',
  review: 'Ask about the review, e.g. “what’s comment 2?”',
  handoff: 'Ask about the package or the decision log',
}

/** The step in a project URL: …/p/:id/<step> (the app may be served from a sub-folder). */
const stepOf = (pathname: string) => /\/p\/[^/]+\/([a-z]+)/.exec(pathname)?.[1] ?? 'brief'

/** A question, not an instruction: it gets an answer and never changes anything. */
const isQuestion = (text: string) =>
  /\?\s*$/.test(text) || /^(what|how|why|when|where|who|which|can|could|should|would|is|are|do|does|did|will|have|has|tell me|explain)\b/i.test(text)

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
    // Attachment thumbnails can load later and push the latest message down, and a throttled window may not run the
    // smooth scroll at all: land on the end once more, without animation.
    const late = setTimeout(() => scrollToEnd({ behavior: 'auto' }), 1000)
    return () => {
      clearTimeout(settle)
      clearTimeout(late)
    }
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

    if (step === 'm') {
      say('user', value)
      const song = Number(/\/m\/(\d+)/.exec(window.location.pathname)?.[1])
      const moment = project.moments.find((m) => m.number === song)
      const focus = project.focus?.song === song ? genById(project, project.focus.genId) : undefined
      const look = lookFor(project, song)
      const clip = look ? project.clips[clipKey(look.id, song)] : undefined
      if (!moment) return
      if (isQuestion(value)) {
        const all = gensFor(project, song)
        const pins = project.pins[song]?.length ?? 0
        void reply(
          `Checking song ${song}`,
          'You asked a question, so I’ll answer from this moment as it stands and change nothing.',
          ['Read the moment’s images, pins and look'],
          `Song ${song} · ${moment.title} has ${all.length} ${all.length === 1 ? 'image' : 'images'}${pins ? `, ${pins} pinned` : ''}${look ? `, and #${look.n} is its look` : ', and no look yet'}.${focus ? ` #${focus.n} is open: describe a change (“narrower, warmer”) and I’ll make it as a new image.` : ''}`,
        )
      } else if (/\b(kit|assets?)\b/i.test(value) && look) {
        // “Build the kit” makes the moment's asset kit from its look.
        void project.buildKit(song)
      } else if (/\b(kit|assets?)\b/i.test(value)) {
        void reply('Reading your request', 'The asset kit is made from the look, and this moment has none yet.', ['Checked the moment’s look'], 'Choose a look first; the asset kit is made from it.')
      } else if (/\b(clip|camera|motion|pace|pacing|slower|faster|cut|beats?|push-in|crane)\b/i.test(value) && clip?.status === 'ready') {
        // Words about motion change the moment's clip.
        void project.editClip(song, value, false)
      } else if (focus) {
        // Anything else changes the open image, as a new image (#13 from #12).
        void project.refine(focus.id, value.replace(/^\s*#\d+\s*[:,-]?\s*/, '') || value)
      } else {
        void reply('Reading your request', 'Nothing is open on this moment yet.', ['Checked the moment'], 'Nothing is explored here yet. Explore four directions first, then tell me what to change.')
      }
      return
    }

    if (step === 'show' && /\b(wind|gusts?|rig|rigging|weight|heavy|fit|fits|trim|height|venue|checks?|sightlines?|build)\b/i.test(value)) {
      say('user', value)
      const source = project.set ? genById(project, project.set.fromId) : undefined
      if (!source) {
        void reply('Checking the set', 'The set isn’t locked, so there’s no structure to check yet.', ['Looked for the set'], 'The set isn’t locked yet. Every image has its own check on its badge; lock the set from a look and I’ll check it against the venue.')
        return
      }
      const checks = venueChecks(source.spec, project.brief, source.reworked)
      const fp = footprint(source.spec)
      const flagged = issues(checks)
      const wind = checks.find((c) => c.label === 'Wind')
      void reply(
        'Checking the set against the venue',
        'You asked about the set in the venue, so I’ll check its footprint against the venue’s limits. The limits are sample specs.',
        ['Estimated the footprint', ...checks.map((c) => `${c.label}: ${c.status === 'pass' ? 'passes' : c.status === 'warn' ? 'needs a plan' : 'fails'}`)],
        `The set is ${fp.width} m wide, ${fp.height} m tall and ${fp.weight} t (${fp.flown} t flown). ${flagged.length ? `${checks.length - flagged.length} of ${checks.length} checks pass. ${flagged.map((c) => `${c.label}: ${c.detail}`).join(' ')}` : `Every check passes.${wind ? ` Wind: ${lowerFirst(wind.detail)}` : ''}`}${!wind && /wind|gust/i.test(value) ? ' It’s under a roof, so wind doesn’t apply.' : ''} These are estimates from sample specs; production confirms them with the venue.`,
      )
      return
    }

    if (step === 'show') {
      say('user', value)
      const open = project.moments.filter((m) => momentStatus(project, m.number) !== 'chosen')
      void reply(
        'Checking the show',
        isQuestion(value) ? 'You asked about the show, so here is where it stands.' : 'Changes happen one moment at a time, so I’ll point you to the right one.',
        ['Read every moment’s status', 'Checked the set'],
        `${looksChosen(project)} of ${project.moments.length} moments have a look${project.set ? `, and the set is locked (${lowerFirst(project.set.title)})` : '; the set isn’t locked yet'}.${open.length ? ` Still open: ${open.map((m) => `song ${m.number} (${MOMENT_STATUS[momentStatus(project, m.number)].text.toLowerCase()})`).join(', ')}.` : ' Every moment is ready to send.'} To change a look, open its moment and tell me there.`,
      )
      return
    }

    if (step === 'review') {
      say('user', value)
      const open = project.review.filter((c) => !c.resolved)
      const n = /\b(\d+)\b/.exec(value)
      const comment = n ? project.review.find((c) => c.number === Number(n[1])) : undefined
      if (!project.review.length) {
        void reply('Checking the review', 'There are no artist comments yet.', ['Looked for artist comments'], project.status === 'awaiting-artist' ? 'The artist hasn’t replied yet. I’ll post here as soon as they do.' : 'Nothing has been sent to the artist yet. Send the show from the show board.')
      } else if (comment) {
        void reply(
          `Reading comment ${comment.number}`,
          `Comment ${comment.number} is about the song ${comment.song} ${comment.target.kind === 'clip' ? 'clip' : 'look'}.`,
          ['Found the comment', 'Checked what it points at'],
          `Comment ${comment.number}: “${comment.text}” ${comment.target.kind === 'clip' ? 'Request changes with it and I’ll edit that clip.' : 'Request changes with it and I’ll explore new looks for that moment with it applied.'}`,
        )
      } else {
        void reply(
          'Summarising the review',
          'You asked about the review, so here is where it stands.',
          ['Counted open comments', 'Checked what is ready to hand off'],
          open.length
            ? `${open.length} of ${project.review.length} comments are open. The first: “${open[0]!.text}” Approve the show if they can wait, or request changes to rework those moments.`
            : 'All comments are resolved. You can approve the show.',
        )
      }
      return
    }

    say('user', value)

    if (step === 'handoff') {
      const open = project.review.filter((c) => !c.resolved).length
      void reply(
        'Checking the package',
        'You asked about the handoff, so I’ll answer from the package as it stands and change nothing.',
        ['Read the package contents', 'Checked rights and provenance', 'Counted open comments'],
        project.status === 'approved'
          ? `Before production builds it: legal should confirm C2PA credentials per model, the indemnity scope for GA Gemini and Veo models, and cover for the preview clip edits. Real venue specs replace the placeholders.${open ? ` ${open} artist comment${open === 1 ? ' was left open; it’s' : 's were left open; they’re'} in the decision log.` : ''}`
          : 'The package comes together once the artist approves. Finish the review first.',
      )
      return
    }

    // The brief: a question gets an answer; a short look ("warmer, more haze") becomes a keyword; "avoid …" a no-go.
    if (project.status === 'approved') {
      void reply('Checking the brief', 'The show is approved, so the brief is locked.', ['Checked the project status'], 'The brief is locked because the artist approved the show. Start a new project for changes.')
      return
    }
    if (isQuestion(value)) {
      void reply(
        'Reading the brief',
        'You asked a question, so I’ll answer from the brief and change nothing.',
        ['Read the brief'],
        `The brief has ${brief.keywords.length} visual keyword${brief.keywords.length === 1 ? '' : 's'}${brief.keywords.length ? '' : ', so the visual direction is still missing'}. The key moments live on the show board. Tell me a look in a few words (“warmer, more haze”) or a no-go (“avoid red”) and I’ll add it.`,
      )
      return
    }
    const noGo = /^(avoid|never)\b/i.test(value) || /^no\s+(?!,)[a-z]/i.test(value) && !/^no[,.!]/i.test(value) && value.split(/\s+/).length <= 8
    // A look reads like "warmer, more haze": short, and never about "I", "we" or "you" ("No, I meant…" is conversation).
    const conversational = /^(no|yes|yeah|ok|okay|thanks|thank you|sorry|hmm|actually|wait|never ?mind)\b/i.test(value) || /\b(i|i'm|i’m|me|my|we|our|you|your)\b/i.test(value)
    const short = value.split(/\s+/).length <= 6 && !conversational
    if (!noGo && !short) {
      void reply(
        'Reading your message',
        'This doesn’t read as a change to the brief, so I’ve left the brief as it is.',
        ['Read your message', 'Kept the brief unchanged'],
        'I’ve left the brief as it is. To change it, tell me a look in a few words (“warmer, more haze”) or a no-go (“avoid red”), or edit the cards directly.',
      )
      return
    }
    const replyId = say('assistant', '', true)
    updateMessage(replyId, { thinking: briefThinking(value, '') })
    await generation.draftBrief({ description: value })
    if (noGo) {
      const rule = value.replace(/[.!]$/, '')
      patchBrief({ constraints: { ...brief.constraints, noGo: `${brief.constraints.noGo}\n${rule}` } }, 'agent')
      updateMessage(replyId, {
        pending: false,
        thinking: { ...briefThinking(value, ''), steps: ['Read your message', `Added “${rule}” to the artist’s no-go list`], seconds: 2 },
        text: `Added “${rule}” to the artist’s no-go list. The agent checks every image against it.`,
      })
      return
    }
    const words = value.replace(/^(keep it|make it|go for|try|use|add|i want|we want)\s+/i, '').replace(/[.,!?]$/, '')
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
    <aside aria-label="Stage agent" className="h-full w-full">
      <ChatShell surface="side-panel">
        <ChatShellHeader title="Stage agent" subtitle={latest.phase === 'setup' ? 'Setting up the brief with you' : 'Explores and checks; you decide'} online />
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
                {typeof turn.profile === 'object' ? (
                  <ClarifyingAnswers questions={answeredQuestions(latest.meta.event, turn.profile)} answers={turn.profile} />
                ) : (
                  turn.text
                )}
              </MessageRow>
            ) : (
              <MessageRow
                role="assistant"
                author="Stage agent"
                status={turn.pending && !turn.thinking ? 'streaming' : 'complete'}
                thinking={<Reasoning turn={turn} />}
                widget={
                  // The opening questions: one card that sets up stage, time slot and look at once.
                  turn.profile === 'ask' && !latest.profiled ? (
                    <ProfileQuestions
                      questions={profileQuestions(latest.meta.event)}
                      onSubmit={(answers) => void live.current.answerProfile(answers)}
                    />
                  ) : turn.suggestions && i === turns.length - 1 && !turn.pending ? (
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
            onAttach={() => live.current.attachReferences()}
          />
        </ChatShellComposer>
      </ChatShell>
    </aside>
  )
}
