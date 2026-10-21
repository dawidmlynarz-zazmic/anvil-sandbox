import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { TooltipProvider } from '@anvil/components/ui/tooltip'
import { preloadStageRenderer } from '~/scene/useStageImage'
import { StoreProvider } from '~/state/store'
import { routes } from './routes'

const router = createBrowserRouter(routes)

// Fetch the 3D renderer straight away (in its own chunk), so the first stills start rendering sooner.
preloadStageRenderer()

export function App() {
  return (
    <TooltipProvider>
      <StoreProvider>
        <RouterProvider router={router} />
      </StoreProvider>
    </TooltipProvider>
  )
}
