import { useState } from 'react'
import { ArrowDown, ArrowUp, ChevronDown, Plus, Trash2 } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Textarea } from '@/components/ui/textarea'
import { PageHeader } from '@/components/hr/PageHeader'
import { useDemo } from '@/lib/demo-state'
import type { AssistantSettings } from '@/mocks/types'

const AUDIENCES = ['Everyone', 'New hires', 'Managers', 'HR team']

export function AssistantSettingsPage() {
  const { state, dispatch } = useDemo()
  const [d, setD] = useState<AssistantSettings>(state.assistant)
  const dirty = JSON.stringify(d) !== JSON.stringify(state.assistant)
  const setLink = (id: string, patch: Partial<AssistantSettings['quickLinks'][number]>) => setD({ ...d, quickLinks: d.quickLinks.map((l) => (l.id === id ? { ...l, ...patch } : l)) })
  const move = (i: number, dir: -1 | 1) => {
    const l = [...d.quickLinks]
    ;[l[i], l[i + dir]] = [l[i + dir], l[i]]
    setD({ ...d, quickLinks: l })
  }
  return (
    <>
      <PageHeader title="Assistant" description="How HR Mate introduces itself, who it hands over to and which links it offers."
        actions={<>{dirty && <Button variant="outline" onClick={() => setD(state.assistant)}>Discard changes</Button>}<Button disabled={!dirty} onClick={() => { dispatch({ type: 'setAssistant', patch: d }); toast.success('Assistant settings saved') }}>Save changes</Button></>} />
      <div className="max-w-3xl space-y-6">
        <Card>
          <CardHeader><CardTitle>Greeting</CardTitle><CardDescription>The first message people see when they open a chat with HR Mate.</CardDescription></CardHeader>
          <CardContent className="space-y-2">
            <Label htmlFor="greet">Greeting message</Label>
            <Textarea id="greet" rows={4} value={d.greeting} onChange={(e) => setD({ ...d, greeting: e.target.value })} />
            <p className="text-muted-foreground text-xs">{'{{first_name}}'} is replaced with the person's first name.</p>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Escalation contact</CardTitle><CardDescription>Where HR Mate sends people when it can't answer or when they ask for a human.</CardDescription></CardHeader>
          <CardContent className="space-y-4">
            <RadioGroup value={d.escalationKind} onValueChange={(v) => setD({ ...d, escalationKind: v as 'email' | 'space' })} className="flex gap-6">
              <div className="flex items-center gap-2"><RadioGroupItem value="email" id="esc-email" /><Label htmlFor="esc-email">Email address</Label></div>
              <div className="flex items-center gap-2"><RadioGroupItem value="space" id="esc-space" /><Label htmlFor="esc-space">Google Chat space</Label></div>
            </RadioGroup>
            <div className="space-y-2">
              <Label htmlFor="esc-target">{d.escalationKind === 'email' ? 'HR email' : 'Chat space name'}</Label>
              <Input id="esc-target" value={d.escalationTarget} onChange={(e) => setD({ ...d, escalationTarget: e.target.value })} placeholder={d.escalationKind === 'email' ? 'hr@yourcompany.com' : 'HR questions'} aria-invalid={!d.escalationTarget} />
              {!d.escalationTarget && <p className="text-warning text-xs">Add a contact so people aren't left without a next step.</p>}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><CardTitle>Quick links</CardTitle><CardDescription>Shortcuts the assistant offers in Chat. Order matters: the first ones are shown first.</CardDescription></CardHeader>
          <CardContent className="space-y-3">
            {d.quickLinks.length === 0 && <p className="text-muted-foreground">No links yet. Add the pages people ask for most, like leave requests.</p>}
            <ul className="space-y-3">
              {d.quickLinks.map((l, i) => (
                <li key={l.id} className="grid items-end gap-2 md:grid-cols-[1fr_1.5fr_130px_auto]">
                  <div className="space-y-1"><Label htmlFor={`t-${l.id}`} className="text-xs">Title</Label><Input id={`t-${l.id}`} value={l.title} onChange={(e) => setLink(l.id, { title: e.target.value })} /></div>
                  <div className="space-y-1"><Label htmlFor={`u-${l.id}`} className="text-xs">Address</Label><Input id={`u-${l.id}`} value={l.url} onChange={(e) => setLink(l.id, { url: e.target.value })} /></div>
                  <div className="space-y-1">
                    <Label htmlFor={`a-${l.id}`} className="text-xs">Shown to</Label>
                    <Select value={l.audience} onValueChange={(a) => setLink(l.id, { audience: a })}><SelectTrigger id={`a-${l.id}`} className="w-full"><SelectValue /></SelectTrigger><SelectContent>{AUDIENCES.map((a) => <SelectItem key={a} value={a}>{a}</SelectItem>)}</SelectContent></Select>
                  </div>
                  <div className="flex">
                    <Button variant="ghost" size="icon" aria-label={`Move ${l.title} up`} disabled={i === 0} onClick={() => move(i, -1)}><ArrowUp /></Button>
                    <Button variant="ghost" size="icon" aria-label={`Move ${l.title} down`} disabled={i === d.quickLinks.length - 1} onClick={() => move(i, 1)}><ArrowDown /></Button>
                    <Button variant="ghost" size="icon" aria-label={`Remove ${l.title}`} onClick={() => setD({ ...d, quickLinks: d.quickLinks.filter((x) => x.id !== l.id) })}><Trash2 /></Button>
                  </div>
                </li>
              ))}
            </ul>
            <Button variant="outline" onClick={() => setD({ ...d, quickLinks: [...d.quickLinks, { id: `ql-${Date.now()}`, title: '', url: 'https://', audience: 'Everyone' }] })}><Plus aria-hidden />Add a link</Button>
          </CardContent>
        </Card>
        <Collapsible className="bg-card rounded-lg border">
          <CollapsibleTrigger asChild>
            <Button variant="ghost" className="group h-auto w-full justify-between px-6 py-4 text-left">
              <span><span className="block text-base font-semibold">Additional instructions</span><span className="text-muted-foreground block text-[13px] font-normal">Advanced. Most teams never need this.</span></span>
              <ChevronDown className="transition-transform group-data-[state=open]:rotate-180" aria-hidden />
            </Button>
          </CollapsibleTrigger>
          <CollapsibleContent className="space-y-2 px-6 pb-6">
            <p className="text-muted-foreground text-[13px]">Use this for tone and rules that apply to every answer, like language or topics to avoid. Don't paste policies here: add them as documents in Knowledge so answers show their sources.</p>
            <Label htmlFor="add-instr" className="sr-only">Additional instructions</Label>
            <Textarea id="add-instr" rows={5} value={d.additionalInstructions} onChange={(e) => setD({ ...d, additionalInstructions: e.target.value })} />
          </CollapsibleContent>
        </Collapsible>
      </div>
    </>
  )
}
