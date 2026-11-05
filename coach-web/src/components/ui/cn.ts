export function cn(...parts: Array<string | false | null | undefined>) {
  return parts.filter(Boolean).join(' ')
}

export type Tone = 'neutral' | 'accent' | 'caution' | 'critical' | 'info'
