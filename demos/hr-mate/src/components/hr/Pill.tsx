import type { ReactNode } from 'react'
import { cn } from '@/lib/utils'

export type Tone = 'success' | 'warning' | 'info' | 'danger' | 'neutral'

const TONES: Record<Tone, string> = {
  success: 'bg-success-muted text-success border-success/30',
  warning: 'bg-warning-muted text-warning border-warning/30',
  info: 'bg-info-muted text-info border-info/30',
  danger: 'bg-destructive-muted text-destructive-soft border-destructive-soft/30',
  neutral: 'bg-muted text-muted-foreground border-border',
}

/** A status badge. Always carries an icon and text, never colour alone. */
export function Pill({ tone, icon, children, className }: { tone: Tone; icon?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <span className={cn('inline-flex h-6 shrink-0 items-center gap-1.5 whitespace-nowrap rounded-full border px-2.5 text-xs font-medium [&_svg]:size-3.5', TONES[tone], className)}>
      {icon}
      {children}
    </span>
  )
}

export const TONE_TEXT: Record<Tone, string> = {
  success: 'text-success',
  warning: 'text-warning',
  info: 'text-info',
  danger: 'text-destructive-soft',
  neutral: 'text-muted-foreground',
}
