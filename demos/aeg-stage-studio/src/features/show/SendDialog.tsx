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

/** The one step that leaves the building: shows exactly what the artist will get, with an optional note, before sending. */
export function SendDialog({
  artist,
  items,
  label,
  disabled,
  onSend,
}: {
  artist: string
  items: SendItem[]
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
          <DialogTitle>Send the show to {artist}</DialogTitle>
          <DialogDescription>
            {artist} sees {items.length === 1 ? 'the song' : `all ${items.length} songs`}, each with its look and {clips === items.length ? 'its clip' : `${clips} of ${items.length} clips`}.
            They can comment on any song, then approve the whole show.
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
                  {item.look} · {item.clip ? `clip v${item.clip}` : 'no clip yet, so the artist sees the image only'}
                </span>
              </li>
            ))}
          </ul>
          <Textarea
            label={`A note for ${artist}`}
            hint="Optional. e.g. “The stage set stays the same all night; each song changes its light.”"
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
            Send to {artist}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
