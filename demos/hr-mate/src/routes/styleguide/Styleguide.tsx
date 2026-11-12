import { Check, X } from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { PageHeader } from '@/components/hr/PageHeader'
import { Pill } from '@/components/hr/Pill'

const lum = (hex: string) => {
  const c = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255).map((v) => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4))
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2]
}
const ratio = (a: string, b: string) => {
  const [x, y] = [lum(a), lum(b)].sort((p, q) => q - p)
  return (x + 0.05) / (y + 0.05)
}

const PAIRS: [string, string, string, number][] = [
  ['Text on background', '#f3efe8', '#0f0920', 4.5],
  ['Text on card', '#f3efe8', '#181229', 4.5],
  ['Secondary text on card', '#a9a2bc', '#181229', 4.5],
  ['Secondary text on muted', '#a9a2bc', '#211a34', 4.5],
  ['Navy text on coral button', '#0f0920', '#e8483e', 4.5],
  ['White text on coral (do not use)', '#ffffff', '#e8483e', 4.5],
  ['Coral text on background', '#e8483e', '#0f0920', 4.5],
  ['Coral text on card', '#e8483e', '#181229', 4.5],
  ['White on destructive button', '#ffffff', '#c81e5b', 4.5],
  ['Destructive text on its muted fill', '#ff7aa2', '#3a1228', 4.5],
  ['Success text on its muted fill', '#3fb68b', '#12302b', 4.5],
  ['Warning text on its muted fill', '#e5a93d', '#352a16', 4.5],
  ['Info text on its muted fill', '#5aa9f0', '#14263d', 4.5],
  ['Highlighted variable', '#ff958c', '#3a1620', 4.5],
  ['Input border on card (UI, 3:1)', '#3b3253', '#181229', 3],
  ['Coral focus ring on background (UI, 3:1)', '#f0645b', '#0f0920', 3],
]

const SWATCHES = ['background', 'card', 'muted', 'border', 'primary', 'destructive', 'success', 'warning', 'info', 'chart-1', 'chart-2', 'chart-3', 'chart-4', 'chart-5']
const SCALE: [string, string, string][] = [
  ['24 / 600', 'text-2xl font-semibold', 'Hero numbers only'],
  ['20 / 600', 'text-xl font-semibold', 'Page titles'],
  ['16 / 600', 'text-base font-semibold', 'Section titles'],
  ['14 / 400', 'text-sm', 'Body text, the default'],
  ['13 / 400', 'text-[13px]', 'Dense table text'],
  ['12 / 400', 'text-xs', 'Captions and table meta'],
]

export function Styleguide() {
  return (
    <>
      <PageHeader title="Styleguide" description="Forward navy and coral, Outfit, scaled for a dense dashboard. Dark mode only." />
      <div className="space-y-10">
        <section aria-labelledby="sg-colors">
          <h2 id="sg-colors" className="mb-3 text-base font-semibold">Colors</h2>
          <ul className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            {SWATCHES.map((s) => (
              <li key={s}><div className="h-12 rounded-md border" style={{ background: `var(--${s})` }} /><p className="mt-1 text-xs">{s}</p></li>
            ))}
          </ul>
        </section>

        <section aria-labelledby="sg-contrast">
          <h2 id="sg-contrast" className="mb-1 text-base font-semibold">Contrast checks</h2>
          <p className="text-muted-foreground mb-3">Calculated live from the hex values. Text needs 4.5:1, interface parts 3:1. The white-on-coral row fails on purpose: it is why primary buttons use navy text.</p>
          <div className="border-border rounded-lg border">
            <Table>
              <TableHeader><TableRow><TableHead>Pair</TableHead><TableHead>Sample</TableHead><TableHead>Ratio</TableHead><TableHead>Needs</TableHead><TableHead>Result</TableHead></TableRow></TableHeader>
              <TableBody>
                {PAIRS.map(([name, fg, bg, need]) => {
                  const r = ratio(fg, bg)
                  const ok = r >= need
                  return (
                    <TableRow key={name}>
                      <TableCell>{name}</TableCell>
                      <TableCell><span className="rounded px-2 py-0.5 text-[13px]" style={{ color: fg, background: bg, border: '1px solid var(--border)' }}>Aa sample</span></TableCell>
                      <TableCell className="num">{r.toFixed(1)}:1</TableCell>
                      <TableCell className="num">{need}:1</TableCell>
                      <TableCell>{ok ? <Pill tone="success" icon={<Check aria-hidden />}>Passes</Pill> : <Pill tone="danger" icon={<X aria-hidden />}>Fails</Pill>}</TableCell>
                    </TableRow>
                  )
                })}
              </TableBody>
            </Table>
          </div>
        </section>

        <section aria-labelledby="sg-type">
          <h2 id="sg-type" className="mb-3 text-base font-semibold">Type scale</h2>
          <ul className="divide-y rounded-lg border">
            {SCALE.map(([k, cls, use]) => (
              <li key={k} className="flex items-baseline gap-4 px-4 py-3"><span className="text-muted-foreground w-20 shrink-0 text-xs">{k}</span><span className={cls}>Northwind Labs HR assistant</span><span className="text-muted-foreground ml-auto hidden text-xs sm:block">{use}</span></li>
            ))}
            <li className="flex items-baseline gap-4 px-4 py-3"><span className="text-muted-foreground w-20 shrink-0 text-xs">Numbers</span><span className="num text-base">0123456789 · 38 people · 12 Nov</span><span className="text-muted-foreground ml-auto hidden text-xs sm:block">Outfit has no tabular figures, so numbers use a mono face</span></li>
          </ul>
        </section>

        <section aria-labelledby="sg-ctl" className="space-y-4">
          <h2 id="sg-ctl" className="text-base font-semibold">Controls</h2>
          <div className="flex flex-wrap items-center gap-2">
            <Button>Primary action</Button><Button variant="secondary">Secondary</Button><Button variant="outline">Outline</Button><Button variant="ghost">Ghost</Button><Button variant="destructive">Delete workflow</Button><Button disabled>Disabled</Button>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <Pill tone="success">Live</Pill><Pill tone="warning">Paused</Pill><Pill tone="info">Waiting for response</Pill><Pill tone="danger">Failed</Pill><Pill tone="neutral">Draft</Pill><Badge>Badge</Badge><Badge variant="outline">Outline</Badge>
          </div>
          <div className="grid max-w-xl gap-4 sm:grid-cols-2">
            <div className="space-y-2"><Label htmlFor="sg-in">Text field</Label><Input id="sg-in" placeholder="Placeholder" /></div>
            <div className="space-y-2"><Label htmlFor="sg-in2">Invalid field</Label><Input id="sg-in2" aria-invalid defaultValue="not an email" /><p className="text-destructive-soft text-xs">Enter an email like name@company.com.</p></div>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <Card><CardHeader><CardTitle>Card</CardTitle><CardDescription>Surfaces use color steps and borders, not heavy shadows.</CardDescription></CardHeader><CardContent>Body text at 14px.</CardContent></Card>
            <Dialog>
              <div className="flex items-start"><DialogTrigger asChild><Button variant="outline">Open a dialog</Button></DialogTrigger></div>
              <DialogContent>
                <DialogHeader><DialogTitle>Dialog</DialogTitle><DialogDescription>Focus is trapped inside. Esc closes it.</DialogDescription></DialogHeader>
                <DialogBody><p>Dialog body.</p></DialogBody>
                <DialogFooter><Button>Done</Button></DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </section>
      </div>
    </>
  )
}
