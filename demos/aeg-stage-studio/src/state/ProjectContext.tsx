import { createContext, useContext, useEffect, useMemo, type ReactNode } from 'react'
import { isCovered, venueOf } from '~/mocks/venues'
import { issues, venueChecks } from '~/services/venueCheck'
import { applyAnswer, DONE_TEXT, draftMoments, profileQuestions, QUESTIONS, SLOT_TIMES } from '~/services/interview'
import { generation } from '~/services/generation'
import { listing, take, tweaksFrom } from '~/services/changes'
import { BATCH_LABEL, materialize, planBatch, type BatchKind, type Draft } from '~/services/explore'
import { momentLight } from '~/services/light'
import { capitalise, describeTweaks } from '~/services/shapes'
import { batchThinking, motionThinking } from '~/services/reasoning'
import { TIME_LABEL } from './types'
import { ALL_SECTIONS, clipKey, clock, handoffOutOfDate, showComplete, type Action, type ProjectState } from './project'
import { briefReadiness } from './readiness'
import { genById, gensFor, lookFor, momentStatus, nextOpenMoment } from './show'
import { useStore } from './store'
import type { Brief, ChatTurn, Generation, MotionClip, Thinking } from './types'

// eslint-disable-next-line react-refresh/only-export-components
export { clipKey }

export type Step = 'brief' | 'show' | 'handoff'

interface ProjectApi extends ProjectState {
  projectId: string
  daysSinceBrief: number
  /** The URL of a step in this project. */
  path: (step: Step, query?: string) => string
  /** The URL of a key moment's page. */
  momentPath: (song: number) => string
  patchBrief: (patch: Partial<Brief>, source?: 'agent' | 'you') => void
  /** Setup: the answer to the agent's current interview question. */
  answerSetup: (text: string) => Promise<void>
  /** Setup: the answers to the opening card (question id → option, or null when skipped). */
  answerProfile: (answers: Record<string, string | null>) => Promise<void>
  /** Setup: skip the interview and show the whole brief form. */
  revealBrief: () => void
  /** Setup → the show: drafts the key moments and starts exploring the first. Returns the first moment's song. */
  startProject: () => number | undefined
  /** Adds a key moment at the end of the show: it's numbered after the last one. */
  addMoment: (title: string, intent: string) => void
  /** Removes a key moment; the ones after it are renumbered. */
  removeMoment: (song: number) => void
  /** A batch of images for a moment: new directions, or more like / other angles / other light of `baseId`. */
  /** A batch of images. `prompt` describes the stage (new directions); it's shown as your message unless `echo` is false. */
  explore: (song: number, kind: BatchKind, baseId?: string, prompt?: string, echo?: boolean) => Promise<void>
  /** Applies a described change to one image, as a new image (its child). */
  refine: (genId: string, change: string) => Promise<void>
  /** Notes a change on an image, pinned to a spot or about the whole image. Not applied until applyAnnotations. */
  addAnnotation: (genId: string, text: string, at?: { x: number; y: number }) => void
  removeAnnotation: (genId: string, number: number) => void
  /** Applies every noted change at once, as a new image. */
  applyAnnotations: (genId: string) => Promise<void>
  /** A new take on an image, as its child. */
  anotherTake: (genId: string) => Promise<void>
  /** “Not this direction”: greys the image out and steers later batches away from its structure. Toggles. */
  toggleDismissed: (genId: string) => void
  /** Makes an image its moment's look, and renders the moment's clip from it. */
  chooseLook: (genId: string) => void
  /** The image open on a moment page, so the chat changes that one. */
  setFocus: (song: number, genId: string) => void
  generateClip: (song: number) => Promise<void>
  editClip: (song: number, instruction: string, echo?: boolean) => Promise<void>
  /** Makes the handoff package from the show as it is now: a new version when there was one already. */
  generateHandoff: () => void
  /** Leaves the show as edited without a new handoff; the agent says when the handoff no longer matches. */
  saveShow: () => void
  /** Sends the handoff package to the production team. */
  exportPackage: () => void
  /** Attaches reference images (mocked: the sample mood board) to the conversation and the brief. */
  attachReferences: () => void
  say: (role: ChatTurn['role'], text: string, pending?: boolean) => number
  updateMessage: (id: number, patch: Partial<ChatTurn>) => void
}

const ProjectContext = createContext<ProjectApi | null>(null)

