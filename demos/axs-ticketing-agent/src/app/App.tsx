import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { TooltipProvider } from '@anvil/components/ui/tooltip'
import { routes } from './routes'
import { SessionProvider } from '~/state/session'
import { Gate } from './Gate'

// On GitHub Pages the demo lives in a sub-folder; the router works below it.
const router = createBrowserRouter(routes, { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' })

export function App() {
  return (
    <TooltipProvider>
      <Gate>
        <SessionProvider>
          <RouterProvider router={router} />
        </SessionProvider>
      </Gate>
    </TooltipProvider>
  )
}
