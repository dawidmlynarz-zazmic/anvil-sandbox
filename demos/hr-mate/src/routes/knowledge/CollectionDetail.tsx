import { Navigate, useParams } from 'react-router-dom'
import { FileText, RotateCw, Trash2, Upload } from 'lucide-react'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { AssistantTester } from '@/components/hr/AssistantTester'
import { EmptyState } from '@/components/hr/EmptyState'
import { ListGate } from '@/components/hr/ListGate'
import { PageHeader } from '@/components/hr/PageHeader'
import { RelDate } from '@/components/hr/RelDate'
import { IndexStatusBadge } from '@/components/hr/StatusBadge'
import { UploadDialog } from '@/components/hr/UploadDialog'
import { useDemo } from '@/lib/demo-state'
import { formatSize, KIND_LABEL } from '@/lib/knowledge'

export function CollectionDetail() {
  const { id } = useParams()
  const { state, dispatch } = useDemo()
  const col = state.collections.find((c) => c.id === id)
  if (!col) return <Navigate to="/knowledge" replace />
  const files = state.files.filter((f) => f.collectionId === col.id)
  return (
    <>
      <PageHeader title={col.name} description={`${col.description} Visible to: ${col.audience}.`} back={{ to: '/knowledge', label: 'Knowledge' }}
        actions={<UploadDialog collectionId={col.id} trigger={<Button><Upload aria-hidden />Upload files</Button>} />} />
      <div className="grid gap-6 xl:grid-cols-[1fr_420px]">
        <ListGate isEmpty={files.length === 0} emptyState={<EmptyState icon={FileText} title="No files in this collection">Upload PDF, Word or Excel files, or add a web link. The assistant starts using them as soon as they finish indexing.</EmptyState>}>
          <div className="border-border rounded-lg border">
            <Table>
              <TableHeader><TableRow><TableHead>Name</TableHead><TableHead>Type</TableHead><TableHead>Size</TableHead><TableHead>Owner</TableHead><TableHead>Updated</TableHead><TableHead>Status</TableHead><TableHead><span className="sr-only">Actions</span></TableHead></TableRow></TableHeader>
              <TableBody>
                {files.map((f) => (
                  <TableRow key={f.id} className="h-10 align-top">
                    <TableCell className="font-medium whitespace-normal">
                      {f.name}
                      {f.status === 'failed' && <p className="text-destructive-soft mt-1 max-w-xs text-xs font-normal">{f.failReason}</p>}
                    </TableCell>
                    <TableCell>{KIND_LABEL[f.kind]}</TableCell>
                    <TableCell className="num">{formatSize(f.sizeKb)}</TableCell>
                    <TableCell>{f.owner}</TableCell>
                    <TableCell><RelDate value={f.updatedAt} time /></TableCell>
                    <TableCell><IndexStatusBadge status={f.status} /></TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      {f.status === 'failed' && <Button variant="ghost" size="sm" onClick={() => { dispatch({ type: 'setFileStatus', id: f.id, status: 'indexing' }); setTimeout(() => dispatch({ type: 'setFileStatus', id: f.id, status: 'indexed' }), 1800); toast('Trying again…') }}><RotateCw aria-hidden />Retry</Button>}
                      <Button variant="ghost" size="icon" aria-label={`Remove ${f.name}`} onClick={() => { dispatch({ type: 'removeFile', id: f.id }); toast.success(`${f.name} removed`, { action: { label: 'Undo', onClick: () => dispatch({ type: 'addFile', file: f }) } }) }}><Trash2 /></Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
        </ListGate>
        <Card className="h-fit">
          <CardHeader><CardTitle>Test a question</CardTitle><CardDescription>Try the assistant against what you've uploaded.</CardDescription></CardHeader>
          <CardContent><AssistantTester /></CardContent>
        </Card>
      </div>
    </>
  )
}
