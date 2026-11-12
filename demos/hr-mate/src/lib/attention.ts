import { useMemo } from 'react'
import { FAILURE_CAUSES } from '@/mocks/workflows'
import { plural } from './dates'
import { useDemo } from './demo-state'

export interface AttentionItem {
  id: string
  kind: 'run' | 'approval' | 'sync' | 'question'
  title: string
  detail: string
  action: { label: string; to: string }
  tone: 'destructive' | 'warning' | 'info'
}

/** Everything that needs a human, from one source. Used by Home and by the notifications list. */
export function useAttention(): AttentionItem[] {
  const { state } = useDemo()
  return useMemo(() => {
    const items: AttentionItem[] = []
    const failed = state.runs.filter((r) => r.status === 'failed' && r.cause)
    const causes = [...new Set(failed.map((r) => r.cause!))]
    for (const c of causes) {
      const n = failed.filter((r) => r.cause === c).length
      const meta = FAILURE_CAUSES[c]
      items.push({
        id: `run-${c}`,
        kind: 'run',
        title: `${plural(n, 'run')} failed: ${meta.title}`,
        detail: meta.fix,
        action: { label: meta.action.label, to: '/automations/runs' },
        tone: 'destructive',
      })
    }
    if (state.approvals.length)
      items.push({
        id: 'approvals',
        kind: 'approval',
        title: `${plural(state.approvals.length, 'approval')} waiting for you`,
        detail: state.approvals.map((a) => a.title.replace('Trial review: ', '')).join(', '),
        action: { label: 'Review approvals', to: '/#approvals' },
        tone: 'warning',
      })
    for (const i of state.integrations.filter((x) => x.status === 'attention'))
      items.push({ id: `sync-${i.id}`, kind: 'sync', title: `${i.name} needs attention`, detail: i.problem ?? 'Some fields are not mapped.', action: { label: 'Fix field mapping', to: '/connections' }, tone: 'warning' })
    const unanswered = state.questions.filter((q) => !q.answer && !q.resolved)
    if (unanswered.length)
      items.push({
        id: 'questions',
        kind: 'question',
        title: `${plural(unanswered.length, 'question')} the assistant couldn't answer`,
        detail: [...new Set(unanswered.map((q) => q.topic))].slice(0, 3).join(', '),
        action: { label: 'Add documents', to: '/knowledge' },
        tone: 'info',
      })
    return items
  }, [state.runs, state.approvals, state.integrations, state.questions])
}
