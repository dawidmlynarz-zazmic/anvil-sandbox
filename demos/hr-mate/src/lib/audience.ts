import { NOW, diffDays, parseDay } from './dates'
import type { AudienceRule, Employee, EmployeeStatus } from '@/mocks/types'

export const STATUS_LABEL: Record<EmployeeStatus, string> = {
  trial: 'On trial',
  active: 'Active',
  bench: 'On bench',
  inactive: 'Inactive',
}

export const emptyAudience = (): AudienceRule => ({
  statuses: [],
  departments: [],
  managers: [],
  dateRule: null,
  excludeStatuses: ['inactive'],
})

function matchesDate(e: Employee, rule: NonNullable<AudienceRule['dateRule']>): boolean {
  const value = e[rule.field]
  if (!value) return false
  const date = parseDay(value)
  if (rule.direction === 'anniversary') {
    const years = NOW.getFullYear() - date.getFullYear()
    if (years < 1) return false
    const next = new Date(NOW.getFullYear(), date.getMonth(), date.getDate(), 12)
    const d = diffDays(NOW, next)
    return d >= 0 && d <= rule.days
  }
  const d = diffDays(NOW, date)
  return rule.direction === 'next' ? d >= 0 && d <= rule.days : d <= 0 && d >= -rule.days
}

export function matchAudience(rule: AudienceRule, people: Employee[]): Employee[] {
  return people.filter((e) => {
    if (rule.excludeStatuses.includes(e.status)) return false
    if (rule.statuses.length && !rule.statuses.includes(e.status)) return false
    if (rule.departments.length && !rule.departments.includes(e.department)) return false
    if (rule.managers.length && !rule.managers.includes(e.manager)) return false
    if (rule.dateRule && !matchesDate(e, rule.dateRule)) return false
    return true
  })
}

export function describeDateRule(rule: NonNullable<AudienceRule['dateRule']>): string {
  const what = rule.field === 'trialEndDate' ? 'Trial ends' : 'Start date'
  if (rule.direction === 'anniversary') return `Work anniversary in the next ${rule.days} days`
  if (rule.direction === 'next') return `${what} in the next ${rule.days} days`
  return `${what} in the last ${rule.days} days`
}

export function describeAudience(rule: AudienceRule): string {
  const parts: string[] = []
  parts.push(rule.statuses.length ? rule.statuses.map((s) => STATUS_LABEL[s].toLowerCase()).join(' or ') + ' employees' : 'All employees')
  if (rule.departments.length) parts.push(`in ${rule.departments.join(', ')}`)
  if (rule.managers.length) parts.push(`reporting to ${rule.managers.join(', ')}`)
  if (rule.dateRule) parts.push(`where ${describeDateRule(rule.dateRule).toLowerCase()}`)
  const base = parts.join(' ')
  const ex = rule.excludeStatuses.filter((s) => !rule.statuses.length || rule.statuses.includes(s))
  const text = ex.length ? `${base}, excluding ${ex.map((s) => STATUS_LABEL[s].toLowerCase()).join(' and ')}` : base
  return text.charAt(0).toUpperCase() + text.slice(1)
}
