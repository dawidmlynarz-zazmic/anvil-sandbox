import { SparklesIcon } from '@anvil/components/ui/icon'
import { cn } from '@anvil/lib/utils'

/** A text wordmark with a sparkle. The client's real logo file replaces this when it is supplied. */
export function Logo({ className }: { className?: string }) {
  return (
    <span className={cn('inline-flex items-center gap-1.5 type-heading-lg tracking-tight text-foreground', className)}>
      <SparklesIcon aria-hidden className="size-4 text-success" />
      travelpass
    </span>
  )
}
