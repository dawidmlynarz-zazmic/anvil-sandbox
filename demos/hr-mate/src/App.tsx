import { RouterProvider } from 'react-router-dom'
import { Toaster } from '@/components/ui/sonner'
import { TooltipProvider } from '@/components/ui/tooltip'
import { DemoProvider } from '@/lib/demo-state'
import { ThemeProvider, useTheme } from '@/lib/theme'
import { Gate } from './Gate'
import { router } from './routes'

function Shell() {
  const { resolved } = useTheme()
  return (
    <>
      <RouterProvider router={router} />
      <Toaster position="bottom-right" theme={resolved} />
    </>
  )
}

export function App() {
  return (
    <ThemeProvider>
    <Gate>
      <DemoProvider>
        <TooltipProvider delayDuration={200}>
          <Shell />
        </TooltipProvider>
      </DemoProvider>
    </Gate>
    </ThemeProvider>
  )
}
