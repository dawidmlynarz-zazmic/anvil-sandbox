import { useState } from 'react'
import { Badge } from '@anvil/components/ui/badge'
import { Button } from '@anvil/components/ui/button'
import { Card, CardAction, CardContent, CardDescription, CardHeader, CardTitle } from '@anvil/components/ui/card'
import { Input } from '@anvil/components/ui/input'
import { Label } from '@anvil/components/ui/label'
import { Switch } from '@anvil/components/ui/switch'
import { KeyValueList, KeyValueRow } from '@anvil/components/anvil/key-value-row'
import { ClipPlayer } from '~/components/local/ClipPlayer/ClipPlayer'
import { clipFrame, useMomentThumb } from '~/components/clipFrame'
import { clipKey, useProject } from '~/state/ProjectContext'
import type { Generation, SetlistMoment } from '~/state/types'

/** The moment's eight-second clip of its look: play it, check its cues, change it in plain words. */
export function MotionCard({ moment, look, readOnly }: { moment: SetlistMoment; look: Generation | undefined; readOnly?: boolean }) {
  const p = useProject()
  const [compare, setCompare] = useState(false)
  const [instruction, setInstruction] = useState('')
  const slot = look ? p.clips[clipKey(look.id, moment.number)] : undefined
  const clip = slot?.status === 'ready' ? slot.clip : slot?.previous
  const frame = clipFrame(look, clip, p.brief)
  const poster = useMomentThumb(look, p.brief, moment.number, clip?.poster)
  const apply = () => {
    const text = instruction.trim()
    if (!text) return
    setInstruction('')
    void p.editClip(moment.number, text)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Motion</CardTitle>
        <CardDescription>
          {look ? `Eight seconds of #${look.n} in motion, with this song’s cues.` : 'Choose a look and its eight-second clip renders here.'}
        </CardDescription>
        {clip && frame?.other && (
          <CardAction className="flex items-center gap-2">
            <Switch id={`compare-${moment.number}`} checked={compare} onCheckedChange={setCompare} />
            <Label htmlFor={`compare-${moment.number}`}>Compare {frame.other.toLowerCase()}</Label>
          </CardAction>
        )}
      </CardHeader>
      {look && (
        <CardContent className="flex flex-col gap-4">
          {clip ? (
            <ClipPlayer
              poster={poster}
              comparePoster={clip.posterNight}
              compare={compare && !!frame?.other}
              busy={slot?.status === 'generating'}
              renderFrame={frame?.render}
              compareLabels={frame?.labels}
              label={`Song ${moment.number} · ${moment.title}, clip version ${clip.version}`}
            />
          ) : (
            <div className="bg-muted flex aspect-video items-center justify-center rounded-xl">
              <div className="flex flex-col items-center gap-3" role="status">
                <p className="text-muted-foreground type-text-sm-normal">{slot?.status === 'generating' ? 'Rendering this clip…' : 'This clip hasn’t been rendered yet.'}</p>
                {!slot && !readOnly && (
                  <Button variant="outline" intent="neutral" size="sm" onClick={() => void p.generateClip(moment.number)}>
                    Render the clip
                  </Button>
                )}
              </div>
            </div>
          )}
          <div className="grid grid-cols-1 items-start gap-6 @xl:grid-cols-2">
            {clip ? (
              <KeyValueList>
                <KeyValueRow layout="aligned" label="Lighting">{clip.cue.lighting}</KeyValueRow>
                <KeyValueRow layout="aligned" label="LED content">{clip.cue.led}</KeyValueRow>
                <KeyValueRow layout="aligned" label="Camera">{clip.cue.camera}</KeyValueRow>
                {clip.edits.length > 0 && <KeyValueRow layout="aligned" label="Edits">{clip.edits.join('; ')}</KeyValueRow>}
              </KeyValueList>
            ) : (
              <p className="text-muted-foreground type-text-sm-normal">Cues appear once the clip is rendered.</p>
            )}
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
                  hint="e.g. “slower camera move”. The rest stays the same. Edits use a preview model: confirm cover before production use."
                  placeholder="Describe the change"
                  value={instruction}
                  disabled={slot?.status !== 'ready'}
                  onChange={(e) => setInstruction(e.target.value)}
                />
                <div className="flex items-center justify-between gap-2">
                  <Badge tone="neutral" variant="outline" size="sm">
                    Gemini Omni Flash (preview)
                  </Badge>
                  <Button type="submit" variant="outline" intent="neutral" size="sm" disabled={!instruction.trim() || slot?.status !== 'ready'}>
                    Apply edit
                  </Button>
                </div>
              </form>
            )}
          </div>
        </CardContent>
      )}
    </Card>
  )
}
