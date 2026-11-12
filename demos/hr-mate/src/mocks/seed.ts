import { NOW, addDays, dayKey } from '@/lib/dates'
import type {
  Approval,
  AssistantSettings,
  ChatQuestion,
  Collection,
  Employee,
  EmployeeStatus,
  Integration,
  Invite,
  KnowledgeFile,
  TeamMember,
  WorkspaceSettings,
} from './types'

export const COMPANY = 'Northwind Labs'
export const DOMAIN = 'northwind-labs.example'

export const DEPARTMENTS = ['Engineering', 'Design', 'Product', 'Delivery', 'People & Ops', 'Finance', 'Sales']

const HEADS: Record<string, string> = {
  Engineering: 'Ingrid Solberg',
  Design: 'Mateo Vargas',
  Product: 'Hana Okafor',
  Delivery: 'Rhys Calder',
  'People & Ops': 'Noor Haddad',
  Finance: 'Selin Aydin',
  Sales: 'Tobias Lindqvist',
}

const HR_MANAGERS = ['Jonas Berg', 'Lucia Ferrer']

// name, department, role, status, start date as days from today (negative = in the past)
type Row = [string, string, string, EmployeeStatus, number]
const ROWS: Row[] = [
  ['Ingrid Solberg', 'Engineering', 'Head of Engineering', 'active', -1800],
  ['Mateo Vargas', 'Design', 'Head of Design', 'active', -1650],
  ['Hana Okafor', 'Product', 'Head of Product', 'active', -1500],
  ['Rhys Calder', 'Delivery', 'Head of Delivery', 'active', -1700],
  ['Noor Haddad', 'People & Ops', 'Head of People & Ops', 'active', -1400],
  ['Selin Aydin', 'Finance', 'Head of Finance', 'active', -1350],
  ['Tobias Lindqvist', 'Sales', 'Head of Sales', 'active', -1250],
  ['Kasper Nowell', 'Engineering', 'Frontend engineer', 'active', -900],
  ['Amara Obi', 'Engineering', 'Backend engineer', 'active', -1400],
  ['Lukas Brandt', 'Engineering', 'DevOps engineer', 'active', -600],
  ['Sana Qureshi', 'Engineering', 'QA engineer', 'active', -300],
  ['Emil Haugen', 'Engineering', 'Backend engineer', 'trial', -84],
  ['Yara Costa', 'Engineering', 'Frontend engineer', 'trial', -40],
  ['Dmitri Voss', 'Engineering', 'Data engineer', 'active', -500],
  ['Chloe Whitfield', 'Engineering', 'Backend engineer', 'bench', -700],
  ['Tomasz Lewin', 'Engineering', 'Mobile engineer', 'active', -725],
  ['Wen Zhao', 'Engineering', 'Backend engineer', 'trial', -9],
  ['Fatima Idris', 'Engineering', 'Frontend engineer', 'active', -1100],
  ['Oskar Lindgren', 'Engineering', 'Security engineer', 'bench', -400],
  ['Nia Barrow', 'Engineering', 'Software engineer', 'trial', 6],
  ['Livia Santoro', 'Design', 'Product designer', 'active', -820],
  ['Jun Park', 'Design', 'UX researcher', 'trial', -85],
  ['Elodie Marchand', 'Design', 'Visual designer', 'active', -200],
  ['Ravi Deshmukh', 'Design', 'Product designer', 'bench', -540],
  ['Maya Fernandez', 'Product', 'Product manager', 'active', -950],
  ['Gideon Asante', 'Product', 'Product analyst', 'trial', -60],
  ['Bea Kowalczyk', 'Product', 'Product manager', 'active', -150],
  ['Sven Aaltonen', 'Delivery', 'Project manager', 'active', -1000],
  ['Zainab Rahimi', 'Delivery', 'Delivery lead', 'active', -430],
  ['Marcus Doyle', 'Delivery', 'Project manager', 'trial', -86],
  ['Ines Carvalho', 'Delivery', 'Scrum master', 'active', -250],
  ['Pavel Horak', 'Delivery', 'Project manager', 'inactive', -1300],
  ['Leila Mansour', 'People & Ops', 'HR coordinator', 'active', -330],
  ['Callum Reid', 'People & Ops', 'Office manager', 'active', -780],
  ['Aiko Tanaka', 'People & Ops', 'Recruiter', 'trial', 12],
  ['Hugo Bellamy', 'Finance', 'Accountant', 'active', -610],
  ['Rosa Delgado', 'Finance', 'Finance analyst', 'active', -95],
  ['Anders Moe', 'Sales', 'Account executive', 'active', -470],
  ['Tessa Whitmore', 'Sales', 'Sales development rep', 'trial', -70],
  ['Karim Benali', 'Sales', 'Account executive', 'inactive', -900],
]

