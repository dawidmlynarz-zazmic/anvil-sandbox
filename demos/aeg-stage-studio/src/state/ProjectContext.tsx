import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { artistFeedback } from '~/mocks/review'
import { applyAnswer, DONE_TEXT, QUESTIONS } from '~/services/interview'
import { generation } from '~/services/generation'
import { motionThinking, roundThinking } from '~/services/reasoning'
import { clipKey, type Action, type ProjectState, type Settings } from './project'
import { useStore } from './store'
import { CROWD_LABEL, TIME_LABEL, VIEW_LABEL, type Brief, type BriefSection, type ChatTurn, type MotionClip, type Round } from './types'

// eslint-disable-next-line react-refresh/only-export-components
export { clipKey }

export type Step = 'brief' | 'stills' | 'motion' | 'review' | 'handoff'

interface ProjectApi extends ProjectState {
  projectId: string
  currentRound: Round | undefined
  daysSinceBrief: number
  /** The URL of a step in this project. */
  path: (step: Step, query?: string) => string
  patchBrief: (patch: Partial<Brief>, source?: 'agent' | 'you') => void
  /** Setup: the answer to the agent's current interview question. */
  answerSetup: (text: string) => Promise<void>
  /** Setup: skip the interview and show the whole brief form. */
  revealBrief: () => void
  /** Setup → loop: generates round 1 from the brief. */
  startProject: () => void
  generateRound: (settings: Settings, note?: string, artistComments?: string[]) => Promise<void>
  toggleSelect: (stillId: string) => void
  setComment: (stillId: string, text: string) => void
  removeComment: (stillId: string) => void
  addFeedback: (text: string) => void
  proceedToMotion: () => void
  setMotionFocus: (stillId: string, song: number) => void
  generateClip: (stillId: string, song: number) => Promise<void>
  editClip: (stillId: string, song: number, instruction: string, echo?: boolean) => Promise<void>
  sendToArtist: () => void
  toggleResolved: (commentId: string) => void
  requestChanges: (commentIds: string[]) => void
  approve: () => void
  say: (role: ChatTurn['role'], text: string, pending?: boolean) => number
  updateMessage: (id: number, patch: Partial<ChatTurn>) => void
  /** Re-arms the simulated artist reply after a reload. */
  resumeReply: () => void
}

const ProjectContext = createContext<ProjectApi | null>(null)

const describe = (s: Settings) => `${TIME_LABEL[s.timeOfDay]}, ${CROWD_LABEL[s.crowd].toLowerCase()}, ${VIEW_LABEL[s.view]}`
const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const DEFAULT_SETTINGS: Settings = { timeOfDay: 'golden-hour', crowd: 'full', view: 'front-of-house' }

/** Projects waiting on a (simulated) artist reply, so a reply is scheduled only once. */
const pendingReplies = new Set<string>()

type Store = ReturnType<typeof useStore>

