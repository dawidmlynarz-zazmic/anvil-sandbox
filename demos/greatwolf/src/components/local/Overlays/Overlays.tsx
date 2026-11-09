import type { ReactNode } from 'react'
import { Button } from '@anvil/components/ui/button'
import { CheckIcon, Icon, LinkIcon, MailIcon, MessageSquareIcon, MicIcon, SparklesIcon, XIcon } from '@anvil/components/ui/icon'
import { cn } from '@anvil/lib/utils'
import { quoteOf, useDemo } from '~/state/demo'
import { WileyAvatar } from '../Brand/Brand'

// Demo-only overlays. The native sheets are mocks of the phone's own UI (Apple Pay, share) and of a sign-up sheet;
// nothing is paid, shared or created.

/** Ask Wiley before the chat is open: a bottom bar on mobile (J1·1), a floating pill on desktop and on later steps. */
export function Launcher({ variant, onOpen, onMic }: { variant: 'bar' | 'pill'; onOpen: () => void; onMic?: () => void }) {
  if (variant === 'bar') {
    return (
      <div className="absolute inset-x-3 bottom-3 z-20 flex h-14 items-center gap-2 rounded-full border bg-background ps-2 pe-2 shadow-lg gwl-up">
        <button type="button" onClick={onOpen} className="flex min-w-0 flex-1 items-center gap-2 rounded-full text-left outline-none focus-visible:focus-ring">
          <WileyAvatar size={36} online />
          <span className="truncate type-text-sm-medium text-muted-foreground">Ask away…</span>
        </button>
        <Button shape="circle" size="icon" aria-label="Talk to Wiley" onClick={onMic ?? onOpen}>
          <Icon icon={MicIcon} />
        </Button>
      </div>
    )
  }
  return (
    <button
      type="button"
      onClick={onOpen}
      className="gwl-up absolute right-4 bottom-4 z-20 inline-flex h-12 items-center gap-2 rounded-full border-2 border-foreground bg-background px-4 type-text-sm-semibold shadow-lg outline-none hover:bg-accent focus-visible:focus-ring"
    >
      <Icon icon={SparklesIcon} />
      Ask Wiley
    </button>
  )
}

export function Toast() {
  const { s } = useDemo()
  if (!s.toast) return null
  return (
    <div role="status" className="gwl-in pointer-events-none absolute top-3 left-1/2 z-40 -translate-x-1/2">
      <span className="inline-flex items-center gap-2 rounded-full bg-background-inverse px-4 py-2 type-text-sm-medium text-foreground-inverse shadow-lg">
        <Icon icon={CheckIcon} size="xs" />
        {s.toast}
      </span>
    </div>
  )
}

function NativeSheet({ label, onClose, children, className }: { label: string; onClose: () => void; children: ReactNode; className?: string }) {
  return (
    <div className="absolute inset-0 z-30 flex items-end justify-center bg-overlay" onClick={onClose}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
        className={cn('gwl-up w-full max-w-md rounded-t-3xl bg-background p-5 pb-8 shadow-2xl', className)}
      >
        {children}
      </div>
    </div>
  )
}

function ApplePay() {
  const { s, payApple, run } = useDemo()
  const total = quoteOf(s)?.total ?? 0
  return (
    <NativeSheet label="Apple Pay (mock)" onClose={() => run([{ do: 'sheet', which: null }])} className="bg-[#f2f2f7] text-[#000000] dark:bg-[#1c1c1e] dark:text-[#ffffff]">
      <div className="flex items-center justify-between">
        <span className="text-lg font-semibold"> Pay</span>
        <button type="button" aria-label="Cancel" className="rounded-full bg-[#00000014] p-1.5 dark:bg-[#ffffff22]" onClick={() => run([{ do: 'sheet', which: null }])}>
          <Icon icon={XIcon} size="xs" />
        </button>
      </div>
      <div className="mt-4 rounded-xl bg-[#ffffff] p-4 text-sm dark:bg-[#2c2c2e]">
        <div className="flex justify-between">
          <span className="text-[#6b6b70]">Card</span>
          <span>Visa ending 0912</span>
        </div>
        <div className="mt-3 flex justify-between border-t border-[#0000001a] pt-3 dark:border-[#ffffff1a]">
          <span className="text-[#6b6b70]">Pay</span>
          <span className="font-semibold">Great Wolf Lodge · ${total.toFixed(2)}</span>
        </div>
      </div>
      <button type="button" onClick={payApple} className="mt-6 flex w-full flex-col items-center gap-2 rounded-xl p-3 outline-none focus-visible:focus-ring">
        <span className="grid size-12 place-items-center rounded-full border-2 border-[#0a84ff] text-[#0a84ff]">
          <Icon icon={CheckIcon} />
        </span>
        <span className="text-sm">Double-click to pay</span>
        <span className="text-xs text-[#6b6b70]">Mock sheet: tap to finish</span>
      </button>
    </NativeSheet>
  )
}

