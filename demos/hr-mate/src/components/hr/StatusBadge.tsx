import { CheckCircle2, CircleDashed, Clock, FilePen, Loader2, MinusCircle, Pause, Play, TriangleAlert, XCircle, Plug, PlugZap } from 'lucide-react'
import { STATUS_LABEL } from '@/lib/audience'
import type { EmployeeStatus, IndexStatus, IntegrationStatus, RunStatus, WorkflowStatus } from '@/mocks/types'
import { Pill, type Tone } from './Pill'

export const RUN_META: Record<RunStatus, { label: string; tone: Tone; icon: typeof CheckCircle2 }> = {
  succeeded: { label: 'Succeeded', tone: 'success', icon: CheckCircle2 },
  failed: { label: 'Failed', tone: 'danger', icon: XCircle },
  waiting: { label: 'Waiting for response', tone: 'info', icon: Clock },
  skipped: { label: 'Skipped', tone: 'neutral', icon: MinusCircle },
}

export function RunStatusBadge({ status }: { status: RunStatus }) {
  const m = RUN_META[status]
  return (
    <Pill tone={m.tone} icon={<m.icon aria-hidden />}>
      {m.label}
    </Pill>
  )
}

export function WorkflowStatusBadge({ status }: { status: WorkflowStatus }) {
  if (status === 'live')
    return (
      <Pill tone="success" icon={<Play aria-hidden />}>
        Live
      </Pill>
    )
  if (status === 'paused')
    return (
      <Pill tone="warning" icon={<Pause aria-hidden />}>
        Paused
      </Pill>
    )
  return (
    <Pill tone="neutral" icon={<FilePen aria-hidden />}>
      Draft
    </Pill>
  )
}

export function IndexStatusBadge({ status }: { status: IndexStatus }) {
  if (status === 'indexed')
    return (
      <Pill tone="success" icon={<CheckCircle2 aria-hidden />}>
        Ready to use
      </Pill>
    )
  if (status === 'indexing')
    return (
      <Pill tone="info" icon={<Loader2 className="animate-spin" aria-hidden />}>
        Indexing
      </Pill>
    )
  return (
    <Pill tone="danger" icon={<XCircle aria-hidden />}>
      Couldn't read
    </Pill>
  )
}

const EMP_TONE: Record<EmployeeStatus, Tone> = { trial: 'info', active: 'success', bench: 'warning', inactive: 'neutral' }

export function EmployeeStatusBadge({ status }: { status: EmployeeStatus }) {
  return (
    <Pill tone={EMP_TONE[status]} icon={status === 'inactive' ? <CircleDashed aria-hidden /> : undefined}>
      {STATUS_LABEL[status]}
    </Pill>
  )
}

export function ConnectionBadge({ status }: { status: IntegrationStatus }) {
  if (status === 'connected')
    return (
      <Pill tone="success" icon={<PlugZap aria-hidden />}>
        Connected
      </Pill>
    )
  if (status === 'attention')
    return (
      <Pill tone="warning" icon={<TriangleAlert aria-hidden />}>
        Needs attention
      </Pill>
    )
  return (
    <Pill tone="neutral" icon={<Plug aria-hidden />}>
      Not connected
    </Pill>
  )
}
