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
  const { phase, rounds, motionStills, status } = useProject()
  // Read on every render, so "Reset the demo" (which clears the flag) brings the hint back.
  const [, setDismissed] = useState(false)
  if (readDismissed()) return null

  const next =
    phase === 'setup'
      ? { title: 'Next: finish the brief', text: 'Answer the agent’s questions, or fill in the brief yourself, then start the project.' }
      : status === 'approved'
        ? { title: 'Next: hand off', text: 'Export the package for the production team.' }
        : !rounds.length
          ? { title: 'Next: generate round 1', text: 'Start the loop from the brief.' }
          : status === 'awaiting-artist'
            ? { title: 'Waiting for the artist', text: 'Their comments will appear in Review. You can keep working meanwhile.' }
            : status === 'feedback'
              ? { title: 'Next: sign off', text: 'Go through the artist’s comments in Review, then approve or request changes.' }
              : !motionStills.length
                ? { title: 'Next: pick concepts', text: 'Tick the concepts you like and put them into motion.' }
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
    <div className="pointer-events-none absolute end-6 bottom-20 z-10 w-72">
      <Alert size="xs" tone="agent" role="status" onDismiss={dismiss} className="shadow-elevation-raised pointer-events-auto">
        <Icon icon={LightbulbIcon} />
        <AlertTitle>{next.title}</AlertTitle>
        <AlertDescription>{next.text}</AlertDescription>
      </Alert>
    </div>
  )
}
