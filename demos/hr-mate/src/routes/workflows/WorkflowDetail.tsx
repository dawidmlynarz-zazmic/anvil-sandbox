import { useState } from 'react'
import { Copy, Pause, Play, Trash2 } from 'lucide-react'
import { Navigate, useNavigate, useParams } from 'react-router-dom'
import { toast } from 'sonner'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Textarea } from '@/components/ui/textarea'
import { AudienceBuilder } from '@/components/hr/AudienceBuilder'
import { PageHeader } from '@/components/hr/PageHeader'
import { RelDate } from '@/components/hr/RelDate'
import { RunStrip } from '@/components/hr/RunStrip'
import { SchedulePicker } from '@/components/hr/SchedulePicker'
import { RunStatusBadge, WorkflowStatusBadge } from '@/components/hr/StatusBadge'
import { VarText } from '@/components/hr/VarText'
import { describeAudience } from '@/lib/audience'
import { NOW } from '@/lib/dates'
import { useDemo } from '@/lib/demo-state'
import { buildInstruction } from '@/lib/instruction'
import { describeSchedule } from '@/lib/schedule'
import { STAGES, STEP_TYPES } from '@/mocks/workflows'
import type { Workflow } from '@/mocks/types'
import { useWorkflowFacts } from './Workflows'

export function WorkflowDetail() {
  const { id } = useParams()
  const { state } = useDemo()
  const w = state.workflows.find((x) => x.id === id)
  if (!w) return <Navigate to="/automations/workflows" replace />
  return <Detail key={w.id} w={w} />
}

