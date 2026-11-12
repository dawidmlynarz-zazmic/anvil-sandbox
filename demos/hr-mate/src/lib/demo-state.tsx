import { createContext, useContext, useEffect, useMemo, useReducer, type Dispatch, type ReactNode } from 'react'
import { NOW } from '@/lib/dates'
import {
  APPROVALS,
  ASSISTANT_SETTINGS,
  CHAT_QUESTIONS,
  COLLECTIONS,
  EMPLOYEES,
  FILES,
  INTEGRATIONS,
  INVITES,
  OWNER,
  TEAM,
  WORKSPACE,
  establishedIntegrations,
  freshAssistantSettings,
} from '@/mocks/seed'
import { WORKFLOWS, makeRuns } from '@/mocks/workflows'
import type {
  Approval,
  AssistantSettings,
  ChatQuestion,
  Collection,
  Employee,
  Integration,
  IntegrationId,
  Invite,
  KnowledgeFile,
  Run,
  SetupStatus,
  SetupStepId,
  TeamMember,
  TeamRole,
  Workflow,
  WorkflowStatus,
  WorkspaceSettings,
} from '@/mocks/types'

export type DemoMode = 'fresh' | 'established'
export type ListMode = 'normal' | 'loading' | 'empty' | 'error'

export interface DemoState {
  mode: DemoMode
  listMode: ListMode
  integrations: Integration[]
  collections: Collection[]
  files: KnowledgeFile[]
  workflows: Workflow[]
  runs: Run[]
  approvals: Approval[]
  questions: ChatQuestion[]
  team: TeamMember[]
  invites: Invite[]
  assistant: AssistantSettings
  workspace: WorkspaceSettings
  setup: Record<SetupStepId, SetupStatus>
  setupSeen: boolean
  setupCollapsed: boolean
  testsAsked: number
  notifRead: boolean
}

export const SETUP_STEPS: SetupStepId[] = ['directory', 'knowledge', 'test', 'workflow', 'team']

const allSetup = (s: SetupStatus): Record<SetupStepId, SetupStatus> => ({ directory: s, knowledge: s, test: s, workflow: s, team: s })

const base = { listMode: 'normal' as ListMode, notifRead: false, setupCollapsed: false, testsAsked: 0 }

export function freshState(): DemoState {
  return {
    ...base,
    mode: 'fresh',
    integrations: INTEGRATIONS.map((i) => ({ ...i })),
    collections: [],
    files: [],
    workflows: [],
    runs: [],
    approvals: [],
    questions: [],
    team: [OWNER],
    invites: [],
    assistant: freshAssistantSettings(),
    workspace: { ...WORKSPACE },
    setup: allSetup('todo'),
    setupSeen: false,
  }
}

export function establishedState(): DemoState {
  return {
    ...base,
    mode: 'established',
    integrations: establishedIntegrations(),
    collections: COLLECTIONS.map((c) => ({ ...c })),
    files: FILES.map((f) => ({ ...f })),
    workflows: WORKFLOWS.map((w) => ({ ...w })),
    runs: makeRuns(),
    approvals: APPROVALS.map((a) => ({ ...a })),
    questions: CHAT_QUESTIONS.map((q) => ({ ...q })),
    team: TEAM.map((t) => ({ ...t })),
    invites: INVITES.map((i) => ({ ...i })),
    assistant: { ...ASSISTANT_SETTINGS },
    workspace: { ...WORKSPACE },
    setup: allSetup('done'),
    setupSeen: true,
  }
}

export type Action =
  | { type: 'switchMode'; mode: DemoMode }
  | { type: 'reset' }
  | { type: 'setListMode'; mode: ListMode }
  | { type: 'connect'; id: IntegrationId }
  | { type: 'resolveMapping'; id: IntegrationId; field: string; chosen: string }
  | { type: 'syncNow'; id: IntegrationId }
  | { type: 'disconnect'; id: IntegrationId }
  | { type: 'addCollection'; collection: Collection }
  | { type: 'addFile'; file: KnowledgeFile }
  | { type: 'setFileStatus'; id: string; status: KnowledgeFile['status'] }
  | { type: 'removeFile'; id: string }
  | { type: 'saveWorkflow'; workflow: Workflow }
  | { type: 'deleteWorkflow'; id: string }
  | { type: 'setWorkflowStatus'; id: string; status: WorkflowStatus }
  | { type: 'addRun'; run: Run }
  | { type: 'resolveRuns'; ids: string[] }
  | { type: 'resolveApproval'; id: string }
  | { type: 'resolveQuestion'; id: string }
  | { type: 'invite'; invite: Invite }
  | { type: 'revokeInvite'; id: string }
  | { type: 'setRole'; id: string; role: TeamRole }
  | { type: 'removeMember'; id: string }
  | { type: 'setAssistant'; patch: Partial<AssistantSettings> }
  | { type: 'setWorkspace'; patch: Partial<WorkspaceSettings> }
  | { type: 'setStep'; step: SetupStepId; status: SetupStatus }
  | { type: 'finishSetup' }
  | { type: 'toggleSetupCollapsed' }
  | { type: 'markNotifRead' }
  | { type: 'testAsked' }

