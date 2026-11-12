import { useState } from 'react'
import { BookOpen, FileQuestion, Plus } from 'lucide-react'
import { Link } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { AssistantTester } from '@/components/hr/AssistantTester'
import { EmptyState } from '@/components/hr/EmptyState'
import { ListGate } from '@/components/hr/ListGate'
import { PageHeader } from '@/components/hr/PageHeader'
import { RelDate } from '@/components/hr/RelDate'
import { UploadDialog } from '@/components/hr/UploadDialog'
import { NOW, plural } from '@/lib/dates'
import { useDemo } from '@/lib/demo-state'

function NewCollection() {
  const { dispatch } = useDemo()
  const [open, setOpen] = useState(false)
  const [name, setName] = useState('')
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild><Button><Plus aria-hidden />New collection</Button></DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New collection</DialogTitle>
          <DialogDescription>A collection is a folder of documents the assistant reads together, for example “Benefits”.</DialogDescription>
        </DialogHeader>
        <DialogBody>
          <div className="space-y-2">
            <Label htmlFor="nc-name">Name</Label>
            <Input id="nc-name" value={name} onChange={(e) => setName(e.target.value)} />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
          <Button disabled={!name.trim()} onClick={() => { dispatch({ type: 'addCollection', collection: { id: `col-${Date.now()}`, name: name.trim(), description: 'No description yet.', audience: 'Everyone', updatedAt: NOW.toISOString() } }); toast.success(`Collection “${name.trim()}” created`); setName(''); setOpen(false) }}>Create collection</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

export function Knowledge() {
  const { state, dispatch } = useDemo()
  const unanswered = state.questions.filter((q) => !q.answer && !q.resolved)
  const target = state.collections[0]
  return (
    <>
      <PageHeader title="Knowledge" description="The documents the assistant answers from. It never answers from anything else." actions={<NewCollection />} />
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <div className="space-y-8">
          <ListGate isEmpty={state.collections.length === 0} rows={3} emptyState={<EmptyState icon={BookOpen} title="No knowledge yet">Create a collection and upload documents like your leave policy or handbook. PDF, Word, Excel and web links work.</EmptyState>}>
            <div className="grid gap-4 md:grid-cols-2">
              {state.collections.map((c) => {
                const files = state.files.filter((f) => f.collectionId === c.id)
                return (
                  <Card key={c.id}>
                    <CardHeader>
                      <CardTitle>{c.name}</CardTitle>
                      <CardDescription>{c.description}</CardDescription>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      <ul className="text-muted-foreground space-y-1 text-[13px]">
                        <li>{plural(files.length, 'file')} · updated <RelDate value={c.updatedAt} time /></li>
                        <li>Visible to: {c.audience}</li>
                      </ul>
                      <Button asChild variant="outline"><Link to={`/knowledge/${c.id}`}>Open {c.name}</Link></Button>
                    </CardContent>
                  </Card>
                )
              })}
            </div>
          </ListGate>
          {unanswered.length > 0 && (
            <section aria-labelledby="unanswered">
              <h2 id="unanswered" className="text-base font-semibold">Questions the assistant couldn't answer</h2>
              <p className="text-muted-foreground mb-3 text-[13px]">Add a document that covers the topic and the assistant can answer next time.</p>
              <ul className="border-border divide-y rounded-lg border">
                {unanswered.map((q) => (
                  <li key={q.id} className="flex flex-wrap items-center gap-3 px-4 py-3">
                    <FileQuestion className="text-muted-foreground size-4 shrink-0" aria-hidden />
                    <div className="min-w-0 flex-1">
                      <p className="font-medium">{q.text}</p>
                      <p className="text-muted-foreground text-xs">Asked by {q.askedBy} · <RelDate value={q.askedAt} time /> · Topic: {q.topic}</p>
                    </div>
                    {target && <UploadDialog collectionId={target.id} onUploaded={() => dispatch({ type: 'resolveQuestion', id: q.id })} trigger={<Button variant="outline" size="sm">Add a document for this</Button>} />}
                  </li>
                ))}
              </ul>
            </section>
          )}
        </div>
        <Card className="h-fit">
          <CardHeader><CardTitle>Test a question</CardTitle><CardDescription>See the answer and sources an employee would get.</CardDescription></CardHeader>
          <CardContent><AssistantTester /></CardContent>
        </Card>
      </div>
    </>
  )
}
