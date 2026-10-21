import { useState } from 'react'
import { ImageGenerationCard } from '@anvil/components/agent/image-generation-card'
import { MessageAction } from '@anvil/components/agent/message-actions'
import { Checkbox } from '@anvil/components/ui/checkbox'
import { Icon, MessageSquareIcon } from '@anvil/components/ui/icon'
import type { Still, StillComment } from '~/state/types'
import { ConceptComment } from './ConceptComment'

interface ConceptCardProps {
  still: Still
  selected: boolean
  comment: StillComment | undefined
  /** A later round exists, so the note has been used. */
  applied: boolean
  nextRound: number
  /** Notes can only change on the latest round. */
  editable: boolean
  onSelect: () => void
  onSaveComment: (text: string) => void
  onRemoveComment: () => void
}

/** One generated concept: Anvil's Image Generation Card with a select checkbox on the image and a note beneath. */
export function ConceptCard({ still, selected, comment, applied, nextRound, editable, onSelect, onSaveComment, onRemoveComment }: ConceptCardProps) {
  const [composing, setComposing] = useState(false)
  return (
    <div className="flex flex-col gap-2">
      <ImageGenerationCard
        status="ready"
        prompt={still.title}
        className={selected ? 'max-w-none ring-2 ring-border-action' : 'max-w-none'}
        actions={
          <MessageAction
            label={comment ? 'Edit note' : 'Add a note'}
            pressed={composing}
            disabled={!editable || applied}
            onClick={() => setComposing((c) => !c)}
          >
            <Icon icon={MessageSquareIcon} />
          </MessageAction>
        }
      >
        <div className="relative size-full">
          <img src={still.image} alt={`Stage concept ${still.title}`} className="size-full object-cover" />
          <Checkbox
            checked={selected}
            onCheckedChange={onSelect}
            aria-label={`Select ${still.title}`}
            className="absolute end-3 top-3 shadow-sm"
          />
        </div>
      </ImageGenerationCard>
      <ConceptComment
        title={still.title}
        comment={comment}
        applied={applied}
        nextRound={nextRound}
        editable={editable}
        composing={composing}
        onCloseComposer={() => setComposing(false)}
        onSave={onSaveComment}
        onRemove={onRemoveComment}
      />
    </div>
  )
}

export function PendingConcept({ label }: { label: string }) {
  return (
    <ImageGenerationCard
      status="generating"
      prompt={label}
      statusText="Rendering concept…"
      note="Generated images may not be accurate."
      className="max-w-none"
    />
  )
}
