import { ArrowRight, BookOpen, Check, ChevronDown, MessageCircleQuestion, Sparkles, Workflow } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { ONBOARDING } from '@/copy/onboarding'
import { SETUP_STEPS, setupDoneCount, useDemo } from '@/lib/demo-state'
import { cn } from '@/lib/utils'

const INTRO = [
  { icon: MessageCircleQuestion, title: 'Answers in Google Chat', body: 'Employees ask HR questions and get answers with sources from your documents.' },
  { icon: Workflow, title: 'Runs HR routines', body: 'Onboarding messages, trial reviews and reminders go out on time without chasing.' },
  { icon: Sparkles, title: 'Tells you what needs you', body: 'Failed sends, approvals and unanswered questions land on one page.' },
]

export function SetupChecklist() {
  const { state, dispatch } = useDemo()
  const done = setupDoneCount(state)
  const firstTodo = SETUP_STEPS.find((k) => state.setup[k] === 'todo') ?? 'directory'
  const collapsed = state.setupCollapsed
  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-semibold">{ONBOARDING.intro.title}</h1>
        <p className="text-muted-foreground mt-1 max-w-2xl">{ONBOARDING.intro.body}</p>
      </div>
      <div className="grid gap-4 md:grid-cols-3">
        {INTRO.map((i) => (
          <div key={i.title} className="bg-card border-border rounded-lg border p-4">
            <i.icon className="text-primary mb-2 size-5" aria-hidden />
            <p className="font-semibold">{i.title}</p>
            <p className="text-muted-foreground mt-1 text-[13px]">{i.body}</p>
          </div>
        ))}
      </div>
      <Card>
        <CardHeader className="gap-3">
          <div className="flex flex-wrap items-center justify-between gap-3">
            <div>
              <CardTitle className="text-base">Set up HR Mate</CardTitle>
              <CardDescription>
                {done} of {SETUP_STEPS.length} done. The checklist stays here until you finish it.
              </CardDescription>
            </div>
            <div className="flex items-center gap-2">
              <Button variant="outline" onClick={() => dispatch({ type: 'toggleSetupCollapsed' })} aria-expanded={!collapsed}>
                <ChevronDown className={cn('transition-transform', collapsed && '-rotate-90')} aria-hidden />
                {collapsed ? 'Show steps' : 'Hide steps'}
              </Button>
              <Button asChild>
                <Link to={`/setup/${firstTodo}`}>
                  {done === 0 ? 'Start setup' : 'Continue setup'}
                  <ArrowRight aria-hidden />
                </Link>
              </Button>
            </div>
          </div>
          <Progress value={(done / SETUP_STEPS.length) * 100} aria-label={`${done} of ${SETUP_STEPS.length} steps done`} />
        </CardHeader>
        {!collapsed && (
          <CardContent>
            <ol className="divide-y">
              {SETUP_STEPS.map((k, i) => {
                const s = ONBOARDING.steps[k]
                const status = state.setup[k]
                return (
                  <li key={k} className="flex items-start gap-4 py-4 first:pt-0 last:pb-0">
                    <span className={cn('mt-0.5 flex size-6 shrink-0 items-center justify-center rounded-full text-xs font-medium', status === 'done' ? 'bg-success text-success-foreground' : 'bg-muted')}>
                      {status === 'done' ? <Check className="size-3.5" aria-label="Done" /> : i + 1}
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="flex flex-wrap items-center gap-2 font-semibold">
                        {s.title}
                        {status === 'skipped' && <Badge variant="outline">Skipped</Badge>}
                        <span className="text-muted-foreground text-xs font-normal">{s.time}</span>
                      </p>
                      <p className="text-muted-foreground mt-0.5 text-[13px]">{s.why}</p>
                    </div>
                    <Button asChild variant={status === 'todo' ? 'secondary' : 'ghost'} size="sm">
                      <Link to={`/setup/${k}`}>{status === 'done' ? 'Review' : status === 'skipped' ? 'Do it now' : 'Start'}</Link>
                    </Button>
                  </li>
                )
              })}
            </ol>
          </CardContent>
        )}
      </Card>
      <p className="text-muted-foreground flex items-center gap-2 text-[13px]">
        <BookOpen className="size-4" aria-hidden />
        Want to look around first? Open the demo controls in the sidebar to switch to an established workspace.
      </p>
    </div>
  )
}
