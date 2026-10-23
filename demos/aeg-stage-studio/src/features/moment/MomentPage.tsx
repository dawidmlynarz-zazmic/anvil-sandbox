import { Fragment, useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Alert, AlertDescription, AlertTitle } from '@anvil/components/ui/alert'
import { Badge } from '@anvil/components/ui/badge'
import { Breadcrumb, BreadcrumbItem, BreadcrumbLink, BreadcrumbList, BreadcrumbPage, BreadcrumbSeparator } from '@anvil/components/ui/breadcrumb'
import { Button } from '@anvil/components/ui/button'
import { ButtonGroup } from '@anvil/components/ui/button-group'
import { Tabs, TabsList, TabsTrigger } from '@anvil/components/ui/tabs'
import { EmptyState, EmptyStateDescription, EmptyStateHeader, EmptyStateMedia, EmptyStateTitle } from '@anvil/components/ui/empty-state'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CameraIcon,
  CheckIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  ColumnsIcon,
  Icon,
  ImageIcon,
  LayersIcon,
  LockIcon,
  PackageIcon,
  SparklesIcon,
  SunMoonIcon,
} from '@anvil/components/ui/icon'
import { ConceptCard } from '~/components/local/ConceptCard/ConceptCard'
import { ContactSheetGroup, ContactSheetTile } from '~/components/local/ContactSheet/ContactSheet'
import { IllustrativeNote } from '~/components/IllustrativeNote'
import { STEP_CONTENT } from '~/components/layout'
import { StepFooter } from '~/components/StepFooter'
import { useStillUrl } from '~/components/StillImage'
import { briefCheck, rationale } from '~/services/briefCheck'
import { batchLabel, matchesSet } from '~/services/explore'
import { momentLight } from '~/services/light'
import { lowerFirst } from '~/services/shapes'
import { useProject } from '~/state/ProjectContext'
import { defaultFocus, genById, gensFor, kitStatus, lineage, lookFor, MOMENT_STATUS, momentStatus, nextOpenMoment } from '~/state/show'
import { TIME_LABEL, type Generation } from '~/state/types'
import { CompareDialog } from './CompareDialog'
import { MotionCard } from './MotionCard'
import { AssetKit } from './AssetKit'
import { LockSetDialog } from './LockSetDialog'
import { ProvenanceButton } from '~/components/ProvenanceButton'
import { ofGeneration } from '~/services/provenance'

/** One image on the contact sheet, with its own render. */
function Tile({ gen, ...props }: { gen: Generation } & Omit<React.ComponentProps<typeof ContactSheetTile>, 'src' | 'label' | 'caption' | 'alt'>) {
  const src = useStillUrl(gen)
  return <ContactSheetTile src={src} label={`#${gen.n}`} caption={gen.caption} alt={`#${gen.n} · ${gen.title}, ${gen.caption}`} {...props} />
}

