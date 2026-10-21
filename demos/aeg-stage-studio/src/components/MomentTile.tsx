import { ClipTile, type ClipStatus } from '~/components/local/ClipTile/ClipTile'
import { useMomentThumb } from '~/components/clipFrame'
import type { Still } from '~/state/types'

/** A key moment in the strip, with its 3D thumbnail. */
export function MomentTile({
  still,
  index,
  total,
  indoor,
  song,
  title,
  status,
  poster,
  selected,
  onClick,
}: {
  still: Still
  index: number
  total: number
  indoor: boolean
  song: number
  title: string
  status: ClipStatus
  poster?: string
  selected: boolean
  onClick: () => void
}) {
  const thumb = useMomentThumb(still, index, total, indoor, poster)
  return <ClipTile song={song} title={title} status={status} poster={status === 'not-started' ? undefined : thumb} selected={selected} onClick={onClick} />
}
