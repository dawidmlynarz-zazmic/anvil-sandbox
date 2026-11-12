import { Check, MinusCircle } from 'lucide-react'
import { Link, Navigate, useNavigate, useParams } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { PageHeader } from '@/components/hr/PageHeader'
import { ONBOARDING } from '@/copy/onboarding'
import { SETUP_STEPS, useDemo } from '@/lib/demo-state'
import { cn } from '@/lib/utils'
import type { SetupStepId } from '@/mocks/types'
import { DirectoryStep } from './DirectoryStep'
import { KnowledgeStep } from './KnowledgeStep'
import { TeamStep } from './TeamStep'
import { TestStep } from './TestStep'
import { WorkflowStep } from './WorkflowStep'
import type { ReactNode } from 'react'

export function useNextStep(current: SetupStepId) {
  const { state } = useDemo()
  const navigate = useNavigate()
  return () => {
    const i = SETUP_STEPS.indexOf(current)
    const after = [...SETUP_STEPS.slice(i + 1), ...SETUP_STEPS.slice(0, i)].find((k) => state.setup[k] === 'todo' && k !== current)
    navigate(after ? `/setup/${after}` : '/')
  }
}

/** Header shared by every step: what it is, why it matters, time estimate, primary action and "Skip for now". */
export function StepHeader({ step, primary, secondary }: { step: SetupStepId; primary: ReactNode; secondary?: ReactNode }) {
  const { dispatch } = useDemo()
  const next = useNextStep(step)
  const c = ONBOARDING.steps[step]
  const index = SETUP_STEPS.indexOf(step) + 1
  return (
    <PageHeader
      title={c.title}
      description={
        <>
          {c.why} <span className="whitespace-nowrap">About {c.time}.</span>
        </>
      }
      meta={<span className="text-muted-foreground text-[13px]">Step {index} of {SETUP_STEPS.length}</span>}
      actions={
        <>
          {secondary}
          <Button
            variant="ghost"
            onClick={() => {
              dispatch({ type: 'setStep', step, status: 'skipped' })
              next()
            }}
          >
            {ONBOARDING.skip}
          </Button>
          {primary}
        </>
      }
    />
  )
}

export function Setup() {
  const { step } = useParams()
  const { state } = useDemo()
  if (!SETUP_STEPS.includes(step as SetupStepId)) return <Navigate to="/setup/directory" replace />
  const id = step as SetupStepId

  return (
    <div className="grid gap-8 lg:grid-cols-[220px_1fr]">
      <nav aria-label="Setup steps" className="lg:sticky lg:top-0 lg:self-start">
        <p className="mb-3 text-sm font-semibold">Set up HR Mate</p>
        <ol className="flex gap-2 overflow-x-auto lg:flex-col lg:gap-1">
          {SETUP_STEPS.map((k, i) => {
            const status = state.setup[k]
            return (
              <li key={k}>
                <Link
                  to={`/setup/${k}`}
                  aria-current={k === id ? 'step' : undefined}
                  className={cn('flex items-center gap-2.5 rounded-md px-2.5 py-2 text-[13px] whitespace-nowrap', k === id ? 'bg-accent font-medium' : 'text-muted-foreground hover:bg-accent/60 hover:text-foreground')}
                >
                  <span className={cn('flex size-5 shrink-0 items-center justify-center rounded-full text-[11px]', status === 'done' ? 'bg-success text-success-foreground' : 'border-border border')}>
                    {status === 'done' ? <Check className="size-3" aria-label="Done" /> : status === 'skipped' ? <MinusCircle className="size-3.5" aria-label="Skipped" /> : i + 1}
                  </span>
                  {ONBOARDING.steps[k].short}
                </Link>
              </li>
            )
          })}
        </ol>
      </nav>
      <div className="min-w-0">
        {id === 'directory' && <DirectoryStep />}
        {id === 'knowledge' && <KnowledgeStep />}
        {id === 'test' && <TestStep />}
        {id === 'workflow' && <WorkflowStep />}
        {id === 'team' && <TeamStep />}
      </div>
    </div>
  )
}
