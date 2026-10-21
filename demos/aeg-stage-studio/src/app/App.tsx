import { RouterProvider, createBrowserRouter } from 'react-router-dom'
import { TooltipProvider } from '@anvil/components/ui/tooltip'
import { StoreProvider } from '~/state/store'
import { routes } from './routes'

const router = createBrowserRouter(routes)

export function App() {
  return (
    <TooltipProvider>
      <StoreProvider>
        <RouterProvider router={router} />
      </StoreProvider>
    </TooltipProvider>
  )
}
