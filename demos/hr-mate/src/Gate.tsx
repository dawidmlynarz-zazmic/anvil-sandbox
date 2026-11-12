import { useState, type ReactNode } from 'react'
import { Lock } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

// A light password screen for the hosted preview. It keeps casual visitors and search engines out; it is not access
// control (the site is static and the source is public). On only when the build sets VITE_DEMO_GATE, the SHA-256 of
// the password (the Pages workflow makes it from the DEMO_PASSWORD secret).
const GATE = import.meta.env.VITE_DEMO_GATE as string | undefined
const KEY = 'hr-mate:unlocked'

async function sha256(text: string) {
  const bytes = await crypto.subtle.digest('SHA-256', new TextEncoder().encode(text))
  return [...new Uint8Array(bytes)].map((b) => b.toString(16).padStart(2, '0')).join('')
}

const unlocked = () => {
  try {
    return !GATE || localStorage.getItem(KEY) === GATE
  } catch {
    return false
  }
}

export function Gate({ children }: { children: ReactNode }) {
  const [open, setOpen] = useState(unlocked)
  const [value, setValue] = useState('')
  const [wrong, setWrong] = useState(false)
  if (open) return children

  const submit = async () => {
    if ((await sha256(value)) !== GATE) {
      setWrong(true)
      return
    }
    try {
      localStorage.setItem(KEY, GATE!)
    } catch {
      // Without storage, the password is asked again next visit.
    }
    setOpen(true)
  }

  return (
    <main className="flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Lock className="size-4" aria-hidden />
            HR Mate prototype
          </CardTitle>
          <CardDescription>A clickable prototype. Enter the password you were given to open it.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              void submit()
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="pw">Password</Label>
              <Input id="pw" type="password" value={value} onChange={(e) => { setValue(e.target.value); setWrong(false) }} aria-invalid={wrong} autoFocus />
              {wrong && <p className="text-destructive-soft text-[13px]">That password doesn't match. Check it and try again.</p>}
            </div>
            <Button type="submit">Open prototype</Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
