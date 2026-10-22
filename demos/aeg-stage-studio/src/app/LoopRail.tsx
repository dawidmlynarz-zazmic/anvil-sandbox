import { Fragment } from 'react'
import { Link, NavLink, useLocation, useSearchParams } from 'react-router-dom'
import { Timeline, TimelineItem, type TimelineTone } from '@anvil/components/anvil/timeline'
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@anvil/components/ui/item'
import {
  CheckIcon,
  ClapperboardIcon,
  ClipboardCheckIcon,
  FileTextIcon,
  Icon,
  ImageIcon,
  PackageIcon,
  RotateCcwIcon,
  type LucideIcon,
} from '@anvil/components/ui/icon'
import { briefReadiness } from '~/state/readiness'
import { useProject } from '~/state/ProjectContext'
import { LOOP } from './routes'

const ICONS: LucideIcon[] = [ImageIcon, ClapperboardIcon, ClipboardCheckIcon, PackageIcon]

const subLink =
  'focus-visible:focus-ring inline-flex min-h-6 items-center rounded-sm px-0.5 underline underline-offset-4 outline-none hover:text-foreground aria-[current=true]:text-foreground aria-[current=true]:type-text-xs-medium'

/**
 * Where the project stands. The brief sits above the loop; the loop (Stills → Motion → Review → Handoff) is
 * what repeats, version after version. Underneath: the project's history.
 */
export function LoopRail() {
  const { pathname } = useLocation()
  const [params] = useSearchParams()
  const p = useProject()
  const { phase, brief, rounds, selected, motionStills, clips, status, review, sentVersion, versions, path } = p
  const stills = rounds.flatMap((r) => r.stills)
  const latest = rounds.at(-1)
  const readyClips = Object.values(clips).filter((c) => c.status === 'ready').length
  const setup = phase === 'setup'
  const changesRequested = status === 'draft' && sentVersion !== null

  const done = [motionStills.length > 0, sentVersion !== null, status === 'approved', false]
  const detail = [
    rounds.length ? (
      <>
        {changesRequested && (
          <span className="text-agent dark:text-agent-medium flex items-center gap-1">
            <Icon icon={RotateCcwIcon} size="xs" />
            Back here for the artist’s changes
          </span>
        )}
        {selected.length} selected ·{' '}
        {[...rounds].reverse().map((r, i) => (
          <Fragment key={r.number}>
            {i > 0 && ', '}
            <Link
              to={path('stills', `round=${r.number}`)}
              className={subLink}
              aria-current={pathname.endsWith('/stills') && (Number(params.get('round')) || latest?.number) === r.number}
            >
              Round {r.number}
            </Link>
          </Fragment>
        ))}
      </>
    ) : setup ? (
      'Starts when the brief is ready'
    ) : (
      'No rounds yet'
    ),
    motionStills.length ? (
      <>
        {readyClips} {readyClips === 1 ? 'clip' : 'clips'} ready ·{' '}
        {motionStills.map((id, i) => (
          <Fragment key={id}>
            {i > 0 && ', '}
            <Link
              to={path('motion', `concept=${id}`)}
              className={subLink}
              aria-current={pathname.endsWith('/motion') && (params.get('concept') ?? motionStills[0]) === id}
            >
              {stills.find((s) => s.id === id)?.title.split(' · ')[0] ?? id}
            </Link>
          </Fragment>
        ))}
      </>
    ) : (
      'Nothing in motion yet'
    ),
    status === 'approved'
      ? 'Approved'
      : status === 'awaiting-artist'
        ? 'Waiting for the artist'
        : status === 'feedback'
          ? `${review.filter((c) => !c.resolved).length} open comments from the artist`
          : changesRequested
            ? 'Changes requested'
            : 'Not sent yet',
    status === 'approved' ? 'Package ready to export' : 'Unlocks when the artist approves',
  ]

  const version = sentVersion ? `Version ${sentVersion}` : rounds.length ? `Round ${rounds.length}` : 'Not started'

  return (
    <aside aria-label="Project progress" className="border-border relative flex h-full w-64 shrink-0 flex-col gap-4 overflow-y-auto border-s p-4">
      <Item asChild variant="outline" size="sm" selected={pathname.endsWith('/brief')}>
        <NavLink to={path('brief')}>
          <ItemMedia variant="icon">
            <Icon icon={setup ? FileTextIcon : CheckIcon} />
          </ItemMedia>
          <ItemContent>
            <ItemTitle>Brief</ItemTitle>
            <ItemDescription>
              {setup
                ? `Setting up · ${briefReadiness(p).done} of ${briefReadiness(p).total} done`
                : `${brief.keywords.length} keyword${brief.keywords.length === 1 ? '' : 's'} · ${brief.moments.length} key moment${brief.moments.length === 1 ? '' : 's'}`}
            </ItemDescription>
          </ItemContent>
        </NavLink>
      </Item>

      <div className="flex items-baseline justify-between">
        <h2 className="type-text-sm-semibold">The loop</h2>
        <span className="text-muted-foreground type-text-xs-normal">{version}</span>
      </div>
      <nav aria-label="Steps">
        <Timeline>
          {LOOP.map((s, i) => {
            const current = pathname.endsWith(`/${s.step}`)
            const tone: TimelineTone = done[i] ? 'success' : current ? 'agent' : 'neutral'
            return (
              <TimelineItem
                key={s.step}
                marker="tile"
                icon={done[i] ? CheckIcon : ICONS[i]}
                tone={tone}
                last={i === LOOP.length - 1}
                title={
                  <NavLink
                    to={path(s.step)}
                    aria-current={current ? 'step' : undefined}
                    className="focus-visible:focus-ring rounded-sm outline-none hover:underline aria-[current=step]:type-text-sm-semibold"
                  >
                    {s.label}
                  </NavLink>
                }
                detail={detail[i]}
              />
            )
          })}
        </Timeline>
      </nav>


      {versions.length > 0 && (
        <section aria-labelledby="history-title" className="flex flex-col gap-2">
          <h2 id="history-title" className="type-text-sm-semibold">
            History
          </h2>
          <Timeline>
            {[...versions]
              .reverse()
              .slice(0, 6)
              .map((v, i, all) => (
                <TimelineItem
                  key={v.number}
                  tone={v.number === sentVersion ? 'agent' : v.summary.startsWith('Approved') ? 'success' : 'neutral'}
                  title={<span className="type-text-xs-medium">v{v.number} · {v.summary}</span>}
                  detail={`${v.author} · ${v.time}`}
                  last={i === all.length - 1}
                />
              ))}
          </Timeline>
        </section>
      )}
    </aside>
  )
}
