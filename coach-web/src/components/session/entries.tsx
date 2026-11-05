import type { ReactNode } from 'react'
import { Activity, ArrowLeftRight, Copy, Link2, Plus, Rows3, SquareSplitHorizontal, Trash2, X, Rows2 } from 'lucide-react'
import { CellInput, cn, Menu, Tag, type MenuItem } from '../ui'
import { exerciseById } from '../../data/exercises'
import type { Entry, EntryMode, Side } from '../../data/session'
import { useStudio } from '../../store/useStudio'
import { lsi, num } from '../../lib/metrics'
import { Grip, OrderBadge, Pill, PillField, Thumb } from './parts'

/* ---------- shared ---------- */

function useEntryActions(entry: Entry) {
  const s = useStudio.getState()
  const modes: { mode: EntryMode; label: string; icon: ReactNode }[] = [
    { mode: 'sets', label: 'Show as set table', icon: <Rows3 size={14} /> },
    { mode: 'compact', label: 'Show as compact Rx', icon: <Rows2 size={14} /> },
    { mode: 'unilateral', label: 'Split left / right', icon: <SquareSplitHorizontal size={14} /> },
  ]
  const items: MenuItem[] = [
    ...modes.filter((m) => m.mode !== entry.mode).map((m) => ({ ...m, onSelect: () => s.setEntryMode(entry.id, m.mode) })),
    ...(entry.linkedRegressionId
      ? [{ label: 'Swap to linked regression', icon: <ArrowLeftRight size={14} />, onSelect: () => s.moveAlongChain(entry.id, 'regress') }]
      : []),
    { label: 'Duplicate', icon: <Copy size={14} />, onSelect: () => s.duplicateEntry(entry.id) },
    { label: 'Remove', icon: <Trash2 size={14} />, destructive: true, onSelect: () => s.removeEntry(entry.id) },
  ]
  return items
}

function name(entry: Entry) {
  return exerciseById.get(entry.exerciseId)?.name ?? entry.exerciseId
}

function subtitle(entry: Entry) {
  if (entry.note) return entry.note
  const ex = exerciseById.get(entry.exerciseId)
  return ex ? [ex.laterality, ...ex.tags.map((t) => t.label)].join(' · ') : ''
}

interface ShellProps {
  entry: Entry
  className?: string
  children: ReactNode
}

/** Click-to-select wrapper; selected rows get the accent border from the Figma B1 card */
function EntryShell({ entry, className, children }: ShellProps) {
  const selected = useStudio((s) => s.selectedEntryId === entry.id)
  const select = useStudio((s) => s.selectEntry)
  return (
    <div
      onClick={() => select(entry.id)}
      aria-current={selected || undefined}
      className={cn(
        'group/entry rounded-lg border bg-surface transition-colors',
        selected ? 'border-accent ring-1 ring-accent/40' : 'border-line hover:border-line-strong',
        className,
      )}
    >
      {children}
    </div>
  )
}

function RxPills({ entry }: { entry: Entry }) {
  const update = useStudio((s) => s.updateEntry)
  const set = (k: 'sets' | 'reps' | 'tempo' | 'rest') => (v: string) => update(entry.id, (e) => void (e.rx[k] = v))
  return (
    <>
      <Pill>
        <PillField label="Sets" value={entry.rx.sets} onChange={set('sets')} />
        <span>×</span>
        <PillField label="Reps" value={entry.rx.reps} onChange={set('reps')} />
        {entry.rx.perSide && <span>/ side</span>}
      </Pill>
      {entry.rx.tempo !== undefined && (
        <Pill>
          <PillField label="Tempo" value={entry.rx.tempo} onChange={set('tempo')} />
        </Pill>
      )}
      {entry.rx.rest !== undefined && (
        <Pill>
          <PillField label="Rest" value={entry.rx.rest} onChange={set('rest')} />
        </Pill>
      )}
    </>
  )
}

/* ---------- Tier 1 style: primer card ---------- */

export function PrimerCard({ entry }: { entry: Entry }) {
  const items = useEntryActions(entry)
  return (
    <EntryShell entry={entry} className="flex flex-wrap items-center gap-x-2.5 gap-y-2 p-2.5">
      <Grip size={14} />
      <Thumb />
      <div className="min-w-0 flex-1">
        <div className="text-13 font-semibold">{name(entry)}</div>
        <div className="line-clamp-2 text-11 text-fg-muted">{subtitle(entry)}</div>
      </div>
      <div className="flex shrink-0 items-center gap-1 max-sm:order-last max-sm:basis-full max-sm:pl-[64px]">
        <RxPills entry={entry} />
      </div>
      <Menu
        label={`${name(entry)} options`}
        items={items}
        className="group-hover/entry:opacity-100 focus-within:opacity-100 [@media(hover:hover)]:opacity-0"
      />
    </EntryShell>
  )
}

