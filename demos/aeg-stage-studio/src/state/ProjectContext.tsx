import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { artistFeedback, artistPraise } from '~/mocks/review'
import { applyAnswer, DONE_TEXT, profileQuestions, QUESTIONS, SLOT_TIMES } from '~/services/interview'
import { generation } from '~/services/generation'
import { listing, take, tweaksFrom } from '~/services/changes'
import { openingLight } from '~/services/light'
import { describeTweaks, planRound } from '~/services/rounds'
import { shapeFor, stageArt } from '~/mocks/art'
import { motionThinking, roundThinking } from '~/services/reasoning'
import { clipKey, type Action, type ProjectState, type Settings } from './project'
import { briefReadiness } from './readiness'
import { useStore } from './store'
import { CROWD_LABEL, TIME_LABEL, VIEW_LABEL, type Brief, type ChatTurn, type MotionClip, type Annotation, type ReviewComment, type Round, type Still, type StillSpec, type Thinking } from './types'

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
  /** Setup: the answers to the opening card (question id → option, or null when skipped). */
  answerProfile: (answers: Record<string, string | null>) => Promise<void>
  /** Setup: skip the interview and show the whole brief form. */
  revealBrief: () => void
  /** Setup → loop: generates round 1 from the brief. */
  startProject: () => void
  /**
   * A new round of four concepts. `direction` is the user's “what should be different” for the whole round;
   * `useSelected` (default true) uses the selected concepts as the reference.
   */
  generateRound: (settings: Settings, note?: string, artistComments?: string[], direction?: string, useSelected?: boolean, reselect?: boolean) => Promise<void>
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
  /** Sends the concepts in motion and their clips to the artist, with an optional note from you. */
  sendToArtist: (note?: string) => void
  /** Sends the handoff package to the production team. */
  exportPackage: () => void
  /** Attaches reference images (mocked: the sample mood board) to the conversation and the brief. */
  attachReferences: () => void
  toggleResolved: (commentId: string) => void
  requestChanges: (commentIds: string[]) => void
  /** Signs off one design for production, with the artist's rating when they gave one. */
  approve: (stillId: string, rating?: number) => void
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
/** The honest reply when a described change is beyond what the preview renderer can show. */
const cantShow = (change: string, code: string) =>
  `I kept ${code} as it is: this preview can't show “${change}”. In the pilot, Nano Banana Pro edits exactly what you describe. Here I can change size, height, colour, haze and brightness, e.g. “narrower, warmer”.`
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

  const runRound = async (number: number, settings: Settings, summary: string, extraSteps: string[], plan?: Parameters<typeof generation.generateStills>[1]) => {
    const started = Date.now()
    let thinking = roundThinking(get().brief, settings, number, get().selected.length)
    thinking = { ...thinking, steps: [...thinking.steps, ...extraSteps] }
    const messageId = say('assistant', '', true)
    updateMessage(messageId, { thinking })
    for await (const still of generation.generateStills({ round: number, project: id, ...settings }, plan)) {
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

  const generateRound: ProjectApi['generateRound'] = async (settings, note = '', artistComments = [], direction = '', useSelected = true, reselect = false) => {
    const s = get()
    const number = s.rounds.length + 1
    const all = s.rounds.flatMap((r) => r.stills)
    const parents = useSelected ? all.filter((st) => s.selected.includes(st.id)) : []
    const dismissed = [...new Set(all.filter((st) => st.dismissed && st.spec).map((st) => st.spec!.concept))].filter((shape) => !parents.some((p) => p.spec?.concept === shape))
    const feedback = direction ? [...s.feedback, direction] : s.feedback
    d({ type: 'round/start', round: { number, note, settings, stills: [], done: false, briefRevision: s.briefRevision } })
    d({ type: 'feedback/clear' })
    // Round 1 opens the brief's four directions; later rounds are planned from the selection, so the message is true.
    const planned = number === 1 ? undefined : planRound({ round: number, parents, dismissed, notes: [...feedback, ...artistComments], addressing: reselect })
    const keywords = s.brief.keywords.slice(0, 3).join(', ').toLowerCase()
    await runRound(
      number,
      settings,
      number === 1
        ? `Round 1 is ready: four directions for ${keywords}, lit for ${describe(settings).toLowerCase()} to match your slot. Select the ones to take into motion, annotate what should change on any concept, or ask for more like one you like.`
        : `Round ${number} is ready for ${describe(settings).toLowerCase()}. ${planned!.summary}`,
      [...feedback.map((f) => `Read your note: “${f}”`), ...artistComments.map((c) => `Read the artist's comment: “${c}”`)],
      planned?.plan,
    )
    // After Request changes, the new round's takes on the sent designs replace the old picks, so the obvious next
    // step (Put into motion) sends the revised work, not the version the artist already commented on.
    if (reselect && planned) {
      const made = get().rounds.find((r) => r.number === number)?.stills ?? []
      const picks = made.filter((_, i) => /^builds on|^hybrid/.test(planned.plan[i]?.why ?? ''))
      d({ type: 'selection/set', ids: (picks.length ? picks : made.slice(0, 1)).map((st) => st.id) })
    }
  }

  /** The next chat question that's still open (key moments, then the optional no-gos), from `from` on. */
  const nextQuestion = (from: number) => {
    const now = briefReadiness(get())
    const index = QUESTIONS.findIndex((q, i) => i >= from && !now.items.find((it) => it.key === q.section)?.done)
    return { index, question: index >= 0 ? QUESTIONS[index] : undefined, left: now.left.map((i) => i.label.toLowerCase()) }
  }
  const closing = (left: string[]) => (left.length ? `Still missing in the brief: ${listing(left)}.` : DONE_TEXT)

  const answerProfile: ProjectApi['answerProfile'] = async (answers) => {
    const s = get()
    const questions = profileQuestions(s.meta.event)
    // The card becomes your reply: the answers, as a message from you.
    const asked = s.messages.find((m) => m.role === 'assistant' && m.profile === 'ask')
    if (asked) updateMessage(asked.id, { profile: undefined })
    d({ type: 'chat/add', turn: { id: store.nextId(), role: 'user', text: '', profile: answers } })
    const replyId = say('assistant', '', true)
    const thinking: Thinking = { title: 'Setting up the brief', reasoning: 'You answered the opening questions. I’ll fill in the stage, the time slot and the look, and suggest anything you skipped.', steps: [], tools: [] }
    updateMessage(replyId, { thinking })
    await sleep(900)
    let brief = s.brief
    const said: string[] = []
    const suggested: { what: string; pick: string }[] = []
    const NOUN = { venue: 'the stage', slot: 'the time slot', visual: 'the look' } as const
    for (const q of questions) {
      const value = answers[q.id] ?? q.options[0]!.value
      if (!answers[q.id]) suggested.push({ what: NOUN[q.id], pick: q.id === 'venue' ? q.options[0]!.value : q.options[0]!.label.toLowerCase() })
      // A rough time ("Sunset into dark") becomes a start time and length the agent picks; you can change both in the brief.
      const text = q.id === 'slot' ? (SLOT_TIMES[value]?.text ?? value) : value
      const result = applyAnswer(q.id, text, brief, s.meta.event)
      if (result.patch) {
        brief = { ...brief, ...result.patch }
        d({ type: 'brief/patch', patch: result.patch, source: 'agent' })
      }
      said.push(result.summary.split('. ')[0]!.replace(/\.$/, ''))
    }
    d({ type: 'brief/reveal', sections: ['venue', 'slot', 'visual'] })
    d({ type: 'setup/profiled' })
    const { index, question, left } = nextQuestion(0)
    d({ type: 'setup/step', step: index >= 0 ? index : QUESTIONS.length })
    updateMessage(replyId, {
      pending: false,
      thinking: { ...thinking, steps: said, seconds: 1 },
      text: `${said.join('. ')}. I picked the start time from “${SLOT_TIMES[answers.slot ?? 'sunset']?.label.toLowerCase()}”; change it in the brief if you know the exact slot.${suggested.length ? ` You skipped ${listing(suggested.map((x) => x.what))}, so I suggested ${listing(suggested.map((x) => x.pick))}.` : ''} ${question ? question.ask : closing(left)}`,
      suggestions: question?.suggestions,
    })
  }

  const answerSetup: ProjectApi['answerSetup'] = async (text) => {
    const s = get()
    say('user', text)
    // The opening card comes first: it sets up most of the brief in one go.
    if (!s.profiled && s.messages.some((m) => m.profile === 'ask')) {
      say('assistant', 'Answer the three questions above first, or skip them and I’ll suggest something. Then we’ll pick the key moments.')
      return
    }
    const question = QUESTIONS[s.setupStep]
    if (!question) {
      say('assistant', 'The brief is complete. Start the project when you’re ready, or tell me what to change.')
      return
    }
    const result = applyAnswer(question.section, text, s.brief, s.meta.event)
    const replyId = say('assistant', '', true)
    const thinking = { title: 'Updating the brief', reasoning: `You answered the question about the ${question.section}.`, steps: ['Read your answer', result.summary], tools: [] }
    updateMessage(replyId, { thinking })
    await sleep(900)
    if (result.patch) d({ type: 'brief/patch', patch: result.patch, source: 'agent' })
    d({ type: 'brief/reveal', sections: [question.section] })
    // Skip questions already answered in the form, so the agent never asks for what's there.
    const { index, question: next, left } = nextQuestion(s.setupStep + 1)
    d({ type: 'setup/step', step: index >= 0 ? index : QUESTIONS.length })
    updateMessage(replyId, {
      pending: false,
      thinking: { ...thinking, seconds: 1 },
      text: `${result.summary} ${next ? next.ask : closing(left)}`,
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
      const sent = now.rounds.flatMap((r) => r.stills).filter((st) => now.motionStills.includes(st.id))
      // The artist only reacts to designs they haven't seen; earlier comments stay, with what was addressed.
      const fresh = sent.filter((st) => !now.review.some((c) => c.stillId === st.id))
      const addressed = now.review.filter((c) => c.addressedIn).length
      const clipSongs = now.brief.moments.map((m) => m.number).filter((song) => fresh[0] && now.clips[clipKey(fresh[0].id, song)]?.status === 'ready')
      const edited = clipSongs.filter((song) => { const c = fresh[0] && now.clips[clipKey(fresh[0].id, song)]; return c?.status === 'ready' && c.clip.edits.length > 0 })
      const reply = addressed ? artistPraise(fresh, addressed) : artistFeedback(fresh, now.brief.moments, clipSongs, edited)
      const comments = reply.map((c, i) => ({ ...c, number: now.review.length + i + 1 }))
      d({ type: 'review/set', comments: [...now.review, ...comments] })
      d({ type: 'status/set', status: 'feedback' })
      const named = fresh.map((st) => st.title.split(' · ')[0]).join(' and ')
      say(
        'assistant',
        addressed && fresh.length
          ? `The artist replied: ${named} ${fresh.length === 1 ? 'addresses' : 'address'} their notes, and they’re happy with it. Approve it in Review, or request more changes.`
          : `The artist replied with ${plural(comments.length, 'comment')}. Open Review to go through them, then approve or request changes.`,
      )
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
    const code = st.title.split(' · ')[0]
    const { tweaks, applied } = tweaksFrom(change, fresh.spec?.tweaks)
    if (!applied.length || !fresh.spec) {
      patch(sid, { busy: undefined })
      updateMessage(msg, { pending: false, thinking, text: cantShow(change, code!) })
      return
    }
    const version = newVersion(fresh, { ...fresh.spec, tweaks }, change)
    d({ type: 'version/add', summary: `${code} v${version}: “${change}”`, author: 'You' })
    updateMessage(msg, { pending: false, thinking, text: `${code} is now v${version}: ${listing(applied)}. Compare it with v${version - 1} on the card.` })
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
    const code = st.title.split(' · ')[0]!
    // Each noted change is read for what the preview can show; the reply says which ones it could and couldn't.
    let tweaks = fresh.spec?.tweaks ?? {}
    const shown: string[] = []
    const notShown: string[] = []
    for (const a of list) {
      const r = tweaksFrom(a.text, tweaks)
      tweaks = r.tweaks
      if (r.applied.length) r.applied.forEach((x) => !shown.includes(x) && shown.push(x))
      else notShown.push(a.text)
    }
    if (!shown.length || !fresh.spec) {
      patch(sid, { busy: undefined })
      updateMessage(msg, { pending: false, thinking, text: cantShow(list.map((a) => a.text).join('”, “'), code) })
      return
    }
    const version = newVersion(fresh, { ...fresh.spec, tweaks }, list.length === 1 ? list[0]!.text : `${list.length} changes: ${summary}`, list)
    d({ type: 'version/add', summary: `${code} v${version}: ${summary}`, author: 'You' })
    updateMessage(msg, {
      pending: false,
      thinking,
      text: `${code} is now v${version}: ${listing(shown)}.${notShown.length ? ` This preview can't show “${notShown.join('”, “')}”; the pilot model applies it.` : ''} Compare it with v${version - 1} on the card.`,
    })
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
    const code = st.title.split(' · ')[0]
    const next = take((fresh.version ?? 1) + fresh.round)
    const version = newVersion(fresh, fresh.spec && { ...reseed(fresh.spec, (fresh.version ?? 1) + 11), tweaks: next.tweaks }, `Regenerated: ${next.caption.toLowerCase()}`)
    d({ type: 'version/add', summary: `${code} v${version}: regenerated (${next.caption.toLowerCase()})`, author: 'You' })
    updateMessage(msg, { pending: false, thinking, text: `Here’s a new take on ${code} (v${version}): ${next.caption.toLowerCase()}. The earlier version is kept.` })
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
    patch(sid, { variants: [0, 1, 2].map((i) => ({ ...reseed(base, i * 13 + (st.version ?? 1)), tweaks: take(i * 2 + (st.version ?? 1), base.tweaks).tweaks })) })
    updateMessage(msg, { pending: false, thinking: { ...thinking, tools: thinking.tools.map((t) => ({ ...t, summary: 'Nano Banana Pro · 3 images', output: '3 images · SynthID watermarked' })) }, text: `Three variations of ${st.title.split(' · ')[0]} are on its card. Pick one to make it the next version.` })
  }

  const pickVariant: ProjectApi['pickVariant'] = (sid, index) => {
    const st = findStill(sid)
    if (!st || !Array.isArray(st.variants)) return
    if (index === null) return patch(sid, { variants: undefined })
    const pick = st.variants[index]!
    const caption = describeTweaks(pick.tweaks) || `variation ${index + 1}`
    const code = st.title.split(' · ')[0]
    const version = newVersion(st, pick, `Variation: ${caption}`)
    d({ type: 'version/add', summary: `${code} v${version}: picked a variation (${caption})`, author: 'You' })
    say('assistant', `${code} is now v${version}: ${caption}. Compare it with v${version - 1} on the card.`)
  }

  const restoreVersion: ProjectApi['restoreVersion'] = (sid, version) => {
    const st = findStill(sid)
    const old = st?.history?.find((h) => h.version === version)
    if (!st || !old) return
    // Going back to a design brings back its brief-check result too.
    const code = st.title.split(' · ')[0]
    const next = newVersion(st, old.spec, `Reverted to v${version}`, undefined, old.reworked ?? false)
    d({ type: 'version/add', summary: `${code} v${next}: back to the v${version} design`, author: 'You' })
    say('assistant', `${code} is back to the v${version} design (now v${next}). Nothing was lost: v${next - 1} is still in its history.`)
  }

  const toggleDismissed: ProjectApi['toggleDismissed'] = (sid) => {
    const st = findStill(sid)
    if (!st) return
    patch(sid, { dismissed: !st.dismissed })
    if (!st.dismissed && get().selected.includes(sid)) d({ type: 'still/select', id: sid })
    const code = st.title.split(' · ')[0]
    const kind = st.title.split(' · ')[1]?.toLowerCase() ?? 'this direction'
    d({ type: 'version/add', summary: st.dismissed ? `${code}: brought back` : `${code}: set aside (not this direction)`, author: 'You' })
    say(
      'assistant',
      st.dismissed
        ? `${code} is back. The next round can use the ${kind} again.`
        : `Set ${code} aside. The next round won’t use the ${kind}; bring it back from its menu any time.`,
    )
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
    answerProfile,
    revealBrief: () => {
      d({ type: 'brief/reveal', sections: ['venue', 'slot', 'visual', 'constraints', 'moments'] })
      // Close the open question: say what's left, so the chat and the form agree.
      // The store updates after this call returns, so read readiness as it will be with every section shown.
      const s = get()
      const shown = Object.fromEntries(Object.entries(s.provenance).map(([k, v]) => [k, v === 'pending' ? 'blank' : v])) as typeof s.provenance
      const left = briefReadiness({ ...s, provenance: shown }).left.map((i) => i.label.toLowerCase())
      say('assistant', left.length ? `Sure, use the form in the brief. Still to set: ${listing(left)}. You can keep answering here too.` : 'The brief is complete. Start the project when you’re ready.')
    },
    startProject: () => {
      d({ type: 'brief/reveal', sections: ['venue', 'slot', 'visual', 'constraints', 'moments'] })
      d({ type: 'phase/set', phase: 'loop' })
      d({ type: 'meta/patch', patch: { briefDate: Date.now() } })
      void generateRound({ ...DEFAULT_SETTINGS, timeOfDay: openingLight(get().brief) }, 'Opening round from the brief')
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
    sendToArtist: (note) => {
      const s = get()
      const ready = Object.entries(s.clips).filter(([k, c]) => s.motionStills.some((sid) => k.startsWith(`${sid}|`)) && c.status === 'ready')
      const names = s.motionStills.map((sid) => stillTitle(sid).split(' · ')[0]).join(', ')
      d({ type: 'status/set', status: 'awaiting-artist' })
      d({ type: 'version/add', summary: `Sent to the artist: ${names} and ${plural(ready.length, 'clip')}${note ? ', with a note' : ''}`, author: 'You', sent: true })
      say('assistant', `Sent to the artist: ${names} and ${plural(ready.length, 'motion clip')}.${note ? ` Your note: “${note}”.` : ''} I’ll tell you here as soon as they reply.`)
      scheduleReply()
    },
    exportPackage: () => {
      const s = get()
      if (s.exported) return
      const design = stillTitle(s.approvedStill ?? s.motionStills[0] ?? '')
      d({ type: 'export/done' })
      d({ type: 'version/add', summary: `Package sent to production: ${design}`, author: 'You' })
      say(
        'assistant',
        `The package for ${design} is with the production team: stills, motion, the cue sheet and the decision log. Three things are still with legal before anything is built: C2PA credentials per model, the indemnity scope for GA Gemini and Veo models, and cover for the preview clip edits. Real venue specs replace the placeholders.`,
      )
    },
    attachReferences: () => {
      const turnId = store.nextId()
      d({ type: 'chat/add', turn: { id: turnId, role: 'user', text: 'Here’s the mood board.', attachments: true } })
      const s = get()
      d({ type: 'brief/patch', patch: { referenceCount: s.brief.referenceCount + 3 }, source: 'you' })
      say('assistant', `Got 3 reference images. They’re added to the visual direction, and I’ll use them in every image and video prompt.`)
    },
    toggleResolved: (commentId) => d({ type: 'review/resolve', id: commentId }),
    requestChanges: (commentIds) => {
      const s = get()
      const chosen = s.review.filter((c) => commentIds.includes(c.id))
      const next = s.rounds.length + 1
      // Taken into the next round: resolved here, and labelled with the round that addresses them.
      d({ type: 'review/set', comments: s.review.map((c) => (commentIds.includes(c.id) ? { ...c, resolved: true, addressedIn: next } : c)) })
      d({ type: 'status/set', status: 'draft' })
      d({ type: 'version/add', summary: `Changes requested · ${plural(chosen.length, 'artist comment')} taken into round ${next}`, author: 'You' })
      say('assistant', `Starting round ${next} from the designs the artist saw, with ${chosen.length === 1 ? '1 of their comments' : `${chosen.length} of their comments`}. The rest stay open in Review.`)
      // Build on what was sent, then select the new takes on it.
      d({ type: 'selection/set', ids: s.motionStills })
      const last = s.rounds.at(-1)
      // Comments on the image steer the new concepts; a clip comment ("Cold open: feels rushed") is about motion, not the design.
      if (last) void generateRound(last.settings, 'Changes requested by the artist', chosen.filter((c) => c.target.kind === 'concept').map((c) => c.text), '', true, true)
    },
    approve: (stillId, rating) => {
      const s = get()
      manualReview.delete(id)
      const name = stillTitle(stillId)
      d({ type: 'approve/still', id: stillId })
      d({ type: 'status/set', status: 'approved' })
      if (rating) d({ type: 'rating/set', rating })
      d({ type: 'version/add', summary: rating ? `Approved by the artist: ${name} · rated ${rating}/5` : `Approved for production: ${name}`, author: rating ? 'Artist' : 'You' })
      const open = s.review.filter((c) => !c.resolved).length
      say(
        'assistant',
        `${rating ? `The artist approved ${name} and rated it ${rating}/5.` : `${name} is approved.`} The handoff package is ready: ${plural(s.rounds.length, 'round')} from brief to approval.${open ? ` ${open === 1 ? '1 comment was' : `${open} comments were`} left open and ${open === 1 ? 'is' : 'are'} recorded in the decision log.` : ''}`,
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
