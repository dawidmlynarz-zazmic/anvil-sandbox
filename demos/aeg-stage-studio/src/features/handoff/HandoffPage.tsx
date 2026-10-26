import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { WidgetMetricCard, WidgetMetricGroup } from '@anvil/components/agent/widget-metric-card'
import { Alert, AlertDescription, AlertTitle } from '@anvil/components/ui/alert'
import { Badge } from '@anvil/components/ui/badge'
import { Button } from '@anvil/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@anvil/components/ui/card'
import { EmptyState, EmptyStateDescription, EmptyStateHeader, EmptyStateMedia, EmptyStateTitle } from '@anvil/components/ui/empty-state'
import { CheckIcon, DownloadIcon, Icon, PackageIcon, PlusIcon } from '@anvil/components/ui/icon'
import { Tabs, TabsList, TabsTrigger } from '@anvil/components/ui/tabs'
import { CheckRow } from '@anvil/components/anvil/check-row'
import { KeyValueList, KeyValueRow } from '@anvil/components/anvil/key-value-row'
import { Timeline, TimelineItem } from '@anvil/components/anvil/timeline'
import { NewProjectDialog } from '~/app/NewProjectDialog'
import { STEP_CONTENT } from '~/components/layout'
import { StillImage } from '~/components/StillImage'
import { MODEL } from '~/components/ModelBadge'
import { VenueChecks } from './VenueChecks'
import { venueOf } from '~/mocks/venues'
import { MOVE_TITLE, moveOf } from '~/services/generation'
import { PILOT_ONLY } from '~/services/kit'
import { momentLight } from '~/services/light'
import { limitRows } from '~/services/venueCheck'
import { clipKey, useProject } from '~/state/ProjectContext'
import { kitStatus, lookFor } from '~/state/show'
import { TIME_LABEL, type Asset, type Generation, type Kit, type MotionClip, type SetlistMoment } from '~/state/types'

/** Who builds from the package. Each trade gets its own view: only what it needs, per key moment. */
const TRADES = [
  { id: 'overview', label: 'Overview' },
  { id: 'staging', label: 'Staging and rigging' },
  { id: 'lighting', label: 'Lighting' },
  { id: 'video', label: 'Video and LED' },
  { id: 'camera', label: 'Camera' },
  { id: 'rights', label: 'Rights and log' },
] as const
type Trade = (typeof TRADES)[number]['id']

interface Row {
  moment: SetlistMoment
  look: Generation
  clip?: MotionClip
  kit?: Kit
}

/** A row of small stills from the kit, for one trade (light states for lighting, angles for camera). */
function Thumbs({ look, assets, empty }: { look: Generation; assets: Asset[]; empty: string }) {
  if (!assets.length) return <span className="text-muted-foreground type-text-xs-normal">{empty}</span>
  return (
    <ul className="flex flex-wrap gap-2">
      {assets.map((a) =>
        a.spec ? (
          <li key={a.id} className="flex w-28 flex-col gap-1">
            <StillImage still={{ spec: a.spec, image: look.image }} alt={a.title} className="aspect-video w-full rounded-md object-cover" />
            <span className="text-muted-foreground truncate type-text-2xs-medium">{a.title}</span>
          </li>
        ) : null,
      )}
    </ul>
  )
}

/** One key moment in a trade's view: its look, and that trade's part of it. */
function MomentRow({ row, children }: { row: Row; children: React.ReactNode }) {
  return (
    <li className="border-border grid grid-cols-[7rem_1fr] gap-4 border-t pt-4 first:border-t-0 first:pt-0">
      <div className="flex flex-col gap-1">
        <StillImage still={row.look} alt={`Song ${row.moment.number}: #${row.look.n}`} className="aspect-video w-full rounded-md object-cover" />
        <span className="type-text-xs-semibold">
          Song {row.moment.number} · {row.moment.title}
        </span>
      </div>
      <div className="flex min-w-0 flex-col gap-2">{children}</div>
    </li>
  )
}

