// ANVIL-CANDIDATE: see docs/anvil-upgrade-candidates.md#launcher-mobile
import type { ReactNode } from 'react'
import { Button } from '@anvil/components/ui/button'
import { Drawer, DrawerContent, DrawerTitle } from '@anvil/components/ui/drawer'
import { Icon, SparklesIcon } from '@anvil/components/ui/icon'
import { cn } from '@anvil/lib/utils'

export interface AskLauncherProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The agent's name, on the button and for screen readers. */
  label?: string
  /** The Chat Shell (surface="mobile"). */
  children: ReactNode
  className?: string
}

/**
 * Anvil's Launcher opens a 400 × 640 popover, which is a desktop pattern. This is the phone one: the same floating
 * brand button, opening the chat in a bottom Drawer. On a phone the Drawer is full width; on a larger screen it lines up
 * with the demo's device frame (`--frame-h`, set in app.css).
 */
export function AskLauncher({ open, onOpenChange, label = 'Ask AXS', children, className }: AskLauncherProps) {
  return (
    <>
      {!open && (
        <Button
          intent="brand"
          size="lg"
          aria-haspopup="dialog"
          onClick={() => onOpenChange(true)}
          className={cn('absolute right-4 bottom-4 z-10 shadow-lg', className)}
        >
          <Icon icon={SparklesIcon} />
          {label}
        </Button>
      )}
      <Drawer open={open} onOpenChange={onOpenChange} modal={false}>
        <DrawerContent
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => e.preventDefault()}
          data-shell="mobile"
          // The chat header has its own close button.
          showCloseButton={false}
          // Anvil sets max-height and bottom with attribute selectors, so these need `!` to win.
          className="h-[88dvh] max-h-none! sm:bottom-[calc((100svh-var(--frame-h))/2)]! sm:mx-auto sm:h-[calc(var(--frame-h)-3rem)] sm:w-97.5 sm:max-w-full sm:rounded-b-3xl"
        >
          <DrawerTitle className="sr-only">{label}</DrawerTitle>
          {children}
        </DrawerContent>
      </Drawer>
    </>
  )
}
