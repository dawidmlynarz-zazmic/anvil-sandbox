import type { ReactNode } from 'react'
import { Link } from 'react-router-dom'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@anvil/components/ui/breadcrumb'

export interface Crumb {
  label: string
  to?: string
}

/** Breadcrumbs are real links, so Back and deep links work. The last one is the page. */
export function PageHeading({ crumbs, title, subtitle, children }: { crumbs: Crumb[]; title: ReactNode; subtitle?: ReactNode; children?: ReactNode }) {
  return (
    <header className="flex flex-col gap-3">
      <Breadcrumb>
        <BreadcrumbList>
          {crumbs.map((c, i) => (
            <span key={c.label} className="contents">
              {i > 0 && <BreadcrumbSeparator />}
              <BreadcrumbItem>
                {c.to ? <BreadcrumbLink asChild><Link to={c.to}>{c.label}</Link></BreadcrumbLink> : <BreadcrumbPage>{c.label}</BreadcrumbPage>}
              </BreadcrumbItem>
            </span>
          ))}
        </BreadcrumbList>
      </Breadcrumb>
      <div className="flex flex-col gap-1">
        <h1 className="type-heading-2xl">{title}</h1>
        {subtitle ? <p className="type-text-sm-normal text-muted-foreground">{subtitle}</p> : null}
      </div>
      {children}
    </header>
  )
}
