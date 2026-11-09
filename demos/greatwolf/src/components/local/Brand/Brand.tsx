import type { ReactNode } from 'react'
import { Badge } from '@anvil/components/ui/badge'
import { Icon, PawPrintIcon, SparklesIcon } from '@anvil/components/ui/icon'
import { cn } from '@anvil/lib/utils'

// Demo-only brand pieces for the host page: a text wordmark (no logo assets), photo placeholders (no real GWL
// photography), the "sample" label, Wiley's avatar and the "Set by Wiley" tag.

/** The stacked GREAT / WOLF / LODGE wordmark in its square frame, as on greatwolf.com. Text only. */
export function Logo({ className }: { className?: string }) {
  return (
    <span
      aria-label="Great Wolf Lodge"
      role="img"
      className={cn('gwl-display inline-flex flex-col border-2 border-foreground px-1 py-0.5 text-[10px] leading-[1.05] tracking-[0.06em] text-foreground', className)}
    >
      <span aria-hidden>GREAT</span>
      <span aria-hidden>
        W<span className="text-[#b5232f]">●</span>LF
      </span>
      <span aria-hidden>LODGE</span>
    </span>
  )
}

const TONES = {
  lake: 'from-[#cfe6f7] to-[#7fb3d9] dark:from-[#123d65] dark:to-[#0c2540]',
  forest: 'from-[#d6eadf] to-[#7fb89b] dark:from-[#0f3b2c] dark:to-[#0a2a20]',
  dusk: 'from-[#f6dcc4] to-[#c99a7a] dark:from-[#4a2f22] dark:to-[#2b1b13]',
  den: 'from-[#efe0c8] to-[#b98d5c] dark:from-[#3f2c18] dark:to-[#26190d]',
}

/** A labeled image placeholder. The label says what the photo would show. */
export function Photo({ label, tone = 'lake', className, children }: { label: string; tone?: keyof typeof TONES; className?: string; children?: ReactNode }) {
  return (
    <div role="img" aria-label={`${label} (placeholder)`} className={cn('relative grid place-items-center overflow-hidden bg-gradient-to-br', TONES[tone], className)}>
      <span className="type-text-xs-medium rounded-full bg-[#ffffffcc] px-2.5 py-1 text-[#123d65] dark:bg-[#071828cc] dark:text-[#cae6ff]">{label}</span>
      {children}
    </div>
  )
}

export function Sample({ className }: { className?: string }) {
  return (
    <Badge variant="subtle" size="xs" className={cn('uppercase', className)}>
      sample
    </Badge>
  )
}

export function WileyAvatar({ size = 32, online = false }: { size?: number; online?: boolean }) {
  return (
    <span className="relative inline-grid shrink-0 place-items-center rounded-full bg-[#123d65] text-[#cae6ff] dark:bg-[#cae6ff] dark:text-[#123d65]" style={{ width: size, height: size }}>
      <Icon icon={PawPrintIcon} style={{ width: size * 0.55, height: size * 0.55 }} />
      {online && <span aria-hidden className="absolute -right-0.5 -bottom-0.5 size-2.5 rounded-full bg-[#3bb54a] ring-2 ring-background" />}
    </span>
  )
}

/** Marks what Wiley changed on the page ("Set by Wiley", "Filtered by Wiley"…). */
export function WileyTag({ children }: { children: ReactNode }) {
  return (
    <Badge tone="agent" variant="subtle" size="sm" className="gwl-in">
      <Icon icon={SparklesIcon} />
      {children}
    </Badge>
  )
}
