import { useNavigate, useSearchParams } from 'react-router-dom'
import { Alert, AlertDescription, AlertTitle } from '@anvil/components/ui/alert'
import { Badge } from '@anvil/components/ui/badge'
import { Button } from '@anvil/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@anvil/components/ui/card'
import { EmptyState, EmptyStateDescription, EmptyStateHeader, EmptyStateMedia, EmptyStateTitle } from '@anvil/components/ui/empty-state'
import { CheckIcon, DownloadIcon, Icon, PackageIcon, PencilIcon } from '@anvil/components/ui/icon'
import { Tabs, TabsList, TabsTrigger } from '@anvil/components/ui/tabs'
import { CheckRow } from '@anvil/components/anvil/check-row'
import { KeyValueList, KeyValueRow } from '@anvil/components/anvil/key-value-row'
import { STEP_CONTENT } from '~/components/layout'
import { StillImage } from '~/components/StillImage'
import { MODEL } from '~/components/ModelBadge'
import { ShowPreview } from '~/features/show/ShowPreview'
import { VenueChecks } from './VenueChecks'
import { venueOf } from '~/mocks/venues'
import { MOVE_TITLE, moveOf } from '~/services/generation'
import { momentLight } from '~/services/light'
import { limitRows } from '~/services/venueCheck'
import { handoffOutOfDate } from '~/state/project'
import { useProject } from '~/state/ProjectContext'
import { genById } from '~/state/show'
import { TIME_LABEL, type Generation, type MotionClip, type SetlistMoment } from '~/state/types'

/** Who builds from the package. Each trade gets its own view: only what it needs, per key moment. */
const TRADES = [
  { id: 'overview', label: 'Overview' },
  { id: 'staging', label: 'Staging and rigging' },
  { id: 'lighting', label: 'Lighting' },
  { id: 'video', label: 'Video and LED' },
  { id: 'camera', label: 'Camera' },
  { id: 'rights', label: 'Rights' },
] as const
type Trade = (typeof TRADES)[number]['id']

