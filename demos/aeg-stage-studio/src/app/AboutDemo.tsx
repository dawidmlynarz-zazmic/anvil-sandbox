import { Badge } from '@anvil/components/ui/badge'
import { Button } from '@anvil/components/ui/button'
import { Icon, InfoIcon } from '@anvil/components/ui/icon'
import { Popover, PopoverContent, PopoverDescription, PopoverHeader, PopoverTitle, PopoverTrigger } from '@anvil/components/ui/popover'

/** States plainly what is real and what is simulated, so nobody has to ask. */
export function AboutDemo() {
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="ghost" intent="neutral" size="sm">
          <Icon icon={InfoIcon} />
          Demo
        </Button>
      </PopoverTrigger>
      <PopoverContent align="end" className="w-96">
        <PopoverHeader>
          <PopoverTitle>About this demo</PopoverTitle>
          <PopoverDescription>Stage Studio is a working name for an AEG workspace built on Gemini Enterprise Agent Platform.</PopoverDescription>
        </PopoverHeader>
        <dl className="flex flex-col gap-3 type-text-sm-normal">
          <div>
            <dt className="type-text-sm-semibold">In the pilot</dt>
            <dd className="text-muted-foreground">
              Gemini drafts the prompts, Nano Banana Pro makes the stills, Veo 3.1 makes the motion and Gemini Omni Flash
              (preview) edits clips in plain words. Creative teams can also use the same models in Agent Media Studio or Flow.
            </dd>
          </div>
          <div>
            <dt className="type-text-sm-semibold">In this demo</dt>
            <dd className="text-muted-foreground">
              Nothing calls a model. Stills and clips are illustrative 3D previews, the agent’s replies and the artist’s
              comments are simulated, and artists, specs and budgets are placeholders.
            </dd>
          </div>
        </dl>
        <div className="flex flex-wrap gap-2">
          <Badge tone="neutral" variant="outline" size="sm">Artist owns outputs</Badge>
          <Badge tone="neutral" variant="outline" size="sm">SynthID</Badge>
          <Badge tone="warning" variant="outline" size="sm">C2PA and indemnity: legal to confirm</Badge>
        </div>
      </PopoverContent>
    </Popover>
  )
}
