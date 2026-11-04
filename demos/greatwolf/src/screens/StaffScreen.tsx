import { useRef } from 'react'
import { useNavigate, useSearchParams } from 'react-router-dom'
import { ApprovalCard, ApprovalCardField } from '@anvil/components/agent/approval-card'
import { ShellFooter } from '@anvil/components/anvil/shell'
import { Alert, AlertDescription } from '@anvil/components/ui/alert'
import { Button } from '@anvil/components/ui/button'
import { CheckIcon, ClipboardListIcon, Icon, MessageSquareHeartIcon, ScaleIcon, UsersIcon } from '@anvil/components/ui/icon'
import { AgentChat } from '~/components/local/AgentChat/AgentChat'
import { Citations } from '~/components/local/Citations/Citations'
import { DeviceFrame } from '~/components/local/DeviceFrame/DeviceFrame'
import { family } from '~/data/family'
import { inventory } from '~/data/inventory'
import { match, useChat, type Chat, type Reply } from '~/lib/chat'
import { money } from '~/lib/format'
import { useStore } from '~/state/store'

const AGENTS = [
  { id: 'policy', label: 'Guest policy', icon: ScaleIcon, blurb: 'Rules, limits, what you can do' },
  { id: 'ops', label: 'Ops reports', icon: ClipboardListIcon, blurb: 'Today across the lodge' },
  { id: 'staffing', label: 'Staffing forecast', icon: UsersIcon, blurb: 'Demand and shifts' },
  { id: 'feedback', label: 'Feedback insights', icon: MessageSquareHeartIcon, blurb: 'What guests are saying' },
] as const
type AgentId = (typeof AGENTS)[number]['id']

function RefundCard({ onRefund, onTicket }: { onRefund: () => void; onTicket: () => void }) {
  const { session } = useStore()
  const done = session.ticket === 'resolved'
  return (
    <ApprovalCard
      status={done ? 'approved' : 'pending'}
      title={`Refund ${money(inventory.cabana.price)} to Suite ${family.suite}`}
      subtitle="Billing · duplicate cabana charge"
      badge={done ? 'Refunded' : 'Needs your approval'}
      className="w-full max-w-xl"
      footer={
        done ? (
          <ShellFooter variant="card" note="Refunded and logged as DUP. The guest’s app shows it.">
            <Button variant="ghost" intent="neutral" size="sm" disabled><Icon icon={CheckIcon} />Done</Button>
          </ShellFooter>
        ) : (
          <ShellFooter variant="card">
            <span className="flex-1" />
            <Button variant="outline" intent="neutral" size="sm" onClick={onTicket}>Open ticket</Button>
            <Button size="sm" onClick={onRefund}>Refund {money(inventory.cabana.price)}</Button>
          </ShellFooter>
        )
      }
    >
      <ApprovalCardField label="Guest">{family.guest} {family.name}, Suite {family.suite}</ApprovalCardField>
      <ApprovalCardField label="Charge">{inventory.cabana.name}, Sat 1–3 pm, posted twice</ApprovalCardField>
      <ApprovalCardField label="Limit check">Within your limit. Front desk can refund duplicates up to $500 without manager approval.</ApprovalCardField>
    </ApprovalCard>
  )
}

