import { Navigate, useLocation, type RouteObject } from 'react-router-dom'
import { J1Booked, J1Checkout, J1Home, J1Plan } from '~/pages/j1'
import { J2Landing, J2SavedPlan, J2ThingsToDo, J2WaterPark } from '~/pages/j2'
import { RatesPage, SuitesPage } from '~/pages/shared'
import { Picker } from './Picker'
import { JourneyShell } from './Shell'

const PAGES: Record<string, () => React.JSX.Element> = {
  '1.1': J1Home,
  '1.2': SuitesPage,
  '1.3': RatesPage,
  '1.4': J1Plan,
  '1.5': J1Checkout,
  '1.6': J1Booked,
  '2.1': J2Landing,
  '2.2': SuitesPage,
  '2.3': J2WaterPark,
  '2.4': J2ThingsToDo,
  '2.5': RatesPage,
  '2.6': J2SavedPlan,
}

function StepPage() {
  const { pathname } = useLocation()
  const m = /\/j([12])\/([1-6])$/.exec(pathname)
  if (!m) return <Navigate to="/" replace />
  const Page = PAGES[`${m[1]}.${m[2]}`]
  return <Page key={pathname} />
}

export const routes: RouteObject[] = [
  { path: '/', element: <Picker /> },
  { path: '/j1', element: <JourneyShell />, children: [{ index: true, element: <Navigate to="1" replace /> }, { path: ':step', element: <StepPage /> }] },
  { path: '/j2', element: <JourneyShell />, children: [{ index: true, element: <Navigate to="1" replace /> }, { path: ':step', element: <StepPage /> }] },
  { path: '*', element: <Navigate to="/" replace /> },
]
