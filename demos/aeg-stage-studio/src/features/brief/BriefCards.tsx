import { useState } from 'react'
import { Badge } from '@anvil/components/ui/badge'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@anvil/components/ui/card'
import { ChevronRightIcon, CircleCheckIcon, CircleDashedIcon, Icon } from '@anvil/components/ui/icon'
import { Button } from '@anvil/components/ui/button'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@anvil/components/ui/collapsible'
import { Calendar } from '@anvil/components/ui/calendar'
import { DatePicker, DatePickerContent, DatePickerTrigger } from '@anvil/components/ui/date-picker'
import { Input } from '@anvil/components/ui/input'
import { Label } from '@anvil/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@anvil/components/ui/select'
import { Textarea } from '@anvil/components/ui/textarea'
import { KeyValueList, KeyValueRow } from '@anvil/components/anvil/key-value-row'
import { DaylightTimeline } from '~/components/local/DaylightTimeline/DaylightTimeline'
import { setTimes, SUNSET } from '~/services/light'
import { fromISODate, toISODate, weekdayOf } from '~/lib/time'
import { budgetBands } from '~/mocks/project'
import { venueOf, venues } from '~/mocks/venues'
import { limitRows } from '~/services/venueCheck'
import { TagInput } from '~/components/local/TagInput/TagInput'
import { useProject } from '~/state/ProjectContext'
import { briefReadiness } from '~/state/readiness'
import type { BriefSection } from '~/state/types'

/**
 * Title + explainer shared by the brief cards. The badge matches the section's line in “Still to cover” (same rule,
 * same tick or dashed circle), and says who filled it in when that's known.
 */
function SectionHeader({ title, section, children }: { title: string; section: BriefSection; children: React.ReactNode }) {
  const p = useProject()
  const done = briefReadiness(p).items.find((i) => i.key === section)?.done ?? false
  const by = p.provenance[section] === 'agent' ? ' by the agent' : p.provenance[section] === 'you' ? ' by you' : ''
  return (
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardAction>
        <Badge tone={done ? 'success' : 'neutral'} variant={done ? 'subtle' : 'outline'} size="sm">
          <Icon icon={done ? CircleCheckIcon : CircleDashedIcon} />
          {done ? `Filled${by}` : 'To fill'}
        </Badge>
      </CardAction>
      <CardDescription>{children}</CardDescription>
    </CardHeader>
  )
}

export function VenueCard() {
  const { brief, patchBrief } = useProject()
  const venue = venueOf(brief.venueId)
  return (
    <Card>
      <SectionHeader title="Venue" section="venue">
          Every design is checked against its limits.
        </SectionHeader>
      <CardContent className="flex flex-col gap-4">
        <Select value={brief.venueId} onValueChange={(venueId) => patchBrief({ venueId })}>
          <SelectTrigger label="Venue" hint={`${venue.kind}${venue.event ? ` · ${venue.event}` : ''}`}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {venues.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.name} · {v.event ?? v.city}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Collapsible className="flex flex-col gap-3">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" intent="neutral" size="sm" className="group -ms-2 self-start">
              <Icon icon={ChevronRightIcon} className="transition-transform group-data-[state=open]:rotate-90" />
              About {venue.name} and its specs
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="flex flex-col gap-4">
            <section aria-label="About the venue" className="flex flex-col gap-2">
              {venue.about && <p className="type-text-sm-normal">{venue.about}</p>}
              <KeyValueList>
                <KeyValueRow label="City">{venue.city}</KeyValueRow>
                {venue.capacity && <KeyValueRow label="Capacity">{venue.capacity}</KeyValueRow>}
                {venue.opened && <KeyValueRow label="Opened">{venue.opened}</KeyValueRow>}
                <KeyValueRow label="Roof">{venue.covered ? 'Covered: lit as night all show' : 'Open air: the sun sets during some slots'}</KeyValueRow>
              </KeyValueList>
              <p className="text-muted-foreground type-text-xs-normal">Source: {venue.source}</p>
            </section>
            <section aria-label="Technical specs" className="flex flex-col gap-2">
              <div className="flex items-center gap-2">
                <span className="type-text-sm-semibold">Technical specs</span>
                <Badge tone="warning" variant="outline" size="xs">
                  Sample
                </Badge>
              </div>
              <KeyValueList>
                {limitRows(venue).map((r) => (
                  <KeyValueRow key={r.label} label={r.label}>
                    {r.value}
                  </KeyValueRow>
                ))}
              </KeyValueList>
              <p className="text-muted-foreground type-text-xs-normal">
                Sample values until AEG’s venue library is connected. The agent checks every design against them{venue.limits.gusts ? ', including the wind' : ''}.
              </p>
            </section>
          </CollapsibleContent>
        </Collapsible>
      </CardContent>
    </Card>
  )
}

