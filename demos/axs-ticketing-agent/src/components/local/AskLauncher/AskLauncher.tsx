// ANVIL-CANDIDATE: see docs/anvil-upgrade-candidates.md#launcher-mobile
import type { ReactNode } from 'react'
import { Button } from '@anvil/components/ui/button'
import { Drawer, DrawerContent, DrawerTitle } from '@anvil/components/ui/drawer'
import { Icon, SparklesIcon } from '@anvil/components/ui/icon'
import { cn } from '@anvil/lib/utils'
import { ChromaRing } from '../ChromaRing/ChromaRing'

export interface AskLauncherProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  /** The agent's name, on the button and for screen readers. */
  label?: string
  /** The Chat Shell (surface="mobile"). */
  children: ReactNode
  /** Where the full-screen chat is portaled. Default: the page (the whole viewport). */
  container?: HTMLElement | null
  className?: string
}

/**
 * Anvil's Launcher opens a 400 × 640 popover, which is a desktop pattern. This is the phone one: the same floating
 * brand button, opening the chat as a full-screen modal that slides up in a Drawer. It takes the whole viewport (clear of
 * the phone's top and bottom insets), has no grab handle and can't be dragged away: the chat's own close button (or
 * Escape) closes it. Pass `container` (the demo's device frame) to keep it, its dimming and its slide-in inside that
 * element, which must be a containing block for fixed-position children (see DeviceFrame).
 */
export function AskLauncher({ open, onOpenChange, label = 'Ask AXS', children, container, className }: AskLauncherProps) {
  return (
    <>
      {!open && (
        // A chroma ring in the brand blue and white runs round the button while it waits.
        <ChromaRing className={cn('absolute right-4 bottom-4 z-10 w-fit', className)}>
          <Button intent="brand" size="lg" aria-haspopup="dialog" onClick={() => onOpenChange(true)} className="shadow-lg">
            <Icon icon={SparklesIcon} />
            {label}
          </Button>
        </ChromaRing>
      )}
      <Drawer open={open} onOpenChange={onOpenChange} handleOnly container={container}>
        <DrawerContent
          aria-describedby={undefined}
          onOpenAutoFocus={(e) => e.preventDefault()}
          data-shell="mobile"
          // The chat header has its own close button.
          showCloseButton={false}
          // Full height and no handle. Anvil sets height limits, margin and corners with attribute selectors, so these need
          // `!` to win. With the handle hidden and `handleOnly`, nothing on screen drags it closed. The container clips it.
          className="h-full max-h-none! mt-0! rounded-none! border-0 pt-[env(safe-area-inset-top,0px)] pb-[env(safe-area-inset-bottom,0px)] [&>[data-slot=drawer-handle]]:hidden!"
        >
          <DrawerTitle className="sr-only">{label}</DrawerTitle>
          {children}
        </DrawerContent>
      </Drawer>
    </>
  )
}
