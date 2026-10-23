import { Badge } from '@anvil/components/ui/badge'
import { cn } from '@anvil/lib/utils'

/** The models that make the media, named where the media is shown. */
export const MODEL = { still: 'Nano Banana Pro', motion: 'Veo 3.1' } as const

/** Which model made a generated image or clip: a quiet badge over its bottom-left corner. */
export function ModelBadge({ model, className }: { model: string; className?: string }) {
  return (
    <Badge tone="neutral" size="xs" className={cn('pointer-events-none absolute start-2 bottom-2 opacity-75', className)}>
      {model}
    </Badge>
  )
}
