import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { artistFeedback } from '~/mocks/review'
import { applyAnswer, DONE_TEXT, QUESTIONS } from '~/services/interview'
import { generation } from '~/services/generation'
import { shapeFor, stageArt } from '~/mocks/art'
import { motionThinking, roundThinking } from '~/services/reasoning'
import { clipKey, type Action, type ProjectState, type Settings } from './project'
import { useStore } from './store'
import { CROWD_LABEL, TIME_LABEL, VIEW_LABEL, type Brief, type BriefSection, type ChatTurn, type MotionClip, type Annotation, type ReviewComment, type Round, type Still, type StillSpec, type Thinking } from './types'

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
  /**
   * A new round of four concepts. `direction` is the user's “what should be different” for the whole round;
   * `useSelected` (default true) uses the selected concepts as the reference.
   */
  generateRound: (settings: Settings, note?: string, artistComments?: string[], direction?: string, useSelected?: boolean) => Promise<void>
  toggleSelect: (stillId: string) => void
  /** See the current round at another time of day, crowd or camera: re-renders, no new designs. */
  setRoundView: (round: number, settings: Settings) => void
  /** Applies a described change to one concept, making its next version. */
  refineStill: (stillId: string, change: string) => Promise<void>
  /** Notes a change on a concept, pinned to a spot or about the whole concept. Not applied until applyAnnotations. */
  addAnnotation: (stillId: string, text: string, at?: { x: number; y: number }) => void
  removeAnnotation: (stillId: string, number: number) => void
  /** Applies every noted change at once, making the concept's next version. */
  applyAnnotations: (stillId: string) => Promise<void>
  /** A new take on the same concept, as its next version. */
  regenerateStill: (stillId: string) => Promise<void>
  /** Three variations of a concept to pick from. */
  moreLikeThis: (stillId: string) => Promise<void>
  /** Picks a variation (index), or closes them (null). */
  pickVariant: (stillId: string, index: number | null) => void
  /** Makes an earlier version current again (the current one goes into history). */
  restoreVersion: (stillId: string, version: number) => void
  /** “Not this direction”: greys the concept out and steers the next round away from it. Toggles. */
  toggleDismissed: (stillId: string) => void
  addFeedback: (text: string) => void
  proceedToMotion: () => void
  setMotionFocus: (stillId: string, song: number) => void
  generateClip: (stillId: string, song: number) => Promise<void>
  editClip: (stillId: string, song: number, instruction: string, echo?: boolean) => Promise<void>
  sendToArtist: () => void
  toggleResolved: (commentId: string) => void
  requestChanges: (commentIds: string[]) => void
  /** Signs off the sent version, with the artist's rating when they gave one. */
  approve: (rating?: number) => void
  /** Artist preview: the presenter plays the artist, so the simulated reply is cancelled. */
  takeOverReview: () => void
  /** Artist preview: a comment pinned on the concept image, or on a song's clip. */
  addArtistComment: (stillId: string, target: ReviewComment['target'], text: string) => void
  /** Artist preview: hands the artist's comments back to the team. */
  sendArtistFeedback: () => void
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
/** Projects where the presenter is playing the artist: no simulated reply. */
const manualReview = new Set<string>()

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

  const generateRound: ProjectApi['generateRound'] = async (settings, note = '', artistComments = [], direction = '', useSelected = true) => {
    const s = get()
    const number = s.rounds.length + 1
    const picks = useSelected ? s.selected.length : 0
    const avoided = s.rounds.flatMap((r) => r.stills).filter((st) => st.dismissed).length
    const feedback = direction ? [...s.feedback, direction] : s.feedback
    d({ type: 'round/start', round: { number, note, settings, stills: [], done: false, briefRevision: s.briefRevision } })
    d({ type: 'feedback/clear' })
    const used = [
      picks ? `${plural(picks, 'selected concept')} as the reference` : '',
      avoided ? `steered away from ${plural(avoided, 'dismissed direction')}` : '',
      feedback.length ? `your chat feedback (“${feedback.join('”, “')}”)` : '',
      artistComments.length ? plural(artistComments.length, 'artist comment') : '',
    ].filter(Boolean)
    await runRound(
      number,
      settings,
      number === 1
        ? `Round 1 is ready: four concepts for ${describe(settings).toLowerCase()}. Select the ones to take into motion, annotate what should change on any concept, or ask for more like one you like.`
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
      if (now.status !== 'awaiting-artist' || manualReview.has(id)) return
      const concepts = now.rounds.flatMap((r) => r.stills).filter((st) => now.motionStills.includes(st.id))
      const clipSongs = now.brief.moments.map((m) => m.number).filter((song) => concepts[0] && now.clips[clipKey(concepts[0].id, song)]?.status === 'ready')
      const comments = artistFeedback(concepts, now.brief.moments, clipSongs).map((c, i) => ({ ...c, number: i + 1 }))
      d({ type: 'review/set', comments })
      d({ type: 'status/set', status: 'feedback' })
      say('assistant', `The artist replied with ${plural(comments.length, 'comment')}. Open Review to go through them, then approve or request changes.`)
    }, 6000)
  }

  const findStill = (sid: string) => get().rounds.flatMap((r) => r.stills).find((st) => st.id === sid)
  const patch = (sid: string, p: Partial<Still>) => d({ type: 'still/patch', id: sid, patch: p })
  const reseed = (spec: StillSpec, salt: number): StillSpec => ({ ...spec, seed: (spec.seed * 31 + salt * 97) % 997 })

  /** Moves the current version into history and makes `next` current. */
  const newVersion = (st: Still, spec: StillSpec | undefined, change: string, applied?: Annotation[], reworked = true) => {
    const version = (st.version ?? 1) + 1
    patch(st.id, {
      annotations: undefined,
      reworked,
      history: [...(st.history ?? []), { version: st.version ?? 1, image: st.image, spec: st.spec, change: st.change, annotations: applied, reworked: st.reworked }],
      version,
      change,
      spec,
      image: stageArt(`${st.id}-v${version}`, shapeFor(st.concept), spec?.timeOfDay ?? 'golden-hour'),
      busy: undefined,
      variants: undefined,
    })
    return version
  }

  /** One agent turn for a concept-level edit, with Nano Banana Pro as the tool. */
  const conceptEdit = async (st: Still, title: string, doneTitle: string, reasoning: string, input: string) => {
    const started = Date.now()
    let thinking: Thinking = {
      title,
      reasoning,
      steps: [`Read ${st.title}`, 'Kept the venue limits and no-gos'],
      tools: [{ name: 'edit_still', summary: 'Nano Banana Pro · 1 image', input, status: 'running' }],
    }
    const msg = say('assistant', '', true)
    updateMessage(msg, { thinking })
    await sleep(1600 + Math.random() * 1400)
    const seconds = Math.max(1, Math.round((Date.now() - started) / 1000))
    thinking = { ...thinking, title: doneTitle, tools: thinking.tools.map((t) => ({ ...t, status: 'done' as const, output: '1 image · SynthID watermarked' })) }
    return { msg, thinking: { ...thinking, seconds } }
  }

  const setRoundView: ProjectApi['setRoundView'] = (round, settings) => d({ type: 'round/view', round, settings })

  const refineStill: ProjectApi['refineStill'] = async (sid, change) => {
    const st = findStill(sid)
    if (!st || st.busy) return
    patch(sid, { busy: 'refining' })
    const { msg, thinking } = await conceptEdit(
      st,
      `Refining ${st.title.split(' · ')[0]}`,
      `Refined ${st.title.split(' · ')[0]}`,
      `You asked to “${change}”. I’ll change only that and keep the rest of ${st.title}.`,
      `Edit ${st.title}: ${change}. Keep the structure, materials and lighting otherwise.`,
    )
    const fresh = findStill(sid)!
    const version = newVersion(fresh, fresh.spec && reseed(fresh.spec, (fresh.version ?? 1) + 1), change)
    d({ type: 'version/add', summary: `${st.title.split(' · ')[0]} v${version}: “${change}”`, author: 'You' })
    updateMessage(msg, { pending: false, thinking, text: `${st.title.split(' · ')[0]} is now v${version} with “${change}”. Compare it with v${version - 1} on the card.` })
  }

  const addAnnotation: ProjectApi['addAnnotation'] = (sid, text, at) => {
    const st = findStill(sid)
    if (!st) return
    const list = st.annotations ?? []
    const number = (list.at(-1)?.number ?? 0) + 1
    patch(sid, { annotations: [...list, { number, text, ...(at ?? {}) }] })
  }

  const removeAnnotation: ProjectApi['removeAnnotation'] = (sid, number) => {
    const st = findStill(sid)
    if (!st) return
    // Renumber, so the pins always read 1, 2, 3…
    const rest = (st.annotations ?? []).filter((a) => a.number !== number).map((a, i) => ({ ...a, number: i + 1 }))
    patch(sid, { annotations: rest.length ? rest : undefined })
  }

  const applyAnnotations: ProjectApi['applyAnnotations'] = async (sid) => {
    const st = findStill(sid)
    const list = st?.annotations
    if (!st || !list?.length || st.busy) return
    patch(sid, { busy: 'refining' })
    const summary = list.map((a) => a.text).join('; ')
    const { msg, thinking } = await conceptEdit(
      st,
      `Applying ${list.length} change${list.length === 1 ? '' : 's'} to ${st.title.split(' · ')[0]}`,
      `Applied ${list.length} change${list.length === 1 ? '' : 's'} to ${st.title.split(' · ')[0]}`,
      `You marked ${list.length} change${list.length === 1 ? '' : 's'} on ${st.title}. I’ll make ${list.length === 1 ? 'it' : 'them'} where you pinned ${list.length === 1 ? 'it' : 'them'} and keep everything else.`,
      `Edit ${st.title}:\n${list.map((a) => `${a.number}. ${a.text}${a.x !== undefined ? ` (at ${Math.round(a.x)}%, ${Math.round(a.y ?? 0)}% of the frame)` : ''}`).join('\n')}\nKeep the structure, materials and lighting otherwise.`,
    )
    const fresh = findStill(sid)!
    const version = newVersion(fresh, fresh.spec && reseed(fresh.spec, (fresh.version ?? 1) + 1), list.length === 1 ? list[0]!.text : `${list.length} changes: ${summary}`, list)
    d({ type: 'version/add', summary: `${st.title.split(' · ')[0]} v${version}: ${summary}`, author: 'You' })
    updateMessage(msg, { pending: false, thinking, text: `${st.title.split(' · ')[0]} is now v${version} with your ${list.length === 1 ? 'change' : `${list.length} changes`}. Compare it with v${version - 1} on the card.` })
  }

  const regenerateStill: ProjectApi['regenerateStill'] = async (sid) => {
    const st = findStill(sid)
    if (!st || st.busy) return
    patch(sid, { busy: 'regenerating' })
    const { msg, thinking } = await conceptEdit(
      st,
      `Regenerating ${st.title.split(' · ')[0]}`,
      `Regenerated ${st.title.split(' · ')[0]}`,
      `A new take on ${st.title}: same idea and brief, different execution.`,
      `New version of ${st.title}. Same concept, new proportions and details.`,
    )
    const fresh = findStill(sid)!
    const version = newVersion(fresh, fresh.spec && reseed(fresh.spec, (fresh.version ?? 1) + 11), 'Regenerated')
    updateMessage(msg, { pending: false, thinking, text: `Here’s a new take on ${st.title.split(' · ')[0]} (v${version}). The earlier version is kept.` })
  }

  const moreLikeThis: ProjectApi['moreLikeThis'] = async (sid) => {
    const st = findStill(sid)
    if (!st?.spec || st.busy) return
    patch(sid, { variants: 'generating' })
    const { msg, thinking } = await conceptEdit(
      st,
      `Exploring ${st.title.split(' · ')[0]}`,
      `Explored ${st.title.split(' · ')[0]}`,
      `You like ${st.title}. I’ll keep its structure and vary proportions, materials and light.`,
      `Three variations of ${st.title}. Keep the structure; vary the details.`,
    )
    const base = findStill(sid)!.spec!
    patch(sid, { variants: [1, 2, 3].map((i) => reseed(base, i * 13 + (st.version ?? 1))) })
    updateMessage(msg, { pending: false, thinking: { ...thinking, tools: thinking.tools.map((t) => ({ ...t, summary: 'Nano Banana Pro · 3 images', output: '3 images · SynthID watermarked' })) }, text: `Three variations of ${st.title.split(' · ')[0]} are on its card. Pick one to make it the next version.` })
  }

  const pickVariant: ProjectApi['pickVariant'] = (sid, index) => {
    const st = findStill(sid)
    if (!st || !Array.isArray(st.variants)) return
    if (index === null) return patch(sid, { variants: undefined })
    newVersion(st, st.variants[index], `Variation ${index + 1}`)
  }

  const restoreVersion: ProjectApi['restoreVersion'] = (sid, version) => {
    const st = findStill(sid)
    const old = st?.history?.find((h) => h.version === version)
    if (!st || !old) return
    // Going back to a design brings back its brief-check result too.
    newVersion(st, old.spec, `Reverted to v${version}`, undefined, old.reworked ?? false)
  }

  const toggleDismissed: ProjectApi['toggleDismissed'] = (sid) => {
    const st = findStill(sid)
    if (!st) return
    patch(sid, { dismissed: !st.dismissed })
    if (!st.dismissed && get().selected.includes(sid)) d({ type: 'still/select', id: sid })
  }

  return {
    say,
    updateMessage,
    setRoundView,
    refineStill,
    addAnnotation,
    removeAnnotation,
    applyAnnotations,
    regenerateStill,
    moreLikeThis,
    pickVariant,
    restoreVersion,
    toggleDismissed,
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
    approve: (rating) => {
      const s = get()
      manualReview.delete(id)
      d({ type: 'status/set', status: 'approved' })
      if (rating) d({ type: 'rating/set', rating })
      d({ type: 'version/add', summary: rating ? `Approved by the artist · rated ${rating}/5` : 'Approved for production', author: rating ? 'Artist' : 'You' })
      const open = s.review.filter((c) => !c.resolved).length
      say(
        'assistant',
        `${rating ? `The artist approved and rated it ${rating}/5.` : 'Approved.'} The handoff package is ready: ${plural(s.rounds.length, 'round')} from brief to approval.${open ? ` ${plural(open, 'comment')} were left open and are recorded in the decision log.` : ''}`,
      )
    },
    takeOverReview: () => {
      manualReview.add(id)
    },
    addArtistComment: (stillId, target, text) => {
      const s = get()
      const number = s.review.length + 1
      d({
        type: 'review/add',
        comment: { id: `a${store.nextId()}`, number, stillId, target, author: 'Artist', time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }), text, resolved: false },
      })
    },
    sendArtistFeedback: () => {
      const s = get()
      manualReview.delete(id)
      d({ type: 'status/set', status: 'feedback' })
      const open = s.review.filter((c) => !c.resolved).length
      say('assistant', `The artist sent ${plural(open, 'comment')}. Go through them in Review, then request changes or approve.`)
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
