import { useState, type ReactNode } from 'react'
import { Button } from '@anvil/components/ui/button'
import { Icon, PauseIcon, PlayIcon } from '@anvil/components/ui/icon'
import { cn } from '@anvil/lib/utils'

// ANVIL-CANDIDATE: a full-bleed moving backdrop with readable overlay text. Closest Anvil option checked: none
// (Media Gallery is for photos; Widget Media is inline). See docs/anvil-upgrade-candidates.md.

/**
 * A hero with a looping video (or, without one, a slow drift over a still), a fixed dark scrim so white text keeps its
 * contrast, and a pause button. Motion stops for visitors who prefer reduced motion, and while paused.
 */
export function HeroBackdrop({
  image,
  video,
  align = 'center',
  className,
  children,
}: {
  /** The still: the video's poster, and the whole backdrop when there is no video. */
  image: string
  video?: string
  /** Where the content sits: centred, or on the start side like a search page. */
  align?: 'center' | 'start'
  className?: string
  children: ReactNode
}) {
  const [paused, setPaused] = useState(false)
  return (
    <section className={cn('relative isolate flex min-h-0 flex-1 overflow-hidden rounded-xl text-white', paused && 'tp-paused', className)}>
      <div className="absolute inset-0 -z-10 overflow-hidden bg-black">
        {video ? (
          <video
            className="size-full object-cover motion-reduce:hidden"
            src={video}
            poster={image}
            autoPlay={!paused}
            muted
            loop
            playsInline
            aria-hidden
            ref={(el) => {
              if (!el) return
              if (paused) el.pause()
              else void el.play().catch(() => {})
            }}
          />
        ) : null}
        <img src={image} alt="" className={cn('tp-drift size-full object-cover', video && 'hidden motion-reduce:block')} />
        <div className="absolute inset-0" style={{ background: 'linear-gradient(to top, rgb(0 0 0 / 0.78), rgb(0 0 0 / 0.5) 55%, rgb(0 0 0 / 0.35))' }} />
      </div>
      <div className={cn('relative flex flex-1 flex-col justify-center gap-6 p-6 sm:p-10', align === 'center' ? 'items-center text-center' : 'items-start text-start')}>{children}</div>
      <Button
        variant="ghost"
        intent="inverse"
        size="icon-sm"
        shape="circle"
        className="absolute right-3 bottom-3 hover:bg-white/20"
        style={{ color: '#fff' }}
        aria-label={paused ? 'Play the background' : 'Pause the background'}
        aria-pressed={paused}
        onClick={() => setPaused((p) => !p)}
      >
        <Icon icon={paused ? PlayIcon : PauseIcon} />
      </Button>
    </section>
  )
}