function Pane({ agent }: { agent: AgentId }) {
  const { session, patch } = useStore()
  const navigate = useNavigate()
  const sessionRef = useRef(session)
  sessionRef.current = session
  const chatRef = useRef<Chat | null>(null)

  const refund = () => {
    patch({ ticket: 'resolved' })
    chatRef.current?.agentSay({ text: `Refunded ${money(inventory.cabana.price)} and logged it as DUP. The guest’s app now shows the credit and a resolved ticket.`, delay: 500 })
  }
  const openTicket = () => chatRef.current?.agentSay({ text: 'Ticket GW-4821 is open and assigned to you. The refund is still waiting for your approval.', delay: 400 })
  const refundCard = { widget: <RefundCard onRefund={refund} onTicket={openTicket} />, widgetKey: 'refund' }

  const respond = (text: string): Reply => {
    const s = sessionRef.current
    if (agent === 'policy') {
      return match<Reply>(
        text,
        [
          [/cabana|twice|duplicate|412|charge|refund|billing/i, s.ticket === 'resolved'
            ? { text: 'That one is done: the duplicate cabana charge was refunded.', ...refundCard }
            : {
                tools: ['Read folio MZ-0312', 'Checked Billing SOP 4.2'],
                text: `Cabana 12 for Saturday was posted twice, two minutes apart (source 2), and the guest booked it once. Billing policy treats that as a duplicate and lets front desk refund up to $500 without a manager (source 1). I’d refund ${money(inventory.cabana.price)}.`,
                citations: <Citations ids={['sop', 'folio']} />,
                ...refundCard,
              }],
          [/limit|allowed|can i|approve|manager/i, { text: 'Front desk can refund duplicate charges up to $500 without a manager. Anything above that needs manager approval.', citations: <Citations ids={['sop']} /> }],
        ],
        { text: 'I can check billing rules, refund limits and guest policies. Ask me about a guest, or pick the open ticket.', chips: [{ label: 'Suite 412 says the cabana was charged twice' }] },
      )
    }
    if (agent === 'feedback') {
      return match<Reply>(text, [[/martinez|new|latest|412/i, { text: s.feedback ? `Latest: the ${family.name} family, ${s.feedback.rating} of 5. “${s.feedback.text}”` : 'No new feedback from this weekend yet. It appears here once a guest finishes the post-stay check-in.' }]], {
        text: 'I can summarize themes, or show the latest feedback.',
        chips: [{ label: 'Show the latest feedback' }],
      })
    }
    if (agent === 'staffing') {
      return { text: 'The forecast screen has the full picture. Want to open it?', chips: [{ label: 'Open the demand forecast', onPick: () => navigate('/lodge/forecast') }] }
    }
    return match<Reply>(text, [[/ticket|open|guest/i, { text: s.ticket === 'none' ? 'No open guest tickets right now.' : s.ticket === 'requested' ? '1 open guest ticket: a refund request from Suite 412, waiting on the front desk.' : 'All guest tickets are closed.' }]], {
      text: 'I can summarize open items. Ask about tickets or today’s open items.',
      chips: [{ label: 'Any open guest tickets?' }],
    })
  }

  const feedbackNote = session.feedback
    ? ` New from the ${family.name} family: ${session.feedback.rating} of 5. “${session.feedback.text}”`
    : ' Nothing new from this weekend yet.'
  const openings: Record<AgentId, Reply> = {
    policy: { text: `Hi Jordan. I can check guest policy, billing rules and what your role allows.${session.ticket === 'requested' ? ' You have one open ticket from Suite 412.' : ''}`, chips: [{ label: 'Suite 412 says the cabana was charged twice' }] },
    ops: { text: 'Here’s the lodge today. Ask about open items or tickets.', chips: [{ label: 'Any open guest tickets?' }] },
    staffing: { text: 'Saturday, Mar 13 is the busiest day in the next two weeks. The forecast has three recommended actions.', chips: [{ label: 'Open the demand forecast', onPick: () => navigate('/lodge/forecast') }] },
    feedback: { text: `Recent feedback is mostly about wait times at the water park and the birthday party.${feedbackNote}`, chips: [{ label: 'Show the latest feedback' }] },
  }

  const chat = useChat(respond, openings[agent])
  chatRef.current = chat

  const banner =
    agent === 'policy' && session.ticket === 'requested' ? (
      <div className="px-4 pb-2">
        <Alert tone="info" size="sm">
          <AlertDescription className="flex flex-wrap items-center justify-between gap-2">
            <span>New guest ticket: refund requested from Suite {family.suite}.</span>
            <Button size="xs" variant="outline" intent="neutral" onClick={() => chat.say('Suite 412 says the cabana was charged twice')}>Ask about it</Button>
          </AlertDescription>
        </Alert>
      </div>
    ) : undefined

  return (
    <AgentChat
      chat={chat}
      name={AGENTS.find((a) => a.id === agent)!.label}
      subtitle="Staff assistant"
      surface="full-screen"
      placeholder="Ask the assistant"
      disclaimer="Scripted demo. Answers come from sample data."
      aboveComposer={banner}
    />
  )
}

export function StaffScreen() {
  const [params, setParams] = useSearchParams()
  const agent = (AGENTS.find((a) => a.id === params.get('agent'))?.id ?? 'policy') as AgentId
  const { session } = useStore()

  return (
    <DeviceFrame kind="desktop" url="staff.greatwolf.example/assistant" className="max-lg:h-auto max-lg:min-h-[640px]">
      <div className="flex min-h-0 flex-1 flex-col max-lg:flex-none md:flex-row">
        <nav aria-label="Agents" className="flex shrink-0 gap-1 overflow-x-auto border-b p-2 md:w-60 md:flex-col md:border-r md:border-b-0 md:p-3">
          <p className="type-text-xs-medium hidden px-2 pb-1 text-muted-foreground md:block">Agents</p>
          {AGENTS.map((a) => (
            <button
              key={a.id}
              type="button"
              aria-current={agent === a.id ? 'page' : undefined}
              onClick={() => setParams(a.id === 'policy' ? {} : { agent: a.id })}
              className="flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-left outline-none transition-colors hover:bg-muted focus-visible:focus-ring aria-[current=page]:bg-muted"
            >
              <Icon icon={a.icon} />
              <span className="flex flex-col">
                <span className="type-text-sm-medium whitespace-nowrap">{a.label}</span>
                <span className="type-text-xs-normal hidden text-muted-foreground md:block">{a.blurb}</span>
              </span>
              {a.id === 'policy' && session.ticket === 'requested' && <span aria-label="1 open ticket" className="ml-auto size-2 rounded-full bg-danger" />}
              {a.id === 'feedback' && session.feedback && <span aria-label="New feedback" className="ml-auto size-2 rounded-full bg-primary" />}
            </button>
          ))}
        </nav>
        <div className="flex min-h-[520px] min-w-0 flex-1 md:min-h-0">
          <Pane key={agent} agent={agent} />
        </div>
      </div>
    </DeviceFrame>
  )
}
