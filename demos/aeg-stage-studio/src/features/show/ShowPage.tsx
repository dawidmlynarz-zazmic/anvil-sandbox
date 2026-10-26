import { useId, useState } from 'react'
import { Link, Navigate, useNavigate } from 'react-router-dom'
import { Badge } from '@anvil/components/ui/badge'
import { Button } from '@anvil/components/ui/button'
import { Card, CardContent } from '@anvil/components/ui/card'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@anvil/components/ui/dialog'
import { Alert, AlertDescription, AlertTitle } from '@anvil/components/ui/alert'
import { CheckIcon, Icon, ImageIcon, PackageIcon, PencilIcon, PlusIcon, SaveIcon, XIcon } from '@anvil/components/ui/icon'
import { Input } from '@anvil/components/ui/input'
import { Tooltip, TooltipContent, TooltipTrigger } from '@anvil/components/ui/tooltip'
import { STEP_CONTENT } from '~/components/layout'
import { useMomentThumb } from '~/components/clipFrame'
import { momentLight } from '~/services/light'
import { handoffOutOfDate, looksChosen, showComplete } from '~/state/project'
import { clipKey, useProject } from '~/state/ProjectContext'
import { gensFor, lookFor, MOMENT_STATUS, momentStatus } from '~/state/show'
import { TIME_LABEL, type SetlistMoment } from '~/state/types'
import { ShowPreview } from './ShowPreview'

/** One key moment on the board: its look (or latest image), one status, and one line of detail. The card opens it. */
function MomentCard({ moment, canRemove }: { moment: SetlistMoment; canRemove: boolean }) {
  const p = useProject()
  const look = lookFor(p, moment.number)
  const gens = gensFor(p, moment.number)
  const shown = look ?? gens.at(-1)
  const thumb = useMomentThumb(shown, p.brief, moment.number, p.moments.length)
  const status = momentStatus(p, moment.number)
  const clip = look ? p.clips[clipKey(look.id, moment.number)] : undefined
  const pending = p.pending[moment.number]
  const meta = [
    TIME_LABEL[momentLight(p.brief, moment.number, p.moments.length)],
    gens.length ? `${gens.length} ${gens.length === 1 ? 'image' : 'images'}` : '',
    clip ? (clip.status === 'ready' ? 'clip ready' : 'clip rendering') : '',
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
              onClick={() => p.removeMoment(moment.number)}
            >
              <Icon icon={XIcon} />
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

/** Adds a key moment at the end of the show: a name and what should happen. It's numbered after the last one. */
function AddMomentDialog() {
  const p = useProject()
  const formId = useId()
  const [open, setOpen] = useState(false)
  const [title, setTitle] = useState('')
  const [intent, setIntent] = useState('')
  const valid = title.trim().length > 0
  const nextNumber = (p.moments.at(-1)?.number ?? 0) + 1
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) {
          setTitle('')
          setIntent('')
        }
      }}
    >
      <DialogTrigger asChild>
        <Button variant="ghost" intent="neutral" size="sm">
          <Icon icon={PlusIcon} />
          Add a key moment
        </Button>
      </DialogTrigger>
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>Add song {nextNumber}</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <form
            id={formId}
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              if (!valid) return
              p.addMoment(title.trim(), intent.trim() || 'No direction yet')
              setOpen(false)
            }}
          >
            <Input label="Name" placeholder="e.g. Sunset drop" autoFocus value={title} onChange={(e) => setTitle(e.target.value)} />
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

/** The show at a glance: every key moment in setlist order, and one line on how far it has come. */
export function ShowPage() {
  const p = useProject()
  const navigate = useNavigate()
  if (p.phase === 'setup') return <Navigate to={p.path('brief')} replace />

  const chosen = looksChosen(p)
  const complete = showComplete(p)
  const changed = handoffOutOfDate(p)
  const generate = () => {
    p.generateHandoff()
    navigate(p.path('handoff'))
  }

  return (
    <section aria-labelledby="show-title" className="flex h-full min-w-0 flex-col">
      <div className="step-scroll relative min-h-0 flex-1 overflow-y-auto p-6">
        <div className={`${STEP_CONTENT} gap-6`}>
          <div className="flex flex-col gap-1">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <h1 id="show-title" tabIndex={-1} className="type-heading-2xl outline-none">
                The show
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <ShowPreview />
                {p.handoff && (
                  <Button
                    variant="outline"
                    intent="neutral"
                    onClick={() => {
                      p.saveShow()
                      navigate(p.path('handoff'))
                    }}
                  >
                    <Icon icon={SaveIcon} />
                    Save
                  </Button>
                )}
                {complete ? (
                  <Button onClick={generate}>
                    <Icon icon={PackageIcon} />
                    Generate handoff
                  </Button>
                ) : (
                  // A disabled button gets no pointer events: the wrapper carries the tooltip that says why.
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span tabIndex={0} className="focus-visible:focus-ring rounded-md outline-none">
                        <Button disabled>
                          <Icon icon={PackageIcon} />
                          Generate handoff
                        </Button>
                      </span>
                    </TooltipTrigger>
                    <TooltipContent>Put every song into motion first</TooltipContent>
                  </Tooltip>
                )}
              </div>
            </div>
            {/* The running numbers, in one line. The full measures are in Handoff. */}
            <p className="text-muted-foreground type-text-sm-normal tabular-nums">
              {chosen} of {p.moments.length} songs in motion · {p.generations.length} images · day {p.daysSinceBrief} since the{' '}
              <Link to={p.path('brief')} className="focus-visible:focus-ring rounded-sm underline underline-offset-2 outline-none hover:text-foreground">
                brief
              </Link>
            </p>
          </div>

          {p.handoff && (
            <Alert tone={changed ? 'warning' : 'neutral'} role="status">
              <Icon icon={changed ? PencilIcon : CheckIcon} />
              <AlertTitle>{changed ? `Not in handoff v${p.handoff.version} yet` : `Handed off as v${p.handoff.version}`}</AlertTitle>
              <AlertDescription>
                {changed
                  ? `Save keeps v${p.handoff.version} as it is. Generate handoff makes v${p.handoff.version + 1} with your changes.`
                  : 'Change any song here, then generate the handoff again to update the package.'}
              </AlertDescription>
            </Alert>
          )}

          <section aria-labelledby="moments-title" className="flex flex-col gap-3">
            <div className="flex items-center justify-between gap-2">
              <h2 id="moments-title" className="type-text-base-semibold">
                Key moments
              </h2>
              <AddMomentDialog />
            </div>
            <ul className="grid grid-cols-1 gap-3 @lg:grid-cols-2">
              {p.moments.map((m) => (
                <li key={m.number} className="min-w-0">
                  <MomentCard moment={m} canRemove={!gensFor(p, m.number).length} />
                </li>
              ))}
            </ul>
          </section>
        </div>
      </div>
    </section>
  )
}