const TIMEZONES = ['Europe/Warsaw', 'Europe/Warsaw', 'Europe/London', 'Europe/Warsaw', 'America/New_York', 'Europe/Berlin']

const slug = (s: string) =>
  s
    .normalize('NFD')
    .replace(/[̀-ͯ]/g, '')
    .toLowerCase()
    .replace(/[^a-z]+/g, '.')

export const initialsOf = (name: string) =>
  name
    .split(' ')
    .map((p) => p[0])
    .slice(0, 2)
    .join('')
    .toUpperCase()

export const EMPLOYEES: Employee[] = ROWS.map(([name, department, role, status, offset], i) => {
  const start = addDays(NOW, offset)
  const isHead = HEADS[department] === name
  return {
    id: `emp-${String(i + 1).padStart(2, '0')}`,
    name,
    initials: initialsOf(name),
    email: `${slug(name)}@${DOMAIN}`,
    role,
    department,
    manager: isHead ? 'Alex Morgan' : HEADS[department],
    hrManager: HR_MANAGERS[i % 2],
    status,
    startDate: dayKey(start),
    trialEndDate: status === 'trial' ? dayKey(addDays(start, 90)) : null,
    timezone: TIMEZONES[i % TIMEZONES.length],
  }
})

export const MANAGERS = [...Object.values(HEADS)]

export const OWNER: TeamMember = {
  id: 'tm-1',
  name: 'Alex Morgan',
  initials: 'AM',
  email: `alex.morgan@${DOMAIN}`,
  role: 'owner',
  lastActive: NOW.toISOString(),
}

export const TEAM: TeamMember[] = [
  OWNER,
  { id: 'tm-2', name: 'Priya Raman', initials: 'PR', email: `priya.raman@${DOMAIN}`, role: 'admin', lastActive: addDays(NOW, -0.2).toISOString() },
  { id: 'tm-3', name: 'Jonas Berg', initials: 'JB', email: `jonas.berg@${DOMAIN}`, role: 'hr_manager', lastActive: addDays(NOW, -1).toISOString() },
  { id: 'tm-4', name: 'Lucia Ferrer', initials: 'LF', email: `lucia.ferrer@${DOMAIN}`, role: 'hr_manager', lastActive: addDays(NOW, -3).toISOString() },
  { id: 'tm-5', name: 'Tom Okafor', initials: 'TO', email: `tom.okafor@${DOMAIN}`, role: 'viewer', lastActive: addDays(NOW, -9).toISOString() },
]

export const INVITES: Invite[] = [
  { id: 'inv-1', email: `sam.ellery@${DOMAIN}`, role: 'hr_manager', sentAt: addDays(NOW, -2).toISOString() },
]

export const COLLECTIONS: Collection[] = [
  {
    id: 'col-policies',
    name: 'Company policies',
    description: 'Leave, remote work, expenses and benefits. The first place the assistant looks.',
    audience: 'Everyone',
    updatedAt: addDays(NOW, -2).toISOString(),
  },
  {
    id: 'col-onboarding',
    name: 'Onboarding guides',
    description: 'What new hires need in their first weeks: checklists, IT setup and who is who.',
    audience: 'New hires and HR team',
    updatedAt: addDays(NOW, -6).toISOString(),
  },
]

