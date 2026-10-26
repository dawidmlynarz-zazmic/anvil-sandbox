import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { reveal } from '~/lib/reveal'
import { Alert, AlertDescription, AlertTitle } from '@anvil/components/ui/alert'
import { Badge } from '@anvil/components/ui/badge'
import { Button } from '@anvil/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@anvil/components/ui/card'
import { Checkbox } from '@anvil/components/ui/checkbox'
import { EmptyState, EmptyStateDescription, EmptyStateHeader, EmptyStateMedia, EmptyStateTitle } from '@anvil/components/ui/empty-state'
import { ArrowRightIcon, CheckIcon, ClipboardCheckIcon, Icon, PackageIcon, UserIcon } from '@anvil/components/ui/icon'
import { Spinner } from '@anvil/components/ui/spinner'
import { Tabs, TabsList, TabsTrigger } from '@anvil/components/ui/tabs'
import { ClipPlayer } from '~/components/local/ClipPlayer/ClipPlayer'
import { PinnedImage } from '~/components/local/PinnedImage/PinnedImage'
import { STEP_CONTENT } from '~/components/layout'
import { clipFrame, useMomentThumb } from '~/components/clipFrame'
import { StillImage, useStillUrl } from '~/components/StillImage'
import { ModelBadge, MODEL } from '~/components/ModelBadge'
import { clipKey, useProject } from '~/state/ProjectContext'
import { genById, lookFor } from '~/state/show'
import type { Brief, Generation, MotionClip, ReviewComment } from '~/state/types'
import { ApproveButton, RequestChangesDialog } from './ReviewDialogs'

/** A look's 3D render with the artist's numbered pins on it. */
function PinnedLook({ look, ...props }: Omit<React.ComponentProps<typeof PinnedImage>, 'src'> & { look: Generation }) {
  const src = useStillUrl(look)
  return (
    <div className="relative">
      <PinnedImage src={src} {...props} />
      <ModelBadge model={MODEL.still} />
    </div>
  )
}

/** A moment's clip as the artist saw it: live 3D, over that song's 3D still while the scene loads. */
function ReviewClip({ look, clip, brief, of }: { look: Generation; clip: MotionClip; brief: Brief; /** How many key moments the show has. */ of: number }) {
  const poster = useMomentThumb(look, brief, clip.momentNumber, of, clip.poster)
  return <ClipPlayer model={MODEL.motion} poster={poster} renderFrame={clipFrame(look, clip, brief, of)?.render} label={`Song ${clip.momentNumber}, clip version ${clip.version}`} />
}