const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`
const songs = (list: number[]) => (list.length === 1 ? `song ${list[0]}` : `songs ${listing(list.map(String))}`)
/** The honest reply when a described change is beyond what the preview renderer can show. */
const cantShow = (change: string, code: string) =>
  `I kept ${code} as it is: this preview can't show “${change}”. In the pilot, Nano Banana Pro edits exactly what you describe. Here I can change size, height, colour, haze and brightness, e.g. “narrower, warmer”.`
const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms))
const nextBatch = (gens: Generation[]) => Math.max(0, ...gens.map((g) => g.batch)) + 1

type Store = ReturnType<typeof useStore>

/** Builds the actions for one project. Async work reads fresh state through the store, so it survives switching projects. */
function buildApi(id: string, store: Store): Omit<ProjectApi, keyof ProjectState | 'projectId' | 'daysSinceBrief' | 'path' | 'momentPath'> {
  const get = () => store.ref.current.projects[id]!
  const d = (action: Action) => store.dispatchIn(id, action)

  const say: ProjectApi['say'] = (role, text, pending) => {
    const turnId = store.nextId()
    d({ type: 'chat/add', turn: { id: turnId, role, text, pending } })
    return turnId
  }
  const updateMessage: ProjectApi['updateMessage'] = (turnId, patch) => d({ type: 'chat/update', id: turnId, patch })
  const momentOf = (song: number) => get().moments.find((m) => m.number === song)
  const momentName = (song: number) => `song ${song} · ${momentOf(song)?.title ?? 'Untitled'}`
  const find = (genId: string) => genById(get(), genId)
  const done = (t: Thinking, started: number, output: string): Thinking => {
    const seconds = Math.max(1, Math.round((Date.now() - started) / 1000))
    return { ...t, seconds, tools: t.tools.map((tool) => ({ ...tool, status: 'done' as const, seconds, output })) }
  }

  /** Makes a batch of images for a moment, one at a time, with the agent's reasoning shown as it goes. */
  const runBatch = async (song: number, kind: BatchKind, opts: { baseId?: string; notes?: string[]; prompt?: string; author: Generation['author'] }) => {
    const s = get()
    const moment = momentOf(song)
    if (!moment || s.pending[song]) return
    const existing = gensFor(s, song)
    const base = genById(s, opts.baseId)
    const light = momentLight(s.brief, song, s.moments.length)
    const { drafts, summary } = planBatch(kind, { light, covered: isCovered(s.brief.venueId), existing, base, notes: opts.notes, prompt: opts.prompt })
    if (!drafts.length) return
    const label = base && kind !== 'directions' ? `${BATCH_LABEL[kind]} · #${base.n}` : BATCH_LABEL[kind]
    const started = Date.now()
    const batch = nextBatch(existing)
    d({ type: 'pending/set', song, pending: { label, count: drafts.length, batch } })
    let thinking = batchThinking(s.brief, moment, light, kind, drafts.length, opts.notes, opts.prompt)
    const msg = say('assistant', '', true)
    updateMessage(msg, { thinking })
    const made = materialize(drafts, { project: id, song, existing, author: opts.author })
    for (const [i, g] of made.entries()) {
      d({ type: 'gen/add', gen: await generation.renderImage(g) })
      d({ type: 'pending/set', song, pending: { label, count: drafts.length - i - 1, batch } })
      thinking = { ...thinking, steps: [...thinking.steps, `Rendered #${g.n} · ${g.caption.toLowerCase()}`] }
      updateMessage(msg, { thinking })
    }
    d({ type: 'pending/set', song, pending: undefined })
    d({ type: 'version/add', summary: `Song ${song} · ${label} (${plural(made.length, 'image')})`, author: opts.author === 'you' ? 'You' : 'Gemini' })
    updateMessage(msg, {
      pending: false,
      thinking: { ...done(thinking, started, `${plural(made.length, 'image')} · SynthID watermarked · stored in your project`), title: `Explored song ${song}` },
      text: `${capitalise(momentName(song))}. ${summary} Open the one you like and choose Generate motion.`,
    })
  }

  /** One image made from another (a described change, noted changes, another take), shown as its child. */
  const makeChild = async (parent: Generation, draft: Draft, title: string, reasoning: string, input: string, author: Generation['author']) => {
    const started = Date.now()
    d({ type: 'pending/set', song: parent.song, pending: { label: title, count: 1, batch: nextBatch(gensFor(get(), parent.song)), of: parent.id } })
    const thinking: Thinking = {
      title,
      reasoning,
      steps: [`Read #${parent.n} · ${parent.title}`, 'Kept the venue limits and no-gos'],
      tools: [{ name: 'edit_still', summary: 'Nano Banana Pro · 1 image', input, status: 'running' }],
    }
    const msg = say('assistant', '', true)
    updateMessage(msg, { thinking })
    await sleep(1400 + Math.random() * 1200)
    const [child] = materialize([draft], { project: id, song: parent.song, existing: gensFor(get(), parent.song), author })
    d({ type: 'gen/add', gen: child! })
    d({ type: 'pending/set', song: parent.song, pending: undefined })
    d({ type: 'focus/set', song: parent.song, genId: child!.id })
    return { child: child!, msg, thinking: done(thinking, started, '1 image · SynthID watermarked') }
  }

  const changeDraft = (parent: Generation, tweaks: Generation['spec']['tweaks'], caption: string, source: Draft['source']): Draft => {
    const spec = { ...parent.spec, tweaks }
    return { spec, title: parent.title, caption, source, parentId: parent.id, reworked: true }
  }

  const refine: ProjectApi['refine'] = async (genId, change) => {
    const parent = find(genId)
    if (!parent || get().pending[parent.song]) return
    const { tweaks, applied } = tweaksFrom(change, parent.spec.tweaks)
    if (!applied.length) {
      say('assistant', cantShow(change, `#${parent.n}`))
      return
    }
    const shown = applied
    const { child, msg, thinking } = await makeChild(
      parent,
      changeDraft(parent, tweaks, capitalise(listing(shown)), 'edit'),
      `Changing #${parent.n}`,
      `You asked to “${change}”. I’ll change only that and keep the rest of #${parent.n}.`,
      `Edit #${parent.n} (${parent.title}): ${change}. Keep the structure, materials and lighting otherwise.`,
      'you',
    )
    d({ type: 'version/add', summary: `Song ${parent.song} #${child.n}: “${change}” on #${parent.n}`, author: 'You' })
    updateMessage(msg, { pending: false, thinking, text: `Here’s #${child.n}: #${parent.n} with ${listing(shown)}. #${parent.n} is still there if you prefer it.` })
  }

  const addAnnotation: ProjectApi['addAnnotation'] = (genId, text, at) => {
    const g = find(genId)
    if (!g) return
    const list = g.annotations ?? []
    d({ type: 'gen/patch', id: genId, patch: { annotations: [...list, { number: (list.at(-1)?.number ?? 0) + 1, text, ...(at ?? {}) }] } })
  }

  const removeAnnotation: ProjectApi['removeAnnotation'] = (genId, number) => {
    const g = find(genId)
    if (!g) return
    // Renumber, so the pins always read 1, 2, 3…
    const rest = (g.annotations ?? []).filter((a) => a.number !== number).map((a, i) => ({ ...a, number: i + 1 }))
    d({ type: 'gen/patch', id: genId, patch: { annotations: rest.length ? rest : undefined } })
  }

  const applyAnnotations: ProjectApi['applyAnnotations'] = async (genId) => {
    const parent = find(genId)
    const list = parent?.annotations
    if (!parent || !list?.length || get().pending[parent.song]) return
    // Each noted change is read for what the preview can show; the reply says which ones it could and couldn't.
    let tweaks = parent.spec.tweaks ?? {}
    const shown: string[] = []
    const notShown: string[] = []
    for (const a of list) {
      const r = tweaksFrom(a.text, tweaks)
      tweaks = r.tweaks
      if (r.applied.length) r.applied.forEach((x) => !shown.includes(x) && shown.push(x))
      else notShown.push(a.text)
    }
    if (!shown.length) {
      say('assistant', cantShow(list.map((a) => a.text).join('”, “'), `#${parent.n}`))
      return
    }
    d({ type: 'gen/patch', id: genId, patch: { annotations: undefined } })
    const { child, msg, thinking } = await makeChild(
      parent,
      changeDraft(parent, tweaks, capitalise(listing(shown)), 'edit'),
      `Applying ${plural(list.length, 'change')} to #${parent.n}`,
      `You marked ${plural(list.length, 'change')} on #${parent.n}. I’ll make ${list.length === 1 ? 'it' : 'them'} where you pinned ${list.length === 1 ? 'it' : 'them'} and keep everything else.`,
      `Edit #${parent.n} (${parent.title}):\n${list.map((a) => `${a.number}. ${a.text}${a.x !== undefined ? ` (at ${Math.round(a.x)}%, ${Math.round(a.y ?? 0)}% of the frame)` : ''}`).join('\n')}\nKeep everything else.`,
      'you',
    )
    d({ type: 'version/add', summary: `Song ${parent.song} #${child.n}: ${plural(list.length, 'change')} on #${parent.n}`, author: 'You' })
    updateMessage(msg, {
      pending: false,
      thinking,
      text: `#${child.n} is #${parent.n} with ${listing(shown)}.${notShown.length ? ` This preview can’t show “${notShown.join('”, “')}”; in the pilot, the model applies it.` : ''} #${parent.n} is still there if you prefer it.`,
    })
  }

  const anotherTake: ProjectApi['anotherTake'] = async (genId) => {
    const parent = find(genId)
    if (!parent || get().pending[parent.song]) return
    const next = take(parent.n + gensFor(get(), parent.song).length, parent.spec.tweaks)
    const draft = changeDraft(parent, next.tweaks, '', 'take')
    draft.caption = capitalise(describeTweaks(draft.spec.tweaks) || 'A new take')
    draft.spec = { ...draft.spec, seed: (parent.spec.seed * 31 + 97) % 997 }
    const { child, msg, thinking } = await makeChild(
      parent,
      draft,
      `Another take on #${parent.n}`,
      `A new take on #${parent.n}: same idea and brief, different execution.`,
      `New take on #${parent.n} (${parent.title}). Same concept, new details.`,
      'you',
    )
    d({ type: 'version/add', summary: `Song ${parent.song} #${child.n}: another take on #${parent.n}`, author: 'You' })
    updateMessage(msg, { pending: false, thinking, text: `Here’s #${child.n}, another take on #${parent.n}: ${child.caption.toLowerCase()}. #${parent.n} is still there if you prefer it.` })
  }

  /** Renders a moment's clip. Pass the look when it was just chosen (the store hasn't caught up yet). */
  const renderClip = async (song: number, chosen?: Generation) => {
    const look = chosen ?? lookFor(get(), song)
    if (!look) return
    const key = clipKey(look.id, song)
    d({ type: 'clip/set', key, slot: { status: 'generating' } })
    const clip = await generation.generateMotion(look, song)
    d({ type: 'clip/set', key, slot: { status: 'ready', clip } })
  }

  const chooseLook: ProjectApi['chooseLook'] = (genId) => {
    const s = get()
    const g = find(genId)
    if (!g) return
    d({ type: 'look/set', song: g.song, id: genId })
    d({ type: 'version/add', summary: `Song ${g.song} · #${g.n} put into motion (${g.caption.toLowerCase()})`, author: 'You' })
    if (!s.clips[clipKey(genId, g.song)]) void renderClip(g.song, g)
    const after = { ...s, looks: { ...s.looks, [g.song]: genId } }
    const next = nextOpenMoment(after, g.song)
    const left = after.moments.filter((m) => momentStatus(after, m.number) !== 'chosen').length
    say(
      'assistant',
      [
        `You put #${g.n} into motion for ${momentName(g.song)}. Its eight-second clip is at the top of the page.`,
        next ? `${plural(left, 'song')} to go, starting with ${momentName(next.number)}.` : s.handoff ? `Every song is in motion. Generate the handoff again on the show board to include this look.` : 'Every song is in motion. Generate the handoff on the show board when you’re ready.',
      ]
        .filter(Boolean)
        .join(' '),
    )
  }

  return {
    say,
    updateMessage,
    patchBrief: (patch, source = 'you') => {
      const s = get()
      d({ type: 'brief/patch', patch, source })
      // A new venue: check the looks in motion against it straight away.
      if (!patch.venueId || patch.venueId === s.brief.venueId) return
      const brief = { ...s.brief, ...patch }
      const failing = s.moments.flatMap((m) => {
        const look = lookFor(s, m.number)
        return look && issues(venueChecks(look.spec, brief, look.reworked)).length ? [m.number] : []
      })
      if (!failing.length) return
      say('assistant', `The venue is now ${venueOf(patch.venueId).name}. The looks for ${songs(failing)} have issues there (sample specs); open ${failing.length === 1 ? 'it' : 'them'} to see what to change.`)
    },
    answerSetup: async (text) => {
      const s = get()
      say('user', text)
      // The opening card comes first: it sets up most of the brief in one go.
      if (!s.profiled && s.messages.some((m) => m.profile === 'ask')) {
        say('assistant', 'Answer the three questions above first, or skip them and I’ll suggest something.')
        return
      }
      const question = QUESTIONS[s.setupStep]
      if (!question) {
        say('assistant', 'The brief is ready. Generate the show when you’re ready, or tell me what to change.')
        return
      }
      const result = applyAnswer(question.section, text, s.brief, s.meta.event)
      const replyId = say('assistant', '', true)
      const thinking = { title: 'Updating the brief', reasoning: `You answered the question about the ${question.section}.`, steps: ['Read your answer', result.summary], tools: [] }
      updateMessage(replyId, { thinking })
      await sleep(900)
      if (result.patch) d({ type: 'brief/patch', patch: result.patch, source: 'agent' })
      d({ type: 'brief/reveal', sections: [question.section] })
      const { index, question: next, left } = nextQuestion(s.setupStep + 1)
      d({ type: 'setup/step', step: index >= 0 ? index : QUESTIONS.length })
      updateMessage(replyId, { pending: false, thinking: { ...thinking, seconds: 1 }, text: `${result.summary} ${next ? next.ask : closing(left)}`, suggestions: next?.suggestions })
    },
    answerProfile: async (answers) => {
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
    },
    revealBrief: () => {
      d({ type: 'brief/reveal', sections: ALL_SECTIONS })
      // The store updates after this call returns, so read readiness as it will be with every section shown.
      const s = get()
      const shown = Object.fromEntries(Object.entries(s.provenance).map(([k, v]) => [k, v === 'pending' ? 'blank' : v])) as typeof s.provenance
      const left = briefReadiness({ ...s, provenance: shown }).left.map((i) => i.label.toLowerCase())
      say('assistant', left.length ? `Sure, use the form in the brief. Still to set: ${listing(left)}. You can keep answering here too.` : 'The brief is ready. Generate the show when you’re ready.')
    },
    startProject: () => {
      const s = get()
      d({ type: 'brief/reveal', sections: ALL_SECTIONS })
      d({ type: 'phase/set', phase: 'loop' })
      d({ type: 'meta/patch', patch: { briefDate: Date.now() } })
      const moments = s.moments.length ? s.moments : draftMoments(s.brief)
      d({ type: 'moments/set', moments })
      d({ type: 'version/add', summary: `Show generated · ${plural(moments.length, 'key moment')} drafted from the setlist`, author: 'Gemini' })
      const first = moments[0]
      if (!first) return undefined
      say(
        'assistant',
        `I drafted ${plural(moments.length, 'key moment')} from the setlist: ${listing(moments.map((m) => `${m.number} ${m.title}`))}. You can change them on the show board. Starting with song ${first.number} · ${first.title}, which plays in ${TIME_LABEL[momentLight(s.brief, first.number, moments.length)].toLowerCase()}.`,
      )
      // The batch reads the moments from the store, which has them once this render lands.
      window.setTimeout(() => void runBatch(first.number, 'directions', { author: 'agent' }), 300)
      return first.number
    },
    addMoment: (title, intent) => {
      const moments = get().moments
      d({ type: 'moments/set', moments: [...moments, { number: (moments.at(-1)?.number ?? 0) + 1, title, intent }] })
    },
    removeMoment: (song) => d({ type: 'moments/remove', song }),
    explore: (song, kind, baseId, prompt, echo = true) => {
      if (prompt && echo) say('user', prompt)
      return runBatch(song, kind, { baseId, prompt, author: 'you' })
    },
    refine,
    addAnnotation,
    removeAnnotation,
    applyAnnotations,
    anotherTake,
    toggleDismissed: (genId) => {
      const g = find(genId)
      if (!g) return
      d({ type: 'gen/patch', id: genId, patch: { dismissed: !g.dismissed } })
    },
    chooseLook,
    setFocus: (song, genId) => {
      const f = get().focus
      if (f?.song !== song || f.genId !== genId) d({ type: 'focus/set', song, genId })
    },
    generateClip: (song) => renderClip(song),
    editClip: async (song, instruction, echo = true) => {
      const look = lookFor(get(), song)
      const key = look ? clipKey(look.id, song) : ''
      const slot = get().clips[key]
      if (!look || slot?.status !== 'ready') return
      const title = momentOf(song)?.title ?? `Song ${song}`
      const started = Date.now()
      if (echo) say('user', instruction)
      d({ type: 'clip/set', key, slot: { status: 'generating', previous: slot.clip } })
      let thinking = motionThinking('edit', song, title, instruction)
      const msg = say('assistant', '', true)
      updateMessage(msg, { thinking })
      const clip: MotionClip = await generation.editMotion(look, slot.clip, instruction)
      d({ type: 'clip/set', key, slot: { status: 'ready', clip } })
      d({ type: 'version/add', summary: `Song ${song} · ${title} clip: “${instruction}”`, author: 'You' })
      thinking = { ...done(thinking, started, `Clip v${clip.version} · 8 s · SynthID watermarked`), title: `Edited song ${song}` }
      updateMessage(msg, { pending: false, thinking, text: `Done. The song ${song} clip now has “${instruction}” (clip v${clip.version}). The earlier version is kept.` })
    },
    generateHandoff: () => {
      const s = get()
      if (!showComplete(s)) return
      const songs = s.moments.map((moment) => {
        const lookId = s.looks[moment.number]!
        const slot = s.clips[clipKey(lookId, moment.number)]
        return { moment, lookId, clip: slot?.status === 'ready' ? slot.clip : undefined }
      })
      const clips = songs.filter((x) => x.clip).length
      const before = s.handoff?.version
      const version = (before ?? 0) + 1
      d({ type: 'handoff/set', handoff: { version, at: clock(), songs, exported: false } })
      d({ type: 'version/add', summary: `Handoff v${version} generated · ${plural(songs.length, 'song')}, ${plural(clips, 'clip')}`, author: 'You' })
      say(
        'assistant',
        `${before ? `Handoff v${version} is ready with your changes.` : 'The handoff is ready.'} ${plural(songs.length, 'song')}, each with its look, and ${plural(clips, 'clip')}, organised for each team: staging and rigging, lighting, video and LED, camera, and rights. Export the package when you’re ready.`,
      )
    },
    saveShow: () => {
      const s = get()
      if (s.handoff && handoffOutOfDate(s)) {
        say('assistant', `Saved. The handoff still shows v${s.handoff.version}, without your latest changes. Generate the handoff again to include them.`)
      }
    },
    exportPackage: () => {
      const s = get()
      if (!s.handoff || s.handoff.exported) return
      d({ type: 'export/done' })
      d({ type: 'version/add', summary: 'Package sent to production', author: 'You' })
      say(
        'assistant',
        `Handoff v${s.handoff.version} is with the production team: ${plural(s.handoff.songs.length, 'song')} with their looks and clips, and the cue sheet. Three things are still with legal before anything is built: C2PA credentials per model, the indemnity scope for GA Gemini and Veo models, and cover for the preview clip edits. Real venue specs replace the samples.`,
      )
    },
    attachReferences: () => {
      d({ type: 'chat/add', turn: { id: store.nextId(), role: 'user', text: 'Here’s the mood board.', attachments: true } })
      d({ type: 'brief/patch', patch: { referenceCount: get().brief.referenceCount + 3 }, source: 'you' })
      say('assistant', 'Got 3 reference images. I added them to the visual direction and will use them for every image and clip.')
    },
  }

  /** The next chat question that's still open (the optional no-gos), from `from` on. */
  function nextQuestion(from: number) {
    const now = briefReadiness(get())
    const index = QUESTIONS.findIndex((q, i) => i >= from && !now.items.find((it) => it.key === q.section)?.done)
    return { index, question: index >= 0 ? QUESTIONS[index] : undefined, left: now.left.map((i) => i.label.toLowerCase()) }
  }
  function closing(left: string[]) {
    return left.length ? `Still missing in the brief: ${listing(left)}.` : DONE_TEXT
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
            daysSinceBrief: Math.max(0, Math.round((Date.now() - project.meta.briefDate) / 86_400_000)),
            path: (step, query) => `/p/${id}/${step}${query ? `?${query}` : ''}`,
            momentPath: (song) => `/p/${id}/m/${song}`,
          }
        : null,
    [project, actions, id],
  )

  // A clip that was rendering when the page reloaded was dropped (see settle): start it again, once per project open.
  useEffect(() => {
    const now = store.ref.current.projects[id]
    if (!now) return
    for (const m of now.moments) {
      const look = lookFor(now, m.number)
      if (look && !now.clips[clipKey(look.id, m.number)]) void actions.generateClip(m.number)
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [id])

  if (!api) return null
  return <ProjectContext value={api}>{children}</ProjectContext>
}

// eslint-disable-next-line react-refresh/only-export-components
export function useProject() {
  const ctx = useContext(ProjectContext)
  if (!ctx) throw new Error('useProject must be used inside ProjectScope')
  return ctx
}
