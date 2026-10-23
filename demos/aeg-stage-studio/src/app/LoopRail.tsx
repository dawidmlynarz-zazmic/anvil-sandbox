import { Link, NavLink, useLocation } from 'react-router-dom'
import { Timeline, TimelineItem, type TimelineTone } from '@anvil/components/anvil/timeline'
import { Item, ItemContent, ItemDescription, ItemMedia, ItemTitle } from '@anvil/components/ui/item'
import { CheckIcon, ClipboardCheckIcon, FileTextIcon, Icon, LayoutListIcon, PackageIcon, RotateCcwIcon, type LucideIcon } from '@anvil/components/ui/icon'
import { looksChosen } from '~/state/project'
import { briefReadiness } from '~/state/readiness'
import { useProject } from '~/state/ProjectContext'
import { kitStatus, momentStatus } from '~/state/show'
import { KeyValueList, KeyValueRow } from '@anvil/components/anvil/key-value-row'
import { LOOP } from './routes'

const ICONS: LucideIcon[] = [LayoutListIcon, ClipboardCheckIcon, PackageIcon]

const subLink =
  'focus-visible:focus-ring inline-flex min-h-6 items-center gap-1 rounded-sm px-0.5 underline underline-offset-4 outline-none hover:text-foreground aria-[current=page]:text-foreground aria-[current=page]:type-text-xs-medium'

/**
 * Where the project stands. The brief sits above the loop; the loop is the show (moment by moment), the artist's
 * review and the handoff. Underneath: the project's history.
 */
export function LoopRail() {
  const { pathname } = useLocation()
  const p = useProject()
  const { phase, moments, status, review, sentVersion, versions, set, path, momentPath } = p
  const setup = phase === 'setup'
  const chosen = looksChosen(p)
  const changesRequested = status === 'draft' && sentVersion !== null
  const readiness = briefReadiness(p)

  const done = [!setup && moments.length > 0 && chosen === moments.length, sentVersion !== null, status === 'approved']
  const detail = [
    setup ? (
      'Starts when the brief is ready'
    ) : (
      <span className="flex flex-col gap-1">
        {changesRequested && (
          <span className="text-agent dark:text-agent-medium flex items-center gap-1">
            <Icon icon={RotateCcwIcon} size="xs" />
            Back here for the artist’s changes
          </span>
        )}
        <span>
          {chosen} of {moments.length} looks · {set ? 'set locked' : 'set not locked'}
        </span>
        {/* The timeline's detail is a paragraph: one link per line, no list inside it. */}
        <span className="flex flex-col">
          {moments.map((m) => {
            const ok = momentStatus(p, m.number) === 'chosen'
            const to = momentPath(m.number)
            return (
              <Link key={m.number} to={to} className={`${subLink} self-start`} aria-current={pathname === to || pathname.endsWith(`/m/${m.number}`) ? 'page' : undefined}>
                {ok && <Icon icon={CheckIcon} size="xs" label="Look chosen" />}
                Song {m.number} · {m.title}
              </Link>
            )
          })}
        </span>
      </span>
    ),
    status === 'approved'
      ? 'Approved'
      : status === 'awaiting-artist'
        ? 'With the artist'
        : status === 'feedback'
          ? `${review.filter((c) => !c.resolved).length} open comments from the artist`
          : changesRequested
            ? 'Changes requested'
            : 'Not sent yet',
    status === 'approved' ? 'Package ready to export' : 'Unlocks when the artist approves',
  ]

  const sends = versions.filter((v) => v.summary.startsWith('Sent to the artist')).length
  const kits = moments.filter((m) => kitStatus(p, m.number) === 'ready').length

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
              {setup ? `Setting up · ${readiness.done} of ${readiness.total} done` : `${p.brief.keywords.length} keyword${p.brief.keywords.length === 1 ? '' : 's'} · stage and slot set`}
            </ItemDescription>
          </ItemContent>
        </NavLink>
      </Item>

      <div className="flex items-baseline justify-between">
        <h2 className="type-text-sm-semibold">The loop</h2>
        <span className="text-muted-foreground type-text-xs-normal">{sends ? `Review ${sends}` : setup ? 'Not started' : 'Designing'}</span>
      </div>
      <nav aria-label="Steps">
        <Timeline>
          {LOOP.map((s, i) => {
            const current = pathname.endsWith(`/${s.step}`) || (s.step === 'show' && /\/m\/\d+$/.test(pathname))
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

      {!setup && (
        <section aria-labelledby="sofar-title" className="flex flex-col gap-2">
          <h2 id="sofar-title" className="type-text-sm-semibold">
            So far
          </h2>
          {/* The pilot's measures as they build up, on every screen: not only at the end. */}
          <KeyValueList>
            <KeyValueRow label="Looks chosen">
              {chosen} of {moments.length}
            </KeyValueRow>
            <KeyValueRow label="Images explored">{p.generations.length}</KeyValueRow>
            <KeyValueRow label="Kits built">
              {kits} of {moments.length}
            </KeyValueRow>
            <KeyValueRow label="Reviews">{sends}</KeyValueRow>
            <KeyValueRow label="Days since the brief">{p.daysSinceBrief}</KeyValueRow>
            {p.artistRating ? <KeyValueRow label="Artist rating">{p.artistRating}/5</KeyValueRow> : null}
          </KeyValueList>
        </section>
      )}

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
                  tone={v.number === sentVersion ? 'agent' : /approved/i.test(v.summary) ? 'success' : 'neutral'}
                  title={<span className="type-text-xs-medium">{v.summary}</span>}
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
