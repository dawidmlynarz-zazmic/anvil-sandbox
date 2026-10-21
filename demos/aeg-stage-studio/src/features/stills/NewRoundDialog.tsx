import { useState } from 'react'
import { Button } from '@anvil/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@anvil/components/ui/dialog'
import { Icon, SparklesIcon } from '@anvil/components/ui/icon'
import { Label } from '@anvil/components/ui/label'
import { Switch } from '@anvil/components/ui/switch'
import { Textarea } from '@anvil/components/ui/textarea'
import type { Settings } from '~/state/project'
import { SceneSettings } from './SceneSettings'

/** Four new concepts from fresh settings, when none of the current ones is right. A secondary action. */
export function NewRoundDialog({
  nextRound,
  current,
  selectedCount,
  disabled,
  onGenerate,
}: {
  nextRound: number
  current: Settings
  selectedCount: number
  disabled?: boolean
  onGenerate: (settings: Settings, direction: string, useSelected: boolean) => void
}) {
  const [settings, setSettings] = useState(current)
  const [direction, setDirection] = useState('')
  const [useSelected, setUseSelected] = useState(true)
  return (
    <Dialog
      onOpenChange={(open) => {
        if (!open) return
        setSettings(current)
        setDirection('')
        setUseSelected(selectedCount > 0)
      }}
    >
      <DialogTrigger asChild>
        <Button variant="outline" intent="neutral" disabled={disabled}>
          <Icon icon={SparklesIcon} />
          Generate new concepts
        </Button>
      </DialogTrigger>
      <DialogContent size="lg">
        <DialogHeader>
          <DialogTitle>Generate new concepts</DialogTitle>
          <DialogDescription>
            None of these right? The agent makes four new concepts as round {nextRound}. This round and every version stay
            available from the progress panel.
          </DialogDescription>
        </DialogHeader>
        <DialogBody>
          <Textarea
            label="What should be different this time?"
            hint="Optional. e.g. “less symmetrical, more open sky behind the stage”"
            rows={3}
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
          />
          <SceneSettings settings={settings} onChange={setSettings} />
          <div className="flex items-center gap-2">
            <Switch id="use-selected" checked={useSelected && selectedCount > 0} disabled={selectedCount === 0} onCheckedChange={setUseSelected} />
            <Label htmlFor="use-selected">
              {selectedCount ? `Build on the ${selectedCount} selected concept${selectedCount === 1 ? '' : 's'}` : 'Nothing selected, so the agent starts fresh'}
            </Label>
          </div>
        </DialogBody>
        <DialogFooter>
          <Button onClick={() => onGenerate(settings, direction.trim(), useSelected && selectedCount > 0)}>
            <Icon icon={SparklesIcon} />
            Generate 4 new concepts
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
