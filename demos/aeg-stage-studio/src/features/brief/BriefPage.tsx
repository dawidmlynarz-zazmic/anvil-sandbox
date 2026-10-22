import { useNavigate } from 'react-router-dom'
import { Button } from '@anvil/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@anvil/components/ui/card'
import { ArrowRightIcon, Icon, PencilIcon, ShieldCheckIcon, SparklesIcon } from '@anvil/components/ui/icon'
import { CheckRow } from '@anvil/components/anvil/check-row'
import { STEP_CONTENT } from '~/components/layout'
import { StepFooter } from '~/components/StepFooter'
import { GUARDRAIL } from '~/mocks/copy'
import { useProject } from '~/state/ProjectContext'
import { briefReadiness } from '~/state/readiness'
import type { BriefSection } from '~/state/types'
import { ConstraintsCard, SetlistCard, ShowCard, SlotCard, VenueCard, VisualDirectionCard } from './BriefCards'

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
  const p = useProject()
  const { phase, provenance, rounds, currentRound, briefRevision, path, startProject, revealBrief } = p
  const setup = phase === 'setup'
  const visible = SECTIONS.filter((s) => provenance[s.key] !== 'pending')
  const formOpen = SECTIONS.every((s) => provenance[s.key] !== 'pending')
  const changed = !!currentRound && currentRound.briefRevision < briefRevision
  // One readiness rule for the checklist, the footer, the rail and the agent.
  const readiness = briefReadiness(p)
  const who = readiness.items[0]!

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

          {setup && !readiness.ready && (
            <Card>
              <CardHeader>
                <CardTitle>Still to cover</CardTitle>
                <CardDescription>
                  {readiness.done} of {readiness.total} done.{formOpen ? ' Fill in the rest below, or keep answering in the chat.' : ' Prefer a form? Fill in the rest yourself.'}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  {readiness.items.map((item) => (
                    <CheckRow key={item.key} status={item.done ? 'included' : 'pending'}>
                      {item.label}
                    </CheckRow>
                  ))}
                </div>
                {!formOpen && (
                  <Button variant="outline" intent="neutral" size="sm" className="self-start" onClick={revealBrief}>
                    <Icon icon={PencilIcon} />
                    Fill in the form instead
                  </Button>
                )}
              </CardContent>
            </Card>
          )}

          {setup && formOpen && !who.done && <ShowCard />}

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
          status={readiness.ready ? 'Brief ready · creates 4 stage concepts' : `${readiness.left.length} part${readiness.left.length === 1 ? '' : 's'} of the brief to go`}
        >
          <Button
            disabled={!readiness.ready}
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
