import { useId, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Badge } from '@anvil/components/ui/badge'
import { Button } from '@anvil/components/ui/button'
import { Card, CardContent } from '@anvil/components/ui/card'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@anvil/components/ui/dialog'
import { ArrowRightIcon, CircleAlertIcon, CircleCheckIcon, Icon, ImageIcon, LockIcon, LockOpenIcon, PlusIcon, XIcon } from '@anvil/components/ui/icon'
import { Input } from '@anvil/components/ui/input'
import { Popover, PopoverContent, PopoverTrigger } from '@anvil/components/ui/popover'
import { STEP_CONTENT } from '~/components/layout'
import { StepFooter } from '~/components/StepFooter'
import { useStillUrl } from '~/components/StillImage'
import { useMomentThumb } from '~/components/clipFrame'
import { momentLight } from '~/services/light'
import { issues, venueChecks } from '~/services/venueCheck'
import { looksChosen } from '~/state/project'
import { clipKey, useProject } from '~/state/ProjectContext'
import { genById, gensFor, kitStatus, lookFor, MOMENT_STATUS, momentStatus } from '~/state/show'
import { TIME_LABEL, type SetlistMoment } from '~/state/types'
import { SendDialog } from './SendDialog'
import { SetChecks } from './SetChecks'
import { ShowPreview } from './ShowPreview'

/** One key moment on the board: its look (or latest image), one status, and one line of detail. The card opens it. */
function MomentCard({ moment, canRemove }: { moment: SetlistMoment; canRemove: boolean }) {
  const p = useProject()
  const look = lookFor(p, moment.number)
  const gens = gensFor(p, moment.number)
  const shown = look ?? gens.at(-1)
  const thumb = useMomentThumb(shown, p.brief, moment.number)
  const status = momentStatus(p, moment.number)
  const clip = look ? p.clips[clipKey(look.id, moment.number)] : undefined
  const kit = kitStatus(p, moment.number)
  const pending = p.pending[moment.number]
  const meta = [
    TIME_LABEL[momentLight(p.brief, moment.number)],
    gens.length ? `${gens.length} ${gens.length === 1 ? 'image' : 'images'}` : '',
    clip ? (clip.status === 'ready' ? 'clip' : 'clip rendering') : '',
    kit === 'ready' ? 'kit' : kit === 'stale' ? 'kit out of date' : kit === 'building' ? 'kit building' : '',
  ].filter(Boolean)
  return (
    <Card size="sm" className="h-full min-w-0">
      <CardContent className="flex flex-col gap-2.5">
        <Link
          to={p.momentPath(moment.number)}
          className="bg-muted focus-visible:focus-ring relative flex aspect-video items-center justify-center overflow-hidden rounded-md outline-none hover:ring-2 hover:ring-border-action"
          aria-label={`Open song ${moment.number} · ${moment.title}`}
        >
          {shown ? thumb ? <img src={thumb} alt="" className="size-full object-cover" /> : <span aria-hidden className="size-full animate-pulse" /> : <Icon icon={ImageIcon} className="text-muted-foreground" />}
          <Badge tone={MOMENT_STATUS[status].tone} variant="subtle" size="xs" className="absolute start-1.5 top-1.5">
            {pending ? `${pending.label}…` : look ? `#${look.n} · ${MOMENT_STATUS[status].text}` : MOMENT_STATUS[status].text}
          </Badge>
        </Link>
        <div className="flex items-start justify-between gap-2">
          <div className="flex min-w-0 flex-col">
            <Link to={p.momentPath(moment.number)} className="focus-visible:focus-ring rounded-sm type-text-sm-semibold outline-none hover:underline">
              Song {moment.number} · {moment.title}
            </Link>
            <span className="text-muted-foreground type-text-xs-normal">{meta.join(' · ')}</span>
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
      </CardContent>
    </Card>
  )
}