export const FILES: KnowledgeFile[] = [
  { id: 'f1', collectionId: 'col-policies', name: 'Employee handbook.pdf', kind: 'pdf', sizeKb: 2140, owner: 'Alex Morgan', updatedAt: addDays(NOW, -40).toISOString(), status: 'indexed' },
  { id: 'f2', collectionId: 'col-policies', name: 'Leave policy.pdf', kind: 'pdf', sizeKb: 310, owner: 'Jonas Berg', updatedAt: addDays(NOW, -12).toISOString(), status: 'indexed' },
  { id: 'f3', collectionId: 'col-policies', name: 'Remote work policy.docx', kind: 'word', sizeKb: 96, owner: 'Jonas Berg', updatedAt: addDays(NOW, -2).toISOString(), status: 'indexed' },
  { id: 'f4', collectionId: 'col-policies', name: 'Expense policy.pdf', kind: 'pdf', sizeKb: 420, owner: 'Lucia Ferrer', updatedAt: addDays(NOW, -25).toISOString(), status: 'indexed' },
  { id: 'f5', collectionId: 'col-policies', name: 'Benefits overview', kind: 'link', sizeKb: null, owner: 'Lucia Ferrer', updatedAt: addDays(NOW, -0.05).toISOString(), status: 'indexing' },
  { id: 'f6', collectionId: 'col-onboarding', name: 'First week checklist.docx', kind: 'word', sizeKb: 88, owner: 'Lucia Ferrer', updatedAt: addDays(NOW, -6).toISOString(), status: 'indexed' },
  { id: 'f7', collectionId: 'col-onboarding', name: 'IT setup guide.pdf', kind: 'pdf', sizeKb: 1260, owner: 'Alex Morgan', updatedAt: addDays(NOW, -30).toISOString(), status: 'indexed' },
  {
    id: 'f8',
    collectionId: 'col-onboarding',
    name: 'Org chart 2026.xlsx',
    kind: 'sheet',
    sizeKb: 210,
    owner: 'Jonas Berg',
    updatedAt: addDays(NOW, -1).toISOString(),
    status: 'failed',
    failReason: "This spreadsheet is password protected, so HR Mate can't read it. Remove the password and upload it again.",
  },
]

/** Files an admin can "upload" in the prototype. Names match what the answer bank cites. */
export const SAMPLE_FILES: Omit<KnowledgeFile, 'id' | 'collectionId' | 'owner' | 'updatedAt' | 'status'>[] = [
  { name: 'Employee handbook.pdf', kind: 'pdf', sizeKb: 2140 },
  { name: 'Leave policy.pdf', kind: 'pdf', sizeKb: 310 },
  { name: 'Remote work policy.docx', kind: 'word', sizeKb: 96 },
  { name: 'Expense policy.pdf', kind: 'pdf', sizeKb: 420 },
  { name: 'First week checklist.docx', kind: 'word', sizeKb: 88 },
  { name: 'IT setup guide.pdf', kind: 'pdf', sizeKb: 1260 },
]

export const INTEGRATIONS: Integration[] = [
  {
    id: 'zoho',
    name: 'Zoho People',
    blurb: 'Your HR system of record.',
    provides: ['Start dates, managers and employment status', 'Trial and probation dates', 'Departments and job titles'],
    status: 'not_connected',
    lastSync: null,
    employeeCount: 0,
    mapping: [
      { field: 'Name', source: 'Full name', why: 'Shown in messages and reports.' },
      { field: 'Work email', source: 'Work email', why: 'Used to find the person in Google Chat.' },
      { field: 'Department', source: 'Department', why: 'Lets you target workflows by team.' },
      { field: 'Job title', source: 'Job title', why: 'Shown in people lists and approvals.' },
      { field: 'Manager', source: 'Reporting to', why: 'Used to send feedback requests and approvals to the right person.' },
      { field: 'Start date', source: 'Date of joining', why: 'Triggers onboarding messages and anniversaries.' },
      { field: 'Employment status', source: 'Employee status', why: 'Separates trial, active, bench and inactive people.' },
      { field: 'Trial end date', source: null, why: 'Schedules the end-of-trial review 7 days before a trial ends. Without it, trial workflows skip these people.' },
    ],
  },
  {
    id: 'google',
    name: 'Google Workspace',
    blurb: 'Your company directory and Chat.',
    provides: ['Names, work emails and photos', 'Department, job title and manager', 'Google Chat, where HR Mate talks to people'],
    status: 'not_connected',
    lastSync: null,
    employeeCount: 0,
    mapping: [
      { field: 'Name', source: 'Name', why: 'Shown in messages and reports.' },
      { field: 'Work email', source: 'Primary email', why: 'Used to find the person in Google Chat.' },
      { field: 'Department', source: 'Department', why: 'Lets you target workflows by team.' },
      { field: 'Job title', source: 'Job title', why: 'Shown in people lists and approvals.' },
      { field: 'Manager', source: 'Manager', why: 'Used to send feedback requests and approvals to the right person.' },
      { field: 'Start date', source: null, why: "Google Workspace doesn't store when someone joined. Onboarding messages and anniversaries need this date." },
      { field: 'Employment status', source: null, why: "Google Workspace doesn't know if someone is on trial or on the bench. Trial workflows can't pick the right people." },
      { field: 'Trial end date', source: null, why: "Google Workspace doesn't store trial dates. Trial reviews can't be scheduled without them." },
    ],
  },
]

