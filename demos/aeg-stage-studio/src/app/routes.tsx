import { lazy, Suspense } from 'react'
import { Navigate, useParams, type RouteObject } from 'react-router-dom'
import { BriefPage } from '~/features/brief/BriefPage'
import { HandoffPage } from '~/features/handoff/HandoffPage'
import { MotionPage } from '~/features/motion/MotionPage'
import { ReviewPage } from '~/features/review/ReviewPage'
import { StillsPage } from '~/features/stills/StillsPage'
import { currentStep } from '~/state/project'
import { ProjectScope, useProject, type Step } from '~/state/ProjectContext'
import { useStore } from '~/state/store'
import { AppShell } from './AppShell'

// Dev-only 3D lab, loaded on demand so three.js stays out of the main bundle.
const LabPage = lazy(() => import('~/scene/LabPage').then((m) => ({ default: m.LabPage })))

/** The core loop. The brief comes before it, once per project. */
export const LOOP: { step: Step; label: string }[] = [
  { step: 'stills', label: 'Stills' },
  { step: 'motion', label: 'Motion' },
  { step: 'review', label: 'Review' },
  { step: 'handoff', label: 'Handoff' },
]

/** "/" opens the most recently active project, on the step its work is at. */
function Home() {
  const { list } = useStore()
  const latest = list[0]
  return latest ? <Navigate to={`/p/${latest.meta.id}/${currentStep(latest)}`} replace /> : null
}

function ProjectLayout() {
  const { projectId = '' } = useParams()
  const { state } = useStore()
  if (!state.projects[projectId]) return <Navigate to="/" replace />
  return (
    <ProjectScope id={projectId}>
      <AppShell />
    </ProjectScope>
  )
}

function StepRedirect() {
  const p = useProject()
  return <Navigate to={p.path(currentStep(p))} replace />
}

export const routes: RouteObject[] = [
  { path: '/', element: <Home /> },
  {
    path: '/p/:projectId',
    element: <ProjectLayout />,
    children: [
      { index: true, element: <StepRedirect /> },
      { path: 'brief', element: <BriefPage /> },
      { path: 'stills', element: <StillsPage /> },
      { path: 'motion', element: <MotionPage /> },
      { path: 'review', element: <ReviewPage /> },
      { path: 'handoff', element: <HandoffPage /> },
    ],
  },
  ...(import.meta.env.DEV ? [{ path: '/lab', element: <Suspense fallback={null}><LabPage /></Suspense> }] : []),
  { path: '*', element: <Navigate to="/" replace /> },
]
