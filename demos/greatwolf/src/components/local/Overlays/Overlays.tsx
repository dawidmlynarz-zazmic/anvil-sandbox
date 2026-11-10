import { useEffect, useRef, type ReactNode } from 'react'
import { Button } from '@anvil/components/ui/button'
import { CheckIcon, Icon, LinkIcon, MailIcon, MessageSquareIcon, MicIcon, SparklesIcon, XIcon } from '@anvil/components/ui/icon'
import { cn } from '@anvil/lib/utils'
import { photos } from '~/data/photos'
import { quoteOf, useDemo } from '~/state/demo'
import { savedPlan } from '~/state/plan'
import { lodge } from '~/data/fixtures'
import { Photo, Sample, WileyAvatar } from '../Brand/Brand'

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
    <div role="status" className="gwl-noprint gwl-in pointer-events-none absolute top-3 left-1/2 z-40 -translate-x-1/2">
      <span className="inline-flex items-center gap-2 rounded-full bg-background-inverse px-4 py-2 type-text-sm-medium text-foreground-inverse shadow-lg">
        <Icon icon={CheckIcon} size="xs" />
        {s.toast}
      </span>
    </div>
  )
}

/** Moves focus into a dialog, keeps Tab inside it, closes on Escape and hands focus back afterwards. */
function useDialog(onClose?: () => void) {
  const ref = useRef<HTMLDivElement | null>(null)
  const close = useRef(onClose)
  close.current = onClose
  useEffect(() => {
    const el = ref.current
    const before = document.activeElement as HTMLElement | null
    el?.focus()
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape' && close.current) return (e.stopPropagation(), close.current())
      if (e.key !== 'Tab' || !el) return
      const items = [...el.querySelectorAll<HTMLElement>('button, [href], input, [tabindex]:not([tabindex="-1"])')].filter((x) => !x.hasAttribute('disabled'))
      if (!items.length) return e.preventDefault()
      const first = items[0]
      const last = items[items.length - 1]
      if (e.shiftKey && (document.activeElement === first || document.activeElement === el)) (e.preventDefault(), last.focus())
      else if (!e.shiftKey && document.activeElement === last) (e.preventDefault(), first.focus())
    }
    document.addEventListener('keydown', onKey, true)
    return () => {
      document.removeEventListener('keydown', onKey, true)
      before?.focus?.()
    }
  }, [])
  return ref
}

