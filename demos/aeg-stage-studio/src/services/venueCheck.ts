import { isCovered, venueOf } from '~/mocks/venues'
import type { Brief, ConceptShape, StillSpec, Venue } from '~/state/types'

// The set checked against the venue, with numbers. Each design's footprint (width, height, weight, how much of it
// flies, and its wind area) is estimated from its shape and its size and height changes, then held against the venue's
// limits: stage width, trim height, rigging load, and for open-air stages the evening gusts. All figures are samples
// until AEG's venue library and a structural engineer supply real ones; the app says so wherever they appear.

export type CheckStatus = 'pass' | 'warn' | 'fail'

export interface VenueCheck {
  label: string
  status: CheckStatus
  /** The finding, with its numbers. */
  detail: string
  /** A change in words that would clear it, when there is one (“narrower”). */
  fix?: string
}

/** A design's physical footprint, at its size (1 = as designed) and lift. */
export interface Footprint {
  width: number
  height: number
  /** Total weight, tonnes. */
  weight: number
  /** The part that hangs from the roof or grid, tonnes. */
  flown: number
  /** Area facing the wind, m². */
  sail: number
}

const BASE: Record<ConceptShape, { width: number; height: number; weight: number; flies: number; sail: number }> = {
  arch: { width: 20, height: 13, weight: 16, flies: 0.3, sail: 55 },
  monolith: { width: 9, height: 15, weight: 24, flies: 0.2, sail: 135 },
  ribbons: { width: 18, height: 9, weight: 10, flies: 0.8, sail: 40 },
  halo: { width: 14, height: 11, weight: 20, flies: 1, sail: 25 },
}

const round1 = (n: number) => Math.round(n * 10) / 10

export function footprint(spec: Pick<StillSpec, 'concept' | 'with' | 'tweaks'>): Footprint {
  const scale = spec.tweaks?.width ?? 1
  const lift = spec.tweaks?.lift ?? 0
  const a = BASE[spec.concept]
  const b = spec.with && spec.with !== spec.concept ? BASE[spec.with] : undefined
  // A second centrepiece sits inside the first: it adds most of its weight and wind area, not its width.
  const weight = (a.weight + (b ? b.weight * 0.6 : 0)) * scale
  const flown = (a.weight * a.flies + (b ? b.weight * 0.6 * b.flies : 0)) * scale
  return {
    width: round1(Math.max(a.width, b?.width ?? 0) * scale),
    height: round1(Math.max(a.height, b?.height ?? 0) + lift),
    weight: round1(weight),
    flown: round1(flown),
    sail: Math.round((a.sail + (b ? b.sail * 0.6 : 0)) * scale),
  }
}

/** The wind speed a design holds to before it needs a wind hold (lowered or de-rigged), m/s. Bigger sail, lower hold. */
export const holdsTo = (fp: Footprint) => Math.round(26 * Math.sqrt(40 / fp.sail))

