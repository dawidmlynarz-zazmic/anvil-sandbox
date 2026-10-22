import { useEffect, useState } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { Badge } from '@anvil/components/ui/badge'
import { Button } from '@anvil/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@anvil/components/ui/card'
import { EmptyState, EmptyStateDescription, EmptyStateHeader, EmptyStateMedia, EmptyStateTitle } from '@anvil/components/ui/empty-state'
import { ClapperboardIcon, Icon, SparklesIcon } from '@anvil/components/ui/icon'
import { Input } from '@anvil/components/ui/input'
import { Label } from '@anvil/components/ui/label'
import { Switch } from '@anvil/components/ui/switch'
import { Tabs, TabsList, TabsTrigger } from '@anvil/components/ui/tabs'
import { KeyValueList, KeyValueRow } from '@anvil/components/anvil/key-value-row'
import { ClipPlayer } from '~/components/local/ClipPlayer/ClipPlayer'
import { MomentTile } from '~/components/MomentTile'
import { STEP_CONTENT } from '~/components/layout'
import { StepFooter } from '~/components/StepFooter'
import { clipFrame, useMomentThumb } from '~/components/clipFrame'
import { IllustrativeNote } from '~/components/IllustrativeNote'
import { clipKey, useProject } from '~/state/ProjectContext'
import { SendDialog } from './SendDialog'

