import { useMemo, useState } from 'react'
import { Check, ChevronDown, Mail, MessageSquare } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { describeAudience, emptyAudience, matchAudience } from '@/lib/audience'
import { useDemo } from '@/lib/demo-state'
import { buildInstruction } from '@/lib/instruction'
import { describeSchedule } from '@/lib/schedule'
import { cn } from '@/lib/utils'
import { STAGES, STEP_TYPES, WORKFLOWS } from '@/mocks/workflows'
import type { Stage, Workflow, WorkflowStatus } from '@/mocks/types'
import { AudienceBuilder } from './AudienceBuilder'
import { PageHeader } from './PageHeader'
import { SchedulePicker } from './SchedulePicker'
import { StepsEditor } from './StepsEditor'

const STEPS = ['Start from', 'What happens', 'When', 'Who', 'Steps', 'Review']

const blank = (): Workflow => ({
  id: `wf-${Date.now()}`,
  name: '',
  description: '',
  stage: 'reminders',
  status: 'draft',
  schedule: { kind: 'weekdays', time: '09:00', timezone: 'Europe/Warsaw' },
  audience: emptyAudience(),
  channel: 'chat',
  steps: [{ id: `s-${Date.now()}`, type: 'chat_message', text: '' }],
})

const fromTemplate = (t: Workflow): Workflow => ({
  ...structuredClone(t),
  id: `wf-${Date.now()}`,
  status: 'draft',
  steps: t.steps.map((s, i) => ({ ...s, id: `s-${Date.now()}-${i}` })),
})

interface Props {
  title: string
  description: string
  back?: { to: string; label: string }
  initialTemplateId?: string | null
  /** Called with the finished workflow and the status the admin chose. */
  onDone: (w: Workflow, status: WorkflowStatus) => void
  /** Which templates to feature first, used by onboarding. */
  featured?: string[]
}

