import { useNavigate } from 'react-router-dom'
import { Button } from '@anvil/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@anvil/components/ui/card'
import { ArrowRightIcon, Icon, PencilIcon, ShieldCheckIcon, SparklesIcon } from '@anvil/components/ui/icon'
import { CheckRow } from '@anvil/components/anvil/check-row'
import { STEP_CONTENT } from '~/components/layout'
import { StepFooter } from '~/components/StepFooter'
import { GUARDRAIL } from '~/mocks/copy'
import { QUESTIONS } from '~/services/interview'
import { useProject } from '~/state/ProjectContext'
import type { BriefSection } from '~/state/types'
import { ConstraintsCard, SetlistCard, SlotCard, VenueCard, VisualDirectionCard } from './BriefCards'

const SECTIONS: { key: BriefSection; label: string; Card: () => React.ReactNode }[] = [
  { key: 'venue', label: 'Venue', Card: VenueCard },
  { key: 'slot', label: 'Performance time slot', Card: SlotCard },
  { key: 'visual', label: 'Visual direction', Card: VisualDirectionCard },
  { key: 'constraints', label: 'Constraints', Card: ConstraintsCard },
  { key: 'moments', label: 'Key moments', Card: SetlistCard },
]

/**
 * The brief. On a new project it fills in as you answer the agent's questions (setup); after that it's the
 * project's reference, editable at any time.
 */
export function BriefPage() {
  const navigate = useNavigate()
  const { phase, setupStep, provenance, rounds, currentRound, briefRevision, path, startProject, revealBrief } = useProject()
  const setup = phase === 'setup'
  const visible = SECTIONS.filter((s) => provenance[s.key] !== 'pending')
  const pending = SECTIONS.filter((s) => provenance[s.key] === 'pending')
  const changed = !!currentRound && currentRound.briefRevision < briefRevision
  const answered = Math.min(setupStep, QUESTIONS.length)

  return (
    <section aria-labelledby="brief-title" className="flex h-full min-w-0 flex-col">
      <div className="step-scroll relative min-h-0 flex-1 overflow-y-auto p-6">
        <div className={`${STEP_CONTENT} gap-4`}>
          <div className="flex flex-col gap-2">
            <h1 id="brief-title" tabIndex={-1} className="type-heading-2xl outline-none">
              {setup ? 'New project brief' : 'Project brief'}
            </h1>
            <p className="text-muted-foreground type-text-sm-normal">
              {setup
                ? 'The agent is asking you about the show in the chat. Each answer fills in a part of this brief. You can also fill it in yourself.'
                : 'The reference for every round. Edit it here or ask the agent in the chat. Changes apply to the next round you generate.'}
            </p>
          </div>

          {setup && pending.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Still to cover</CardTitle>
                <CardDescription>
                  {answered} of {QUESTIONS.length} questions answered. Prefer a form? Fill in the rest yourself.
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  {SECTIONS.map((s) => (
                    <CheckRow key={s.key} status={provenance[s.key] === 'pending' ? 'pending' : 'included'}>
                      {s.label}
                    </CheckRow>
                  ))}
                </div>
                <Button variant="outline" intent="neutral" size="sm" className="self-start" onClick={revealBrief}>
                  <Icon icon={PencilIcon} />
                  Fill in the form instead
                </Button>
              </CardContent>
            </Card>
          )}

          {visible.map(({ key, Card: Section }) => (
            <Section key={key} />
          ))}
        </div>
      </div>
      {setup ? (
        <StepFooter
          note={
            <>
              <Icon icon={ShieldCheckIcon} size="xs" />
              {GUARDRAIL}
            </>
          }
          status={pending.length ? `${pending.length} part${pending.length === 1 ? '' : 's'} of the brief to go` : 'Brief ready · creates 4 stage concepts'}
        >
          <Button
            disabled={pending.length > 0}
            onClick={() => {
              startProject()
              navigate(path('stills'))
            }}
          >
            <Icon icon={SparklesIcon} />
            Start project
          </Button>
        </StepFooter>
      ) : (
        <StepFooter
          note={
            <>
              <Icon icon={ShieldCheckIcon} size="xs" />
              {GUARDRAIL}
            </>
          }
          status={
            rounds.length
              ? changed
                ? `Brief changed since round ${currentRound!.number}. Generate a new round in Stills to use it.`
                : `Round ${currentRound!.number} uses this brief`
              : undefined
          }
        >
          <Button onClick={() => navigate(path('stills'))}>
            Go to stills
            <Icon icon={ArrowRightIcon} />
          </Button>
        </StepFooter>
      )}
    </section>
  )
}