/** Builds the actions for one project. Async work reads fresh state through the store, so it survives switching projects. */
function buildApi(id: string, store: Store): Omit<ProjectApi, keyof ProjectState | 'projectId' | 'currentRound' | 'daysSinceBrief' | 'path'> {
  const get = () => store.ref.current.projects[id]!
  const d = (action: Action) => store.dispatchIn(id, action)

  const say: ProjectApi['say'] = (role, text, pending) => {
    const turnId = store.nextId()
    d({ type: 'chat/add', turn: { id: turnId, role, text, pending } })
    return turnId
  }
  const updateMessage: ProjectApi['updateMessage'] = (turnId, patch) => d({ type: 'chat/update', id: turnId, patch })
  const stillTitle = (sid: string) => get().rounds.flatMap((r) => r.stills).find((s) => s.id === sid)?.title ?? sid
  const momentTitle = (song: number) => get().brief.moments.find((m) => m.number === song)?.title ?? `Song ${song}`

  const runRound = async (number: number, settings: Settings, summary: string, extraSteps: string[]) => {
    const started = Date.now()
    let thinking = roundThinking(get().brief, settings, number, get().selected.length)
    thinking = { ...thinking, steps: [...thinking.steps, ...extraSteps] }
    const messageId = say('assistant', '', true)
    updateMessage(messageId, { thinking })
    for await (const still of generation.generateStills({ round: number, project: id, ...settings })) {
      d({ type: 'round/still', round: number, still })
      thinking = { ...thinking, steps: [...thinking.steps, `Rendered ${still.title}`] }
      updateMessage(messageId, { thinking })
    }
    d({ type: 'round/done', round: number })
    d({ type: 'version/add', summary: `Round ${number} · 4 concepts (${describe(settings).toLowerCase()})`, author: 'Stage agent' })
    const seconds = Math.max(1, Math.round((Date.now() - started) / 1000))
    thinking = {
      ...thinking,
      title: `Planned round ${number}`,
      seconds,
      tools: thinking.tools.map((t) => ({ ...t, status: 'done' as const, seconds, output: '4 images · SynthID watermarked · stored in your project' })),
    }
    updateMessage(messageId, { pending: false, text: summary, thinking })
  }

  const generateRound: ProjectApi['generateRound'] = async (settings, note = '', artistComments = []) => {
    const s = get()
    const number = s.rounds.length + 1
    const picks = s.selected.length
    const notes = s.comments.filter((c) => c.round < number).length
    const feedback = s.feedback
    d({ type: 'round/start', round: { number, note, settings, stills: [], done: false, briefRevision: s.briefRevision } })
    d({ type: 'feedback/clear' })
    const used = [
      picks ? `${plural(picks, 'selected concept')} as the reference` : '',
      notes ? plural(notes, 'note') : '',
      feedback.length ? `your chat feedback (“${feedback.join('”, “')}”)` : '',
      artistComments.length ? plural(artistComments.length, 'artist comment') : '',
    ].filter(Boolean)
    await runRound(
      number,
      settings,
      number === 1
        ? `Round 1 is ready: four concepts for ${describe(settings).toLowerCase()}. Tick the ones you want to take forward, and leave a note on any concept to steer the next round.`
        : `Round ${number} is ready for ${describe(settings).toLowerCase()}. ${used.length ? `I used ${used.join(', ')}.` : 'Nothing was selected, so I explored four new concepts.'}`,
      [...feedback.map((f) => `Applied chat feedback: “${f}”`), ...artistComments.map((c) => `Applied artist comment: “${c}”`)],
    )
  }

  const answerSetup: ProjectApi['answerSetup'] = async (text) => {
    const s = get()
    const question = QUESTIONS[s.setupStep]
    say('user', text)
    if (!question) {
      say('assistant', 'The brief is complete. Start the project when you’re ready, or tell me what to change.')
      return
    }
    const result = applyAnswer(question.section, text, s.brief)
    const replyId = say('assistant', '', true)
    const thinking = { title: 'Updating the brief', reasoning: `You answered the question about ${question.section === 'who' ? 'the artist and event' : `the ${question.section}`}.`, steps: ['Read your answer', result.summary], tools: [] }
    updateMessage(replyId, { thinking })
    await sleep(900)
    if (result.meta) d({ type: 'meta/patch', patch: result.meta })
    if (result.patch) d({ type: 'brief/patch', patch: result.patch, source: 'agent' })
    if (question.section !== 'who') d({ type: 'brief/reveal', sections: [question.section as BriefSection] })
    const next = QUESTIONS[s.setupStep + 1]
    d({ type: 'setup/step', step: s.setupStep + 1 })
    updateMessage(replyId, {
      pending: false,
      thinking: { ...thinking, seconds: 1 },
      text: next ? `${result.summary} ${next.ask}` : `${result.summary} ${DONE_TEXT}`,
      suggestions: next?.suggestions,
    })
  }

  const finishClip = async (stillId: string, song: number) => {
    const clip = await generation.generateMotion({ stillId, momentNumber: song })
    d({ type: 'clip/set', key: clipKey(stillId, song), slot: { status: 'ready', clip } })
    return clip
  }

  const scheduleReply = () => {
    if (pendingReplies.has(id)) return
    pendingReplies.add(id)
    window.setTimeout(() => {
      pendingReplies.delete(id)
      const now = get()
      if (now.status !== 'awaiting-artist') return
      const concepts = now.rounds.flatMap((r) => r.stills).filter((st) => now.motionStills.includes(st.id))
      const clipSongs = now.brief.moments.map((m) => m.number).filter((song) => concepts[0] && now.clips[clipKey(concepts[0].id, song)]?.status === 'ready')
      const comments = artistFeedback(concepts, now.brief.moments, clipSongs).map((c, i) => ({ ...c, number: i + 1 }))
      d({ type: 'review/set', comments })
      d({ type: 'status/set', status: 'feedback' })
      say('assistant', `The artist replied with ${plural(comments.length, 'comment')}. Open Review to go through them, then approve or request changes.`)
    }, 6000)
  }

  return {
    say,
    updateMessage,
    patchBrief: (patch, source = 'you') => d({ type: 'brief/patch', patch, source }),
    answerSetup,
    revealBrief: () => d({ type: 'brief/reveal', sections: ['venue', 'slot', 'visual', 'constraints', 'moments'] }),
    startProject: () => {
      d({ type: 'brief/reveal', sections: ['venue', 'slot', 'visual', 'constraints', 'moments'] })
      d({ type: 'phase/set', phase: 'loop' })
      d({ type: 'meta/patch', patch: { briefDate: Date.now() } })
      void generateRound(DEFAULT_SETTINGS, 'Opening round from the brief')
    },
    generateRound,
    toggleSelect: (sid) => d({ type: 'still/select', id: sid }),
    setComment: (stillId, text) =>
      d({ type: 'comment/set', stillId, text, round: get().rounds.find((r) => r.stills.some((s) => s.id === stillId))?.number ?? 1, id: store.nextId() }),
    removeComment: (stillId) => d({ type: 'comment/remove', stillId }),
    addFeedback: (text) => d({ type: 'feedback/add', text }),
    proceedToMotion: () => {
      const s = get()
      const ids = s.selected
      if (!ids.length) return
      const songs = s.brief.moments.map((m) => m.number)
      const fresh = ids.filter((sid) => !songs.some((song) => s.clips[clipKey(sid, song)]))
      d({ type: 'motion/start', ids, songs })
      const last = songs.at(-1)
      if (last) for (const sid of fresh) void finishClip(sid, last)
      say(
        'assistant',
        `Moving ${ids.length === 1 ? stillTitle(ids[0]!) : `${ids.length} concepts`} into motion: one eight-second clip per key moment (${plural(songs.length, 'song')}). ${ids.length > 1 ? `Each concept gets its own storyboard: ${ids.map(stillTitle).join(', ')}.` : ''}`.trim(),
      )
    },
    setMotionFocus: (stillId, song) => {
      const f = get().motionFocus
      if (f?.stillId !== stillId || f.song !== song) d({ type: 'motion/focus', stillId, song })
    },
    generateClip: async (stillId, song) => {
      const title = momentTitle(song)
      const started = Date.now()
      d({ type: 'clip/set', key: clipKey(stillId, song), slot: { status: 'generating' } })
      let thinking = motionThinking('generate', song, title)
      const msg = say('assistant', '', true)
      updateMessage(msg, { thinking })
      await finishClip(stillId, song)
      const seconds = Math.max(1, Math.round((Date.now() - started) / 1000))
      thinking = { ...thinking, title: `Planned song ${song}`, seconds, tools: thinking.tools.map((t) => ({ ...t, status: 'done' as const, seconds, output: '1 clip · 8 s · SynthID watermarked' })) }
      updateMessage(msg, { pending: false, thinking, text: `The clip for song ${song} · ${title} (${stillTitle(stillId)}) is ready.` })
    },
    editClip: async (stillId, song, instruction, echo = true) => {
      const key = clipKey(stillId, song)
      const slot = get().clips[key]
      if (slot?.status !== 'ready') return
      const title = momentTitle(song)
      const started = Date.now()
      if (echo) say('user', instruction)
      d({ type: 'clip/set', key, slot: { status: 'generating', previous: slot.clip } })
      let thinking = motionThinking('edit', song, title, instruction)
      const msg = say('assistant', '', true)
      updateMessage(msg, { thinking })
      const edited = await generation.editMotion(slot.clip.id, instruction)
      const clip: MotionClip = { ...edited, edits: [...slot.clip.edits, instruction] }
      d({ type: 'clip/set', key, slot: { status: 'ready', clip } })
      d({ type: 'version/add', summary: `Song ${song} · ${title}: “${instruction}”`, author: 'You' })
      const seconds = Math.max(1, Math.round((Date.now() - started) / 1000))
      thinking = { ...thinking, title: `Edited song ${song}`, seconds, tools: thinking.tools.map((t) => ({ ...t, status: 'done' as const, seconds, output: `Clip v${clip.version} · 8 s · SynthID watermarked` })) }
      updateMessage(msg, { pending: false, thinking, text: `Done: song ${song} now has “${instruction}” applied (clip v${clip.version}). The earlier version is kept.` })
    },
    sendToArtist: () => {
      const s = get()
      const ready = Object.entries(s.clips).filter(([k, c]) => s.motionStills.some((sid) => k.startsWith(`${sid}|`)) && c.status === 'ready')
      d({ type: 'status/set', status: 'awaiting-artist' })
      d({ type: 'review/set', comments: [] })
      d({ type: 'version/add', summary: `Sent to the artist · ${plural(s.motionStills.length, 'concept')}, ${plural(ready.length, 'clip')}`, author: 'You', sent: true })
      say('assistant', `Sent to the artist: ${plural(s.motionStills.length, 'concept')} and ${plural(ready.length, 'motion clip')}. I’ll tell you here as soon as they reply.`)
      scheduleReply()
    },
    toggleResolved: (commentId) => d({ type: 'review/resolve', id: commentId }),
    requestChanges: (commentIds) => {
      const s = get()
      const chosen = s.review.filter((c) => commentIds.includes(c.id))
      chosen.forEach((c) => d({ type: 'review/resolve', id: c.id, resolved: true }))
      d({ type: 'status/set', status: 'draft' })
      d({ type: 'version/add', summary: `Changes requested · ${plural(chosen.length, 'comment')} taken into the next round`, author: 'Artist' })
      say('assistant', `Starting round ${s.rounds.length + 1} with ${plural(chosen.length, 'artist comment')} applied. The rest stay open in Review.`)
      const last = s.rounds.at(-1)
      if (last) void generateRound(last.settings, 'Changes requested by the artist', chosen.map((c) => c.text))
    },
    approve: () => {
      const s = get()
      d({ type: 'status/set', status: 'approved' })
      d({ type: 'version/add', summary: 'Approved for production', author: 'You' })
      const open = s.review.filter((c) => !c.resolved).length
      say('assistant', `Approved. The handoff package is ready: ${plural(s.rounds.length, 'round')} from brief to approval.${open ? ` ${plural(open, 'comment')} were left open and are recorded in the decision log.` : ''}`)
    },
    resumeReply: scheduleReply,
  }
}

/** Provides one project's state and actions to everything inside it (the screens use `useProject`). */
export function ProjectScope({ id, children }: { id: string; children: ReactNode }) {
  const store = useStore()
  const project = store.state.projects[id]
  const actions = useMemo(() => buildApi(id, store), [id, store])
  const api = useMemo<ProjectApi | null>(
    () =>
      project
        ? {
            ...project,
            ...actions,
            projectId: id,
            currentRound: project.rounds.at(-1),
            daysSinceBrief: Math.max(0, Math.round((Date.now() - project.meta.briefDate) / 86_400_000)),
            path: (step, query) => `/p/${id}/${step}${query ? `?${query}` : ''}`,
          }
        : null,
    [project, actions, id],
  )

  // A reply that was on its way when the page reloaded: schedule it again.
  useEffect(() => {
    if (project?.status === 'awaiting-artist') actions.resumeReply()
  }, [project?.status, actions])

  if (!api) return null
  return <ProjectContext value={api}>{children}</ProjectContext>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProject() {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error('useProject must be used inside ProjectScope')
  return ctx
}
