import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { WidgetMetricCard, WidgetMetricGroup } from '@anvil/components/agent/widget-metric-card'
import { Alert, AlertDescription, AlertTitle } from '@anvil/components/ui/alert'
import { Badge } from '@anvil/components/ui/badge'
import { Button } from '@anvil/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@anvil/components/ui/card'
import { EmptyState, EmptyStateDescription, EmptyStateHeader, EmptyStateMedia, EmptyStateTitle } from '@anvil/components/ui/empty-state'
import { CheckIcon, DownloadIcon, Icon, PackageIcon } from '@anvil/components/ui/icon'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@anvil/components/ui/table'
import { CheckRow } from '@anvil/components/anvil/check-row'
import { Timeline, TimelineItem } from '@anvil/components/anvil/timeline'
import { StepFooter } from '~/components/StepFooter'
import { GUARDRAIL } from '~/mocks/copy'
import { clipKey, useProject } from '~/state/ProjectContext'

/** The end of the loop: everything production needs, once the artist has approved. */
export function HandoffPage() {
  const navigate = useNavigate()
  const { brief, rounds, motionStills, clips, status, review, versions, sentVersion, daysSinceBrief, path } = useProject()
  const [exported, setExported] = useState(false)
  const approved = status === 'approved'
  const stills = rounds.flatMap((r) => r.stills).filter((s) => motionStills.includes(s.id))
  const open = review.filter((c) => !c.resolved)

  if (!approved) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState>
          <EmptyStateMedia variant="icon">
            <Icon icon={PackageIcon} />
          </EmptyStateMedia>
          <EmptyStateHeader>
            <EmptyStateTitle>Handoff unlocks on approval</EmptyStateTitle>
            <EmptyStateDescription>
              Once the artist approves a version, this is where the production team’s package comes together: stills,
              motion, the cue sheet and the decision log.
            </EmptyStateDescription>
          </EmptyStateHeader>
          <Button variant="outline" intent="neutral" onClick={() => navigate(path(sentVersion ? 'review' : 'stills'))}>
            {sentVersion ? 'Go to review' : 'Go to stills'}
          </Button>
        </EmptyState>
      </div>
    )
  }

  return (
    <section aria-labelledby="handoff-title" className="flex h-full min-w-0 flex-col">
      <div className="relative min-h-0 flex-1 overflow-y-auto p-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <h1 id="handoff-title" tabIndex={-1} className="type-heading-2xl outline-none">
                Handoff
              </h1>
              <Badge tone="success" variant="subtle">
                Version {sentVersion} approved
              </Badge>
            </div>
            <p className="text-muted-foreground type-text-sm-normal">
              Everything the production team needs to build the approved design, in one package. {GUARDRAIL}
            </p>
          </div>

          <WidgetMetricGroup>
            <WidgetMetricCard label="Rounds to approval" value={rounds.length} period="Concept rounds from the brief" />
            <WidgetMetricCard label="Days to approval" value={daysSinceBrief} period="From brief to sign-off" />
            <WidgetMetricCard label="Artist comments addressed" value={`${review.length - open.length} of ${review.length}`} period="On the approved version" />
          </WidgetMetricGroup>

          <Card>
            <CardHeader>
              <CardTitle>Approved design</CardTitle>
              <CardDescription>The concept{stills.length === 1 ? '' : 's'} the artist signed off.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid grid-cols-2 gap-4">
                {stills.map((s) => (
                  <li key={s.id} className="flex flex-col gap-2">
                    <img src={s.image} alt={`Approved concept ${s.title}`} className="aspect-video w-full rounded-lg object-cover" />
                    <span className="type-text-sm-semibold">{s.title}</span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cue sheet by song</CardTitle>
              <CardDescription>Lighting, LED content and camera for each key moment, including your edits.</CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Song</TableHead>
                    <TableHead>Lighting</TableHead>
                    <TableHead>LED content</TableHead>
                    <TableHead>Camera</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {brief.moments.map((m) => {
                    const slot = stills[0] ? clips[clipKey(stills[0].id, m.number)] : undefined
                    const clip = slot?.status === 'ready' ? slot.clip : undefined
                    return (
                      <TableRow key={m.number}>
                        <TableCell className="type-text-sm-medium">
                          {m.number} · {m.title}
                        </TableCell>
                        <TableCell>{clip?.cue.lighting ?? '—'}</TableCell>
                        <TableCell>{clip?.cue.led ?? '—'}</TableCell>
                        <TableCell>
                          {clip?.cue.camera ?? '—'}
                          {clip?.edits.length ? <span className="text-muted-foreground"> · edited: {clip.edits.join('; ')}</span> : null}
                        </TableCell>
                      </TableRow>
                    )
                  })}
                </TableBody>
              </Table>
            </CardContent>
          </Card>

          <div className="grid grid-cols-2 items-start gap-4">
            <Card>
              <CardHeader>
                <CardTitle>Decision log</CardTitle>
                <CardDescription>How the design got here, version by version.</CardDescription>
              </CardHeader>
              <CardContent>
                <Timeline>
                  {versions.map((v, i) => (
                    <TimelineItem
                      key={v.number}
                      tone={v.summary.startsWith('Approved') ? 'success' : v.number === sentVersion ? 'agent' : 'neutral'}
                      title={<span className="type-text-xs-medium">v{v.number} · {v.summary}</span>}
                      detail={`${v.author} · ${v.time}`}
                      last={i === versions.length - 1}
                    />
                  ))}
                </Timeline>
                {open.length > 0 && (
                  <div className="flex flex-col gap-1 pt-2">
                    <p className="type-text-xs-semibold">Left open at approval</p>
                    {open.map((c) => (
                      <p key={c.id} className="text-muted-foreground type-text-xs-normal">
                        {c.number}. {c.text}
                      </p>
                    ))}
                  </div>
                )}
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Package</CardTitle>
                <CardDescription>What the export contains.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <CheckRow>Hi-res concept stills</CheckRow>
                <CheckRow>Motion previews ({Object.values(clips).filter((c) => c.status === 'ready').length} clips)</CheckRow>
                <CheckRow>Cue sheet by song</CheckRow>
                <CheckRow>Prompt and decision log</CheckRow>
                <CheckRow status={exported ? 'included' : 'pending'}>Export to [production team’s tools]</CheckRow>
              </CardContent>
            </Card>
          </div>

          {exported && (
            <Alert tone="success" role="status">
              <Icon icon={CheckIcon} />
              <AlertTitle>Package exported</AlertTitle>
              <AlertDescription>Sent to [production team’s tools]. This is a demo, so nothing left the app.</AlertDescription>
            </Alert>
          )}
        </div>
      </div>
      <StepFooter note="The artist owns everything in the package." status={exported ? 'Exported' : 'Ready to export'}>
        <Button onClick={() => setExported(true)} disabled={exported}>
          <Icon icon={DownloadIcon} />
          {exported ? 'Exported' : 'Export package'}
        </Button>
      </StepFooter>
    </section>
  )
}
