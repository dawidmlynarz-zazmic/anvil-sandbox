import { ConceptCard, ConceptCardPending } from '~/components/local/ConceptCard/ConceptCard'
import { StillImage, useStillUrl } from '~/components/StillImage'
import { briefCheck, RATIONALE } from '~/services/briefCheck'
import { useProject } from '~/state/ProjectContext'
import type { Still } from '~/state/types'

/** A concept card wired to the project: select, annotate changes, variations, versions, set aside. */
export function ConceptTile({ still, readOnly }: { still: Still; readOnly: boolean }) {
  const p = useProject()
  const src = useStillUrl(still)
  const previous = still.history?.at(-1)
  // Compare versions in the view you're looking at now, so only the design differs.
  const previousSpec = previous?.spec && still.spec ? { ...previous.spec, timeOfDay: still.spec.timeOfDay, crowd: still.spec.crowd, view: still.spec.view } : previous?.spec
  const previousSrc = useStillUrl(previous ? { ...still, image: previous.image, spec: previousSpec } : undefined)
  return (
    <ConceptCard
      title={still.title}
      rationale={RATIONALE[still.concept]}
      version={still.version ?? 1}
      change={still.change}
      mediaSrc={src}
      mediaAlt={`Stage concept ${still.title}`}
      previous={previous ? { version: previous.version, src: previousSrc, changes: previous.annotations } : undefined}
      checks={briefCheck(still, p.brief)}
      selected={p.selected.includes(still.id)}
      onSelectedChange={() => p.toggleSelect(still.id)}
      dismissed={still.dismissed}
      busy={still.busy === 'refining' ? 'Refining…' : still.busy === 'regenerating' ? 'Regenerating…' : undefined}
      variants={
        still.variants === 'generating'
          ? 'generating'
          : still.variants?.map((spec, i) => <StillImage key={i} still={{ ...still, spec: still.spec ? { ...spec, timeOfDay: still.spec.timeOfDay, crowd: still.spec.crowd, view: still.spec.view } : spec }} alt={`Variation ${i + 1}`} />)
      }
      onPickVariant={(i) => p.pickVariant(still.id, i)}
      onCloseVariants={() => p.pickVariant(still.id, null)}
      annotations={still.annotations}
      onAddAnnotation={(text, at) => p.addAnnotation(still.id, text, at)}
      onRemoveAnnotation={(n) => p.removeAnnotation(still.id, n)}
      onApplyAnnotations={() => void p.applyAnnotations(still.id)}
      onMoreLikeThis={() => void p.moreLikeThis(still.id)}
      onRegenerate={() => void p.regenerateStill(still.id)}
      onRevert={previous ? () => p.restoreVersion(still.id, previous.version) : undefined}
      onToggleDismissed={() => p.toggleDismissed(still.id)}
      readOnly={readOnly}
    />
  )
}

export { ConceptCardPending }
