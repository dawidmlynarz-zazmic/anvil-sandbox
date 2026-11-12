import { useEffect, useState } from 'react'
import { CheckCircle2, Loader2, ShieldCheck } from 'lucide-react'
import { Link } from 'react-router-dom'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Progress } from '@/components/ui/progress'
import { MappingTable } from '@/components/hr/MappingTable'
import { useDemo } from '@/lib/demo-state'
import { relTime } from '@/lib/dates'
import { cn } from '@/lib/utils'
import type { IntegrationId } from '@/mocks/types'
import { StepHeader, useNextStep } from './Setup'

type Phase = 'choose' | 'consent' | 'syncing' | 'mapping' | 'done'
const SYNC_LABELS = ['Connecting to the directory…', 'Reading employees…', 'Reading managers, departments and dates…', 'Checking which fields were found…']

export function DirectoryStep() {
  const { state, dispatch, employees } = useDemo()
  const next = useNextStep('directory')
  const connected = state.integrations.find((i) => i.status !== 'not_connected')
  const [choice, setChoice] = useState<IntegrationId | null>(null)
  const [phase, setPhase] = useState<Phase>(connected ? 'done' : 'choose')
  const [progress, setProgress] = useState(0)
  const integ = state.integrations.find((i) => i.id === (choice ?? connected?.id))

  useEffect(() => {
    if (phase !== 'syncing') return
    setProgress(0)
    const t = setInterval(() => setProgress((p) => Math.min(100, p + 4)), 120)
    return () => clearInterval(t)
  }, [phase])
  useEffect(() => {
    if (phase === 'syncing' && progress >= 100) setPhase('mapping')
  }, [progress, phase])

  const missing = integ?.mapping.filter((m) => !m.source && !m.chosen).length ?? 0

  let primary
  if (phase === 'choose')
    primary = (
      <Button disabled={!choice} onClick={() => setPhase('consent')}>
        Connect {choice ? state.integrations.find((i) => i.id === choice)!.name : 'directory'}
      </Button>
    )
  else if (phase === 'consent')
    primary = <Button onClick={() => setPhase('syncing')}>Allow access</Button>
  else if (phase === 'syncing')
    primary = (
      <Button disabled>
        <Loader2 className="animate-spin" aria-hidden />
        Syncing…
      </Button>
    )
  else if (phase === 'mapping')
    primary = (
      <Button
        onClick={() => {
          dispatch({ type: 'connect', id: integ!.id })
          dispatch({ type: 'setStep', step: 'directory', status: 'done' })
          setPhase('done')
        }}
      >
        Confirm field mapping
      </Button>
    )
  else
    primary = (
      <Button
        onClick={() => {
          dispatch({ type: 'setStep', step: 'directory', status: 'done' })
          next()
        }}
      >
        Continue to knowledge
      </Button>
    )

  return (
    <>
      <StepHeader step="directory" primary={primary} secondary={phase === 'consent' || phase === 'mapping' ? <Button variant="outline" onClick={() => setPhase(phase === 'consent' ? 'choose' : 'consent')}>Back</Button> : undefined} />

      {phase === 'choose' && (
        <fieldset>
          <legend className="mb-3 text-base font-semibold">Where do you keep your employee records?</legend>
          <div className="grid gap-4 md:grid-cols-2">
            {state.integrations.map((i) => (
              <label key={i.id} className={cn('bg-card flex cursor-pointer flex-col gap-3 rounded-lg border p-5 transition-colors has-[:focus-visible]:ring-2 has-[:focus-visible]:ring-ring', choice === i.id ? 'border-primary ring-primary/40 ring-2' : 'border-border hover:bg-accent/40')}>
                <input type="radio" name="directory" value={i.id} checked={choice === i.id} onChange={() => setChoice(i.id)} className="sr-only" />
                <span className="flex items-center justify-between">
                  <span className="text-base font-semibold">{i.name}</span>
                  {choice === i.id && <CheckCircle2 className="text-primary size-5" aria-label="Selected" />}
                </span>
                <span className="text-muted-foreground">{i.blurb}</span>
                <span className="text-xs font-medium">What HR Mate gets from it</span>
                <ul className="text-muted-foreground list-disc space-y-1 pl-4 text-[13px]">
                  {i.provides.map((p) => (
                    <li key={p}>{p}</li>
                  ))}
                </ul>
                {i.id === 'zoho' && <span className="text-success text-xs font-medium">Recommended: it has start dates and statuses that workflows need.</span>}
              </label>
            ))}
          </div>
        </fieldset>
      )}

      {phase === 'consent' && integ && (
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="size-5" aria-hidden />
              Sign in with {integ.name}
            </CardTitle>
            <CardDescription>Prototype only: nothing is sent anywhere and no real sign-in happens.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <p>HR Mate would like to:</p>
            <ul className="list-disc space-y-1 pl-5">
              {integ.provides.map((p) => (
                <li key={p}>Read: {p.toLowerCase()}</li>
              ))}
            </ul>
            <p className="text-muted-foreground text-[13px]">HR Mate only reads data. It never changes anything in {integ.name}. You can disconnect at any time in Connections.</p>
          </CardContent>
        </Card>
      )}

      {phase === 'syncing' && integ && (
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle>Syncing {integ.name}</CardTitle>
            <CardDescription>This usually takes under a minute.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-3" role="status">
            <Progress value={progress} aria-label="Sync progress" />
            <p className="text-muted-foreground text-[13px]">{SYNC_LABELS[Math.min(SYNC_LABELS.length - 1, Math.floor(progress / 26))]}</p>
          </CardContent>
        </Card>
      )}

      {phase === 'mapping' && integ && (
        <div className="space-y-4">
          <Alert variant={missing ? 'default' : 'default'}>
            <CheckCircle2 aria-hidden />
            <AlertTitle>
              Found {integ.mapping.length - integ.mapping.filter((m) => !m.source).length} of {integ.mapping.length} fields
            </AlertTitle>
            <AlertDescription>
              {missing
                ? `${missing} ${missing === 1 ? 'field is' : 'fields are'} missing. You can map ${missing === 1 ? 'it' : 'them'} to another field now, or continue and fix it later in Connections. Workflows that need a missing field will skip those people.`
                : 'Everything HR Mate needs was found.'}
            </AlertDescription>
          </Alert>
          <Card className="py-0">
            <MappingTable integration={integ} onChoose={(field, chosen) => dispatch({ type: 'resolveMapping', id: integ.id, field, chosen })} />
          </Card>
        </div>
      )}

      {phase === 'done' && integ && (
        <Card className="max-w-lg">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <CheckCircle2 className="text-success size-5" aria-hidden />
              {employees.length} employees synced
            </CardTitle>
            <CardDescription>
              {integ.name} · last sync {integ.lastSync ? relTime(integ.lastSync) : 'just now'}
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {integ.status === 'attention' && <p className="text-warning text-[13px]">{integ.problem}</p>}
            <p className="text-muted-foreground text-[13px]">
              HR Mate keeps the directory in sync every few hours. See field mapping and sync history in{' '}
              <Link to="/connections" className="text-primary underline underline-offset-2">
                Connections
              </Link>
              .
            </p>
          </CardContent>
        </Card>
      )}
    </>
  )
}
