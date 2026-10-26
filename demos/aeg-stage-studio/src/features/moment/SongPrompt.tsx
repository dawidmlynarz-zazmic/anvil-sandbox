import { useState } from 'react'
import { PromptInput } from '@anvil/components/agent/prompt-input'
import { QuickReply, QuickReplyGroup } from '@anvil/components/agent/quick-reply'
import { Button } from '@anvil/components/ui/button'
import { Icon, SparklesIcon } from '@anvil/components/ui/icon'
import { momentLight } from '~/services/light'
import { useProject } from '~/state/ProjectContext'
import { TIME_LABEL, type SetlistMoment } from '~/state/types'

/**
 * A song with no images yet: describe the stage you imagine and the agent makes four images from it. Suggestions fill
 * the field so they can be edited before generating; "explore" skips the description altogether.
 */
export function SongPrompt({ moment, disabled }: { moment: SetlistMoment; disabled?: boolean }) {
  const p = useProject()
  const [value, setValue] = useState('')
  const song = moment.number
  const light = TIME_LABEL[momentLight(p.brief, song, p.moments.length)].toLowerCase()
  const keywords = p.brief.keywords.slice(0, 3).join(', ').toLowerCase()
  const suggestions = [
    moment.intent && moment.intent !== 'No direction yet' ? moment.intent : '',
    ...(p.set ? ['Warmer, more haze', 'Cool light, brighter'] : ['A floating halo in warm haze', 'An arch around a monolith, gold light']),
    keywords,
  ].filter(Boolean)
  const generate = (text: string) => {
    const prompt = text.trim()
    if (!prompt) return
    setValue('')
    void p.explore(song, 'directions', undefined, prompt)
  }

  return (
    <section aria-labelledby="song-prompt-title" className="border-border flex flex-col gap-4 rounded-xl border border-dashed p-6">
      <div className="flex flex-col gap-1">
        <h2 id="song-prompt-title" className="type-text-base-semibold">
          What should “{moment.title}” look like?
        </h2>
        <p className="text-muted-foreground type-text-sm-normal">
          Describe the stage in your own words. The agent makes four images from it, lit for {light}
          {p.set ? ', on the locked stage set' : ''}.
        </p>
      </div>
      <PromptInput
        value={value}
        onValueChange={setValue}
        onSubmit={generate}
        placeholder={p.set ? 'e.g. Warmer, with heavy haze and a brighter wall' : 'e.g. A monolith rising out of warm haze, gold light'}
        status={disabled ? 'streaming' : 'idle'}
      />
      <div className="flex flex-col gap-2">
        <span className="text-muted-foreground type-text-xs-normal">Or start from a suggestion</span>
        <QuickReplyGroup>
          {suggestions.map((s) => (
            <QuickReply key={s} icon={null} disabled={disabled} onClick={() => setValue(s)}>
              {s}
            </QuickReply>
          ))}
        </QuickReplyGroup>
      </div>
      <Button variant="ghost" intent="neutral" size="sm" className="-ms-2 self-start" disabled={disabled} onClick={() => void p.explore(song, 'directions')}>
        <Icon icon={SparklesIcon} />
        {p.set ? 'Just explore four looks' : 'Just explore four directions'}
      </Button>
    </section>
  )
}