/* ---------- A2 style: compact row ---------- */

export function CompactRow({ entry, order }: { entry: Entry; order: string }) {
  const items = useEntryActions(entry)
  const ex = exerciseById.get(entry.exerciseId)
  const tag = ex?.tags[0]
  return (
    <EntryShell entry={entry} className="flex flex-wrap items-center gap-x-2.5 gap-y-2 p-3">
      <Grip />
      <OrderBadge>{order}</OrderBadge>
      <div className="min-w-[160px] flex-1">
        <div className="text-14 font-semibold">{name(entry)}</div>
        <div className="truncate text-11 text-fg-muted">{subtitle(entry)}</div>
      </div>
      <div className="flex items-center gap-1.5">
        <RxPills entry={entry} />
        {tag && <Tag tone={tag.tone}>{tag.label}</Tag>}
        <Menu label={`${name(entry)} options`} items={items} />
      </div>
    </EntryShell>
  )
}

/* ---------- A1 style: set spreadsheet ---------- */

const setCols = [
  { key: 'target', label: 'Target %' },
  { key: 'reps', label: 'Reps' },
  { key: 'tempo', label: 'Tempo' },
  { key: 'rpe', label: 'RPE' },
  { key: 'rest', label: 'Rest' },
] as const

export function SetTableRow({ entry, order }: { entry: Entry; order: string }) {
  const items = useEntryActions(entry)
  const { updateSet, addSet, removeSet, updateEntry } = useStudio.getState()
  const ex = exerciseById.get(entry.exerciseId)

  return (
    <EntryShell entry={entry} className="p-3">
      <div className="flex items-center gap-2.5">
        <Grip />
        <OrderBadge>{order}</OrderBadge>
        <span className="text-14 font-semibold">{name(entry)}</span>
        {ex && <Tag>{ex.laterality}</Tag>}
        <label className="ml-auto flex items-center gap-1 text-12 text-fg-muted">
          Est. 1RM
          <input
            aria-label="Estimated 1RM in lb"
            value={entry.est1RM ?? ''}
            placeholder="—"
            size={Math.max(2, String(entry.est1RM ?? '').length)}
            onChange={(e) => {
              const v = num(e.target.value)
              updateEntry(entry.id, (x) => void (x.est1RM = Number.isFinite(v) ? v : undefined))
            }}
            className="rounded border border-transparent bg-transparent px-0.5 text-right text-fg-secondary outline-none hover:border-line focus:border-accent"
          />
          lb
        </label>
        <Menu label={`${name(entry)} options`} items={items} />
      </div>

      <div role="table" aria-label={`${name(entry)} sets`} className="mt-3 overflow-x-auto">
        <div className="min-w-[520px]">
          <div role="row" className="grid grid-cols-[44px_repeat(5,minmax(0,1fr))_20px] gap-2 px-1 pb-1.5">
            <span role="columnheader" className="eyebrow">
              Set #
            </span>
            {setCols.map((c) => (
              <span key={c.key} role="columnheader" className="eyebrow">
                {c.label}
              </span>
            ))}
          </div>
          <div className="space-y-1.5">
            {entry.sets.map((s, i) => (
              <div role="row" key={s.id} className="group/set grid grid-cols-[44px_repeat(5,minmax(0,1fr))_20px] items-center gap-2 px-1">
                <span role="cell" className="font-mono text-13 text-fg-muted">
                  {i + 1}
                </span>
                {setCols.map((c) => (
                  <span role="cell" key={c.key}>
                    <CellInput
                      aria-label={`Set ${i + 1} ${c.label}`}
                      value={s[c.key]}
                      onChange={(e) => updateSet(entry.id, s.id, { [c.key]: e.target.value })}
                    />
                  </span>
                ))}
                <button
                  type="button"
                  aria-label={`Remove set ${i + 1}`}
                  disabled={entry.sets.length === 1}
                  onClick={() => removeSet(entry.id, s.id)}
                  className="flex size-5 items-center justify-center rounded text-fg-muted hover:text-fg group-hover/set:opacity-100 focus:opacity-100 disabled:hidden [@media(hover:hover)]:opacity-0"
                >
                  <X size={12} />
                </button>
              </div>
            ))}
          </div>
          <button
            type="button"
            onClick={() => addSet(entry.id)}
            className="mt-2 ml-1 inline-flex items-center gap-1 text-12 font-medium text-fg-muted hover:text-accent-strong"
          >
            <Plus size={12} /> Add set
          </button>
        </div>
      </div>
    </EntryShell>
  )
}

