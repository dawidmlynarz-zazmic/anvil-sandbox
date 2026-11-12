import { NOW, addDays } from '@/lib/dates'
import { emptyAudience } from '@/lib/audience'
import type { FailureCause, Run, RunStatus, Stage, Workflow, WorkflowStep } from './types'

export const STAGES: { id: Stage; label: string; blurb: string }[] = [
  { id: 'onboarding', label: 'Onboarding', blurb: 'Help new hires land well in their first weeks.' },
  { id: 'trial', label: 'Trial', blurb: 'Collect feedback and decide on trial outcomes.' },
  { id: 'performance', label: 'Performance', blurb: 'Regular check-ins and goals.' },
  { id: 'engagement', label: 'Engagement', blurb: 'Keep the team connected and heard.' },
  { id: 'offboarding', label: 'Offboarding', blurb: 'Make exits smooth and collect learnings.' },
  { id: 'reminders', label: 'Reminders', blurb: 'Nudges that save HR from chasing people.' },
]

export const STEP_TYPES: Record<WorkflowStep['type'], { label: string; hint: string }> = {
  chat_message: { label: 'Send a Chat message', hint: 'Sends a direct message in Google Chat.' },
  email: { label: 'Send an email', hint: 'Sends an email from your HR address.' },
  form: { label: 'Ask them to fill a form', hint: 'Shares a short form in Chat and collects the answers.' },
  approval: { label: 'Ask for approval', hint: 'Sends an approve or request-changes card and waits for the answer.' },
  notify_hr: { label: 'Notify the HR manager', hint: 'Tells the employee’s HR manager what happened.' },
}

let stepN = 0
const step = (type: WorkflowStep['type'], text: string): WorkflowStep => ({ id: `s${++stepN}`, type, text })

const WARSAW = 'Europe/Warsaw'

