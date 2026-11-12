import { useEffect, useState, type ReactNode } from 'react'
import { TriangleAlert } from 'lucide-react'
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert'
import { Button } from '@/components/ui/button'
import { Skeleton } from '@/components/ui/skeleton'
import { useDemo } from '@/lib/demo-state'

/** Gives every list its four states: loading, empty, error and populated. Reviewers reach them from Demo controls. */
export function ListGate({ isEmpty, emptyState, rows = 5, children }: { isEmpty: boolean; emptyState: ReactNode; rows?: number; children: ReactNode }) {
  const { state, dispatch } = useDemo()
  const [ready, setReady] = useState(false)
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 350)
    return () => clearTimeout(t)
  }, [])

  if (state.listMode === 'loading' || !ready)
    return (
      <div className="space-y-2" role="status" aria-label="Loading">
        {Array.from({ length: rows }).map((_, i) => (
          <Skeleton key={i} className="h-10 w-full" />
        ))}
      </div>
    )
  if (state.listMode === 'error')
    return (
      <Alert variant="destructive">
        <TriangleAlert aria-hidden />
        <AlertTitle>We couldn't load this list</AlertTitle>
        <AlertDescription>
          <p>The request timed out. Your data is safe. Try again in a moment.</p>
          <Button size="sm" variant="outline" className="mt-2" onClick={() => dispatch({ type: 'setListMode', mode: 'normal' })}>
            Try again
          </Button>
        </AlertDescription>
      </Alert>
    )
  if (state.listMode === 'empty' || isEmpty) return <>{emptyState}</>
  return <>{children}</>
}
