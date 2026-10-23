import { useState } from 'react'
import { Button } from '@anvil/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@anvil/components/ui/card'
import { Input } from '@anvil/components/ui/input'
import { Label } from '@anvil/components/ui/label'
import { Switch } from '@anvil/components/ui/switch'
import { KeyValueList, KeyValueRow } from '@anvil/components/anvil/key-value-row'
import { ClipPlayer } from '~/components/local/ClipPlayer/ClipPlayer'
import { clipFrame, useMomentThumb } from '~/components/clipFrame'
import { MODEL } from '~/components/ModelBadge'
import { clipKey, useProject } from '~/state/ProjectContext'
import type { Generation, SetlistMoment } from '~/state/types'

/**
 * The look in motion: the moment's eight-second clip, first on the moment page once a look is chosen. Play it, compare
 * it in other light, read its cues, change it in plain words.
 */
export function LookMotion({ moment, look, readOnly }: { moment: SetlistMoment; look: Generation; readOnly?: boolean }) {
  const p = useProject()
  const song = moment.number
  const [compare, setCompare] = useState(false)
  const [instruction, setInstruction] = useState('')
  const slot = p.clips[clipKey(look.id, song)]
  const clip = slot?.status === 'ready' ? slot.clip : slot?.previous
  const frame = clipFrame(look, clip, p.brief, p.moments.length)
  const poster = useMomentThumb(look, p.brief, song, p.moments.length, clip?.poster)
  const apply = () => {
    const text = instruction.trim()
    if (!text) return
    setInstruction('')
    void p.editClip(song, text)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>#{look.n} in motion</CardTitle>
        <CardDescription>The look for this moment, as an eight-second clip with the song’s cues.</CardDescription>
        {clip && frame?.other && (
          <CardAction className="flex items-center gap-2">
            <Switch id={`compare-${song}`} checked={compare} onCheckedChange={setCompare} />
            <Label htmlFor={`compare-${song}`}>Compare {frame.other.toLowerCase()}</Label>
          </CardAction>
        )}
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        {clip ? (
          <ClipPlayer
            poster={poster}
            comparePoster={clip.posterNight}
            compare={compare && !!frame?.other}
            compareLabels={frame?.labels}
            busy={slot?.status === 'generating'}
            renderFrame={frame?.render}
            model={MODEL.motion}
            label={`Song ${song} · ${moment.title}, clip version ${clip.version}`}
          />
        ) : (
          <div className="bg-muted flex aspect-video items-center justify-center rounded-xl">
            <div className="flex flex-col items-center gap-3" role="status">
              <p className="text-muted-foreground type-text-sm-normal">{slot?.status === 'generating' ? 'Putting it into motion…' : 'The clip hasn’t been rendered yet.'}</p>
              {!slot && !readOnly && (
                <Button variant="outline" intent="neutral" size="sm" onClick={() => void p.generateClip(song)}>
                  Render the clip
                </Button>
              )}
            </div>
          </div>
        )}
        {clip && (
          <div className="grid grid-cols-1 items-start gap-6 @xl:grid-cols-2">
            <KeyValueList>
              <KeyValueRow layout="aligned" label="Lighting">{clip.cue.lighting}</KeyValueRow>
              <KeyValueRow layout="aligned" label="LED content">{clip.cue.led}</KeyValueRow>
              <KeyValueRow layout="aligned" label="Camera">{clip.cue.camera}</KeyValueRow>
              {clip.edits.length > 0 && <KeyValueRow layout="aligned" label="Edits">{clip.edits.join('; ')}</KeyValueRow>}
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
      </CardContent>
    </Card>
  )
}