export function MotionPage() {
  const navigate = useNavigate()
  const [params, setParams] = useSearchParams()
  const { brief, rounds, motionStills, clips, status, meta, generateClip, editClip, sendToArtist, setMotionFocus, path } = useProject()
  const moments = brief.moments
  const [selected, setSelected] = useState(() => (moments.some((m) => m.number === 14) ? 14 : (moments[0]?.number ?? 0)))
  const [compareNight, setCompareNight] = useState(false)
  const [instruction, setInstruction] = useState('')

  const allStills = rounds.flatMap((r) => r.stills)
  const concept = motionStills.includes(params.get('concept') ?? '') ? params.get('concept')! : motionStills[0]
  const still = allStills.find((s) => s.id === concept)
  const song = moments.find((m) => m.number === selected) ?? moments[0]
  const slot = concept && song ? clips[clipKey(concept, song.number)] : undefined
  const clip = slot?.status === 'ready' ? slot.clip : slot?.previous
  const frame = clipFrame(still, clip, brief)
  // Under the live 3D frame (while it loads), show the same stage's 3D still, never the old 2D poster.
  const playerPoster = useMomentThumb(still, brief, song?.number ?? 0, clip?.poster)
  const readyCount = motionStills.reduce(
    (n, id) => n + moments.filter((m) => clips[clipKey(id, m.number)]?.status === 'ready').length,
    0,
  )
  const rendering = motionStills.reduce(
    (n, id) => n + moments.filter((m) => clips[clipKey(id, m.number)]?.status === 'generating').length,
    0,
  )

  // Tell the chat which clip is open, so "slower camera move" typed there edits this one.
  useEffect(() => {
    if (concept && song) setMotionFocus(concept, song.number)
  }, [concept, song, setMotionFocus])

  if (!still || !song) {
    return (
      <div className="flex h-full items-center justify-center p-6">
        <EmptyState>
          <EmptyStateMedia variant="icon">
            <Icon icon={ClapperboardIcon} />
          </EmptyStateMedia>
          <EmptyStateHeader>
            <EmptyStateTitle>Nothing in motion yet</EmptyStateTitle>
            <EmptyStateDescription>
              {moments.length
                ? 'Here each key moment from the brief becomes an eight-second clip of your chosen concept. Select concepts in Stills and put them into motion.'
                : 'Add key moments to the brief first: each one becomes an eight-second clip here.'}
            </EmptyStateDescription>
          </EmptyStateHeader>
          <Button variant="outline" intent="neutral" onClick={() => navigate(path(rounds.length && moments.length ? 'stills' : 'brief'))}>
            {rounds.length && moments.length ? 'Go to stills' : 'Go to the brief'}
          </Button>
        </EmptyState>
      </div>
    )
  }

  const apply = () => {
    const text = instruction.trim()
    if (!text) return
    setInstruction('')
    void editClip(still.id, song.number, text)
  }

  const send = (note: string) => {
    sendToArtist(note || undefined)
    navigate(path('review'))
  }
  // Exactly what the artist will get: each concept in motion, its version, and its ready clips.
  const sendItems = motionStills.flatMap((id) => {
    const st = allStills.find((x) => x.id === id)
    if (!st) return []
    const ready = moments.flatMap((m) => {
      const c = clips[clipKey(id, m.number)]
      return c?.status === 'ready' ? [{ song: m.number, title: m.title, version: c.clip.version }] : []
    })
    return [{ title: st.title, version: st.version ?? 1, clips: ready }]
  })

  const sent = status === 'awaiting-artist' || status === 'feedback' || status === 'approved'

  return (
    <section aria-labelledby="motion-title" className="flex h-full flex-col">
      <div className="step-scroll relative min-h-0 flex-1 overflow-y-auto p-6">
        <div className={`${STEP_CONTENT} gap-6`}>
          <div className="flex flex-col gap-2">
            <div className="flex items-center gap-3">
              <h1 id="motion-title" tabIndex={-1} className="type-heading-2xl outline-none">
                Motion storyboard · {still.title}
              </h1>
              <Badge tone="agent" variant="subtle">
                Veo 3.1 · 8 s
              </Badge>
            </div>
            {motionStills.length > 1 && (
              <Tabs value={still.id} onValueChange={(id) => setParams({ concept: id })}>
                <TabsList aria-label="Concepts in motion">
                  {motionStills.map((id) => (
                    <TabsTrigger key={id} value={id}>
                      {allStills.find((x) => x.id === id)?.title ?? id}
                    </TabsTrigger>
                  ))}
                </TabsList>
              </Tabs>
            )}
            <p className="text-muted-foreground max-w-2xl type-text-sm-normal">
              Each key moment from the brief gets an eight-second clip of this concept. Pick one to preview it, check
              its lighting and camera cues, and describe any change in plain words, here or in the chat.
            </p>
            <IllustrativeNote kind="motion" />
          </div>

          <div className="flex flex-col gap-6">
            <div className="flex min-w-0 flex-col gap-3">
              <div className="flex items-center justify-between gap-3">
                <h2 className="type-text-base-semibold">
                  Song {song.number} · {song.title}
                  {clip && clip.version > 1 && <span className="text-muted-foreground type-text-sm-normal"> · clip v{clip.version}</span>}
                </h2>
                {(!frame || frame.other) && (
                  <div className="flex items-center gap-2">
                    <Switch id="compare-night" checked={compareNight} onCheckedChange={setCompareNight} />
                    <Label htmlFor="compare-night">Compare {frame?.other ? frame.other.toLowerCase() : 'night'}</Label>
                  </div>
                )}
              </div>
              {clip ? (
                <ClipPlayer
                  poster={playerPoster}
                  comparePoster={clip.posterNight}
                  compare={compareNight && (!frame || !!frame.other)}
                  busy={slot?.status === 'generating'}
                  renderFrame={frame?.render}
                  compareLabels={frame?.labels}
                  label={`Song ${song.number} · ${song.title}, clip version ${clip.version}`}
                />
              ) : (
                <div className="bg-muted flex aspect-video items-center justify-center rounded-xl text-center">
                  <div className="flex flex-col items-center gap-3 p-6">
                    <p className="text-muted-foreground type-text-sm-normal">
                      {slot?.status === 'generating' ? 'Rendering this clip…' : 'This clip hasn’t been rendered yet.'}
                    </p>
                    {!slot && (
                      <Button onClick={() => void generateClip(still.id, song.number)}>
                        <Icon icon={SparklesIcon} />
                        Render song {song.number}
                      </Button>
                    )}
                  </div>
                </div>
              )}
              {compareNight && (!frame || frame.other) && (
                <p className="text-muted-foreground type-text-xs-normal">
                  Left: {frame ? frame.labels[0].toLowerCase() : 'golden hour'}. Right: the same shot at {frame ? frame.labels[1].toLowerCase() : 'night'}.
                </p>
              )}
            </div>

            <Card>
              <CardHeader>
                <CardTitle>Cues for song {song.number}</CardTitle>
                <CardDescription>{song.intent}</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 items-start gap-6 @xl:grid-cols-2">
                {clip ? (
                  <KeyValueList>
                    <KeyValueRow layout="aligned" label="Lighting">{clip.cue.lighting}</KeyValueRow>
                    <KeyValueRow layout="aligned" label="LED content">{clip.cue.led}</KeyValueRow>
                    <KeyValueRow layout="aligned" label="Camera">{clip.cue.camera}</KeyValueRow>
                    {clip.edits.length > 0 && <KeyValueRow layout="aligned" label="Your edits">{clip.edits.join('; ')}</KeyValueRow>}
                  </KeyValueList>
                ) : (
                  <p className="text-muted-foreground type-text-sm-normal">Cues appear once this clip is rendered.</p>
                )}
                <form
                  className="flex flex-col gap-2"
                  onSubmit={(e) => {
                    e.preventDefault()
                    apply()
                  }}
                >
                  <Input
                    label="Edit in plain words"
                    hint="e.g. “slower camera move”. The rest of the clip stays the same. Edits use a preview model: confirm cover before production use."
                    placeholder="Describe the change"
                    value={instruction}
                    disabled={slot?.status !== 'ready'}
                    onChange={(e) => setInstruction(e.target.value)}
                  />
                  <div className="flex items-center justify-between gap-2">
                    <Badge tone="neutral" variant="outline" size="sm">
                      Gemini Omni Flash (preview)
                    </Badge>
                    <Button type="submit" size="sm" disabled={!instruction.trim() || slot?.status !== 'ready'}>
                      Apply edit
                    </Button>
                  </div>
                </form>
              </CardContent>
            </Card>
          </div>

          <section aria-labelledby="moments-title" className="flex flex-col gap-3">
            <h2 id="moments-title" className="type-text-base-semibold">
              Key moments
            </h2>
            <ul className="grid grid-cols-2 gap-3 @xl:grid-cols-4">
              {moments.map((m) => {
                const c = clips[clipKey(still.id, m.number)]
                const poster = c?.status === 'ready' ? c.clip.poster : c?.status === 'generating' ? c.previous?.poster : undefined
                return (
                  <li key={m.number} className="min-w-0">
                    <MomentTile
                      still={still}
                      brief={brief}
                      song={m.number}
                      title={m.title}
                      status={c ? (c.status === 'ready' ? 'ready' : 'generating') : 'not-started'}
                      poster={poster}
                      selected={song.number === m.number}
                      onClick={() => setSelected(m.number)}
                    />
                  </li>
                )
              })}
            </ul>
          </section>
          <p className="sr-only" aria-live="polite">
            {rendering ? `${rendering} clip${rendering === 1 ? '' : 's'} rendering` : `${readyCount} ${readyCount === 1 ? 'clip' : 'clips'} ready`}
          </p>
        </div>
      </div>
      <StepFooter
        note={sent ? 'Already sent. Sending again shares the latest clips as a new version.' : 'The artist sees your concepts and clips together, and comments on both.'}
        status={`${readyCount} ${readyCount === 1 ? 'clip' : 'clips'} ready${rendering ? ` · ${rendering} rendering` : ''}`}
      >
        <SendDialog
          artist={meta.artist}
          items={sendItems}
          label={sent ? 'Send new version to artist' : 'Send to artist for review'}
          disabled={readyCount === 0 || status === 'awaiting-artist'}
          onSend={send}
        />
      </StepFooter>
    </section>
  )
}
