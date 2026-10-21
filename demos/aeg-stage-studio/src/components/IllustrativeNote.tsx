import { Icon, InfoIcon } from '@anvil/components/ui/icon'

/** Says what the pictures are, wherever generated media is shown. */
export function IllustrativeNote({ kind }: { kind: 'stills' | 'motion' }) {
  return (
    <p className="text-muted-foreground flex items-center gap-1.5 type-text-xs-normal">
      <Icon icon={InfoIcon} size="xs" />
      {kind === 'stills'
        ? 'Illustrative 3D previews. In the pilot, concepts come from Nano Banana Pro.'
        : 'Illustrative 3D preview. In the pilot, clips come from Veo 3.1 and edits from Gemini Omni Flash (preview).'}
    </p>
  )
}
