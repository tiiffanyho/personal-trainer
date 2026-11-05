import { useState, type ReactNode } from 'react'
import { Activity, AlertTriangle, ArrowRight, Gauge, Pause, Percent, Play } from 'lucide-react'
import { Checkbox, cn, Select, Switch } from '../ui'
import { exerciseById, exercises } from '../../data/exercises'
import type { Entry, LoadModel } from '../../data/session'
import { useStudio } from '../../store/useStudio'
import { tut } from '../../lib/metrics'
import { entryTempo, modelTarget, setEntryTempo } from '../../lib/structure'

export function Section({ title, aside, children }: { title: string; aside?: ReactNode; children: ReactNode }) {
  return (
    <section className="space-y-2.5">
      <div className="flex items-baseline justify-between gap-2">
        <h3 className="text-13 font-semibold">{title}</h3>
        {aside && <div className="text-12 text-fg-muted">{aside}</div>}
      </div>
      {children}
    </section>
  )
}

/** Tiny inline number field used inside sentences (rules, thresholds) */
export function InlineNum({ value, onChange, label, className }: { value: string; onChange: (v: string) => void; label: string; className?: string }) {
  return (
    <input
      aria-label={label}
      value={value}
      inputMode="decimal"
      size={Math.max(1, value.length)}
      onChange={(e) => onChange(e.target.value)}
      className={cn(
        'rounded border border-line-strong bg-field px-1 text-center font-mono text-fg outline-none focus:border-accent',
        className,
      )}
    />
  )
}

/* ---------- Video preview ---------- */

export function VideoPreview({ entry }: { entry: Entry }) {
  const [playing, setPlaying] = useState(false)
  const tempo = entryTempo(entry)
  return (
    <div className="relative aspect-video overflow-hidden rounded-xl border border-line bg-gradient-to-br from-raised to-line-strong">
      <span className="absolute left-3 top-3 rounded bg-black/60 px-1.5 py-0.5 text-11 font-medium text-white">
        Side view · 0:08 loop
      </span>
      {tempo && (
        <span className="tint-accent absolute right-3 top-3 rounded border px-1.5 py-0.5 font-mono text-11 text-accent-strong">
          {tempo}
        </span>
      )}
      <button
        type="button"
        aria-label={playing ? 'Pause demo video' : 'Play demo video'}
        aria-pressed={playing}
        onClick={() => setPlaying((p) => !p)}
        className="absolute left-1/2 top-1/2 flex size-14 -translate-x-1/2 -translate-y-1/2 items-center justify-center rounded-full border border-white/25 bg-zinc-700/85 text-white shadow-lg transition-transform hover:scale-105"
      >
        {playing ? <Pause size={22} fill="currentColor" /> : <Play size={22} fill="currentColor" className="ml-0.5" />}
      </button>
      <div className="absolute inset-x-3 bottom-3 h-[3px] overflow-hidden rounded-full bg-white/20">
        <div
          className="h-full rounded-full bg-accent"
          style={playing ? { animation: 'video-progress 8s linear infinite' } : { width: '35%' }}
        />
      </div>
    </div>
  )
}

/* ---------- Tempo ---------- */

const tempoParts = [
  { label: 'Ecc', hint: 'Eccentric (lowering) seconds' },
  { label: 'Pause', hint: 'Pause at the bottom, seconds' },
  { label: 'Con', hint: 'Concentric (lifting) seconds — X = explosive' },
  { label: 'Top', hint: 'Pause at the top, seconds' },
]

export function TempoEditor({ entry }: { entry: Entry }) {
  const update = useStudio((s) => s.updateEntry)
  const raw = entryTempo(entry)
  const parts = raw.split('-').length === 4 ? raw.split('-') : ['', '', '', '']
  const t = tut(raw)

  const setPart = (i: number, v: string) => {
    const next = [...parts]
    next[i] = v.toUpperCase().replace(/[^0-9X]/g, '').slice(0, 2)
    update(entry.id, (e) => setEntryTempo(e, next.join('-')))
  }

  return (
    <Section title="Tempo" aside={Number.isFinite(t) ? `TUT ≈ ${t} s / rep` : 'Not set'}>
      <div className="grid grid-cols-4 gap-2">
        {tempoParts.map((p, i) => {
          const explosive = parts[i] === 'X'
          return (
            <label key={p.label} className="flex flex-col items-center gap-1.5" title={p.hint}>
              <input
                aria-label={p.hint}
                value={parts[i]}
                placeholder="–"
                onChange={(e) => setPart(i, e.target.value)}
                className={cn(
                  'h-[52px] w-full rounded-lg border text-center font-mono text-28 font-bold outline-none transition-colors focus:border-accent',
                  explosive ? 'tint-accent text-accent-strong' : 'border-line-strong bg-field text-fg',
                )}
              />
              <span className="eyebrow">{p.label}</span>
            </label>
          )
        })}
      </div>
    </Section>
  )
}