function Join() {
  const { joinVoyagers, run } = useDemo()
  return (
    <NativeSheet label="Join Voyagers Club" onClose={() => run([{ do: 'sheet', which: null }])}>
      <h2 className="gwl-display text-xl">Join Voyagers Club, free</h2>
      <p className="mt-1 type-text-sm-normal text-muted-foreground">Save on every stay. Wiley keeps your plan in your account.</p>
      <div className="mt-5 flex flex-col gap-2.5">
        <Button shape="pill" variant="outline" intent="neutral" size="lg" onClick={joinVoyagers}>
          Continue with Google
        </Button>
        <Button shape="pill" variant="outline" intent="neutral" size="lg" onClick={joinVoyagers}>
           Continue with Apple
        </Button>
        <Button shape="pill" size="lg" onClick={joinVoyagers}>
          <Icon icon={MailIcon} /> Continue with Email
        </Button>
      </div>
      <p className="mt-4 type-text-xs-normal text-muted-foreground">Mock sheet: no account is created.</p>
    </NativeSheet>
  )
}

function Share() {
  const { run } = useDemo()
  const close = () => run([{ do: 'sheet', which: null }, { do: 'toast', text: 'Plan shared' }])
  return (
    <NativeSheet label="Share (mock)" onClose={() => run([{ do: 'sheet', which: null }])}>
      <p className="type-text-sm-semibold">Share “Our Great Wolf weekend”</p>
      <div className="mt-4 grid grid-cols-3 gap-3">
        {[
          { label: 'Messages', icon: MessageSquareIcon },
          { label: 'Mail', icon: MailIcon },
          { label: 'Copy link', icon: LinkIcon },
        ].map((a) => (
          <button key={a.label} type="button" onClick={close} className="flex flex-col items-center gap-2 rounded-xl p-3 type-text-xs-medium outline-none hover:bg-accent focus-visible:focus-ring">
            <span className="grid size-12 place-items-center rounded-2xl bg-muted">
              <Icon icon={a.icon} />
            </span>
            {a.label}
          </button>
        ))}
      </div>
    </NativeSheet>
  )
}

export function NativeSheets() {
  const { s } = useDemo()
  if (s.sheet === 'apple') return <ApplePay />
  if (s.sheet === 'join') return <Join />
  if (s.sheet === 'share') return <Share />
  return null
}

export function EndCard() {
  const { endCard, setEndCard, reset, startJourney, journey } = useDemo()
  if (!endCard) return null
  const copy = {
    companion: { title: 'Next: the in-venue companion', body: 'Angle B picks up here: the same Wiley in the Great Wolf app, with Saturday ready when the family arrives.' },
    checkout: { title: 'Checkout is the same flow as Journey 1', body: 'Review, prefilled details and native payment, as in step 5 of Journey 1.' },
    plan: { title: 'End of Journey 2', body: 'The saved plan and the chat come back from the link Wiley sent.' },
  }[endCard]
  return (
    <div className="absolute inset-0 z-50 grid place-items-center bg-overlay p-4">
      <div role="dialog" aria-modal="true" aria-label={copy.title} className="gwl-in w-full max-w-sm rounded-3xl bg-background p-6 shadow-2xl">
        <WileyAvatar size={40} />
        <h2 className="gwl-display mt-4 text-xl">{copy.title}</h2>
        <p className="mt-2 type-text-sm-normal text-muted-foreground">{copy.body}</p>
        <div className="mt-6 flex flex-col gap-2">
          {endCard === 'checkout' && (
            <Button shape="pill" variant="outline" intent="neutral" onClick={() => setEndCard(null)}>
              Back to rates
            </Button>
          )}
          <Button shape="pill" variant="outline" intent="neutral" onClick={reset}>
            Restart Journey {journey}
          </Button>
          <Button shape="pill" onClick={() => startJourney(journey === 1 ? 2 : 1)}>
            Start Journey {journey === 1 ? 2 : 1}
          </Button>
        </div>
      </div>
    </div>
  )
}
