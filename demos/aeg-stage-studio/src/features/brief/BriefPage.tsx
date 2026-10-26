import { useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@anvil/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@anvil/components/ui/card'
import { Icon, PencilIcon, SaveIcon, SparklesIcon } from '@anvil/components/ui/icon'
import { CheckRow } from '@anvil/components/anvil/check-row'
import { STEP_CONTENT } from '~/components/layout'
import { useProject } from '~/state/ProjectContext'
import { briefReadiness } from '~/state/readiness'
import { reveal } from '~/lib/reveal'
import type { BriefSection } from '~/state/types'
import { ConstraintsCard, SlotCard, VenueCard, VisualDirectionCard } from './BriefCards'

const SECTIONS: { key: BriefSection; label: string; Card: () => React.ReactNode }[] = [
  { key: 'venue', label: 'Venue', Card: VenueCard },
  { key: 'slot', label: 'Performance time slot', Card: SlotCard },
  { key: 'visual', label: 'Visual direction', Card: VisualDirectionCard },
  { key: 'constraints', label: 'No-gos and budget', Card: ConstraintsCard },
]

/**
 * The brief. On a new project it fills in as you answer the agent's questions (setup); after that it's the
 * project's reference, editable at any time.
 */
export function BriefPage() {
  const navigate = useNavigate()
  const p = useProject()
  const { phase, provenance, path, startProject, revealBrief } = p
  const setup = phase === 'setup'
  const visible = SECTIONS.filter((s) => provenance[s.key] !== 'pending')
  const formOpen = SECTIONS.every((s) => provenance[s.key] !== 'pending')
  // One readiness rule for the checklist, Generate show and the agent.
  const readiness = briefReadiness(p)

  // When the agent fills in one more section, bring it into view, so what it talks about is on screen.
  const shownKeys = visible.map((s) => s.key).join(',')
  const lastShown = useRef(shownKeys)
  useEffect(() => {
    const before = lastShown.current.split(',').filter(Boolean)
    lastShown.current = shownKeys
    const added = visible.filter((s) => !before.includes(s.key))
    if (added.length === 1) reveal(document.getElementById(`brief-${added[0]!.key}`))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [shownKeys])

  return (
    <section aria-labelledby="brief-title" className="flex h-full min-w-0 flex-col">
      <div className="step-scroll relative min-h-0 flex-1 overflow-y-auto p-6">
        <div className={`${STEP_CONTENT} gap-4`}>
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 id="brief-title" tabIndex={-1} className="type-heading-2xl outline-none">
                {setup ? 'New project brief' : 'Project brief'}
              </h1>
              <Button
                disabled={setup && !readiness.ready}
                onClick={() => {
                  if (setup) startProject()
                  navigate(path('show'))
                }}
              >
                <Icon icon={setup ? SparklesIcon : SaveIcon} />
                {setup ? 'Generate show' : 'Save'}
              </Button>
            </div>
            <p className="text-muted-foreground type-text-sm-normal">
              {setup
                ? 'Answer the agent in the chat, or fill it in here.'
                : 'Changes apply to images made from now on.'}
            </p>
          </div>

          {setup && !readiness.ready && (
            <Card>
              <CardHeader>
                <CardTitle>Still to cover</CardTitle>
                <CardDescription>
                  {readiness.done} of {readiness.total} done.{formOpen ? ' Fill in the rest below, or keep answering in the chat.' : ''}
                </CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-3">
                <div className="flex flex-col gap-1.5">
                  {readiness.items.map((item) => (
                    <CheckRow key={item.key} status={item.done ? 'included' : 'pending'}>
                      {item.label}
                      {item.optional && <span className="text-muted-foreground"> · optional</span>}
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


          {visible.map(({ key, Card: Section }) => (
            <div key={key} id={`brief-${key}`} className="scroll-mt-4">
              <Section />
            </div>
          ))}
        </div>
      </div>
    </section>
  )
}