export function ReviewPage() {
  const navigate = useNavigate()
  const p = useProject()
  const { brief, moments, clips, status, review, sentVersion, versions, path } = p
  // Each time you send counts as one review: “Review 2”.
  const reviewNumber = Math.max(1, versions.filter((v) => v.summary.startsWith('Sent to the artist')).length)
  const [songParam, setSong] = useState<number | undefined>()
  const [activeId, setActiveId] = useState<string | null>(null)
  // Open on the first moment with open comments, else the first.
  const firstOpen = review.find((c) => !c.resolved)?.song
  // Only songs with a look were sent; the rest stay out of the review.
  const sentMoments = moments.filter((m) => lookFor(p, m.number))
  const song = songParam ?? firstOpen ?? sentMoments[0]?.number ?? 0
  const moment = moments.find((m) => m.number === song)
  const look = lookFor(p, song)

  if (sentVersion === null || !moment) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState>
          <EmptyStateMedia variant="icon">
            <Icon icon={ClipboardCheckIcon} />
          </EmptyStateMedia>
          <EmptyStateHeader>
            <EmptyStateTitle>Nothing to review yet</EmptyStateTitle>
            <EmptyStateDescription>The artist’s comments and sign-off appear here once you send the show from the show board.</EmptyStateDescription>
          </EmptyStateHeader>
          <Button variant="outline" intent="neutral" onClick={() => navigate(path(p.phase === 'setup' ? 'brief' : 'show'))}>
            {p.phase === 'setup' ? 'Go to the brief' : 'Go to the show'}
          </Button>
        </EmptyState>
      </div>
    )
  }

  const waiting = status === 'awaiting-artist'
  const approved = status === 'approved'
  const changesRequested = status === 'draft'
  const sentCount = sentMoments.length
  const forMoment = review.filter((c) => c.song === song)
  const open = review.filter((c) => !c.resolved)
  // The pins drawn on the look the artist commented on; a comment on an older look stays in the list.
  const pins = forMoment.flatMap((c) => (c.target.kind === 'look' && c.genId === look?.id ? [{ id: c.id, number: c.number, x: c.target.x, y: c.target.y }] : []))
  const slot = look ? clips[clipKey(look.id, song)] : undefined
  const pick = (next: number) => {
    setSong(next)
    setActiveId(null)
  }
  const focusComment = (c: ReviewComment) => {
    setActiveId(c.id)
    window.setTimeout(() => reveal(document.getElementById(c.target.kind === 'clip' ? 'review-clip' : 'review-look')), 0)
  }

  return (
    <section aria-label="Review and sign-off" className="flex h-full min-w-0 flex-col">
      <div className="step-scroll relative min-h-0 flex-1 overflow-y-auto p-6">
        <div className={`${STEP_CONTENT} gap-6`}>
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="flex items-center gap-3">
                <h1 tabIndex={-1} className="type-heading-2xl outline-none">
                  Review and sign-off
                </h1>
                <Badge tone="agent" variant="subtle">
                  Review {reviewNumber}
                </Badge>
              </div>
              {/* Once approved, or once changes are requested, the alert below says what's next instead. */}
              {(waiting || status === 'feedback') && (
                <div className="flex flex-wrap items-center gap-2">
                  <RequestChangesDialog
                    open={open}
                    disabled={status !== 'feedback' || open.length === 0}
                    onConfirm={(ids) => {
                      p.requestChanges(ids)
                      navigate(path('show'))
                    }}
                  />
                  <ApproveButton
                    name="the show"
                    openCount={open.length}
                    disabled={status !== 'feedback'}
                    onApprove={() => {
                      p.approve()
                      navigate(path('handoff'))
                    }}
                  />
                </div>
              )}
            </div>
            <p className="text-muted-foreground type-text-sm-normal">
              What the artist saw and said, song by song.
            </p>
          </div>

          {waiting && (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-6 text-center">
                <Spinner className="text-agent size-6" />
                <div className="flex flex-col gap-1" aria-live="polite">
                  <p className="type-text-base-semibold">Waiting for the artist</p>
                  <p className="text-muted-foreground type-text-sm-normal">
                    Sent: {sentCount === 1 ? '1 song' : `${sentCount} songs`}, {sentCount === 1 ? 'with its look' : 'each with its look'}. Artists usually reply within a day. In this demo their comments arrive in a few seconds.
                  </p>
                </div>
                <ul className="flex flex-wrap justify-center gap-2">
                  {moments.map((m) => {
                    const l = lookFor(p, m.number)
                    return l ? (
                      <li key={m.number}>
                        <StillImage still={l} alt={`Song ${m.number} · ${m.title}`} className="h-16 w-28 rounded-md object-cover" />
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
              <AlertTitle>The show is approved</AlertTitle>
              <AlertDescription>Every song is signed off with its look and clip. The handoff package is ready.</AlertDescription>
            </Alert>
          )}

          {changesRequested && (
            <Alert tone="agent" role="status" action={<Button size="xs" variant="outline" intent="neutral" onClick={() => navigate(path('show'))}>Go to the show</Button>}>
              <Icon icon={ArrowRightIcon} />
              <AlertTitle>Changes requested</AlertTitle>
              <AlertDescription>
                {p.redo.length
                  ? `The agent is exploring new looks for ${p.redo.length === 1 ? `song ${p.redo[0]}` : `${p.redo.length} songs`} with the artist’s comments. Choose Generate motion on the new images you like, then send the show again.`
                  : 'Every song the artist commented on has a new look. Send the show again from the show board.'}
              </AlertDescription>
            </Alert>
          )}

          {!waiting && (
            <>
              <Tabs value={String(song)} onValueChange={(v) => pick(Number(v))}>
                <TabsList variant="line" aria-label="Songs" className="max-w-full overflow-x-auto">
                  {sentMoments.map((m) => {
                    const count = review.filter((c) => c.song === m.number && !c.resolved).length
                    return (
                      <TabsTrigger key={m.number} value={String(m.number)}>
                        Song {m.number} · {m.title}
                        {count > 0 && (
                          <Badge tone="brand" size="xs" aria-label={`${count} open`}>
                            {count}
                          </Badge>
                        )}
                      </TabsTrigger>
                    )
                  })}
                </TabsList>
              </Tabs>

              <section id="review-look" aria-labelledby="look-title" className="flex scroll-mt-4 flex-col gap-2">
                <h2 id="look-title" className="type-text-base-semibold">
                  The look{look ? ` · #${look.n}, ${look.caption.toLowerCase()}` : ''}
                </h2>
                {look ? (
                  <PinnedLook
                    look={look}
                    alt={`Song ${song} · ${moment.title}: #${look.n}, ${look.title}`}
                    pins={pins}
                    activeId={activeId}
                    onActiveChange={setActiveId}
                    resolvedIds={review.filter((c) => c.resolved).map((c) => c.id)}
                  />
                ) : (
                  <p className="text-muted-foreground type-text-sm-normal">This song isn’t in motion yet.</p>
                )}
              </section>

              <section id="review-clip" aria-labelledby="clip-title" className="flex scroll-mt-4 flex-col gap-2">
                <h2 id="clip-title" className="type-text-base-semibold">
                  The clip
                </h2>
                {look && slot?.status === 'ready' ? (
                  <ReviewClip look={look} clip={slot.clip} brief={brief} of={moments.length} />
                ) : (
                  <p className="text-muted-foreground type-text-sm-normal">{slot?.status === 'generating' ? 'This clip is being reworked.' : 'This clip wasn’t ready when you sent, so the artist hasn’t seen it.'}</p>
                )}
              </section>

              <Card>
                <CardHeader>
                  <CardTitle>Comments on song {song}</CardTitle>
                  <CardDescription>
                    {forMoment.length === 0
                        ? 'No comments on this song.'
                        : forMoment.filter((c) => !c.resolved).length
                          ? `${forMoment.filter((c) => !c.resolved).length} open. Tick a comment once it’s dealt with.`
                          : 'All resolved.'}
                  </CardDescription>
                </CardHeader>
                {forMoment.length > 0 && (
                  <CardContent>
                    <ol className="flex flex-col gap-2">
                      {forMoment.map((c) => {
                        const on = genById(p, c.genId)
                        return (
                          <li key={c.id} className={`flex items-start gap-3 rounded-lg p-2 ${activeId === c.id ? 'bg-info-subtle' : ''}`}>
                            <Checkbox checked={c.resolved} disabled={approved} onCheckedChange={() => p.toggleResolved(c.id)} aria-label={`Mark comment ${c.number} resolved`} className="mt-0.5" />
                            <button type="button" className="focus-visible:focus-ring flex flex-1 flex-col gap-1 rounded-sm text-start outline-none" onClick={() => focusComment(c)}>
                              <span className="flex flex-wrap items-center gap-2 type-text-xs-medium">
                                <Badge tone="brand" size="xs">
                                  {c.number}
                                </Badge>
                                <Icon icon={UserIcon} size="xs" />
                                {c.author}
                                <span className="text-muted-foreground type-text-xs-normal">
                                  {c.time} · {c.target.kind === 'clip' ? 'on the clip' : `on look #${on?.n ?? '?'}`}
                                </span>
                                {c.addressed && (
                                  <Badge tone="success" variant="subtle" size="xs">
                                    Changes requested
                                  </Badge>
                                )}
                              </span>
                              <span className={`type-text-sm-normal ${c.resolved ? 'text-muted-foreground line-through' : ''}`}>{c.text}</span>
                            </button>
                          </li>
                        )
                      })}
                    </ol>
                  </CardContent>
                )}
              </Card>
            </>
          )}
        </div>
      </div>
    </section>
  )
}