/* ---------- Prescription model ---------- */

const models: { value: LoadModel; label: string; short: string; icon: ReactNode }[] = [
  { value: 'rpe', label: 'RPE · Perceived Exertion', short: 'RPE', icon: <Activity size={16} /> },
  { value: 'pct', label: '% 1RM · Percentage based', short: '% 1RM', icon: <Percent size={16} /> },
  { value: 'velocity', label: 'Velocity · m/s', short: 'Velocity · m/s', icon: <Gauge size={16} /> },
]

export function PrescriptionModel({ entry }: { entry: Entry }) {
  const update = useStudio((s) => s.updateEntry)
  const current = models.find((m) => m.value === entry.model)!

  return (
    <Section title="Prescription Model">
      <Select
        label="Prescription model"
        value={entry.model}
        onChange={(v) =>
          update(entry.id, (e) => {
            e.model = v
            e.alsoTrack = e.alsoTrack.filter((m) => m !== v)
          })
        }
        leading={<span className="text-accent-strong">{current.icon}</span>}
        hint={`Target ${modelTarget(entry)}`}
        options={models.map((m) => ({ value: m.value, label: m.label }))}
      />
      {entry.model === 'velocity' && (
        <label className="flex items-center gap-2 text-12 text-fg-secondary">
          Mean concentric velocity target
          <InlineNum
            label="Velocity target"
            value={entry.velocityTarget}
            onChange={(v) => update(entry.id, (e) => void (e.velocityTarget = v))}
            className="h-7 min-w-16 text-12"
          />
        </label>
      )}
      <div className="flex flex-wrap items-center gap-1.5">
        <span className="text-12 text-fg-muted">Also track:</span>
        {models
          .filter((m) => m.value !== entry.model)
          .map((m) => {
            const on = entry.alsoTrack.includes(m.value)
            return (
              <button
                key={m.value}
                type="button"
                aria-pressed={on}
                onClick={() =>
                  update(entry.id, (e) => {
                    e.alsoTrack = on ? e.alsoTrack.filter((x) => x !== m.value) : [...e.alsoTrack, m.value]
                  })
                }
                className={cn(
                  'inline-flex h-[22px] items-center rounded-full border px-2 text-11 font-medium transition-colors',
                  on ? 'tint-accent text-accent-strong' : 'border-line-strong text-fg-muted hover:text-fg',
                )}
              >
                {m.short}
              </button>
            )
          })}
      </div>
    </Section>
  )
}

/* ---------- Regression / progression chain ---------- */

