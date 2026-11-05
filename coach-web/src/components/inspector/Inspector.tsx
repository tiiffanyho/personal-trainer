import { useState } from 'react'
import { ArrowRight, MousePointerClick, Plus, X } from 'lucide-react'
import { Button, IconButton, Tag, UnderlineTabs } from '../ui'
import { exerciseById, type Exercise } from '../../data/exercises'
import type { Entry } from '../../data/session'
import { useActiveDay, useStudio } from '../../store/useStudio'
import { locateEntry } from '../../lib/structure'
import { lsi, num } from '../../lib/metrics'
import { ClinicalGuardrail, PrescriptionModel, ProgressionChain, Section, TempoEditor, VideoPreview } from './sections'

type TabId = 'params' | 'clinical' | 'history' | 'notes'

function ExerciseTags({ ex }: { ex: Exercise }) {
  return (
    <div className="flex flex-wrap gap-1">
      <Tag>{ex.laterality}</Tag>
      {ex.tags.map((t) => (
        <Tag key={t.label} tone={t.tone}>
          {t.label}
        </Tag>
      ))}
    </div>
  )
}

function CloseButton({ onClose }: { onClose: () => void }) {
  return (
    <IconButton label="Close inspector" onClick={onClose} className="border border-line-strong">
      <X size={14} />
    </IconButton>
  )
}

/* ---------- Clinical tab ---------- */

function ClinicalTab({ entry }: { entry: Entry }) {
  const meta = useStudio((s) => s.meta)
  const ex = exerciseById.get(entry.exerciseId)
  const sym = entry.mode === 'unilateral' ? lsi(entry) : null
  const target = entry.lsiTarget ?? 90
  const loadFlags = ex?.tags.filter((t) => t.tone === 'caution') ?? []
  const rows: [string, React.ReactNode][] = [
    ['Athlete', meta.athlete],
    ['Status', meta.athleteNote],
    ['Involved side', entry.involved ? (entry.involved === 'L' ? 'Left' : 'Right') : '—'],
    ['Physio', meta.physio],
  ]
  return (
    <div className="space-y-5">
      <Section title="Athlete context">
        <dl className="divide-y divide-line rounded-lg border border-line">
          {rows.map(([k, v]) => (
            <div key={k} className="flex justify-between gap-3 px-3 py-2 text-13">
              <dt className="text-fg-muted">{k}</dt>
              <dd className="text-right font-medium">{v}</dd>
            </div>
          ))}
        </dl>
      </Section>

      {entry.mode === 'unilateral' && (
        <Section title="Limb symmetry" aside={`Target ≥ ${target}%`}>
          {sym ? (
            <>
              <div className="flex items-baseline gap-2">
                <span className="font-mono text-28 font-bold">{sym.pct}%</span>
                <span className="text-12 text-fg-secondary">
                  {sym.involved} / {sym.other} lb
                </span>
              </div>
              <div className="relative h-2 rounded-full bg-raised" role="meter" aria-valuenow={sym.pct} aria-valuemin={0} aria-valuemax={100} aria-label="Limb symmetry index">
                <div className={`h-full rounded-full ${sym.pct >= target ? 'bg-accent' : 'bg-caution'}`} style={{ width: `${Math.min(100, sym.pct)}%` }} />
                <span className="absolute -top-1 h-4 w-0.5 bg-fg" style={{ left: `${target}%` }} aria-hidden />
              </div>
            </>
          ) : (
            <p className="text-12 text-fg-muted">Enter left and right loads to calculate symmetry.</p>
          )}
        </Section>
      )}

      <Section title="Tissue load flags">
        {loadFlags.length ? (
          <div className="flex flex-wrap gap-1">
            {loadFlags.map((t) => (
              <Tag key={t.label} tone="caution" icon={<span className="size-1.5 rounded-full bg-caution" />}>
                {t.label}
              </Tag>
            ))}
          </div>
        ) : (
          <p className="text-12 text-fg-muted">No high-load flags on this exercise.</p>
        )}
      </Section>

      <ClinicalGuardrail entry={entry} />
    </div>
  )
}

/* ---------- History tab (sample data until athlete logging exists) ---------- */