export function venueChecks(spec: StillSpec, brief: Brief, reworked = false, venue: Venue = venueOf(brief.venueId)): VenueCheck[] {
  const fp = footprint(spec)
  const l = venue.limits
  const t = spec.tweaks ?? {}
  const checks: VenueCheck[] = []

  checks.push(
    fp.width > l.stageWidth
      ? { label: 'Stage width', status: 'fail', detail: `${fp.width} m wide on a ${l.stageWidth} m stage.`, fix: 'narrower' }
      : fp.width > l.stageWidth * 0.9
        ? { label: 'Stage width', status: 'warn', detail: `${fp.width} m of the ${l.stageWidth} m stage: no room for side screens or wings.`, fix: 'narrower' }
        : { label: 'Stage width', status: 'pass', detail: `${fp.width} m of the ${l.stageWidth} m stage.` },
  )
  checks.push(
    fp.height > l.trim
      ? { label: 'Trim height', status: 'fail', detail: `${fp.height} m tall; the venue trims at ${l.trim} m.`, fix: 'lower' }
      : { label: 'Trim height', status: 'pass', detail: `${fp.height} m tall, under the ${l.trim} m trim.` },
  )
  checks.push(
    fp.flown > l.rigging
      ? { label: 'Rigging', status: 'fail', detail: `${fp.flown} t flown; the ${venue.covered ? 'grid' : 'roof'} takes ${l.rigging} t.`, fix: 'narrower' }
      : fp.flown > l.rigging * 0.85
        ? { label: 'Rigging', status: 'warn', detail: `${fp.flown} of ${l.rigging} t flown: little left for lighting and audio.`, fix: 'narrower' }
        : { label: 'Rigging', status: 'pass', detail: `${fp.flown} of ${l.rigging} t flown.` },
  )
  checks.push({ label: 'LED wall', status: 'pass', detail: spec.concept === 'monolith' ? `Carries its own screen; the ${l.led[0]} × ${l.led[1]} m wall stays free for IMAG.` : `Works with the ${l.led[0]} × ${l.led[1]} m main wall.` })

  // Sightlines and no-gos: a design's known risk, cleared by a visible change that addresses it or by a rework.
  const blocks = spec.concept === 'monolith' && !reworked && (t.width ?? 1) >= 1 && (t.lift ?? 0) <= 0
  checks.push(
    blocks
      ? { label: 'Sightlines', status: 'warn', detail: 'The monolith hides part of the screen from the back of the room.', fix: 'narrower or raised' }
      : { label: 'Sightlines', status: 'pass', detail: 'Clear from front of house and the back of the room.' },
  )
  const strobe = spec.concept === 'ribbons' && !reworked && (t.brightness ?? 1) >= 1
  checks.push(
    strobe
      ? { label: 'Artist no-gos', status: 'warn', detail: 'The fastest LED chase could read as strobe. Keep it under 3 Hz.', fix: 'softer' }
      : { label: 'Artist no-gos', status: 'pass', detail: `Respects: ${brief.constraints.noGo.split('\n')[0] || 'nothing listed yet'}.` },
  )

  if (!isCovered(venue.id) && l.gusts) {
    const hold = holdsTo(fp)
    checks.push(
      hold < l.gusts
        ? { label: 'Wind', status: 'fail', detail: `Holds to ${hold} m/s; evening gusts reach ${l.gusts} m/s. It would come down mid-set.`, fix: 'narrower' }
        : hold < l.gusts + 3
          ? { label: 'Wind', status: 'warn', detail: `Holds to ${hold} m/s; evening gusts reach ${l.gusts} m/s. Needs a wind plan: lower it at ${hold - 2} m/s.`, fix: 'narrower' }
          : { label: 'Wind', status: 'pass', detail: `Holds to ${hold} m/s; evening gusts reach ${l.gusts} m/s.` },
    )
  }

  checks.push({ label: 'Budget band', status: 'pass', detail: `${fp.weight} t of structure, buildable within the chosen band.` })
  return checks
}

/** The checks that need a look, in words: “wind and sightlines”. */
export const issues = (checks: VenueCheck[]) => checks.filter((c) => c.status !== 'pass')

/** One line on the fixes, for the agent: “Try “narrower” on it before locking.” */
export function fixHint(checks: VenueCheck[]) {
  const fixes = [...new Set(issues(checks).flatMap((c) => (c.fix ? [c.fix] : [])))]
  return fixes.length ? `Try “${fixes[0]}”` : ''
}

/** For display: “24 m”, “18 m trim”… with the numbers the checks use. */
export function limitRows(venue: Venue) {
  const l = venue.limits
  return [
    { label: 'Stage width', value: `${l.stageWidth} m` },
    { label: 'Trim height', value: `${l.trim} m` },
    { label: 'Rigging', value: `${l.rigging} t ${venue.covered ? 'grid' : 'roof'} load` },
    { label: 'LED wall', value: `${l.led[0]} × ${l.led[1]} m` },
    ...(l.gusts ? [{ label: 'Evening gusts', value: `up to ${l.gusts} m/s` }] : []),
    { label: '3D stage model', value: venue.modelled ? 'Loaded' : 'Not modelled yet' },
  ]
}
