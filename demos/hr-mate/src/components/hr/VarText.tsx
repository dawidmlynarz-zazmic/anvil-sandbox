import { Fragment } from 'react'

/** Renders message text with {{variables}} highlighted. */
export function VarText({ text }: { text: string }) {
  const parts = text.split(/(\{\{[^}]+\}\})/g)
  return (
    <>
      {parts.map((p, i) =>
        p.startsWith('{{') ? (
          <span key={i} className="bg-primary-muted text-primary-soft rounded px-1 font-mono text-[0.9em]">
            {p.slice(2, -2)}
          </span>
        ) : (
          <Fragment key={i}>{p}</Fragment>
        ),
      )}
    </>
  )
}