export const MAPPING_ALTERNATIVES: Record<string, string[]> = {
  'Trial end date': ['Probation end date (custom field)', 'Confirmation date', 'Leave unmapped'],
  'Start date': ['Account created (Google)', 'Upload a CSV with start dates', 'Leave unmapped'],
  'Employment status': ['Upload a CSV with statuses', 'Leave unmapped'],
}

export const establishedIntegrations = (): Integration[] =>
  INTEGRATIONS.map((i) =>
    i.id === 'zoho'
      ? {
          ...i,
          status: 'attention',
          lastSync: addDays(NOW, -0.1).toISOString(),
          employeeCount: EMPLOYEES.length,
          problem: "Trial end date isn't mapped, so trial reviews can't be scheduled for 3 people.",
        }
      : { ...i, status: 'connected', lastSync: addDays(NOW, -0.05).toISOString(), employeeCount: EMPLOYEES.length },
  )

export const ASSISTANT_SETTINGS: AssistantSettings = {
  greeting:
    "Hi {{first_name}}! I'm HR Mate, the HR assistant at Northwind Labs. Ask me about leave, benefits, onboarding or anything people-related. If I can't answer, I'll point you to the right person.",
  escalationKind: 'email',
  escalationTarget: `hr@${DOMAIN}`,
  quickLinks: [
    { id: 'ql1', title: 'Request leave', url: 'https://intranet.northwind-labs.example/leave', audience: 'Everyone' },
    { id: 'ql2', title: 'Submit an expense', url: 'https://intranet.northwind-labs.example/expenses', audience: 'Everyone' },
    { id: 'ql3', title: 'Org chart', url: 'https://intranet.northwind-labs.example/org', audience: 'Everyone' },
    { id: 'ql4', title: 'Benefits portal', url: 'https://intranet.northwind-labs.example/benefits', audience: 'Everyone' },
    { id: 'ql5', title: 'IT help desk', url: 'https://intranet.northwind-labs.example/it', audience: 'Everyone' },
    { id: 'ql6', title: 'Trial review guide', url: 'https://intranet.northwind-labs.example/trial', audience: 'Managers' },
  ],
  additionalInstructions: 'Answer in the language the employee writes in. Keep answers short and friendly. Never share salary data or personal records of other people.',
}

export const freshAssistantSettings = (): AssistantSettings => ({
  ...ASSISTANT_SETTINGS,
  escalationTarget: '',
  quickLinks: [],
})

export const WORKSPACE: WorkspaceSettings = {
  name: COMPANY,
  timezone: 'Europe/Warsaw',
  chatSpace: 'HR Mate at Northwind Labs',
  chatConnected: true,
}

