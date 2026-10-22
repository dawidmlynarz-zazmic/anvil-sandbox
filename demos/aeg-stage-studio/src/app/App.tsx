import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { TooltipProvider } from '@anvil/components/ui/tooltip'
import { preloadStageRenderer } from '~/scene/useStageImage'
import { StoreProvider } from '~/state/store'
import { routes } from './routes'
import { Gate } from './Gate'

// On GitHub Pages the demo lives in a sub-folder; the router works below it.
const router = createBrowserRouter(routes, { basename: import.meta.env.BASE_URL.replace(/\/$/, '') || '/' })

// Fetch the 3D renderer straight away (in its own chunk), so the first stills start rendering sooner.
preloadStageRenderer()

export function App() {
  return (
    <TooltipProvider>
      <Gate>
        <StoreProvider>
          <RouterProvider router={router} />
        </StoreProvider>
      </Gate>
    </TooltipProvider>
  )
}
