import type { ReactNode } from 'react'
import type { LucideIcon } from 'lucide-react'

export function EmptyState({ icon: Icon, title, children, action }: { icon: LucideIcon; title: string; children?: ReactNode; action?: ReactNode }) {
  return (
    <div className="border-border flex flex-col items-center rounded-lg border border-dashed px-6 py-12 text-center">
      <div className="bg-muted text-muted-foreground mb-4 flex size-10 items-center justify-center rounded-full">
        <Icon className="size-5" aria-hidden />
      </div>
      <h3 className="text-base font-semibold">{title}</h3>
      {children && <p className="text-muted-foreground mt-1 max-w-md">{children}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  )
}
