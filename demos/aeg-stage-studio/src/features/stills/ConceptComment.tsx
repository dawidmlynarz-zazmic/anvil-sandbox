import { useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@anvil/components/ui/alert'
import { Button } from '@anvil/components/ui/button'
import { Icon, MessageSquareIcon } from '@anvil/components/ui/icon'
import { Textarea } from '@anvil/components/ui/textarea'
import type { StillComment } from '~/state/types'

interface ConceptCommentProps {
  title: string
  comment: StillComment | undefined
  /** The note has been used by a later round, so it is kept as a record and can't be changed. */
  applied: boolean
  nextRound: number
  /** Whether a note can be added or changed (only on the latest round). */
  editable: boolean
  composing: boolean
  onCloseComposer: () => void
  onSave: (text: string) => void
  onRemove: () => void
}

/**
 * The note on one concept. States: empty (nothing shown), composing, saved (will shape the next round),
 * editing, and applied (already used by a later round, read-only).
 */
export function ConceptComment({ title, comment, applied, nextRound, editable, composing, onCloseComposer, onSave, onRemove }: ConceptCommentProps) {
  const [editing, setEditing] = useState(false)
  const [draft, setDraft] = useState('')

  const open = composing || editing
  if (open) {
    const adding = !comment
    return (
      <form
        className="flex flex-col gap-2"
        onSubmit={(e) => {
          e.preventDefault()
          if (!draft.trim()) return
          onSave(draft.trim())
          setEditing(false)
          onCloseComposer()
        }}
      >
        <Textarea
          label={adding ? `Add a note on ${title}` : `Edit your note on ${title}`}
          hint={`The agent uses notes to shape round ${nextRound}. You can change or remove a note until then.`}
          rows={3}
          autoFocus
          value={draft}
          onChange={(e) => setDraft(e.target.value)}
        />
        <div className="flex items-center gap-2">
          <Button type="submit" size="sm" disabled={!draft.trim()}>
            {adding ? 'Add note' : 'Save changes'}
          </Button>
          <Button
            type="button"
            variant="ghost"
            intent="neutral"
            size="sm"
            onClick={() => {
              setEditing(false)
              onCloseComposer()
            }}
          >
            Cancel
          </Button>
        </div>
      </form>
    )
  }

  if (!comment) return null

  return (
    <Alert
      size="xs"
      tone={applied ? 'neutral' : 'agent'}
      role="note"
      action={
        editable && !applied ? (
          <div className="flex gap-1">
            <Button
              variant="outline"
              intent="neutral"
              size="xs"
              onClick={() => {
                setDraft(comment.text)
                setEditing(true)
              }}
            >
              Edit
            </Button>
            <Button variant="ghost" intent="neutral" size="xs" onClick={onRemove}>
              Delete
            </Button>
          </div>
        ) : undefined
      }
    >
      <Icon icon={MessageSquareIcon} />
      <AlertTitle>{applied ? `Your note · used in round ${comment.round + 1}` : `Your note · will shape round ${nextRound}`}</AlertTitle>
      <AlertDescription>{comment.text}</AlertDescription>
    </Alert>
  )
}
