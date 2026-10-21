import { cn } from '@anvil/lib/utils'
import { useStageImage } from '~/scene/useStageImage'
import { canRenderWebGL } from '~/scene/webgl'
import type { Still } from '~/state/types'

/**
 * The 3D render of a concept, or undefined while it renders (show a placeholder, never the old 2D art, so nothing
 * flashes). Browsers without WebGL get the 2D fallback art.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useStillUrl(still: Still | undefined) {
  const rendered = useStageImage(still?.spec)
  if (rendered) return rendered
  return still?.spec && canRenderWebGL() ? undefined : still?.image
}

export function StillImage({ still, alt, className }: { still: Still; alt?: string; className?: string }) {
  const src = useStillUrl(still)
  const label = alt ?? `Stage concept ${still.title}`
  if (!src) return <div role="img" aria-label={`${label} (rendering)`} className={cn('bg-muted aspect-video w-full animate-pulse', className)} />
  return <img src={src} alt={label} className={className} />
}
