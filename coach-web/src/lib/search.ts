import { patterns, type Exercise } from '../data/exercises'

export const tokenize = (q: string) => q.toLowerCase().split(/\s+/).filter(Boolean)

/** Every token must appear in the name, laterality, pattern or a tag */
export function matchesExercise(ex: Exercise, tokens: string[]) {
  if (tokens.length === 0) return true
  const pattern = patterns.find((p) => p.id === ex.pattern)?.label ?? ''
  const haystack = [ex.name, ex.laterality, pattern, ...ex.tags.map((t) => t.label)].join(' ').toLowerCase()
  return tokens.every((t) => haystack.includes(t))
}
