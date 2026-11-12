// Fictional data only. Company: Northwind Labs, an IT services firm. Dates are ISO strings so state serialises cleanly.

export type EmployeeStatus = 'trial' | 'active' | 'bench' | 'inactive'

export interface Employee {
  id: string
  name: string
  initials: string
  email: string
  role: string
  department: string
  manager: string
  hrManager: string
  status: EmployeeStatus
  startDate: string // YYYY-MM-DD
  trialEndDate: string | null
  timezone: string
}

export type TeamRole = 'owner' | 'admin' | 'hr_manager' | 'viewer'

export interface TeamMember {
  id: string
  name: string
  initials: string
  email: string
  role: TeamRole
  lastActive: string
}

export interface Invite {
  id: string
  email: string
  role: TeamRole
  sentAt: string
}

export type IndexStatus = 'indexed' | 'indexing' | 'failed'
export type FileKind = 'pdf' | 'word' | 'sheet' | 'link'

export interface KnowledgeFile {
  id: string
  collectionId: string
  name: string
  kind: FileKind
  sizeKb: number | null
  owner: string
  updatedAt: string
  status: IndexStatus
  failReason?: string
}

export interface Collection {
  id: string
  name: string
  description: string
  audience: string
  updatedAt: string
}

export type Stage = 'onboarding' | 'trial' | 'performance' | 'engagement' | 'offboarding' | 'reminders'
export type WorkflowStatus = 'live' | 'paused' | 'draft'
export type Channel = 'chat' | 'email'
export type ScheduleKind = 'once' | 'daily' | 'weekdays' | 'weekly' | 'monthly' | 'event'
export type EventKey = 'new_hire_added' | 'trial_review_submitted' | 'exit_date_set' | 'form_submitted'

export interface Schedule {
  kind: ScheduleKind
  time: string // HH:mm
  timezone: string
  weekday?: number // 0 = Sunday
  dayOfMonth?: number
  date?: string // YYYY-MM-DD, for once
  event?: EventKey
}

export interface DateRule {
  field: 'startDate' | 'trialEndDate'
  direction: 'next' | 'last' | 'anniversary'
  days: number
}

export interface AudienceRule {
  statuses: EmployeeStatus[]
  departments: string[]
  managers: string[]
  dateRule: DateRule | null
  excludeStatuses: EmployeeStatus[]
}

export type StepType = 'chat_message' | 'email' | 'form' | 'approval' | 'notify_hr'

export interface WorkflowStep {
  id: string
  type: StepType
  text: string // message body, form name or approval question. May hold {{variables}}.
}

export interface Workflow {
  id: string
  name: string
  description: string
  stage: Stage
  status: WorkflowStatus
  schedule: Schedule
  audience: AudienceRule
  channel: Channel
  steps: WorkflowStep[]
  instruction?: string // edited by an admin; otherwise assembled from the fields above
}

export type RunStatus = 'succeeded' | 'failed' | 'waiting' | 'skipped'
export type FailureCause = 'missing_field' | 'recipient_not_found' | 'timed_out' | 'space_unavailable'

export interface Run {
  id: string
  workflowId: string
  startedAt: string
  status: RunStatus
  recipients: number
  summary: string
  cause?: FailureCause
  rawError?: string
  resolved?: boolean
}

export interface Approval {
  id: string
  title: string
  employeeId: string
  workflowId: string
  dueAt: string
  summary: string
}

export interface ChatQuestion {
  id: string
  text: string
  askedBy: string
  askedAt: string
  topic: string
  answer?: string
  sources?: string[]
  resolved?: boolean
}

export interface FieldMapping {
  field: string
  source: string | null // the field name in the source system, null when not found
  why: string // plain explanation of what HR Mate uses it for
  chosen?: string // an alternative picked by the admin
}

export type IntegrationId = 'zoho' | 'google'
export type IntegrationStatus = 'connected' | 'not_connected' | 'attention'

export interface Integration {
  id: IntegrationId
  name: string
  blurb: string
  provides: string[]
  status: IntegrationStatus
  lastSync: string | null
  employeeCount: number
  problem?: string
  mapping: FieldMapping[]
}

export interface QuickLink {
  id: string
  title: string
  url: string
  audience: string
}

export interface AssistantSettings {
  greeting: string
  escalationKind: 'email' | 'space'
  escalationTarget: string
  quickLinks: QuickLink[]
  additionalInstructions: string
}

export interface WorkspaceSettings {
  name: string
  timezone: string
  chatSpace: string
  chatConnected: boolean
}

export type SetupStepId = 'directory' | 'knowledge' | 'test' | 'workflow' | 'team'
export type SetupStatus = 'todo' | 'done' | 'skipped'
