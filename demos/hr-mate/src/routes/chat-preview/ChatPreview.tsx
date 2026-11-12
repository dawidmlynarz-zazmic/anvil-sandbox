import { useState } from 'react'
import { Copy } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PageHeader } from '@/components/hr/PageHeader'
import { ChatCard } from '@/chat-cards/ChatCard'
import { SCENARIOS, answerCard, escalationCard, type Scenario } from '@/chat-cards/cards'
import type { CardV2 } from '@/chat-cards/types'
import { askAssistant } from '@/mocks/answers'
import { FILES } from '@/mocks/seed'
import { cn } from '@/lib/utils'

type Msg = { id: number; from: 'user' | 'bot'; text?: string; card?: CardV2 }
const ALL_FILES = FILES.map((f) => f.name)

function Thread({ scenario }: { scenario: Scenario }) {
  const [msgs, setMsgs] = useState<Msg[]>(() => [
    ...(scenario.userMessage ? [{ id: 0, from: 'user' as const, text: scenario.userMessage }] : []),
    { id: 1, from: 'bot', card: scenario.card },
  ])
  const push = (...m: Omit<Msg, 'id'>[]) => setMsgs((x) => [...x, ...m.map((y, i) => ({ ...y, id: x.length + i + 10 }))])

  const onAction = (fn: string, p: Record<string, string>) => {
    if (fn === 'ask') {
      const r = askAssistant(p.question, ALL_FILES)
      push({ from: 'user', text: p.question }, r.status === 'answered' ? { from: 'bot', card: answerCard(r.answer!, r.sources!) } : { from: 'bot', card: escalationCard })
    } else if (fn === 'contactHr') push({ from: 'bot', card: escalationCard })
    else if (fn === 'feedback') push({ from: 'bot', text: p.helpful === 'true' ? 'Thanks. Glad that helped.' : 'Thanks. I passed this to HR so the document can be improved.' })
    else if (fn === 'approve') push({ from: 'bot', text: 'Approved. Jonas Berg has been told, and Emil will hear the outcome.' })
    else if (fn === 'requestChanges') push({ from: 'bot', text: 'Changes requested. Ingrid Solberg will be asked to update the review.' })
    else if (fn === 'openLink') toast(`In Chat this opens ${p.url}`)
  }

  return (
    <div className="space-y-4 rounded-xl bg-[#f8fafd] p-4 text-[#1f1f1f]" role="log" aria-label="Chat preview">
      {msgs.map((m) =>
        m.from === 'user' ? (
          <p key={m.id} className="ml-auto w-fit max-w-[80%] rounded-2xl bg-[#d3e3fd] px-4 py-2 text-[14px]">{m.text}</p>
        ) : (
          <div key={m.id} className="flex gap-3">
            <span className="mt-1 flex size-7 shrink-0 items-center justify-center rounded-full bg-[#0b57d0] text-xs font-medium text-white" aria-hidden>H</span>
            <div className="min-w-0 flex-1 space-y-1">
              <p className="text-[12px] text-[#444746]">HR Mate · App</p>
              {m.card ? <ChatCard card={m.card} onAction={onAction} /> : <p className="text-[14px]">{m.text}</p>}
            </div>
          </div>
        ),
      )}
    </div>
  )
}

export function ChatPreview() {
  const [id, setId] = useState(SCENARIOS[0].id)
  const [n, setN] = useState(0)
  const s = SCENARIOS.find((x) => x.id === id)!
  const json = JSON.stringify({ cardsV2: [s.card] }, null, 2)
  return (
    <>
      <PageHeader title="Chat preview" description="Prototype only. Shows the cards HR Mate sends in Google Chat. The buttons work, with sample answers."
        actions={<><Button variant="outline" onClick={() => setN(n + 1)}>Replay</Button><Button onClick={() => { void navigator.clipboard?.writeText(json); toast.success('Card JSON copied') }}><Copy aria-hidden />Copy card JSON</Button></>} />
      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <nav aria-label="Cards">
          <ul className="space-y-1">
            {SCENARIOS.map((x) => (
              <li key={x.id}>
                <button type="button" aria-current={x.id === id} onClick={() => { setId(x.id); setN(0) }} className={cn('w-full rounded-md px-3 py-2 text-left', x.id === id ? 'bg-accent font-medium' : 'text-muted-foreground hover:bg-accent/50 hover:text-foreground')}>
                  {x.label}
                  <span className="text-muted-foreground block text-xs font-normal">{x.audience}</span>
                </button>
              </li>
            ))}
          </ul>
        </nav>
        <div className="min-w-0 space-y-3">
          <p className="text-muted-foreground"><span className="text-foreground font-medium">When: </span>{s.trigger}</p>
          <Tabs defaultValue="preview">
            <TabsList><TabsTrigger value="preview">Preview</TabsTrigger><TabsTrigger value="json">Cards v2 JSON</TabsTrigger></TabsList>
            <TabsContent value="preview" className="mt-3"><Thread key={`${id}-${n}`} scenario={s} /></TabsContent>
            <TabsContent value="json" className="mt-3"><pre className="bg-muted max-h-[560px] overflow-auto rounded-lg p-4 font-mono text-xs">{json}</pre></TabsContent>
          </Tabs>
        </div>
      </div>
    </>
  )
}
