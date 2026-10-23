import { useEffect, useState } from 'react'
import { Link, Navigate, useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { Alert, AlertDescription, AlertTitle } from '@anvil/components/ui/alert'
import { Badge } from '@anvil/components/ui/badge'
import { Button } from '@anvil/components/ui/button'
import { ButtonGroup } from '@anvil/components/ui/button-group'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@anvil/components/ui/dropdown-menu'
import { EmptyState, EmptyStateDescription, EmptyStateHeader, EmptyStateMedia, EmptyStateTitle } from '@anvil/components/ui/empty-state'
import {
  ArrowLeftIcon,
  ArrowRightIcon,
  CameraIcon,
  CheckIcon,
  ClapperboardIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Icon,
  ImageIcon,
  LayersIcon,
  LockIcon,
  PackageIcon,
  ShieldCheckIcon,
  SparklesIcon,
  SunMoonIcon,
} from '@anvil/components/ui/icon'
import { Tabs, TabsList, TabsTrigger } from '@anvil/components/ui/tabs'
import { ConceptCard } from '~/components/local/ConceptCard/ConceptCard'
import { ContactSheetGroup, ContactSheetTile } from '~/components/local/ContactSheet/ContactSheet'
import { STEP_CONTENT } from '~/components/layout'
import { ModelBadge, MODEL } from '~/components/ModelBadge'
import { ProvenanceDialog } from '~/components/ProvenanceButton'
import { StepFooter } from '~/components/StepFooter'
import { useStillUrl } from '~/components/StillImage'
import { briefCheck } from '~/services/briefCheck'
import { batchLabel, matchesSet } from '~/services/explore'
import { momentLight } from '~/services/light'
import { ofGeneration } from '~/services/provenance'
import { lowerFirst } from '~/services/shapes'
import { useProject } from '~/state/ProjectContext'
import { defaultFocus, genById, gensFor, kitStatus, lineage, lookFor, MOMENT_STATUS, momentStatus, nextOpenMoment } from '~/state/show'
import { TIME_LABEL, type Generation } from '~/state/types'
import { AssetKit } from './AssetKit'
import { LookMotion } from './LookMotion'
import { LockSetDialog } from './LockSetDialog'

/** One image on the contact sheet, with its own render. */
function Tile({ gen, ...props }: { gen: Generation } & Omit<React.ComponentProps<typeof ContactSheetTile>, 'src' | 'label' | 'caption' | 'alt'>) {
  const src = useStillUrl(gen)
  return <ContactSheetTile src={src} label={`#${gen.n}`} caption={gen.caption} alt={`#${gen.n} · ${gen.title}, ${gen.caption}`} {...props} />
}

/** The image open for work: what it is, its check, and what you can do to it. Reference (lineage, provenance) is in its menu. */
function Focus({ gen, readOnly }: { gen: Generation; readOnly: boolean }) {
  const p = useProject()
  const src = useStillUrl(gen)
  const parent = genById(p, gen.parentId)
  const parentSrc = useStillUrl(parent)
  const look = lookFor(p, gen.song)
  const pending = p.pending[gen.song]
  const [provenance, setProvenance] = useState(false)
  return (
    <>
      <ConceptCard
        title={gen.title}
        versionPrefix="#"
        version={gen.n}
        rationale={gen.caption}
        titleBadge={
          look?.id === gen.id ? (
            <Badge tone="success" variant="subtle" size="xs">
              <Icon icon={CheckIcon} />
              Look
            </Badge>
          ) : undefined
        }
        mediaSrc={src}
        mediaAlt={`#${gen.n} · ${gen.title}, ${gen.caption}`}
        mediaBadge={<ModelBadge model={MODEL.still} />}
        previous={parent ? { version: parent.n, src: parentSrc } : undefined}
        compareInMenu
        menuItems={[{ label: 'Provenance', icon: ShieldCheckIcon, onSelect: () => setProvenance(true) }]}
        checks={briefCheck(gen, p.brief)}
        dismissed={gen.dismissed}
        busy={pending?.of === gen.id ? `${pending.label}…` : undefined}
        annotations={gen.annotations}
        onAddAnnotation={(text, at) => p.addAnnotation(gen.id, text, at)}
        onRemoveAnnotation={(n) => p.removeAnnotation(gen.id, n)}
        onApplyAnnotations={() => void p.applyAnnotations(gen.id)}
        applyHint={`Makes a new image from #${gen.n}. #${gen.n} is kept.`}
        regenerateLabel="Another take"
        onRegenerate={() => void p.anotherTake(gen.id)}
        onToggleDismissed={() => p.toggleDismissed(gen.id)}
        readOnly={readOnly}
      >
        {!matchesSet(gen.spec, p.set) && (
          <p className="text-muted-foreground type-text-xs-normal">Made before the set was locked: its structure differs from the set. Explore more like it to restage it on the set.</p>
        )}
      </ConceptCard>
      <ProvenanceDialog name={`#${gen.n}`} provenance={ofGeneration(gen, lineage(p, gen))} open={provenance} onOpenChange={setProvenance} />
    </>
  )
}

export function MomentPage() {
  const navigate = useNavigate()
  const { song: param } = useParams()
  const song = Number(param)
  const p = useProject()
  // Explore (finding the look and putting it into motion) or its asset kit. In the URL, so a link can open either.
  const [params, setParams] = useSearchParams()
  const tab = params.get('tab') === 'assets' ? 'assets' : 'explore'
  const setTab = (next: string) => setParams(next === 'assets' ? { tab: 'assets' } : {}, { replace: true })

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
  const pending = p.pending[song]
  const status = momentStatus(p, song)
  const locked = p.status === 'approved'
  const sent = p.status === 'awaiting-artist'
  const busy = !!pending || locked
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
          <div className="flex flex-col gap-1">
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
              {moment.intent} · {TIME_LABEL[momentLight(p.brief, song, p.moments.length)].toLowerCase()} · {p.set ? `set locked: ${lowerFirst(p.set.title)}` : 'set not locked yet'}
            </p>
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
                <TabsList variant="line" aria-label="Explore, or the asset kit">
                  <TabsTrigger value="explore">
                    <Icon icon={SparklesIcon} />
                    Explore · {all.length}
                  </TabsTrigger>
                  <TabsTrigger value="assets">
                    <Icon icon={PackageIcon} />
                    Asset kit
                  </TabsTrigger>
                </TabsList>
              </Tabs>

              {tab === 'assets' ? (
                <AssetKit moment={moment} />
              ) : (
                <>
                  {/* Motion first: once the open image is the look, its clip leads the page. */}
                  {look && focus?.id === look.id && <LookMotion moment={moment} look={look} readOnly={locked} />}
                  {focus && <Focus gen={focus} readOnly={locked} />}

                  {!p.set && focus && look?.id === focus.id && !locked && (
                    <Alert tone="agent" role="status" action={<LockSetDialog gen={focus} />}>
                      <Icon icon={LockIcon} />
                      <AlertTitle>Happy with this structure?</AlertTitle>
                      <AlertDescription>Lock the set from #{focus.n}: every moment then shares it, and only the look changes.</AlertDescription>
                    </Alert>
                  )}

                  <section aria-labelledby="explore-title" className="flex flex-col gap-4">
                    <div className="flex flex-wrap items-center justify-between gap-3">
                      <h2 id="explore-title" className="type-text-base-semibold">
                        {all.length} {all.length === 1 ? 'image' : 'images'}
                      </h2>
                      <div className="flex items-center gap-2">
                        {/* One way to explore: new directions, or a menu of batches built from the open image. */}
                        <ButtonGroup aria-label="Explore">
                          <Button variant="outline" intent="neutral" size="sm" disabled={busy} onClick={() => void p.explore(song, 'directions')}>
                            <Icon icon={SparklesIcon} />
                            {p.set ? 'New looks' : 'New directions'}
                          </Button>
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="outline" intent="neutral" size="icon-sm" disabled={busy || !focus} aria-label={`More ways to explore from #${focus?.n}`}>
                                <Icon icon={ChevronDownIcon} />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem onSelect={() => focus && void p.explore(song, 'more', focus.id)}>
                                <Icon icon={LayersIcon} />
                                More like #{focus?.n}
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => focus && void p.explore(song, 'angles', focus.id)}>
                                <Icon icon={CameraIcon} />
                                Other angles of #{focus?.n}
                              </DropdownMenuItem>
                              <DropdownMenuItem onSelect={() => focus && void p.explore(song, 'light', focus.id)}>
                                <Icon icon={SunMoonIcon} />
                                Other light for #{focus?.n}
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </ButtonGroup>
                      </div>
                    </div>

                    <p className="sr-only" aria-live="polite">
                      {pending ? `${pending.label}: ${pending.count} ${pending.count === 1 ? 'image' : 'images'} to go` : `${all.length} images explored`}
                    </p>
                    <div className="flex flex-col gap-5" aria-busy={!!pending}>
                      {newBatch && (
                        <ContactSheetGroup title={pending.label} meta="Rendering…" pending={pending.count}>
                          {null}
                        </ContactSheetGroup>
                      )}
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
                                chosen={look?.id === g.id ? 'Look' : undefined}
                                dismissed={g.dismissed}
                                onOpen={() => open(g.id)}
                              />
                            ))}
                          </ContactSheetGroup>
                        )
                      })}
                    </div>
                  </section>
                </>
              )}
            </>
          )}
        </div>
      </div>
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
            <Icon icon={ClapperboardIcon} />
            Put #{focus.n} into motion
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