/** Adds a key moment: a song number, a name, and what should happen. */
function AddMomentDialog() {
  const p = useProject()
  const formId = useId()
  const [open, setOpen] = useState(false)
  const [number, setNumber] = useState('')
  const [title, setTitle] = useState('')
  const [intent, setIntent] = useState('')
  const song = Number(number)
  const taken = p.moments.some((m) => m.number === song)
  const valid = Number.isInteger(song) && song > 0 && !taken && title.trim().length > 0
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) {
          setNumber('')
          setTitle('')
          setIntent('')
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" intent="neutral" size="sm">
          <Icon icon={PlusIcon} />
          Add a moment
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Add a key moment</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <form
            id={formId}
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (!valid) return
              p.setMoments([...p.moments, { number: song, title: title.trim(), intent: intent.trim() || 'No direction yet' }])
              setOpen(false)
            }}
          >
            <div className="grid grid-cols-[6rem_1fr] gap-3">
              <Input label="Song" inputMode="numeric" placeholder="e.g. 9" autoFocus value={number} onChange={(e) => setNumber(e.target.value)} aria-invalid={taken || undefined} hint={taken ? 'Already a key moment' : undefined} />
              <Input label="Moment" placeholder="e.g. Sunset drop" value={title} onChange={(e) => setTitle(e.target.value)} />
            </div>
            <Input label="What should happen" placeholder="e.g. The LED wall peaks with the sun" value={intent} onChange={(e) => setIntent(e.target.value)} />
          </form>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" intent="neutral">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" form={formId} disabled={!valid}>
            Add moment
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** The show at a glance: the set, every key moment in setlist order, and one line on how far it has come. */
export function ShowPage() {
  const p = useProject()
  const navigate = useNavigate()
  const setSource = p.set ? genById(p, p.set.fromId) : undefined
  const setSrc = useStillUrl(setSource)
  if (p.phase === 'setup') return <Navigate to={p.path('brief')} replace />

  const chosen = looksChosen(p)
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
  const flagged = setSource ? issues(venueChecks(setSource.spec, p.brief, setSource.reworked)) : []
  const left = p.moments.length - chosen

  return (
    <section aria-labelledby="show-title" className="flex h-full min-w-0 flex-col">
      <div className="step-scroll relative min-h-0 flex-1 overflow-y-auto p-6">
        <div className={`${STEP_CONTENT} gap-6`}>
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 id="show-title" tabIndex={-1} className="type-heading-2xl outline-none">
                The show
              </h1>
              <ShowPreview />
            </div>
            {/* The running numbers, in one line. The full measures are in Handoff. */}
            <p className="text-muted-foreground type-text-sm-normal tabular-nums">
              {chosen} of {p.moments.length} looks · {p.generations.length} images · {sends} {sends === 1 ? 'review' : 'reviews'}
              {p.artistRating ? ` · rated ${p.artistRating}/5` : ''} · day {p.daysSinceBrief}
            </p>
          </div>

          <Card size="sm">
            <CardContent className="flex flex-wrap items-center gap-4">
              {p.set && (setSrc ? <img src={setSrc} alt={`The set: ${p.set.title}`} className="aspect-[21/9] w-44 shrink-0 rounded-md object-cover" /> : <div className="bg-muted aspect-[21/9] w-44 shrink-0 animate-pulse rounded-md" />)}
              {/* At least 14rem for the text: on a narrow board it wraps below the image instead of squeezing. */}
              <div className="flex min-w-56 flex-1 flex-col gap-1">
                <span className="flex items-center gap-1.5 type-text-sm-semibold">
                  <Icon icon={p.set ? LockIcon : LockOpenIcon} size="xs" />
                  {p.set && setSource ? `The set: ${p.set.title}` : 'The set isn’t locked yet'}
                </span>
                <span className="text-muted-foreground type-text-xs-normal">
                  {p.set && setSource
                    ? `Locked from song ${setSource.song} #${setSource.n}. Every moment keeps this structure.`
                    : 'Choose a look for any moment, then lock its structure as the set.'}
                  {offSet > 0 ? ` ${offSet === 1 ? '1 look has' : `${offSet} looks have`} another structure.` : ''}
                </span>
                {setSource && (
                  <Popover>
                    <PopoverTrigger asChild>
                      <button type="button" className="focus-visible:focus-ring self-start rounded-full outline-none" aria-label={`Venue checks: ${flagged.length ? `${flagged.length} to resolve` : 'every check passes'}`}>
                        <Badge tone={flagged.length ? 'warning' : 'success'} variant="subtle" size="sm">
                          <Icon icon={flagged.length ? CircleAlertIcon : CircleCheckIcon} />
                          {flagged.length ? `${flagged.length} to resolve` : 'Every venue check passes'}
                        </Badge>
                      </button>
                    </PopoverTrigger>
                    <PopoverContent align="start" className="w-96">
                      <SetChecks spec={setSource.spec} brief={p.brief} reworked={setSource.reworked} locked />
                    </PopoverContent>
                  </Popover>
                )}
              </div>
              {p.set && editable && (
                <Button variant="ghost" intent="neutral" size="sm" onClick={p.unlockSet}>
                  <Icon icon={LockOpenIcon} />
                  Unlock
                </Button>
              )}
            </CardContent>
          </Card>

          <section aria-labelledby="moments-title" className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h2 id="moments-title" className="type-text-base-semibold">
                Key moments
              </h2>
              {editable && <AddMomentDialog />}
            </div>
            <ul className="grid grid-cols-1 gap-3 @lg:grid-cols-2">
              {p.moments.map((m) => (
                <li key={m.number} className="min-w-0">
                  <MomentCard moment={m} canRemove={editable && !gensFor(p, m.number).length} />
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
      <StepFooter
        note={
          waiting
            ? 'With the artist'
            : left > 0
              ? `${left} ${left === 1 ? 'moment needs' : 'moments need'} a look before sending`
              : p.redo.length
                ? `${p.redo.length} ${p.redo.length === 1 ? 'moment' : 'moments'} still to rework`
                : sent
                  ? 'Sending again shares the latest looks and clips'
                  : 'Every moment has a look'
        }
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
