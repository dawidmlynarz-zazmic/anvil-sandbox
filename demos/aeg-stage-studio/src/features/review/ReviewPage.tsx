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
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@anvil/components/ui/tabs'
import { ClipPlayer } from '~/components/local/ClipPlayer/ClipPlayer'
import { MomentTile } from '~/components/MomentTile'
import { PinnedImage } from '~/components/local/PinnedImage/PinnedImage'
import { STEP_CONTENT } from '~/components/layout'
import { StepFooter } from '~/components/StepFooter'
import { clipFrame, useMomentThumb } from '~/components/clipFrame'
import { SYNTHID_SHORT } from '~/mocks/copy'
import { clipKey, useProject } from '~/state/ProjectContext'
import type { Brief, MotionClip, ReviewComment, Still } from '~/state/types'
import { ApproveButton, ArtistApproveDialog, RequestChangesDialog } from './ReviewDialogs'
import { StillImage, useStillUrl } from '~/components/StillImage'

/** The concept's 3D render with the artist's numbered pins on it. */
function PinnedStill({ still, ...props }: Omit<React.ComponentProps<typeof PinnedImage>, 'src'> & { still: Still }) {
  const src = useStillUrl(still)
  return <PinnedImage src={src} {...props} />
}

/** A song's clip as the artist saw it: live 3D, over that song's 3D still while the scene loads. */
function ReviewClip({ still, clip, brief }: { still: Still; clip: MotionClip; brief: Brief }) {
  const poster = useMomentThumb(still, brief, clip.momentNumber, clip.poster)
  return (
    <ClipPlayer
      poster={poster}
      renderFrame={clipFrame(still, clip, brief)?.render}
      label={`Song ${clip.momentNumber}, clip version ${clip.version}`}
    />
  )
}

