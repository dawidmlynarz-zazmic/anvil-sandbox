import { lazy, Suspense } from 'react'
import { Navigate, useParams, type RouteObject } from 'react-router-dom'
import { BriefPage } from '~/features/brief/BriefPage'
import { HandoffPage } from '~/features/handoff/HandoffPage'
import { MomentPage } from '~/features/moment/MomentPage'
import { ReviewPage } from '~/features/review/ReviewPage'
import { ShowPage } from '~/features/show/ShowPage'
import { currentStep } from '~/state/project'
import { ProjectScope, useProject, type Step } from '~/state/ProjectContext'
import { useStore } from '~/state/store'
import { AppShell } from './AppShell'
import { HomePage } from './HomePage'

// Dev-only 3D lab, loaded on demand so three.js stays out of the main bundle.
const LabPage = lazy(() => import('~/scene/LabPage').then((m) => ({ default: m.LabPage })))

/** The loop after the brief: the show (one moment at a time), the artist's review, the handoff. */
export const LOOP: { step: Step; label: string }[] = [
  { step: 'show', label: 'Show' },
  { step: 'review', label: 'Review' },
  { step: 'handoff', label: 'Handoff' },
]

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
  { path: '/', element: <HomePage /> },
  {
    path: '/p/:projectId',
    element: <ProjectLayout />,
    children: [
      { index: true, element: <StepRedirect /> },
      { path: 'brief', element: <BriefPage /> },
      { path: 'show', element: <ShowPage /> },
      { path: 'm/:song', element: <MomentPage /> },
      { path: 'review', element: <ReviewPage /> },
      { path: 'handoff', element: <HandoffPage /> },
      // Links from before the moments-first loop.
      { path: 'stills', element: <Navigate to="../show" replace /> },
      { path: 'motion', element: <Navigate to="../show" replace /> },
    ],
  },
  ...(import.meta.env.DEV ? [{ path: '/lab', element: <Suspense fallback={null}><LabPage /></Suspense> }] : []),
  { path: '*', element: <Navigate to="/" replace /> },
]
