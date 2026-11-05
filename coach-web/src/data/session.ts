/**
 * Session data model.
 *
 * Week → Days → Tiers → Entries. An entry is one exercise prescribed in one of
 * three display modes, matching the three row styles in the Figma canvas:
 *   compact    — Rx pills only (Tier 1 primers, A2 filler)
 *   sets       — per-set spreadsheet (A1)
 *   unilateral — separate left / right targets with limb symmetry (B1)
 * Cell values are kept as the strings the coach typed ("75%", "120s", "35 lb");
 * metrics parse them leniently.
 */

export type EntryMode = 'compact' | 'sets' | 'unilateral'
export type Side = 'L' | 'R'

export interface SetRow {
  id: string
  target: string // "75%"
  reps: string
  tempo: string // "3-1-X-0"
  rpe: string
  rest: string // "120s"
}

export interface CompactRx {
  sets: string
  reps: string
  tempo?: string
  rest?: string
  perSide?: boolean
}

export interface SideRx {
  sets: string
  reps: string
  load: string // "35 lb"
  rpe: string
}

export interface Entry {
  id: string
  exerciseId: string
  mode: EntryMode
  note?: string
  est1RM?: number
  rx: CompactRx
  sets: SetRow[]
  sides: Record<Side, SideRx>
  involved?: Side
  linkedRegressionId?: string
  progressionId?: string
  lsiTarget?: number

  /* inspector parameters */
  model: LoadModel
  alsoTrack: LoadModel[]
  velocityTarget: string // "0.60 m/s"
  progressRule: { sessions: string; rpe: string; nprs: string }
  guardrail: Guardrail
  coachNotes: string
  athleteCue: string
}

export type LoadModel = 'rpe' | 'pct' | 'velocity'

export interface Guardrail {
  enabled: boolean
  painThreshold: string // NPRS 0–10
  autoSwap: boolean
  autoSwapAt: string
  notifyPhysio: boolean
}

export interface Tier {
  id: string
  title: string
  layout: 'cards' | 'stack'
  superset: boolean
  unilateral: boolean
  collapsed: boolean
  entries: Entry[]
}

export interface Day {
  id: string
  tab: string // "Day 1 · Mon"
  title: string
  subtitle: string
  tiers: Tier[]
}

/* ---------- builders ---------- */

export const uid = () => Math.random().toString(36).slice(2, 10)

const set = (target: string, reps: string, tempo: string, rpe: string, rest: string): SetRow => ({
  id: uid(),
  target,
  reps,
  tempo,
  rpe,
  rest,
})

const side = (sets: string, reps: string, load: string, rpe: string): SideRx => ({ sets, reps, load, rpe })

export function makeEntry(exerciseId: string, mode: EntryMode, extra: Partial<Entry> = {}): Entry {
  return {
    id: uid(),
    exerciseId,
    mode,
    rx: { sets: '3', reps: '8' },
    sets: [set('', '8', '', '', '90s'), set('', '8', '', '', '90s'), set('', '8', '', '', '90s')],
    sides: { L: side('3', '8', '', ''), R: side('3', '8', '', '') },
    model: mode === 'sets' && extra.est1RM ? 'pct' : 'rpe',
    alsoTrack: [],
    velocityTarget: '',
    progressRule: { sessions: '3', rpe: '7', nprs: '2' },
    guardrail: { enabled: false, painThreshold: '3', autoSwap: false, autoSwapAt: '5', notifyPhysio: false },
    coachNotes: '',
    athleteCue: '',
    ...extra,
  }
}

export function makeTier(title: string, extra: Partial<Tier> = {}): Tier {
  return { id: uid(), title, layout: 'stack', superset: false, unilateral: false, collapsed: false, entries: [], ...extra }
}

/** Default row style for an exercise dropped into a tier */
export function modeForTier(tier: Tier): EntryMode {
  if (tier.unilateral) return 'unilateral'
  if (tier.layout === 'cards') return 'compact'
  return 'sets'
}

/* ---------- template program (content from the Figma frame) ---------- */

function day1(): Day {
  return {
    id: 'd1',
    tab: 'Day 1 · Mon',
    title: 'Day 1: Lower Body Strength & Knee Capacity',
    subtitle: 'Quad-dominant strength · Knee load tolerance · Post-op week 26',
    tiers: [
      makeTier('Prep & Primers', {
        layout: 'cards',
        entries: [
          makeEntry('hip-90-90', 'compact', { note: 'Mobility · Hip IR/ER', rx: { sets: '2', reps: '8' } }),
          makeEntry('ankle-mob', 'compact', {
            note: 'Mobility · Dorsiflexion',
            rx: { sets: '2', reps: '8', perSide: true },
          }),
        ],
      }),
      makeTier('Primary Compound Complex', {
        superset: true,
        entries: [
          makeEntry('ssb-box-squat', 'sets', {
            est1RM: 315,
            sets: [
              set('75%', '5', '3-1-X-0', '7', '120s'),
              set('80%', '5', '3-1-X-0', '8', '120s'),
              set('80%', '5', '3-1-X-0', '8', '120s'),
            ],
          }),
          makeEntry('tke', 'compact', {
            note: 'Corrective filler · VMO activation between A1 sets',
            rx: { sets: '3', reps: '12', tempo: '2-1-1-1', rest: '60s' },
          }),
        ],
      }),
      makeTier('Unilateral & Tissue Capacity', {
        unilateral: true,
        entries: [
          makeEntry('rfess', 'unilateral', {
            id: 'b1-rfess',
            involved: 'L',
            linkedRegressionId: 'goblet-split-squat',
            progressionId: 'bb-split-squat',
            lsiTarget: 90,
            model: 'rpe',
            alsoTrack: ['pct', 'velocity'],
            velocityTarget: '0.55 m/s',
            guardrail: { enabled: true, painThreshold: '3', autoSwap: true, autoSwapAt: '5', notifyPhysio: true },
            coachNotes: 'Front foot far enough forward that the knee tracks over mid-foot. Keep torso slightly forward.',
            athleteCue: 'Slow down for 3, pause at the bottom, drive up through the front heel.',
            sides: { L: side('3', '8', '35 lb', '7.5'), R: side('3', '8', '40 lb', '7.5') },
            sets: [set('', '8', '3-1-X-0', '7.5', '90s'), set('', '8', '3-1-X-0', '7.5', '90s'), set('', '8', '3-1-X-0', '7.5', '90s')],
          }),
        ],
      }),
    ],
  }
}

