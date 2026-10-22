// ANVIL-CANDIDATE: see docs/anvil-upgrade-candidates.md#tag-input
import { useId, useRef, useState } from 'react'
import { Chip } from '@anvil/components/anvil/chip'
import { Label } from '@anvil/components/ui/label'
import { cn } from '@anvil/lib/utils'

export interface TagInputProps {
  label: string
  value: string[]
  onValueChange: (tags: string[]) => void
  placeholder?: string
  hint?: string
  className?: string
}

/**
 * A text field that holds tags inline. A comma or Enter turns what you typed into a tag; a pasted "a, b, c" becomes
 * three; Backspace in an empty field removes the last one. Styled like Anvil's Input (same stroke, hover and focus).
 */
export function TagInput({ label, value, onValueChange, placeholder, hint, className }: TagInputProps) {
  const id = useId()
  const hintId = `${id}-hint`
  const input = useRef<HTMLInputElement>(null)
  const [draft, setDraft] = useState('')

  const add = (raw: string) => {
    const fresh = raw
      .split(',')
      .map((t) => t.trim())
      .filter((t) => t && !value.some((v) => v.toLowerCase() === t.toLowerCase()))
    if (fresh.length) onValueChange([...value, ...fresh.filter((t, i) => fresh.findIndex((x) => x.toLowerCase() === t.toLowerCase()) === i)])
  }

  return (
    <div className={cn('flex flex-col gap-1.5', className)}>
      <Label htmlFor={id}>{label}</Label>
      {/* The whole box focuses the text field, like one input. */}
      <div
        className={cn(
          'flex min-h-10 w-full flex-wrap items-center gap-1.5 rounded-md bg-background px-2 py-1.5',
          'inset-ring inset-ring-overlay-16 inset-shadow-xs transition-[box-shadow] duration-(--duration-fast) ease-out hover:inset-ring-overlay-24',
          'focus-within:inset-ring-(length:--stroke-focus) focus-within:inset-ring-border-action focus-within:focus-ring',
        )}
        onClick={() => input.current?.focus()}
      >
        <ul className="contents" aria-label={`${label}: ${value.length} tag${value.length === 1 ? '' : 's'}`}>
          {value.map((tag) => (
            <li key={tag} className="contents">
              <Chip variant="outline" size="sm" removeLabel={`Remove ${tag}`} onRemove={() => onValueChange(value.filter((t) => t !== tag))}>
                {tag}
              </Chip>
            </li>
          ))}
        </ul>
        <input
          ref={input}
          id={id}
          aria-describedby={hint ? hintId : undefined}
          className="min-w-24 flex-1 bg-transparent px-1 type-text-sm-normal text-foreground outline-none placeholder:text-foreground-disabled"
          placeholder={value.length ? undefined : placeholder}
          value={draft}
          onChange={(e) => {
            const text = e.target.value
            // A comma closes the tag; anything typed after it starts the next one.
            if (text.includes(',')) {
              const parts = text.split(',')
              add(parts.slice(0, -1).join(','))
              setDraft(parts.at(-1)!.trimStart())
            } else setDraft(text)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              add(draft)
              setDraft('')
            } else if (e.key === 'Backspace' && !draft && value.length) {
              onValueChange(value.slice(0, -1))
            }
          }}
          onBlur={() => {
            if (draft.trim()) {
              add(draft)
              setDraft('')
            }
          }}
        />
      </div>
      {hint && (
        <p id={hintId} className="text-muted-foreground type-text-xs-normal">
          {hint}
        </p>
      )}
    </div>
  )
}
