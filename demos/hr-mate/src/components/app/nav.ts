import { Bot, FlaskConical, Home, MessageSquareText, Plug, Settings, Sparkles, Users, Workflow, BookOpen, type LucideIcon } from 'lucide-react'

export interface NavItem {
  label: string
  to: string
  icon: LucideIcon
  children?: { label: string; to: string }[]
  badge?: 'runs'
  prototype?: boolean
}

export const NAV: NavItem[] = [
  { label: 'Home', to: '/', icon: Home },
  { label: 'People', to: '/people', icon: Users },
  {
    label: 'Automations',
    to: '/automations',
    icon: Workflow,
    children: [
      { label: 'Workflows', to: '/automations/workflows' },
      { label: 'Runs', to: '/automations/runs' },
    ],
  },
  { label: 'Knowledge', to: '/knowledge', icon: BookOpen },
  { label: 'Connections', to: '/connections', icon: Plug },
  {
    label: 'Settings',
    to: '/settings',
    icon: Settings,
    children: [
      { label: 'Assistant', to: '/settings/assistant' },
      { label: 'Team & roles', to: '/settings/team' },
      { label: 'Workspace', to: '/settings/workspace' },
    ],
  },
  { label: 'Chat preview', to: '/chat-preview', icon: MessageSquareText, prototype: true },
]

export const EXTRA_ROUTES = [
  { label: 'Styleguide', to: '/styleguide', icon: Sparkles },
  { label: 'Set up HR Mate', to: '/setup/directory', icon: Bot },
  { label: 'Demo controls', to: '/', icon: FlaskConical },
]
