import { useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@anvil/components/ui/alert'
import { Button } from '@anvil/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@anvil/components/ui/dialog'
import { CheckIcon, Icon, Share2Icon } from '@anvil/components/ui/icon'
import { Input } from '@anvil/components/ui/input'

/** Invites collaborators to the project. In the demo nothing is sent; the dialog says so. */
export function ShareDialog() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState<string | null>(null)
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  return (
    <Dialog onOpenChange={(open) => !open && setSent(null)}>
      <DialogTrigger asChild>
        <Button variant="outline" intent="neutral" size="sm">
          <Icon icon={Share2Icon} />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite collaborators</DialogTitle>
          <DialogDescription>
            People you invite can open this project and work on it with you: the brief, the show and the handoff.
          </DialogDescription>
        </DialogHeader>
        <form
          onSubmit={(e) => {
            e.preventDefault()
            if (!valid) return
            setSent(email)
            setEmail('')
          }}
        >
          <DialogBody>
            {sent ? (
              <Alert tone="success" role="status">
                <Icon icon={CheckIcon} />
                <AlertTitle>Invite ready for {sent}</AlertTitle>
                <AlertDescription>This is a demo, so no email was sent.</AlertDescription>
              </Alert>
            ) : (
              <Input
                label="Email"
                type="email"
                placeholder="name@company.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
            )}
          </DialogBody>
          <DialogFooter>
            {!sent && (
              <Button type="submit" disabled={!valid}>
                Send invite
              </Button>
            )}
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
}
