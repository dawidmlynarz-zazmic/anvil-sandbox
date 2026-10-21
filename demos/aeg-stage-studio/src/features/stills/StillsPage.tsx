import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Badge } from '@anvil/components/ui/badge'
import { Button } from '@anvil/components/ui/button'
import { EmptyState, EmptyStateDescription, EmptyStateHeader, EmptyStateMedia, EmptyStateTitle } from '@anvil/components/ui/empty-state'
import { Icon, ArrowRightIcon, ImageIcon, LayoutGridIcon, ListIcon, RefreshCwIcon, SparklesIcon } from '@anvil/components/ui/icon'
import { Alert, AlertDescription, AlertTitle } from '@anvil/components/ui/alert'
import { ToggleGroup, ToggleGroupItem } from '@anvil/components/ui/toggle-group'
import { StepFooter } from '~/components/StepFooter'
import { useProject } from '~/state/ProjectContext'
import type { StillsRequest } from '~/state/types'
import { CompareDialog } from './CompareDialog'
import { ConceptCard, PendingConcept } from './ConceptCard'
import { SceneSettings } from './SceneSettings'

const CONCEPT_LETTERS = ['A', 'B', 'C', 'D']
const DEFAULT_SETTINGS: Omit<StillsRequest, 'round'> = { timeOfDay: 'golden-hour', crowd: 'full', view: 'front-of-house' }

export function StillsPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { rounds, currentRound, selected, comments, feedback, briefRevision, toggleSelect, setComment, removeComment, generateRound, proceedToMotion, path } = useProject()
  const [draft, setDraft] = useState(currentRound?.settings ?? DEFAULT_SETTINGS)
  const [layout, setLayout] = useState<'list' | 'grid'>('list')

  const requested = Number(params.get('round'))
  const round = rounds.find((r) => r.number === requested) ?? currentRound
  const isLatest = round?.number === currentRound?.number
  const selectedStills = rounds.flatMap((r) => r.stills).filter((s) => selected.includes(s.id))

  if (!round) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState>
          <EmptyStateMedia variant="icon">
            <Icon icon={ImageIcon} />
          </EmptyStateMedia>
          <EmptyStateHeader>
            <EmptyStateTitle>No concepts yet</EmptyStateTitle>
            <EmptyStateDescription>
              Each round gives you four stage concepts to compare. Check the brief, then generate round 1.
            </EmptyStateDescription>
          </EmptyStateHeader>
          <Button variant="outline" intent="neutral" onClick={() => navigate(path('brief'))}>
            Go to the brief
          </Button>
        </EmptyState>
      </div>
    )
  }

  const nextRound = rounds.length + 1
  const generate = () => {
    setParams({})
    void generateRound(draft, `Round ${nextRound}`)
  }
  const next = () => {
    proceedToMotion()
    navigate(path('motion'))
  }

  return (
    <section aria-label="Concept stills" className="flex h-full min-w-0 flex-col">
      <div className="relative min-h-0 flex-1 overflow-y-auto p-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <div className="flex items-start justify-between gap-4">
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <h1 tabIndex={-1} className="type-heading-2xl outline-none">Concept stills</h1>
                <Badge tone="agent" variant="subtle">
                  Round {round.number}
                </Badge>
              </div>
              <p className="text-muted-foreground type-text-sm-normal">
                Four stage concepts from your brief. Tick the ones you want to take into motion. Add a note to a
                concept to steer the next round. Nothing here is final.
              </p>
            </div>
            <div className="flex shrink-0 items-center gap-2">
              <ToggleGroup
                type="single"
                variant="outline"
                size="sm"
                value={layout}
                onValueChange={(v) => v && setLayout(v as 'list' | 'grid')}
                aria-label="Layout"
              >
                <ToggleGroupItem value="list" aria-label="One under another">
                  <Icon icon={ListIcon} />
                </ToggleGroupItem>
                <ToggleGroupItem value="grid" aria-label="Side by side">
                  <Icon icon={LayoutGridIcon} />
                </ToggleGroupItem>
              </ToggleGroup>
              <CompareDialog stills={selectedStills} />
            </div>
          </div>

          {currentRound && currentRound.done && currentRound.briefRevision < briefRevision && (
            <Alert
              tone="warning"
              role="status"
              action={
                <Button size="xs" variant="outline" intent="neutral" onClick={generate}>
                  Generate round {nextRound}
                </Button>
              }
            >
              <Icon icon={RefreshCwIcon} />
              <AlertTitle>The brief changed since round {currentRound.number}</AlertTitle>
              <AlertDescription>These concepts don’t reflect your latest edits. Generate a new round to use them.</AlertDescription>
            </Alert>
          )}

          <section aria-label="Next round" className="flex flex-col gap-2">
            <SceneSettings
              settings={draft}
              disabled={!currentRound?.done}
              onChange={setDraft}
              action={
                <Button onClick={generate} disabled={!currentRound?.done}>
                  <Icon icon={SparklesIcon} />
                  Generate round {nextRound}
                </Button>
              }
            />
            <p className="text-muted-foreground type-text-xs-normal">
              Choose the scene, then generate a new round. Your ticked concepts and notes guide it, and every round is kept.
              {feedback.length > 0 && ` ${feedback.length} piece${feedback.length === 1 ? '' : 's'} of feedback from the chat will be used too.`}
            </p>
          </section>

          {!isLatest && (
            <p className="text-muted-foreground type-text-sm-normal">
              You’re looking back at round {round.number}. You can still tick concepts from it, but notes are only for the latest round.
            </p>
          )}

          <p className="sr-only" aria-live="polite">
            {round.done ? `Round ${round.number} ready: 4 concepts` : `Rendering round ${round.number}: ${round.stills.length} of 4 concepts`}
          </p>
          <ul
            className={layout === 'grid' ? 'grid grid-cols-2 gap-4' : 'flex flex-col gap-6'}
            aria-label={`Round ${round.number} concepts`}
            aria-busy={!round.done}
          >
            {CONCEPT_LETTERS.map((letter, i) => {
              const still = round.stills[i]
              const comment = still ? comments.find((c) => c.stillId === still.id) : undefined
              return (
                <li key={letter} className="min-w-0">
                  {still ? (
                    <ConceptCard
                      still={still}
                      selected={selected.includes(still.id)}
                      comment={comment}
                      applied={!!comment && rounds.length > comment.round}
                      nextRound={nextRound}
                      editable={isLatest}
                      onSelect={() => toggleSelect(still.id)}
                      onSaveComment={(text) => setComment(still.id, text)}
                      onRemoveComment={() => removeComment(still.id)}
                    />
                  ) : (
                    <PendingConcept label={`Concept ${letter}${round.number}`} />
                  )}
                </li>
              )
            })}
          </ul>
        </div>
      </div>
      <StepFooter
        note="Concepts you tick here carry into the next step."
        status={selected.length ? `${selected.length} selected` : 'None selected yet'}
      >
        <Button onClick={next} disabled={selected.length === 0}>
          Put into motion
          <Icon icon={ArrowRightIcon} />
        </Button>
      </StepFooter>
    </section>
  )
}
