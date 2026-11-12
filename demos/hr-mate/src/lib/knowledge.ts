import type { Dispatch } from 'react'
import { NOW } from '@/lib/dates'
import type { Action } from '@/lib/demo-state'
import type { FileKind } from '@/mocks/types'

export const KIND_LABEL: Record<FileKind, string> = { pdf: 'PDF', word: 'Word', sheet: 'Excel', link: 'Link' }

/** Adds files as "indexing", then marks each ready a moment later (the prototype's stand-in for real indexing). */
export function uploadFiles(
  dispatch: Dispatch<Action>,
  collectionId: string,
  items: { name: string; kind: FileKind; sizeKb: number | null }[],
  owner = 'Alex Morgan',
) {
  items.forEach((it, i) => {
    const id = `f-${Date.now()}-${i}`
    dispatch({ type: 'addFile', file: { id, collectionId, ...it, owner, updatedAt: NOW.toISOString(), status: 'indexing' } })
    setTimeout(() => dispatch({ type: 'setFileStatus', id, status: 'indexed' }), 1800 + i * 700)
  })
}

export const formatSize = (kb: number | null) => (kb === null ? '—' : kb >= 1024 ? `${(kb / 1024).toFixed(1)} MB` : `${kb} KB`)
