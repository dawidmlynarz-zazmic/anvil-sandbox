import { useState } from 'react'
import { Badge } from '@anvil/components/ui/badge'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@anvil/components/ui/card'
import { Button } from '@anvil/components/ui/button'
import { Icon, PlusIcon, SparklesIcon, UserIcon, XIcon } from '@anvil/components/ui/icon'
import { Input } from '@anvil/components/ui/input'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@anvil/components/ui/input-group'
import { Label } from '@anvil/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@anvil/components/ui/select'
import { Textarea } from '@anvil/components/ui/textarea'
import { Chip } from '@anvil/components/anvil/chip'
import { KeyValueList, KeyValueRow } from '@anvil/components/anvil/key-value-row'
import { DaylightTimeline } from '~/components/local/DaylightTimeline/DaylightTimeline'
import { parseClock, parseLength } from '~/lib/time'
import { budgetBands } from '~/mocks/project'
import { venues } from '~/mocks/venues'
import { useProject } from '~/state/ProjectContext'
import type { BriefSection } from '~/state/types'

/** Title + explainer shared by the brief cards, with who last set the section: the agent or you. */
function SectionHeader({ title, section, children }: { title: string; section: BriefSection; children: React.ReactNode }) {
  const { provenance } = useProject()
  return (
    <CardHeader>
      <CardTitle>{title}</CardTitle>
      <CardAction>
        {provenance[section] === 'agent' ? (
          <Badge tone="agent" variant="subtle" size="sm">
            <Icon icon={SparklesIcon} />
            From the agent
          </Badge>
        ) : (
          <Badge tone="neutral" variant="outline" size="sm">
            <Icon icon={UserIcon} />
            Edited by you
          </Badge>
        )}
      </CardAction>
      <CardDescription>{children}</CardDescription>
    </CardHeader>
  )
}

