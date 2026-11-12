import { ArrowDown, ArrowUp, Plus, Trash2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { VARIABLES } from '@/lib/instruction'
import { STEP_TYPES } from '@/mocks/workflows'
import type { StepType, WorkflowStep } from '@/mocks/types'
import { VarText } from './VarText'

const IconBtn = ({ label, onClick, disabled, children }: { label: string; onClick: () => void; disabled?: boolean; children: React.ReactNode }) => (
  <Tooltip>
    <TooltipTrigger asChild>
      <Button variant="ghost" size="icon" aria-label={label} onClick={onClick} disabled={disabled}>
        {children}
      </Button>
    </TooltipTrigger>
    <TooltipContent>{label}</TooltipContent>
  </Tooltip>
)

export function StepsEditor({ steps, onChange }: { steps: WorkflowStep[]; onChange: (s: WorkflowStep[]) => void }) {
  const update = (id: string, patch: Partial<WorkflowStep>) => onChange(steps.map((s) => (s.id === id ? { ...s, ...patch } : s)))
  const move = (i: number, d: -1 | 1) => {
    const next = [...steps]
    ;[next[i], next[i + d]] = [next[i + d], next[i]]
    onChange(next)
  }
  return (
    <div className="space-y-4">
      {steps.length === 0 && <p className="text-muted-foreground">No steps yet. Add what HR Mate should do when the workflow runs.</p>}
      <ol className="space-y-3">
        {steps.map((s, i) => (
          <li key={s.id} className="bg-card border-border rounded-lg border p-4">
            <div className="mb-3 flex items-center gap-3">
              <span className="bg-muted flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium">{i + 1}</span>
              <div className="min-w-0 flex-1">
                <Label htmlFor={`step-type-${s.id}`} className="sr-only">
                  Step type
                </Label>
                <Select value={s.type} onValueChange={(t) => update(s.id, { type: t as StepType })}>
                  <SelectTrigger id={`step-type-${s.id}`} className="w-full max-w-72">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {(Object.keys(STEP_TYPES) as StepType[]).map((t) => (
                      <SelectItem key={t} value={t}>
                        {STEP_TYPES[t].label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <IconBtn label="Move step up" onClick={() => move(i, -1)} disabled={i === 0}>
                <ArrowUp />
              </IconBtn>
              <IconBtn label="Move step down" onClick={() => move(i, 1)} disabled={i === steps.length - 1}>
                <ArrowDown />
              </IconBtn>
              <IconBtn label="Remove step" onClick={() => onChange(steps.filter((x) => x.id !== s.id))}>
                <Trash2 />
              </IconBtn>
            </div>
            <p className="text-muted-foreground mb-2 text-xs">{STEP_TYPES[s.type].hint}</p>
            <Label htmlFor={`step-text-${s.id}`} className="sr-only">
              Message
            </Label>
            <Textarea id={`step-text-${s.id}`} rows={3} value={s.text} onChange={(e) => update(s.id, { text: e.target.value })} placeholder={s.type === 'form' ? 'Name of the form' : 'Write what should be sent'} />
            <div className="mt-2 flex flex-wrap items-center gap-1.5">
              <span className="text-muted-foreground text-xs">Insert:</span>
              {VARIABLES.map((v) => (
                <Button key={v} variant="outline" size="sm" className="h-6 px-2 font-mono text-[11px]" onClick={() => update(s.id, { text: `${s.text}${s.text && !s.text.endsWith(' ') ? ' ' : ''}{{${v}}}` })}>
                  {v}
                </Button>
              ))}
            </div>
            {s.text && (
              <div className="bg-muted mt-3 rounded-md p-3 text-[13px]">
                <p className="text-muted-foreground mb-1 text-xs">Preview. Highlighted words are filled in for each person.</p>
                <VarText text={s.text} />
              </div>
            )}
          </li>
        ))}
      </ol>
      <Button variant="outline" onClick={() => onChange([...steps, { id: `s-${Date.now()}`, type: 'chat_message', text: '' }])}>
        <Plus aria-hidden />
        Add a step
      </Button>
    </div>
  )
}
