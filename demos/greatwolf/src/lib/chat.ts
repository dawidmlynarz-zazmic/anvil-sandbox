import { useCallback, useEffect, useRef, useState, type ReactNode } from 'react'

// A scripted agent: no model behind it. Each screen gives `respond` a function that reads the words used and returns a
// canned reply (text, tool lines, a card, follow-up chips). Anything it doesn't know gets that screen's fallback.

export interface Chip {
  label: string
  /** What the guest "says" when the chip is picked. Defaults to the label. */
  say?: string
  /** Runs instead of sending a message (e.g. leaves for another screen). */
  onPick?: () => void
}

export interface Reply {
  text?: ReactNode
  tools?: string[]
  widget?: ReactNode
  /** Only the newest turn with this key shows its widget, so a live card isn't repeated down the thread. */
  widgetKey?: string
  citations?: ReactNode
  chips?: Chip[]
  /** Runs when the reply lands, so the page can change with the conversation. */
  effect?: () => void
  /** Typing time in ms. */
  delay?: number
}

export interface Turn extends Omit<Reply, 'effect' | 'delay'> {
  id: string
  role: 'user' | 'agent'
  voice?: boolean
}

export interface Chat {
  turns: Turn[]
  busy: boolean
  say: (text: string, opts?: { voice?: boolean; silent?: boolean }) => void
  pick: (chip: Chip) => void
  agentSay: (reply: Reply) => void
}

export function useChat(respond: (text: string) => Reply, opening?: Reply): Chat {
  const n = useRef(0)
  const next = () => `t${++n.current}`
  const [turns, setTurns] = useState<Turn[]>(() => {
    if (!opening) return []
    const { effect: _effect, delay: _delay, ...rest } = opening
    return [{ id: `t${++n.current}`, role: 'agent', ...rest }]
  })
  const [busy, setBusy] = useState(false)
  const timer = useRef<ReturnType<typeof setTimeout> | undefined>(undefined)
  const respondRef = useRef(respond)
  respondRef.current = respond

  useEffect(() => () => clearTimeout(timer.current), [])

  const land = useCallback((reply: Reply) => {
    const { effect, delay: _delay, ...rest } = reply
    setTurns((t) => [...t, { id: next(), role: 'agent', ...rest }])
    setBusy(false)
    effect?.()
  }, [])

  const agentSay = useCallback(
    (reply: Reply) => {
      setBusy(true)
      clearTimeout(timer.current)
      timer.current = setTimeout(() => land(reply), reply.delay ?? 700)
    },
    [land],
  )

  const say = useCallback(
    (text: string, opts?: { voice?: boolean; silent?: boolean }) => {
      if (!opts?.silent) setTurns((t) => [...t.map((x) => ({ ...x, chips: undefined })), { id: next(), role: 'user', text, voice: opts?.voice }])
      agentSay(respondRef.current(text))
    },
    [agentSay],
  )

  const pick = useCallback((chip: Chip) => (chip.onPick ? chip.onPick() : say(chip.say ?? chip.label)), [say])

  return { turns, busy, say, pick, agentSay }
}

/** First matching rule wins; `fallback` answers everything else, so no input is a dead end. */
export function match<T>(text: string, rules: [RegExp, T][], fallback: T): T {
  const hit = rules.find(([re]) => re.test(text))
  return hit ? hit[1] : fallback
}
