import { Bell } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Tooltip, TooltipContent, TooltipTrigger } from '@/components/ui/tooltip'
import { useAttention } from '@/lib/attention'
import { useDemo } from '@/lib/demo-state'
import { TONE_TEXT } from '@/components/hr/Pill'

export function Notifications() {
  const items = useAttention()
  const { state, dispatch } = useDemo()
  const unread = items.length > 0 && !state.notifRead
  return (
    <Popover onOpenChange={(o) => o && dispatch({ type: 'markNotifRead' })}>
      <Tooltip>
        <TooltipTrigger asChild>
          <PopoverTrigger asChild>
            <Button variant="ghost" size="icon" className="relative" aria-label={unread ? `Notifications, ${items.length} need attention` : 'Notifications'}>
              <Bell />
              {unread && <span className="bg-primary absolute top-1.5 right-1.5 size-2 rounded-full" aria-hidden />}
            </Button>
          </PopoverTrigger>
        </TooltipTrigger>
        <TooltipContent>Notifications</TooltipContent>
      </Tooltip>
      <PopoverContent align="end" className="w-96 p-0">
        <div className="border-b px-4 py-3">
          <p className="font-semibold">Needs your attention</p>
        </div>
        {items.length === 0 ? (
          <p className="text-muted-foreground px-4 py-8 text-center">You're all caught up. Failed runs, approvals and sync problems show up here.</p>
        ) : (
          <ul className="divide-y">
            {items.map((i) => (
              <li key={i.id} className="px-4 py-3">
                <p className={`text-[13px] font-medium ${TONE_TEXT[i.tone === 'destructive' ? 'danger' : i.tone]}`}>{i.title}</p>
                <p className="text-muted-foreground mt-0.5 text-[13px]">{i.detail}</p>
                <Button asChild variant="link" size="sm" className="mt-1 h-auto p-0">
                  <Link to={i.action.to}>{i.action.label}</Link>
                </Button>
              </li>
            ))}
          </ul>
        )}
      </PopoverContent>
    </Popover>
  )
}
