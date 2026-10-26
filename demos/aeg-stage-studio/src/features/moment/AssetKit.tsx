import { useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@anvil/components/ui/alert'
import { Badge } from '@anvil/components/ui/badge'
import { Button } from '@anvil/components/ui/button'
import { EmptyState, EmptyStateDescription, EmptyStateHeader, EmptyStateMedia, EmptyStateTitle } from '@anvil/components/ui/empty-state'
import { Icon, PackageIcon, RefreshCwIcon } from '@anvil/components/ui/icon'
import { Spinner } from '@anvil/components/ui/spinner'
import { ClipPlayer } from '~/components/local/ClipPlayer/ClipPlayer'
import { ClipTile } from '~/components/local/ClipTile/ClipTile'
import { clipFrame, useMomentThumb } from '~/components/clipFrame'
import { MODEL } from '~/components/ModelBadge'
import { ProvenanceButton } from '~/components/ProvenanceButton'
import { StillImage } from '~/components/StillImage'
import { KIT_LABEL, PILOT_ONLY } from '~/services/kit'
import { lowerFirst } from '~/services/shapes'
import { ofAsset, ofGeneration } from '~/services/provenance'
import { useProject } from '~/state/ProjectContext'
import { genById, kitStatus, lineage, lookFor } from '~/state/show'
import type { Asset, Generation, MotionClip, SetlistMoment } from '~/state/types'

/** One still in the kit: the image with its model, what it is, and where it came from. */
function StillAsset({ title, still, provenance }: { title: string; still: { spec: Generation['spec']; image: string }; provenance: React.ComponentProps<typeof ProvenanceButton>['provenance'] }) {
  return (
    <li className="@container flex min-w-0 flex-col gap-1.5">
      <StillImage still={still} alt={title} model={MODEL.still} className="aspect-video w-full rounded-md object-cover" />
      <div className="flex items-center justify-between gap-1">
        <span className="min-w-0 truncate type-text-xs-medium">{title}</span>
        <ProvenanceButton name={title} provenance={provenance} />
      </div>
    </li>
  )
}

/** A motion clip to pick for the player: the look's thumbnail in the song's light, and the camera move's name. */
function MotionTile({ look, song, title, selected, onClick }: { look: Generation; song: number; title: string; selected: boolean; onClick: () => void }) {
  const p = useProject()
  const thumb = useMomentThumb(look, p.brief, song, p.moments.length)
  return <ClipTile song={song} title={title} status="ready" poster={thumb} selected={selected} onClick={onClick} />
}

/**
 * The asset kit made from a moment's look, for production and content teams: stills from every angle and light state,
 * and motion variants with the other camera moves. Each asset shows its provenance; what the preview can't render is
 * listed, never faked. The main clip itself is on the Explore tab, under the look.
 */
export function AssetKit({ moment }: { moment: SetlistMoment }) {
  const p = useProject()
  const song = moment.number
  const look = lookFor(p, song)
  const kit = p.kits[song]
  const status = kitStatus(p, song)
  const built = kit ? genById(p, kit.lookId) : undefined
  const variants: { id: string; title: string; clip: MotionClip; asset: Asset }[] = (kit?.assets ?? []).flatMap((a) =>
    a.kind === 'motion' && a.clip ? [{ id: a.id, title: a.title, clip: a.clip, asset: a }] : [],
  )
  const [playing, setPlaying] = useState<string | undefined>()
  const current = variants.find((v) => v.id === playing) ?? variants[0]
  const source = built ?? look
  const frame = clipFrame(source, current?.clip, p.brief, p.moments.length)
  const poster = useMomentThumb(source, p.brief, song, p.moments.length, current?.clip.poster)

  if (!look || !source) {
    return (
      <EmptyState className="py-10">
        <EmptyStateMedia variant="icon">
          <Icon icon={PackageIcon} />
        </EmptyStateMedia>
        <EmptyStateHeader>
          <EmptyStateTitle>Generate motion for an image first</EmptyStateTitle>
          <EmptyStateDescription>The kit is made from the song’s look: other camera angles, light states and camera moves.</EmptyStateDescription>
        </EmptyStateHeader>
      </EmptyState>
    )
  }

  const of = (kind: Asset['kind']) => (kit?.assets ?? []).filter((a) => a.kind === kind)
  const left = p.kitPending[song] ?? 0

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="look-kit" className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h3 id="look-kit" className="sr-only">
            Asset kit
          </h3>
          {status === 'ready' && (
            <Badge tone="success" variant="subtle" size="xs">
              {(kit?.assets.length ?? 0) + 1} assets
            </Badge>
          )}
        </div>

        {status === 'none' && (
          <div className="flex flex-col items-start gap-3">
            <p className="text-muted-foreground type-text-sm-normal">
              Other camera angles, light states and camera moves of #{look.n}, for production and content teams. Build it once you’re happy with the look.
            </p>
            <Button disabled={p.status === 'approved'} onClick={() => void p.buildKit(song)}>
              <Icon icon={PackageIcon} />
              Build the asset kit
            </Button>
          </div>
        )}

        {status === 'stale' && built && (
          <Alert
            tone="warning"
            role="status"
            action={
              <Button size="xs" variant="outline" intent="neutral" onClick={() => void p.buildKit(song)}>
                <Icon icon={RefreshCwIcon} />
                Rebuild from #{look.n}
              </Button>
            }
          >
            <Icon icon={RefreshCwIcon} />
            <AlertTitle>This kit is from #{built.n}</AlertTitle>
            <AlertDescription>The look is now #{look.n}. Rebuild the kit so it matches what the artist will see.</AlertDescription>
          </Alert>
        )}

        {status === 'building' && (
          <p className="text-muted-foreground flex items-center gap-2 type-text-sm-normal" role="status">
            <Spinner />
            Building the kit from #{look.n}: {left} {left === 1 ? 'asset' : 'assets'} to go
          </p>
        )}

        {kit && (
          <>
            <ul className="grid grid-cols-2 gap-3 @xl:grid-cols-3">
              <StillAsset title={`The look · #${source.n}`} still={source} provenance={ofGeneration(source, lineage(p, source))} />
              {[...of('angle'), ...of('light')].map((a) =>
                a.spec ? <StillAsset key={a.id} title={`${KIT_LABEL[a.kind].replace(/s$/, '')} · ${a.title}`} still={{ spec: a.spec, image: source.image }} provenance={ofAsset(a, source)} /> : null,
              )}
            </ul>
            {current && (
              <section aria-labelledby="kit-motion" className="flex flex-col gap-3">
                <div className="flex items-center justify-between gap-2">
                  <h4 id="kit-motion" className="type-text-sm-semibold">
                    Motion variant · {current.title}
                  </h4>
                  <ProvenanceButton name={current.title} provenance={ofAsset(current.asset, source)} />
                </div>
                <ClipPlayer poster={poster} renderFrame={frame?.render} model={MODEL.motion} label={`Song ${song} · ${current.title}`} />
                <ul className="grid grid-cols-3 gap-3">
                  {variants.map((v) => (
                    <li key={v.id} className="min-w-0">
                      <MotionTile look={source} song={song} title={v.title} selected={v.id === current.id} onClick={() => setPlaying(v.id)} />
                    </li>
                  ))}
                </ul>
              </section>
            )}
            <p className="text-muted-foreground type-text-xs-normal">
              With the pilot models, every kit also gets {PILOT_ONLY.map((x) => lowerFirst(x.title)).join(' and ')}; this preview can’t render them yet.
            </p>
          </>
        )}
      </section>
    </div>
  )
}