function HistoryTab({ entry }: { entry: Entry }) {
  const dates = ['Oct 21', 'Oct 28', 'Nov 2']
  const baseLoad =
    entry.mode === 'unilateral'
      ? num(entry.sides[entry.involved ?? 'L'].load)
      : entry.mode === 'sets' && entry.est1RM
        ? Math.round((num(entry.sets[0]?.target) / 100) * entry.est1RM)
        : NaN
  const reps = entry.mode === 'unilateral' ? entry.sides.L.reps : entry.mode === 'sets' ? entry.sets[0]?.reps : entry.rx.reps
  const rows = dates.map((d, i) => {
    const back = dates.length - i
    return {
      d,
      load: Number.isFinite(baseLoad) ? `${Math.max(0, baseLoad - back * 5)} lb` : 'BW',
      reps,
      rpe: (7 + (i % 2) * 0.5).toFixed(1),
      nprs: [2, 1, 1][i],
    }
  })
  return (
    <div className="space-y-3">
      <div className="overflow-hidden rounded-lg border border-line">
        <table className="w-full text-13">
          <thead className="bg-raised/60">
            <tr>
              {['Date', 'Top set', 'Reps', 'RPE', 'Pain'].map((h) => (
                <th key={h} className="eyebrow px-3 py-2 text-left">
                  {h}
                </th>
              ))}
            </tr>
          </thead>
          <tbody className="divide-y divide-line font-mono">
            {rows.map((r) => (
              <tr key={r.d}>
                <td className="px-3 py-2 font-sans text-fg-secondary">{r.d}</td>
                <td className="px-3 py-2">{r.load}</td>
                <td className="px-3 py-2">{r.reps}</td>
                <td className="px-3 py-2">{r.rpe}</td>
                <td className="px-3 py-2">{r.nprs}/10</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <p className="text-11 text-fg-muted">Sample data. Real logs appear here once the athlete app is connected.</p>
    </div>
  )
}

/* ---------- Notes tab ---------- */

function NotesTab({ entry }: { entry: Entry }) {
  const update = useStudio((s) => s.updateEntry)
  const area =
    'min-h-24 w-full resize-y rounded-lg border border-line-strong bg-field p-3 text-13 text-fg outline-none placeholder:text-fg-muted focus:border-accent'
  return (
    <div className="space-y-5">
      <Section title="Coach notes" aside="Private">
        <textarea
          aria-label="Coach notes"
          className={area}
          placeholder="Setup details, what to watch for…"
          value={entry.coachNotes}
          onChange={(e) => update(entry.id, (x) => void (x.coachNotes = e.target.value))}
        />
      </Section>
      <Section title="Athlete cue" aside="Shown in the athlete app">
        <textarea
          aria-label="Athlete cue"
          className={area}
          placeholder="One short cue the athlete sees while lifting"
          value={entry.athleteCue}
          onChange={(e) => update(entry.id, (x) => void (x.athleteCue = e.target.value))}
        />
      </Section>
    </div>
  )
}

/* ---------- Library preview (nothing on the canvas selected) ---------- */

function LibraryPreview({ ex, onClose }: { ex: Exercise; onClose: () => void }) {
  const addExercise = useStudio((s) => s.addExercise)
  const regress = ex.regressionId ? exerciseById.get(ex.regressionId) : undefined
  const progress = ex.progressionId ? exerciseById.get(ex.progressionId) : undefined
  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="eyebrow">Library exercise</div>
          <h2 className="text-16 font-semibold tracking-[-0.3px]">{ex.name}</h2>
          <ExerciseTags ex={ex} />
        </div>
        <CloseButton onClose={onClose} />
      </div>
      <div className="relative aspect-video rounded-xl border border-line bg-gradient-to-br from-raised to-line-strong" />
      {(regress || progress) && (
        <Section title="Regression / Progression">
          <p className="flex flex-wrap items-center gap-1.5 text-13">
            <span className="text-fg-secondary">{regress?.name ?? '—'}</span>
            <ArrowRight size={14} className="text-fg-muted" />
            <span className="font-semibold text-accent-strong">{ex.name}</span>
            <ArrowRight size={14} className="text-fg-muted" />
            <span className="text-fg-secondary">{progress?.name ?? '—'}</span>
          </p>
        </Section>
      )}
      <Button variant="primary" icon={<Plus size={16} />} className="w-full" onClick={() => addExercise(ex.id)}>
        Add to session
      </Button>
    </div>
  )
}

/* ---------- Inspector ---------- */

export function Inspector() {
  const day = useActiveDay()
  const selectedEntryId = useStudio((s) => s.selectedEntryId)
  const selectedLibraryId = useStudio((s) => s.selectedLibraryId)
  const { selectEntry, selectLibraryExercise, setInspectorOpen } = useStudio.getState()
  const [tab, setTab] = useState<TabId>('params')

  const loc = locateEntry(day, selectedEntryId)
  const close = () => {
    selectEntry(null)
    selectLibraryExercise(null)
    setInspectorOpen(false)
  }

  if (!loc) {
    const libEx = selectedLibraryId ? exerciseById.get(selectedLibraryId) : undefined
    if (libEx) return <LibraryPreview ex={libEx} onClose={close} />
    return (
      <div className="flex flex-col items-center gap-2 rounded-xl border border-dashed border-line-strong px-6 py-12 text-center">
        <MousePointerClick size={20} className="text-fg-muted" />
        <p className="text-14 font-semibold">Nothing selected</p>
        <p className="text-12 text-fg-muted">Select an exercise row on the canvas to edit its tempo, load model, progression and clinical guardrails.</p>
      </div>
    )
  }

  const { entry, tierNumber, label } = loc
  const ex = exerciseById.get(entry.exerciseId)

  return (
    <div className="space-y-5">
      <div className="flex items-start gap-3">
        <div className="min-w-0 flex-1 space-y-1.5">
          <div className="eyebrow">
            Selected exercise · Tier {tierNumber}
            {label && ` / ${label}`}
          </div>
          <h2 className="text-16 font-semibold tracking-[-0.3px]">{ex?.name ?? entry.exerciseId}</h2>
          {ex && <ExerciseTags ex={ex} />}
        </div>
        <CloseButton onClose={close} />
      </div>

      <UnderlineTabs
        label="Inspector sections"
        value={tab}
        onChange={setTab}
        items={[
          { id: 'params', label: 'Parameters' },
          { id: 'clinical', label: 'Clinical' },
          { id: 'history', label: 'History' },
          { id: 'notes', label: 'Notes' },
        ]}
      />

      {tab === 'params' && (
        <div className="space-y-6">
          <VideoPreview entry={entry} />
          <TempoEditor entry={entry} />
          <PrescriptionModel entry={entry} />
          <ProgressionChain entry={entry} />
          <ClinicalGuardrail entry={entry} />
        </div>
      )}
      {tab === 'clinical' && <ClinicalTab entry={entry} />}
      {tab === 'history' && <HistoryTab entry={entry} />}
      {tab === 'notes' && <NotesTab entry={entry} />}
    </div>
  )
}
