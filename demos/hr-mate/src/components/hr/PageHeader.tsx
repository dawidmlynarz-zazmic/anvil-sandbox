import type { ReactNode } from 'react'
import { ChevronLeft } from 'lucide-react'
import { Link } from 'react-router-dom'

interface Props {
  title: ReactNode
  description?: ReactNode
  /** Secondary actions first, then the one primary action, top right. */
  actions?: ReactNode
  back?: { to: string; label: string }
  meta?: ReactNode
}

export function PageHeader({ title, description, actions, back, meta }: Props) {
  return (
    <header className="mb-6 flex flex-wrap items-start justify-between gap-x-6 gap-y-3">
      <div className="min-w-0 max-w-2xl">
        {back && (
          <Link to={back.to} className="text-muted-foreground hover:text-foreground mb-2 inline-flex items-center gap-1 text-[13px]">
            <ChevronLeft className="size-4" aria-hidden />
            {back.label}
          </Link>
        )}
        <div className="flex flex-wrap items-center gap-3">
          <h1 className="text-xl font-semibold">{title}</h1>
          {meta}
        </div>
        {description && <p className="text-muted-foreground mt-1">{description}</p>}
      </div>
      {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
    </header>
  )
}
