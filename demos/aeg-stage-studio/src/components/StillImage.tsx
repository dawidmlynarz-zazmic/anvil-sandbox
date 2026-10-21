import { useStageImage } from '~/scene/useStageImage'
import type { Still } from '~/state/types'

/** The 3D render of a concept, or URL of it; shows the 2D fallback art until the render is ready. */
// eslint-disable-next-line react-refresh/only-export-components
export function useStillUrl(still: Still | undefined) {
  const rendered = useStageImage(still?.spec)
  return rendered ?? still?.image
}

export function StillImage({ still, alt, className }: { still: Still; alt?: string; className?: string }) {
  const src = useStillUrl(still)
  return <img src={src} alt={alt ?? `Stage concept ${still.title}`} className={className} />
}
