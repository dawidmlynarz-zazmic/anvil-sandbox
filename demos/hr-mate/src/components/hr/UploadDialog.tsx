import { useState, type ReactNode } from 'react'
import { FileText, Link2 } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Checkbox } from '@/components/ui/checkbox'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { useDemo } from '@/lib/demo-state'
import { formatSize, KIND_LABEL, uploadFiles } from '@/lib/knowledge'
import { SAMPLE_FILES } from '@/mocks/seed'

/** Prototype stand-in for a file picker: the reviewer chooses from sample documents, or adds a link. */
export function UploadDialog({ collectionId, trigger, hint, onUploaded }: { collectionId: string; trigger: ReactNode; hint?: string; onUploaded?: () => void }) {
  const { state, dispatch } = useDemo()
  const [open, setOpen] = useState(false)
  const [picked, setPicked] = useState<string[]>([])
  const [url, setUrl] = useState('')
  const existing = state.files.filter((f) => f.collectionId === collectionId).map((f) => f.name)
  const options = SAMPLE_FILES.filter((f) => !existing.includes(f.name))
  const urlOk = /^https?:\/\/.+\..+/.test(url.trim())

  const submit = () => {
    const items = SAMPLE_FILES.filter((f) => picked.includes(f.name))
    if (urlOk) {
      const host = new URL(url.trim()).hostname.replace(/^www\./, '')
      items.push({ name: host, kind: 'link', sizeKb: null })
    }
    uploadFiles(dispatch, collectionId, items)
    toast.success(`${items.length} ${items.length === 1 ? 'item' : 'items'} added. Indexing takes a moment.`)
    setPicked([])
    setUrl('')
    setOpen(false)
    onUploaded?.()
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>{trigger}</DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Upload files</DialogTitle>
          <DialogDescription>
            {hint ?? 'The prototype can’t open your computer’s file picker, so choose from sample documents. In the product this is a normal upload. Supported: PDF, Word, Excel and web links.'}
          </DialogDescription>
        </DialogHeader>
        <DialogBody className="space-y-4">
          <fieldset className="space-y-2">
            <legend className="text-sm font-medium">Sample documents</legend>
            {options.length === 0 && <p className="text-muted-foreground text-[13px]">All sample documents are already in this collection.</p>}
            {options.map((f) => (
              <div key={f.name} className="flex items-center gap-3">
                <Checkbox id={`up-${f.name}`} checked={picked.includes(f.name)} onCheckedChange={(c) => setPicked((p) => (c ? [...p, f.name] : p.filter((n) => n !== f.name)))} />
                <Label htmlFor={`up-${f.name}`} className="flex flex-1 cursor-pointer items-center gap-2 font-normal">
                  <FileText className="text-muted-foreground size-4" aria-hidden />
                  {f.name}
                  <span className="text-muted-foreground ml-auto text-xs">
                    {KIND_LABEL[f.kind]} · {formatSize(f.sizeKb)}
                  </span>
                </Label>
              </div>
            ))}
          </fieldset>
          <div className="space-y-2">
            <Label htmlFor="up-link" className="flex items-center gap-2">
              <Link2 className="size-4" aria-hidden /> Or add a web link
            </Label>
            <Input id="up-link" value={url} onChange={(e) => setUrl(e.target.value)} placeholder="https://intranet.example.com/benefits" />
          </div>
        </DialogBody>
        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button disabled={!picked.length && !urlOk} onClick={submit}>
            Add {picked.length + (urlOk ? 1 : 0) || ''} to collection
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
