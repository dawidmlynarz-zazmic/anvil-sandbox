import type { SetupStepId } from '@/mocks/types'

// UI strings for first-run setup. Kept in one module so engineers can lift them.
export const ONBOARDING = {
  intro: {
    title: 'Welcome to HR Mate',
    body: 'HR Mate answers employee questions in Google Chat and runs HR routines for you: onboarding messages, trial reviews, reminders and more. Setup takes about 15 minutes.',
  },
  steps: {
    directory: {
      title: 'Connect your employee directory',
      short: 'Connect directory',
      why: 'HR Mate needs to know who works at your company, who their manager is and when they started. Everything else builds on this.',
      time: '3 min',
    },
    knowledge: {
      title: 'Add your HR knowledge',
      short: 'Add knowledge',
      why: 'The assistant answers from your own documents, like the leave policy or the handbook. It never makes up policy.',
      time: '4 min',
    },
    test: {
      title: 'Test the assistant',
      short: 'Test the assistant',
      why: 'Ask a few questions the way an employee would. You see the sources behind every answer, so you can trust what people will read.',
      time: '2 min',
    },
    workflow: {
      title: 'Turn on your first workflow',
      short: 'Turn on a workflow',
      why: 'A workflow is an HR routine that runs by itself, like asking a manager for feedback 7 days before a trial ends.',
      time: '4 min',
    },
    team: {
      title: 'Invite your HR team',
      short: 'Invite HR team',
      why: 'Give colleagues access to approve reviews and manage workflows. Each role limits what a person can change.',
      time: '2 min',
    },
  } satisfies Record<SetupStepId, { title: string; short: string; why: string; time: string }>,
  skip: 'Skip for now',
  allDone: {
    title: 'HR Mate is ready',
    body: 'Your directory is synced, the assistant has knowledge to work with and your first workflow is live. This is your home from now on.',
    action: 'Go to home',
  },
}

export const ROLES: Record<string, { label: string; can: string }> = {
  owner: { label: 'Owner', can: 'Everything, including billing and removing admins. There is one owner per workspace.' },
  admin: { label: 'Admin', can: 'Manage connections, workflows, knowledge and settings. Can invite and remove HR managers and viewers.' },
  hr_manager: { label: 'HR manager', can: 'Run and edit workflows, approve reviews and manage knowledge. Cannot change connections or roles.' },
  viewer: { label: 'Viewer', can: 'See people, runs and reports. Cannot change anything.' },
}
