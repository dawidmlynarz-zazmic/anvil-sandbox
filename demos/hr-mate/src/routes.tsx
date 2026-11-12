import { createBrowserRouter, Navigate } from 'react-router-dom'
import { AppShell } from '@/components/app/AppShell'
import { Home } from '@/routes/home/Home'
import { Setup } from '@/routes/setup/Setup'
import { People } from '@/routes/people/People'
import { Workflows } from '@/routes/workflows/Workflows'
import { WorkflowDetail } from '@/routes/workflows/WorkflowDetail'
import { NewWorkflow } from '@/routes/workflows/NewWorkflow'
import { Runs } from '@/routes/runs/Runs'
import { Knowledge } from '@/routes/knowledge/Knowledge'
import { CollectionDetail } from '@/routes/knowledge/CollectionDetail'
import { Connections } from '@/routes/connections/Connections'
import { AssistantSettingsPage } from '@/routes/settings/AssistantSettings'
import { TeamSettings } from '@/routes/settings/TeamSettings'
import { WorkspaceSettingsPage } from '@/routes/settings/WorkspaceSettings'
import { ChatPreview } from '@/routes/chat-preview/ChatPreview'
import { Styleguide } from '@/routes/styleguide/Styleguide'

export const router = createBrowserRouter(
  [
    {
      element: <AppShell />,
      children: [
        { index: true, element: <Home /> },
        { path: 'setup/:step', element: <Setup /> },
        { path: 'people', element: <People /> },
        { path: 'automations', element: <Navigate to="/automations/workflows" replace /> },
        { path: 'automations/workflows', element: <Workflows /> },
        { path: 'automations/workflows/new', element: <NewWorkflow /> },
        { path: 'automations/workflows/:id', element: <WorkflowDetail /> },
        { path: 'automations/runs', element: <Runs /> },
        { path: 'knowledge', element: <Knowledge /> },
        { path: 'knowledge/:id', element: <CollectionDetail /> },
        { path: 'connections', element: <Connections /> },
        { path: 'settings', element: <Navigate to="/settings/assistant" replace /> },
        { path: 'settings/assistant', element: <AssistantSettingsPage /> },
        { path: 'settings/team', element: <TeamSettings /> },
        { path: 'settings/workspace', element: <WorkspaceSettingsPage /> },
        { path: 'chat-preview', element: <ChatPreview /> },
        { path: 'styleguide', element: <Styleguide /> },
        { path: '*', element: <Navigate to="/" replace /> },
      ],
    },
  ],
  { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' },
)
