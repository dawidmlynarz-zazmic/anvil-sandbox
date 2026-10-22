import { useState } from 'react'
import { Button } from '@anvil/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@anvil/components/ui/dialog'
import { Icon, SendIcon } from '@anvil/components/ui/icon'
import { Textarea } from '@anvil/components/ui/textarea'

export interface SendItem {
  title: string
  version: number
  clips: { song: number; title: string; version: number }[]
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
  const clips = items.reduce((n, i) => n + i.clips.length, 0)
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
          <DialogTitle>Send to {artist}</DialogTitle>
          <DialogDescription>
            {artist} sees {items.length === 1 ? 'this concept' : `these ${items.length} concepts`} and {clips === 1 ? 'its clip' : `${clips} clips`}, and can
            comment on any of them or approve one design.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <ul className="flex flex-col gap-3">
            {items.map((item) => (
              <li key={item.title} className="flex flex-col gap-1">
                <span className="type-text-sm-semibold">
                  {item.title} <span className="text-muted-foreground type-text-xs-normal">· v{item.version}</span>
                </span>
                <span className="text-muted-foreground type-text-xs-normal">
                  {item.clips.length
                    ? item.clips.map((c) => `song ${c.song} · ${c.title} (clip v${c.version})`).join(', ')
                    : 'No clips ready yet: the artist sees the still only.'}
                </span>
              </li>
            ))}
          </ul>
          <Textarea
            label={`A note for ${artist}`}
            hint="Optional. e.g. “Two directions for the residency; we lean towards the arch.”"
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
