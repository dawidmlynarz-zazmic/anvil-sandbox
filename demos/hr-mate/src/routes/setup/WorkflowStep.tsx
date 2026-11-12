import { CheckCircle2 } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { WorkflowWizard } from '@/components/hr/WorkflowWizard'
import { describeSchedule } from '@/lib/schedule'
import { useDemo } from '@/lib/demo-state'
import { StepHeader, useNextStep } from './Setup'

export function WorkflowStep() {
  const { state, dispatch } = useDemo()
  const navigate = useNavigate()
  const next = useNextStep('workflow')
  const live = state.workflows.find((w) => w.status === 'live')

  if (state.setup.workflow === 'done' && live)
    return (
      <>
        <StepHeader
          step="workflow"
          primary={<Button onClick={next}>Continue to your team</Button>}
        />
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="text-success size-5" aria-hidden />
              {live.name} is live
            </CardTitle>
            <CardDescription>{describeSchedule(live.schedule)}</CardDescription>
          </CardHeader>
          <CardContent>
            <Button variant="link" className="h-auto p-0" onClick={() => navigate(`/automations/workflows/${live.id}`)}>
              View workflow
            </Button>
          </CardContent>
        </Card>
      </>
    )

  return (
    <WorkflowWizard
      title="Turn on your first workflow"
      description="A workflow is an HR routine that runs by itself. Pick a template, check who it reaches, then turn it on. About 4 minutes."
      featured={['wf-trial-end', 'wf-welcome', 'wf-timesheet']}
      onDone={(w, status) => {
        dispatch({ type: 'saveWorkflow', workflow: { ...w, status } })
        if (status === 'live') {
          dispatch({ type: 'setStep', step: 'workflow', status: 'done' })
          toast.success(`${w.name} is live`)
          next()
        } else {
          toast.success('Saved as a draft. Turn it on when you are ready.')
        }
      }}
    />
  )
}
