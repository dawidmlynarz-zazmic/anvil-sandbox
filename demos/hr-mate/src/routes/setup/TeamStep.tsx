import { useState } from 'react'
import { Mail, X } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ROLES } from '@/copy/onboarding'
import { NOW } from '@/lib/dates'
import { useDemo } from '@/lib/demo-state'
import type { TeamRole } from '@/mocks/types'
import { StepHeader } from './Setup'
import { useNavigate } from 'react-router-dom'

const INVITABLE: TeamRole[] = ['admin', 'hr_manager', 'viewer']

export function TeamStep() {
  const { state, dispatch } = useDemo()
  const navigate = useNavigate()
  const [email, setEmail] = useState('')
  const [role, setRole] = useState<TeamRole>('hr_manager')
  const valid = /^\S+@\S+\.\S+$/.test(email)

  const send = () => {
    dispatch({ type: 'invite', invite: { id: `inv-${Date.now()}`, email: email.trim(), role, sentAt: NOW.toISOString() } })
    toast.success(`Invite sent to ${email.trim()}`)
    setEmail('')
  }

  return (
    <>
      <StepHeader
        step="team"
        primary={
          <Button
            disabled={state.invites.length === 0}
            onClick={() => {
              dispatch({ type: 'setStep', step: 'team', status: 'done' })
              navigate('/')
            }}
          >
            Finish setup
          </Button>
        }
      />
      <div className="grid gap-6 lg:grid-cols-[1fr_340px]">
        <div className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle>Invite a colleague</CardTitle>
              <CardDescription>They get an email with a link. No invite is really sent in this prototype.</CardDescription>
            </CardHeader>
            <CardContent>
              <form
                className="space-y-4"
                onSubmit={(e) => {
                  e.preventDefault()
                  if (valid) send()
                }}
              >
                <div className="grid gap-4 sm:grid-cols-[1fr_200px]">
                  <div className="space-y-2">
                    <Label htmlFor="inv-email">Work email</Label>
                    <Input id="inv-email" type="email" value={email} onChange={(e) => setEmail(e.target.value)} placeholder="name@company.com" />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="inv-role">Role</Label>
                    <Select value={role} onValueChange={(r) => setRole(r as TeamRole)}>
                      <SelectTrigger id="inv-role" className="w-full">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {INVITABLE.map((r) => (
                          <SelectItem key={r} value={r}>
                            {ROLES[r].label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>
                <p className="text-muted-foreground text-[13px]">
                  <span className="text-foreground font-medium">{ROLES[role].label}:</span> {ROLES[role].can}
                </p>
                <Button type="submit" variant="secondary" disabled={!valid}>
                  <Mail aria-hidden />
                  Send invite
                </Button>
              </form>
            </CardContent>
          </Card>
          {state.invites.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Pending invites</CardTitle>
              </CardHeader>
              <CardContent>
                <ul className="divide-y" aria-live="polite">
                  {state.invites.map((i) => (
                    <li key={i.id} className="flex items-center gap-3 py-2">
                      <span className="flex-1">{i.email}</span>
                      <span className="text-muted-foreground text-[13px]">{ROLES[i.role].label}</span>
                      <Button variant="ghost" size="icon" aria-label={`Cancel invite for ${i.email}`} onClick={() => dispatch({ type: 'revokeInvite', id: i.id })}>
                        <X />
                      </Button>
                    </li>
                  ))}
                </ul>
              </CardContent>
            </Card>
          )}
        </div>
        <aside className="bg-muted/50 border-border space-y-3 rounded-lg border p-4">
          <p className="font-semibold">What each role can do</p>
          {(['owner', ...INVITABLE] as TeamRole[]).map((r) => (
            <div key={r}>
              <p className="text-[13px] font-medium">{ROLES[r].label}</p>
              <p className="text-muted-foreground text-[13px]">{ROLES[r].can}</p>
            </div>
          ))}
        </aside>
      </div>
    </>
  )
}
