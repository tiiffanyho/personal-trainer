import type { Day, Entry, Tier } from '../data/session'

/** Order labels (A1, A2, B1…) — stack tiers get consecutive letters, card tiers none */
export function tierLetters(day: Day): (string | undefined)[] {
  let i = 0
  return day.tiers.map((t) => (t.layout === 'stack' ? String.fromCharCode(65 + i++) : undefined))
}

export interface EntryLocation {
  entry: Entry
  tier: Tier
  tierNumber: number
  label?: string
}

export function locateEntry(day: Day | undefined, entryId: string | null): EntryLocation | null {
  if (!day || !entryId) return null
  const letters = tierLetters(day)
  for (let ti = 0; ti < day.tiers.length; ti++) {
    const tier = day.tiers[ti]
    const ei = tier.entries.findIndex((e) => e.id === entryId)
    if (ei >= 0) {
      const letter = letters[ti]
      return { entry: tier.entries[ei], tier, tierNumber: ti + 1, label: letter ? `${letter}${ei + 1}` : undefined }
    }
  }
  return null
}

/** Tempo shared by all sets (compact rows keep it on the Rx) */
export function entryTempo(e: Entry): string {
  return (e.mode === 'compact' ? e.rx.tempo : e.sets[0]?.tempo) ?? ''
}

export function setEntryTempo(e: Entry, tempo: string) {
  if (e.mode === 'compact' || e.rx.tempo !== undefined) e.rx.tempo = tempo
  e.sets.forEach((s) => (s.tempo = tempo))
}

/** The "Target" shown next to the prescription model */
export function modelTarget(e: Entry): string {
  if (e.model === 'velocity') return e.velocityTarget || '—'
  if (e.model === 'pct') return e.mode === 'sets' ? e.sets[0]?.target || '—' : '—'
  const rpe = e.mode === 'unilateral' ? e.sides.L.rpe : e.mode === 'sets' ? e.sets[0]?.rpe : ''
  return rpe || '—'
}
