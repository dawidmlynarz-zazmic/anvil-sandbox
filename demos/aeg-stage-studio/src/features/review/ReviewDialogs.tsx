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
import type { ReviewComment } from '~/state/types'

/** Pick which open comments the next round should address, then start it. */
export function RequestChangesDialog({
  open,
  nextRound,
  disabled,
  onConfirm,
}: {
  open: ReviewComment[]
  nextRound: number
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
            Choose the comments round {nextRound} should address. Comments you leave out stay open here.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          {open.length === 0 ? (
            <p className="text-muted-foreground type-text-sm-normal">All comments are resolved. The next round will start from your current selection.</p>
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
                        · {c.target.kind === 'clip' ? `song ${c.target.song} clip` : 'on the image'}
                      </span>
                    </span>
                  </label>
                </li>
              ))}
            </ul>
          )}
        </DialogBody>
        <DialogFooter>
          <Button onClick={() => onConfirm(chosen)}>
            Start round {nextRound}
            {chosen.length ? ` with ${chosen.length} comment${chosen.length === 1 ? '' : 's'}` : ''}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

/** Approve straight away when everything is resolved; otherwise confirm first. */
export function ApproveButton({ openCount, disabled, onApprove }: { openCount: number; disabled?: boolean; onApprove: () => void }) {
  const button = (
    <Button disabled={disabled} onClick={openCount ? undefined : onApprove}>
      <Icon icon={CheckIcon} />
      Approve for production
    </Button>
  )
  if (!openCount || disabled) return button
  return (
    <AlertDialog>
      <AlertDialogTrigger asChild>{button}</AlertDialogTrigger>
      <AlertDialogContent>
        <AlertDialogHeader>
          <AlertDialogTitle>
            Approve with {openCount} open comment{openCount === 1 ? '' : 's'}?
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
