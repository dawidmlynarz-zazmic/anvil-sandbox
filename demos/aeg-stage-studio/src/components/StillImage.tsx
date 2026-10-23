import { cn } from '@anvil/lib/utils'
import { useStageImage } from '~/scene/useStageImage'
import { canRenderWebGL } from '~/scene/webgl'
import type { StillSpec } from '~/state/types'

/** Anything with a stage to draw: a generation, or a generation seen in other light. */
export interface Pictured {
  spec: StillSpec
  /** 2D fallback art, for browsers without WebGL. */
  image: string
}

/**
 * The 3D render of a stage image, or undefined while it renders (show a placeholder, never the 2D art, so nothing
 * flashes). Browsers without WebGL get the 2D fallback art.
 */
// eslint-disable-next-line react-refresh/only-export-components
export function useStillUrl(still: Pictured | undefined) {
  const rendered = useStageImage(still?.spec)
  if (rendered) return rendered
  return still && canRenderWebGL() ? undefined : still?.image
}

export function StillImage({ still, alt, className }: { still: Pictured; alt: string; className?: string }) {
  const src = useStillUrl(still)
  if (!src) return <div role="img" aria-label={`${alt} (rendering)`} className={cn('bg-muted aspect-video w-full animate-pulse', className)} />
  return <img src={src} alt={alt} className={className} />
}
