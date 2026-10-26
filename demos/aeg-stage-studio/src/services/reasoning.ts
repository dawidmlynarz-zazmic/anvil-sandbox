import { venueOf } from '~/mocks/venues'
import { slotNote } from './light'
import { TIME_LABEL, type Brief, type SetlistMoment, type ShowSet, type Thinking, type TimeOfDay } from '~/state/types'
import type { BatchKind } from './explore'
import { lowerFirst } from './shapes'

/** The prompt Gemini would draft from the brief and the moment. Shown so the user can see what the image model was asked. */
export function draftPrompt(brief: Brief, moment: SetlistMoment, light: TimeOfDay, set: ShowSet | null) {
  return [
    `Concept still of the ${venueOf(brief.venueId).name} stage, song ${moment.number} (“${moment.title}”): ${moment.intent.toLowerCase()}.`,
    `Style: ${brief.keywords.join(', ').toLowerCase()}.`,
    set ? `Keep the stage set: ${lowerFirst(set.title)}, same structure and size. Vary only the light, LED content and haze.` : 'Explore the stage structure freely.',
    `Lighting: ${TIME_LABEL[light].toLowerCase()}.`,
    `Avoid: ${brief.constraints.noGo.toLowerCase() || 'nothing listed'}.`,
  ].join('\n')
}

const ASK: Record<BatchKind, string> = {
  directions: 'new directions',
  more: 'more like the image you picked',
  angles: 'the same design from other camera positions',
  light: 'the same design in other light',
}

export function batchThinking(brief: Brief, moment: SetlistMoment, light: TimeOfDay, set: ShowSet | null, kind: BatchKind, count: number, notes: string[] = []): Thinking {
  return {
    title: `Exploring song ${moment.number}`,
    reasoning: `Song ${moment.number} (${moment.title}) plays in ${TIME_LABEL[light].toLowerCase()} (${slotNote(brief).toLowerCase()}). You asked for ${ASK[kind]}. ${set ? 'The stage set is locked, so I’ll keep its structure and vary the look.' : 'The stage set isn’t locked yet, so the structure can still change.'}`,
    steps: [`Loaded ${venueOf(brief.venueId).name}`, 'Checked the artist’s no-go list', ...notes.map((n) => `Read the artist’s comment: “${n}”`), `Drafted ${count} prompts`],
    tools: [{ name: 'generate_stills', summary: `Nano Banana Pro · ${count} images`, input: draftPrompt(brief, moment, light, set), status: 'running' }],
  }
}

export function briefThinking(message: string, keyword: string): Thinking {
  return {
    title: 'Updating the brief',
    reasoning: `You wrote “${message}”. I’ll add the part that sets the look as a visual-direction keyword and leave the rest of the brief as it is.`,
    steps: ['Read your message', keyword ? `Added “${keyword}” to the visual direction` : 'Found nothing new to add', 'Kept venue, slot and constraints unchanged'],
    tools: [],
  }
}

export function motionThinking(kind: 'generate' | 'edit', song: number, title: string, instruction?: string): Thinking {
  const edit = kind === 'edit'
  return {
    title: edit ? `Editing song ${song}` : `Planning song ${song}`,
    reasoning: edit
      ? `You asked to “${instruction}”. I’ll keep the stage, lighting and camera from the current clip and change only that.`
      : `Song ${song} (${title}) has a look now. I’ll put it in motion with the song’s cue and render eight seconds in the light the song plays in.`,
    steps: edit
      ? ['Read the current clip and its cue', 'Translated your words into an edit', 'Kept everything else unchanged']
      : ['Read the cue for this song', 'Applied the chosen look', 'Drafted a motion prompt'],
    tools: [
      {
        name: edit ? 'edit_motion' : 'generate_motion',
        summary: edit ? 'Gemini Omni Flash (preview) · 8 s' : 'Veo 3.1 · 8 s',
        input: edit ? `Edit the existing clip: ${instruction}\nKeep everything else the same.` : `Stage look in motion for song ${song}, “${title}”.\n8 seconds, 16:9, cinematic, no strobe above 3 Hz.`,
        status: 'running',
      },
    ],
  }
}
