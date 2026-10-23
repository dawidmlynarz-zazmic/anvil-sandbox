import { NavLink, useLocation } from 'react-router-dom'
import { Button } from '@anvil/components/ui/button'
import { cn } from '@anvil/lib/utils'
import { looksChosen } from '~/state/project'
import { briefReadiness } from '~/state/readiness'
import { useProject, type Step } from '~/state/ProjectContext'

type Dot = 'done' | 'active' | 'todo'

const DOT: Record<Dot, string> = {
  done: 'bg-success',
  active: 'bg-agent',
  todo: 'border-border-strong border bg-transparent',
}

/**
 * The project's steps, in the header: where you are, where you can go, and a dot for how far each step is (done,
 * in progress, not yet). Replaces the progress rail; the detail it carried lives on the screens themselves.
 */
export function StepNav() {
  const p = useProject()
  const { pathname } = useLocation()
  const setup = p.phase === 'setup'
  const chosen = looksChosen(p)
  const steps: { step: Step; label: string; dot: Dot; status: string }[] = [
    {
      step: 'brief',
      label: 'Brief',
      dot: setup ? 'active' : 'done',
      status: setup ? `${briefReadiness(p).done} of ${briefReadiness(p).total} done` : 'Ready',
    },
    {
      step: 'show',
      label: 'Show',
      dot: setup ? 'todo' : chosen === p.moments.length && p.moments.length > 0 ? 'done' : 'active',
      status: setup ? 'Not started' : `${chosen} of ${p.moments.length} looks`,
    },
    {
      step: 'review',
      label: 'Review',
      dot: p.status === 'approved' ? 'done' : p.sentVersion !== null ? 'active' : 'todo',
      status: p.status === 'approved' ? 'Approved' : p.status === 'feedback' ? 'Artist replied' : p.status === 'awaiting-artist' ? 'With the artist' : p.sentVersion !== null ? 'Changes requested' : 'Not sent',
    },
    {
      step: 'handoff',
      label: 'Handoff',
      dot: p.exported ? 'done' : p.status === 'approved' ? 'active' : 'todo',
      status: p.exported ? 'Sent to production' : p.status === 'approved' ? 'Ready to export' : 'After approval',
    },
  ]
  return (
    <nav aria-label="Project steps" className="flex items-center gap-0.5">
      {steps.map((s) => {
        const current = pathname.endsWith(`/${s.step}`) || (s.step === 'show' && /\/m\/\d+$/.test(pathname))
        return (
          <Button key={s.step} asChild variant="ghost" intent="neutral" size="sm" className={cn(current && 'bg-muted')}>
            <NavLink to={p.path(s.step)} aria-current={current ? 'page' : undefined} title={s.status}>
              <span aria-hidden className={cn('size-2 shrink-0 rounded-full', DOT[s.dot])} />
              <span className={cn(current ? 'type-text-sm-semibold' : 'type-text-sm-medium')}>{s.label}</span>
              <span className="sr-only">, {s.status}</span>
            </NavLink>
          </Button>
        )
      })}
    </nav>
  )
}
