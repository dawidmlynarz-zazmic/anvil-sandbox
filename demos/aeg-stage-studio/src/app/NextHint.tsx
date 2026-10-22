import { useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@anvil/components/ui/alert'
import { Icon, LightbulbIcon } from '@anvil/components/ui/icon'
import { useProject } from '~/state/ProjectContext'

export const NEXT_HINT_KEY = 'stage-studio:next-hint-dismissed'

const readDismissed = () => {
  try {
    return localStorage.getItem(NEXT_HINT_KEY) === '1'
  } catch {
    return false
  }
}

/**
 * The one thing to do next, floating above the step's main button (bottom right). Dismissing it hides it for good,
 * in every project, until “Reset the demo”.
 */
export function NextHint() {
  const { phase, rounds, selected, motionStills, status, sentVersion, exported } = useProject()
  // Read on every render, so "Reset the demo" (which clears the flag) brings the hint back.
  const [, setDismissed] = useState(false)
  if (readDismissed()) return null

  // In motion already: the selection is exactly what's in Motion now.
  const inMotion = selected.length > 0 && selected.every((id) => motionStills.includes(id))
  const next =
    phase === 'setup'
      ? { title: 'Next: finish the brief', text: 'Answer the agent’s questions, or fill in the brief yourself, then start the project.' }
      : status === 'approved'
        ? exported
          ? { title: 'Done: it’s with production', text: 'The package went to the production team. Start the next show from the projects panel.' }
          : { title: 'Next: hand off', text: 'Export the package for the production team.' }
        : !rounds.length
          ? { title: 'Next: generate round 1', text: 'Start the loop from the brief.' }
          : status === 'awaiting-artist'
            ? { title: 'Waiting for the artist', text: 'Their comments will appear in Review. You can keep working meanwhile.' }
            : status === 'feedback'
              ? { title: 'Next: sign off', text: 'Go through the artist’s comments in Review, then approve or request changes.' }
              : !selected.length
                ? { title: 'Next: pick concepts', text: 'Select the concepts you like, then put them into motion.' }
                : !inMotion
                  ? sentVersion !== null
                    ? { title: 'Next: put the revision into motion', text: 'The revised concept is selected. Put it into motion, then send it to the artist.' }
                    : { title: 'Next: put into motion', text: 'Your selection is ready. Put it into motion to see each key moment.' }
                  : { title: 'Next: send to the artist', text: 'When the clips look right, send concepts and motion from Motion.' }

  const dismiss = () => {
    setDismissed(true)
    try {
      localStorage.setItem(NEXT_HINT_KEY, '1')
    } catch {
      // Without storage it only stays hidden until the next reload.
    }
  }

  return (
    <div data-next-hint className="pointer-events-none absolute end-6 bottom-20 z-10 w-72">
      <Alert size="xs" tone="agent" role="status" onDismiss={dismiss} className="shadow-elevation-raised pointer-events-auto">
        <Icon icon={LightbulbIcon} />
        <AlertTitle>{next.title}</AlertTitle>
        <AlertDescription>{next.text}</AlertDescription>
      </Alert>
    </div>
  )
}