export function SlotCard() {
  const { brief, patchBrief } = useProject()
  const { slot } = brief
  const [picking, setPicking] = useState(false)
  const date = slot.date ? fromISODate(slot.date) : undefined
  const set = (key: keyof typeof slot) => (e: React.ChangeEvent<HTMLInputElement>) =>
    patchBrief({ slot: { ...slot, [key]: e.target.value } })
  const { start, end } = setTimes(brief)
  return (
    <Card>
      <SectionHeader title="Performance time slot" section="slot">
        Sets how much daylight each key moment has.
      </SectionHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-1 items-start gap-3 @md:grid-cols-[1.3fr_1fr_1fr]">
          {/* The show date: picked from a calendar. Start time and length stay plain fields. */}
          <div className="flex flex-col gap-2">
            <Label htmlFor="slot-date">Date</Label>
            <DatePicker open={picking} onOpenChange={setPicking}>
              <DatePickerTrigger id="slot-date" className="w-full" placeholder="Pick the show date">
                {date?.toLocaleDateString('en-GB', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' })}
              </DatePickerTrigger>
              <DatePickerContent>
                <Calendar
                  mode="single"
                  selected={date}
                  defaultMonth={date}
                  onSelect={(next) => {
                    if (!next) return
                    const iso = toISODate(next)
                    patchBrief({ slot: { ...slot, date: iso, day: weekdayOf(iso) } })
                    setPicking(false)
                  }}
                />
              </DatePickerContent>
            </DatePicker>
          </div>
          <Input label="Start time" hint="e.g. 7:40 pm" value={slot.time} onChange={set('time')} />
          <Input label="Length" hint="in minutes" value={slot.length} onChange={set('length')} />
        </div>
        <DaylightTimeline start={start} end={end} sunset={SUNSET} />
        <p className="text-muted-foreground type-text-xs-normal">
          Shows your set against the day’s light. Sunset is a placeholder until the real date and venue are set.
        </p>
      </CardContent>
    </Card>
  )
}

export function VisualDirectionCard() {
  const { brief, patchBrief } = useProject()
  return (
    <Card>
      <SectionHeader title="Visual direction" section="visual">
        Steers every image and clip, with your {brief.referenceCount} reference image{brief.referenceCount === 1 ? '' : 's'}.
      </SectionHeader>
      <CardContent>
        <TagInput
          label="Keywords"
          placeholder="e.g. brutalist, neon, haze"
          hint="Separate keywords with commas."
          value={brief.keywords}
          onValueChange={(keywords) => patchBrief({ keywords })}
        />
      </CardContent>
    </Card>
  )
}

export function ConstraintsCard() {
  const { brief, patchBrief } = useProject()
  const { constraints } = brief
  const set = (key: keyof typeof constraints, value: string) => patchBrief({ constraints: { ...constraints, [key]: value } })
  return (
    <Card>
      <SectionHeader title="Constraints" section="constraints">
          The no-gos and budget every design stays inside.
        </SectionHeader>
      <CardContent className="flex flex-col gap-4">
        <Select value={constraints.budget} onValueChange={(v) => set('budget', v)}>
          <SelectTrigger label="Budget band" hint="A rough production budget, used to keep designs buildable.">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {budgetBands.map((b) => (
              <SelectItem key={b.value} value={b.value}>
                {b.label}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <Input
          label="Venue rules"
          hint="Rigging weight, pyro, haze, curfews and similar."
          value={constraints.venueRules}
          onChange={(e) => set('venueRules', e.target.value)}
        />
        <Textarea
          label="Artist no-go list"
          hint="Anything the artist never wants to see. One per line."
          rows={2}
          value={constraints.noGo}
          onChange={(e) => set('noGo', e.target.value)}
        />
      </CardContent>
    </Card>
  )
}