export const APPROVALS: Approval[] = [
  { id: 'ap-1', title: 'Trial review: Emil Haugen', employeeId: 'emp-12', workflowId: 'wf-trial-end', dueAt: addDays(NOW, 2).toISOString(), summary: 'Ingrid Solberg recommends continuing. Trial ends in 6 days.' },
  { id: 'ap-2', title: 'Trial review: Jun Park', employeeId: 'emp-22', workflowId: 'wf-trial-end', dueAt: addDays(NOW, 1).toISOString(), summary: 'Mateo Vargas recommends continuing with a mentor. Trial ends in 5 days.' },
  { id: 'ap-3', title: 'Trial review: Marcus Doyle', employeeId: 'emp-30', workflowId: 'wf-trial-end', dueAt: addDays(NOW, 0).toISOString(), summary: "Waiting for Rhys Calder's feedback. Trial ends in 4 days." },
]

type Q = [string, string, string | null, string[]]
const QUESTIONS: Q[] = [
  ['How many vacation days do I get?', 'Leave', 'Full-time employees get 26 days of paid leave a year. Up to 5 unused days carry over until 31 March.', ['Leave policy.pdf', 'Employee handbook.pdf']],
  ['Can I work from Portugal for a month?', 'Remote work', 'You can work from another country for up to 20 working days a year with your manager’s approval. Tell HR before you travel.', ['Remote work policy.docx']],
  ['How do I claim travel expenses?', 'Expenses', 'Submit receipts in the expense form within 30 days of the trip. Your manager approves, and finance pays with the next salary.', ['Expense policy.pdf']],
  ['What do I do if I’m sick?', 'Leave', 'Tell your manager before 10:00 and mark the day as sick leave. A doctor’s note is needed after 3 days.', ['Leave policy.pdf']],
  ['How do I set up my laptop?', 'IT', 'Follow the IT setup guide: sign in with your work account, install the device manager, then turn on disk encryption.', ['IT setup guide.pdf']],
  ['What should I do in my first week?', 'Onboarding', 'Meet your manager on day one, finish the IT setup, and complete the checklist. HR checks in with you on Friday.', ['First week checklist.docx']],
  ['Who is my HR manager?', 'People', 'Your HR manager is shown in the Org chart. If you can’t find them, write to HR and we will help.', ['Employee handbook.pdf']],
  ['Is there a learning budget?', 'Benefits', 'Yes. Every employee has a yearly learning budget. Ask your manager before you book a course.', ['Employee handbook.pdf']],
  ['How does the sports card work?', 'Benefits', 'The sports card is part of the benefits package. Activate it in the benefits portal after your trial.', ['Employee handbook.pdf']],
  ['Can I carry over my leave to next year?', 'Leave', 'Up to 5 unused days carry over until 31 March.', ['Leave policy.pdf']],
  ['What is the dress code?', 'Culture', 'Dress comfortably in the office and neatly with clients.', ['Employee handbook.pdf']],
  ['How do I book a meeting room?', 'Office', 'Use the room booking page on the intranet. Rooms release 10 minutes after the start time.', ['Employee handbook.pdf']],
  ['When is the next payday?', 'Payroll', 'Salaries are paid on the last working day of the month.', ['Employee handbook.pdf']],
  ['Where do I find my payslip?', 'Payroll', 'Payslips are in Zoho People under My Finances.', ['Employee handbook.pdf']],
  ['How long is the trial period?', 'Onboarding', 'The trial period is 3 months. HR runs a mid-trial check-in and an end-of-trial review.', ['Employee handbook.pdf', 'First week checklist.docx']],
  ['What is the parental leave policy?', 'Parental leave', null, []],
  ['Do you offer relocation support?', 'Relocation', null, []],
  ['What is the conference budget?', 'Learning', null, []],
  ['Can I get stock options?', 'Compensation', null, []],
  ['What is the dress code at client sites?', 'Culture', null, []],
]

export const CHAT_QUESTIONS: ChatQuestion[] = QUESTIONS.map(([text, topic, answer, sources], i) => ({
  id: `q-${i + 1}`,
  text,
  topic,
  askedBy: EMPLOYEES[(i * 7 + 3) % EMPLOYEES.length].name,
  askedAt: addDays(NOW, -(i % 7) - (i % 3) * 0.2).toISOString(),
  answer: answer ?? undefined,
  sources: sources.length ? sources : undefined,
}))
