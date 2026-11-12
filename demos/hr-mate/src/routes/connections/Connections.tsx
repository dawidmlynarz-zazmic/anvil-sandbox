import { RefreshCw, Settings2, Unplug } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle, AlertDialogTrigger } from '@/components/ui/alert-dialog'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardFooter, CardHeader, CardTitle } from '@/components/ui/card'
import { Sheet, SheetContent, SheetDescription, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet'
import { ConnectionBadge } from '@/components/hr/StatusBadge'
import { MappingTable } from '@/components/hr/MappingTable'
import { PageHeader } from '@/components/hr/PageHeader'
import { RelDate } from '@/components/hr/RelDate'
import { useDemo } from '@/lib/demo-state'

export function Connections() {
  const { state, dispatch } = useDemo()
  return (
    <>
      <PageHeader title="Connections" description="Where HR Mate reads your people data from. It only reads, it never writes back." />
      <div className="grid gap-4 lg:grid-cols-2">
        {state.integrations.map((i) => {
          const on = i.status !== 'not_connected'
          return (
            <Card key={i.id}>
              <CardHeader>
                <div className="flex items-start justify-between gap-3">
                  <CardTitle>{i.name}</CardTitle>
                  <ConnectionBadge status={i.status} />
                </div>
                <CardDescription>{i.blurb}</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {i.problem && <p className="bg-warning-muted text-warning rounded-md px-3 py-2 text-[13px]">{i.problem}</p>}
                <div>
                  <p className="mb-1 text-xs font-medium">Provides</p>
                  <ul className="text-muted-foreground list-disc space-y-0.5 pl-4 text-[13px]">{i.provides.map((p) => <li key={p}>{p}</li>)}</ul>
                </div>
                <p className="text-muted-foreground text-[13px]">{on ? <>Last sync <RelDate value={i.lastSync!} time /> · <span className="num">{i.employeeCount}</span> employees</> : 'Never synced.'}</p>
              </CardContent>
              <CardFooter className="flex flex-wrap gap-2">
                {on ? (
                  <>
                    <Button variant="outline" onClick={() => { dispatch({ type: 'syncNow', id: i.id }); toast.success(`${i.name} synced just now`) }}><RefreshCw aria-hidden />Sync now</Button>
                    <Sheet>
                      <SheetTrigger asChild><Button variant={i.status === 'attention' ? 'default' : 'outline'}><Settings2 aria-hidden />Manage field mapping</Button></SheetTrigger>
                      <SheetContent className="w-full sm:max-w-3xl overflow-y-auto">
                        <SheetHeader><SheetTitle>Field mapping for {i.name}</SheetTitle><SheetDescription>Tell HR Mate where to find each piece of information. Missing fields mean some workflows skip people.</SheetDescription></SheetHeader>
                        <div className="px-4"><MappingTable integration={i} onChoose={(field, chosen) => { dispatch({ type: 'resolveMapping', id: i.id, field, chosen }); toast.success(`${field} mapped`) }} /></div>
                      </SheetContent>
                    </Sheet>
                    <AlertDialog>
                      <AlertDialogTrigger asChild><Button variant="ghost"><Unplug aria-hidden />Disconnect</Button></AlertDialogTrigger>
                      <AlertDialogContent>
                        <AlertDialogHeader>
                          <AlertDialogTitle>Disconnect {i.name}?</AlertDialogTitle>
                          <AlertDialogDescription>HR Mate stops syncing and forgets the {i.employeeCount} synced employees. Workflows will have nobody to send to until you reconnect, and the assistant can't look up managers. Nothing changes in {i.name}. You can reconnect at any time.</AlertDialogDescription>
                        </AlertDialogHeader>
                        <AlertDialogFooter>
                          <AlertDialogCancel>Stay connected</AlertDialogCancel>
                          <AlertDialogAction className="bg-destructive text-white hover:bg-destructive/90" onClick={() => { dispatch({ type: 'disconnect', id: i.id }); toast.success(`${i.name} disconnected`) }}>Disconnect {i.name}</AlertDialogAction>
                        </AlertDialogFooter>
                      </AlertDialogContent>
                    </AlertDialog>
                  </>
                ) : (
                  <Button asChild><Link to="/setup/directory">Connect {i.name}</Link></Button>
                )}
              </CardFooter>
            </Card>
          )
        })}
      </div>
    </>
  )
}