export function ReviewPage() {
  const navigate = useNavigate()
  const p = useProject()
  const { brief, rounds, motionStills, clips, status, review, sentVersion, versions, meta, approvedStill, path } = p
  // Each time you send counts as one review: “Review 2”, not the project's internal step number.
  const reviewNumber = Math.max(1, versions.filter((v) => v.summary.startsWith('Sent to the artist')).length)
  const [tab, setTab] = useState('concepts')
  const [conceptId, setConceptId] = useState<string | undefined>()
  const [activeId, setActiveId] = useState<string | null>(null)
  const [song, setSong] = useState(() => brief.moments.find((m) => m.number === 14)?.number ?? brief.moments[0]?.number ?? 0)
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
  const toggleArtist = (on: boolean) => {
    setArtistView(on)
    setDraft(null)
    if (on && waiting) p.takeOverReview()
  }
  const header = (
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
          ? 'The stage design and its motion for your show. Pin a comment anywhere on the image, or approve the design for production.'
          : 'What the artist saw, and what they said about it. Click a numbered pin or a comment to see where it points. Then approve the design for production, or start another round from their comments.'}
      </p>
    </div>
  )

  const focusComment = (c: ReviewComment) => {
    setActiveId(c.id)
    if (c.target.kind === 'clip') {
      setTab('motion')
      setSong(c.target.song)
    } else setTab('concepts')
    // Bring the image or the clip the comment points at into view.
    window.setTimeout(() => reveal(document.getElementById('review-view')), 0)
  }

  return (
    <section aria-label="Review and sign-off" className="flex h-full min-w-0 flex-col">
      <div className="step-scroll relative min-h-0 flex-1 overflow-y-auto p-6">
        <div className={`${STEP_CONTENT} gap-6`}>
          {header}

          {artistView && (
            <Alert tone="agent" role="status">
              <Icon icon={EyeIcon} />
              <AlertTitle>Previewing as {meta.artist}</AlertTitle>
              <AlertDescription>
                This is what the artist sees when you send for review. Click the image to pin a comment, comment on a
                clip in Motion, then send your comments or approve.
              </AlertDescription>
            </Alert>
          )}

          {waiting && !artistView && (
            <Card>
              <CardContent className="flex flex-col items-center gap-4 py-6 text-center">
                <Spinner className="text-agent size-6" />
                <div className="flex flex-col gap-1" aria-live="polite">
                  <p className="type-text-base-semibold">Waiting for the artist</p>
                  <p className="text-muted-foreground type-text-sm-normal">
                    Sent: {motionStills.map((id) => allStills.find((x) => x.id === id)?.title.split(' · ')[0]).join(', ')} and their motion clips.
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
              <AlertDescription>{allStills.find((x) => x.id === approvedStill)?.title ?? 'The design'} is signed off. The handoff package is ready.</AlertDescription>
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

              <Tabs id="review-view" className="scroll-mt-4" value={tab} onValueChange={setTab}>
                <TabsList className="max-w-full overflow-x-auto">
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
                    onPlace={artistView && !approved ? (x, y) => setDraft({ x, y }) : undefined}
                    draft={draft ? { ...draft, number: review.length + 1 } : null}
                  />
                  {artistView && draft && (
                    <form
                      className="flex flex-col gap-2 pt-3"
                      onSubmit={(e) => {
                        e.preventDefault()
                        if (!draftText.trim()) return
                        p.addArtistComment(still.id, { kind: 'concept', x: draft.x, y: draft.y }, draftText.trim())
                        setDraft(null)
                        setDraftText('')
                      }}
                    >
                      <Textarea
                        label={`Comment ${review.length + 1}`}
                        hint="Pinned where you clicked. Say what you’d change there."
                        rows={2}
                        autoFocus
                        value={draftText}
                        onChange={(e) => setDraftText(e.target.value)}
                      />
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
                  {artistView && !draft && !approved && (
                    <p className="text-muted-foreground pt-2 type-text-xs-normal">Click anywhere on the image to pin a comment there.</p>
                  )}
                </TabsContent>
                <TabsContent value="motion" className="flex flex-col gap-4 pt-4">
                  {slot?.status === 'ready' ? (
                    <ReviewClip
                      still={still}
                      clip={slot.clip}
                      brief={brief}
                    />
                  ) : (
                    <p className="text-muted-foreground type-text-sm-normal">This clip wasn’t ready when you sent, so the artist hasn’t seen it.</p>
                  )}
                  {artistView && !approved && slot?.status === 'ready' && (
                    <form
                      className="flex items-end gap-2"
                      onSubmit={(e) => {
                        e.preventDefault()
                        if (!clipText.trim()) return
                        p.addArtistComment(still.id, { kind: 'clip', song }, clipText.trim())
                        setClipText('')
                      }}
                    >
                      <Input className="flex-1" label={`Comment on the song ${song} clip`} value={clipText} onChange={(e) => setClipText(e.target.value)} />
                      <Button type="submit" variant="outline" intent="neutral" disabled={!clipText.trim()}>
                        Add comment
                      </Button>
                    </form>
                  )}
                  <ul className="grid grid-cols-2 gap-3 @xl:grid-cols-4">
                    {brief.moments.map((m) => {
                      const c = clips[clipKey(still.id, m.number)]
                      return (
                        <li key={m.number} className="min-w-0">
                          <MomentTile
                            still={still}
                            brief={brief}
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
                      {artistView
                        ? `Your comments on this concept (${forConcept.length}). The team sees them when you send.`
                        : forConcept.filter((c) => !c.resolved).length
                          ? `${forConcept.filter((c) => !c.resolved).length} open. Tick a comment once it’s dealt with.`
                          : 'All resolved.'}
                    </CardDescription>
                  </CardHeader>
                  <CardContent>
                    <ol className="flex flex-col gap-2">
                      {forConcept.map((c) => (
                        <li key={c.id} className={`flex items-start gap-3 rounded-lg p-2 ${activeId === c.id ? 'bg-info-subtle' : ''}`}>
                          {!artistView && (
                            <Checkbox
                              checked={c.resolved}
                              disabled={approved}
                              onCheckedChange={() => p.toggleResolved(c.id)}
                              aria-label={`Mark comment ${c.number} resolved`}
                              className="mt-0.5"
                            />
                          )}
                          <button type="button" className="focus-visible:focus-ring flex flex-1 flex-col gap-1 rounded-sm text-start outline-none" onClick={() => focusComment(c)}>
                            <span className="flex flex-wrap items-center gap-2 type-text-xs-medium">
                              <Badge tone="brand" size="xs">{c.number}</Badge>
                              <Icon icon={UserIcon} size="xs" />
                              {c.author}
                              <span className="text-muted-foreground type-text-xs-normal">
                                {c.time} · {c.target.kind === 'clip' ? `song ${c.target.song} clip` : 'on the image'}
                              </span>
                              {c.addressedIn && (
                                <Badge tone="success" variant="subtle" size="xs">
                                  Addressed in round {c.addressedIn}
                                </Badge>
                              )}
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
      {artistView ? (
        <StepFooter
          note="You’re previewing the artist’s view."
          status={waiting ? `${review.length} comment${review.length === 1 ? '' : 's'} so far` : undefined}
        >
          <Button
            variant="outline"
            intent="neutral"
            disabled={!waiting || review.length === 0}
            onClick={() => {
              p.sendArtistFeedback()
              setArtistView(false)
            }}
          >
            <Icon icon={SendIcon} />
            Send comments to the team
          </Button>
          <ArtistApproveDialog
            name={still.title}
            disabled={approved}
            onApprove={(rating) => {
              p.approve(still.id, rating)
              setArtistView(false)
              navigate(path('handoff'))
            }}
          />
        </StepFooter>
      ) : (
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
            name={still.title.split(' · ')[0]!}
            openCount={open.length}
            disabled={status !== 'feedback'}
            onApprove={() => {
              p.approve(still.id)
              navigate(path('handoff'))
            }}
          />
        </StepFooter>
      )}
    </section>
  )
}
