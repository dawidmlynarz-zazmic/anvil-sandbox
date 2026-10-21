import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Alert, AlertDescription, AlertTitle } from '@anvil/components/ui/alert'
import { Badge } from '@anvil/components/ui/badge'
import { Button } from '@anvil/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@anvil/components/ui/card'
import { Checkbox } from '@anvil/components/ui/checkbox'
import { EmptyState, EmptyStateDescription, EmptyStateHeader, EmptyStateMedia, EmptyStateTitle } from '@anvil/components/ui/empty-state'
import { ArrowRightIcon, CheckIcon, ClipboardCheckIcon, Icon, PackageIcon, UserIcon } from '@anvil/components/ui/icon'
import { Spinner } from '@anvil/components/ui/spinner'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@anvil/components/ui/tabs'
import { ClipPlayer } from '~/components/local/ClipPlayer/ClipPlayer'
import { MomentTile } from '~/components/MomentTile'
import { PinnedImage } from '~/components/local/PinnedImage/PinnedImage'
import { StepFooter } from '~/components/StepFooter'
import { clipFrame } from '~/components/clipFrame'
import { INDOOR } from '~/mocks/venues'
import { SYNTHID_SHORT } from '~/mocks/copy'
import { clipKey, useProject } from '~/state/ProjectContext'
import type { ReviewComment, Still } from '~/state/types'
import { ApproveButton, RequestChangesDialog } from './ReviewDialogs'
import { StillImage, useStillUrl } from '~/components/StillImage'

/** The concept's 3D render with the artist's numbered pins on it. */
function PinnedStill({ still, ...props }: Omit<React.ComponentProps<typeof PinnedImage>, 'src'> & { still: Still }) {
  const src = useStillUrl(still)
  return <PinnedImage src={src ?? ''} {...props} />
}

