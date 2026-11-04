import { Navigate, type RouteObject } from 'react-router-dom'
import { AfterScreen } from '~/screens/AfterScreen'
import { AppBookingScreen } from '~/screens/AppBookingScreen'
import { ChargeScreen } from '~/screens/ChargeScreen'
import { ConciergeScreen } from '~/screens/ConciergeScreen'
import { ForecastScreen } from '~/screens/ForecastScreen'
import { HomeScreen } from '~/screens/HomeScreen'
import { StaffScreen } from '~/screens/StaffScreen'
import { AppShell } from './AppShell'

// One URL per moment, so Back, links and a refresh all work.
export const routes: RouteObject[] = [
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <Navigate to="/discover" replace /> },
      { path: '/discover', element: <HomeScreen /> },
      { path: '/plan', element: <AppBookingScreen /> },
      { path: '/stay', element: <ConciergeScreen /> },
      { path: '/stay/charges', element: <ChargeScreen /> },
      { path: '/lodge', element: <StaffScreen /> },
      { path: '/lodge/forecast', element: <ForecastScreen /> },
      { path: '/after', element: <AfterScreen /> },
    ],
  },
  { path: '*', element: <Navigate to="/discover" replace /> },
]
