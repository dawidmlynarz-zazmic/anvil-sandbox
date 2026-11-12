import { useState } from 'react'
import { ChevronDown, CircleCheck, RotateCw } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { EmptyState } from '@/components/hr/EmptyState'
import { ListGate } from '@/components/hr/ListGate'
import { PageHeader } from '@/components/hr/PageHeader'
import { RelDate } from '@/components/hr/RelDate'
import { RunStrip } from '@/components/hr/RunStrip'
import { RunStatusBadge, RUN_META } from '@/components/hr/StatusBadge'
import { plural } from '@/lib/dates'
import { useDemo } from '@/lib/demo-state'
import { FAILURE_CAUSES, workflowName } from '@/mocks/workflows'
import type { FailureCause } from '@/mocks/types'

export function Runs() {
  const { state, dispatch } = useDemo()
  const [wf, setWf] = useState('all')
  const [st, setSt] = useState('all')
  const failed = state.runs.filter((r) => r.status === 'failed' && r.cause)
  const causes = [...new Set(failed.map((r) => r.cause!))] as FailureCause[]
  const filtered = state.runs.filter((r) => (wf === 'all' || r.workflowId === wf) && (st === 'all' || r.status === st))

  return (
    <>
      <PageHeader title="Runs" description="Every time a workflow ran, and what went wrong when it didn't." />
      <Card className="mb-6">
        <CardHeader>
          <CardTitle className="text-base">Last 30 runs</CardTitle>
          <CardDescription>Oldest to newest. Hover or focus a block for details.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-3">
          <RunStrip runs={state.runs} limit={30} />
          <ul className="text-muted-foreground flex flex-wrap gap-x-4 gap-y-1 text-xs">
            {(['succeeded', 'failed', 'waiting', 'skipped'] as const).map((s) => (
              <li key={s} className="flex items-center gap-1.5"><span className="num">{state.runs.filter((r) => r.status === s).length}</span> {RUN_META[s].label.toLowerCase()}</li>
            ))}
          </ul>
        </CardContent>
      </Card>
      <Tabs defaultValue="issues">
        <TabsList>
          <TabsTrigger value="issues">Issues{failed.length > 0 && ` (${failed.length})`}</TabsTrigger>
          <TabsTrigger value="all">All runs</TabsTrigger>
        </TabsList>

        <TabsContent value="issues" className="mt-4 space-y-4">
          <ListGate isEmpty={causes.length === 0} rows={3} emptyState={<EmptyState icon={CircleCheck} title="No issues">Failed runs are grouped by cause here, with a suggested fix. Right now everything is running as expected.</EmptyState>}>
            {causes.map((c) => {
              const meta = FAILURE_CAUSES[c]
              const runs = failed.filter((r) => r.cause === c)
              const affected = [...new Set(runs.map((r) => workflowName(r.workflowId, state.workflows)))]
              return (
                <Card key={c}>
                  <CardHeader>
                    <CardTitle className="flex flex-wrap items-center gap-3 text-base">
                      {meta.title}
                      <span className="bg-destructive-muted text-destructive-soft rounded-full px-2.5 py-0.5 text-xs font-medium">{plural(runs.length, 'failed run')}</span>
                    </CardTitle>
                    <CardDescription>Affects: {affected.join(', ')}</CardDescription>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <p>{meta.explain}</p>
                    <p><span className="font-medium">How to fix it: </span>{meta.fix}</p>
                    <div className="flex flex-wrap gap-2">
                      {meta.action.retry ? (
                        <Button variant="secondary" onClick={() => { dispatch({ type: 'resolveRuns', ids: runs.map((r) => r.id) }); toast.success(`Retried ${plural(runs.length, 'run')}. All succeeded.`) }}><RotateCw aria-hidden />{meta.action.label}</Button>
                      ) : (
                        <Button asChild variant="secondary"><Link to={meta.action.to!}>{meta.action.label}</Link></Button>
                      )}
                    </div>
                    <Collapsible>
                      <CollapsibleTrigger asChild>
                        <Button variant="ghost" size="sm" className="group -ml-2"><ChevronDown className="transition-transform group-data-[state=open]:rotate-180" aria-hidden />View details</Button>
                      </CollapsibleTrigger>
                      <CollapsibleContent className="space-y-2 pt-2">
                        <p className="text-muted-foreground text-xs">Technical details, for whoever helps you debug.</p>
                        {runs.map((r) => (
                          <div key={r.id} className="bg-muted rounded-md p-3">
                            <p className="mb-1 text-xs"><span className="font-medium">{workflowName(r.workflowId, state.workflows)}</span> · <RelDate value={r.startedAt} time /> · <span className="font-mono">{r.id}</span></p>
                            <pre className="font-mono text-xs whitespace-pre-wrap">{r.rawError}</pre>
                          </div>
                        ))}
                      </CollapsibleContent>
                    </Collapsible>
                  </CardContent>
                </Card>
              )
            })}
          </ListGate>
        </TabsContent>

        <TabsContent value="all" className="mt-4 space-y-4">
          <div className="flex flex-wrap gap-2">
            <Select value={wf} onValueChange={setWf}>
              <SelectTrigger className="w-64" aria-label="Filter by workflow"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All workflows</SelectItem>
                {state.workflows.map((w) => <SelectItem key={w.id} value={w.id}>{w.name}</SelectItem>)}
              </SelectContent>
            </Select>
            <Select value={st} onValueChange={setSt}>
              <SelectTrigger className="w-52" aria-label="Filter by result"><SelectValue /></SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All results</SelectItem>
                {Object.entries(RUN_META).map(([k, m]) => <SelectItem key={k} value={k}>{m.label}</SelectItem>)}
              </SelectContent>
            </Select>
          </div>
          <ListGate isEmpty={state.runs.length === 0} rows={8} emptyState={<EmptyState icon={RotateCw} title="No runs yet" action={<Button asChild><Link to="/automations/workflows">Go to workflows</Link></Button>}>Once a live workflow runs, each run is listed here.</EmptyState>}>
            <div className="border-border rounded-lg border">
              <Table>
                <TableHeader><TableRow><TableHead>When</TableHead><TableHead>Workflow</TableHead><TableHead>Result</TableHead><TableHead>What happened</TableHead></TableRow></TableHeader>
                <TableBody>
                  {filtered.slice(0, 40).map((r) => (
                    <TableRow key={r.id} className="h-10">
                      <TableCell><RelDate value={r.startedAt} time /></TableCell>
                      <TableCell><Link to={`/automations/workflows/${r.workflowId}`} className="hover:underline">{workflowName(r.workflowId, state.workflows)}</Link></TableCell>
                      <TableCell><RunStatusBadge status={r.status} /></TableCell>
                      <TableCell className="text-muted-foreground max-w-md whitespace-normal">{r.summary}</TableCell>
                    </TableRow>
                  ))}
                  {filtered.length === 0 && <TableRow><TableCell colSpan={4} className="text-muted-foreground py-8 text-center">No runs match those filters.</TableCell></TableRow>}
                </TableBody>
              </Table>
            </div>
          </ListGate>
        </TabsContent>
      </Tabs>
    </>
  )
}
