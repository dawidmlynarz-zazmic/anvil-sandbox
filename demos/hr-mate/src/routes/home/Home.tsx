import { useEffect } from 'react'
import { AlertTriangle, ArrowRight, Cake, CheckCircle2, ClipboardCheck, LogOut, MessageCircleQuestion, PartyPopper, UserPlus } from 'lucide-react'
import { Link, useLocation } from 'react-router-dom'
import { Bar, BarChart, Cell, LabelList, XAxis, YAxis } from 'recharts'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { ChartContainer, ChartTooltip, ChartTooltipContent, type ChartConfig } from '@/components/ui/chart'
import { EmptyState } from '@/components/hr/EmptyState'
import { PageHeader } from '@/components/hr/PageHeader'
import { RelDate } from '@/components/hr/RelDate'
import { TONE_TEXT } from '@/components/hr/Pill'
import { ONBOARDING } from '@/copy/onboarding'
import { useAttention } from '@/lib/attention'
import { NOW, diffDays, parseDay, plural } from '@/lib/dates'
import { setupComplete, useDemo } from '@/lib/demo-state'
import { STATUS_LABEL } from '@/lib/audience'
import { DEPARTMENTS } from '@/mocks/seed'
import { SetupChecklist } from './SetupChecklist'

export function Home() {
  const { state, dispatch } = useDemo()
  const { hash } = useLocation()
  useEffect(() => {
    if (hash) setTimeout(() => document.getElementById(hash.slice(1))?.scrollIntoView(), 50)
  }, [hash])

  if (!setupComplete(state)) return <SetupChecklist />
  if (!state.setupSeen)
    return (
      <div className="mx-auto max-w-lg pt-10">
        <EmptyState
          icon={PartyPopper}
          title={ONBOARDING.allDone.title}
          action={<Button onClick={() => dispatch({ type: 'finishSetup' })}>{ONBOARDING.allDone.action}</Button>}
        >
          {ONBOARDING.allDone.body}
        </EmptyState>
      </div>
    )
  return <Dashboard />
}

const dateLong = new Intl.DateTimeFormat('en-GB', { weekday: 'long', day: 'numeric', month: 'long' })

