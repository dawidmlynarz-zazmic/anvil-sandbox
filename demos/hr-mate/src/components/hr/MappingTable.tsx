import { CheckCircle2, TriangleAlert } from 'lucide-react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table'
import { MAPPING_ALTERNATIVES } from '@/mocks/seed'
import type { Integration } from '@/mocks/types'
import { Pill } from './Pill'

/** Which HR fields were found in the connected system, with a plain reason for each missing one. */
export function MappingTable({ integration, onChoose }: { integration: Integration; onChoose: (field: string, chosen: string) => void }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>HR Mate needs</TableHead>
          <TableHead>Found in {integration.name} as</TableHead>
          <TableHead className="hidden md:table-cell">Why it matters</TableHead>
          <TableHead className="text-right">Status</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {integration.mapping.map((m) => {
          const found = Boolean(m.source)
          const resolved = !found && Boolean(m.chosen)
          return (
            <TableRow key={m.field}>
              <TableCell className="font-medium">{m.field}</TableCell>
              <TableCell>
                {found ? (
                  m.source
                ) : (
                  <Select value={m.chosen ?? ''} onValueChange={(v) => onChoose(m.field, v)}>
                    <SelectTrigger size="sm" className="w-56" aria-label={`Choose a source for ${m.field}`}>
                      <SelectValue placeholder="Choose where to find it" />
                    </SelectTrigger>
                    <SelectContent>
                      {(MAPPING_ALTERNATIVES[m.field] ?? ['Leave unmapped']).map((o) => (
                        <SelectItem key={o} value={o}>
                          {o}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                )}
              </TableCell>
              <TableCell className="text-muted-foreground hidden max-w-sm text-[13px] whitespace-normal md:table-cell">{m.why}</TableCell>
              <TableCell className="text-right">
                {found || resolved ? (
                  <Pill tone="success" icon={<CheckCircle2 aria-hidden />}>
                    {found ? 'Found' : 'Handled'}
                  </Pill>
                ) : (
                  <Pill tone="warning" icon={<TriangleAlert aria-hidden />}>
                    Not found
                  </Pill>
                )}
              </TableCell>
            </TableRow>
          )
        })}
      </TableBody>
    </Table>
  )
}
