// ANVIL-CANDIDATE: see docs/anvil-upgrade-candidates.md#profile-questions
import { useId, useState } from 'react'
import { ShellDescription, ShellFooter, ShellHeader, ShellTitle } from '@anvil/components/anvil/shell'
import { IconTile } from '@anvil/components/anvil/icon-tile'
import { Button } from '@anvil/components/ui/button'
import { ArrowRightIcon, CheckIcon, ChevronLeftIcon, CircleHelpIcon, Icon } from '@anvil/components/ui/icon'
import { InputGroup, InputGroupAddon, InputGroupButton, InputGroupInput } from '@anvil/components/ui/input-group'
import { Kbd } from '@anvil/components/ui/kbd'
import { Label } from '@anvil/components/ui/label'
import { Progress } from '@anvil/components/ui/progress'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@anvil/components/ui/select'
import { cn } from '@anvil/lib/utils'

export interface ProfileQuestionItem {
  id: string
  title: string
  /** `options`: a few choices to click (as Anvil Clarifying Question). `select`: a dropdown, for long lists. */
  kind: 'options' | 'select'
  options: { value: string; label: string }[]
  /** Options only: also lets you type your own answer. */
  allowOther?: boolean
}

type Answers = Record<string, string | null>

/**
 * Anvil Clarifying Question with two more answer types: a dropdown (`select`) and "your own" text next to the options
 * (`allowOther`). Same card, header, progress, option buttons and footer, composed from the same Anvil parts, so it
 * reads as the same component. One question at a time; Back, Skip and Submit as in Anvil.
 */
export function ProfileQuestions({
  questions,
  onSubmit,
  className,
}: {
  questions: ProfileQuestionItem[]
  onSubmit: (answers: Answers) => void
  className?: string
}) {
  const titleId = useId()
  const [step, setStep] = useState(0)
  const [answers, setAnswers] = useState<Answers>({})
  const [picked, setPicked] = useState('')
  const [own, setOwn] = useState('')
  const question = questions[step]!
  const last = step === questions.length - 1
  const complete = questions.every((q) => q.id in answers)

  const go = (next: number) => {
    setStep(next)
    setPicked(answers[questions[next]!.id] ?? '')
    setOwn('')
  }
  const answer = (value: string | null) => {
    setAnswers((a) => ({ ...a, [question.id]: value }))
    if (!last) {
      setStep(step + 1)
      setPicked(answers[questions[step + 1]!.id] ?? '')
      setOwn('')
    }
  }

  return (
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions -- number keys are a shortcut on top of the option buttons
    <section
      data-slot="clarifying-question"
      aria-labelledby={titleId}
      onKeyDown={(event) => {
        if (question.kind !== 'options' || event.target instanceof HTMLInputElement) return
        const index = Number(event.key) - 1
        if (Number.isInteger(index) && index >= 0 && index < question.options.length) {
          event.preventDefault()
          answer(question.options[index]!.value)
        }
      }}
      className={cn('flex w-full max-w-140 flex-col overflow-hidden rounded-xl border bg-card text-card-foreground', className)}
    >
      <ShellHeader variant="card" className="border-b-0" media={<IconTile icon={CircleHelpIcon} tone="agent" size="sm" />}>
        <ShellTitle id={titleId}>{question.title}</ShellTitle>
        <ShellDescription>
          Question {step + 1} of {questions.length}
        </ShellDescription>
      </ShellHeader>
      <div className="px-4 pb-3">
        <Progress
          size="sm"
          tone="agent"
          value={((step + (question.id in answers ? 1 : 0)) / questions.length) * 100}
          aria-label={`Question ${step + 1} of ${questions.length}`}
        />
      </div>

      {question.kind === 'select' ? (
        <div className="flex flex-col gap-2 px-4 pb-4">
          <Select value={picked} onValueChange={setPicked}>
            <SelectTrigger aria-label={question.title} className="w-full">
              <SelectValue placeholder="Choose one" />
            </SelectTrigger>
            <SelectContent>
              {question.options.map((option) => (
                <SelectItem key={option.value} value={option.value}>
                  {option.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button variant="outline" intent="neutral" size="sm" className="self-end" disabled={!picked} onClick={() => answer(picked)}>
            {last ? 'Use this' : 'Next'}
            <Icon icon={ArrowRightIcon} />
          </Button>
        </div>
      ) : (
        <div className="flex flex-col gap-3 px-4 pb-4">
          <ol aria-label="Options" className="flex flex-col gap-1.5">
            {question.options.map((option, i) => {
              const chosen = answers[question.id] === option.value
              return (
                <li key={option.value}>
                  <Button
                    variant="outline"
                    intent="neutral"
                    aria-pressed={chosen}
                    onClick={() => answer(option.value)}
                    className={cn(
                      'h-auto w-full justify-start gap-2.5 px-3 py-2.5 text-start whitespace-normal',
                      'aria-pressed:bg-info-subtle aria-pressed:inset-ring-border-action',
                    )}
                  >
                    <Kbd className="size-5.5">{i + 1}</Kbd>
                    <span className="min-w-0 flex-1 type-text-sm-normal text-foreground">{option.label}</span>
                    <Icon icon={chosen ? CheckIcon : ArrowRightIcon} className={cn('size-3.5', chosen ? 'text-info-medium' : 'text-muted-foreground')} />
                  </Button>
                </li>
              )
            })}
          </ol>
          {question.allowOther && (
            <form
              className="flex flex-col gap-1.5"
              onSubmit={(e) => {
                e.preventDefault()
                if (own.trim()) answer(own.trim())
              }}
            >
              <Label htmlFor={`${titleId}-own`}>Or describe your own</Label>
              <InputGroup>
                <InputGroupInput id={`${titleId}-own`} placeholder="e.g. brutalist, neon, haze" value={own} onChange={(e) => setOwn(e.target.value)} />
                <InputGroupAddon align="inline-end">
                  <InputGroupButton type="submit" disabled={!own.trim()}>
                    Use this
                  </InputGroupButton>
                </InputGroupAddon>
              </InputGroup>
            </form>
          )}
        </div>
      )}

      <ShellFooter variant="card" note={question.kind === 'options' ? `Press 1–${question.options.length} to choose` : 'Pick from the list'}>
        {step > 0 && (
          <Button variant="ghost" intent="neutral" size="xs" onClick={() => go(step - 1)} className="order-first">
            <Icon icon={ChevronLeftIcon} />
            Back
          </Button>
        )}
        <Button variant="ghost" intent="neutral" size="xs" onClick={() => answer(null)}>
          Skip
        </Button>
        {last && (
          <Button intent="brand" size="xs" disabled={!complete} onClick={() => onSubmit(answers)}>
            Submit
          </Button>
        )}
      </ShellFooter>
    </section>
  )
}
