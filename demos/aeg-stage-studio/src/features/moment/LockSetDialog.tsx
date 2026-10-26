import { Button } from '@anvil/components/ui/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from '@anvil/components/ui/dialog'
import { Icon, LockIcon } from '@anvil/components/ui/icon'
import { lowerFirst } from '~/services/shapes'
import { issues, venueChecks } from '~/services/venueCheck'
import { useProject } from '~/state/ProjectContext'
import type { Generation } from '~/state/types'
import { SetChecks } from '../show/SetChecks'

/**
 * Locking the set is the one deliberate convergence, so it's checked first: the design's footprint against the venue,
 * with every check and what would clear it. Lock anyway, or go back and change the design.
 */
export function LockSetDialog({ gen, open: shown, onOpenChange }: { gen: Generation; /** Opened from a menu item: no trigger button. */ open: boolean; onOpenChange: (open: boolean) => void }) {
  const p = useProject()
  const open = issues(venueChecks(gen.spec, p.brief, gen.reworked))
  const fails = open.filter((c) => c.status === 'fail').length
  return (
    <Dialog open={shown} onOpenChange={onOpenChange}>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Lock the stage set from #{gen.n}?</DialogTitle>
          <DialogDescription>
            Every song then uses this structure ({lowerFirst(gen.title)}), and only the light, colour and haze change. Here’s how it fits the venue.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <SetChecks spec={gen.spec} brief={p.brief} reworked={gen.reworked} />
          {open.length > 0 && (
            <p className="type-text-sm-normal">
              {fails
                ? `${fails === 1 ? 'One check fails' : `${fails} checks fail`}: production couldn’t build it as it is.`
                : 'Nothing fails, but production will need a plan for what’s flagged.'}{' '}
              To fix it first, close this and describe a change to #{gen.n}, for example “{open.find((c) => c.fix)?.fix ?? 'narrower'}”. The new image is checked again.
            </p>
          )}
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" intent="neutral">
              Not yet
            </Button>
          </DialogClose>
          <DialogClose asChild>
            <Button onClick={() => p.lockSet(gen.id)}>
              <Icon icon={LockIcon} />
              {open.length ? `Lock with ${open.length} ${open.length === 1 ? 'issue' : 'issues'}` : 'Lock the stage set'}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
