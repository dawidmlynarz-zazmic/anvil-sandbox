import type { ReactNode } from 'react'
import { Button } from '@anvil/components/ui/button'
import { Icon, SparklesIcon } from '@anvil/components/ui/icon'

interface Props {
  title: string
  body: string
  date?: string
  time?: string
  actions: { label: string; onClick: () => void; primary?: boolean }[]
  children?: ReactNode
}

// DEMO-ONLY: a phone lock screen with one push notification, to show how the concierge reaches the guest first.
export function LockScreen({ title, body, actions, date = 'Friday, March 12', time = '3:05' }: Props) {
  return (
    <div className="flex min-h-0 flex-1 flex-col items-center bg-gradient-to-b from-[#072745] via-[#123d65] to-[#005c3c] px-4 pt-14 text-[#ffffff]" data-slot="lock-screen">
      <p className="type-text-sm-medium opacity-80">{date}</p>
      <p className="mb-8 text-[64px] leading-none font-light tracking-tight">{time}</p>
      <div className="w-full rounded-2xl bg-[#ffffffd9] p-3 text-[#1c1c1e] shadow-lg backdrop-blur" role="group" aria-label="Notification">
        <div className="type-text-xs-medium mb-1 flex items-center gap-2 text-[#3c3c43]">
          <span className="grid size-5 place-items-center rounded-md bg-[#123d65] text-[#ffffff]"><Icon icon={SparklesIcon} size="xs" /></span>
          <span>GREAT WOLF LODGE</span>
          <span className="ml-auto">now</span>
        </div>
        <p className="type-text-sm-semibold">{title}</p>
        <p className="type-text-sm-normal mt-0.5 text-[#3c3c43]">{body}</p>
        <div className="mt-3 flex gap-2">
          {actions.map((a) => (
            <Button key={a.label} size="sm" variant={a.primary ? 'default' : 'outline'} intent={a.primary ? 'brand' : 'neutral'} className="flex-1" onClick={a.onClick}>
              {a.label}
            </Button>
          ))}
        </div>
      </div>
    </div>
  )
}