function Dashboard() {
  const { state, dispatch, employees } = useDemo()
  const attention = useAttention()
  const count = (s: string) => employees.filter((e) => e.status === s).length
  const newHires = employees.filter((e) => {
    const d = parseDay(e.startDate)
    return d.getMonth() === NOW.getMonth() && d.getFullYear() === NOW.getFullYear()
  }).length

  const week = employees
    .flatMap((e) => {
      const out: { id: string; date: string; icon: typeof UserPlus; text: string }[] = []
      const inWeek = (d: string) => diffDays(NOW, parseDay(d)) >= 0 && diffDays(NOW, parseDay(d)) <= 7
      if (inWeek(e.startDate) && e.status === 'trial') out.push({ id: `${e.id}-s`, date: e.startDate, icon: UserPlus, text: `${e.name} starts as ${e.role.toLowerCase()}` })
      if (e.trialEndDate && inWeek(e.trialEndDate)) out.push({ id: `${e.id}-t`, date: e.trialEndDate, icon: ClipboardCheck, text: `${e.name}'s trial ends` })
      const start = parseDay(e.startDate)
      const ann = new Date(NOW.getFullYear(), start.getMonth(), start.getDate(), 12)
      if (NOW.getFullYear() - start.getFullYear() >= 1 && diffDays(NOW, ann) >= 0 && diffDays(NOW, ann) <= 7)
        out.push({ id: `${e.id}-a`, date: ann.toISOString(), icon: Cake, text: `${e.name} reaches ${NOW.getFullYear() - start.getFullYear()} years` })
      return out
    })
    .sort((a, b) => a.date.localeCompare(b.date))

  const answered = state.questions.filter((q) => q.answer || q.resolved).length
  const total = state.questions.length
  const unanswered = state.questions.filter((q) => !q.answer && !q.resolved)
  const topics = Object.entries(unanswered.reduce<Record<string, number>>((m, q) => ({ ...m, [q.topic]: (m[q.topic] ?? 0) + 1 }), {})).sort((a, b) => b[1] - a[1])

  const statusData = (['active', 'trial', 'bench', 'inactive'] as const).map((s, i) => ({ name: STATUS_LABEL[s], value: count(s), fill: `var(--chart-${i + 1})` }))
  const deptData = DEPARTMENTS.map((d) => ({ name: d, value: employees.filter((e) => e.department === d && e.status !== 'inactive').length })).sort((a, b) => b.value - a.value)
  const cfg: ChartConfig = { value: { label: 'People' } }

  return (
    <>
      <PageHeader
        title="Home"
        description={`${dateLong.format(NOW)} · ${state.workspace.name}`}
        actions={
          <Button asChild>
            <Link to="/automations/workflows/new">Create workflow</Link>
          </Button>
        }
      />

      <section aria-label="Key numbers" className="mb-6 grid grid-cols-2 gap-4 lg:grid-cols-4">
        {[
          { label: 'Active headcount', value: count('active'), note: `${employees.length} people in the directory` },
          { label: 'On trial', value: count('trial'), note: 'Includes upcoming new hires' },
          { label: 'On bench', value: count('bench'), note: 'Waiting for a project' },
          { label: 'New hires this month', value: newHires, note: 'Started or starting in ' + new Intl.DateTimeFormat('en-GB', { month: 'long' }).format(NOW) },
        ].map((k) => (
          <Card key={k.label} className="gap-1 py-4">
            <CardHeader className="px-5">
              <CardDescription>{k.label}</CardDescription>
              <CardTitle className="num text-2xl font-semibold">{k.value}</CardTitle>
            </CardHeader>
            <CardContent className="text-muted-foreground px-5 text-xs">{k.note}</CardContent>
          </Card>
        ))}
      </section>

      <div className="grid gap-6 lg:grid-cols-[3fr_2fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <AlertTriangle className="text-warning size-4" aria-hidden />
                Needs attention
              </CardTitle>
              <CardDescription>{attention.length ? `${plural(attention.length, 'thing')} to look at.` : 'Failed runs, approvals and sync problems appear here.'}</CardDescription>
            </CardHeader>
            <CardContent>
              {attention.length === 0 ? (
                <p className="text-success flex items-center gap-2">
                  <CheckCircle2 className="size-4" aria-hidden /> Nothing needs your attention. Nice.
                </p>
              ) : (
                <ul className="divide-y">
                  {attention.map((a) => (
                    <li key={a.id} className="flex items-center gap-4 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0 flex-1">
                        <p className={`font-medium ${TONE_TEXT[a.tone === 'destructive' ? 'danger' : a.tone]}`}>{a.title}</p>
                        <p className="text-muted-foreground text-[13px]">{a.detail}</p>
                      </div>
                      <Button asChild variant="outline" size="sm">
                        <Link to={a.action.to}>{a.action.label}</Link>
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card id="approvals" className="scroll-mt-4">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <ClipboardCheck className="size-4" aria-hidden />
                Waiting for your approval
              </CardTitle>
              <CardDescription>Trial reviews that managers have filled in.</CardDescription>
            </CardHeader>
            <CardContent>
              {state.approvals.length === 0 ? (
                <p className="text-muted-foreground">No approvals waiting.</p>
              ) : (
                <ul className="divide-y">
                  {state.approvals.map((a) => (
                    <li key={a.id} className="flex flex-wrap items-center gap-3 py-3 first:pt-0 last:pb-0">
                      <div className="min-w-0 flex-1">
                        <p className="font-medium">{a.title}</p>
                        <p className="text-muted-foreground text-[13px]">
                          {a.summary} Due <RelDate value={a.dueAt} />.
                        </p>
                      </div>
                      <Button variant="outline" size="sm" onClick={() => { dispatch({ type: 'resolveApproval', id: a.id }); toast('Changes requested. The manager will be asked to update the review.') }}>
                        Request changes
                      </Button>
                      <Button size="sm" onClick={() => { dispatch({ type: 'resolveApproval', id: a.id }); toast.success(`Approved: ${a.title.replace('Trial review: ', '')} continues after the trial`) }}>
                        Approve review
                      </Button>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">This week</CardTitle>
              <CardDescription>New hires, trial reviews and anniversaries in the next 7 days.</CardDescription>
            </CardHeader>
            <CardContent>
              {week.length === 0 ? (
                <p className="text-muted-foreground">Nothing scheduled this week.</p>
              ) : (
                <ul className="divide-y">
                  {week.map((w) => (
                    <li key={w.id} className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0">
                      <w.icon className="text-muted-foreground size-4 shrink-0" aria-hidden />
                      <span className="flex-1">{w.text}</span>
                      <RelDate value={w.date.slice(0, 10)} className="text-muted-foreground text-[13px]" />
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-base">
                <MessageCircleQuestion className="size-4" aria-hidden />
                Assistant this week
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="num text-2xl font-semibold">{answered}</p>
                  <p className="text-muted-foreground text-xs">questions answered</p>
                </div>
                <div>
                  <p className="num text-2xl font-semibold">{total ? Math.round((answered / total) * 100) : 0}%</p>
                  <p className="text-muted-foreground text-xs">answered without HR</p>
                </div>
              </div>
              <div>
                <p className="mb-2 text-xs font-medium">Top unanswered topics</p>
                {topics.length === 0 ? (
                  <p className="text-muted-foreground text-[13px]">Every question had an answer.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {topics.slice(0, 4).map(([t, n]) => (
                      <li key={t} className="flex justify-between text-[13px]">
                        <span>{t}</span>
                        <span className="text-muted-foreground">{plural(n, 'question')}</span>
                      </li>
                    ))}
                  </ul>
                )}
                {topics.length > 0 && (
                  <Button asChild variant="link" className="mt-2 h-auto p-0">
                    <Link to="/knowledge">
                      Add documents for these <ArrowRight aria-hidden />
                    </Link>
                  </Button>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Headcount by status</CardTitle>
            </CardHeader>
            <CardContent>
              {employees.length === 0 ? (
                <EmptyState icon={LogOut} title="No people yet">Connect your directory to see headcount.</EmptyState>
              ) : (
                <ChartContainer config={cfg} className="h-40 w-full">
                  <BarChart data={statusData} layout="vertical" margin={{ left: 0, right: 28 }}>
                    <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={72} />
                    <XAxis type="number" hide />
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Bar dataKey="value" radius={4}>
                      {statusData.map((d) => (
                        <Cell key={d.name} fill={d.fill} />
                      ))}
                      <LabelList dataKey="value" position="right" className="fill-foreground" fontSize={12} />
                    </Bar>
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="text-base">Headcount by department</CardTitle>
              <CardDescription>Without people who have left.</CardDescription>
            </CardHeader>
            <CardContent>
              {employees.length > 0 && (
                <ChartContainer config={cfg} className="h-56 w-full">
                  <BarChart data={deptData} layout="vertical" margin={{ left: 0, right: 28 }}>
                    <YAxis dataKey="name" type="category" tickLine={false} axisLine={false} width={92} />
                    <XAxis type="number" hide />
                    <ChartTooltip content={<ChartTooltipContent hideLabel />} />
                    <Bar dataKey="value" fill="var(--chart-2)" radius={4}>
                      <LabelList dataKey="value" position="right" className="fill-foreground" fontSize={12} />
                    </Bar>
                  </BarChart>
                </ChartContainer>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  )
}
