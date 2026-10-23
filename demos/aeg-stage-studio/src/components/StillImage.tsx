import { cn } from '@anvil/lib/utils'
import { ModelBadge } from './ModelBadge'
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

interface StillImageProps {
  still: Pictured
  alt: string
  className?: string
  /** Names the model that made it, over the image's corner. */
  model?: string
}

export function StillImage({ still, alt, className, model }: StillImageProps) {
  const src = useStillUrl(still)
  const image = src ? <img src={src} alt={alt} className={className} /> : <span role="img" aria-label={`${alt} (rendering)`} className={cn('bg-muted block aspect-video w-full animate-pulse', className)} />
  if (!model) return image
  return (
    <span className="relative block">
      {image}
      <ModelBadge model={model} />
    </span>
  )
}