interface Row {
  moment: SetlistMoment
  look: Generation
  clip?: MotionClip
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

/** The end of the loop: everything production needs, as it was when you generated the handoff, organised by trade. */
export function HandoffPage() {
  const navigate = useNavigate()
  const p = useProject()
  const { moments, handoff, exportPackage, path, generations, meta } = p
  const [params, setParams] = useSearchParams()
  const trade: Trade = TRADES.some((t) => t.id === params.get('trade')) ? (params.get('trade') as Trade) : 'overview'
  const venue = venueOf(p.brief.venueId)
  // The songs as they went into the handoff, not as the show is now: editing the show doesn't change the package.
  const rows: Row[] = (handoff?.songs ?? []).flatMap((s) => {
    const look = genById(p, s.lookId)
    return look ? [{ moment: s.moment, look, clip: s.clip }] : []
  })
  const yours = generations.filter((g) => g.author === 'you').length

  if (!handoff) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState>
          <EmptyStateMedia variant="icon">
            <Icon icon={PackageIcon} />
          </EmptyStateMedia>
          <EmptyStateHeader>
            <EmptyStateTitle>No handoff yet</EmptyStateTitle>
            <EmptyStateDescription>
              Once every song is in motion, Generate handoff on the show board puts the package together here, organised for each team that builds
              it: staging and rigging, lighting, video and LED, camera, and legal.
            </EmptyStateDescription>
          </EmptyStateHeader>
          <Button variant="outline" intent="neutral" onClick={() => navigate(path(p.phase === 'setup' ? 'brief' : 'show'))}>
            {p.phase === 'setup' ? 'Go to the brief' : 'Go to the show'}
          </Button>
        </EmptyState>
      </div>
    )
  }

  const changed = handoffOutOfDate(p)
  const exported = handoff.exported

  return (
    <section aria-labelledby="handoff-title" className="flex h-full min-w-0 flex-col">
      <div className="step-scroll relative min-h-0 flex-1 overflow-y-auto p-6">
        <div className={`${STEP_CONTENT} gap-6`}>
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h1 id="handoff-title" tabIndex={-1} className="type-heading-2xl outline-none">
                  Handoff
                </h1>
                <Badge tone="success" variant="subtle">
                  v{handoff.version}
                </Badge>
              </div>
              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" intent="neutral" onClick={() => navigate(path('show'))}>
                  <Icon icon={PencilIcon} />
                  Edit show
                </Button>
                <ShowPreview scenes={rows.flatMap((r) => (r.clip ? [{ moment: r.moment, look: r.look, clip: r.clip }] : []))} />
                <Button onClick={exportPackage} disabled={exported}>
                  <Icon icon={DownloadIcon} />
                  {exported ? 'Exported' : 'Export package'}
                </Button>
              </div>
            </div>
            <p className="text-muted-foreground type-text-sm-normal">
              Everything production needs to build the show, organised by team. Generated at {handoff.at}.
            </p>
          </div>

          {changed && (
            <Alert tone="warning" role="status">
              <Icon icon={PencilIcon} />
              <AlertTitle>The show has changed since v{handoff.version}</AlertTitle>
              <AlertDescription>This package doesn’t have those changes. Choose Edit show, then Generate handoff to make v{handoff.version + 1}.</AlertDescription>
            </Alert>
          )}

          {exported && (
            <Alert tone="success" role="status">
              <Icon icon={CheckIcon} />
              <AlertTitle>v{handoff.version} sent to the production team</AlertTitle>
              <AlertDescription>
                Each team has its part: every song’s look, clip and venue checks, and the cue sheet. Legal still
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
              <Card>
                <CardHeader>
                  <CardTitle>The show</CardTitle>
                  <CardDescription>
                    Every song with its look.
                  </CardDescription>
                </CardHeader>
                <CardContent className="flex flex-col gap-4">
                  <ul className="grid grid-cols-2 gap-4">
                    {rows.map(({ moment, look, clip }) => (
                      <li key={moment.number} className="flex flex-col gap-1">
                        <StillImage still={look} alt={`Song ${moment.number} · ${moment.title}: #${look.n}`} model={MODEL.still} className="aspect-video w-full rounded-lg object-cover" />
                        <span className="type-text-sm-semibold">
                          Song {moment.number} · {moment.title}
                        </span>
                        <span className="text-muted-foreground type-text-xs-normal">
                          #{look.n} · {look.caption} · {clip ? `clip v${clip.version}` : 'no clip'}
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
                  <CheckRow>Cue sheets for lighting, video and camera</CheckRow>
                  <CheckRow>Provenance for every image and clip</CheckRow>
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
                <CardDescription>Each song’s light and its lighting cue.</CardDescription>
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
                <CardDescription>Each song’s LED content and its clip.</CardDescription>
              </CardHeader>
              <CardContent className="flex flex-col gap-5">
                <ul className="flex flex-col gap-4">
                  {rows.map((row) => (
                    <MomentRow key={row.moment.number} row={row}>
                      <KeyValueList>
                        <KeyValueRow label="LED content">{row.clip?.cue.led ?? 'No clip yet'}</KeyValueRow>
                        <KeyValueRow label="Clip">{row.clip ? `v${row.clip.version}, 8 s${row.clip.edits.length ? ` · edited: ${row.clip.edits.join('; ')}` : ''}` : 'Not rendered'}</KeyValueRow>
                      </KeyValueList>
                    </MomentRow>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {trade === 'camera' && (
            <Card>
              <CardHeader>
                <CardTitle>For the camera director and livestream</CardTitle>
                <CardDescription>Each song’s camera move.</CardDescription>
              </CardHeader>
              <CardContent>
                <ul className="flex flex-col gap-4">
                  {rows.map((row) => (
                    <MomentRow key={row.moment.number} row={row}>
                      <KeyValueList>
                        <KeyValueRow label="Move">{row.clip ? `${MOVE_TITLE[moveOf(row.clip)]}, 8 s` : 'No clip yet'}</KeyValueRow>
                      </KeyValueList>
                    </MomentRow>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}

          {trade === 'rights' && (
            <div className="flex flex-col gap-4">
              <div>
                <Card>
                  <CardHeader>
                    <CardTitle>Credits</CardTitle>
                    <CardDescription>Who made which decisions. Gemini explored; people chose.</CardDescription>
                  </CardHeader>
                  <CardContent>
                    <KeyValueList>
                      <KeyValueRow label="Creative direction">
                        AEG Presents creative team: chose {rows.length} looks,{' '}
                        {yours ? `asked for ${yours} of the ${generations.length} images, ` : ''}generated {handoff.version}{' '}
                        {handoff.version === 1 ? 'handoff' : 'handoffs'}
                      </KeyValueRow>
                      <KeyValueRow label="Artist">
                        {meta.artist}: owns every output
                      </KeyValueRow>
                      <KeyValueRow label="Gemini">
                        Explored {generations.length - yours} images, drafted the prompts and checked every design against
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
                  <CheckRow>Provenance on every image and clip: model, prompt, source, who asked</CheckRow>
                  <CheckRow status="pending">C2PA credentials: check per model (Nano Banana Pro, Veo 3.1)</CheckRow>
                  <CheckRow status="pending">Google gen AI indemnity covers GA Gemini and Veo models · legal to confirm scope</CheckRow>
                  <CheckRow status="pending">Clip edits used Gemini Omni Flash, in preview · confirm cover</CheckRow>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>
    </section>
  )
}
