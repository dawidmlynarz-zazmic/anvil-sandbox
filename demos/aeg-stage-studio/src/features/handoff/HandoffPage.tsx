import { useNavigate } from 'react-router-dom'
import { WidgetMetricCard, WidgetMetricGroup } from '@anvil/components/agent/widget-metric-card'
import { Alert, AlertDescription, AlertTitle } from '@anvil/components/ui/alert'
import { Badge } from '@anvil/components/ui/badge'
import { Button } from '@anvil/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@anvil/components/ui/card'
import { EmptyState, EmptyStateDescription, EmptyStateHeader, EmptyStateMedia, EmptyStateTitle } from '@anvil/components/ui/empty-state'
import { CheckIcon, DownloadIcon, Icon, PackageIcon, PlusIcon } from '@anvil/components/ui/icon'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@anvil/components/ui/table'
import { CheckRow } from '@anvil/components/anvil/check-row'
import { Timeline, TimelineItem } from '@anvil/components/anvil/timeline'
import { STEP_CONTENT } from '~/components/layout'
import { StepFooter } from '~/components/StepFooter'
import { GUARDRAIL } from '~/mocks/copy'
import { clipKey, useProject } from '~/state/ProjectContext'
import { useState } from 'react'
import { NewProjectDialog } from '~/app/NewProjectDialog'
import { revealTop } from '~/lib/reveal'
import { StillImage } from '~/components/StillImage'
import { genById, kitStatus, lookFor } from '~/state/show'
import { SetChecks } from '~/features/show/SetChecks'

