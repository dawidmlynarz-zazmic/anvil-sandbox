import { useMemo, useState } from 'react'
import { Users } from 'lucide-react'
import { Link, useSearchParams } from 'react-router-dom'
import { Avatar, AvatarFallback } from '@/components/ui/avatar'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle } from '@/components/ui/sheet'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { EmployeeStatusBadge } from '@/components/hr/StatusBadge'
import { EmptyState } from '@/components/hr/EmptyState'
import { ListGate } from '@/components/hr/ListGate'
import { PageHeader } from '@/components/hr/PageHeader'
import { RelDate } from '@/components/hr/RelDate'
import { useDemo } from '@/lib/demo-state'
import { fmtDate } from '@/lib/dates'

export function People() {
  const { employees } = useDemo()
  const [params, setParams] = useSearchParams()
  const [q, setQ] = useState('')
  const [status, setStatus] = useState('all')
  const rows = useMemo(
    () => employees.filter((e) => (status === 'all' || e.status === status) && `${e.name} ${e.role} ${e.department}`.toLowerCase().includes(q.toLowerCase())),
    [employees, q, status],
  )
  const open = employees.find((e) => e.id === params.get('person'))
  return (
    <>
      <PageHeader title="People" description="Everyone HR Mate knows about, synced from your directory. Read only: change details in your HR system." />
      <div className="mb-4 flex flex-wrap gap-2">
        <label className="sr-only" htmlFor="ppl-q">Search people</label>
        <Input id="ppl-q" className="max-w-xs" placeholder="Search by name, role or team" value={q} onChange={(e) => setQ(e.target.value)} />
        <Select value={status} onValueChange={setStatus}>
          <SelectTrigger className="w-44" aria-label="Filter by status"><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="trial">On trial</SelectItem>
            <SelectItem value="bench">On bench</SelectItem>
            <SelectItem value="inactive">Inactive</SelectItem>
          </SelectContent>
        </Select>
      </div>
      <ListGate
        isEmpty={employees.length === 0}
        rows={8}
        emptyState={
          <EmptyState icon={Users} title="No people yet" action={<Button asChild><Link to="/setup/directory">Connect directory</Link></Button>}>
            Connect Zoho People or Google Workspace and your employees appear here.
          </EmptyState>
        }
      >
        <div className="border-border rounded-lg border">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Name</TableHead><TableHead>Role</TableHead><TableHead>Team</TableHead><TableHead>Status</TableHead><TableHead>Started</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {rows.map((e) => (
                <TableRow key={e.id} className="h-10 cursor-pointer" onClick={() => setParams({ person: e.id })}>
                  <TableCell>
                    <button type="button" className="flex items-center gap-2 text-left font-medium" onClick={(ev) => { ev.stopPropagation(); setParams({ person: e.id }) }}>
                      <Avatar className="size-6"><AvatarFallback className="bg-secondary text-[10px]">{e.initials}</AvatarFallback></Avatar>
                      {e.name}
                    </button>
                  </TableCell>
                  <TableCell>{e.role}</TableCell>
                  <TableCell>{e.department}</TableCell>
                  <TableCell><EmployeeStatusBadge status={e.status} /></TableCell>
                  <TableCell><RelDate value={e.startDate} className="text-muted-foreground" /></TableCell>
                </TableRow>
              ))}
              {rows.length === 0 && <TableRow><TableCell colSpan={5} className="text-muted-foreground py-8 text-center">No one matches those filters.</TableCell></TableRow>}
            </TableBody>
          </Table>
        </div>
      </ListGate>
      <Sheet open={Boolean(open)} onOpenChange={(o) => !o && setParams({})}>
        <SheetContent>
          {open && (
            <>
              <SheetHeader>
                <SheetTitle>{open.name}</SheetTitle>
                <SheetDescription>{open.role} · {open.department}</SheetDescription>
              </SheetHeader>
              <dl className="grid grid-cols-[130px_1fr] gap-x-4 gap-y-3 px-4">
                <dt className="text-muted-foreground">Status</dt><dd><EmployeeStatusBadge status={open.status} /></dd>
                <dt className="text-muted-foreground">Work email</dt><dd className="break-all">{open.email}</dd>
                <dt className="text-muted-foreground">Manager</dt><dd>{open.manager}</dd>
                <dt className="text-muted-foreground">HR manager</dt><dd>{open.hrManager}</dd>
                <dt className="text-muted-foreground">Start date</dt><dd>{fmtDate(open.startDate)}</dd>
                <dt className="text-muted-foreground">Trial ends</dt><dd>{open.trialEndDate ? fmtDate(open.trialEndDate) : 'Not on trial'}</dd>
                <dt className="text-muted-foreground">Timezone</dt><dd>{open.timezone}</dd>
              </dl>
            </>
          )}
        </SheetContent>
      </Sheet>
    </>
  )
}
