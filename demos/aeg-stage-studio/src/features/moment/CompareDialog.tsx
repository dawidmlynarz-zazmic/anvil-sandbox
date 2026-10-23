import { Badge } from '@anvil/components/ui/badge'
import { Button } from '@anvil/components/ui/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@anvil/components/ui/dialog'
import { CheckIcon, Icon, PinIcon } from '@anvil/components/ui/icon'
import { StillImage } from '~/components/StillImage'
import type { Generation } from '~/state/types'

/** Two to four images side by side, in the same view, to decide between them. */
export function CompareDialog({
  items,
  open,
  onOpenChange,
  lookId,
  pinned,
  onOpen,
}: {
  items: Generation[]
  open: boolean
  onOpenChange: (open: boolean) => void
  lookId?: string
  pinned: string[]
  /** Opens one in the focus panel. */
  onOpen: (id: string) => void
}) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Compare {items.map((g) => `#${g.n}`).join(', ')}</DialogTitle>
          <DialogDescription>Side by side in the same view. Open one to change it, pin it or choose it as the look.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <ul className="grid grid-cols-2 gap-4">
            {items.map((g) => (
              <li key={g.id}>
                <figure className="flex flex-col gap-2">
                  <StillImage still={g} alt={`#${g.n} · ${g.title}, ${g.caption}`} className="aspect-video w-full rounded-lg object-cover" />
                  <figcaption className="flex items-center justify-between gap-2">
                    <span className="flex min-w-0 flex-col">
                      <span className="flex items-center gap-1.5 type-text-sm-semibold">
                        #{g.n} · {g.title}
                        {g.id === lookId && (
                          <Badge tone="success" variant="subtle" size="xs">
                            <Icon icon={CheckIcon} />
                            Look
                          </Badge>
                        )}
                        {pinned.includes(g.id) && <Icon icon={PinIcon} size="xs" label="Pinned" />}
                      </span>
                      <span className="text-muted-foreground truncate type-text-xs-normal">{g.caption}</span>
                    </span>
                    <DialogClose asChild>
                      <Button variant="outline" intent="neutral" size="xs" onClick={() => onOpen(g.id)}>
                        Open #{g.n}
                      </Button>
                    </DialogClose>
                  </figcaption>
                </figure>
              </li>
            ))}
          </ul>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button>Done</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
