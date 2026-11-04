import { useState } from 'react'
import { WidgetMetricCard, WidgetMetricGroup } from '@anvil/components/agent/widget-metric-card'
import { PromptInput } from '@anvil/components/agent/prompt-input'
import { QuickReply, QuickReplyGroup } from '@anvil/components/agent/quick-reply'
import { Badge } from '@anvil/components/ui/badge'
import { Button } from '@anvil/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@anvil/components/ui/card'
import { CalendarDaysIcon, CircleCheckIcon, Icon, ListChecksIcon, SparklesIcon, TrendingUpIcon } from '@anvil/components/ui/icon'
import { Citations } from '~/components/local/Citations/Citations'
import { DeviceFrame } from '~/components/local/DeviceFrame/DeviceFrame'
import { ForecastChart } from '~/components/local/ForecastChart/ForecastChart'
import { days, peak, recommendations } from '~/data/forecast'
import { useStore } from '~/state/store'

const WHY = 'Why is Saturday, Mar 13 higher than last year?'

function answerFor(text: string) {
  if (/why|higher|last year|saturday|13/i.test(text)) {
    return {
      text: `Spring break dates line up across the largest feeder markets this year, and last year’s did not. Booking pace for Saturday, Mar 13 is also ahead, so the forecast sits ${peak.delta} points above the same day last year (source 1).`,
      ids: ['forecast'],
    }
  }
  return { text: 'I can explain what drives a day’s forecast. Try asking why a day is higher or lower than last year.', ids: [] as string[] }
}

export function ForecastScreen() {
  const { session, patch } = useStore()
  const [asked, setAsked] = useState<ReturnType<typeof answerFor> | null>(null)
  const [thinking, setThinking] = useState(false)
  const ask = (text: string) => {
    setThinking(true)
    setAsked(null)
    setTimeout(() => {
      setAsked(answerFor(text))
      setThinking(false)
    }, 700)
  }
  const open = recommendations.filter((r) => !session.decisions[r.id]).length

  return (
    <DeviceFrame kind="desktop" url="staff.greatwolf.example/forecast" className="max-lg:h-auto">
      <div className="flex min-h-0 flex-1 flex-col gap-4 overflow-auto p-5 max-lg:flex-none max-lg:overflow-visible">
        <div>
          <h1 className="type-heading-xl">Demand forecast</h1>
          <p className="type-text-sm-normal text-muted-foreground">The next 14 days, March 8 to 21. Sample data.</p>
        </div>

        <WidgetMetricGroup>
          <WidgetMetricCard label="Peak occupancy" value={`${peak.value}%`} delta={`${peak.delta} pts`} period="vs last year" trend="up" icon={TrendingUpIcon} />
          <WidgetMetricCard label="Busiest day" value={peak.label} icon={CalendarDaysIcon} />
          <WidgetMetricCard label="Actions to review" value={String(open)} icon={ListChecksIcon} />
        </WidgetMetricGroup>

        <Card size="sm">
          <CardHeader>
            <CardTitle>Forecast occupancy</CardTitle>
            <CardDescription>Spring break weekend peaks on Saturday at {peak.value}%, {peak.delta} points above last year.</CardDescription>
          </CardHeader>
          <CardContent>
            <ForecastChart days={days} highlight={5} callout={`${peak.label}: ${peak.value}%, +${peak.delta} pts`} />
          </CardContent>
        </Card>

        <section aria-labelledby="recs" className="flex flex-col gap-2">
          <h2 id="recs" className="type-text-base-semibold">Recommended actions</h2>
          <ul className="flex flex-col gap-2">
            {recommendations.map((r) => {
              const d = session.decisions[r.id]
              return (
                <li key={r.id}>
                  <Card size="sm">
                    <CardContent className="flex flex-wrap items-center gap-3">
                      <div className="flex min-w-60 flex-1 flex-col gap-0.5">
                        <p className="type-text-sm-semibold">{r.title}</p>
                        <p className="type-text-sm-normal text-muted-foreground">{r.why}</p>
                        <p className="type-text-xs-normal text-muted-foreground">{r.impact}</p>
                      </div>
                      {d ? (
                        <span className="flex items-center gap-2">
                          <Badge variant="subtle" tone={d === 'accepted' ? 'success' : 'neutral'}>{d === 'accepted' && <Icon icon={CircleCheckIcon} />}{d === 'accepted' ? 'Accepted' : 'Dismissed'}</Badge>
                          <Button variant="ghost" intent="neutral" size="sm" onClick={() => patch({ decisions: { ...session.decisions, [r.id]: undefined } })}>Undo</Button>
                        </span>
                      ) : (
                        <span className="flex gap-2">
                          <Button variant="ghost" intent="neutral" size="sm" onClick={() => patch({ decisions: { ...session.decisions, [r.id]: 'dismissed' } })}>Dismiss</Button>
                          <Button variant="outline" intent="brand" size="sm" onClick={() => patch({ decisions: { ...session.decisions, [r.id]: 'accepted' } })}>Accept</Button>
                        </span>
                      )}
                    </CardContent>
                  </Card>
                </li>
              )
            })}
          </ul>
        </section>

        <section aria-labelledby="ask" className="flex flex-col gap-2 pb-2">
          <h2 id="ask" className="type-text-base-semibold flex items-center gap-2"><Icon icon={SparklesIcon} tone="agent" />Ask the assistant</h2>
          <QuickReplyGroup>
            <QuickReply onClick={() => ask(WHY)}>{WHY}</QuickReply>
          </QuickReplyGroup>
          <PromptInput aria-label="Ask about the forecast" placeholder="Ask about the forecast" size="compact" status={thinking ? 'streaming' : 'idle'} onSubmit={ask} />
          {thinking && <p className="type-text-sm-normal text-muted-foreground" role="status">Reading the forecast…</p>}
          {asked && (
            <Card size="sm" aria-live="polite">
              <CardContent className="flex flex-col gap-2">
                <p className="type-text-sm-normal">{asked.text}</p>
                {asked.ids.length > 0 && <Citations ids={asked.ids} />}
              </CardContent>
            </Card>
          )}
        </section>
      </div>
    </DeviceFrame>
  )
}
