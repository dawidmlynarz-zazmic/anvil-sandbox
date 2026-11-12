import { Navigate, useLocation, type RouteObject } from 'react-router-dom'
import { J1Booked, J1Checkout, J1Home, J1Plan } from '~/pages/j1'
import { J2Landing, J2SavedPlan, J2ThingsToDo, J2WaterPark } from '~/pages/j2'
import { SuitesPage } from '~/pages/shared'
import { GwlApp } from '~/pages/j3/App'
import { Picker } from './Picker'
import { JourneyShell } from './Shell'

const PAGES: Record<string, () => React.JSX.Element> = {
  '1.1': J1Home,
  '1.2': SuitesPage,
  '1.3': SuitesPage,
  '1.4': J1Plan,
  '1.5': J1Checkout,
  '1.6': J1Booked,
  '2.1': J2Landing,
  '2.2': SuitesPage,
  '2.3': J2WaterPark,
  '2.4': J2ThingsToDo,
  '2.5': SuitesPage,
  '2.6': J2SavedPlan,
  '3.1': GwlApp,
  '3.2': GwlApp,
  '3.3': GwlApp,
  '3.4': GwlApp,
  '3.5': GwlApp,
  '3.6': GwlApp,
}

function StepPage() {
  const { pathname } = useLocation()
  const m = /\/j([123])\/([1-6])$/.exec(pathname)
  if (!m) return <Navigate to="/" replace />
  const Page = PAGES[`${m[1]}.${m[2]}`]
  // Suites and rates are one page (View Rates opens inline), so keep it mounted between those steps.
  // The app in Journey 3 stays mounted across steps, like a phone app that stays open.
  return <Page key={Page === SuitesPage ? `j${m[1]}-suites` : Page === GwlApp ? 'j3-app' : pathname} />
}

export const routes: RouteObject[] = [
  { path: '/', element: <Picker /> },
  { path: '/j1', element: <JourneyShell />, children: [{ index: true, element: <Navigate to="1" replace /> }, { path: ':step', element: <StepPage /> }] },
  { path: '/j2', element: <JourneyShell />, children: [{ index: true, element: <Navigate to="1" replace /> }, { path: ':step', element: <StepPage /> }] },
  { path: '/j3', element: <JourneyShell />, children: [{ index: true, element: <Navigate to="1" replace /> }, { path: ':step', element: <StepPage /> }] },
  { path: '*', element: <Navigate to="/" replace /> },
]
