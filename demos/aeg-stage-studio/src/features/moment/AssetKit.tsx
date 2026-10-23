import { useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@anvil/components/ui/alert'
import { Button } from '@anvil/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@anvil/components/ui/card'
import { EmptyState, EmptyStateDescription, EmptyStateHeader, EmptyStateMedia, EmptyStateTitle } from '@anvil/components/ui/empty-state'
import { Icon, PackageIcon, RefreshCwIcon } from '@anvil/components/ui/icon'
import { Spinner } from '@anvil/components/ui/spinner'
import { CheckRow } from '@anvil/components/anvil/check-row'
import { ClipPlayer } from '~/components/local/ClipPlayer/ClipPlayer'
import { ClipTile } from '~/components/local/ClipTile/ClipTile'
import { clipFrame, useMomentThumb } from '~/components/clipFrame'
import { ProvenanceButton } from '~/components/ProvenanceButton'
import { StillImage } from '~/components/StillImage'
import { KIT_LABEL, PILOT_ONLY } from '~/services/kit'
import { ofAsset, ofGeneration } from '~/services/provenance'
import { clipKey, useProject } from '~/state/ProjectContext'
import { genById, kitStatus, lineage, lookFor } from '~/state/show'
import type { Asset, Generation, MotionClip, SetlistMoment } from '~/state/types'

/** One still in the kit: the image, what it is, and where it came from. */
function StillAsset({ title, still, provenance }: { title: string; still: { spec: Generation['spec']; image: string }; provenance: React.ComponentProps<typeof ProvenanceButton>['provenance'] }) {
  return (
    <li className="@container flex min-w-0 flex-col gap-1.5">
      <StillImage still={still} alt={title} className="aspect-video w-full rounded-md object-cover" />
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
  const thumb = useMomentThumb(look, p.brief, song)
  return <ClipTile song={song} title={title} status="ready" poster={thumb} selected={selected} onClick={onClick} />
}

/**
 * A moment's asset kit: everything production and content teams build from, made from the look. Each asset shows its
 * provenance. What the preview can't render is listed as coming with the pilot, never faked.
 */
export function AssetKit({ moment }: { moment: SetlistMoment }) {
  const p = useProject()
  const song = moment.number
  const look = lookFor(p, song)
  const kit = p.kits[song]
  const status = kitStatus(p, song)
  const built = kit ? genById(p, kit.lookId) : undefined
  const [playing, setPlaying] = useState<string>('main')
  // The kit shows what it was built from; before it's built, the current look.
  const source = built ?? look
  const mainSlot = source ? p.clips[clipKey(source.id, song)] : undefined
  const main = mainSlot?.status === 'ready' ? mainSlot.clip : undefined
  const motion = (kit?.assets ?? []).filter((a) => a.kind === 'motion')
  const clips: { id: string; title: string; clip: MotionClip; asset?: Asset }[] = [
    ...(main ? [{ id: 'main', title: 'The clip', clip: main }] : []),
    ...motion.flatMap((a) => (a.clip ? [{ id: a.id, title: a.title, clip: a.clip, asset: a }] : [])),
  ]
  const current = clips.find((c) => c.id === playing) ?? clips[0]
  const frame = clipFrame(source, current?.clip, p.brief)
  const poster = useMomentThumb(source, p.brief, song, current?.clip.poster)

  if (!look || !source) {
    return (
      <EmptyState className="py-10">
        <EmptyStateMedia variant="icon">
          <Icon icon={PackageIcon} />
        </EmptyStateMedia>
        <EmptyStateHeader>
          <EmptyStateTitle>Choose a look first</EmptyStateTitle>
          <EmptyStateDescription>The asset kit is made from this moment’s look: its angles, light states and motion variants.</EmptyStateDescription>
        </EmptyStateHeader>
      </EmptyState>
    )
  }

  const of = (kind: Asset['kind']) => (kit?.assets ?? []).filter((a) => a.kind === kind)
  const left = p.kitPending[song] ?? 0

  return (
    <div className="flex flex-col gap-5">
      {status === 'none' && (
        <Card>
          <CardHeader>
            <CardTitle>Asset kit for #{look.n}</CardTitle>
            <CardDescription>
              What production and content teams build from, made from this moment’s look. Every asset keeps the look exactly as chosen, and shows where it came from.
            </CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-1.5">
            <CheckRow status="pending">Angles: the look from every other camera position</CheckRow>
            <CheckRow status="pending">Light states: the look in the light it might meet on the night</CheckRow>
            <CheckRow status="pending">Motion variants: the clip with the other camera moves</CheckRow>
          </CardContent>
        </Card>
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
          <section aria-labelledby="kit-stills" className="flex flex-col gap-3">
            <h3 id="kit-stills" className="type-text-sm-semibold">
              Stills
            </h3>
            <ul className="grid grid-cols-2 gap-3 @xl:grid-cols-3">
              <StillAsset title={`The look · #${source.n}`} still={source} provenance={ofGeneration(source, lineage(p, source))} />
              {[...of('angle'), ...of('light')].map((a) =>
                a.spec ? <StillAsset key={a.id} title={`${KIT_LABEL[a.kind].replace(/s$/, '')} · ${a.title}`} still={{ spec: a.spec, image: source.image }} provenance={ofAsset(a, source)} /> : null,
              )}
            </ul>
          </section>

          {clips.length > 0 && current && (
            <section aria-labelledby="kit-motion" className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <h3 id="kit-motion" className="type-text-sm-semibold">
                  Motion · {current.title}
                </h3>
                {current.asset && <ProvenanceButton name={current.title} provenance={ofAsset(current.asset, source)} />}
              </div>
              <ClipPlayer poster={poster} renderFrame={frame?.render} label={`Song ${song} · ${current.title}`} />
              <ul className="grid grid-cols-3 gap-3">
                {clips.map((c) => (
                  <li key={c.id} className="min-w-0">
                    <MotionTile look={source} song={song} title={c.title} selected={c.id === current.id} onClick={() => setPlaying(c.id)} />
                  </li>
                ))}
              </ul>
            </section>
          )}

          <section aria-labelledby="kit-pilot" className="flex flex-col gap-2">
            <h3 id="kit-pilot" className="type-text-sm-semibold">
              With the pilot models
            </h3>
            <p className="text-muted-foreground type-text-xs-normal">This preview can’t render these yet; in the pilot they’re part of every kit.</p>
            {PILOT_ONLY.map((x) => (
              <CheckRow key={x.title} status="pending">
                <span className="type-text-sm-medium">{x.title}</span>
                <span className="text-muted-foreground type-text-xs-normal"> · {x.detail}</span>
              </CheckRow>
            ))}
          </section>
        </>
      )}
    </div>
  )
}