/** The end of the loop: everything production needs, once the artist has approved, organised by trade. */
export function HandoffPage() {
  const navigate = useNavigate()
  const p = useProject()
  const { moments, clips, status, review, versions, sentVersion, daysSinceBrief, artistRating, exported, exportPackage, path, generations, meta } = p
  const [creating, setCreating] = useState(false)
  const [params, setParams] = useSearchParams()
  const trade: Trade = TRADES.some((t) => t.id === params.get('trade')) ? (params.get('trade') as Trade) : 'overview'
  const approved = status === 'approved'
  const venue = venueOf(p.brief.venueId)
  const open = review.filter((c) => !c.resolved)
  const sends = versions.filter((v) => v.summary.startsWith('Sent to the artist')).length
  const rows: Row[] = moments.flatMap((m) => {
    const look = lookFor(p, m.number)
    const slot = look ? clips[clipKey(look.id, m.number)] : undefined
    const kit = kitStatus(p, m.number) === 'ready' ? p.kits[m.number] : undefined
    return look ? [{ moment: m, look, clip: slot?.status === 'ready' ? slot.clip : undefined, kit }] : []
  })
  const kitAssets = rows.reduce((n, r) => n + (r.kit?.assets.length ?? 0), 0)
  const withKits = rows.filter((r) => r.kit).length
  const yours = generations.filter((g) => g.author === 'you').length
  const of = (row: Row, kind: Asset['kind']) => row.kit?.assets.filter((a) => a.kind === kind) ?? []

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
              Once the artist approves the show, its package comes together here, organised for each team that builds it: staging and rigging,
              lighting, video and LED, camera, and legal.
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
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h1 id="handoff-title" tabIndex={-1} className="type-heading-2xl outline-none">
                  Handoff
                </h1>
                <Badge tone="success" variant="subtle">
                  Show approved
                </Badge>
              </div>
              <Button onClick={exportPackage} disabled={exported}>
                <Icon icon={DownloadIcon} />
                {exported ? 'Exported' : 'Export package'}
              </Button>
            </div>
            <p className="text-muted-foreground type-text-sm-normal">
              Everything production needs to build the approved show, organised by team.
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
                Each team has its part: every song’s look, clip, asset kit and venue checks, the cue sheet and the decision log. Legal still
                confirms the pending items. This is a demo, so nothing left the app.
              </AlertDescription>
            </Alert>
          )}

          <Tabs value={trade} onValueChange={(next) => setParams(next === 'overview' ? {} : { trade: next }, { replace: true })}>
            <TabsList variant="line" aria-label="Package by team" className="max-w-full overflow-x-auto">
              {TRADES.map((t) => (
                <TabsTrigger key={t.id} value={t.id}>
                  {t.label}
                </TabsTrigger>
              ))}
            </TabsList>
          </Tabs>

          {trade === 'overview' && (
            <>
              <section aria-labelledby="value-title" className="flex flex-col gap-2">
                <h2 id="value-title" className="type-text-base-semibold">
                  Value to prove
                </h2>
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
                  <CardTitle>The show</CardTitle>
                  <CardDescription>
                    Every song with its look.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <ul className="grid grid-cols-2 gap-4">
                    {rows.map(({ moment, look, clip, kit }) => (
                      <li key={moment.number} className="flex flex-col gap-1">
                        <StillImage still={look} alt={`Song ${moment.number} · ${moment.title}: #${look.n}`} model={MODEL.still} className="aspect-video w-full rounded-lg object-cover" />
                        <span className="type-text-sm-semibold">
                          Song {moment.number} · {moment.title}
                        </span>
                        <span className="text-muted-foreground type-text-xs-normal">
                          #{look.n} · {look.caption} · {clip ? `clip v${clip.version}` : 'no clip'} · {kit ? `kit of ${kit.assets.length}` : 'no kit'}
                        </span>
                      </li>
                    ))}
                  </ul>
                </CardContent>
              </Card>

              <Card>
                <CardHeader>
                  <CardTitle>Package</CardTitle>
                  <CardDescription>What the export contains.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <CheckRow>{rows.length} looks, hi-res</CheckRow>
                  <CheckRow>Motion previews ({rows.filter((r) => r.clip).length} clips)</CheckRow>
                  <CheckRow status={withKits === rows.length ? 'included' : 'pending'}>
                    Asset kits ({kitAssets} assets across {withKits} of {rows.length} songs)
                  </CheckRow>
                  <CheckRow>Cue sheets for lighting, video and camera</CheckRow>
                  <CheckRow>Provenance for every image and clip, and the decision log</CheckRow>
                  <CheckRow status="pending">Venue checks: confirm against real specs and a structural engineer</CheckRow>
                  <CheckRow status={exported ? 'included' : 'pending'}>Export to [production team’s tools]</CheckRow>
                </CardContent>
              </Card>
            </>
          )}

          {trade === 'staging' && (
            <Card>
              <CardHeader>
                <CardTitle>For the production manager and stage builder</CardTitle>
                <CardDescription>Each song’s look: its footprint and how it fits {venue.name}.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <ul className="flex flex-col gap-4">
                  {rows.map((row) => (
                    <MomentRow key={row.moment.number} row={row}>
                      <VenueChecks spec={row.look.spec} brief={p.brief} reworked={row.look.reworked} />
                    </MomentRow>
                  ))}
                </ul>
                <section aria-label="Venue limits" className="flex flex-col gap-2">
                  <div className="flex items-center gap-2">
                    <span className="type-text-sm-semibold">{venue.name} limits</span>
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
                  <p className="text-muted-foreground type-text-xs-normal">Production confirms these with the venue’s real specs and a structural engineer.</p>
                </section>
              </CardContent>
            </Card>
          )}

          {trade === 'lighting' && (
            <Card>
              <CardHeader>
                <CardTitle>For the lighting designer</CardTitle>
                <CardDescription>Each song’s light, its lighting cue, and the light states from its asset kit.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-4">
                  {rows.map((row) => (
                    <MomentRow key={row.moment.number} row={row}>
                      <KeyValueList>
                        <KeyValueRow label="Plays in">{TIME_LABEL[momentLight(p.brief, row.moment.number, moments.length)]}</KeyValueRow>
                        <KeyValueRow label="Cue">{row.clip?.cue.lighting ?? 'No clip yet'}</KeyValueRow>
                        <KeyValueRow label="Look">{row.look.caption}</KeyValueRow>
                      </KeyValueList>
                      <Thumbs look={row.look} assets={of(row, 'light')} empty="No light states yet. Build the asset kit on the song’s page." />
                    </MomentRow>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {trade === 'video' && (
            <Card>
              <CardHeader>
                <CardTitle>For the video and LED team</CardTitle>
                <CardDescription>Each song’s LED content, its clip, and the extra camera moves from its asset kit.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <ul className="flex flex-col gap-4">
                  {rows.map((row) => (
                    <MomentRow key={row.moment.number} row={row}>
                      <KeyValueList>
                        <KeyValueRow label="LED content">{row.clip?.cue.led ?? 'No clip yet'}</KeyValueRow>
                        <KeyValueRow label="Clip">{row.clip ? `v${row.clip.version}, 8 s${row.clip.edits.length ? ` · edited: ${row.clip.edits.join('; ')}` : ''}` : 'Not rendered'}</KeyValueRow>
                        <KeyValueRow label="Variants">{of(row, 'motion').map((a) => a.title).join(', ') || 'None yet'}</KeyValueRow>
                      </KeyValueList>
                    </MomentRow>
                  ))}
                </ul>
                <div className="flex flex-col gap-1.5">
                  <span className="type-text-sm-semibold">With the pilot models</span>
                  {PILOT_ONLY.map((x) => (
                    <CheckRow key={x.title} status="pending">
                      <span className="type-text-sm-medium">{x.title}</span>
                      <span className="text-muted-foreground type-text-xs-normal"> · {x.detail}</span>
                    </CheckRow>
                  ))}
                </div>
              </CardContent>
            </Card>
          )}

          {trade === 'camera' && (
            <Card>
              <CardHeader>
                <CardTitle>For the camera director and livestream</CardTitle>
                <CardDescription>Each song’s camera move, and the extra angles from its asset kit.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-4">
                  {rows.map((row) => (
                    <MomentRow key={row.moment.number} row={row}>
                      <KeyValueList>
                        <KeyValueRow label="Move">{row.clip ? `${MOVE_TITLE[moveOf(row.clip)]}, 8 s` : 'No clip yet'}</KeyValueRow>
                      </KeyValueList>
                      <Thumbs look={row.look} assets={of(row, 'angle')} empty="No extra angles yet. Build the asset kit on the song’s page." />
                    </MomentRow>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {trade === 'rights' && (
            <div className="grid grid-cols-1 items-start gap-4 @xl:grid-cols-2">
              <div className="@xl:col-span-2">
                <Card>
                  <CardHeader>
                    <CardTitle>Credits</CardTitle>
                    <CardDescription>Who made which decisions. The agent explored; people chose.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <KeyValueList>
                      <KeyValueRow label="Creative direction">
                        AEG Presents creative team: chose {rows.length} looks, 
                        {yours ? `asked for ${yours} of the ${generations.length} images, ` : ''}sent {sends} {sends === 1 ? 'review' : 'reviews'} to the artist
                      </KeyValueRow>
                      <KeyValueRow label="Artist">
                        {meta.artist}: commented on the show and approved it{artistRating ? `, rated ${artistRating}/5` : ''}; owns every output
                      </KeyValueRow>
                      <KeyValueRow label="Stage agent">
                        Explored {generations.length - yours} images, drafted the prompts, built {withKits} {withKits === 1 ? 'kit' : 'kits'} and checked every design against
                        the venue
                      </KeyValueRow>
                    </KeyValueList>
                  </CardContent>
                </Card>
              </div>
              <Card>
                <CardHeader>
                  <CardTitle>Rights and provenance</CardTitle>
                  <CardDescription>Residency terms, and what legal should confirm before production use.</CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-2">
                  <CheckRow>Artist owns the outputs</CheckRow>
                  <CheckRow>SynthID watermark on every image and clip</CheckRow>
                  <CheckRow>Provenance on every image and kit asset: model, prompt, source, who asked</CheckRow>
                  <CheckRow status="pending">C2PA credentials: check per model (Nano Banana Pro, Veo 3.1)</CheckRow>
                  <CheckRow status="pending">Google gen AI indemnity covers GA Gemini and Veo models · legal to confirm scope</CheckRow>
                  <CheckRow status="pending">Clip edits used Gemini Omni Flash, in preview · confirm cover</CheckRow>
                </CardContent>
              </Card>
              <Card>
                <CardHeader>
                  <CardTitle>Decision log</CardTitle>
                  <CardDescription>How the show got here, and who decided.</CardDescription>
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
                          {c.number}. Song {c.song}: {c.text}
                        </p>
                      ))}
                    </div>
                  )}
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
