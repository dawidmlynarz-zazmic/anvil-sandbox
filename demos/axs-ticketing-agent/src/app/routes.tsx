import { lazy, Suspense } from 'react'
import { Navigate, Outlet, type RouteObject } from 'react-router-dom'
import { CheckoutStub } from '~/features/checkout/CheckoutStub'
import { HostPage } from '~/features/host/HostPage'
import { DeviceFrame } from './DeviceFrame'

// Dev-only: drives the scripted agent without any screen.
const LabPage = lazy(() => import('~/features/lab/LabPage').then((m) => ({ default: m.LabPage })))

function Frame() {
  return (
    <DeviceFrame>
      <Outlet />
    </DeviceFrame>
  )
}

export const routes: RouteObject[] = [
  {
    element: <Frame />,
    children: [
      // One element for both, so opening Ask AXS (/ask) doesn't remount the page behind it.
      { path: '/', element: <HostPage />, children: [{ path: 'ask' }] },
      { path: '/checkout/:holdId', element: <CheckoutStub /> },
    ],
  },
  ...(import.meta.env.DEV ? [{ path: '/lab', element: <Suspense fallback={null}><LabPage /></Suspense> }] : []),
  { path: '*', element: <Navigate to="/" replace /> },
]
