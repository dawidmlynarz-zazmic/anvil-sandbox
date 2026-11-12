import { useNavigate, useSearchParams } from 'react-router-dom'
import { toast } from 'sonner'
import { WorkflowWizard } from '@/components/hr/WorkflowWizard'
import { useDemo } from '@/lib/demo-state'

export function NewWorkflow() {
  const [params] = useSearchParams()
  const { dispatch } = useDemo()
  const navigate = useNavigate()
  return (
    <WorkflowWizard
      title="Create workflow"
      description="Six short steps. Nothing is sent until you turn it on."
      back={{ to: '/automations/workflows', label: 'Workflows' }}
      initialTemplateId={params.get('template')}
      onDone={(w, status) => {
        dispatch({ type: 'saveWorkflow', workflow: { ...w, status } })
        toast.success(status === 'live' ? `${w.name} is live` : `${w.name} saved as a draft`)
        navigate(`/automations/workflows/${w.id}`)
      }}
    />
  )
}
