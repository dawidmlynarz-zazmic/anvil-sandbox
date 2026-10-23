import { useState } from 'react'
import { Button } from '@anvil/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@anvil/components/ui/dialog'
import { Icon, PlayIcon } from '@anvil/components/ui/icon'
import { ClipPlayer } from '~/components/local/ClipPlayer/ClipPlayer'
import { MODEL } from '~/components/ModelBadge'
import { ClipTile } from '~/components/local/ClipTile/ClipTile'
import { clipFrame, useMomentThumb } from '~/components/clipFrame'
import { clipKey, useProject } from '~/state/ProjectContext'
import { lookFor } from '~/state/show'
import type { Generation, MotionClip, SetlistMoment } from '~/state/types'

interface Scene {
  moment: SetlistMoment
  look: Generation
  clip: MotionClip
}

function SceneTile({ scene, selected, onClick }: { scene: Scene; selected: boolean; onClick: () => void }) {
  const p = useProject()
  const thumb = useMomentThumb(scene.look, p.brief, scene.moment.number)
  return <ClipTile song={scene.moment.number} title={scene.moment.title} status="ready" poster={thumb} selected={selected} onClick={onClick} />
}

function Player({ scene, index, count, onEnded }: { scene: Scene; index: number; count: number; onEnded: () => void }) {
  const p = useProject()
  const poster = useMomentThumb(scene.look, p.brief, scene.moment.number, scene.clip.poster)
  return (
    <ClipPlayer
      model={MODEL.motion}
      autoPlay
      onEnded={onEnded}
      poster={poster}
      renderFrame={clipFrame(scene.look, scene.clip, p.brief)?.render}
      label={`Song ${scene.moment.number} · ${scene.moment.title}, ${index + 1} of ${count}`}
    />
  )
}

/** Plays every moment's clip in setlist order, one after another: the show as the audience will see it, in brief. */
export function ShowPreview() {
  const p = useProject()
  const [open, setOpen] = useState(false)
  const [at, setAt] = useState(0)
  // Bumped by “Play from the start”, so the first clip restarts even when it's already open.
  const [run, setRun] = useState(0)
  const scenes: Scene[] = p.moments.flatMap((moment) => {
    const look = lookFor(p, moment.number)
    const slot = look ? p.clips[clipKey(look.id, moment.number)] : undefined
    return look && slot?.status === 'ready' ? [{ moment, look, clip: slot.clip }] : []
  })
  const scene = scenes[at] ?? scenes[0]
  const missing = p.moments.length - scenes.length

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        setOpen(next)
        if (next) setAt(0)
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" intent="neutral" size="sm" disabled={!scenes.length}>
          <Icon icon={PlayIcon} />
          Preview the show
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-4xl">
        <DialogHeader>
          <DialogTitle>{scene ? `Song ${scene.moment.number} · ${scene.moment.title}` : 'The show'}</DialogTitle>
          <DialogDescription>
            Every key moment’s clip in setlist order, {scenes.length * 8} seconds in all.
            {missing ? ` ${missing === 1 ? '1 moment has' : `${missing} moments have`} no clip yet and ${missing === 1 ? 'is' : 'are'} left out.` : ''}
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          {scene && <Player key={`${run}-${at}`} scene={scene} index={at} count={scenes.length} onEnded={() => setAt((i) => (i + 1 < scenes.length ? i + 1 : i))} />}
          <ul className="grid grid-cols-4 gap-3">
            {scenes.map((s, i) => (
              <li key={s.moment.number} className="min-w-0">
                <SceneTile scene={s} selected={i === at} onClick={() => setAt(i)} />
              </li>
            ))}
          </ul>
        </DialogBody>
        <DialogFooter>
          <Button
            variant="outline"
            intent="neutral"
            disabled={!scenes.length}
            onClick={() => {
              setAt(0)
              setRun((r) => r + 1)
            }}
          >
            Play from the start
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