function reducer(s: DemoState, a: Action): DemoState {
  switch (a.type) {
    case 'switchMode':
      return a.mode === 'fresh' ? freshState() : establishedState()
    case 'reset':
      return s.mode === 'fresh' ? freshState() : establishedState()
    case 'setListMode':
      return { ...s, listMode: a.mode }
    case 'connect':
      return {
        ...s,
        integrations: s.integrations.map((i) =>
          i.id === a.id
            ? {
                ...i,
                status: i.mapping.some((m) => !m.source && !m.chosen) ? 'attention' : 'connected',
                lastSync: NOW.toISOString(),
                employeeCount: EMPLOYEES.length,
                problem: i.mapping.some((m) => !m.source && !m.chosen) ? (() => { const n = i.mapping.filter((m) => !m.source && !m.chosen).length; return n === 1 ? "1 field isn't mapped yet." : `${n} fields aren't mapped yet.` })() : undefined,
              }
            : i,
        ),
      }
    case 'resolveMapping':
      return {
        ...s,
        integrations: s.integrations.map((i) => {
          if (i.id !== a.id) return i
          const mapping = i.mapping.map((m) => (m.field === a.field ? { ...m, chosen: a.chosen } : m))
          const open = mapping.filter((m) => !m.source && !m.chosen).length
          const connected = i.status !== 'not_connected'
          return { ...i, mapping, status: connected ? (open ? 'attention' : 'connected') : i.status, problem: connected && open ? i.problem : undefined }
        }),
      }
    case 'syncNow':
      return { ...s, integrations: s.integrations.map((i) => (i.id === a.id ? { ...i, lastSync: NOW.toISOString() } : i)) }
    case 'disconnect':
      return {
        ...s,
        integrations: s.integrations.map((i) =>
          i.id === a.id ? { ...i, status: 'not_connected', lastSync: null, employeeCount: 0, problem: undefined, mapping: INTEGRATIONS.find((x) => x.id === a.id)!.mapping } : i,
        ),
      }
    case 'addCollection':
      return { ...s, collections: [...s.collections, a.collection] }
    case 'addFile':
      return { ...s, files: [...s.files, a.file] }
    case 'setFileStatus':
      return { ...s, files: s.files.map((f) => (f.id === a.id ? { ...f, status: a.status, failReason: undefined } : f)) }
    case 'removeFile':
      return { ...s, files: s.files.filter((f) => f.id !== a.id) }
    case 'saveWorkflow':
      return s.workflows.some((w) => w.id === a.workflow.id)
        ? { ...s, workflows: s.workflows.map((w) => (w.id === a.workflow.id ? a.workflow : w)) }
        : { ...s, workflows: [...s.workflows, a.workflow] }
    case 'deleteWorkflow':
      return { ...s, workflows: s.workflows.filter((w) => w.id !== a.id) }
    case 'setWorkflowStatus':
      return { ...s, workflows: s.workflows.map((w) => (w.id === a.id ? { ...w, status: a.status } : w)) }
    case 'addRun':
      return { ...s, runs: [a.run, ...s.runs] }
    case 'resolveRuns':
      return { ...s, runs: s.runs.map((r) => (a.ids.includes(r.id) ? { ...r, status: 'succeeded', summary: 'Retried and sent.', cause: undefined, rawError: undefined, resolved: true } : r)) }
    case 'resolveApproval':
      return { ...s, approvals: s.approvals.filter((x) => x.id !== a.id) }
    case 'resolveQuestion':
      return { ...s, questions: s.questions.map((q) => (q.id === a.id ? { ...q, resolved: true } : q)) }
    case 'invite':
      return { ...s, invites: [...s.invites, a.invite] }
    case 'revokeInvite':
      return { ...s, invites: s.invites.filter((i) => i.id !== a.id) }
    case 'setRole':
      return { ...s, team: s.team.map((t) => (t.id === a.id ? { ...t, role: a.role } : t)) }
    case 'removeMember':
      return { ...s, team: s.team.filter((t) => t.id !== a.id) }
    case 'setAssistant':
      return { ...s, assistant: { ...s.assistant, ...a.patch } }
    case 'setWorkspace':
      return { ...s, workspace: { ...s.workspace, ...a.patch } }
    case 'setStep':
      return { ...s, setup: { ...s.setup, [a.step]: a.status } }
    case 'finishSetup':
      return { ...s, setupSeen: true }
    case 'toggleSetupCollapsed':
      return { ...s, setupCollapsed: !s.setupCollapsed }
    case 'markNotifRead':
      return { ...s, notifRead: true }
    case 'testAsked':
      return { ...s, testsAsked: s.testsAsked + 1 }
  }
}

const KEY = 'hr-mate:demo:v1'

function load(): DemoState {
  try {
    const raw = sessionStorage.getItem(KEY)
    if (raw) return { ...JSON.parse(raw), listMode: 'normal' } as DemoState
  } catch {
    // Without storage the demo simply starts from the seed on each load.
  }
  return freshState()
}

interface Ctx {
  state: DemoState
  dispatch: Dispatch<Action>
  employees: Employee[]
}

const DemoContext = createContext<Ctx | null>(null)

export function DemoProvider({ children }: { children: ReactNode }) {
  const [state, dispatch] = useReducer(reducer, undefined, load)
  useEffect(() => {
    try {
      sessionStorage.setItem(KEY, JSON.stringify(state))
    } catch {
      // Not persisting is fine.
    }
  }, [state])
  const synced = state.integrations.some((i) => i.status !== 'not_connected' && i.employeeCount > 0)
  const employees = useMemo(() => (synced ? EMPLOYEES : []), [synced])
  const value = useMemo(() => ({ state, dispatch, employees }), [state, employees])
  return <DemoContext.Provider value={value}>{children}</DemoContext.Provider>
}

export function useDemo() {
  const ctx = useContext(DemoContext)
  if (!ctx) throw new Error('useDemo must be used inside DemoProvider')
  return ctx
}

export const setupDoneCount = (s: DemoState) => SETUP_STEPS.filter((k) => s.setup[k] !== 'todo').length
export const setupComplete = (s: DemoState) => setupDoneCount(s) === SETUP_STEPS.length
