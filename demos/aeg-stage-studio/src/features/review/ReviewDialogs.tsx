import { useState } from 'react'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from '@anvil/components/ui/alert-dialog'
import { Button } from '@anvil/components/ui/button'
import { Checkbox } from '@anvil/components/ui/checkbox'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@anvil/components/ui/dialog'
import { CheckIcon, Icon, RotateCcwIcon } from '@anvil/components/ui/icon'
import { Rating } from '@anvil/components/agent/rating'
import type { ReviewComment } from '~/state/types'

/** Pick which open comments to take on, then go back to the show to rework those moments. */
export function RequestChangesDialog({
  open,
  disabled,
  onConfirm,
}: {
  open: ReviewComment[]
  disabled?: boolean
  onConfirm: (ids: string[]) => void
}) {
  const [chosen, setChosen] = useState<string[]>([])
  return (
    <Dialog onOpenChange={(o) => o && setChosen(open.map((c) => c.id))}>
      <DialogTrigger asChild>
        <Button variant="outline" intent="neutral" disabled={disabled}>
          <Icon icon={RotateCcwIcon} />
          Request changes
        </Button>
      </DialogTrigger>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Request changes</DialogTitle>
          <DialogDescription>
            Choose the comments to take on. A comment on an image starts new images for that song; a comment on a clip edits
            the clip. Comments you leave out stay open here.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          {open.length === 0 ? (
            <p className="text-muted-foreground type-text-sm-normal">All comments are resolved. Nothing to take on.</p>
          ) : (
            <ul className="flex flex-col gap-3">
              {open.map((c) => (
                <li key={c.id}>
                  <label className="flex items-start gap-3">
                    <Checkbox
                      className="mt-0.5"
                      checked={chosen.includes(c.id)}
                      onCheckedChange={() => setChosen((x) => (x.includes(c.id) ? x.filter((i) => i !== c.id) : [...x, c.id]))}
                    />
                    <span className="type-text-sm-normal">
                      <span className="type-text-sm-semibold">{c.number}.</span> {c.text}
                      <span className="text-muted-foreground type-text-xs-normal">
                        {' '}
                        · song {c.song} {c.target.kind === 'clip' ? 'clip' : 'look'}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </DialogBody>
        <DialogFooter>
          <Button disabled={!chosen.length} onClick={() => onConfirm(chosen)}>
            Request changes{chosen.length ? ` with ${chosen.length} comment${chosen.length === 1 ? '' : 's'}` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Approves the whole show for production. Straight away when everything is resolved; otherwise confirm first. */
export function ApproveButton({ name, openCount, disabled, onApprove }: { name: string; openCount: number; disabled?: boolean; onApprove: () => void }) {
  const button = (
    <Button disabled={disabled} onClick={openCount ? undefined : onApprove}>
      <Icon icon={CheckIcon} />
      Approve {name}
    </Button>
  )
  if (!openCount || disabled) return button
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{button}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Approve {name} with {openCount} open comment{openCount === 1 ? '' : 's'}?
          </AlertDialogTitle>
          <AlertDialogDescription>
            The open comments won’t be addressed. They are kept in the decision log that goes to the production team.
          </AlertDialogDescription>
        </AlertDialogHeader>
        <AlertDialogFooter>
          <AlertDialogCancel>Keep reviewing</AlertDialogCancel>
          <AlertDialogAction onClick={onApprove}>Approve anyway</AlertDialogAction>
        </AlertDialogFooter>
      </AlertDialogContent>
    </AlertDialog>
  )
}

/** Artist preview: approving the show asks how close it is to their vision (the “artist feedback” measure). */
export function ArtistApproveDialog({ name, disabled, onApprove }: { name: string; disabled?: boolean; onApprove: (rating: number) => void }) {
  const [rating, setRating] = useState<number | undefined>()
  return (
    <Dialog onOpenChange={(o) => o && setRating(undefined)}>
      <DialogTrigger asChild>
        <Button disabled={disabled}>
          <Icon icon={CheckIcon} />
          Approve {name}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Approve {name}</DialogTitle>
          <DialogDescription>Every song, with its look and clip, goes to the production team. One question first.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Rating
            kind="stars"
            question="How close is this to your vision?"
            value={rating}
            onValueChange={setRating}
            lowLabel="Not close"
            highLabel="Exactly it"
            thanks="Thanks, this goes into the project’s results."
          />
        </DialogBody>
        <DialogFooter>
          <Button disabled={!rating} onClick={() => rating && onApprove(rating)}>
            Approve for production
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
