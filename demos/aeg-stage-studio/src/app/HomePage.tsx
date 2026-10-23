import { useState } from 'react'
import { Link } from 'react-router-dom'
import { Badge } from '@anvil/components/ui/badge'
import { Card } from '@anvil/components/ui/card'
import { Icon, ImageIcon, PlusIcon } from '@anvil/components/ui/icon'
import { SidebarInset, SidebarProvider, SidebarTrigger } from '@anvil/components/ui/sidebar'
import { useMomentThumb } from '~/components/clipFrame'
import { venueOf } from '~/mocks/venues'
import { currentStep, looksChosen, statusBadge, type ProjectState } from '~/state/project'
import { genById } from '~/state/show'
import { useStore } from '~/state/store'
import { AboutDemo } from './AboutDemo'
import { NewProjectDialog } from './NewProjectDialog'
import { ProjectsSidebar } from './ProjectsSidebar'

/** “Updated 5 min ago”, “Updated 3 days ago”. */
function updated(at: number) {
  const minutes = Math.round((Date.now() - at) / 60_000)
  if (minutes < 1) return 'Updated just now'
  if (minutes < 60) return `Updated ${minutes} min ago`
  const hours = Math.round(minutes / 60)
  if (hours < 24) return `Updated ${hours} ${hours === 1 ? 'hour' : 'hours'} ago`
  const days = Math.round(hours / 24)
  return `Updated ${days} ${days === 1 ? 'day' : 'days'} ago`
}

/** One project: its set (or first look), the show, the venue, and where it stands. */
function ProjectCard({ p }: { p: ProjectState }) {
  const first = p.moments[0]
  const shown = (p.set && genById(p, p.set.fromId)) || genById(p, first ? p.looks[first.number] : undefined) || p.generations.at(-1)
  const thumb = useMomentThumb(shown, p.brief, shown?.song ?? 0)
  const badge = statusBadge(p.status)
  const venue = venueOf(p.brief.venueId)
  const setup = p.phase === 'setup'
  return (
    <Card asChild className="h-full gap-3 p-3 transition-shadow hover:ring-2 hover:ring-border-action">
      <Link to={`/p/${p.meta.id}/${currentStep(p)}`} className="focus-visible:focus-ring outline-none">
        <span className="bg-muted flex aspect-video items-center justify-center overflow-hidden rounded-md">
          {shown ? thumb ? <img src={thumb} alt="" className="size-full object-cover" /> : <span aria-hidden className="size-full animate-pulse" /> : <Icon icon={ImageIcon} className="text-muted-foreground" />}
        </span>
        <span className="flex flex-col gap-1 px-1">
          <span className="flex items-start justify-between gap-2">
            <span className="type-text-sm-semibold">
              {p.meta.artist} · {p.meta.event}
            </span>
            <Badge tone={badge.tone} variant="subtle" shape="pill" indicator size="sm" className="shrink-0">
              {badge.text}
            </Badge>
          </span>
          <span className="text-muted-foreground type-text-xs-normal">
            {setup && p.provenance.venue === 'pending' ? 'Venue not set yet' : `${venue.name}, ${venue.city}`}
          </span>
          <span className="text-muted-foreground type-text-xs-normal">
            {setup ? 'Setting up the brief' : `${looksChosen(p)} of ${p.moments.length} looks chosen`} · {updated(p.meta.updatedAt)}
          </span>
        </span>
      </Link>
    </Card>
  )
}

/** Every project as a card, plus a new one. The sidebar keeps them close at hand inside a project. */
export function HomePage() {
  const { list } = useStore()
  const [creating, setCreating] = useState(false)
  return (
    <SidebarProvider defaultOpen={false} className="h-svh min-h-0">
      <ProjectsSidebar />
      <SidebarInset className="h-svh min-h-0 min-w-0">
        <NewProjectDialog open={creating} onOpenChange={setCreating} />
        <header className="border-border flex h-14 shrink-0 items-center gap-2 border-b px-3">
          <SidebarTrigger aria-label="Show or hide projects" />
          <span className="ms-1 type-text-sm-semibold">Stage Studio</span>
          <div className="flex-1" />
          <AboutDemo />
        </header>
        <main className="min-h-0 flex-1 overflow-y-auto p-6">
          <div className="@container mx-auto flex w-full max-w-6xl flex-col gap-6">
            <div className="flex flex-col gap-2">
              <h1 tabIndex={-1} className="type-heading-2xl outline-none">
                All projects
              </h1>
              <p className="text-muted-foreground type-text-sm-normal">Every show you’re designing, most recent first. Open one to pick up where it is.</p>
            </div>
            <ul className="grid grid-cols-1 gap-4 @xl:grid-cols-2 @4xl:grid-cols-3">
              <li>
                <Card asChild className="h-full min-h-56 border-dashed shadow-none hover:ring-2 hover:ring-border-action">
                  <button type="button" onClick={() => setCreating(true)} className="focus-visible:focus-ring flex w-full flex-col items-center justify-center gap-2 p-6 text-center outline-none">
                    <span className="bg-muted flex size-10 items-center justify-center rounded-full">
                      <Icon icon={PlusIcon} />
                    </span>
                    <span className="type-text-base-semibold">New project</span>
                    <span className="text-muted-foreground type-text-sm-normal">Name the artist and event; the agent sets up the brief with you.</span>
                  </button>
                </Card>
              </li>
              {list.map((p) => (
                <li key={p.meta.id} className="min-w-0">
                  <ProjectCard p={p} />
                </li>
              ))}
            </ul>
          </div>
        </main>
      </SidebarInset>
    </SidebarProvider>
  )
}
