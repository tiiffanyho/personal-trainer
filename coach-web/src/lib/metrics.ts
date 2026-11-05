import type { Day, Entry, Tier } from '../data/session'

/** First number in a string: "75%" → 75, "120s" → 120, "35 lb" → 35 */
export function num(v: string | undefined): number {
  const m = v?.match(/-?\d+(\.\d+)?/)
  return m ? parseFloat(m[0]) : NaN
}

/** Time under tension per rep from a tempo like "3-1-X-0" (X = explosive ≈ 0 s) */
export function tut(tempo: string | undefined): number {
  if (!tempo) return NaN
  const parts = tempo.split('-')
  if (parts.length !== 4) return NaN
  return parts.reduce((sum, p) => sum + (/^x$/i.test(p.trim()) ? 0 : num(p) || 0), 0)
}

const DEFAULT_REP_SECONDS = 3
const DEFAULT_REST = 30
const or = (v: number, d: number) => (Number.isFinite(v) ? v : d)

/** Seconds for one set: reps × TUT, or a duration rep like "45s" */
function setSeconds(reps: string, tempo: string | undefined, rest: number) {
  const isTimed = /s$/i.test(reps.trim())
  const work = isTimed ? or(num(reps), 0) : or(num(reps), 0) * or(tut(tempo), DEFAULT_REP_SECONDS)
  return work + rest
}

export function entrySeconds(e: Entry): number {
  switch (e.mode) {
    case 'compact': {
      const sets = or(num(e.rx.sets), 0)
      const per = setSeconds(e.rx.reps, e.rx.tempo, or(num(e.rx.rest), DEFAULT_REST))
      return sets * per * (e.rx.perSide ? 2 : 1)
    }
    case 'sets':
      return e.sets.reduce((s, r) => s + setSeconds(r.reps, r.tempo, or(num(r.rest), DEFAULT_REST)), 0)
    case 'unilateral':
      return (['L', 'R'] as const).reduce((s, k) => {
        const sd = e.sides[k]
        return s + or(num(sd.sets), 0) * setSeconds(sd.reps, undefined, 60)
      }, 0)
  }
}

/** Volume load (lb) = Σ reps × load. % targets resolve against Est. 1RM. */
export function entryVolume(e: Entry): number {
  switch (e.mode) {
    case 'compact':
      return 0
    case 'sets':
      return e.sets.reduce((s, r) => {
        const pct = num(r.target)
        if (!e.est1RM || !Number.isFinite(pct)) return s
        return s + or(num(r.reps), 0) * ((pct / 100) * e.est1RM)
      }, 0)
    case 'unilateral':
      return (['L', 'R'] as const).reduce((s, k) => {
        const sd = e.sides[k]
        return s + or(num(sd.sets), 0) * or(num(sd.reps), 0) * or(num(sd.load), 0)
      }, 0)
  }
}

export const tierMinutes = (t: Tier) => Math.round(t.entries.reduce((s, e) => s + entrySeconds(e), 0) / 60)

export function dayStats(d: Day) {
  const entries = d.tiers.flatMap((t) => t.entries)
  return {
    tiers: d.tiers.length,
    exercises: entries.length,
    minutes: Math.round(entries.reduce((s, e) => s + entrySeconds(e), 0) / 60),
    volume: Math.round(entries.reduce((s, e) => s + entryVolume(e), 0)),
  }
}

/** Limb symmetry index: involved ÷ uninvolved load (or weaker ÷ stronger when no involved side) */
export function lsi(e: Entry): { pct: number; involved: number; other: number } | null {
  const l = num(e.sides.L.load)
  const r = num(e.sides.R.load)
  if (!(l > 0) || !(r > 0)) return null
  const [inv, other] = e.involved === 'R' ? [r, l] : e.involved === 'L' ? [l, r] : [Math.min(l, r), Math.max(l, r)]
  return { pct: Math.round((inv / other) * 100), involved: inv, other }
}

export const plural = (n: number, word: string) => `${n} ${word}${n === 1 ? '' : 's'}`