/** The image open for work: the full ConceptCard, with its lineage. */
function Focus({ gen, readOnly }: { gen: Generation; readOnly: boolean }) {
  const p = useProject()
  const src = useStillUrl(gen)
  const parent = genById(p, gen.parentId)
  // Compare with the parent in the same light and view, so only the design differs.
  const parentSrc = useStillUrl(parent)
  const chain = lineage(p, gen)
  const look = lookFor(p, gen.song)
  const pinned = (p.pins[gen.song] ?? []).includes(gen.id)
  const pending = p.pending[gen.song]
  return (
    <ConceptCard
      title={gen.title}
      versionPrefix="#"
      version={gen.n}
      change={gen.caption}
      rationale={rationale(gen, p.brief)}
      mediaSrc={src}
      mediaAlt={`#${gen.n} · ${gen.title}, ${gen.caption}`}
      previous={parent ? { version: parent.n, src: parentSrc } : undefined}
      checks={briefCheck(gen, p.brief)}
      selected={pinned}
      selectLabel="Pin"
      onSelectedChange={() => p.togglePin(gen.id)}
      dismissed={gen.dismissed}
      busy={pending?.of === gen.id ? `${pending.label}…` : undefined}
      annotations={gen.annotations}
      onAddAnnotation={(text, at) => p.addAnnotation(gen.id, text, at)}
      onRemoveAnnotation={(n) => p.removeAnnotation(gen.id, n)}
      onApplyAnnotations={() => void p.applyAnnotations(gen.id)}
      applyHint={`Makes a new image from #${gen.n}. #${gen.n} is kept.`}
      onMoreLikeThis={() => void p.explore(gen.song, 'more', gen.id)}
      regenerateLabel="Another take"
      onRegenerate={() => void p.anotherTake(gen.id)}
      onToggleDismissed={() => p.toggleDismissed(gen.id)}
      readOnly={readOnly}
    >
      {chain.length > 1 && (
        <Breadcrumb aria-label={`How #${gen.n} was made`}>
          <BreadcrumbList>
            {chain.map((g, i) => (
              <Fragment key={g.id}>
                {i > 0 && <BreadcrumbSeparator />}
                <BreadcrumbItem>
                  {g.id === gen.id ? (
                    <BreadcrumbPage className="type-text-xs-medium">#{g.n}</BreadcrumbPage>
                  ) : (
                    <BreadcrumbLink asChild className="type-text-xs-normal">
                      <button type="button" onClick={() => p.setFocus(g.song, g.id)} title={g.caption}>
                        #{g.n}
                      </button>
                    </BreadcrumbLink>
                  )}
                </BreadcrumbItem>
              </Fragment>
            ))}
          </BreadcrumbList>
        </Breadcrumb>
      )}
      <div className="flex items-center justify-between gap-2">
        {look?.id === gen.id ? (
          <p className="text-success-medium flex items-center gap-1.5 type-text-sm-medium">
            <Icon icon={CheckIcon} size="xs" />
            The look for this moment
          </p>
        ) : (
          <span />
        )}
        <ProvenanceButton name={`#${gen.n}`} provenance={ofGeneration(gen, chain)} />
      </div>
      {!matchesSet(gen.spec, p.set) && (
        <p className="text-muted-foreground type-text-xs-normal">
          Made before the set was locked: its structure differs from the set. Ask for more like it to restage it on the set.
        </p>
      )}
    </ConceptCard>
  )
}

