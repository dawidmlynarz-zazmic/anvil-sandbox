import { useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@anvil/components/ui/alert'
import { Badge } from '@anvil/components/ui/badge'
import { Button } from '@anvil/components/ui/button'
import { EmptyState, EmptyStateDescription, EmptyStateHeader, EmptyStateMedia, EmptyStateTitle } from '@anvil/components/ui/empty-state'
import { Icon, PackageIcon, RefreshCwIcon } from '@anvil/components/ui/icon'
import { Input } from '@anvil/components/ui/input'
import { Label } from '@anvil/components/ui/label'
import { Spinner } from '@anvil/components/ui/spinner'
import { Switch } from '@anvil/components/ui/switch'
import { KeyValueList, KeyValueRow } from '@anvil/components/anvil/key-value-row'
import { ClipPlayer } from '~/components/local/ClipPlayer/ClipPlayer'
import { ClipTile } from '~/components/local/ClipTile/ClipTile'
import { clipFrame, useMomentThumb } from '~/components/clipFrame'
import { MODEL } from '~/components/ModelBadge'
import { ProvenanceButton } from '~/components/ProvenanceButton'
import { StillImage } from '~/components/StillImage'
import { KIT_LABEL, PILOT_ONLY } from '~/services/kit'
import { lowerFirst } from '~/services/shapes'
import { ofAsset, ofGeneration } from '~/services/provenance'
import { clipKey, useProject } from '~/state/ProjectContext'
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
  const thumb = useMomentThumb(look, p.brief, song)
  return <ClipTile song={song} title={title} status="ready" poster={thumb} selected={selected} onClick={onClick} />
}

/**
 * The look and what's made from it: the moment's clip (with its cues, changed in plain words), then its asset kit for
 * production and content teams. Each asset shows its provenance; what the preview can't render is listed, never faked.
 */