export const WORKFLOWS: Workflow[] = [
  {
    id: 'wf-welcome',
    name: 'Welcome message on day one',
    description: 'Greets new hires on their first day and points them to the first-week checklist.',
    stage: 'onboarding',
    status: 'live',
    schedule: { kind: 'event', time: '09:00', timezone: WARSAW, event: 'new_hire_added' },
    audience: { ...emptyAudience(), statuses: ['trial'], dateRule: { field: 'startDate', direction: 'last', days: 1 } },
    channel: 'chat',
    steps: [step('chat_message', 'Welcome to Northwind Labs, {{employee.first_name}}! I’m HR Mate. {{manager.name}} will meet you at 10:00. Your first-week checklist is here: {{links.checklist}}')],
  },
  {
    id: 'wf-week1',
    name: 'Week-one check-in',
    description: 'Asks new hires how their first week is going and flags problems to HR.',
    stage: 'onboarding',
    status: 'live',
    schedule: { kind: 'weekdays', time: '10:00', timezone: WARSAW },
    audience: { ...emptyAudience(), statuses: ['trial'], dateRule: { field: 'startDate', direction: 'last', days: 7 } },
    channel: 'chat',
    steps: [
      step('chat_message', 'Hi {{employee.first_name}}, how is your first week going? Reply with anything that is unclear or missing.'),
      step('notify_hr', 'Tell {{hr_manager.name}} if the answer mentions a problem.'),
    ],
  },
  {
    id: 'wf-docs',
    name: 'Collect onboarding documents',
    description: 'Emails new hires a list of documents to send before their start date.',
    stage: 'onboarding',
    status: 'draft',
    schedule: { kind: 'event', time: '09:00', timezone: WARSAW, event: 'new_hire_added' },
    audience: { ...emptyAudience(), statuses: ['trial'], dateRule: { field: 'startDate', direction: 'next', days: 14 } },
    channel: 'email',
    steps: [step('email', 'Hi {{employee.first_name}}, please send us the documents listed below before {{start_date}}.'), step('form', 'Onboarding documents form')],
  },
  {
    id: 'wf-midtrial',
    name: 'Mid-trial feedback request',
    description: 'Asks the manager and the new hire for feedback halfway through the trial.',
    stage: 'trial',
    status: 'live',
    schedule: { kind: 'weekdays', time: '09:00', timezone: WARSAW },
    audience: { ...emptyAudience(), statuses: ['trial'], dateRule: { field: 'trialEndDate', direction: 'next', days: 50 } },
    channel: 'chat',
    steps: [step('chat_message', 'Hi {{manager.first_name}}, {{employee.name}} is halfway through the trial. Please share quick feedback: {{links.feedback_form}}')],
  },
  {
    id: 'wf-trial-end',
    name: 'End-of-trial review',
    description: 'Collects manager feedback 7 days before a trial ends, then asks the HR manager to approve the outcome.',
    stage: 'trial',
    status: 'live',
    schedule: { kind: 'weekdays', time: '09:00', timezone: WARSAW },
    audience: { ...emptyAudience(), statuses: ['trial'], dateRule: { field: 'trialEndDate', direction: 'next', days: 7 } },
    channel: 'chat',
    steps: [
      step('chat_message', 'Hi {{manager.first_name}}, {{employee.name}}’s trial ends on {{trial_end_date}}. Please complete the review: {{links.review_form}}'),
      step('approval', 'Do you approve continuing {{employee.name}}’s employment after the trial?'),
    ],
  },
  {
    id: 'wf-trial-outcome',
    name: 'Trial outcome follow-up',
    description: 'When a trial review is submitted, tells the HR manager and the employee what happens next.',
    stage: 'trial',
    status: 'live',
    schedule: { kind: 'event', time: '09:00', timezone: WARSAW, event: 'trial_review_submitted' },
    audience: { ...emptyAudience(), statuses: ['trial'] },
    channel: 'chat',
    steps: [step('approval', 'Review the trial outcome for {{employee.name}}.'), step('notify_hr', 'Share the decision with {{hr_manager.name}}.')],
  },
  {
    id: 'wf-quarterly',
    name: 'Monthly goals check-in',
    description: 'Prompts every active employee to update goals and note anything blocking them.',
    stage: 'performance',
    status: 'live',
    schedule: { kind: 'monthly', time: '09:00', timezone: WARSAW, dayOfMonth: 1 },
    audience: { ...emptyAudience(), statuses: ['active'] },
    channel: 'chat',
    steps: [step('chat_message', 'Hi {{employee.first_name}}, time for the monthly goals check-in. It takes 3 minutes: {{links.goals_form}}')],
  },
  {
    id: 'wf-anniversary',
    name: 'Work anniversary greeting',
    description: 'Sends a short thank-you on each work anniversary and copies the manager.',
    stage: 'engagement',
    status: 'live',
    schedule: { kind: 'daily', time: '09:00', timezone: WARSAW },
    audience: { ...emptyAudience(), statuses: ['active'], dateRule: { field: 'startDate', direction: 'anniversary', days: 7 } },
    channel: 'chat',
    steps: [step('chat_message', 'Happy work anniversary, {{employee.first_name}}! Thank you for {{years}} years at Northwind Labs.')],
  },
  {
    id: 'wf-pulse',
    name: 'Weekly pulse survey',
    description: 'Asks everyone one question about how the week feels and summarises the answers for HR.',
    stage: 'engagement',
    status: 'live',
    schedule: { kind: 'weekly', time: '10:00', timezone: WARSAW, weekday: 1 },
    audience: { ...emptyAudience(), statuses: ['active', 'trial'] },
    channel: 'chat',
    steps: [step('form', 'How are you feeling about work this week? (1 to 5)')],
  },
  {
    id: 'wf-exit',
    name: 'Exit interview invite',
    description: 'Invites leavers to a short exit interview once their exit date is set.',
    stage: 'offboarding',
    status: 'paused',
    schedule: { kind: 'event', time: '09:00', timezone: WARSAW, event: 'exit_date_set' },
    audience: { ...emptyAudience(), statuses: ['active', 'bench'] },
    channel: 'email',
    steps: [step('email', 'Hi {{employee.first_name}}, we would value 20 minutes of your time for an exit conversation.')],
  },
  {
    id: 'wf-timesheet',
    name: 'Timesheet reminder',
    description: 'Reminds people to submit timesheets before the weekend.',
    stage: 'reminders',
    status: 'live',
    schedule: { kind: 'weekly', time: '15:00', timezone: WARSAW, weekday: 5 },
    audience: { ...emptyAudience(), statuses: ['active', 'trial'] },
    channel: 'chat',
    steps: [step('chat_message', 'Friendly reminder, {{employee.first_name}}: please submit your timesheet today.')],
  },
  {
    id: 'wf-bench',
    name: 'Bench status check-in',
    description: 'Checks in with people on the bench and tells the HR manager about their availability.',
    stage: 'reminders',
    status: 'paused',
    schedule: { kind: 'weekly', time: '11:00', timezone: WARSAW, weekday: 3 },
    audience: { ...emptyAudience(), statuses: ['bench'] },
    channel: 'chat',
    steps: [step('chat_message', 'Hi {{employee.first_name}}, any news on your next project? Tell me what you would like to work on.'), step('notify_hr', 'Send availability to {{hr_manager.name}}.')],
  },
]

export const workflowName = (id: string, list: Workflow[] = WORKFLOWS) => list.find((w) => w.id === id)?.name ?? 'Deleted workflow'

export const FAILURE_CAUSES: Record<
  FailureCause,
  { title: string; explain: string; fix: string; action: { label: string; to?: string; retry?: boolean } }