function day2(): Day {
  return {
    id: 'd2',
    tab: 'Day 2 · Wed',
    title: 'Day 2: Upper Body Push / Pull & Trunk',
    subtitle: 'Horizontal + vertical balance · Shoulder-friendly pressing',
    tiers: [
      makeTier('Prep & Primers', {
        layout: 'cards',
        entries: [
          makeEntry('face-pull', 'compact', { note: 'Activation · Scap control', rx: { sets: '2', reps: '15' } }),
          makeEntry('copenhagen', 'compact', {
            note: 'Isometric · Adductor',
            rx: { sets: '2', reps: '20s', perSide: true },
          }),
        ],
      }),
      makeTier('Primary Superset', {
        superset: true,
        entries: [
          makeEntry('db-incline', 'sets', {
            est1RM: 120,
            sets: [
              set('70%', '8', '3-0-1-0', '7', '90s'),
              set('72.5%', '8', '3-0-1-0', '7.5', '90s'),
              set('75%', '6', '3-0-1-0', '8', '90s'),
            ],
          }),
          makeEntry('cs-row', 'sets', {
            est1RM: 160,
            sets: [
              set('70%', '10', '2-1-1-1', '7', '90s'),
              set('70%', '10', '2-1-1-1', '7.5', '90s'),
              set('72.5%', '8', '2-1-1-1', '8', '90s'),
            ],
          }),
        ],
      }),
      makeTier('Unilateral Accessories', {
        unilateral: true,
        entries: [
          makeEntry('landmine-press', 'unilateral', {
            lsiTarget: 90,
            sides: { L: side('3', '10', '45 lb', '7'), R: side('3', '10', '45 lb', '7') },
          }),
        ],
      }),
    ],
  }
}

function day3(): Day {
  return {
    id: 'd3',
    tab: 'Day 3 · Fri',
    title: 'Day 3: Posterior Chain & Power',
    subtitle: 'Hinge strength · Hamstring eccentric capacity · Single-leg control',
    tiers: [
      makeTier('Prep & Primers', {
        layout: 'cards',
        entries: [
          makeEntry('banded-lateral-walk', 'compact', {
            note: 'Activation · Glute med',
            rx: { sets: '2', reps: '12', perSide: true },
          }),
          makeEntry('wall-sit', 'compact', { note: 'Isometric · Patellar tendon', rx: { sets: '3', reps: '45s' } }),
        ],
      }),
      makeTier('Hinge Strength', {
        superset: true,
        entries: [
          makeEntry('trap-bar-dl', 'sets', {
            est1RM: 365,
            sets: [
              set('70%', '5', '2-0-X-0', '7', '150s'),
              set('75%', '5', '2-0-X-0', '7.5', '150s'),
              set('75%', '5', '2-0-X-0', '8', '150s'),
            ],
          }),
          makeEntry('nordic', 'compact', {
            note: 'Eccentric · Hamstring capacity',
            rx: { sets: '3', reps: '5', tempo: '5-0-1-0', rest: '90s' },
          }),
        ],
      }),
      makeTier('Single-Leg Posterior Chain', {
        unilateral: true,
        entries: [
          makeEntry('sl-rdl', 'unilateral', {
            involved: 'L',
            linkedRegressionId: 'bb-rdl',
            lsiTarget: 90,
            sides: { L: side('3', '8', '30 lb', '7'), R: side('3', '8', '35 lb', '7') },
          }),
        ],
      }),
    ],
  }
}

/** Fresh copy of the 3-day template (new ids except stable demo ids) */
export function templateWeek(): Day[] {
  return [day1(), day2(), day3()]
}

/** Deep-copy a week with fresh entry / set / tier ids */
export function cloneWeek(days: Day[]): Day[] {
  return days.map((d) => ({
    ...d,
    tiers: d.tiers.map((t) => ({
      ...t,
      id: uid(),
      entries: t.entries.map((e) => ({
        ...structuredClone(e),
        id: uid(),
        sets: e.sets.map((s) => ({ ...s, id: uid() })),
      })),
    })),
  }))
}
