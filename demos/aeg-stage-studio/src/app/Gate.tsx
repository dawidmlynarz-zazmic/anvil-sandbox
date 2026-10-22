import { useState, type ReactNode } from 'react'
import { Button } from '@anvil/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@anvil/components/ui/card'
import { Icon, LockIcon } from '@anvil/components/ui/icon'
import { Input } from '@anvil/components/ui/input'

// A light password screen for the hosted preview. It keeps casual visitors and search engines out; it is not access
// control (the site is static and the source is public). It's on only when the build sets VITE_DEMO_GATE, the
// SHA-256 of the password (the GitHub Pages workflow makes it from the DEMO_PASSWORD secret).

const GATE = import.meta.env.VITE_DEMO_GATE as string | undefined
const KEY = 'stage-studio:unlocked'

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
    <main className="bg-background flex min-h-svh items-center justify-center p-6">
      <Card className="w-full max-w-sm">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Icon icon={LockIcon} />
            Stage Studio preview
          </CardTitle>
          <CardDescription>An AEG demo. Enter the password you were given to open it.</CardDescription>
        </CardHeader>
        <CardContent>
          <form
            className="flex flex-col gap-3"
            onSubmit={(e) => {
              e.preventDefault()
              void submit()
            }}
          >
            <Input
              id="demo-password"
              type="password"
              label="Password"
              autoFocus
              value={value}
              aria-invalid={wrong || undefined}
              hint={wrong ? 'That’s not the password. Check it and try again.' : undefined}
              onChange={(e) => {
                setValue(e.target.value)
                setWrong(false)
              }}
            />
            <Button type="submit" disabled={!value}>
              Open the demo
            </Button>
          </form>
        </CardContent>
      </Card>
    </main>
  )
}
