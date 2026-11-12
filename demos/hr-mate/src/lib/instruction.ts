import { COMPANY } from '@/mocks/seed'
import { STEP_TYPES } from '@/mocks/workflows'
import type { Workflow } from '@/mocks/types'
import { describeAudience } from './audience'
import { describeSchedule, toCron } from './schedule'

/** What the guided form assembles behind the scenes: the same free-text instruction the current product asks people to write. */
export function buildInstruction(w: Workflow): string {
  const steps = w.steps.map((s, i) => `  ${i + 1}. ${STEP_TYPES[s.type].label}: ${s.text || '(empty)'}`).join('\n')
  return [
    `You are HR Mate, the HR assistant at ${COMPANY}.`,
    `TASK: ${w.name || 'Untitled workflow'}. ${w.description}`,
    `WHEN: ${describeSchedule(w.schedule)}   [schedule: ${toCron(w.schedule)} @ ${w.schedule.timezone}]`,
    `WHO: ${describeAudience(w.audience)}`,
    `STEPS:\n${steps}`,
    'RULES: Use plain, friendly language. Never include salary or personal data about other people. If a recipient cannot be found or a field is missing, stop for that person and report the failure.',
  ].join('\n')
}

export const VARIABLES = ['employee.first_name', 'employee.name', 'manager.first_name', 'manager.name', 'hr_manager.name', 'trial_end_date', 'start_date']
