import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@anvil/components/ui/select'
import { CROWD_LABEL, TIME_LABEL, VIEW_LABEL, type Crowd, type StageView, type StillsRequest, type TimeOfDay } from '~/state/types'

type Settings = Omit<StillsRequest, 'round'>

function Dropdown<T extends string>({
  label,
  value,
  options,
  disabled,
  onChange,
}: {
  label: string
  value: T
  options: Record<T, string>
  disabled?: boolean
  onChange: (value: T) => void
}) {
  return (
    <div className="w-40">
      <Select value={value} onValueChange={(next) => onChange(next as T)} disabled={disabled}>
        <SelectTrigger label={label}>
          <SelectValue />
        </SelectTrigger>
        <SelectContent>
          {(Object.entries(options) as [T, string][]).map(([key, text]) => (
            <SelectItem key={key} value={key}>
              {text}
            </SelectItem>
          ))}
        </SelectContent>
      </Select>
    </div>
  )
}

/** Time of day, crowd and camera: how the concepts are seen. */
export function SceneSettings({
  settings,
  disabled,
  onChange,
  action,
}: {
  settings: Settings
  disabled?: boolean
  onChange: (s: Settings) => void
  /** Optional control beside the dropdowns. */
  action?: React.ReactNode
}) {
  return (
    <div className="flex flex-wrap items-end gap-3">
      <Dropdown<TimeOfDay> label="Time of day" value={settings.timeOfDay} options={TIME_LABEL} disabled={disabled} onChange={(timeOfDay) => onChange({ ...settings, timeOfDay })} />
      <Dropdown<Crowd> label="Crowd" value={settings.crowd} options={CROWD_LABEL} disabled={disabled} onChange={(crowd) => onChange({ ...settings, crowd })} />
      <Dropdown<StageView> label="Camera view" value={settings.view} options={VIEW_LABEL} disabled={disabled} onChange={(view) => onChange({ ...settings, view })} />
      {action && <div className="pb-0.5">{action}</div>}
    </div>
  )
}
