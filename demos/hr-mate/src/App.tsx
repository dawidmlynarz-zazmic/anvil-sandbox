import { RouterProvider } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { DemoProvider } from '@/lib/demo-state'
import { Gate } from './Gate'
import { router } from './routes'

export function App() {
  return (
    <Gate>
      <DemoProvider>
        <TooltipProvider delayDuration={200}>
          <RouterProvider router={router} />
          <Toaster position="bottom-right" />
        </TooltipProvider>
      </DemoProvider>
    </Gate>
  )
}
