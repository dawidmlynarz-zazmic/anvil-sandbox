import { FlaskConical, RotateCcw } from 'lucide-react'
import { Link, useNavigate } from 'react-router-dom'
import { toast } from 'sonner'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { ToggleGroup, ToggleGroupItem } from '@/components/ui/toggle-group'
import { SETUP_STEPS, useDemo, type DemoMode, type ListMode } from '@/lib/demo-state'
import { cn } from '@/lib/utils'
import { ONBOARDING } from '@/copy/onboarding'

/** Prototype-only. Lets a reviewer switch workspace state, reach list states and jump into onboarding. */
export function DemoControls({ collapsed }: { collapsed: boolean }) {
  const { state, dispatch } = useDemo()
  const navigate = useNavigate()
  return (
    <Popover>
      <PopoverTrigger asChild>
        <Button variant="outline" className={cn('border-dashed', collapsed ? 'size-10 justify-center px-0' : 'w-full justify-start')} aria-label="Demo controls">
          <FlaskConical aria-hidden />
          {!collapsed && 'Demo controls'}
        </Button>
      </PopoverTrigger>
      <PopoverContent side="top" align="start" className="w-80 space-y-4">
        <div>
          <p className="text-sm font-semibold">Demo controls</p>
          <p className="text-muted-foreground text-xs">Prototype only. These controls are not part of the product.</p>
        </div>
        <div className="space-y-2">
          <Label>Workspace</Label>
          <ToggleGroup
            type="single"
            variant="outline"
            value={state.mode}
            onValueChange={(v) => {
              if (!v) return
              dispatch({ type: 'switchMode', mode: v as DemoMode })
              navigate('/')
              toast.success(v === 'fresh' ? 'Switched to a fresh workspace' : 'Switched to an established workspace')
            }}
            className="w-full"
          >
            <ToggleGroupItem value="fresh" className="flex-1">
              Fresh
            </ToggleGroupItem>
            <ToggleGroupItem value="established" className="flex-1">
              Established
            </ToggleGroupItem>
          </ToggleGroup>
        </div>
        <div className="space-y-2">
          <Label htmlFor="list-mode">Lists show</Label>
          <Select value={state.listMode} onValueChange={(v) => dispatch({ type: 'setListMode', mode: v as ListMode })}>
            <SelectTrigger id="list-mode" className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="normal">Real data</SelectItem>
              <SelectItem value="loading">Loading state</SelectItem>
              <SelectItem value="empty">Empty state</SelectItem>
              <SelectItem value="error">Error state</SelectItem>
            </SelectContent>
          </Select>
        </div>
        <div className="space-y-1">
          <Label>Jump to onboarding step</Label>
          <ol className="grid gap-1">
            {SETUP_STEPS.map((k, i) => (
              <li key={k}>
                <Link to={`/setup/${k}`} className="hover:bg-accent flex items-center gap-2 rounded-md px-2 py-1 text-[13px]">
                  <span className="bg-muted text-muted-foreground flex size-5 items-center justify-center rounded-full text-xs">{i + 1}</span>
                  {ONBOARDING.steps[k].title}
                </Link>
              </li>
            ))}
          </ol>
        </div>
        <Button
          variant="secondary"
          className="w-full"
          onClick={() => {
            dispatch({ type: 'reset' })
            navigate('/')
            toast.success('Demo reset to its starting point')
          }}
        >
          <RotateCcw aria-hidden />
          Reset demo
        </Button>
      </PopoverContent>
    </Popover>
  )
}
