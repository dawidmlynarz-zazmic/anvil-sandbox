import { useEffect, useState } from 'react'
import { Link, Navigate, useParams, useSearchParams } from 'react-router-dom'
import { Badge } from '@anvil/components/ui/badge'
import { Button } from '@anvil/components/ui/button'
import { ButtonGroup } from '@anvil/components/ui/button-group'
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@anvil/components/ui/dropdown-menu'
import {
  ArrowLeftIcon,
  CameraIcon,
  CheckIcon,
  ClapperboardIcon,
  ChevronDownIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
  Icon,
  LayersIcon,
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
import { useStillUrl } from '~/components/StillImage'
import { briefCheck } from '~/services/briefCheck'
import { batchLabel } from '~/services/explore'
import { momentLight } from '~/services/light'
import { ofGeneration } from '~/services/provenance'
import { useProject } from '~/state/ProjectContext'
import { defaultFocus, genById, gensFor, lineage, lookFor, MOMENT_STATUS, momentStatus } from '~/state/show'
import { TIME_LABEL, type Generation } from '~/state/types'
import { AssetKit } from './AssetKit'
import { LookMotion } from './LookMotion'
import { SongPrompt } from './SongPrompt'

/** One image on the contact sheet, with its own render. */
function Tile({ gen, ...props }: { gen: Generation } & Omit<React.ComponentProps<typeof ContactSheetTile>, 'src' | 'label' | 'caption' | 'alt'>) {
  const src = useStillUrl(gen)
  return <ContactSheetTile src={src} label={`#${gen.n}`} caption={gen.caption} alt={`#${gen.n} · ${gen.title}, ${gen.caption}`} {...props} />
}

/** The image open for work: what it is, its check, and what you can do to it. Reference (lineage, provenance) is in its menu. */
function Focus({ gen, readOnly, action }: { gen: Generation; readOnly: boolean; action?: React.ReactNode }) {
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
        menuItems={[
          { label: 'Provenance', icon: ShieldCheckIcon, onSelect: () => setProvenance(true) },
        ]}
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
        primaryAction={action}
      />
      <ProvenanceDialog name={`#${gen.n}`} provenance={ofGeneration(gen, lineage(p, gen))} open={provenance} onOpenChange={setProvenance} />
    </>
  )
}

export function MomentPage() {
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

  const choosable = focus && focus.id !== look?.id && !focus.dismissed

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
                <Button asChild={!!prev} variant="outline" intent="neutral" size="icon-sm" disabled={!prev} aria-label={prev ? `Previous: song ${prev.number}` : 'No previous song'}>
                  {prev ? (
                    <Link to={p.momentPath(prev.number)}>
                      <Icon icon={ChevronLeftIcon} />
                    </Link>
                  ) : (
                    <Icon icon={ChevronLeftIcon} />
                  )}
                </Button>
                <span className="text-muted-foreground px-1 type-text-xs-normal">
                  {index + 1} of {p.moments.length}
                </span>
                <Button asChild={!!next} variant="outline" intent="neutral" size="icon-sm" disabled={!next} aria-label={next ? `Next: song ${next.number}` : 'No next song'}>
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
              {moment.intent} · {TIME_LABEL[momentLight(p.brief, song, p.moments.length)].toLowerCase()}
            </p>
          </div>

          {all.length === 0 && !pending ? (
            <SongPrompt moment={moment} disabled={locked} />
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
                  {focus && (
                    <Focus
                      gen={focus}
                      readOnly={locked}
                      action={
                        choosable && !locked ? (
                          <Button size="sm" disabled={sent || !!pending} onClick={() => p.chooseLook(focus.id)}>
                            <Icon icon={ClapperboardIcon} />
                            Generate motion
                          </Button>
                        ) : undefined
                      }
                    />
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
                            New directions
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
                            title={batchLabel(first, parent)}
                            meta={`${gens.length} ${gens.length === 1 ? 'image' : 'images'} · ${first.author === 'you' ? 'you asked' : 'by the agent'}`}
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
    </section>
  )
}
