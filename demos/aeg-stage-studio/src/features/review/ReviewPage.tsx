import { useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { reveal } from '~/lib/reveal'
import { Alert, AlertDescription, AlertTitle } from '@anvil/components/ui/alert'
import { Badge } from '@anvil/components/ui/badge'
import { Button } from '@anvil/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@anvil/components/ui/card'
import { Checkbox } from '@anvil/components/ui/checkbox'
import { Input } from '@anvil/components/ui/input'
import { Label } from '@anvil/components/ui/label'
import { Switch } from '@anvil/components/ui/switch'
import { Textarea } from '@anvil/components/ui/textarea'
import { EmptyState, EmptyStateDescription, EmptyStateHeader, EmptyStateMedia, EmptyStateTitle } from '@anvil/components/ui/empty-state'
import { ArrowRightIcon, CheckIcon, ClipboardCheckIcon, EyeIcon, Icon, PackageIcon, SendIcon, UserIcon } from '@anvil/components/ui/icon'
import { Spinner } from '@anvil/components/ui/spinner'
import { Tabs, TabsList, TabsTrigger } from '@anvil/components/ui/tabs'
import { ClipPlayer } from '~/components/local/ClipPlayer/ClipPlayer'
import { PinnedImage } from '~/components/local/PinnedImage/PinnedImage'
import { STEP_CONTENT } from '~/components/layout'
import { StepFooter } from '~/components/StepFooter'
import { clipFrame, useMomentThumb } from '~/components/clipFrame'
import { StillImage, useStillUrl } from '~/components/StillImage'
import { SYNTHID_SHORT } from '~/mocks/copy'
import { clipKey, useProject } from '~/state/ProjectContext'
import { genById, lookFor } from '~/state/show'
import type { Brief, Generation, MotionClip, ReviewComment } from '~/state/types'
import { ApproveButton, ArtistApproveDialog, RequestChangesDialog } from './ReviewDialogs'

/** A look's 3D render with the artist's numbered pins on it. */
function PinnedLook({ look, ...props }: Omit<React.ComponentProps<typeof PinnedImage>, 'src'> & { look: Generation }) {
  const src = useStillUrl(look)
  return <PinnedImage src={src} {...props} />
}

/** A moment's clip as the artist saw it: live 3D, over that song's 3D still while the scene loads. */
function ReviewClip({ look, clip, brief }: { look: Generation; clip: MotionClip; brief: Brief }) {
  const poster = useMomentThumb(look, brief, clip.momentNumber, clip.poster)
  return <ClipPlayer poster={poster} renderFrame={clipFrame(look, clip, brief)?.render} label={`Song ${clip.momentNumber}, clip version ${clip.version}`} />
}

export function ReviewPage() {
  const navigate = useNavigate()
  const p = useProject()
  const { brief, moments, clips, status, review, sentVersion, versions, meta, path } = p
  // Each time you send counts as one review: “Review 2”.
  const reviewNumber = Math.max(1, versions.filter((v) => v.summary.startsWith('Sent to the artist')).length)
  const [songParam, setSong] = useState<number | undefined>()
  const [activeId, setActiveId] = useState<string | null>(null)
  // Artist preview: the presenter plays the artist (pins comments, approves with a rating). It's in the URL, so the
  // app shell can hide everything the artist wouldn't see (the agent, the progress rail).
  const [params, setParams] = useSearchParams()
  const artistView = params.get('as') === 'artist'
  const setArtistView = (on: boolean) =>
    setParams(
      (prev) => {
        const next = new URLSearchParams(prev)
        if (on) next.set('as', 'artist')
        else next.delete('as')
        return next
      },
      { replace: true },
    )
  const [draft, setDraft] = useState<{ x: number; y: number } | null>(null)
  const [draftText, setDraftText] = useState('')
  const [clipText, setClipText] = useState('')

  // Open on the first moment with open comments, else the first.
  const firstOpen = review.find((c) => !c.resolved)?.song
  const song = songParam ?? firstOpen ?? moments[0]?.number ?? 0
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
  const forMoment = review.filter((c) => c.song === song)
  const open = review.filter((c) => !c.resolved)
  // The pins drawn on the look the artist commented on; a comment on an older look stays in the list.
  const pins = forMoment.flatMap((c) => (c.target.kind === 'look' && c.genId === look?.id ? [{ id: c.id, number: c.number, x: c.target.x, y: c.target.y }] : []))
  const slot = look ? clips[clipKey(look.id, song)] : undefined
  const toggleArtist = (on: boolean) => {
    setArtistView(on)
    setDraft(null)
    if (on && waiting) p.takeOverReview()
  }
  const pick = (next: number) => {
    setSong(next)
    setActiveId(null)
    setDraft(null)
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
            <div className="flex items-center gap-3">
              <h1 tabIndex={-1} className="type-heading-2xl outline-none">
                Review and sign-off
              </h1>
              {!artistView && (
                <Badge tone="agent" variant="subtle">
                  Review {reviewNumber}
                </Badge>
              )}
              <div className="ms-auto flex items-center gap-2">
                <Switch id="artist-view" checked={artistView} onCheckedChange={toggleArtist} disabled={approved} />
                <Label htmlFor="artist-view">Preview as artist</Label>
              </div>
            </div>
            <p className="text-muted-foreground type-text-sm-normal">
              {artistView
                ? 'Your show, moment by moment: the stage’s look and its motion for each key song. Pin a comment on any look, comment on a clip, or approve the show.'
                : 'What the artist saw, moment by moment, and what they said. Click a comment to see where it points. Then approve the show, or request changes to the moments they commented on.'}
            </p>
          </div>

          {artistView && (
            <Alert tone="agent" role="status">
              <Icon icon={EyeIcon} />
              <AlertTitle>Previewing as {meta.artist}</AlertTitle>
              <AlertDescription>This is what the artist sees. Pin comments on any moment, then send them or approve the show.</AlertDescription>
            </Alert>
          )}

          {waiting && !artistView && (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-6 text-center">
                <Spinner className="text-agent size-6" />
                <div className="flex flex-col gap-1" aria-live="polite">
                  <p className="type-text-base-semibold">Waiting for the artist</p>
                  <p className="text-muted-foreground type-text-sm-normal">
                    Sent: {moments.length} moments, each with its look and clip. Artists usually reply within a day. In this demo their comments arrive in a few seconds.
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
              <AlertDescription>Every moment is signed off with its look and clip. The handoff package is ready.</AlertDescription>
            </Alert>
          )}

          {changesRequested && (
            <Alert tone="agent" role="status" action={<Button size="xs" variant="outline" intent="neutral" onClick={() => navigate(path('show'))}>Go to the show</Button>}>
              <Icon icon={ArrowRightIcon} />
              <AlertTitle>Changes requested</AlertTitle>
              <AlertDescription>
                {p.redo.length
                  ? `The agent is exploring new looks for ${p.redo.length === 1 ? `song ${p.redo[0]}` : `${p.redo.length} moments`} with the artist’s comments. Choose new looks, then send the show again.`
                  : 'Every moment the artist commented on has a new look. Send the show again from the show board.'}
              </AlertDescription>
            </Alert>
          )}

          {(!waiting || artistView) && (
            <>
              <div className="flex flex-wrap items-center gap-2">
                <Badge tone="neutral" variant="outline">Artist owns outputs</Badge>
                <Badge tone="neutral" variant="outline">{SYNTHID_SHORT}</Badge>
                {/* Legal follow-ups are AEG's internal notes: not part of what the artist sees. */}
                {!artistView && (
                  <>
                    <Badge tone="warning" variant="outline">C2PA: confirm per model</Badge>
                    <Badge tone="warning" variant="outline">Indemnity: GA models · legal to confirm</Badge>
                  </>
                )}
              </div>

              <Tabs value={String(song)} onValueChange={(v) => pick(Number(v))}>
                <TabsList variant="line" aria-label="Key moments" className="max-w-full overflow-x-auto">
                  {moments.map((m) => {
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
                    onPlace={artistView && !approved ? (x, y) => setDraft({ x, y }) : undefined}
                    draft={draft ? { ...draft, number: review.length + 1 } : null}
                  />
                ) : (
                  <p className="text-muted-foreground type-text-sm-normal">This moment has no look yet.</p>
                )}
                {artistView && draft && look && (
                  <form
                    className="flex flex-col gap-2 pt-1"
                    onSubmit={(e) => {
                      e.preventDefault()
                      if (!draftText.trim()) return
                      p.addArtistComment(song, { kind: 'look', x: draft.x, y: draft.y }, draftText.trim())
                      setDraft(null)
                      setDraftText('')
                    }}
                  >
                    <Textarea label={`Comment ${review.length + 1}`} hint="Pinned where you clicked. Say what you’d change there." rows={2} autoFocus value={draftText} onChange={(e) => setDraftText(e.target.value)} />
                    <div className="flex gap-2">
                      <Button type="submit" size="sm" disabled={!draftText.trim()}>
                        Add comment
                      </Button>
                      <Button type="button" variant="ghost" intent="neutral" size="sm" onClick={() => setDraft(null)}>
                        Cancel
                      </Button>
                    </div>
                  </form>
                )}
                {artistView && !draft && !approved && look && <p className="text-muted-foreground type-text-xs-normal">Click anywhere on the image to pin a comment there.</p>}
              </section>

              <section id="review-clip" aria-labelledby="clip-title" className="flex scroll-mt-4 flex-col gap-2">
                <h2 id="clip-title" className="type-text-base-semibold">
                  Motion
                </h2>
                {look && slot?.status === 'ready' ? (
                  <ReviewClip look={look} clip={slot.clip} brief={brief} />
                ) : (
                  <p className="text-muted-foreground type-text-sm-normal">{slot?.status === 'generating' ? 'This clip is being reworked.' : 'This clip wasn’t ready when you sent, so the artist hasn’t seen it.'}</p>
                )}
                {artistView && !approved && slot?.status === 'ready' && (
                  <form
                    className="flex items-end gap-2"
                    onSubmit={(e) => {
                      e.preventDefault()
                      if (!clipText.trim()) return
                      p.addArtistComment(song, { kind: 'clip' }, clipText.trim())
                      setClipText('')
                    }}
                  >
                    <Input className="flex-1" label={`Comment on the song ${song} clip`} value={clipText} onChange={(e) => setClipText(e.target.value)} />
                    <Button type="submit" variant="outline" intent="neutral" disabled={!clipText.trim()}>
                      Add comment
                    </Button>
                  </form>
                )}
              </section>

              <Card>
                <CardHeader>
                  <CardTitle>Comments on song {song}</CardTitle>
                  <CardDescription>
                    {artistView
                      ? `Your comments on this moment (${forMoment.length}). The team sees them when you send.`
                      : forMoment.length === 0
                        ? 'No comments on this moment.'
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
                            {!artistView && (
                              <Checkbox checked={c.resolved} disabled={approved} onCheckedChange={() => p.toggleResolved(c.id)} aria-label={`Mark comment ${c.number} resolved`} className="mt-0.5" />
                            )}
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
      {artistView ? (
        <StepFooter note="You’re previewing the artist’s view." status={waiting ? `${review.length} comment${review.length === 1 ? '' : 's'} so far` : undefined}>
          <Button
            variant="outline"
            intent="neutral"
            disabled={!waiting || review.filter((c) => !c.resolved).length === 0}
            onClick={() => {
              p.sendArtistFeedback()
              setArtistView(false)
            }}
          >
            <Icon icon={SendIcon} />
            Send comments to the team
          </Button>
          <ArtistApproveDialog
            name="the show"
            disabled={approved}
            onApprove={(rating) => {
              p.approve(rating)
              setArtistView(false)
              navigate(path('handoff'))
            }}
          />
        </StepFooter>
      ) : (
        <StepFooter
          note={approved ? 'The show is approved.' : waiting ? 'You can keep working while you wait.' : 'Approving signs off every moment and prepares the handoff package.'}
          status={waiting ? 'Waiting for the artist’s reply' : approved || changesRequested ? undefined : open.length ? `${open.length} open comment${open.length === 1 ? '' : 's'}` : 'All comments resolved'}
        >
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
        </StepFooter>
      )}
    </section>
  )
}