function Detail({ w }: { w: Workflow }) {
  const { state, dispatch } = useDemo()
  const navigate = useNavigate()
  const { audience, next } = useWorkflowFacts(w)
  const runs = state.runs.filter((r) => r.workflowId === w.id)
  const [instruction, setInstruction] = useState(w.instruction ?? buildInstruction(w))
  const [draft, setDraft] = useState(w)

  const runNow = () => {
    const skipped = audience === 0
    dispatch({ type: 'addRun', run: { id: `run-${Date.now()}`, workflowId: w.id, startedAt: NOW.toISOString(), status: skipped ? 'skipped' : 'succeeded', recipients: audience, summary: skipped ? 'Nobody matched the audience, so nothing was sent.' : `Sent to ${audience} ${audience === 1 ? 'person' : 'people'}.` } })
    toast.success(skipped ? 'Ran now. Nobody matched, so nothing was sent.' : `Ran now. Sent to ${audience} ${audience === 1 ? 'person' : 'people'}.`)
  }
  const setStatus = (status: Workflow['status'], msg: string, undo?: Workflow['status']) => {
    dispatch({ type: 'setWorkflowStatus', id: w.id, status })
    toast.success(msg, undo ? { action: { label: 'Undo', onClick: () => dispatch({ type: 'setWorkflowStatus', id: w.id, status: undo }) } } : undefined)
  }
  const duplicate = () => {
    const copy: Workflow = { ...structuredClone(w), id: `wf-${Date.now()}`, name: `${w.name} (copy)`, status: 'draft' }
    dispatch({ type: 'saveWorkflow', workflow: copy })
    toast.success('Duplicated as a draft')
    navigate(`/automations/workflows/${copy.id}`)
  }
  const remove = () => {
    dispatch({ type: 'deleteWorkflow', id: w.id })
    toast.success(`${w.name} deleted`, { action: { label: 'Undo', onClick: () => dispatch({ type: 'saveWorkflow', workflow: w }) } })
    navigate('/automations/workflows')
  }

  const primary =
    w.status === 'live' ? <Button onClick={runNow}><Play aria-hidden />Run now</Button>
    : w.status === 'paused' ? <Button onClick={() => setStatus('live', `${w.name} resumed`, 'paused')}>Resume workflow</Button>
    : <Button onClick={() => setStatus('live', `${w.name} is live`, 'draft')}>Turn on workflow</Button>

  return (
    <>
      <PageHeader
        title={w.name}
        meta={<WorkflowStatusBadge status={w.status} />}
        description={w.description}
        back={{ to: '/automations/workflows', label: 'Workflows' }}
        actions={
          <>
            <Button variant="outline" onClick={duplicate}><Copy aria-hidden />Duplicate</Button>
            {w.status === 'live' && <Button variant="outline" onClick={() => setStatus('paused', `${w.name} paused. Nothing will be sent until you resume it.`, 'live')}><Pause aria-hidden />Pause</Button>}
            {primary}
          </>
        }
      />
      <Tabs defaultValue="overview">
        <TabsList>
          <TabsTrigger value="overview">Overview</TabsTrigger>
          <TabsTrigger value="instructions">Instructions</TabsTrigger>
          <TabsTrigger value="runs">Runs ({runs.length})</TabsTrigger>
          <TabsTrigger value="settings">Settings</TabsTrigger>
        </TabsList>

        <TabsContent value="overview" className="mt-4 grid gap-6 lg:grid-cols-[2fr_1fr]">
          <Card>
            <CardHeader><CardTitle>What this does</CardTitle><CardDescription>In plain language.</CardDescription></CardHeader>
            <CardContent className="space-y-4">
              <p>
                {describeSchedule(w.schedule)}, HR Mate reaches <strong><span className="num">{audience}</span> {audience === 1 ? 'person' : 'people'}</strong> ({describeAudience(w.audience)}) and:
              </p>
              <ol className="space-y-3">
                {w.steps.map((s, i) => (
                  <li key={s.id} className="bg-muted/50 rounded-lg border p-3">
                    <p className="mb-1 text-xs font-medium">{i + 1}. {STEP_TYPES[s.type].label}</p>
                    <p className="text-[13px]"><VarText text={s.text} /></p>
                  </li>
                ))}
              </ol>
            </CardContent>
          </Card>
          <div className="space-y-4">
            <Card>
              <CardHeader><CardTitle>Recent runs</CardTitle></CardHeader>
              <CardContent className="space-y-3">
                <RunStrip runs={runs} />
                <p className="text-muted-foreground text-[13px]">{next ? <>Next run <RelDate value={next} time />.</> : w.status === 'live' ? 'Starts when the event happens.' : 'Not scheduled while ' + (w.status === 'paused' ? 'paused.' : 'a draft.')}</p>
              </CardContent>
            </Card>
            <Card>
              <CardHeader><CardTitle>Where it belongs</CardTitle></CardHeader>
              <CardContent>{STAGES.find((s) => s.id === w.stage)?.label} · {w.channel === 'chat' ? 'Google Chat' : 'Email'}</CardContent>
            </Card>
          </div>
        </TabsContent>

        <TabsContent value="instructions" className="mt-4 max-w-3xl space-y-3">
          <p className="text-muted-foreground">This is the instruction the AI follows. Most people never need to edit it: change the steps, schedule or audience instead. Edits here replace the generated text.</p>
          <label htmlFor="instr" className="sr-only">AI instruction</label>
          <Textarea id="instr" rows={14} className="font-mono text-xs" value={instruction} onChange={(e) => setInstruction(e.target.value)} />
          <div className="flex gap-2">
            <Button variant="secondary" onClick={() => { dispatch({ type: 'saveWorkflow', workflow: { ...w, instruction } }); toast.success('Instruction saved') }}>Save instruction</Button>
            <Button variant="outline" onClick={() => { setInstruction(buildInstruction({ ...w, instruction: undefined })); dispatch({ type: 'saveWorkflow', workflow: { ...w, instruction: undefined } }); toast('Back to the generated instruction') }}>Reset to generated</Button>
          </div>
        </TabsContent>

        <TabsContent value="runs" className="mt-4">
          {runs.length === 0 ? <p className="text-muted-foreground">This workflow hasn't run yet.</p> : (
            <ul className="border-border divide-y rounded-lg border">
              {runs.map((r) => (
                <li key={r.id} className="flex flex-wrap items-center gap-3 px-4 py-2.5">
                  <RunStatusBadge status={r.status} />
                  <span className="flex-1">{r.summary}</span>
                  <RelDate value={r.startedAt} time className="text-muted-foreground text-[13px]" />
                </li>
              ))}
            </ul>
          )}
        </TabsContent>

        <TabsContent value="settings" className="mt-4 space-y-6">
          <Card>
            <CardHeader><CardTitle>Schedule</CardTitle></CardHeader>
            <CardContent className="max-w-2xl"><SchedulePicker value={draft.schedule} onChange={(schedule) => setDraft({ ...draft, schedule })} /></CardContent>
          </Card>
          <Card>
            <CardHeader><CardTitle>Audience</CardTitle></CardHeader>
            <CardContent><AudienceBuilder value={draft.audience} onChange={(a) => setDraft({ ...draft, audience: a })} /></CardContent>
          </Card>
          <div><Button variant="secondary" onClick={() => { dispatch({ type: 'saveWorkflow', workflow: { ...w, schedule: draft.schedule, audience: draft.audience } }); toast.success('Settings saved') }}>Save settings</Button></div>
          <Card className="border-destructive-soft/40">
            <CardHeader><CardTitle className="text-destructive-soft">Delete workflow</CardTitle><CardDescription>Removes this workflow and stops all future runs. Past runs stay in history. This cannot be undone after you leave the page.</CardDescription></CardHeader>
            <CardContent>
              <AlertDialog>
                <AlertDialogTrigger asChild><Button variant="destructive"><Trash2 aria-hidden />Delete workflow</Button></AlertDialogTrigger>
                <AlertDialogContent>
                  <AlertDialogHeader>
                    <AlertDialogTitle>Delete “{w.name}”?</AlertDialogTitle>
                    <AlertDialogDescription>It stops running right away and {audience} {audience === 1 ? 'person' : 'people'} will no longer receive it. Past runs stay in history. You can undo from the message that appears next.</AlertDialogDescription>
                  </AlertDialogHeader>
                  <AlertDialogFooter>
                    <AlertDialogCancel>Keep workflow</AlertDialogCancel>
                    <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={remove}>Delete workflow</AlertDialogAction>
                  </AlertDialogFooter>
                </AlertDialogContent>
              </AlertDialog>
            </CardContent>
          </Card>
        </TabsContent>
      </Tabs>
    </>
  )
}
