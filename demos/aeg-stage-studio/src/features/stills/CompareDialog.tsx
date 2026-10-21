import { Button } from '@anvil/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle, DialogTrigger } from '@anvil/components/ui/dialog'
import { Icon, ColumnsIcon } from '@anvil/components/ui/icon'
import type { Still } from '~/state/types'
import { StillImage } from '~/components/StillImage'

/** Selected concepts side by side. Needs at least two. */
export function CompareDialog({ stills }: { stills: Still[] }) {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" intent="neutral" disabled={stills.length < 2}>
          <Icon icon={ColumnsIcon} />
          Compare selected ({stills.length})
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-5xl">
        <DialogHeader>
          <DialogTitle>Compare selected concepts</DialogTitle>
          <DialogDescription>Your selected concepts side by side, to help you decide what to take into motion.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <ul className="grid gap-4" style={{ gridTemplateColumns: `repeat(${Math.min(stills.length, 3)}, minmax(0, 1fr))` }}>
            {stills.map((still) => (
              <li key={still.id} className="flex flex-col gap-2">
                <StillImage still={still} className="aspect-video w-full rounded-lg object-cover" />
                <p className="type-text-sm-semibold">{still.title}</p>
              </li>
            ))}
          </ul>
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
