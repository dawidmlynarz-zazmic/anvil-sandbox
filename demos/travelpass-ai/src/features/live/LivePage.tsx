import { useNavigate } from 'react-router-dom'
import { QuickReply, QuickReplyGroup } from '@anvil/components/agent/quick-reply'
import { Alert, AlertDescription } from '@anvil/components/ui/alert'
import { Badge } from '@anvil/components/ui/badge'
import { Button } from '@anvil/components/ui/button'
import { InfoIcon } from '@anvil/components/ui/icon'
import { ScrollArea } from '@anvil/components/ui/scroll-area'
import { LiveOrb, type LiveState } from '~/components/local/LiveOrb/LiveOrb'
import { tripReady } from '~/lib/search'
import { useStore } from '~/state/store'
import { PageHeading } from '../hotels/PageHeading'

const PHRASES = ['Hotels in Cinque Terre, May 12 to 17 for two', 'Only hotels with a pool', 'Show me photos of the area', 'Open the first hotel']

/**
 * Live Mode is the same conversation by voice. The preview has no microphone: a pick of phrases stands in for speech,
 * and the transcript is the chat thread.
 */
export function LivePage() {
  const { session, setLive, send, busy } = useStore()
  const navigate = useNavigate()
  const state: LiveState = session.live === 'listening' ? 'listening' : session.live === 'muted' ? 'muted' : 'idle'
  const recent = session.turns.slice(-6)
  const end = () => {
    setLive('off')
    navigate(tripReady(session.trip) ? '/hotels' : '/')
  }
  return (
    <div className="flex flex-col gap-5">
      <PageHeading crumbs={[{ label: 'Home', to: '/' }, { label: 'Live Mode' }]} title="Live Mode" subtitle="Talk instead of typing. The page follows what you say.">
        <div className="flex items-center gap-2">
          <Badge tone={state === 'listening' ? 'agent' : 'neutral'} variant="subtle" indicator>{state === 'listening' ? 'Listening' : state === 'muted' ? 'Muted' : 'Ready'}</Badge>
          <Button variant="outline" intent="neutral" size="sm" onClick={end}>End Live Mode</Button>
        </div>
      </PageHeading>
      <Alert tone="info">
        <InfoIcon />
        <AlertDescription>This preview has no microphone and records nothing. Pick a phrase to “say” it. The real app asks for microphone access first, then shows your voice level and a live transcript.</AlertDescription>
      </Alert>
      <div className="grid items-start gap-6 lg:grid-cols-[auto_1fr]">
        <LiveOrb state={state} onToggle={() => setLive(state === 'listening' ? 'muted' : 'listening')} className="mx-auto" />
        <div className="flex flex-col gap-4">
          {state === 'listening' ? (
            <QuickReplyGroup label="Say something">
              {PHRASES.map((p) => <QuickReply key={p} disabled={busy} icon={null} onClick={() => void send(p)}>{p}</QuickReply>)}
            </QuickReplyGroup>
          ) : (
            <p className="type-text-sm-normal text-muted-foreground">Start listening to begin.</p>
          )}
          <section aria-labelledby="transcript-h" className="flex flex-col gap-2">
            <h2 id="transcript-h" className="type-text-sm-semibold">Transcript</h2>
            <ScrollArea className="h-56 rounded-lg border">
              <ul role="log" aria-live="polite" className="flex flex-col gap-2 p-3 type-text-sm-normal">
                {recent.length === 0 && <li className="text-muted-foreground">Nothing said yet.</li>}
                {recent.map((t) => (
                  <li key={t.id}><strong>{t.role === 'user' ? 'You' : 'TravelPass AI'}:</strong> {t.text}</li>
                ))}
              </ul>
            </ScrollArea>
          </section>
        </div>
      </div>
    </div>
  )
}
