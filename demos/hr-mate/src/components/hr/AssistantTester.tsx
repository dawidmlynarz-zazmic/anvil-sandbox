import { useRef, useState } from 'react'
import { BookOpen, FileText, Loader2, Send, Settings2, Sparkles } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { useDemo } from '@/lib/demo-state'
import { askAssistant, SUGGESTED_QUESTIONS, type TestResult } from '@/mocks/answers'

type Entry = { id: number; result?: TestResult; question: string }

/** The "Test a question" panel. Answers come from a small mock bank, and only when the cited files exist. */
export function AssistantTester({ onAsked }: { onAsked?: () => void }) {
  const { state, dispatch } = useDemo()
  const [entries, setEntries] = useState<Entry[]>([])
  const [text, setText] = useState('')
  const next = useRef(1)
  const available = state.files.filter((f) => f.status === 'indexed').map((f) => f.name)

  const ask = (q: string) => {
    const question = q.trim()
    if (!question) return
    const id = next.current++
    setEntries((e) => [...e, { id, question }])
    setText('')
    setTimeout(() => {
      const result = askAssistant(question, available)
      setEntries((e) => e.map((x) => (x.id === id ? { ...x, result } : x)))
      dispatch({ type: 'testAsked' })
      onAsked?.()
    }, 900)
  }

  return (
    <div className="flex h-full flex-col gap-4">
      {entries.length === 0 ? (
        <div className="text-muted-foreground flex-1 text-[13px]">
          <p>
            Ask what an employee would ask. {available.length === 0 ? "You haven't added any documents yet, so the assistant will say it can't answer." : `The assistant reads ${available.length} ${available.length === 1 ? 'document' : 'documents'}.`}
          </p>
        </div>
      ) : (
        <ol className="flex-1 space-y-4" aria-live="polite">
          {entries.map((e) => (
            <li key={e.id} className="space-y-2">
              <p className="bg-secondary ml-auto w-fit max-w-[85%] rounded-lg px-3 py-2">{e.question}</p>
              {!e.result ? (
                <p className="text-muted-foreground flex items-center gap-2 text-[13px]">
                  <Loader2 className="size-4 animate-spin" aria-hidden /> Looking through your documents…
                </p>
              ) : e.result.status === 'answered' ? (
                <div className="bg-card border-border space-y-3 rounded-lg border p-3">
                  <p className="flex items-center gap-2 text-xs font-medium">
                    <Sparkles className="text-primary size-3.5" aria-hidden /> HR Mate
                  </p>
                  <p>{e.result.answer}</p>
                  <div>
                    <p className="text-muted-foreground mb-1 text-xs font-medium">Sources</p>
                    <ul className="flex flex-wrap gap-1.5">
                      {e.result.sources?.map((s) => (
                        <li key={s} className="bg-muted flex items-center gap-1.5 rounded-md px-2 py-1 text-xs">
                          <FileText className="size-3.5" aria-hidden />
                          {s}
                        </li>
                      ))}
                    </ul>
                  </div>
                  <FixHint />
                </div>
              ) : (
                <div className="bg-card border-border space-y-2 rounded-lg border p-3">
                  <p className="flex items-center gap-2 text-xs font-medium">
                    <Sparkles className="text-primary size-3.5" aria-hidden /> HR Mate
                  </p>
                  <p>I couldn't find that in your documents, so I won't guess. I'd send this person to HR.</p>
                  {e.result.missing && (
                    <p className="text-muted-foreground text-[13px]">To answer this, add: {e.result.missing.join(' or ')}.</p>
                  )}
                  <FixHint />
                </div>
              )}
            </li>
          ))}
        </ol>
      )}
      <div className="space-y-3">
        <div className="flex flex-wrap gap-1.5">
          {SUGGESTED_QUESTIONS.map((q) => (
            <Button key={q} variant="outline" size="sm" className="h-auto py-1 text-[13px] font-normal" onClick={() => ask(q)}>
              {q}
            </Button>
          ))}
        </div>
        <form
          className="flex gap-2"
          onSubmit={(e) => {
            e.preventDefault()
            ask(text)
          }}
        >
          <label htmlFor="tester-q" className="sr-only">
            Your question
          </label>
          <Input id="tester-q" value={text} onChange={(e) => setText(e.target.value)} placeholder="Ask a question, like an employee would" />
          <Button type="submit" variant="secondary" disabled={!text.trim()}>
            <Send aria-hidden />
            Ask
          </Button>
        </form>
      </div>
    </div>
  )
}

function FixHint() {
  return (
    <p className="text-muted-foreground border-t pt-2 text-xs">
      Not right? Fix it by{' '}
      <Link to="/knowledge" className="text-primary inline-flex items-center gap-1 underline underline-offset-2">
        <BookOpen className="size-3" aria-hidden />
        updating the document
      </Link>{' '}
      or by{' '}
      <Link to="/settings/assistant" className="text-primary inline-flex items-center gap-1 underline underline-offset-2">
        <Settings2 className="size-3" aria-hidden />
        changing assistant instructions
      </Link>
      .
    </p>
  )
}