/* ---------- B1 style: unilateral dual targets ---------- */

const sideFields = [
  { key: 'sets', label: 'Sets' },
  { key: 'reps', label: 'Reps' },
  { key: 'load', label: 'Load' },
  { key: 'rpe', label: 'RPE' },
] as const

function SidePanel({ entry, side, limb }: { entry: Entry; side: Side; limb: string }) {
  const update = useStudio((s) => s.updateEntry)
  const involved = entry.involved === side
  const hasInvolved = entry.involved !== undefined
  const label = `${side === 'L' ? 'Left' : 'Right'} ${limb}`

  return (
    <div className={cn('rounded-lg border p-2.5', involved ? 'tint-caution' : 'border-line bg-canvas/40')}>
      <div className="flex items-center gap-2">
        <span className="flex size-5 items-center justify-center rounded-full bg-raised font-mono text-11 font-semibold">{side}</span>
        <span className="flex-1 text-13 font-medium">{label}</span>
        {hasInvolved &&
          (involved ? (
            <Tag tone="caution" icon={<span className="size-1.5 rounded-full bg-caution" />}>
              Involved
            </Tag>
          ) : (
            <button
              type="button"
              title="Mark as involved side"
              onClick={() => update(entry.id, (e) => void (e.involved = side))}
              className="rounded-full"
            >
              <Tag>Uninvolved</Tag>
            </button>
          ))}
      </div>
      <div className="mt-2 grid grid-cols-4 gap-2">
        {sideFields.map((f) => (
          <label key={f.key} className="min-w-0">
            <span className="eyebrow mb-1 block">{f.label}</span>
            <CellInput
              aria-label={`${label} ${f.label}`}
              value={entry.sides[side][f.key]}
              onChange={(e) => update(entry.id, (x) => void (x.sides[side][f.key] = e.target.value))}
            />
          </label>
        ))}
      </div>
    </div>
  )
}

export function UnilateralRow({ entry, order }: { entry: Entry; order: string }) {
  const items = useEntryActions(entry)
  const moveAlongChain = useStudio((s) => s.moveAlongChain)
  const ex = exerciseById.get(entry.exerciseId)
  const limb = ex && (ex.pattern === 'push' || ex.pattern === 'pull') ? 'arm' : 'leg'
  const regression = entry.linkedRegressionId ? exerciseById.get(entry.linkedRegressionId) : undefined
  const sym = lsi(entry)
  const target = entry.lsiTarget ?? 90
  const meets = sym ? sym.pct >= target : false

  return (
    <EntryShell entry={entry} className="p-3">
      <div className="flex flex-wrap items-center gap-2.5">
        <Grip />
        <OrderBadge>{order}</OrderBadge>
        <span className="flex-1 text-14 font-semibold">{name(entry)}</span>
        {regression && (
          <span className="tint-info inline-flex h-6 items-center gap-1.5 rounded-md border pl-2 pr-1 text-11 font-medium text-info max-sm:order-last">
            <Link2 size={12} />
            Linked Regression: {regression.name}
            <button
              type="button"
              aria-label={`Swap to ${regression.name}`}
              title="Swap to linked regression"
              onClick={(e) => {
                e.stopPropagation()
                moveAlongChain(entry.id, 'regress')
              }}
              className="flex size-4 items-center justify-center rounded hover:bg-info/20"
            >
              <ArrowLeftRight size={12} />
            </button>
          </span>
        )}
        <Menu label={`${name(entry)} options`} items={items} />
      </div>

      <div className="mt-3 grid gap-2 sm:grid-cols-2">
        <SidePanel entry={entry} side="L" limb={limb} />
        <SidePanel entry={entry} side="R" limb={limb} />
      </div>

      {sym && (
        <p className="mt-2.5 flex items-center gap-1.5 text-11 text-fg-secondary">
          <Activity size={12} className={meets ? 'text-accent-strong' : 'text-caution-text'} />
          Limb symmetry {sym.pct}% ({sym.involved} / {sym.other} lb) ·{' '}
          {meets ? <span className="text-accent-strong">meets ≥ {target}% target</span> : <>target ≥ {target}% before progressing</>}
        </p>
      )}
    </EntryShell>
  )
}
