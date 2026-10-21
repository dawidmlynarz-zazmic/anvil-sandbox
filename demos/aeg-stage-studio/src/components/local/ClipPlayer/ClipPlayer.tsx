// ANVIL-CANDIDATE: see docs/anvil-upgrade-candidates.md#clip-player
import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Button } from '@anvil/components/ui/button'
import { Icon, PauseIcon, PlayIcon, RotateCcwIcon } from '@anvil/components/ui/icon'
import { Slider } from '@anvil/components/ui/slider'
import { cn } from '@anvil/lib/utils'
import { SYNTHID_SHORT } from '~/mocks/copy'

export interface ClipPlayerProps extends Omit<React.ComponentProps<'div'>, 'children'> {
  /** The still shown for the clip (placeholder for a real video source). Undefined while it renders: a placeholder shows. */
  poster?: string
  /** A second still shown on the right half when `compare` is on. */
  comparePoster?: string
  compare?: boolean
  /** Clip length in seconds. */
  seconds?: number
  /** Names the clip for assistive tech, e.g. "Song 14 · Crowd split, version 2". */
  label: string
  /** Shown over the clip while it is being edited or rendered. */
  busy?: boolean
  /** Draws the frame at time `t` live (e.g. a 3D scene). Without it, the player animates the poster. */
  renderFrame?: (t: number, variant: 'main' | 'compare') => ReactNode
  /** Names the two halves when comparing, e.g. ["Golden hour", "Night"]. */
  compareLabels?: [string, string]
}

const clock = (s: number) => `0:${String(Math.floor(s)).padStart(2, '0')}`

/** A video preview with play, a scrubber and a time readout. Today it animates a still; swap the poster for a <video> later. */
export function ClipPlayer({ poster, comparePoster, compare = false, seconds = 8, label, busy, renderFrame, compareLabels, className, ...props }: ClipPlayerProps) {
  const [time, setTime] = useState(0)
  const [playing, setPlaying] = useState(false)
  const last = useRef(0)

  useEffect(() => {
    if (!playing) return
    let frame = 0
    last.current = performance.now()
    const tick = (now: number) => {
      const delta = (now - last.current) / 1000
      last.current = now
      setTime((t) => {
        const next = t + delta
        if (next >= seconds) {
          setPlaying(false)
          return seconds
        }
        return next
      })
      frame = requestAnimationFrame(tick)
    }
    frame = requestAnimationFrame(tick)
    return () => cancelAnimationFrame(frame)
  }, [playing, seconds])

  // A new clip (or a new edit of it) starts from the beginning. The label names the clip and its version.
  useEffect(() => {
    setTime(0)
    setPlaying(false)
  }, [label])

  const ended = time >= seconds
  const zoom = renderFrame ? 1 : 1 + (time / seconds) * 0.08

  return (
    <div className={cn('flex flex-col gap-3', className)} {...props}>
      <div role="img" aria-label={label} className={cn('bg-muted relative aspect-video overflow-hidden rounded-xl', !poster && !renderFrame && 'animate-pulse')}>
        {poster && (
          <img
            src={poster}
            alt=""
            className="absolute inset-0 size-full object-cover"
            style={{ transform: `scale(${zoom})` }}
          />
        )}
        {renderFrame && <div className="absolute inset-0">{renderFrame(time, 'main')}</div>}
        {compare && (comparePoster || renderFrame) && (
          <>
            <div className="absolute inset-0" style={{ clipPath: 'inset(0 0 0 50%)' }}>
              {renderFrame ? (
                renderFrame(time, 'compare')
              ) : (
                <img src={comparePoster} alt="" className="size-full object-cover" style={{ transform: `scale(${zoom})` }} />
              )}
            </div>
            <span aria-hidden className="bg-background absolute inset-y-0 start-1/2 w-0.5" />
            {compareLabels && (
              <>
                <span className="bg-background/80 absolute start-3 top-3 rounded-sm px-1.5 type-text-2xs-medium">{compareLabels[0]}</span>
                <span className="bg-background/80 absolute end-3 top-3 rounded-sm px-1.5 type-text-2xs-medium">{compareLabels[1]}</span>
              </>
            )}
          </>
        )}
        {busy && (
          <div className="bg-background/70 absolute inset-0 flex items-center justify-center type-text-sm-medium" role="status">
            Rendering the new version…
          </div>
        )}
        <span className="text-foreground-inverse absolute end-3 bottom-2 type-text-2xs-medium opacity-80">{SYNTHID_SHORT}</span>
      </div>
      <div className="flex items-center gap-3">
        <Button
          variant="default"
          intent="neutral"
          shape="circle"
          size="icon"
          aria-label={playing ? 'Pause' : ended ? 'Replay' : 'Play'}
          onClick={() => {
            if (ended) setTime(0)
            setPlaying((p) => !p)
          }}
        >
          <Icon icon={playing ? PauseIcon : ended ? RotateCcwIcon : PlayIcon} />
        </Button>
        <Slider
          aria-label="Scrub clip"
          min={0}
          max={seconds}
          step={0.1}
          value={[time]}
          onValueChange={([next]) => {
            setPlaying(false)
            setTime(next ?? 0)
          }}
        />
        <output className="text-muted-foreground w-20 shrink-0 text-end tabular-nums type-text-xs-normal">
          {clock(time)} / {clock(seconds)}
        </output>
      </div>
    </div>
  )
}
