import { FileText, Mail, Clock, CalendarDays } from 'lucide-react'
import type { CardAction, CardV2, Widget } from './types'

// A faithful-looking stand-in for Google Chat, on purpose not in Forward colours.
const ICONS: Record<string, typeof FileText> = { DESCRIPTION: FileText, EMAIL: Mail, CLOCK: Clock, INVITE: CalendarDays }

const Rich = ({ html }: { html: string }) => <span dangerouslySetInnerHTML={{ __html: html.replace(/<(?!\/?b>)[^>]*>/g, '') }} />

function Btn({ b, onAction }: { b: { text: string; onClick: CardAction; type?: string }; onAction: (fn: string, params: Record<string, string>) => void }) {
  const filled = b.type === 'FILLED'
  return (
    <button
      type="button"
      className={filled ? 'rounded-full bg-[#0b57d0] px-4 py-1.5 text-[13px] font-medium text-white hover:bg-[#0a4cb8]' : 'rounded-full border border-[#747775] px-4 py-1.5 text-[13px] font-medium text-[#0b57d0] hover:bg-[#0b57d0]/8'}
      onClick={() => {
        if ('action' in b.onClick) onAction(b.onClick.action.function, Object.fromEntries((b.onClick.action.parameters ?? []).map((p) => [p.key, p.value])))
        else onAction('openLink', { url: b.onClick.openLink.url })
      }}
    >
      {b.text}
    </button>
  )
}

function W({ w, onAction }: { w: Widget; onAction: (fn: string, params: Record<string, string>) => void }) {
  if ('textParagraph' in w) return <p className="text-[14px] leading-5"><Rich html={w.textParagraph.text} /></p>
  if ('divider' in w) return <hr className="border-[#c4c7c5]" />
  if ('buttonList' in w)
    return (
      <div className="flex flex-wrap gap-2">
        {w.buttonList.buttons.map((b) => <Btn key={b.text} b={b} onAction={onAction} />)}
      </div>
    )
  const d = w.decoratedText
  const Icon = d.startIcon ? ICONS[d.startIcon.knownIcon] : undefined
  return (
    <div className="flex items-start gap-3">
      {Icon && <Icon className="mt-0.5 size-4 shrink-0 text-[#444746]" aria-hidden />}
      <div>
        {d.topLabel && <p className="text-[12px] text-[#444746]">{d.topLabel}</p>}
        <p className="text-[14px]"><Rich html={d.text} /></p>
        {d.bottomLabel && <p className="text-[12px] text-[#444746]">{d.bottomLabel}</p>}
      </div>
    </div>
  )
}

export function ChatCard({ card, onAction }: { card: CardV2; onAction: (fn: string, params: Record<string, string>) => void }) {
  const { header, sections } = card.card
  return (
    <div className="w-full max-w-md overflow-hidden rounded-xl border border-[#c4c7c5] bg-white font-[Roboto,Arial,sans-serif] text-[#1f1f1f]">
      {header && (
        <div className="flex items-center gap-3 border-b border-[#e3e3e3] px-4 py-3">
          <span className="flex size-9 items-center justify-center rounded-full bg-[#0b57d0] text-sm font-medium text-white" aria-hidden>H</span>
          <div><p className="text-[15px] font-medium">{header.title}</p>{header.subtitle && <p className="text-[12px] text-[#444746]">{header.subtitle}</p>}</div>
        </div>
      )}
      <div className="divide-y divide-[#e3e3e3]">
        {sections.map((s, i) => (
          <section key={i} className="space-y-3 px-4 py-3">
            {s.header && <h4 className="text-[12px] font-medium text-[#444746]">{s.header}</h4>}
            {s.widgets.map((w, j) => <W key={j} w={w} onAction={onAction} />)}
          </section>
        ))}
      </div>
    </div>
  )
}