function NativeSheet({ label, onClose, children, className }: { label: string; onClose: () => void; children: ReactNode; className?: string }) {
  const ref = useDialog(onClose)
  return (
    <div className="gwl-fade absolute inset-0 z-30 flex items-end justify-center bg-overlay" onClick={onClose}>
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={label}
        onClick={(e) => e.stopPropagation()}
        className={cn('gwl-up w-full max-w-md rounded-t-3xl bg-background p-5 pb-8 shadow-2xl outline-none', className)}
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
      <img src={photos.voyagers} alt="Great Wolf Lodge Voyagers Club" className="mb-3 h-14 w-auto" />
      <h2 className="gwl-display text-xl">Join Voyagers Club, free</h2>
      <p className="mt-1 type-text-sm-normal text-muted-foreground">Book at the Voyagers Club rate. Wiley keeps your plan in your account.</p>
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

/** J2·6: the saved plan in full, as the link Wiley sends would show it. */
function PlanPreview() {
  const { s, run, desktop } = useDemo()
  const p = savedPlan(s)
  const close = () => run([{ do: 'sheet', which: null }])
  const ref = useDialog(close)
  return (
    <div className={cn('gwl-fade absolute inset-0 z-30 flex justify-center bg-overlay', desktop ? 'items-center p-6' : 'items-end')} onClick={close}>
      <div
        ref={ref}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-labelledby="plan-title"
        onClick={(e) => e.stopPropagation()}
        className={cn('flex max-h-[92%] w-full max-w-lg flex-col overflow-hidden bg-background shadow-2xl outline-none', desktop ? 'gwl-in rounded-3xl' : 'gwl-up rounded-t-3xl')}
      >
        <div className="flex items-center justify-between gap-3 border-b px-5 py-4">
          <div className="flex flex-col">
            <span className="type-text-xs-semibold tracking-wide text-muted-foreground uppercase">Saved by Wiley</span>
            <h2 id="plan-title" className="gwl-display text-xl leading-tight">
              Your Great Wolf plan
            </h2>
          </div>
          <Button variant="ghost" intent="neutral" size="icon-sm" aria-label="Close" onClick={close}>
            <Icon icon={XIcon} />
          </Button>
        </div>
        <div className="flex flex-col gap-5 overflow-y-auto px-5 py-5">
          <div className="flex gap-4">
            {p.photo && <img src={p.photo} alt="" className="h-24 w-32 shrink-0 rounded-xl object-cover" />}
            <div className="flex min-w-0 flex-col gap-0.5">
              <span className="type-text-md-semibold">{p.suite.name}</span>
              <span className="type-text-sm-normal">{p.weekend.long} · {p.nights} nights</span>
              <span className="type-text-sm-normal text-muted-foreground">{p.guests} · sleeps up to {p.suite.sleeps}</span>
            </div>
          </div>
          <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 rounded-2xl bg-muted p-4 type-text-sm-normal">
            <dt className="text-muted-foreground">Rate</dt>
            <dd>
              {p.rateLine}
              {p.sample && <Sample className="ms-1.5 align-middle" />}
            </dd>
            {p.total && (
              <>
                <dt className="text-muted-foreground">Suite total</dt>
                <dd className="type-text-sm-semibold">
                  {p.total} for {p.nights} nights, before taxes
                </dd>
              </>
            )}
            <dt className="text-muted-foreground">Included</dt>
            <dd>Water park passes for 3 days</dd>
            <dt className="text-muted-foreground">Lodge</dt>
            <dd>
              {lodge.name}, {lodge.city}
            </dd>
          </dl>
          {p.extras.length > 0 && (
            <section aria-labelledby="plan-extras" className="flex flex-col gap-3">
              <h3 id="plan-extras" className="type-text-xs-semibold tracking-wide text-muted-foreground uppercase">
                Added to your trip ({p.extras.length})
              </h3>
              <ul className="flex flex-col gap-2">
                {p.extras.map((x) => (
                  <li key={x.id} className="flex items-center gap-3">
                    <Photo icon={x.icon} label={x.name} tone={x.tone} className="size-12 shrink-0 rounded-lg" />
                    <span className="min-w-0 flex-1 type-text-sm-semibold">{x.name}</span>
                    <span className="type-text-sm-normal whitespace-nowrap">{x.price}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}
          <section aria-labelledby="plan-things" className="flex flex-col gap-3">
            <h3 id="plan-things" className="type-text-xs-semibold tracking-wide text-muted-foreground uppercase">
              Things to do ({p.things.length})
            </h3>
            <ul className="flex flex-col gap-2">
              {p.things.map((x) => (
                <li key={x.id} className="flex items-center gap-3">
                  <Photo icon={x.icon} label={x.name} tone={x.id === 'cub-paw' ? 'lake' : x.id === 'garden' ? 'dusk' : 'forest'} className="size-12 shrink-0 rounded-lg" />
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="type-text-sm-semibold">{x.name}</span>
                    <span className="type-text-xs-normal text-muted-foreground">
                      {x.when} · {x.where}
                    </span>
                  </span>
                </li>
              ))}
            </ul>
          </section>
          <p className="type-text-xs-normal text-muted-foreground">
            {s.planSaved ? 'Wiley sent a link to this plan. It brings back this plan and your chat. ' : ''}Not booked yet: nothing is reserved until you book.
          </p>
        </div>
        <div className="flex justify-end gap-2 border-t px-5 py-4">
          <Button shape="pill" variant="outline" intent="neutral" onClick={close}>
            Close
          </Button>
          <Button shape="pill" onClick={() => run([{ do: 'sheet', which: null }, { do: 'end', card: 'checkout' }])}>
            Book now
          </Button>
        </div>
      </div>
    </div>
  )
}

export function NativeSheets() {
  const { s } = useDemo()
  if (s.sheet === 'plan') return <PlanPreview />
  if (s.sheet === 'apple') return <ApplePay />
  if (s.sheet === 'join') return <Join />
  if (s.sheet === 'share') return <Share />
  return null
}

function EndDialog({ label, children }: { label: string; children: ReactNode }) {
  const ref = useDialog()
  return (
    <div ref={ref} tabIndex={-1} role="dialog" aria-modal="true" aria-label={label} className="gwl-in w-full max-w-sm rounded-3xl bg-background p-6 shadow-2xl outline-none">
      {children}
    </div>
  )
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
    <div className="gwl-fade absolute inset-0 z-50 grid place-items-center bg-overlay p-4">
      <EndDialog label={copy.title}>
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
      </EndDialog>
    </div>
  )
}