export function WorkflowWizard({ title, description, back, initialTemplateId, onDone, featured = [] }: Props) {
  const { employees } = useDemo()
  const [draft, setDraft] = useState<Workflow>(() => {
    const t = WORKFLOWS.find((w) => w.id === initialTemplateId)
    return t ? fromTemplate(t) : blank()
  })
  const [step, setStep] = useState(initialTemplateId ? 1 : 0)
  const [picked, setPicked] = useState<string | null>(initialTemplateId ?? null)
  const channel = draft.steps.some((s) => s.type === 'email') && !draft.steps.some((s) => s.type === 'chat_message') ? 'email' : 'chat'
  const matches = useMemo(() => matchAudience(draft.audience, employees), [draft.audience, employees])
  const nameOk = draft.name.trim().length > 2
  const stepsOk = draft.steps.length > 0 && draft.steps.every((s) => s.text.trim())

  const canNext = step === 0 ? picked !== null : step === 1 ? nameOk : step === 4 ? stepsOk : true
  const final = { ...draft, channel } as Workflow
  const ordered = [...WORKFLOWS].sort((a, b) => Number(featured.includes(b.id)) - Number(featured.includes(a.id)))

  const actions =
    step < 5 ? (
      <>
        {step > 0 && (
          <Button variant="outline" onClick={() => setStep(step - 1)}>
            Back
          </Button>
        )}
        <Button onClick={() => setStep(step + 1)} disabled={!canNext}>
          {step === 0 ? 'Use this start' : `Next: ${STEPS[step + 1].toLowerCase()}`}
        </Button>
      </>
    ) : (
      <>
        <Button variant="outline" onClick={() => setStep(4)}>
          Back
        </Button>
        <Button variant="secondary" onClick={() => onDone(final, 'draft')}>
          Save as draft
        </Button>
        <Button onClick={() => onDone(final, 'live')}>Turn on workflow</Button>
      </>
    )

  return (
    <>
      <PageHeader title={title} description={description} back={back} actions={actions} />
      <ol className="mb-6 flex flex-wrap gap-2" aria-label="Progress">
        {STEPS.map((s, i) => (
          <li key={s}>
            <button
              type="button"
              disabled={i > step}
              onClick={() => setStep(i)}
              aria-current={i === step ? 'step' : undefined}
              className={cn('flex items-center gap-2 rounded-full border px-3 py-1 text-[13px] transition-colors disabled:cursor-default', i === step ? 'border-foreground/50 text-foreground bg-accent' : i < step ? 'text-foreground hover:bg-accent' : 'text-muted-foreground')}
            >
              <span className={cn('flex size-5 items-center justify-center rounded-full text-xs', i < step ? 'bg-success text-success-foreground' : 'bg-muted')}>{i < step ? <Check className="size-3" aria-hidden /> : i + 1}</span>
              {s}
            </button>
          </li>
        ))}
      </ol>

      {step === 0 && (
        <div className="space-y-6">
          <div>
            <h2 className="text-base font-semibold">Start from a template or a blank workflow</h2>
            <p className="text-muted-foreground">Templates fill in the schedule, audience and message. You can change everything in the next steps.</p>
          </div>
          <div className="grid gap-3 sm:grid-cols-2 xl:grid-cols-3">
            <TemplateCard selected={picked === 'blank'} onSelect={() => { setPicked('blank'); setDraft(blank()) }} name="Blank workflow" description="Build your own routine from scratch." stage="Start empty" />
            {ordered.map((t) => (
              <TemplateCard key={t.id} selected={picked === t.id} onSelect={() => { setPicked(t.id); setDraft(fromTemplate(t)) }} name={t.name} description={t.description} stage={STAGES.find((s) => s.id === t.stage)!.label} schedule={describeSchedule(t.schedule)} channel={t.channel} recommended={featured.includes(t.id)} />
            ))}
          </div>
        </div>
      )}

      {step === 1 && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>What should happen?</CardTitle>
            <CardDescription>Describe it the way you would to a colleague.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="wf-name">Name</Label>
              <Input id="wf-name" value={draft.name} onChange={(e) => setDraft({ ...draft, name: e.target.value })} placeholder="For example: End-of-trial review" />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wf-desc">What does it do?</Label>
              <Textarea id="wf-desc" rows={3} value={draft.description} onChange={(e) => setDraft({ ...draft, description: e.target.value })} placeholder="One or two sentences, in plain words." />
            </div>
            <div className="space-y-2">
              <Label htmlFor="wf-stage">Where does it belong?</Label>
              <Select value={draft.stage} onValueChange={(s) => setDraft({ ...draft, stage: s as Stage })}>
                <SelectTrigger id="wf-stage" className="w-full sm:w-72">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {STAGES.map((s) => (
                    <SelectItem key={s.id} value={s.id}>
                      {s.label}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="text-muted-foreground text-xs">Workflows are grouped by employee lifecycle stage.</p>
            </div>
          </CardContent>
        </Card>
      )}

      {step === 2 && (
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>When should it run?</CardTitle>
            <CardDescription>Pick a rhythm or an event. Times use the timezone you choose here.</CardDescription>
          </CardHeader>
          <CardContent>
            <SchedulePicker value={draft.schedule} onChange={(schedule) => setDraft({ ...draft, schedule })} />
          </CardContent>
        </Card>
      )}

      {step === 3 && (
        <Card>
          <CardHeader>
            <CardTitle>Who should receive it?</CardTitle>
            <CardDescription>The audience is checked every time the workflow runs, so new people are included automatically.</CardDescription>
          </CardHeader>
          <CardContent>
            <AudienceBuilder value={draft.audience} onChange={(audience) => setDraft({ ...draft, audience })} />
          </CardContent>
        </Card>
      )}

      {step === 4 && (
        <div className="max-w-3xl space-y-3">
          <div>
            <h2 className="text-base font-semibold">What should HR Mate do?</h2>
            <p className="text-muted-foreground">Steps run in order for each person.</p>
          </div>
          <StepsEditor steps={draft.steps} onChange={(steps) => setDraft({ ...draft, steps })} />
        </div>
      )}

      {step === 5 && (
        <div className="max-w-3xl space-y-4">
          <Card>
            <CardHeader>
              <CardTitle>{final.name}</CardTitle>
              <CardDescription>{final.description || 'No description yet.'}</CardDescription>
            </CardHeader>
            <CardContent>
              <dl className="grid gap-x-6 gap-y-3 sm:grid-cols-[120px_1fr]">
                <dt className="text-muted-foreground">When</dt>
                <dd>{describeSchedule(final.schedule)}</dd>
                <dt className="text-muted-foreground">Who</dt>
                <dd>
                  {describeAudience(final.audience)}.{' '}
                  <span className="text-muted-foreground">{employees.length ? `Matches ${matches.length} ${matches.length === 1 ? 'person' : 'people'} today.` : 'Connect a directory to see who matches.'}</span>
                </dd>
                <dt className="text-muted-foreground">What</dt>
                <dd>
                  <ol className="list-decimal space-y-1 pl-4">
                    {final.steps.map((s) => (
                      <li key={s.id}>{STEP_TYPES[s.type].label}</li>
                    ))}
                  </ol>
                </dd>
                <dt className="text-muted-foreground">Channel</dt>
                <dd className="flex items-center gap-2">{channel === 'chat' ? <><MessageSquare className="size-4" aria-hidden /> Google Chat</> : <><Mail className="size-4" aria-hidden /> Email</>}</dd>
              </dl>
            </CardContent>
          </Card>
          <Collapsible>
            <CollapsibleTrigger asChild>
              <Button variant="ghost" className="group -ml-3">
                <ChevronDown className="transition-transform group-data-[state=open]:rotate-180" aria-hidden />
                Instruction that will be sent to the AI
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent>
              <p className="text-muted-foreground mb-2 text-[13px]">For engineers: the guided form assembles this text. It replaces the free-text box with a bracketed template.</p>
              <pre className="bg-muted max-h-80 overflow-auto rounded-lg p-4 font-mono text-xs whitespace-pre-wrap">{buildInstruction(final)}</pre>
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}
    </>
  )
}

function TemplateCard({ name, description, stage, schedule, channel, selected, onSelect, recommended }: { name: string; description: string; stage: string; schedule?: string; channel?: 'chat' | 'email'; selected: boolean; onSelect: () => void; recommended?: boolean }) {
  return (
    <button type="button" onClick={onSelect} aria-pressed={selected} className={cn('bg-card hover:bg-accent/50 flex flex-col gap-2 rounded-lg border p-4 text-left transition-colors', selected ? 'border-foreground/60 ring-foreground/20 ring-2' : 'border-border')}>
      <span className="flex items-center justify-between gap-2">
        <span className="text-muted-foreground text-xs">{stage}</span>
        {recommended && <span className="text-success text-xs font-medium">Good first workflow</span>}
      </span>
      <span className="text-[15px] leading-snug font-semibold">{name}</span>
      <span className="text-muted-foreground text-[13px]">{description}</span>
      {schedule && (
        <span className="text-muted-foreground mt-auto flex items-center gap-1.5 pt-1 text-xs">
          {channel === 'email' ? <Mail className="size-3.5" aria-hidden /> : <MessageSquare className="size-3.5" aria-hidden />}
          {schedule}
        </span>
      )}
    </button>
  )
}
