import { useState } from 'react'
import { LayoutGrid, List, Mail, MessageSquare, Workflow as WorkflowIcon, Users } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { EmptyState } from '@/components/hr/EmptyState'
import { ListGate } from '@/components/hr/ListGate'
import { PageHeader } from '@/components/hr/PageHeader'
import { RelDate } from '@/components/hr/RelDate'
import { RunStatusBadge, WorkflowStatusBadge } from '@/components/hr/StatusBadge'
import { matchAudience } from '@/lib/audience'
import { useDemo } from '@/lib/demo-state'
import { describeSchedule, nextRunAt } from '@/lib/schedule'
import { STAGES } from '@/mocks/workflows'
import type { Workflow } from '@/mocks/types'

export function useWorkflowFacts(w: Workflow) {
  const { state, employees } = useDemo()
  const last = state.runs.find((r) => r.workflowId === w.id)
  return { last, audience: matchAudience(w.audience, employees).length, next: w.status === 'live' ? nextRunAt(w.schedule) : null }
}

function Card({ w }: { w: Workflow }) {
  const { last, audience, next } = useWorkflowFacts(w)
  return (
    <Link to={`/automations/workflows/${w.id}`} className="bg-card border-border hover:bg-accent/40 flex flex-col gap-3 rounded-lg border p-4 transition-colors" aria-label={`Open workflow: ${w.name}`}>
      <div className="flex items-start justify-between gap-3">
        <h3 className="line-clamp-2 text-[15px] leading-snug font-semibold">{w.name}</h3>
        <WorkflowStatusBadge status={w.status} />
      </div>
      <p className="text-muted-foreground line-clamp-2 text-[13px]">{w.description}</p>
      <ul className="text-muted-foreground space-y-1 text-[13px]">
        <li>{describeSchedule(w.schedule)}</li>
        <li className="flex items-center gap-1.5"><Users className="size-3.5" aria-hidden /><span className="num">{audience}</span> {audience === 1 ? 'person matches' : 'people match'} today</li>
        <li className="flex items-center gap-1.5">{w.channel === 'chat' ? <MessageSquare className="size-3.5" aria-hidden /> : <Mail className="size-3.5" aria-hidden />}{w.channel === 'chat' ? 'Google Chat' : 'Email'}</li>
      </ul>
      <div className="mt-auto flex items-center justify-between gap-2 border-t pt-3 text-xs">
        {last ? <RunStatusBadge status={last.status} /> : <span className="text-muted-foreground">Never run</span>}
        <span className="text-muted-foreground">{next ? <>Next run <RelDate value={next} time /></> : w.status === 'live' ? 'Runs on event' : ''}</span>
      </div>
    </Link>
  )
}

function Row({ w }: { w: Workflow }) {
  const { last, audience, next } = useWorkflowFacts(w)
  return (
    <Link to={`/automations/workflows/${w.id}`} className="hover:bg-accent/40 grid grid-cols-[1fr_auto] items-center gap-x-4 gap-y-1 px-4 py-3 lg:grid-cols-[2fr_2fr_90px_120px_150px_130px]">
      <span className="font-medium">{w.name}</span>
      <span className="text-muted-foreground hidden text-[13px] lg:block">{describeSchedule(w.schedule)}</span>
      <span className="num text-muted-foreground hidden lg:block">{audience}</span>
      <WorkflowStatusBadge status={w.status} />
      <span className="hidden lg:block">{last ? <RunStatusBadge status={last.status} /> : <span className="text-muted-foreground">Never run</span>}</span>
      <span className="text-muted-foreground hidden text-[13px] lg:block">{next ? <RelDate value={next} time /> : '—'}</span>
    </Link>
  )
}

export function Workflows() {
  const { state } = useDemo()
  const [view, setView] = useState('grid')
  return (
    <>
      <PageHeader
        title="Workflows"
        description="HR routines that run on their own, grouped by where they help in an employee's journey."
        actions={
          <>
            <ToggleGroup type="single" variant="outline" value={view} onValueChange={(v) => v && setView(v)} aria-label="Layout">
              <ToggleGroupItem value="grid" aria-label="Grid view"><LayoutGrid /></ToggleGroupItem>
              <ToggleGroupItem value="list" aria-label="List view"><List /></ToggleGroupItem>
            </ToggleGroup>
            <Button asChild><Link to="/automations/workflows/new">Create workflow</Link></Button>
          </>
        }
      />
      <ListGate
        isEmpty={state.workflows.length === 0}
        emptyState={<EmptyState icon={WorkflowIcon} title="No workflows yet" action={<Button asChild><Link to="/automations/workflows/new">Create workflow</Link></Button>}>A workflow sends the right message to the right people at the right time. Start from a template.</EmptyState>}
      >
        <div className="space-y-8">
          {STAGES.map((s) => {
            const list = state.workflows.filter((w) => w.stage === s.id)
            if (!list.length) return null
            return (
              <section key={s.id} aria-labelledby={`stage-${s.id}`}>
                <h2 id={`stage-${s.id}`} className="text-base font-semibold">{s.label}</h2>
                <p className="text-muted-foreground mb-3 text-[13px]">{s.blurb}</p>
                {view === 'grid' ? (
                  <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">{list.map((w) => <Card key={w.id} w={w} />)}</div>
                ) : (
                  <div className="border-border divide-y rounded-lg border">{list.map((w) => <Row key={w.id} w={w} />)}</div>
                )}
              </section>
            )
          })}
        </div>
      </ListGate>
    </>
  )
}
