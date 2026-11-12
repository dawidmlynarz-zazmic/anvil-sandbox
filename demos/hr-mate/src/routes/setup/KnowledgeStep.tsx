import { useState } from 'react'
import { FileText, Link2, Upload } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { IndexStatusBadge } from '@/components/hr/StatusBadge'
import { UploadDialog } from '@/components/hr/UploadDialog'
import { NOW } from '@/lib/dates'
import { useDemo } from '@/lib/demo-state'
import { formatSize, KIND_LABEL } from '@/lib/knowledge'
import { StepHeader, useNextStep } from './Setup'

export function KnowledgeStep() {
  const { state, dispatch } = useDemo()
  const next = useNextStep('knowledge')
  const col = state.collections[0]
  const files = col ? state.files.filter((f) => f.collectionId === col.id) : []
  const ready = files.some((f) => f.status === 'indexed')
  const [name, setName] = useState('Company policies')
  const [desc, setDesc] = useState('Leave, remote work, expenses and benefits.')

  const primary = (
    <Button
      disabled={!ready}
      onClick={() => {
        dispatch({ type: 'setStep', step: 'knowledge', status: 'done' })
        next()
      }}
    >
      Continue to testing
    </Button>
  )

  return (
    <>
      <StepHeader step="knowledge" primary={primary} />
      {!col ? (
        <Card className="max-w-xl">
          <CardHeader>
            <CardTitle>Create your first collection</CardTitle>
            <CardDescription>A collection is a folder of documents the assistant reads together. Start with the ones employees ask about most.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="col-name">Collection name</Label>
              <Input id="col-name" value={name} onChange={(e) => setName(e.target.value)} />
              <p className="text-muted-foreground text-xs">Suggested: Company policies. You can add more collections later.</p>
            </div>
            <div className="space-y-2">
              <Label htmlFor="col-desc">What is it for? (optional)</Label>
              <Textarea id="col-desc" rows={2} value={desc} onChange={(e) => setDesc(e.target.value)} />
            </div>
            <Button
              variant="secondary"
              disabled={!name.trim()}
              onClick={() => dispatch({ type: 'addCollection', collection: { id: `col-${Date.now()}`, name: name.trim(), description: desc.trim(), audience: 'Everyone', updatedAt: NOW.toISOString() } })}
            >
              Create collection
            </Button>
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>{col.name}</CardTitle>
            <CardDescription>Add the documents employees ask about. PDF, Word, Excel and web links work. Indexing takes a few seconds per file.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex flex-wrap gap-2">
              <UploadDialog collectionId={col.id} trigger={<Button variant="secondary"><Upload aria-hidden />Upload files</Button>} />
              <UploadDialog collectionId={col.id} trigger={<Button variant="outline"><Link2 aria-hidden />Add a web link</Button>} hint="Paste the address of a page the assistant should read, such as a benefits page on your intranet." />
            </div>
            {files.length === 0 ? (
              <p className="text-muted-foreground border-border rounded-lg border border-dashed p-6 text-center text-[13px]">No documents yet. Upload at least one to continue. A leave policy or handbook is a good start.</p>
            ) : (
              <ul className="divide-y rounded-lg border" aria-live="polite">
                {files.map((f) => (
                  <li key={f.id} className="flex items-center gap-3 px-4 py-2.5">
                    <FileText className="text-muted-foreground size-4 shrink-0" aria-hidden />
                    <span className="flex-1 truncate">{f.name}</span>
                    <span className="text-muted-foreground text-xs">
                      {KIND_LABEL[f.kind]} · <span className="num">{formatSize(f.sizeKb)}</span>
                    </span>
                    <IndexStatusBadge status={f.status} />
                  </li>
                ))}
              </ul>
            )}
            {files.length > 0 && !ready && <p className="text-muted-foreground text-[13px]">Indexing… you can continue as soon as one document is ready.</p>}
          </CardContent>
        </Card>
      )}
    </>
  )
}
