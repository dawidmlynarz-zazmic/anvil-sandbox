import { ClipTile, type ClipStatus } from '~/components/local/ClipTile/ClipTile'
import { useMomentThumb } from '~/components/clipFrame'
import type { Brief, Still } from '~/state/types'

/** A key moment in the strip, with its 3D thumbnail. */
export function MomentTile({
  still,
  brief,
  song,
  title,
  status,
  poster,
  selected,
  onClick,
}: {
  still: Still
  /** The brief, for the light this song plays in. */
  brief: Brief
  song: number
  title: string
  status: ClipStatus
  poster?: string
  selected: boolean
  onClick: () => void
}) {
  const thumb = useMomentThumb(still, brief, song, poster)
  return <ClipTile song={song} title={title} status={status} poster={status === 'not-started' ? undefined : thumb} selected={selected} onClick={onClick} />
}
