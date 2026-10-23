import { useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { WidgetMetricCard, WidgetMetricGroup } from '@anvil/components/agent/widget-metric-card'
import { Badge } from '@anvil/components/ui/badge'
import { Button } from '@anvil/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@anvil/components/ui/card'
import { ArrowRightIcon, ClapperboardIcon, Icon, ImageIcon, LockIcon, LockOpenIcon, PackageIcon, PlusIcon, XIcon } from '@anvil/components/ui/icon'
import { Input } from '@anvil/components/ui/input'
import { STEP_CONTENT } from '~/components/layout'
import { StepFooter } from '~/components/StepFooter'
import { useStillUrl } from '~/components/StillImage'
import { useMomentThumb } from '~/components/clipFrame'
import { momentLight } from '~/services/light'
import { looksChosen } from '~/state/project'
import { clipKey, useProject } from '~/state/ProjectContext'
import { genById, gensFor, kitStatus, lookFor, MOMENT_STATUS, momentStatus } from '~/state/show'
import { TIME_LABEL, type SetlistMoment } from '~/state/types'
import { SendDialog } from './SendDialog'
import { ShowPreview } from './ShowPreview'
import { SetChecks } from './SetChecks'

/** One key moment on the board: its look (or latest image) in the light it plays in, and where it stands. */
function MomentCard({ moment, canRemove }: { moment: SetlistMoment; canRemove: boolean }) {
  const p = useProject()
  const look = lookFor(p, moment.number)
  const gens = gensFor(p, moment.number)
  const shown = look ?? gens.at(-1)
  const thumb = useMomentThumb(shown, p.brief, moment.number)
  const status = momentStatus(p, moment.number)
  const clip = look ? p.clips[clipKey(look.id, moment.number)] : undefined
  const pending = p.pending[moment.number]
  const kit = kitStatus(p, moment.number)
  return (
    <Card size="sm" className="h-full min-w-0 gap-3">
      <CardContent className="flex flex-col gap-3">
        <Link
          to={p.momentPath(moment.number)}
          className="bg-muted focus-visible:focus-ring relative flex aspect-video items-center justify-center overflow-hidden rounded-md outline-none hover:ring-2 hover:ring-border-action"
          aria-label={`Open song ${moment.number} · ${moment.title}`}
        >
          {shown ? thumb ? <img src={thumb} alt="" className="size-full object-cover" /> : <span aria-hidden className="size-full animate-pulse" /> : <Icon icon={ImageIcon} className="text-muted-foreground" />}
          {look && (
            <Badge tone="neutral" size="xs" className="absolute start-1.5 top-1.5">
              #{look.n}
            </Badge>
          )}
        </Link>
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col gap-0.5">
            <span className="type-text-sm-semibold">
              Song {moment.number} · {moment.title}
            </span>
            <span className="text-muted-foreground type-text-xs-normal">{moment.intent}</span>
          </div>
          {canRemove && (
            <Button
              variant="ghost"
              intent="neutral"
              size="icon-xs"
              aria-label={`Remove song ${moment.number}, ${moment.title}`}
              onClick={() => p.setMoments(p.moments.filter((m) => m.number !== moment.number))}
            >
              <Icon icon={XIcon} />
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-1.5">
          <Badge tone={MOMENT_STATUS[status].tone} variant="subtle" size="xs">
            {pending ? `${pending.label}…` : MOMENT_STATUS[status].text}
          </Badge>
          <Badge tone="neutral" variant="outline" size="xs">
            {TIME_LABEL[momentLight(p.brief, moment.number)]}
          </Badge>
          {gens.length > 0 && (
            <Badge tone="neutral" variant="outline" size="xs">
              {gens.length} {gens.length === 1 ? 'image' : 'images'}
            </Badge>
          )}
          {clip && (
            <Badge tone={clip.status === 'ready' ? 'neutral' : 'agent'} variant="outline" size="xs">
              <Icon icon={ClapperboardIcon} />
              {clip.status === 'ready' ? 'Clip ready' : 'Clip rendering'}
            </Badge>
          )}
          {kit !== 'none' && (
            <Badge tone={kit === 'stale' ? 'warning' : kit === 'building' ? 'agent' : 'neutral'} variant="outline" size="xs">
              <Icon icon={PackageIcon} />
              {kit === 'stale' ? 'Kit out of date' : kit === 'building' ? 'Kit building' : `Kit · ${(p.kits[moment.number]?.assets.length ?? 0) + 1} assets`}
            </Badge>
          )}
        </div>
      </CardContent>
      <CardFooter>
        <Button asChild variant="outline" intent="neutral" size="sm" className="w-full">
          <Link to={p.momentPath(moment.number)}>
            {gens.length ? 'Open' : 'Start exploring'}
            <Icon icon={ArrowRightIcon} />
          </Link>
        </Button>
      </CardFooter>
    </Card>
  )
}

/** Adds a key moment: a song number, a name, and what should happen. */
function AddMoment() {
  const p = useProject()
  const [number, setNumber] = useState('')
  const [title, setTitle] = useState('')
  const [intent, setIntent] = useState('')
  const song = Number(number)
  const taken = p.moments.some((m) => m.number === song)
  const valid = Number.isInteger(song) && song > 0 && !taken && title.trim().length > 0
  return (
    <Card>
      <CardHeader>
        <CardTitle>Add a key moment</CardTitle>
        <CardDescription>A song where the stage should do something memorable. It gets its own look and clip.</CardDescription>
      </CardHeader>
      <CardContent>
        <form
          className="flex flex-col gap-3"
          onSubmit={(e) => {
            e.preventDefault()
            if (!valid) return
            p.setMoments([...p.moments, { number: song, title: title.trim(), intent: intent.trim() || 'No direction yet' }])
            setNumber('')
            setTitle('')
            setIntent('')
          }}
        >
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

/** The show at a glance: the set, every key moment in setlist order, and how far the show has come. */
export function ShowPage() {
  const p = useProject()
  const navigate = useNavigate()
  const setSource = p.set ? genById(p, p.set.fromId) : undefined
  const setSrc = useStillUrl(setSource)
  if (p.phase === 'setup') return <Navigate to={p.path('brief')} replace />

  const chosen = looksChosen(p)
  const images = p.generations.length
  const sends = p.versions.filter((v) => v.summary.startsWith('Sent to the artist')).length
  const editable = p.status === 'draft' || p.status === 'feedback'
  const sendItems = p.moments.flatMap((m) => {
    const look = lookFor(p, m.number)
    if (!look) return []
    const c = p.clips[clipKey(look.id, m.number)]
    return [{ song: m.number, title: m.title, look: `#${look.n} · ${look.caption}`, clip: c?.status === 'ready' ? c.clip.version : undefined }]
  })
  const waiting = p.status === 'awaiting-artist'
  const sent = p.sentVersion !== null
  const offSet = p.moments.filter((m) => momentStatus(p, m.number) === 'off-set').length

  return (
    <section aria-labelledby="show-title" className="flex h-full min-w-0 flex-col">
      <div className="step-scroll relative min-h-0 flex-1 overflow-y-auto p-6">
        <div className={`${STEP_CONTENT} gap-6`}>
          <div className="flex flex-col gap-2">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 id="show-title" tabIndex={-1} className="type-heading-2xl outline-none">
                The show
              </h1>
              <ShowPreview />
            </div>
            <p className="text-muted-foreground type-text-sm-normal">
              One set, a look for every key moment. Open a moment to explore it; lock the set when a structure works, and
              every other moment keeps it. When each moment has a look, send the show to the artist.
            </p>
          </div>

          <WidgetMetricGroup>
            <WidgetMetricCard label="Looks chosen" value={`${chosen} of ${p.moments.length}`} period={chosen === p.moments.length ? 'Every moment has a look' : `${p.moments.length - chosen} to go`} />
            <WidgetMetricCard label="Images explored" value={images} period={`Across ${p.moments.length} moments`} />
            <WidgetMetricCard label="Reviews with the artist" value={sends} period={p.artistRating ? `Rated ${p.artistRating}/5` : sends ? 'Not rated yet' : 'Not sent yet'} />
            <WidgetMetricCard label="Days since the brief" value={p.daysSinceBrief} period="Today: [typical weeks]" />
          </WidgetMetricGroup>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Icon icon={p.set ? LockIcon : LockOpenIcon} size="xs" />
                The set
              </CardTitle>
              <CardDescription>
                {p.set && setSource
                  ? `${p.set.title}, locked from song ${setSource.song} #${setSource.n}. Every moment shares this structure; only the look changes.`
                  : 'Not locked yet. Choose a look for any moment, then lock its structure as the set every moment shares.'}
              </CardDescription>
              {p.set && editable && (
                <CardAction>
                  <Button variant="ghost" intent="neutral" size="sm" onClick={p.unlockSet}>
                    <Icon icon={LockOpenIcon} />
                    Unlock
                  </Button>
                </CardAction>
              )}
            </CardHeader>
            {p.set && (
              <CardContent className="flex flex-col gap-4">
                {setSrc ? <img src={setSrc} alt={`The set: ${p.set.title}`} className="aspect-[21/9] w-full rounded-lg object-cover" /> : <div className="bg-muted aspect-[21/9] w-full animate-pulse rounded-lg" />}
                {setSource && <SetChecks spec={setSource.spec} brief={p.brief} reworked={setSource.reworked} locked />}
                {offSet > 0 && (
                  <p className="text-warning-medium type-text-xs-medium">
                    {offSet === 1 ? '1 moment has a look' : `${offSet} moments have looks`} with another structure. Open {offSet === 1 ? 'it' : 'them'} to restage on the set.
                  </p>
                )}
              </CardContent>
            )}
          </Card>

          <section aria-labelledby="moments-title" className="flex flex-col gap-3">
            <div className="flex items-baseline justify-between gap-2">
              <h2 id="moments-title" className="type-text-base-semibold">
                Key moments
              </h2>
              <span className="text-muted-foreground type-text-xs-normal">In setlist order</span>
            </div>
            <ul className="grid grid-cols-1 gap-3 @lg:grid-cols-2">
              {p.moments.map((m) => (
                <li key={m.number} className="min-w-0">
                  <MomentCard moment={m} canRemove={editable && !gensFor(p, m.number).length} />
                </li>
              ))}
            </ul>
          </section>

          {editable && <AddMoment />}
        </div>
      </div>
      <StepFooter
        note={sent && !waiting ? 'Sending again shares the latest looks and clips as a new version.' : 'The artist comments on any moment, then approves the show once.'}
        status={waiting ? 'With the artist' : chosen < p.moments.length ? `${p.moments.length - chosen} ${p.moments.length - chosen === 1 ? 'moment needs' : 'moments need'} a look` : p.redo.length ? `${p.redo.length} ${p.redo.length === 1 ? 'moment' : 'moments'} still to rework` : 'Every moment has a look'}
      >
        {p.status === 'approved' ? (
          <Button onClick={() => navigate(p.path('handoff'))}>
            Go to handoff
            <Icon icon={ArrowRightIcon} />
          </Button>
        ) : (
          <SendDialog
            artist={p.meta.artist}
            items={sendItems}
            label={sent ? 'Send the new version' : 'Send the show to the artist'}
            disabled={waiting || chosen < p.moments.length || p.moments.length === 0}
            onSend={(note) => {
              p.sendToArtist(note || undefined)
              navigate(p.path('review'))
            }}
          />
        )}
      </StepFooter>
    </section>
  )
}
