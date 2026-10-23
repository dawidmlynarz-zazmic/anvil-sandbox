import { Button } from '@anvil/components/ui/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@anvil/components/ui/dialog'
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
export function LockSetDialog({ gen }: { gen: Generation }) {
  const p = useProject()
  const open = issues(venueChecks(gen.spec, p.brief, gen.reworked))
  const fails = open.filter((c) => c.status === 'fail').length
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button size="xs" variant="outline" intent="neutral">
          <Icon icon={LockIcon} />
          Lock the set from #{gen.n}
        </Button>
      </DialogTrigger>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Lock the set from #{gen.n}?</DialogTitle>
          <DialogDescription>
            Every moment then keeps this structure ({lowerFirst(gen.title)}); only the look changes from song to song. Here’s how it sits in the venue.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <SetChecks spec={gen.spec} brief={p.brief} reworked={gen.reworked} />
          {open.length > 0 && (
            <p className="type-text-sm-normal">
              {fails
                ? `${fails === 1 ? 'One check fails' : `${fails} checks fail`}: production couldn’t build it as it is.`
                : 'Nothing fails, but production will need a plan for what’s flagged.'}{' '}
              To change it first, close this and describe the change on #{gen.n} (for example “{open.find((c) => c.fix)?.fix ?? 'narrower'}”); the new image keeps its own check.
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
              {open.length ? `Lock with ${open.length} to resolve` : 'Lock the set'}
            </Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
