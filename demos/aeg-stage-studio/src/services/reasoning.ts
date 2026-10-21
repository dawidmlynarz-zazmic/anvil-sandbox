import { venues } from '~/mocks/venues'
import { CROWD_LABEL, TIME_LABEL, VIEW_LABEL, type Brief, type Thinking, type StillsRequest } from '~/state/types'

type Settings = Omit<StillsRequest, 'round'>

/** The prompt Gemini would draft from the brief. Shown to the user so they can see what the image model was asked. */
export function draftPrompt(brief: Brief, s: Settings) {
  const venue = venues.find((v) => v.id === brief.venueId)?.name ?? 'the stage'
  return [
    `Concept still of the ${venue} stage.`,
    `Style: ${brief.keywords.join(', ').toLowerCase()}.`,
    `Lighting: ${TIME_LABEL[s.timeOfDay].toLowerCase()}. Crowd: ${CROWD_LABEL[s.crowd].toLowerCase()}. Camera: ${VIEW_LABEL[s.view].toLowerCase()}.`,
    `Avoid: ${brief.constraints.noGo.toLowerCase()}.`,
  ].join('\n')
}

export function roundThinking(brief: Brief, s: Settings, round: number, pins: number): Thinking {
  const venue = venues.find((v) => v.id === brief.venueId)?.name ?? 'the venue'
  return {
    title: `Planning round ${round}`,
    reasoning: `You asked for ${brief.keywords.slice(0, 3).join(', ').toLowerCase()}. ${TIME_LABEL[s.timeOfDay]} matches your slot (${brief.slot.note.toLowerCase()}), so I’ll light every concept for that moment. ${pins ? `You selected ${pins} concept${pins > 1 ? 's' : ''}, so I’ll treat ${pins > 1 ? 'them' : 'it'} as the reference and vary the rest.` : 'Nothing is selected yet, so I’ll explore four different structures.'}`,
    steps: [`Loaded ${venue} specs`, 'Checked the artist’s no-go list', 'Drafted four prompts from the brief'],
    tools: [
      {
        name: 'generate_stills',
        summary: 'Nano Banana Pro · 4 images',
        input: draftPrompt(brief, s),
        status: 'running',
      },
    ],
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
      ? `You asked to “${instruction}”. I’ll keep the stage, lighting and camera from the current clip and change only that, so the rest of the cue stays as the artist saw it.`
      : `Song ${song} (${title}) needs its own clip. I’ll take the chosen concept, use the song’s cue from the brief, and render eight seconds at the matching time of day.`,
    steps: edit
      ? ['Read the current clip and its cue', 'Translated your words into an edit', 'Kept everything else unchanged']
      : ['Read the cue for this song', 'Applied the chosen concept’s look', 'Drafted a motion prompt'],
    tools: [
      {
        name: edit ? 'edit_motion' : 'generate_motion',
        summary: edit ? 'Gemini Omni Flash (preview) · 8 s' : 'Veo 3.1 · 8 s',
        input: edit ? `Edit the existing clip: ${instruction}\nKeep everything else the same.` : `Stage concept in motion for song ${song}, “${title}”.\n8 seconds, 16:9, cinematic, no strobe above 3 Hz.`,
        status: 'running',
      },
    ],
  }
}
