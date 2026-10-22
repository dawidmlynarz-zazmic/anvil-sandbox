import { useId, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Button } from '@anvil/components/ui/button'
import { Dialog, DialogBody, DialogClose, DialogContent, DialogFooter, DialogHeader, DialogTitle } from '@anvil/components/ui/dialog'
import { Input } from '@anvil/components/ui/input'
import { useStore } from '~/state/store'

/**
 * Starts a project: the artist and the event are project details (not part of the brief), asked once here. Then the
 * agent opens the brief with its opening questions.
 */
export function NewProjectDialog({ open, onOpenChange }: { open: boolean; onOpenChange: (open: boolean) => void }) {
  const { createProject } = useStore()
  const navigate = useNavigate()
  const [artist, setArtist] = useState('')
  const [event, setEvent] = useState('')
  const ready = artist.trim() && event.trim()
  const formId = useId()
  const create = (e: React.FormEvent) => {
    e.preventDefault()
    if (!ready) return
    const id = createProject({ artist: artist.trim(), event: event.trim() })
    onOpenChange(false)
    navigate(`/p/${id}/brief`)
  }

  return (
    <Dialog
      open={open}
      onOpenChange={(next) => {
        onOpenChange(next)
        if (next) {
          setArtist('')
          setEvent('')
        }
      }}
    >
      {/* Anvil Dialog as designed: header bar, the body slot with two Input fields, footer bar. */}
      {/* No description: the two fields say it all (aria-describedby tells Radix that's deliberate). */}
      <DialogContent aria-describedby={undefined}>
        <DialogHeader>
          <DialogTitle>New project</DialogTitle>
        </DialogHeader>
        <DialogBody>
          <form id={formId} className="flex flex-col gap-4" onSubmit={create}>
            <Input id="new-artist" label="Artist" placeholder="e.g. Juniper Cole" autoFocus value={artist} onChange={(e) => setArtist(e.target.value)} />
            <Input id="new-event" label="Event" placeholder="e.g. Stagecoach 2027" value={event} onChange={(e) => setEvent(e.target.value)} />
          </form>
        </DialogBody>
        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline" intent="neutral">
              Cancel
            </Button>
          </DialogClose>
          <Button type="submit" form={formId} disabled={!ready}>
            Create new project
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
