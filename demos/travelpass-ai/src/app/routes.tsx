import { Navigate, type RouteObject } from 'react-router-dom'
import { BookingDialog } from '~/features/booking/BookingDialog'
import { ConfirmedPage } from '~/features/booking/ConfirmedPage'
import { HomePage } from '~/features/home/HomePage'
import { HotelDetailPage } from '~/features/hotels/HotelDetailPage'
import { HotelsPage } from '~/features/hotels/HotelsPage'
import { LivePage } from '~/features/live/LivePage'
import { PhotosPage } from '~/features/photos/PhotosPage'
import { AppShell } from './AppShell'

// Every screen has its own URL, so Back, links and breadcrumbs work (the original kept `/` for everything).
export const routes: RouteObject[] = [
  {
    element: <AppShell />,
    children: [
      { path: '/', element: <HomePage /> },
      { path: '/hotels', element: <HotelsPage /> },
      { path: '/hotels/:hotelId', element: <HotelDetailPage />, children: [{ path: 'book/:roomId', element: <BookingDialog /> }] },
      { path: '/photos/:destination', element: <PhotosPage /> },
      { path: '/live', element: <LivePage /> },
      { path: '/confirmed', element: <ConfirmedPage /> },
    ],
  },
  { path: '*', element: <Navigate to="/" replace /> },
]
