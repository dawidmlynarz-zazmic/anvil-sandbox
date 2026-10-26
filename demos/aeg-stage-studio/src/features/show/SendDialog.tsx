import { useState } from 'react'
import { Button } from '@anvil/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@anvil/components/ui/dialog'
import { Icon, SendIcon } from '@anvil/components/ui/icon'
import { Textarea } from '@anvil/components/ui/textarea'

export interface SendItem {
  song: number
  title: string
  /** The look, e.g. “#6 · Warm light, in haze”. */
  look: string
  /** The clip's version, or undefined when it isn't ready. */
  clip?: number
}

/** The one step that leaves the building: shows exactly what's being sent for review, with an optional note, before sending. */
export function SendDialog({
  items,
  left = 0,
  label,
  disabled,
  onSend,
}: {
  items: SendItem[]
  /** Songs not in motion yet: they stay out of this review. */
  left?: number
  label: string
  disabled?: boolean
  onSend: (note: string) => void
}) {
  const [open, setOpen] = useState(false)
  const [note, setNote] = useState('')
  const clips = items.filter((i) => i.clip).length
  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setNote('')
      }}
    >
      <DialogTrigger asChild>
        <Button disabled={disabled}>
          <Icon icon={SendIcon} />
          {label}
        </Button>
      </DialogTrigger>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Send for review</DialogTitle>
          <DialogDescription>
            {items.length === 1
              ? `You’re sending 1 song, with its look${clips ? ' and clip' : ''}.`
              : `You’re sending ${items.length} songs, each with its look${clips === items.length ? ' and clip' : ` (${clips} with a clip)`}.`}{' '}
            {left > 0 && `${left === 1 ? '1 song isn’t' : `${left} songs aren’t`} in motion yet, so ${left === 1 ? 'it stays' : 'they stay'} out of this review. `}
            The reviewer can comment on any song, then approve the show or ask for changes.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <ul className="flex flex-col gap-3">
            {items.map((item) => (
              <li key={item.song} className="flex flex-col gap-1">
                <span className="type-text-sm-semibold">
                  Song {item.song} · {item.title}
                </span>
                <span className="text-muted-foreground type-text-xs-normal">
                  {item.look} · {item.clip ? `clip v${item.clip}` : 'no clip yet, so only the image is sent'}
                </span>
              </li>
            ))}
          </ul>
          <Textarea
            label="Note"
            hint="Optional. e.g. “Songs 3 and 4 are the big moments; the rest stays simple.”"
            rows={2}
            value={note}
            onChange={(e) => setNote(e.target.value)}
          />
        </DialogBody>
        <DialogFooter>
          <Button
            onClick={() => {
              onSend(note.trim())
              setOpen(false)
            }}
          >
            <Icon icon={SendIcon} />
            Send for review
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