export function VenueCard() {
  const { brief, patchBrief } = useProject()
  const venue = venues.find((v) => v.id === brief.venueId) ?? venues[0]!
  return (
    <Card>
      <SectionHeader title="Venue" section="venue">
          Where the show happens. The agent loads the venue’s technical specs, so concepts only use what the stage can
          really hold.
        </SectionHeader>
      <CardContent className="flex flex-col gap-4">
        <Select value={brief.venueId} onValueChange={(venueId) => patchBrief({ venueId })}>
          <SelectTrigger label="Venue" hint={venue.kind}>
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {venues.map((v) => (
              <SelectItem key={v.id} value={v.id}>
                {v.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
        <KeyValueList>
          <KeyValueRow label="Stage width">{venue.specs.stageWidth}</KeyValueRow>
          <KeyValueRow label="LED wall">{venue.specs.ledWall}</KeyValueRow>
          <KeyValueRow label="Rigging limits">{venue.specs.rigging}</KeyValueRow>
          <KeyValueRow label="3D stage model">{venue.specs.model3d}</KeyValueRow>
        </KeyValueList>
        <p className="text-muted-foreground type-text-xs-normal">
          Values in [brackets] are placeholders until AEG supplies the real venue specs.
        </p>
      </CardContent>
    </Card>
  )
}

export function SlotCard() {
  const { brief, patchBrief } = useProject()
  const { slot } = brief
  const set = (key: keyof typeof slot) => (e: React.ChangeEvent<HTMLInputElement>) =>
    patchBrief({ slot: { ...slot, [key]: e.target.value } })
  const start = parseClock(slot.time, 19 * 60 + 40)
  const end = start + parseLength(slot.length, 75)
  return (
    <Card>
      <SectionHeader title="Performance time slot" section="slot">
        When the artist plays. The time sets how much daylight the stage has, which drives the lighting in every
        concept.
      </SectionHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-3 gap-3">
          <Input label="Day" value={slot.day} onChange={set('day')} />
          <Input label="Start time" hint="e.g. 7:40 pm" value={slot.time} onChange={set('time')} />
          <Input label="Length" hint="in minutes" value={slot.length} onChange={set('length')} />
        </div>
        <DaylightTimeline start={start} end={end} sunset={19 * 60 + 14} />
        <p className="text-muted-foreground type-text-xs-normal">
          Shows your set against the day’s light. Sunset is a placeholder until the real date and venue are set.
        </p>
      </CardContent>
    </Card>
  )
}

export function VisualDirectionCard() {
  const { brief, patchBrief } = useProject()
  const [draft, setDraft] = useState('')
  const add = () => {
    const word = draft.trim()
    if (!word || brief.keywords.includes(word)) return
    patchBrief({ keywords: [...brief.keywords, word] })
    setDraft('')
  }
  return (
    <Card>
      <SectionHeader title="Visual direction" section="visual">
          A few words that steer the look. The agent turns them, and your {brief.referenceCount} reference images, into
          image and video prompts. Use the paperclip in the chat to add more references.
        </SectionHeader>
      <CardContent className="flex flex-col gap-4">
        <ul className="flex flex-wrap gap-2" aria-label="Keywords">
          {brief.keywords.map((word) => (
            <li key={word}>
              <Chip
                variant="outline"
                removeLabel={`Remove ${word}`}
                onRemove={() => patchBrief({ keywords: brief.keywords.filter((k) => k !== word) })}
              >
                {word}
              </Chip>
            </li>
          ))}
        </ul>
        <form
          className="flex flex-col gap-1.5"
          onSubmit={(e) => {
            e.preventDefault()
            add()
          }}
        >
          <Label htmlFor="keyword">Add a keyword</Label>
          <InputGroup>
            <InputGroupInput id="keyword" placeholder="e.g. brutalist, neon, haze" value={draft} onChange={(e) => setDraft(e.target.value)} />
            <InputGroupAddon align="inline-end">
              <InputGroupButton type="submit" disabled={!draft.trim()}>
                <Icon icon={PlusIcon} />
                Add
              </InputGroupButton>
            </InputGroupAddon>
          </InputGroup>
        </form>
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
          The limits concepts must stay inside. If a concept would break one, the agent leaves it out or flags it.
        </SectionHeader>
      <CardContent className="flex flex-col gap-4">
        <Select value={constraints.budget} onValueChange={(v) => set('budget', v)}>
          <SelectTrigger label="Budget band" hint="A rough production budget, used to keep concepts buildable.">
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

export function SetlistCard() {
  const { brief, patchBrief } = useProject()
  const [number, setNumber] = useState('')
  const [title, setTitle] = useState('')
  const [intent, setIntent] = useState('')
  const song = Number(number)
  const taken = brief.moments.some((m) => m.number === song)
  const valid = Number.isInteger(song) && song > 0 && !taken && title.trim().length > 0
  const add = () => {
    if (!valid) return
    const moments = [...brief.moments, { number: song, title: title.trim(), intent: intent.trim() || 'No direction yet' }]
    patchBrief({ moments: moments.sort((a, b) => a.number - b.number) })
    setNumber('')
    setTitle('')
    setIntent('')
  }
  return (
    <Card>
      <SectionHeader title="Key moments" section="moments">
        The few songs where the stage should do something memorable, such as a reveal, a big drop or the finale. The
        agent designs around them, and each one becomes an eight-second clip in the Motion step.
      </SectionHeader>
      <CardContent className="flex flex-col gap-4">
        <ul className="grid grid-cols-2 gap-3">
          {brief.moments.map((m) => (
            <li key={m.number}>
              <Card size="sm" className="h-full">
                <CardContent className="flex flex-col gap-2">
                  <div className="flex items-center justify-between gap-2">
                    <Badge tone="agent" variant="subtle" size="sm">
                      Song {m.number}
                    </Badge>
                    <Button
                      variant="ghost"
                      intent="neutral"
                      size="icon-xs"
                      aria-label={`Remove song ${m.number}, ${m.title}`}
                      onClick={() => patchBrief({ moments: brief.moments.filter((x) => x.number !== m.number) })}
                    >
                      <Icon icon={XIcon} />
                    </Button>
                  </div>
                  <p className="type-text-sm-semibold">{m.title}</p>
                  <p className="text-muted-foreground type-text-xs-normal">{m.intent}</p>
                </CardContent>
              </Card>
            </li>
          ))}
        </ul>
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            add()
          }}
        >
          <p className="type-text-sm-semibold">Add a moment</p>
          <div className="grid grid-cols-[6rem_1fr] gap-3">
            <Input label="Song" inputMode="numeric" placeholder="e.g. 9" value={number} onChange={(e) => setNumber(e.target.value)} aria-invalid={taken || undefined} hint={taken ? 'Already a key moment' : undefined} />
            <Input label="Moment" placeholder="e.g. Sunset drop" value={title} onChange={(e) => setTitle(e.target.value)} />
          </div>
          <Input label="What should happen" placeholder="e.g. The LED wall peaks with the sun" value={intent} onChange={(e) => setIntent(e.target.value)} />
          <Button type="submit" variant="outline" intent="neutral" className="self-start" disabled={!valid}>
            <Icon icon={PlusIcon} />
            Add moment
          </Button>
        </form>
      </CardContent>
    </Card>
  )
}