> = {
  missing_field: {
    title: 'An HR field is missing',
    explain: "HR Mate needs a value that isn't filled in for some people, such as the trial end date, so it couldn't send the message.",
    fix: 'Map the field in your HR system or fill it in for the people affected, then retry.',
    action: { label: 'Fix field mapping', to: '/connections' },
  },
  recipient_not_found: {
    title: 'Person not found in Google Chat',
    explain: "HR Mate couldn't find these people in Google Chat. This usually means their work email in the directory differs from their Google account.",
    fix: 'Check the work email of each person, then retry.',
    action: { label: 'Review people', to: '/people' },
  },
  timed_out: {
    title: "Google Chat didn't respond in time",
    explain: 'Sending took longer than 30 seconds. This is usually a short slowdown on the Google side.',
    fix: 'Retry the runs. If it keeps happening, check the Google Workspace status page.',
    action: { label: 'Retry failed runs', retry: true },
  },
  space_unavailable: {
    title: 'Chat space is unavailable',
    explain: 'The Google Chat space HR Mate posts in is archived, or HR Mate was removed from it.',
    fix: 'Add HR Mate back to the space, or choose another space in the workspace settings.',
    action: { label: 'Check workspace settings', to: '/settings/workspace' },
  },
}

const RAW: Record<FailureCause, (n: number, wf: string) => string> = {
  missing_field: (n, wf) => `ValidationError: field "trial_end_date" is null for ${n} recipient(s)\n  workflow=${wf} source=zoho_people last_sync=2026-11-12T06:00:00Z`,
  recipient_not_found: (n, wf) => `ChatApiError 404 NOT_FOUND: user lookup failed for ${n} recipient(s)\n  workflow=${wf} domain=northwind-labs.example`,
  timed_out: (_n, wf) => `TimeoutError: step "send_chat_message" exceeded 30000ms (attempt 3/3)\n  workflow=${wf}`,
  space_unavailable: (_n, wf) => `ChatApiError 403 PERMISSION_DENIED: space is archived or the app was removed\n  workflow=${wf}`,
}

const SUMMARY: Record<FailureCause, (n: number) => string> = {
  missing_field: (n) => `Couldn't send to ${n} ${n === 1 ? 'person' : 'people'}: the trial end date is missing.`,
  recipient_not_found: (n) => `Couldn't find ${n} ${n === 1 ? 'person' : 'people'} in Google Chat.`,
  timed_out: () => "Google Chat didn't respond in time, so nothing was sent.",
  space_unavailable: () => "The Chat space is unavailable, so nothing was sent.",
}

// Index in the 60-run history -> failure. Workflows are chosen so each cause makes sense.
const FAILS: Record<number, [FailureCause, string]> = {
  3: ['missing_field', 'wf-trial-end'],
  24: ['missing_field', 'wf-midtrial'],
  11: ['recipient_not_found', 'wf-welcome'],
  41: ['recipient_not_found', 'wf-pulse'],
  56: ['recipient_not_found', 'wf-week1'],
  17: ['timed_out', 'wf-timesheet'],
  49: ['timed_out', 'wf-pulse'],
  33: ['space_unavailable', 'wf-anniversary'],
}
const SKIPPED = new Set([7, 29, 52])
const WAITING: Record<number, string> = { 0: 'wf-trial-end', 1: 'wf-trial-outcome' }
const LIVE = WORKFLOWS.filter((w) => w.status === 'live')

export function makeRuns(): Run[] {
  const runs: Run[] = []
  for (let i = 0; i < 60; i++) {
    const startedAt = addDays(NOW, -(i * 5 + (i % 3) * 2 + 1) / 24).toISOString()
    const recipients = (i * 7) % 6 + 1
    let workflowId = LIVE[i % LIVE.length].id
    let status: RunStatus = 'succeeded'
    let summary = `Sent to ${recipients} ${recipients === 1 ? 'person' : 'people'}.`
    let cause: FailureCause | undefined
    let rawError: string | undefined
    if (FAILS[i]) {
      const [c, wf] = FAILS[i]
      workflowId = wf
      status = 'failed'
      cause = c
      summary = SUMMARY[c](recipients)
      rawError = RAW[c](recipients, wf)
    } else if (SKIPPED.has(i)) {
      status = 'skipped'
      summary = 'Nobody matched the audience, so nothing was sent.'
    } else if (WAITING[i]) {
      workflowId = WAITING[i]
      status = 'waiting'
      summary = `Waiting for ${recipients} ${recipients === 1 ? 'answer' : 'answers'} from managers.`
    }
    runs.push({ id: `run-${String(60 - i).padStart(3, '0')}`, workflowId, startedAt, status, recipients: status === 'skipped' ? 0 : recipients, summary, cause, rawError })
  }
  return runs
}

export const failureSummary = SUMMARY
export const failureRaw = RAW
