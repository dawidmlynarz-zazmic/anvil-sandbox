import { useState } from 'react'
import { UserPlus, X } from 'lucide-react'
import { toast } from 'sonner'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader } from '@/components/hr/PageHeader'
import { Pill } from '@/components/hr/Pill'
import { RelDate } from '@/components/hr/RelDate'
import { ROLES } from '@/copy/onboarding'
import { NOW } from '@/lib/dates'
import { useDemo } from '@/lib/demo-state'
import type { TeamRole } from '@/mocks/types'

const CHANGEABLE: TeamRole[] = ['admin', 'hr_manager', 'viewer']

function InviteDialog() {
  const { dispatch } = useDemo()
  const [open, setOpen] = useState(false)
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<TeamRole>('hr_manager')
  const ok = /^\S+@\S+\.\S+$/.test(email)
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><UserPlus aria-hidden />Invite teammate</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader><DialogTitle>Invite a teammate</DialogTitle><DialogDescription>They get an email with a link to join. No email is really sent in this prototype.</DialogDescription></DialogHeader>
        <DialogBody>
          <div className="space-y-2"><Label htmlFor="i-email">Work email</Label><Input id="i-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} /></div>
          <div className="space-y-2">
            <Label htmlFor="i-role">Role</Label>
            <Select value={role} onValueChange={(r) => setRole(r as TeamRole)}><SelectTrigger id="i-role" className="w-full"><SelectValue /></SelectTrigger><SelectContent>{CHANGEABLE.map((r) => <SelectItem key={r} value={r}>{ROLES[r].label}</SelectItem>)}</SelectContent></Select>
            <p className="text-muted-foreground text-[13px]">{ROLES[role].can}</p>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button disabled={!ok} onClick={() => { dispatch({ type: 'invite', invite: { id: `inv-${Date.now()}`, email, role, sentAt: NOW.toISOString() } }); toast.success(`Invite sent to ${email}`); setEmail(''); setOpen(false) }}>Send invite</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function TeamSettings() {
  const { state, dispatch } = useDemo()
  return (
    <>
      <PageHeader title="Team & roles" description="Who can use the admin panel, and what each person can change." actions={<InviteDialog />} />
      <p className="bg-muted text-muted-foreground mb-4 rounded-md px-3 py-2 text-[13px]">You're the owner, so you can change roles and remove people. Admins can invite people but can't change other roles.</p>
      <div className="space-y-8">
        <div className="border-border rounded-lg border">
          <Table>
            <TableHeader><TableRow><TableHead>Person</TableHead><TableHead>Role</TableHead><TableHead>Last active</TableHead><TableHead><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader>
            <TableBody>
              {state.team.map((m) => (
                <TableRow key={m.id} className="h-12">
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-7"><AvatarFallback className="bg-secondary text-[11px]">{m.initials}</AvatarFallback></Avatar>
                      <div><p className="font-medium">{m.name}</p><p className="text-muted-foreground text-xs">{m.email}</p></div>
                    </div>
                  </TableCell>
                  <TableCell>
                    {m.role === 'owner' ? <Pill tone="info">Owner</Pill> : (
                      <Select value={m.role} onValueChange={(r) => { dispatch({ type: 'setRole', id: m.id, role: r as TeamRole }); toast.success(`${m.name} is now ${ROLES[r].label}`) }}>
                        <SelectTrigger size="sm" className="w-36" aria-label={`Role for ${m.name}`}><SelectValue /></SelectTrigger>
                        <SelectContent>{CHANGEABLE.map((r) => <SelectItem key={r} value={r}>{ROLES[r].label}</SelectItem>)}</SelectContent>
                      </Select>
                    )}
                  </TableCell>
                  <TableCell><RelDate value={m.lastActive} time className="text-muted-foreground" /></TableCell>
                  <TableCell className="text-right">
                    {m.role !== 'owner' && (
                      <AlertDialog>
                        <AlertDialogTrigger asChild><Button variant="ghost" size="sm">Remove</Button></AlertDialogTrigger>
                        <AlertDialogContent>
                          <AlertDialogHeader><AlertDialogTitle>Remove {m.name}?</AlertDialogTitle><AlertDialogDescription>They lose access to the admin panel right away. Workflows they created keep running. You can invite them again later.</AlertDialogDescription></AlertDialogHeader>
                          <AlertDialogFooter><AlertDialogCancel>Keep {m.name}</AlertDialogCancel><AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={() => { dispatch({ type: 'removeMember', id: m.id }); toast.success(`${m.name} removed`) }}>Remove {m.name}</AlertDialogAction></AlertDialogFooter>
                        </AlertDialogContent>
                      </AlertDialog>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
        {state.invites.length > 0 && (
          <section>
            <h2 className="mb-2 text-base font-semibold">Pending invites</h2>
            <ul className="border-border divide-y rounded-lg border">
              {state.invites.map((i) => (
                <li key={i.id} className="flex items-center gap-3 px-4 py-2.5">
                  <span className="flex-1">{i.email}</span>
                  <span className="text-muted-foreground text-[13px]">{ROLES[i.role].label} · sent <RelDate value={i.sentAt} time /></span>
                  <Button variant="ghost" size="icon" aria-label={`Cancel invite for ${i.email}`} onClick={() => dispatch({ type: 'revokeInvite', id: i.id })}><X /></Button>
                </li>
              ))}
            </ul>
          </section>
        )}
        <Card>
          <CardHeader><CardTitle>What each role can do</CardTitle><CardDescription>Give people the smallest role that lets them do their job.</CardDescription></CardHeader>
          <CardContent className="grid gap-4 md:grid-cols-2">
            {Object.entries(ROLES).map(([k, r]) => <div key={k}><p className="font-medium">{r.label}</p><p className="text-muted-foreground text-[13px]">{r.can}</p></div>)}
          </CardContent>
        </Card>
      </div>
    </>
  )
}
