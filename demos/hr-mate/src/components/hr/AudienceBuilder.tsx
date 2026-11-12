import { Users } from 'lucide-react'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { describeAudience, matchAudience, STATUS_LABEL } from '@/lib/audience'
import { useDemo } from '@/lib/demo-state'
import { DEPARTMENTS } from '@/mocks/seed'
import type { AudienceRule, DateRule, EmployeeStatus } from '@/mocks/types'
import { EmployeeStatusBadge } from './StatusBadge'

const STATUSES: EmployeeStatus[] = ['trial', 'active', 'bench']
type RuleKey = 'none' | 'trialEnd-next' | 'start-last' | 'start-next' | 'anniversary'

const toKey = (r: DateRule | null): RuleKey =>
  !r ? 'none' : r.direction === 'anniversary' ? 'anniversary' : r.field === 'trialEndDate' ? 'trialEnd-next' : r.direction === 'last' ? 'start-last' : 'start-next'

const fromKey = (k: RuleKey, days: number): DateRule | null =>
  k === 'none'
    ? null
    : k === 'anniversary'
      ? { field: 'startDate', direction: 'anniversary', days }
      : k === 'trialEnd-next'
        ? { field: 'trialEndDate', direction: 'next', days }
        : { field: 'startDate', direction: k === 'start-last' ? 'last' : 'next', days }

const RULE_LABEL: Record<RuleKey, string> = {
  none: 'No date rule',
  'trialEnd-next': 'Trial ends within…',
  'start-last': 'Started within the last…',
  'start-next': 'Starts within the next…',
  anniversary: 'Work anniversary within…',
}

export function AudienceBuilder({ value, onChange }: { value: AudienceRule; onChange: (a: AudienceRule) => void }) {
  const { employees } = useDemo()
  const matches = matchAudience(value, employees)
  const rule = toKey(value.dateRule)
  const days = value.dateRule?.days ?? 7
  const set = (patch: Partial<AudienceRule>) => onChange({ ...value, ...patch })

  return (
    <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
      <div className="space-y-5">
        <div className="space-y-2">
          <Label>Employment status</Label>
          <ToggleGroup type="multiple" variant="outline" value={value.statuses} onValueChange={(v) => set({ statuses: v as EmployeeStatus[] })} className="justify-start">
            {STATUSES.map((s) => (
              <ToggleGroupItem key={s} value={s} aria-label={STATUS_LABEL[s]}>
                {STATUS_LABEL[s]}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
          <p className="text-muted-foreground text-xs">Leave empty to include everyone who isn't excluded below.</p>
        </div>
        <div className="space-y-2">
          <Label>Department</Label>
          <ToggleGroup type="multiple" variant="outline" value={value.departments} onValueChange={(v) => set({ departments: v })} className="flex-wrap justify-start">
            {DEPARTMENTS.map((d) => (
              <ToggleGroupItem key={d} value={d}>
                {d}
              </ToggleGroupItem>
            ))}
          </ToggleGroup>
        </div>
        <div className="space-y-2">
          <Label htmlFor="aud-rule">Date rule</Label>
          <div className="flex flex-wrap items-center gap-2">
            <Select value={rule} onValueChange={(k) => set({ dateRule: fromKey(k as RuleKey, days) })}>
              <SelectTrigger id="aud-rule" className="w-64">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(Object.keys(RULE_LABEL) as RuleKey[]).map((k) => (
                  <SelectItem key={k} value={k}>
                    {RULE_LABEL[k]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {rule !== 'none' && (
              <>
                <Label htmlFor="aud-days" className="sr-only">
                  Number of days
                </Label>
                <Input id="aud-days" type="number" min={1} max={365} className="w-20" value={days} onChange={(e) => set({ dateRule: fromKey(rule, Math.max(1, Number(e.target.value) || 1)) })} />
                <span className="text-muted-foreground">days</span>
              </>
            )}
          </div>
        </div>
        <div className="space-y-2">
          <Label>Always leave out</Label>
          <ToggleGroup type="multiple" variant="outline" value={value.excludeStatuses} onValueChange={(v) => set({ excludeStatuses: v as EmployeeStatus[] })} className="justify-start">
            <ToggleGroupItem value="inactive">Inactive people</ToggleGroupItem>
            <ToggleGroupItem value="bench">People on the bench</ToggleGroupItem>
          </ToggleGroup>
        </div>
      </div>
      <aside className="bg-muted/50 border-border rounded-lg border p-4" aria-live="polite">
        <p className="flex items-center gap-2 text-base font-semibold">
          <Users className="text-primary size-4" aria-hidden />
          Matches {matches.length} {matches.length === 1 ? 'person' : 'people'} today
        </p>
        <p className="text-muted-foreground mt-1 text-[13px]">{describeAudience(value)}</p>
        {employees.length === 0 ? (
          <p className="text-muted-foreground mt-3 text-[13px]">Connect your employee directory to see who matches.</p>
        ) : matches.length === 0 ? (
          <p className="text-muted-foreground mt-3 text-[13px]">Nobody matches right now. The workflow will still run and skip itself until someone does.</p>
        ) : (
          <ul className="mt-3 space-y-2">
            {matches.slice(0, 6).map((e) => (
              <li key={e.id} className="flex items-center gap-2">
                <Avatar className="size-6">
                  <AvatarFallback className="bg-secondary text-[10px]">{e.initials}</AvatarFallback>
                </Avatar>
                <span className="flex-1 truncate text-[13px]">{e.name}</span>
                <EmployeeStatusBadge status={e.status} />
              </li>
            ))}
            {matches.length > 6 && <li className="text-muted-foreground text-xs">and {matches.length - 6} more</li>}
          </ul>
        )}
      </aside>
    </div>
  )
}
