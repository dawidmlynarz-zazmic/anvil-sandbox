import { useState } from 'react'
import { CheckCircle2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PageHeader } from '@/components/hr/PageHeader'
import { useDemo } from '@/lib/demo-state'
import { TIMEZONES } from '@/lib/schedule'

export function WorkspaceSettingsPage() {
  const { state, dispatch } = useDemo()
  const [d, setD] = useState(state.workspace)
  const dirty = JSON.stringify(d) !== JSON.stringify(state.workspace)
  return (
    <>
      <PageHeader title="Workspace" description="The basics HR Mate uses everywhere."
        actions={<><Button disabled={!dirty} variant="outline" onClick={() => setD(state.workspace)}>Discard changes</Button><Button disabled={!dirty || !d.name.trim()} onClick={() => { dispatch({ type: 'setWorkspace', patch: d }); toast.success('Workspace saved') }}>Save changes</Button></>} />
      <div className="max-w-2xl space-y-6">
        <Card>
          <CardHeader><CardTitle>Workspace name</CardTitle><CardDescription>Shown to employees in Chat and to your team in the admin panel.</CardDescription></CardHeader>
          <CardContent className="space-y-2"><Label htmlFor="ws-name">Display name</Label><Input id="ws-name" value={d.name} onChange={(e) => setD({ ...d, name: e.target.value })} /></CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Default timezone</CardTitle><CardDescription>New workflows start with this timezone. You can change it per workflow.</CardDescription></CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="ws-tz">Timezone</Label>
            <Select value={d.timezone} onValueChange={(t) => setD({ ...d, timezone: t })}><SelectTrigger id="ws-tz" className="w-72"><SelectValue /></SelectTrigger><SelectContent>{TIMEZONES.map((t) => <SelectItem key={t} value={t}>{t}</SelectItem>)}</SelectContent></Select>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Google Chat space</CardTitle><CardDescription>The space where HR Mate lives. Employees find it here and can message it directly.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            <p className="flex items-center gap-2">{d.chatConnected ? <><CheckCircle2 className="text-success size-4" aria-hidden /><span className="font-medium">{d.chatSpace}</span> <span className="text-muted-foreground">· Connected</span></> : <span className="text-muted-foreground">Not connected</span>}</p>
            <Button variant="outline" onClick={() => toast.success('Checked: HR Mate can post in this space')}>Check connection</Button>
          </CardContent>
        </Card>
      </div>
    </>
  )
}
