import type { Tone } from '../components/ui'

export type Pattern = 'squat' | 'hinge' | 'push' | 'pull' | 'iso'
export type Laterality = 'Bilateral' | 'Unilateral' | 'Isometric' | 'Activation' | 'Mobility'

export interface ExerciseTag {
  label: string
  /** accent = training emphasis · info = rehab / regression · caution = high tissue load */
  tone: Extract<Tone, 'accent' | 'info' | 'caution'>
}

export interface Exercise {
  id: string
  name: string
  pattern: Pattern
  laterality: Laterality
  tags: ExerciseTag[]
  regressionId?: string
  progressionId?: string
}

export const patterns: { id: Pattern; label: string; section: string }[] = [
  { id: 'squat', label: 'Squat', section: 'Squat & Lunge Patterns' },
  { id: 'hinge', label: 'Hinge', section: 'Hinge Patterns' },
  { id: 'push', label: 'Push', section: 'Push Patterns' },
  { id: 'pull', label: 'Pull', section: 'Pull Patterns' },
  { id: 'iso', label: 'Iso', section: 'Isolation & Accessory' },
]

const emphasis = (label: string): ExerciseTag => ({ label, tone: 'accent' })
const rehab = (label: string): ExerciseTag => ({ label, tone: 'info' })
const load = (label: string): ExerciseTag => ({ label, tone: 'caution' })

type Row = [id: string, name: string, pattern: Pattern, laterality: Laterality, tags: ExerciseTag[]]

const rows: Row[] = [
  // Squat & lunge — first five match the Figma library order
  ['rfess', 'Rear Foot Elevated Split Squat', 'squat', 'Unilateral', [emphasis('Eccentric Accented')]],
  ['bb-rdl', 'Barbell Romanian Deadlift', 'hinge', 'Bilateral', [emphasis('Hip Hinge')]],
  ['ssb-box-squat', 'Safety Bar Box Squat', 'squat', 'Bilateral', [emphasis('Max Strength')]],
  ['goblet-split-squat', 'Goblet Split Squat', 'squat', 'Unilateral', [rehab('Regression')]],
  ['spanish-squat-iso', 'Spanish Squat ISO Hold', 'squat', 'Isometric', [load('Patellar Tendon')]],
  ['nordic', 'Nordic Hamstring Curl', 'hinge', 'Bilateral', [emphasis('Eccentric Accented'), load('High Load')]],
  ['banded-lateral-walk', 'Banded Lateral Walk', 'iso', 'Activation', [rehab('Glute Med')]],

  ['goblet-squat', 'Goblet Squat', 'squat', 'Bilateral', [rehab('Regression')]],
  ['bb-split-squat', 'Barbell Split Squat', 'squat', 'Unilateral', [emphasis('Progression')]],
  ['front-squat', 'Front Squat', 'squat', 'Bilateral', [emphasis('Max Strength')]],
  ['step-up', 'Step-Up', 'squat', 'Unilateral', [rehab('Knee Capacity')]],
  ['lateral-lunge', 'Lateral Lunge', 'squat', 'Unilateral', [emphasis('Frontal Plane')]],
  ['heel-elevated-goblet', 'Heel-Elevated Goblet Squat', 'squat', 'Bilateral', [emphasis('Quad Bias')]],
  ['sl-box-squat', 'Single-Leg Box Squat', 'squat', 'Unilateral', [rehab('Knee Capacity')]],
  ['reverse-nordic', 'Reverse Nordic', 'squat', 'Bilateral', [emphasis('Eccentric Accented'), load('High Load')]],

  ['trap-bar-dl', 'Trap Bar Deadlift', 'hinge', 'Bilateral', [emphasis('Max Strength')]],
  ['sl-rdl', 'Single-Leg RDL', 'hinge', 'Unilateral', [emphasis('Balance')]],
  ['kb-swing', 'Kettlebell Swing', 'hinge', 'Bilateral', [emphasis('Power')]],
  ['hip-thrust', 'Barbell Hip Thrust', 'hinge', 'Bilateral', [emphasis('Glute Bias')]],
  ['good-morning', 'Good Morning', 'hinge', 'Bilateral', [emphasis('Hip Hinge')]],
  ['slider-curl', 'Hamstring Slider Curl', 'hinge', 'Bilateral', [rehab('Knee Flexion')]],

  ['bench', 'Barbell Bench Press', 'push', 'Bilateral', [emphasis('Max Strength')]],
  ['db-incline', 'DB Incline Press', 'push', 'Bilateral', [emphasis('Hypertrophy')]],
  ['landmine-press', 'Half-Kneeling Landmine Press', 'push', 'Unilateral', [rehab('Shoulder Friendly')]],
  ['push-up', 'Push-Up', 'push', 'Bilateral', [emphasis('Bodyweight')]],
  ['sa-ohp', 'Single-Arm DB Overhead Press', 'push', 'Unilateral', [emphasis('Anti-Lateral Flexion')]],
  ['dip', 'Parallel Bar Dip', 'push', 'Bilateral', [load('Shoulder Load')]],

  ['chin-up', 'Chin-Up', 'pull', 'Bilateral', [emphasis('Vertical Pull')]],
  ['cs-row', 'Chest-Supported Row', 'pull', 'Bilateral', [emphasis('Horizontal Pull')]],
  ['sa-cable-row', 'Single-Arm Cable Row', 'pull', 'Unilateral', [emphasis('Anti-Rotation')]],
  ['lat-pulldown', 'Lat Pulldown', 'pull', 'Bilateral', [rehab('Regression')]],
  ['face-pull', 'Face Pull', 'pull', 'Activation', [rehab('Scap Control')]],
  ['inverted-row', 'Inverted Row', 'pull', 'Bilateral', [emphasis('Bodyweight')]],

  ['tke', 'Banded Terminal Knee Extension', 'iso', 'Activation', [rehab('Corrective')]],
  ['leg-extension', 'Leg Extension', 'iso', 'Bilateral', [emphasis('Quad Bias')]],
  ['copenhagen', 'Copenhagen Plank', 'iso', 'Isometric', [rehab('Adductor')]],
  ['seated-calf', 'Seated Calf Raise', 'iso', 'Bilateral', [load('Tendon Load')]],
  ['wall-sit', 'Wall Sit ISO Hold', 'iso', 'Isometric', [load('Patellar Tendon')]],
  ['hip-90-90', '90/90 Hip Flow', 'iso', 'Mobility', [rehab('Hip IR/ER')]],
  ['ankle-mob', 'Banded Ankle Mobilization', 'iso', 'Mobility', [rehab('Dorsiflexion')]],
]

