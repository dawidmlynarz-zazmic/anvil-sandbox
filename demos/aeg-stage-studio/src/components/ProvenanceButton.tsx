import { Button } from '@anvil/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@anvil/components/ui/dialog'
import { Icon, ShieldCheckIcon } from '@anvil/components/ui/icon'
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from '@anvil/components/ui/popover'
import { CheckRow } from '@anvil/components/anvil/check-row'
import { KeyValueList, KeyValueRow } from '@anvil/components/anvil/key-value-row'
import type { Provenance } from '~/services/provenance'

const INTRO = 'Where this came from, and what protects it. It travels with the file in the handoff package.'

/** Model, source, who asked and when, the prompt, and the protections. */
function ProvenanceDetails({ provenance }: { provenance: Provenance }) {
  return (
    <>
      <KeyValueList>
        <KeyValueRow label="Made with">{provenance.model}</KeyValueRow>
        <KeyValueRow label="Made from">{provenance.from}</KeyValueRow>
        <KeyValueRow label="Asked by">{provenance.by}</KeyValueRow>
        <KeyValueRow label="Made at">{provenance.at}</KeyValueRow>
      </KeyValueList>
      <div className="flex flex-col gap-1">
        <span className="type-text-xs-semibold">Prompt</span>
        <p className="bg-muted rounded-md p-2 font-mono type-text-xs-normal">{provenance.prompt}</p>
      </div>
      <div className="flex flex-col gap-1">
        <CheckRow>SynthID watermark embedded</CheckRow>
        <CheckRow>The artist owns this output</CheckRow>
        <CheckRow status="pending">C2PA content credentials: legal to confirm per model</CheckRow>
      </div>
    </>
  )
}

/** Where an image or clip came from, one click away on every asset. */
export function ProvenanceButton({ name, provenance, size = 'xs' }: { name: string; provenance: Provenance; size?: 'xs' | 'sm' }) {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" intent="neutral" size={size} aria-label={`Provenance of ${name}`}>
          <Icon icon={ShieldCheckIcon} />
          <span className="sr-only @sm:not-sr-only">Provenance</span>
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96">
        <PopoverHeader>
          <PopoverTitle>Provenance · {name}</PopoverTitle>
          <PopoverDescription>{INTRO}</PopoverDescription>
        </PopoverHeader>
        <ProvenanceDetails provenance={provenance} />
      </PopoverContent>
    </Popover>
  )
}

/** The same, opened from a menu. */
export function ProvenanceDialog({ name, provenance, open, onOpenChange }: { name: string; provenance: Provenance; open: boolean; onOpenChange: (open: boolean) => void }) {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Provenance · {name}</DialogTitle>
          <DialogDescription>{INTRO}</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <ProvenanceDetails provenance={provenance} />
        </DialogBody>
      </DialogContent>
    </Dialog>
  )
}