export function MomentPage() {
  const navigate = useNavigate()
  const { song: param } = useParams()
  const song = Number(param)
  const p = useProject()
  const [compare, setCompare] = useState<string[]>([])
  const [comparing, setComparing] = useState(false)
  // Explore (the contact sheet) or Assets (the kit made from the look). In the URL, so a link can open either.
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'assets' ? 'assets' : 'explore'
  const setTab = (next: string) => setParams(next === 'assets' ? { tab: 'assets' } : {}, { replace: true })
  // Each moment has its own comparison.
  useEffect(() => setCompare([]), [song])

  const moment = p.moments.find((m) => m.number === song)
  const all = gensFor(p, song)
  const fromState = p.focus?.song === song ? genById(p, p.focus.genId) : undefined
  const focus = fromState ?? defaultFocus(p, song)
  const { setFocus } = p
  // Tell the chat which image is open, so “narrower, warmer” typed there changes this one.
  useEffect(() => {
    if (focus) setFocus(song, focus.id)
  }, [focus, song, setFocus])

  if (p.phase === 'setup') return <Navigate to={p.path('brief')} replace />
  if (!moment) return <Navigate to={p.path('show')} replace />

  const index = p.moments.indexOf(moment)
  const prev = p.moments[index - 1]
  const next = p.moments[index + 1]
  const look = lookFor(p, song)
  const pins = p.pins[song] ?? []
  const pending = p.pending[song]
  const light = momentLight(p.brief, song)
  const status = momentStatus(p, song)
  const locked = p.status === 'approved'
  const sent = p.status === 'awaiting-artist'
  const busy = !!pending || locked
  const toggleCompare = (id: string) => setCompare((list) => (list.includes(id) ? list.filter((x) => x !== id) : list.length < 4 ? [...list, id] : list))
  const open = (id: string) => setFocus(song, id)

  // Batches, newest first, each with its images in order.
  const batches = [...new Set(all.map((g) => g.batch))].sort((a, b) => b - a).map((batch) => all.filter((g) => g.batch === batch))
  // A batch on its way: its placeholders join its group, or stand alone until its first image lands.
  const newBatch = pending && !all.some((g) => g.batch === pending.batch)

  const openMoment = nextOpenMoment(p, song)
  const choosable = focus && focus.id !== look?.id && !focus.dismissed && matchesSet(focus.spec, p.set)
  const kit = kitStatus(p, song)

  return (
    <section aria-labelledby="moment-title" className="flex h-full min-w-0 flex-col">
      <div className="step-scroll relative min-h-0 flex-1 overflow-y-auto p-6">
        <div className={`${STEP_CONTENT} gap-5`}>
          <div className="flex flex-col gap-2">
            <div className="flex items-center justify-between gap-2">
              <Button asChild variant="ghost" intent="neutral" size="xs" className="-ms-2">
                <Link to={p.path('show')}>
                  <Icon icon={ArrowLeftIcon} />
                  The show
                </Link>
              </Button>
              <div className="flex items-center gap-1">
                <Button asChild={!!prev} variant="ghost" intent="neutral" size="icon-sm" disabled={!prev} aria-label={prev ? `Previous moment: song ${prev.number}` : 'No previous moment'}>
                  {prev ? (
                    <Link to={p.momentPath(prev.number)}>
                      <Icon icon={ChevronLeftIcon} />
                    </Link>
                  ) : (
                    <Icon icon={ChevronLeftIcon} />
                  )}
                </Button>
                <span className="text-muted-foreground type-text-xs-normal">
                  {index + 1} of {p.moments.length}
                </span>
                <Button asChild={!!next} variant="ghost" intent="neutral" size="icon-sm" disabled={!next} aria-label={next ? `Next moment: song ${next.number}` : 'No next moment'}>
                  {next ? (
                    <Link to={p.momentPath(next.number)}>
                      <Icon icon={ChevronRightIcon} />
                    </Link>
                  ) : (
                    <Icon icon={ChevronRightIcon} />
                  )}
                </Button>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 id="moment-title" tabIndex={-1} className="type-heading-2xl outline-none">
                Song {moment.number} · {moment.title}
              </h1>
              <Badge tone={MOMENT_STATUS[status].tone} variant="subtle">
                {MOMENT_STATUS[status].text}
              </Badge>
            </div>
            <p className="text-muted-foreground type-text-sm-normal">
              {moment.intent}. Plays in {TIME_LABEL[light].toLowerCase()}. Explore in batches, pin what you like, compare any two to four, then choose one as this moment’s look.
            </p>
            <p className="text-muted-foreground flex items-center gap-1.5 type-text-xs-normal">
              <Icon icon={LockIcon} size="xs" />
              {p.set ? `Set locked: ${lowerFirst(p.set.title)}. New images keep its structure and vary the look.` : 'Set not locked yet: new images can still try any structure.'}
            </p>
            <IllustrativeNote kind="stills" />
          </div>

          {all.length === 0 && !pending ? (
            <EmptyState className="py-10">
              <EmptyStateMedia variant="icon">
                <Icon icon={ImageIcon} />
              </EmptyStateMedia>
              <EmptyStateHeader>
                <EmptyStateTitle>Nothing explored for this moment yet</EmptyStateTitle>
                <EmptyStateDescription>
                  {p.set ? 'Start with four looks on the locked set, lit for this song.' : 'Start with four directions for the stage, lit for this song.'}
                </EmptyStateDescription>
              </EmptyStateHeader>
              <Button variant="outline" intent="neutral" disabled={locked} onClick={() => void p.explore(song, 'directions')}>
                <Icon icon={SparklesIcon} />
                {p.set ? 'Explore four looks' : 'Explore four directions'}
              </Button>
            </EmptyState>
          ) : (
            <>
              <Tabs value={tab} onValueChange={setTab}>
                <TabsList variant="line" aria-label="Explore or assets">
                  <TabsTrigger value="explore">
                    <Icon icon={SparklesIcon} />
                    Explore · {all.length}
                  </TabsTrigger>
                  <TabsTrigger value="assets">
                    <Icon icon={PackageIcon} />
                    Assets{p.kits[song] ? ` · ${p.kits[song]!.assets.length + 1}` : ''}
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {tab === 'assets' ? (
                <AssetKit moment={moment} />
              ) : (
                <>
                  {focus && <Focus gen={focus} readOnly={locked} />}

                  {!p.set && focus && look?.id === focus.id && !locked && (
                    <Alert
                      tone="agent"
                      role="status"
                      action={<LockSetDialog gen={focus} />}
                    >
                      <Icon icon={LockIcon} />
                      <AlertTitle>Happy with this structure?</AlertTitle>
                      <AlertDescription>Lock the set from #{focus.n}. Every moment then shares it, and only the look changes from song to song. You’ll see how it sits in the venue first.</AlertDescription>
                    </Alert>
                  )}

                  <section aria-labelledby="explore-title" className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2 id="explore-title" className="type-text-base-semibold">
                        Explore · {all.length} {all.length === 1 ? 'image' : 'images'}
                      </h2>
                      <ButtonGroup aria-label="Make a new batch">
                        <Button variant="outline" intent="neutral" size="sm" disabled={busy} onClick={() => void p.explore(song, 'directions')}>
                          <Icon icon={SparklesIcon} />
                          {p.set ? 'New looks' : 'New directions'}
                        </Button>
                        {/* Icon-only on a narrow work area; the names stay for screen readers and in the tooltip. */}
                        <Button variant="outline" intent="neutral" size="sm" title={`More like #${focus?.n}`} disabled={busy || !focus} onClick={() => focus && void p.explore(song, 'more', focus.id)}>
                          <Icon icon={LayersIcon} />
                          <span className="sr-only @xl:not-sr-only">More like #{focus?.n}</span>
                        </Button>
                        <Button variant="outline" intent="neutral" size="sm" title="Other angles" disabled={busy || !focus} onClick={() => focus && void p.explore(song, 'angles', focus.id)}>
                          <Icon icon={CameraIcon} />
                          <span className="sr-only @xl:not-sr-only">Other angles</span>
                        </Button>
                        <Button variant="outline" intent="neutral" size="sm" title="Other light" disabled={busy || !focus} onClick={() => focus && void p.explore(song, 'light', focus.id)}>
                          <Icon icon={SunMoonIcon} />
                          <span className="sr-only @xl:not-sr-only">Other light</span>
                        </Button>
                      </ButtonGroup>
                    </div>

                    <div className="bg-muted flex flex-wrap items-center gap-3 rounded-lg p-2" role="group" aria-label="Pinboard and comparing">
                      <span className="type-text-xs-semibold ps-1">Pinned</span>
                      {pins.length ? (
                        <ul className="flex flex-wrap gap-1.5">
                          {pins.map((id) => {
                            const g = genById(p, id)
                            return g ? (
                              <li key={id}>
                                <Button variant={focus?.id === id ? 'default' : 'outline'} intent="neutral" size="xs" onClick={() => open(id)}>
                                  #{g.n}
                                </Button>
                              </li>
                            ) : null
                          })}
                        </ul>
                      ) : (
                        <span className="text-muted-foreground type-text-xs-normal">Nothing yet. Pin images to keep them in view.</span>
                      )}
                      <div className="ms-auto flex items-center gap-2">
                        {pins.length >= 2 && (
                          <Button variant="ghost" intent="neutral" size="xs" onClick={() => { setCompare(pins.slice(-4)); setComparing(true) }}>
                            Compare pinned
                          </Button>
                        )}
                        {compare.length > 0 && (
                          <Button variant="ghost" intent="neutral" size="xs" onClick={() => setCompare([])}>
                            Clear
                          </Button>
                        )}
                        <Button variant="outline" intent="neutral" size="xs" disabled={compare.length < 2} onClick={() => setComparing(true)}>
                          <Icon icon={ColumnsIcon} />
                          Compare {compare.length ? `${compare.length} ticked` : ''}
                        </Button>
                      </div>
                    </div>

                    <p className="sr-only" aria-live="polite">
                      {pending ? `${pending.label}: ${pending.count} ${pending.count === 1 ? 'image' : 'images'} to go` : `${all.length} images explored`}
                    </p>
                    <div className="flex flex-col gap-5" aria-busy={!!pending}>
                      {newBatch && <ContactSheetGroup title={pending.label} meta="Rendering…" pending={pending.count}>{null}</ContactSheetGroup>}
                      {batches.map((gens) => {
                        const first = gens[0]!
                        const parent = genById(p, first.parentId)
                        return (
                          <ContactSheetGroup
                            key={first.batch}
                            title={batchLabel(first, parent, p.set)}
                            meta={`${gens.length} ${gens.length === 1 ? 'image' : 'images'} · ${first.author === 'you' ? 'you asked' : 'the agent explored'}`}
                            pending={pending?.batch === first.batch ? pending.count : 0}
                          >
                            {gens.map((g) => (
                              <Tile
                                key={g.id}
                                gen={g}
                                focused={focus?.id === g.id}
                                pinned={pins.includes(g.id)}
                                comparing={compare.includes(g.id)}
                                compareFull={compare.length >= 4}
                                chosen={look?.id === g.id ? 'Look' : undefined}
                                dismissed={g.dismissed}
                                onOpen={() => open(g.id)}
                                onTogglePin={() => p.togglePin(g.id)}
                                onToggleCompare={() => toggleCompare(g.id)}
                              />
                            ))}
                          </ContactSheetGroup>
                        )
                      })}
                    </div>
                  </section>

                  <MotionCard moment={moment} look={look} readOnly={locked} />
                </>
              )}
            </>
          )}
        </div>
      </div>
      <CompareDialog
        open={comparing}
        onOpenChange={setComparing}
        items={compare.flatMap((id) => genById(p, id) ?? [])}
        lookId={look?.id}
        pinned={pins}
        onOpen={open}
      />
      <StepFooter
        note={look ? `Look: #${look.n} · ${look.caption}` : 'No look chosen yet'}
        status={sent ? 'With the artist: choosing a new look waits until they reply' : undefined}
      >
        {tab === 'assets' && look && (kit === 'none' || kit === 'stale') ? (
          <Button disabled={locked} onClick={() => void p.buildKit(song)}>
            <Icon icon={PackageIcon} />
            {kit === 'stale' ? 'Rebuild the asset kit' : 'Build the asset kit'}
          </Button>
        ) : tab === 'explore' && choosable ? (
          <Button disabled={locked || sent || !!pending} onClick={() => p.chooseLook(focus.id)}>
            <Icon icon={CheckIcon} />
            Choose #{focus.n} as the look
          </Button>
        ) : openMoment && openMoment.number !== song ? (
          <Button onClick={() => navigate(p.momentPath(openMoment.number))}>
            Next: song {openMoment.number}
            <Icon icon={ArrowRightIcon} />
          </Button>
        ) : (
          <Button onClick={() => navigate(p.path('show'))}>
            Back to the show
            <Icon icon={ArrowRightIcon} />
          </Button>
        )}
      </StepFooter>
    </section>
  )
}
