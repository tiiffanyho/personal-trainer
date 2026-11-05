export type WeekStatus = 'published' | 'draft' | 'planned'

export interface Week {
  id: string
  label: string
  status: WeekStatus
  note?: string // e.g. "Deload"
}

export interface ProgramMeta {
  breadcrumb: string[]
  title: string
  phase: { from: string; to: string }
  athleteNote: string
  athlete: string
  physio: string
  sessionsPerWeek: number
  weekLoadDeltaPct: number
}

export const programMeta: ProgramMeta = {
  breadcrumb: ['Programs', 'ACL Return-to-Play', 'M. Okafor'],
  title: 'Off-Season Lower Body & ACL Return-to-Play',
  phase: { from: 'Accumulation', to: 'Intensification' },
  athleteNote: 'Post-op wk 26 · L knee',
  athlete: 'M. Okafor',
  physio: 'Dr. A. Patel, PT',
  sessionsPerWeek: 3,
  weekLoadDeltaPct: 6,
}

export const initialWeeks: Week[] = [
  { id: 'w1', label: 'Week 1', status: 'published' },
  { id: 'w2', label: 'Week 2', status: 'draft' },
  { id: 'w3', label: 'Week 3', status: 'planned' },
  { id: 'w4', label: 'Week 4', status: 'planned', note: 'Deload' },
]