function ChainNode({
  kind,
  exerciseId,
  editing,
  candidates,
  onPick,
  onMove,
}: {
  kind: 'Regress' | 'Current' | 'Progress'
  exerciseId?: string
  editing: boolean
  candidates: { id: string; name: string }[]
  onPick?: (id: string | undefined) => void
  onMove?: () => void
}) {
  const ex = exerciseId ? exerciseById.get(exerciseId) : undefined
  const current = kind === 'Current'
  const base = cn(
    'flex min-w-0 flex-1 flex-col gap-0.5 rounded-lg border p-2.5 text-left',
    current ? 'tint-accent' : 'border-line-strong bg-surface',
  )
  const label = <span className={cn('eyebrow', current && 'text-accent-strong')}>{kind}</span>

  if (editing && !current) {
    return (
      <label className={base}>
        {label}
        <select
          aria-label={`${kind} exercise`}
          value={exerciseId ?? ''}
          onChange={(e) => onPick?.(e.target.value || undefined)}
          className="w-full bg-transparent text-12 font-semibold text-fg outline-none"
        >
          <option value="">None</option>
          {candidates.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </label>
    )
  }
  if (current || !ex) {
    return (
      <div className={base}>
        {label}
        <span className={cn('text-13 font-semibold', !ex && 'text-fg-muted')}>{ex?.name ?? 'None set'}</span>
      </div>
    )
  }
  return (
    <button type="button" onClick={onMove} title={`Switch this row to ${ex.name}`} className={cn(base, 'transition-colors hover:border-accent')}>
      {label}
      <span className="text-13 font-semibold">{ex.name}</span>
    </button>
  )
}

export function ProgressionChain({ entry }: { entry: Entry }) {
  const [editing, setEditing] = useState(false)
  const { updateEntry, moveAlongChain } = useStudio.getState()
  const ex = exerciseById.get(entry.exerciseId)
  const regress = entry.linkedRegressionId ?? ex?.regressionId
  const progress = entry.progressionId ?? ex?.progressionId
  const candidates = exercises.filter((e) => e.pattern === ex?.pattern && e.id !== entry.exerciseId)
  const rule = entry.progressRule
  const setRule = (k: keyof typeof rule) => (v: string) => updateEntry(entry.id, (e) => void (e.progressRule[k] = v))

  return (
    <Section
      title="Regression / Progression Chain"
      aside={
        <button type="button" onClick={() => setEditing((e) => !e)} className="font-medium text-accent-strong hover:underline">
          {editing ? 'Done' : 'Edit chain'}
        </button>
      }
    >
      <div className="flex items-stretch gap-1.5">
        <ChainNode
          kind="Regress"
          exerciseId={regress}
          editing={editing}
          candidates={candidates}
          onPick={(id) => updateEntry(entry.id, (e) => void (e.linkedRegressionId = id))}
          onMove={() => moveAlongChain(entry.id, 'regress')}
        />
        <ArrowRight size={14} className="shrink-0 self-center text-fg-muted" aria-hidden />
        <ChainNode kind="Current" exerciseId={entry.exerciseId} editing={false} candidates={[]} />
        <ArrowRight size={14} className="shrink-0 self-center text-fg-muted" aria-hidden />
        <ChainNode
          kind="Progress"
          exerciseId={progress}
          editing={editing}
          candidates={candidates}
          onPick={(id) => updateEntry(entry.id, (e) => void (e.progressionId = id))}
          onMove={() => moveAlongChain(entry.id, 'progress')}
        />
      </div>
      <p className="flex flex-wrap items-center gap-1 text-12 text-fg-secondary">
        Progress after <InlineNum label="Sessions before progressing" value={rule.sessions} onChange={setRule('sessions')} className="h-6 text-12" />
        sessions at RPE ≤ <InlineNum label="Max RPE" value={rule.rpe} onChange={setRule('rpe')} className="h-6 text-12" />
        and NPRS ≤ <InlineNum label="Max pain (NPRS)" value={rule.nprs} onChange={setRule('nprs')} className="h-6 text-12" />
      </p>
    </Section>
  )
}

/* ---------- Clinical guardrail ---------- */

export function ClinicalGuardrail({ entry }: { entry: Entry }) {
  const update = useStudio((s) => s.updateEntry)
  const physio = useStudio((s) => s.meta.physio)
  const g = entry.guardrail
  const hasRegression = Boolean(entry.linkedRegressionId ?? exerciseById.get(entry.exerciseId)?.regressionId)
  const set = <K extends keyof typeof g>(k: K) => (v: (typeof g)[K]) => update(entry.id, (e) => void (e.guardrail[k] = v))

  return (
    <section
      aria-label="Clinical guardrail"
      className={cn('rounded-xl border p-3.5 transition-colors', g.enabled ? 'tint-critical' : 'border-line bg-surface')}
    >
      <div className="flex items-center gap-2">
        <AlertTriangle size={16} className={g.enabled ? 'text-critical-strong' : 'text-fg-muted'} />
        <h3 className="flex-1 text-13 font-semibold">Clinical Guardrail</h3>
        <Switch label="Enable clinical guardrail" tone="critical" size="md" checked={g.enabled} onChange={set('enabled')} />
      </div>

      <div className={cn('mt-3 space-y-3', !g.enabled && 'pointer-events-none opacity-45')} aria-disabled={!g.enabled}>
        <div className="rounded-lg border border-critical/60 bg-surface/60 p-3">
          <div className="eyebrow mb-2 !text-critical-strong">Pain flag</div>
          <div className="flex flex-wrap items-center gap-2 text-13">
            Alert coach if athlete logs &gt;
            <InlineNum
              label="Pain threshold (NPRS 0–10)"
              value={g.painThreshold}
              onChange={set('painThreshold')}
              className="h-7 w-9 text-14 font-bold"
            />
            <span className="text-fg-secondary">/10 NPRS</span>
          </div>
        </div>
        <Checkbox tone="critical" checked={g.autoSwap && hasRegression} onChange={(v) => hasRegression && set('autoSwap')(v)}>
          <span className={cn('flex flex-wrap items-center gap-1', !hasRegression && 'opacity-60')}>
            Auto-swap to linked regression at ≥
            <InlineNum label="Auto-swap pain level" value={g.autoSwapAt} onChange={set('autoSwapAt')} className="h-5 text-11" />
            /10
            {!hasRegression && <span className="text-fg-muted">(no regression linked)</span>}
          </span>
        </Checkbox>
        <Checkbox tone="critical" checked={g.notifyPhysio} onChange={set('notifyPhysio')}>
          Notify physio · {physio}
        </Checkbox>
      </div>
    </section>
  )
}