export function ReviewPage() {
  const navigate = useNavigate()
  const p = useProject()
  const { brief, rounds, motionStills, clips, status, review, sentVersion, path } = p
  const [tab, setTab] = useState('concepts')
  const [conceptId, setConceptId] = useState<string | undefined>()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [song, setSong] = useState(() => brief.moments.find((m) => m.number === 14)?.number ?? brief.moments[0]?.number ?? 0)

  const allStills = rounds.flatMap((r) => r.stills)
  const still = allStills.find((s) => s.id === (conceptId ?? motionStills[0]))

  // Not sent yet: nothing to review.
  if (sentVersion === null || !still) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState>
          <EmptyStateMedia variant="icon">
            <Icon icon={ClipboardCheckIcon} />
          </EmptyStateMedia>
          <EmptyStateHeader>
            <EmptyStateTitle>Nothing to review yet</EmptyStateTitle>
            <EmptyStateDescription>
              The artist’s comments and sign-off appear here once you send concepts and motion from the Motion step.
            </EmptyStateDescription>
          </EmptyStateHeader>
          <Button variant="outline" intent="neutral" onClick={() => navigate(path(motionStills.length ? 'motion' : rounds.length ? 'stills' : 'brief'))}>
            {motionStills.length ? 'Go to motion' : rounds.length ? 'Go to stills' : 'Go to the brief'}
          </Button>
        </EmptyState>
      </div>
    )
  }

  const waiting = status === 'awaiting-artist'
  const approved = status === 'approved'
  const changesRequested = status === 'draft'
  const forConcept = review.filter((c) => c.stillId === still.id)
  const open = review.filter((c) => !c.resolved)
  const pins = forConcept.flatMap((c) => (c.target.kind === 'concept' ? [{ id: c.id, number: c.number, x: c.target.x, y: c.target.y }] : []))
  const conceptClips = brief.moments.filter((m) => clips[clipKey(still.id, m.number)]?.status === 'ready')
  const slot = clips[clipKey(still.id, song)]
  const previous = rounds.find((r) => r.number === still.round - 1)?.stills.find((s) => s.concept === still.concept)
  const header = (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <h1 tabIndex={-1} className="type-heading-2xl outline-none">
          Review and sign-off
        </h1>
        <Badge tone="agent" variant="subtle">
          Version {sentVersion}
        </Badge>
      </div>
      <p className="text-muted-foreground type-text-sm-normal">
        What the artist saw, and what they said about it. Click a numbered pin or a comment to see where it points.
        Then approve the design for production, or start another round from their comments.
      </p>
    </div>
  )

  const focusComment = (c: ReviewComment) => {
    setActiveId(c.id)
    if (c.target.kind === 'clip') {
      setTab('motion')
      setSong(c.target.song)
    } else setTab('concepts')
  }

  return (
    <section aria-label="Review and sign-off" className="flex h-full min-w-0 flex-col">
      <div className="relative min-h-0 flex-1 overflow-y-auto p-6">
        <div className="mx-auto flex max-w-3xl flex-col gap-6">
          {header}

          {waiting && (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-6 text-center">
                <Spinner className="text-agent size-6" />
                <div className="flex flex-col gap-1" aria-live="polite">
                  <p className="type-text-base-semibold">Waiting for the artist</p>
                  <p className="text-muted-foreground type-text-sm-normal">
                    Sent version {sentVersion}: {motionStills.length} concept{motionStills.length === 1 ? '' : 's'} and their motion clips.
                    Artists usually reply within a day. In this demo their comments arrive in a few seconds.
                  </p>
                </div>
                <ul className="flex gap-2">
                  {motionStills.map((id) => {
                    const s = allStills.find((x) => x.id === id)
                    return s ? (
                      <li key={id}>
                        <StillImage still={s} alt={s.title} className="h-16 w-28 rounded-md object-cover" />
                      </li>
                    ) : null
                  })}
                </ul>
              </CardContent>
            </Card>
          )}

          {approved && (
            <Alert
              tone="success"
              role="status"
              action={
                <Button size="xs" variant="outline" intent="neutral" onClick={() => navigate(path('handoff'))}>
                  <Icon icon={PackageIcon} />
                  Go to handoff
                </Button>
              }
            >
              <Icon icon={CheckIcon} />
              <AlertTitle>Approved for production</AlertTitle>
              <AlertDescription>Version {sentVersion} is signed off. The handoff package is ready.</AlertDescription>
            </Alert>
          )}

          {changesRequested && (
            <Alert tone="agent" role="status" action={<Button size="xs" variant="outline" intent="neutral" onClick={() => navigate(path('stills'))}>Go to stills</Button>}>
              <Icon icon={ArrowRightIcon} />
              <AlertTitle>Changes requested</AlertTitle>
              <AlertDescription>
                Round {rounds.length} is addressing the artist’s comments. When it looks right, put it into motion and send a new version.
              </AlertDescription>
            </Alert>
          )}

          {!waiting && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="neutral" variant="outline">Artist owns outputs</Badge>
                <Badge tone="neutral" variant="outline">{SYNTHID_SHORT}</Badge>
                <Badge tone="warning" variant="outline">C2PA: confirm per model</Badge>
              </div>

              {motionStills.length > 1 && (
                <Tabs value={still.id} onValueChange={(id) => { setConceptId(id); setActiveId(null) }}>
                  <TabsList variant="line" aria-label="Concept">
                    {motionStills.map((id) => (
                      <TabsTrigger key={id} value={id}>
                        {allStills.find((s) => s.id === id)?.title ?? id}
                      </TabsTrigger>
                    ))}
                  </TabsList>
                </Tabs>
              )}

              <Tabs value={tab} onValueChange={setTab}>
                <TabsList>
                  <TabsTrigger value="concepts">Concept</TabsTrigger>
                  <TabsTrigger value="motion">Motion ({conceptClips.length})</TabsTrigger>
                  <TabsTrigger value="compare">Compare previous version</TabsTrigger>
                </TabsList>
                <TabsContent value="concepts" className="pt-4">
                  <PinnedStill
                    still={still}
                    alt={`Stage concept ${still.title}`}
                    pins={pins}
                    activeId={activeId}
                    onActiveChange={setActiveId}
                    resolvedIds={review.filter((c) => c.resolved).map((c) => c.id)}
                  />
                </TabsContent>
                <TabsContent value="motion" className="flex flex-col gap-4 pt-4">
                  {slot?.status === 'ready' ? (
                    <ClipPlayer
                      poster={slot.clip.poster}
                      renderFrame={clipFrame(still, slot.clip, Math.max(0, brief.moments.findIndex((m) => m.number === song)), brief.moments.length, INDOOR.has(brief.venueId))?.render}
                      label={`Song ${song}, clip version ${slot.clip.version}`}
                    />
                  ) : (
                    <p className="text-muted-foreground type-text-sm-normal">This clip wasn’t ready when you sent, so the artist hasn’t seen it.</p>
                  )}
                  <ul className="grid grid-cols-4 gap-3">
                    {brief.moments.map((m, i) => {
                      const c = clips[clipKey(still.id, m.number)]
                      return (
                        <li key={m.number} className="min-w-0">
                          <MomentTile
                            still={still}
                            index={i}
                            total={brief.moments.length}
                            indoor={INDOOR.has(brief.venueId)}
                            song={m.number}
                            title={m.title}
                            status={c ? (c.status === 'ready' ? 'ready' : 'generating') : 'not-started'}
                            poster={c?.status === 'ready' ? c.clip.poster : undefined}
                            selected={song === m.number}
                            onClick={() => setSong(m.number)}
                          />
                        </li>
                      )
                    })}
                  </ul>
                </TabsContent>
                <TabsContent value="compare" className="pt-4">
                  {previous ? (
                    <div className="grid grid-cols-2 gap-4">
                      <figure className="flex flex-col gap-2">
                        <StillImage still={previous} alt={previous.title} className="aspect-video w-full rounded-xl object-cover" />
                        <figcaption className="text-muted-foreground type-text-xs-normal">{previous.title} · round {previous.round}</figcaption>
                      </figure>
                      <figure className="flex flex-col gap-2">
                        <StillImage still={still} alt={still.title} className="aspect-video w-full rounded-xl object-cover" />
                        <figcaption className="text-muted-foreground type-text-xs-normal">{still.title} · round {still.round} · sent</figcaption>
                      </figure>
                    </div>
                  ) : (
                    <p className="text-muted-foreground type-text-sm-normal">
                      {still.title} comes from round {still.round}, so there’s no earlier version of it to compare with yet.
                    </p>
                  )}
                </TabsContent>
              </Tabs>

                <Card>
                  <CardHeader>
                    <CardTitle>Comments on {still.title.split(' · ')[0]}</CardTitle>
                    <CardDescription>
                      {forConcept.filter((c) => !c.resolved).length
                        ? `${forConcept.filter((c) => !c.resolved).length} open. Tick a comment once it’s dealt with.`
                        : 'All resolved.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ol className="flex flex-col gap-2">
                      {forConcept.map((c) => (
                        <li key={c.id} className={`flex items-start gap-3 rounded-lg p-2 ${activeId === c.id ? 'bg-info-subtle' : ''}`}>
                          <Checkbox
                            checked={c.resolved}
                            disabled={approved}
                            onCheckedChange={() => p.toggleResolved(c.id)}
                            aria-label={`Mark comment ${c.number} resolved`}
                            className="mt-0.5"
                          />
                          <button type="button" className="focus-visible:focus-ring flex flex-1 flex-col gap-1 rounded-sm text-start outline-none" onClick={() => focusComment(c)}>
                            <span className="flex flex-wrap items-center gap-2 type-text-xs-medium">
                              <Badge tone="brand" size="xs">{c.number}</Badge>
                              <Icon icon={UserIcon} size="xs" />
                              {c.author}
                              <span className="text-muted-foreground type-text-xs-normal">
                                {c.time} · {c.target.kind === 'clip' ? `song ${c.target.song} clip` : 'on the image'}
                              </span>
                            </span>
                            <span className={`type-text-sm-normal ${c.resolved ? 'text-muted-foreground line-through' : ''}`}>{c.text}</span>
                          </button>
                        </li>
                      ))}
                    </ol>
                  </CardContent>
                </Card>
            </>
          )}
        </div>
      </div>
      <StepFooter
        note={
          approved
            ? 'This design is approved.'
            : waiting
              ? 'You can keep working while you wait.'
              : 'Approving locks this version and prepares the handoff package.'
        }
        status={
          waiting ? 'Waiting for the artist’s reply' : approved || changesRequested ? undefined : open.length ? `${open.length} open comment${open.length === 1 ? '' : 's'}` : 'All comments resolved'
        }
      >
        <RequestChangesDialog
          open={open}
          nextRound={rounds.length + 1}
          disabled={status !== 'feedback'}
          onConfirm={(ids) => {
            p.requestChanges(ids)
            navigate(path('stills'))
          }}
        />
        <ApproveButton
          openCount={open.length}
          disabled={status !== 'feedback'}
          onApprove={() => {
            p.approve()
            navigate(path('handoff'))
          }}
        />
      </StepFooter>
    </section>
  )
}
