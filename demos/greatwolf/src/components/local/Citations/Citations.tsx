import { useState } from 'react'
import { CitationChip } from '@anvil/components/agent/citation-chip'
import { Card, CardContent } from '@anvil/components/ui/card'
import { sources } from '~/data/policies'

/** Source chips under an answer. Picking one opens the passage the answer rests on. */
export function Citations({ ids }: { ids: string[] }) {
  const [open, setOpen] = useState<string | null>(null)
  const src = open ? sources[open] : null
  return (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {ids.map((id) => (
          <CitationChip key={id} index={sources[id].index} domain={sources[id].title} active={open === id} onClick={() => setOpen(open === id ? null : id)} />
        ))}
      </div>
      {src && (
        <Card size="sm">
          <CardContent className="flex flex-col gap-1">
            <p className="type-text-xs-medium text-muted-foreground">{src.kind}</p>
            <p className="type-text-sm-semibold">{src.title}</p>
            <p className="type-text-sm-normal">{src.excerpt}</p>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