export const exercises: Exercise[] = rows.map(([id, name, pattern, laterality, tags]) => ({
  id,
  name,
  pattern,
  laterality,
  tags,
}))

/** Default regression → progression chains (an entry can override either end) */
const chains: [regress: string, current: string, progress: string][] = [
  ['goblet-split-squat', 'rfess', 'bb-split-squat'],
  ['goblet-squat', 'ssb-box-squat', 'front-squat'],
  ['goblet-squat', 'goblet-split-squat', 'rfess'],
  ['sl-box-squat', 'step-up', 'rfess'],
  ['wall-sit', 'spanish-squat-iso', 'heel-elevated-goblet'],
  ['slider-curl', 'nordic', 'reverse-nordic'],
  ['bb-rdl', 'sl-rdl', 'trap-bar-dl'],
  ['good-morning', 'bb-rdl', 'trap-bar-dl'],
  ['hip-thrust', 'trap-bar-dl', 'kb-swing'],
  ['push-up', 'db-incline', 'bench'],
  ['landmine-press', 'sa-ohp', 'dip'],
  ['inverted-row', 'cs-row', 'sa-cable-row'],
  ['lat-pulldown', 'inverted-row', 'chin-up'],
  ['banded-lateral-walk', 'tke', 'leg-extension'],
]
for (const [r, c, p] of chains) {
  const ex = exercises.find((e) => e.id === c)
  if (ex) Object.assign(ex, { regressionId: r, progressionId: p })
}

export const exerciseById = new Map(exercises.map((e) => [e.id, e]))
