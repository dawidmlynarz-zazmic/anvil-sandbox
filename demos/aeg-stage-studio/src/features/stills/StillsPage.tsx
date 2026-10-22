import { useNavigate, useSearchParams } from 'react-router-dom'
import { Alert, AlertDescription, AlertTitle } from '@anvil/components/ui/alert'
import { Badge } from '@anvil/components/ui/badge'
import { Button } from '@anvil/components/ui/button'
import { EmptyState, EmptyStateDescription, EmptyStateHeader, EmptyStateMedia, EmptyStateTitle } from '@anvil/components/ui/empty-state'
import { ArrowRightIcon, Icon, ImageIcon, RefreshCwIcon } from '@anvil/components/ui/icon'
import { IllustrativeNote } from '~/components/IllustrativeNote'
import { STEP_CONTENT } from '~/components/layout'
import { StepFooter } from '~/components/StepFooter'
import { useProject } from '~/state/ProjectContext'
import { ConceptCardPending, ConceptTile } from './ConceptTile'
import { NewRoundDialog } from './NewRoundDialog'
import { SceneSettings } from './SceneSettings'

const CONCEPT_LETTERS = ['A', 'B', 'C', 'D']

export function StillsPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { rounds, currentRound, selected, feedback, briefRevision, generateRound, setRoundView, proceedToMotion, path } = useProject()

  const requested = Number(params.get('round'))
  const round = rounds.find((r) => r.number === requested) ?? currentRound
  const isLatest = round?.number === currentRound?.number

  if (!round) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState>
          <EmptyStateMedia variant="icon">
            <Icon icon={ImageIcon} />
          </EmptyStateMedia>
          <EmptyStateHeader>
            <EmptyStateTitle>No concepts yet</EmptyStateTitle>
            <EmptyStateDescription>Stage concepts are generated from the brief, four at a time. Check the brief, then start the project.</EmptyStateDescription>
          </EmptyStateHeader>
          <Button variant="outline" intent="neutral" onClick={() => navigate(path('brief'))}>
            Go to the brief
          </Button>
        </EmptyState>
      </div>
    )
  }

  const nextRound = rounds.length + 1
  const generate = (settings = round.settings, direction = '', useSelected = true) => {
    setParams({})
    void generateRound(settings, `Round ${nextRound}`, [], direction, useSelected)
  }
  const stale = !!currentRound?.done && currentRound.briefRevision < briefRevision

  return (
    <section aria-labelledby="stills-title" className="flex h-full min-w-0 flex-col">
      <div className="step-scroll relative min-h-0 flex-1 overflow-y-auto p-6">
        <div className={`${STEP_CONTENT} gap-5`}>
          <div className="flex flex-wrap items-start justify-between gap-4">
            <div className="flex max-w-2xl flex-col gap-2">
              <div className="flex items-center gap-3">
                <h1 id="stills-title" tabIndex={-1} className="type-heading-2xl outline-none">
                  Concept stills
                </h1>
                <Badge tone="agent" variant="subtle">
                  Round {round.number}
                </Badge>
              </div>
              <p className="text-muted-foreground type-text-sm-normal">
                Stage concepts generated from your brief, a round at a time. Select the ones to take into motion, annotate
                what should change on any concept, or generate new concepts when none is right. Every version is kept.
              </p>
              <IllustrativeNote kind="stills" />
            </div>
            <NewRoundDialog
              nextRound={nextRound}
              current={round.settings}
              selectedCount={selected.length}
              disabled={!currentRound?.done}
              onGenerate={generate}
            />
          </div>

          {stale && (
            <Alert
              tone="warning"
              role="status"
              action={
                <Button size="xs" variant="outline" intent="neutral" onClick={() => generate()}>
                  Generate round {nextRound}
                </Button>
              }
            >
              <Icon icon={RefreshCwIcon} />
              <AlertTitle>The brief changed since round {currentRound!.number}</AlertTitle>
              <AlertDescription>These concepts don’t reflect your latest edits. Generate a new round to use them.</AlertDescription>
            </Alert>
          )}

          <section aria-label="View" className="flex flex-wrap items-end justify-between gap-3">
            <div className="flex flex-col gap-1.5">
              <SceneSettings settings={round.settings} disabled={!round.done} onChange={(s) => setRoundView(round.number, s)} />
              <p className="text-muted-foreground type-text-xs-normal">
                See these concepts at another time, crowd or camera. The designs stay the same.
                {feedback.length > 0 && ` ${feedback.length} note${feedback.length === 1 ? '' : 's'} from the chat will shape the next round.`}
              </p>
            </div>
          </section>

          {!isLatest && (
            <p className="text-muted-foreground type-text-sm-normal">
              You’re looking back at round {round.number}. You can still select from it; changes happen in the latest round.
            </p>
          )}

          <p className="sr-only" aria-live="polite">
            {round.done ? `Round ${round.number} ready: 4 concepts` : `Rendering round ${round.number}: ${round.stills.length} of 4 concepts`}
          </p>
          <ul
            className="flex flex-col gap-6"
            aria-label={`Round ${round.number} concepts`}
            aria-busy={!round.done}
          >
            {CONCEPT_LETTERS.map((letter, i) => {
              const still = round.stills[i]
              return (
                <li key={letter} className="min-w-0">
                  {still ? <ConceptTile still={still} readOnly={!isLatest} /> : <ConceptCardPending title={`${letter}${round.number}`} />}
                </li>
              )
            })}
          </ul>
        </div>
      </div>
      <StepFooter note="Selected concepts carry into Motion." status={selected.length ? `Selected: ${rounds.flatMap((r) => r.stills).filter((st) => selected.includes(st.id)).map((st) => st.title.split(' · ')[0]).join(', ')}` : 'Nothing selected yet'}>
        <Button
          onClick={() => {
            proceedToMotion()
            navigate(path('motion'))
          }}
          disabled={selected.length === 0}
        >
          Put into motion
          <Icon icon={ArrowRightIcon} />
        </Button>
      </StepFooter>
    </section>
  )
}
