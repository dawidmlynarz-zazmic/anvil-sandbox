import { useState } from 'react'
import { Alert, AlertDescription, AlertTitle } from '@anvil/components/ui/alert'
import { Button } from '@anvil/components/ui/button'
import { Dialog, DialogBody, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from '@anvil/components/ui/dialog'
import { CheckIcon, Icon, UserPlusIcon } from '@anvil/components/ui/icon'
import { Input } from '@anvil/components/ui/input'

/** Invites the artist to review. In the demo nothing is sent; the dialog says so. */
export function InviteDialog() {
  const [email, setEmail] = useState('')
  const [sent, setSent] = useState<string | null>(null)
  const valid = /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)
  return (
    <Dialog onOpenChange={(open) => !open && setSent(null)}>
      <DialogTrigger asChild>
        <Button variant="outline" intent="neutral" size="sm">
          <Icon icon={UserPlusIcon} />
          Invite artist
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Invite the artist</DialogTitle>
          <DialogDescription>
            They can see what you send them, comment on concepts and clips, and approve. They don’t see drafts or this chat.
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
                label="Artist’s email"
                type="email"
                placeholder="name@management.com"
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