/** The end of the loop: everything production needs, once the artist has approved. */
export function HandoffPage() {
  const navigate = useNavigate()
  const p = useProject()
  const { moments, clips, status, review, versions, sentVersion, daysSinceBrief, artistRating, exported, exportPackage, path, generations, set } = p
  const [creating, setCreating] = useState(false)
  const approved = status === 'approved'
  const setSource = set ? genById(p, set.fromId) : undefined
  const open = review.filter((c) => !c.resolved)
  const sends = versions.filter((v) => v.summary.startsWith('Sent to the artist')).length
  const looks = moments.flatMap((m) => {
    const look = lookFor(p, m.number)
    const slot = look ? clips[clipKey(look.id, m.number)] : undefined
    const kit = kitStatus(p, m.number) === 'ready' ? p.kits[m.number] : undefined
    return look ? [{ moment: m, look, clip: slot?.status === 'ready' ? slot.clip : undefined, kit }] : []
  })
  const kitAssets = looks.reduce((n, l) => n + (l.kit?.assets.length ?? 0), 0)
  const withKits = looks.filter((l) => l.kit).length

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
              Once the artist approves the show, this is where the production team’s package comes together: the set,
              every moment’s look and clip, the cue sheet and the decision log.
            </EmptyStateDescription>
          </EmptyStateHeader>
          <Button variant="outline" intent="neutral" onClick={() => navigate(path(sentVersion ? 'review' : 'show'))}>
            {sentVersion ? 'Go to review' : 'Go to the show'}
          </Button>
        </EmptyState>
      </div>
    )
  }

  return (
    <section aria-labelledby="handoff-title" className="flex h-full min-w-0 flex-col">
      <NewProjectDialog open={creating} onOpenChange={setCreating} />
      <div className="step-scroll relative min-h-0 flex-1 overflow-y-auto p-6">
        <div className={`${STEP_CONTENT} gap-6`}>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <h1 id="handoff-title" tabIndex={-1} className="type-heading-2xl outline-none">
                Handoff
              </h1>
              <Badge tone="success" variant="subtle">
                Show approved
              </Badge>
            </div>
            <p className="text-muted-foreground type-text-sm-normal">
              Everything the production team needs to build the approved show, in one package. {GUARDRAIL}
            </p>
          </div>

          {exported && (
            <Alert
              tone="success"
              role="status"
              action={
                <Button size="xs" variant="outline" intent="neutral" onClick={() => setCreating(true)}>
                  <Icon icon={PlusIcon} />
                  Start the next show
                </Button>
              }
            >
              <Icon icon={CheckIcon} />
              <AlertTitle>Sent to the production team</AlertTitle>
              <AlertDescription>
                The show is with production: the set, {looks.length} moments with their looks and clips, the cue sheet and the
                decision log. Legal still confirms the pending items below. This is a demo, so nothing left the app.
              </AlertDescription>
            </Alert>
          )}

          <section aria-labelledby="value-title" className="flex flex-col gap-2">
            <h2 id="value-title" className="type-text-base-semibold">
              Value to prove
            </h2>
            <p className="text-muted-foreground type-text-xs-normal">
              The pilot’s three measures. “Today” is AEG’s current process, to be filled in with the production team.
            </p>
            <WidgetMetricGroup>
              <WidgetMetricCard label="Reviews with the artist" value={sends} period={`${generations.length} images explored · today: [typical rounds]`} />
              <WidgetMetricCard label="Days to approved show" value={daysSinceBrief} period="Today: [typical weeks]" />
              <WidgetMetricCard
                label="Artist feedback"
                value={artistRating ? `${artistRating}/5` : 'Not rated'}
                period={artistRating ? '“How close is this to your vision?”' : 'Rated by the artist at sign-off'}
              />
            </WidgetMetricGroup>
          </section>

          <Card>
            <CardHeader>
              <CardTitle>The set</CardTitle>
              <CardDescription>
                {set && setSource ? `${set.title}, locked from song ${setSource.song} #${setSource.n}. Every moment uses this structure.` : 'The set wasn’t locked: each moment’s look carries its own structure.'}
              </CardDescription>
            </CardHeader>
            {setSource && (
              <CardContent className="flex flex-col gap-4">
                <StillImage still={setSource} alt={`The set: ${set?.title}`} className="aspect-[21/9] w-full rounded-lg object-cover" />
                <SetChecks spec={setSource.spec} brief={p.brief} reworked={setSource.reworked} locked />
                <p className="text-muted-foreground type-text-xs-normal">
                  Estimates from sample venue specs. Production confirms them with the venue’s real specs and a structural engineer.
                </p>
              </CardContent>
            )}
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Key moments</CardTitle>
              <CardDescription>The look the artist signed off for each moment, in setlist order.</CardDescription>
            </CardHeader>
            <CardContent>
              <ul className="grid grid-cols-2 gap-4">
                {looks.map(({ moment, look, clip, kit }) => (
                  <li key={moment.number} className="flex flex-col gap-1.5">
                    <StillImage still={look} alt={`Song ${moment.number} · ${moment.title}: #${look.n}`} className="aspect-video w-full rounded-lg object-cover" />
                    <span className="type-text-sm-semibold">
                      Song {moment.number} · {moment.title}
                    </span>
                    <span className="text-muted-foreground type-text-xs-normal">
                      #{look.n} · {look.caption} · {clip ? `clip v${clip.version}` : 'no clip'}
                    </span>
                    <span className="text-muted-foreground type-text-xs-normal">
                      {kit ? `Asset kit: ${kit.assets.length} assets, each with its provenance` : 'No asset kit yet: build it on the moment’s Assets tab'}
                    </span>
                  </li>
                ))}
              </ul>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Cue sheet by song</CardTitle>
              <CardDescription>Lighting, LED content and camera for each key moment, including clip edits.</CardDescription>
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
                  {looks.map(({ moment: m, clip }) => {
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
            <Card className="row-span-2">
              <CardHeader>
                <CardTitle>Decision log</CardTitle>
                <CardDescription>How the show got here, step by step.</CardDescription>
              </CardHeader>
              <CardContent>
                <Timeline>
                  {versions.map((v, i) => (
                    <TimelineItem
                      key={v.number}
                      tone={/approved/i.test(v.summary) ? 'success' : v.number === sentVersion ? 'agent' : 'neutral'}
                      title={<span className="type-text-xs-medium">{v.summary}</span>}
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
                <CardTitle>Rights and provenance</CardTitle>
                <CardDescription>Residency terms, and what legal should confirm before production use.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <CheckRow>Artist owns the outputs</CheckRow>
                <CheckRow>SynthID watermark on every image and clip</CheckRow>
                <CheckRow status="pending">C2PA credentials: check per model (Nano Banana Pro, Veo 3.1)</CheckRow>
                <CheckRow status="pending">Google gen AI indemnity covers GA Gemini and Veo models · legal to confirm scope</CheckRow>
                <CheckRow status="pending">Clip edits used Gemini Omni Flash, in preview · confirm cover</CheckRow>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>Package</CardTitle>
                <CardDescription>What the export contains.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-2">
                <CheckRow>The set and {looks.length} looks, hi-res</CheckRow>
                <CheckRow>Motion previews ({looks.filter((l) => l.clip).length} clips)</CheckRow>
                <CheckRow status={withKits === looks.length ? 'included' : 'pending'}>
                  Asset kits ({kitAssets} assets across {withKits} of {looks.length} moments)
                </CheckRow>
                <CheckRow>Provenance for every image and clip</CheckRow>
                <CheckRow status="pending">Venue checks: confirm against real specs and a structural engineer</CheckRow>
                <CheckRow>Cue sheet by song</CheckRow>
                <CheckRow>Prompt and decision log</CheckRow>
                <CheckRow status={exported ? 'included' : 'pending'}>Export to [production team’s tools]</CheckRow>
              </CardContent>
            </Card>
          </div>

        </div>
      </div>
      <StepFooter note="The artist owns everything in the package." status={exported ? 'Sent to production' : 'Ready to export'}>
        <Button
          onClick={() => {
            exportPackage()
            // The confirmation sits at the top of the page: bring it into view.
            revealTop(document.querySelector('.step-scroll'))
          }}
          disabled={exported}
        >
          <Icon icon={DownloadIcon} />
          {exported ? 'Exported' : 'Export package'}
        </Button>
      </StepFooter>
    </section>
  )
}
