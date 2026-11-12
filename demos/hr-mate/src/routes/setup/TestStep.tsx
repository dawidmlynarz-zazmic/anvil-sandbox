import { Lightbulb } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { AssistantTester } from '@/components/hr/AssistantTester'
import { useDemo } from '@/lib/demo-state'
import { StepHeader, useNextStep } from './Setup'

export function TestStep() {
  const { state, dispatch } = useDemo()
  const next = useNextStep('test')
  return (
    <>
      <StepHeader
        step="test"
        primary={
          <Button
            disabled={state.testsAsked === 0}
            onClick={() => {
              dispatch({ type: 'setStep', step: 'test', status: 'done' })
              next()
            }}
          >
            Continue to workflows
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_300px]">
        <Card>
          <CardHeader>
            <CardTitle>Ask the assistant</CardTitle>
            <CardDescription>This is the answer an employee would get in Google Chat. Every answer lists its sources.</CardDescription>
          </CardHeader>
          <CardContent>
            <AssistantTester />
          </CardContent>
        </Card>
        <aside className="space-y-3">
          <div className="bg-muted/50 border-border rounded-lg border p-4">
            <p className="mb-2 flex items-center gap-2 font-semibold">
              <Lightbulb className="text-warning size-4" aria-hidden />
              What to look for
            </p>
            <ul className="text-muted-foreground list-disc space-y-1.5 pl-4 text-[13px]">
              <li>Is the answer correct and in your tone?</li>
              <li>Does it name the right document?</li>
              <li>If it says it can't answer, is a document missing?</li>
            </ul>
          </div>
          {state.testsAsked > 0 && <p className="text-success text-[13px]">You've asked {state.testsAsked} {state.testsAsked === 1 ? 'question' : 'questions'}. You can continue when you're happy.</p>}
        </aside>
      </div>
    </>
  )
}
