import { Button } from '@anvil/components/ui/button'
import { Icon, MicIcon, MicOffIcon } from '@anvil/components/ui/icon'
import { VoiceWaveform } from '@anvil/components/agent/voice-waveform'
import { cn } from '@anvil/lib/utils'

// ANVIL-CANDIDATE: the voice control for a live conversation: a ring that shows the state, the waveform while
// listening, and the mic button. Closest Anvil option checked: Voice Waveform (just the bars) and Prompt Input's
// voice button (inline in the composer). See docs/anvil-upgrade-candidates.md.

export type LiveState = 'idle' | 'listening' | 'muted'

export function LiveOrb({ state, onToggle, className }: { state: LiveState; onToggle: () => void; className?: string }) {
  const listening = state === 'listening'
  return (
    <div className={cn('flex flex-col items-center gap-4 p-3', className)}>
      <div
        className={cn(
          'relative grid size-40 place-items-center rounded-full border-2 bg-card transition-colors',
          listening ? 'border-agent shadow-[0_0_0_10px_var(--agent-subtle)]' : 'border-border',
        )}
      >
        {listening ? <VoiceWaveform label="Listening" /> : <Icon icon={MicOffIcon} className="size-8 text-muted-foreground" label={state === 'muted' ? 'Muted' : 'Not listening'} />}
      </div>
      <Button variant={listening ? 'outline' : 'default'} intent={listening ? 'neutral' : 'brand'} onClick={onToggle}>
        <Icon icon={listening ? MicOffIcon : MicIcon} />
        {listening ? 'Mute' : state === 'muted' ? 'Unmute' : 'Start listening'}
      </Button>
    </div>
  )
}
