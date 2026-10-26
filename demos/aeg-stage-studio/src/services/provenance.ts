import type { Asset, Generation } from '~/state/types'

// Where every image and clip came from: the model, what it was asked, what it was made from, who asked and when, and
// what protects it. Shown on every explored image and every asset, so provenance is never a separate audit.

export interface Provenance {
  model: string
  /** The prompt as the model received it. */
  prompt: string
  /** What it was made from, e.g. “#2 → #6” or “The look, #6”. */
  from: string
  by: string
  at: string
}

const SOURCE: Record<Generation['source'], string> = {
  directions: 'a batch of new directions',
  more: 'a “more like this” batch',
  angles: 'an “other angles” batch',
  light: 'an “other light” batch',
  edit: 'a change you described',
  take: 'another take',
}

export function ofGeneration(gen: Generation, chain: Generation[]): Provenance {
  return {
    model: 'Nano Banana Pro',
    prompt: `${gen.caption.startsWith(gen.title) ? gen.caption : `${gen.title}: ${gen.caption.toLowerCase()}`}. Song ${gen.song}, lit for its slot, from the brief’s visual direction and references.`,
    from: chain.length > 1 ? `${chain.map((g) => `#${g.n}`).join(' → ')}, via ${SOURCE[gen.source]}` : `The brief, via ${SOURCE[gen.source]}`,
    by: gen.author === 'you' ? 'You' : 'Stage agent',
    at: gen.at ?? 'Earlier',
  }
}

export function ofAsset(asset: Asset, look: Generation): Provenance {
  return { model: asset.model, prompt: asset.prompt, from: `The look, #${look.n}`, by: 'Stage agent, when you built the kit', at: asset.at }
}
