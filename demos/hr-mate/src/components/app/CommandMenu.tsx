import { useNavigate } from 'react-router-dom'
import { CommandDialog, CommandEmpty, CommandGroup, CommandInput, CommandItem, CommandList } from '@/components/ui/command'
import { useDemo } from '@/lib/demo-state'
import { NAV, EXTRA_ROUTES } from './nav'

export function CommandMenu({ open, onOpenChange }: { open: boolean; onOpenChange: (o: boolean) => void }) {
  const navigate = useNavigate()
  const { state, employees } = useDemo()
  const go = (to: string) => {
    onOpenChange(false)
    navigate(to)
  }
  const screens = NAV.flatMap((n) => (n.children ? n.children.map((c) => ({ label: `${n.label}: ${c.label}`, to: c.to, icon: n.icon })) : [{ label: n.label, to: n.to, icon: n.icon }]))
  return (
    <CommandDialog open={open} onOpenChange={onOpenChange} title="Search HR Mate" description="Search screens, workflows and people">
      <CommandInput placeholder="Search screens, workflows and people" />
      <CommandList>
        <CommandEmpty>Nothing matches. Try a screen name, a workflow or a person.</CommandEmpty>
        <CommandGroup heading="Screens">
          {[...screens, ...EXTRA_ROUTES.filter((e) => e.to !== '/')].map((s) => (
            <CommandItem key={s.to + s.label} value={`screen ${s.label}`} onSelect={() => go(s.to)}>
              <s.icon aria-hidden />
              {s.label}
            </CommandItem>
          ))}
        </CommandGroup>
        {state.workflows.length > 0 && (
          <CommandGroup heading="Workflows">
            {state.workflows.map((w) => (
              <CommandItem key={w.id} value={`workflow ${w.name}`} onSelect={() => go(`/automations/workflows/${w.id}`)}>
                {w.name}
              </CommandItem>
            ))}
          </CommandGroup>
        )}
        {employees.length > 0 && (
          <CommandGroup heading="People">
            {employees.map((e) => (
              <CommandItem key={e.id} value={`person ${e.name} ${e.role}`} onSelect={() => go(`/people?person=${e.id}`)}>
                {e.name}
                <span className="text-muted-foreground ml-auto text-xs">{e.role}</span>
              </CommandItem>
            ))}
          </CommandGroup>
        )}
      </CommandList>
    </CommandDialog>
  )
}
