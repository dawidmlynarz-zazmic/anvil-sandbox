import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { describeSchedule, EVENTS, TIMEZONES, WEEKDAYS } from '@/lib/schedule'
import type { EventKey, Schedule, ScheduleKind } from '@/mocks/types'

const KINDS: { value: ScheduleKind; label: string }[] = [
  { value: 'once', label: 'Once' },
  { value: 'daily', label: 'Every day' },
  { value: 'weekdays', label: 'Every weekday' },
  { value: 'weekly', label: 'Every week' },
  { value: 'monthly', label: 'Every month' },
  { value: 'event', label: 'When something happens' },
]

export function SchedulePicker({ value, onChange }: { value: Schedule; onChange: (s: Schedule) => void }) {
  const set = (patch: Partial<Schedule>) => onChange({ ...value, ...patch })
  return (
    <div className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div className="space-y-2">
          <Label htmlFor="sch-kind">How often</Label>
          <Select value={value.kind} onValueChange={(k) => set({ kind: k as ScheduleKind, event: k === 'event' ? (value.event ?? 'new_hire_added') : value.event, weekday: value.weekday ?? 1, dayOfMonth: value.dayOfMonth ?? 1 })}>
            <SelectTrigger id="sch-kind" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {KINDS.map((k) => (
                <SelectItem key={k.value} value={k.value}>
                  {k.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
        {value.kind === 'event' && (
          <div className="space-y-2">
            <Label htmlFor="sch-event">What starts it</Label>
            <Select value={value.event} onValueChange={(e) => set({ event: e as EventKey })}>
              <SelectTrigger id="sch-event" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Object.entries(EVENTS).map(([k, label]) => (
                  <SelectItem key={k} value={k}>
                    {label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {value.kind === 'once' && (
          <div className="space-y-2">
            <Label htmlFor="sch-date">Date</Label>
            <Input id="sch-date" type="date" value={value.date ?? ''} onChange={(e) => set({ date: e.target.value })} />
          </div>
        )}
        {value.kind === 'weekly' && (
          <div className="space-y-2">
            <Label htmlFor="sch-dow">Day of the week</Label>
            <Select value={String(value.weekday ?? 1)} onValueChange={(d) => set({ weekday: Number(d) })}>
              <SelectTrigger id="sch-dow" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {WEEKDAYS.map((d, i) => (
                  <SelectItem key={d} value={String(i)}>
                    {d}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )}
        {value.kind === 'monthly' && (
          <div className="space-y-2">
            <Label htmlFor="sch-dom">Day of the month</Label>
            <Input id="sch-dom" type="number" min={1} max={28} value={value.dayOfMonth ?? 1} onChange={(e) => set({ dayOfMonth: Math.min(28, Math.max(1, Number(e.target.value) || 1)) })} />
            <p className="text-muted-foreground text-xs">Up to the 28th, so it runs in every month.</p>
          </div>
        )}
      </div>
      {value.kind !== 'event' && (
        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <Label htmlFor="sch-time">Time</Label>
            <Input id="sch-time" type="time" value={value.time} onChange={(e) => set({ time: e.target.value || '09:00' })} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="sch-tz">Timezone</Label>
            <Select value={value.timezone} onValueChange={(t) => set({ timezone: t })}>
              <SelectTrigger id="sch-tz" className="w-full">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {TIMEZONES.map((t) => (
                  <SelectItem key={t} value={t}>
                    {t}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      )}
      <p className="bg-muted rounded-md px-3 py-2 text-[13px]" aria-live="polite">
        <span className="text-muted-foreground">Runs: </span>
        <span className="font-medium">{describeSchedule(value)}</span>
      </p>
    </div>
  )
}