export function AssetKit({ moment, readOnly }: { moment: SetlistMoment; readOnly?: boolean }) {
  const p = useProject()
  const song = moment.number
  const look = lookFor(p, song)
  const kit = p.kits[song]
  const status = kitStatus(p, song)
  const built = kit ? genById(p, kit.lookId) : undefined
  const [playing, setPlaying] = useState<string>('main')
  const [compare, setCompare] = useState(false)
  const [instruction, setInstruction] = useState('')
  const slot = look ? p.clips[clipKey(look.id, song)] : undefined
  const main = slot?.status === 'ready' ? slot.clip : slot?.previous
  // Variants come from the kit, which may have been built from an earlier look; they're only offered when it matches.
  const variants = status === 'ready' ? (kit?.assets ?? []).filter((a) => a.kind === 'motion') : []
  const clips: { id: string; title: string; clip: MotionClip; asset?: Asset }[] = [
    ...(main ? [{ id: 'main', title: 'The clip', clip: main }] : []),
    ...variants.flatMap((a) => (a.clip ? [{ id: a.id, title: a.title, clip: a.clip, asset: a }] : [])),
  ]
  const current = clips.find((c) => c.id === playing) ?? clips[0]
  const isMain = current?.id === 'main'
  const frame = clipFrame(look, current?.clip, p.brief)
  const poster = useMomentThumb(look, p.brief, song, current?.clip.poster)

  if (!look) {
    return (
      <EmptyState className="py-10">
        <EmptyStateMedia variant="icon">
          <Icon icon={PackageIcon} />
        </EmptyStateMedia>
        <EmptyStateHeader>
          <EmptyStateTitle>Choose a look first</EmptyStateTitle>
          <EmptyStateDescription>Its clip and asset kit are made from it: angles, light states and motion variants.</EmptyStateDescription>
        </EmptyStateHeader>
      </EmptyState>
    )
  }

  const source = built ?? look
  const of = (kind: Asset['kind']) => (kit?.assets ?? []).filter((a) => a.kind === kind)
  const left = p.kitPending[song] ?? 0
  const apply = () => {
    const text = instruction.trim()
    if (!text) return
    setInstruction('')
    void p.editClip(song, text)
  }

  return (
    <div className="flex flex-col gap-6">
      <section aria-labelledby="look-motion" className="flex flex-col gap-3">
        <div className="flex items-center justify-between gap-2">
          <h3 id="look-motion" className="type-text-sm-semibold">
            Motion · {current?.title ?? 'The clip'}
          </h3>
          {current && isMain && frame?.other && (
            <div className="flex items-center gap-2">
              <Switch id={`compare-${song}`} checked={compare} onCheckedChange={setCompare} />
              <Label htmlFor={`compare-${song}`}>Compare {frame.other.toLowerCase()}</Label>
            </div>
          )}
          {current?.asset && <ProvenanceButton name={current.title} provenance={ofAsset(current.asset, source)} />}
        </div>
        {current ? (
          <ClipPlayer
            poster={poster}
            comparePoster={current.clip.posterNight}
            compare={isMain && compare && !!frame?.other}
            compareLabels={frame?.labels}
            busy={isMain && slot?.status === 'generating'}
            renderFrame={frame?.render}
            model={MODEL.motion}
            label={`Song ${song} · ${current.title}, clip version ${current.clip.version}`}
          />
        ) : (
          <div className="bg-muted flex aspect-video items-center justify-center rounded-xl">
            <div className="flex flex-col items-center gap-3" role="status">
              <p className="text-muted-foreground type-text-sm-normal">{slot?.status === 'generating' ? 'Rendering the clip…' : 'The clip hasn’t been rendered yet.'}</p>
              {!slot && !readOnly && (
                <Button variant="outline" intent="neutral" size="sm" onClick={() => void p.generateClip(song)}>
                  Render the clip
                </Button>
              )}
            </div>
          </div>
        )}
        {clips.length > 1 && (
          <ul className="grid grid-cols-3 gap-3">
            {clips.map((c) => (
              <li key={c.id} className="min-w-0">
                <MotionTile look={look} song={song} title={c.title} selected={c.id === current?.id} onClick={() => setPlaying(c.id)} />
              </li>
            ))}
          </ul>
        )}
        {isMain && main && (
          <div className="grid grid-cols-1 items-start gap-6 @xl:grid-cols-2">
            <KeyValueList>
              <KeyValueRow layout="aligned" label="Lighting">{main.cue.lighting}</KeyValueRow>
              <KeyValueRow layout="aligned" label="LED content">{main.cue.led}</KeyValueRow>
              <KeyValueRow layout="aligned" label="Camera">{main.cue.camera}</KeyValueRow>
              {main.edits.length > 0 && <KeyValueRow layout="aligned" label="Edits">{main.edits.join('; ')}</KeyValueRow>}
            </KeyValueList>
            {!readOnly && (
              <form
                className="flex flex-col gap-2"
                onSubmit={(e) => {
                  e.preventDefault()
                  apply()
                }}
              >
                <Input
                  label="Change the clip in plain words"
                  hint="e.g. “slower camera move”. Edits use Gemini Omni Flash (preview)."
                  placeholder="Describe the change"
                  value={instruction}
                  disabled={slot?.status !== 'ready'}
                  onChange={(e) => setInstruction(e.target.value)}
                />
                <Button type="submit" variant="outline" intent="neutral" size="sm" className="self-end" disabled={!instruction.trim() || slot?.status !== 'ready'}>
                  Apply edit
                </Button>
              </form>
            )}
          </div>
        )}
      </section>

      <section aria-labelledby="look-kit" className="flex flex-col gap-3">
        <div className="flex items-center gap-2">
          <h3 id="look-kit" className="type-text-sm-semibold">
            Asset kit
          </h3>
          {status === 'ready' && (
            <Badge tone="success" variant="subtle" size="xs">
              {(kit?.assets.length ?? 0) + 1} assets
            </Badge>
          )}
        </div>

        {status === 'none' && (
          <p className="text-muted-foreground type-text-sm-normal">
            Angles, light states and motion variants of #{look.n}, for production and content teams. Build it when the look is settled.
          </p>
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
            <p className="text-muted-foreground type-text-xs-normal">
              With the pilot models, every kit also gets {PILOT_ONLY.map((x) => lowerFirst(x.title)).join(' and ')}; this preview can’t render them yet.
            </p>
          </>
        )}
      </section>
    </div>
  )
}
