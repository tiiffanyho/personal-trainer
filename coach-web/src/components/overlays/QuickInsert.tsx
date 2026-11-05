import { useEffect, useMemo, useRef, useState, type ReactNode } from 'react'
import {
  CalendarDays,
  ChevronsDownUp,
  ChevronsUpDown,
  CornerDownLeft,
  Layers,
  Moon,
  RotateCcw,
  Search,
  Sun,
  Undo2,
} from 'lucide-react'
import { cn, Kbd } from '../ui'
import { exercises, patterns, type Exercise } from '../../data/exercises'
import { useActiveDay, useActiveDays, useStudio } from '../../store/useStudio'
import { matchesExercise, tokenize } from '../../lib/search'

type Item =
  | { kind: 'exercise'; id: string; ex: Exercise }
  | { kind: 'action'; id: string; label: string; icon: ReactNode; hint?: string; run: () => void }

function rank(ex: Exercise, q: string) {
  const n = ex.name.toLowerCase()
  if (!q) return 2
  if (n.startsWith(q)) return 0
  if (n.includes(q)) return 1
  return 2
}

export function QuickInsert() {
  const open = useStudio((s) => s.quickInsertOpen)
  if (!open) return null
  return <Palette />
}

function Palette() {
  const day = useActiveDay()
  const days = useActiveDays()
  const theme = useStudio((s) => s.theme)
  const canUndo = useStudio((s) => s.past.length > 0)
  const remembered = useStudio((s) => s.targetTierId)
  const selectedEntryId = useStudio((s) => s.selectedEntryId)
  const store = useStudio.getState()

  const [query, setQuery] = useState('')
  const [active, setActive] = useState(0)
  const tiers = day?.tiers ?? []
  const [tierId, setTierId] = useState(
    () =>
      (
        tiers.find((t) => t.id === remembered) ??
        tiers.find((t) => t.entries.some((e) => e.id === selectedEntryId)) ??
        tiers[tiers.length - 1]
      )?.id ?? '',
  )
  const inputRef = useRef<HTMLInputElement>(null)
  const listRef = useRef<HTMLDivElement>(null)

  useEffect(() => inputRef.current?.focus(), [])

  const close = () => store.setQuickInsertOpen(false)

  const items = useMemo<Item[]>(() => {
    const tokens = tokenize(query)
    const q = query.trim().toLowerCase()
    const exItems: Item[] = exercises
      .filter((ex) => matchesExercise(ex, tokens))
      .sort((a, b) => rank(a, q) - rank(b, q))
      .slice(0, query ? 8 : 5)
      .map((ex) => ({ kind: 'exercise', id: `ex:${ex.id}`, ex }))

    const actions: Item[] = [
      { kind: 'action', id: 'add-tier', label: 'Add tier', icon: <Layers size={16} />, run: () => store.addTier() },
      ...days
        .filter((d) => d.id !== day?.id)
        .map<Item>((d) => ({
          kind: 'action',
          id: `day:${d.id}`,
          label: `Go to ${d.tab}`,
          hint: d.title.replace(/^Day \d+:\s*/, ''),
          icon: <CalendarDays size={16} />,
          run: () => store.setActiveDay(d.id),
        })),
      { kind: 'action', id: 'collapse', label: 'Collapse all tiers', icon: <ChevronsDownUp size={16} />, run: () => store.setAllCollapsed(true) },
      { kind: 'action', id: 'expand', label: 'Expand all tiers', icon: <ChevronsUpDown size={16} />, run: () => store.setAllCollapsed(false) },
      {
        kind: 'action',
        id: 'theme',
        label: theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode',
        icon: theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />,
        run: () => store.toggleTheme(),
      },
      ...(canUndo
        ? [{ kind: 'action', id: 'undo', label: 'Undo last change', hint: '⌘Z', icon: <Undo2 size={16} />, run: () => store.undo() } as Item]
        : []),
      {
        kind: 'action',
        id: 'reset',
        label: 'Reset to demo program',
        hint: 'Undoable',
        icon: <RotateCcw size={16} />,
        run: () => store.resetDemo(),
      },
    ]
    const actionItems = actions.filter((a) => a.kind === 'action' && tokens.every((t) => a.label.toLowerCase().includes(t)))
    return [...exItems, ...actionItems]
  }, [query, days, day?.id, theme, canUndo, store])

  const safeActive = Math.min(active, Math.max(0, items.length - 1))
  const current = items[safeActive]

  useEffect(() => {
    listRef.current?.querySelector(`[data-index="${safeActive}"]`)?.scrollIntoView({ block: 'nearest' })
  }, [safeActive])

  const run = (item: Item | undefined, keepOpen = false) => {
    if (!item) return
    if (item.kind === 'exercise') {
      if (tierId) store.addExercise(item.ex.id, tierId)
      else store.addTier(item.ex.id)
      const tier = tiers.find((t) => t.id === tierId)
      store.showToast(`Added ${item.ex.name}${tier ? ` to ${tier.title}` : ''}`)
      if (keepOpen) {
        setQuery('')
        inputRef.current?.focus()
        return
      }
    } else {
      item.run()
    }
    close()
  }

  const onKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault()
      setActive((i) => Math.min(items.length - 1, i + 1))
    } else if (e.key === 'ArrowUp') {
      e.preventDefault()
      setActive((i) => Math.max(0, i - 1))
    } else if (e.key === 'Enter') {
      e.preventDefault()
      run(current, e.shiftKey)
    } else if (e.key === 'Escape') {
      e.preventDefault()
      close()
    }
  }

  const firstAction = items.findIndex((i) => i.kind === 'action')

  return (
    <div className="fixed inset-0 z-50 flex items-start justify-center bg-black/50 px-4 pt-[12vh]" onMouseDown={close}>
      <div
        role="dialog"
        aria-modal="true"
        aria-label="Quick insert"
        onMouseDown={(e) => e.stopPropagation()}
        onKeyDown={onKeyDown}
        className="flex max-h-[70vh] w-full max-w-[560px] flex-col overflow-hidden rounded-xl border border-line-strong bg-surface shadow-2xl shadow-black/40"
      >
        <div className="flex items-center gap-3 border-b border-line px-4">
          <Search size={16} className="text-fg-muted" />
          <input
            ref={inputRef}
            role="combobox"
            aria-expanded="true"
            aria-controls="quick-insert-list"
            aria-activedescendant={current ? `qi-${current.id}` : undefined}
            aria-label="Search exercises and actions"
            placeholder="Add an exercise or run an action…"
            value={query}
            onChange={(e) => {
              setQuery(e.target.value)
              setActive(0)
            }}
            className="h-12 min-w-0 flex-1 bg-transparent text-14 text-fg outline-none placeholder:text-fg-muted"
          />
          <Kbd>Esc</Kbd>
        </div>

        <label className="flex items-center gap-2 border-b border-line bg-raised/40 px-4 py-2 text-12 text-fg-muted">
          Adding to
          <select
            aria-label="Target tier"
            value={tierId}
            onChange={(e) => setTierId(e.target.value)}
            className="rounded border border-line-strong bg-field px-1.5 py-0.5 text-12 font-medium text-fg outline-none focus:border-accent"
          >
            {tiers.length === 0 && <option value="">New tier</option>}
            {tiers.map((t, i) => (
              <option key={t.id} value={t.id}>
                Tier {i + 1} · {t.title}
              </option>
            ))}
          </select>
          <span className="ml-auto hidden sm:inline">⇧↵ add &amp; keep open</span>
        </label>

        <div id="quick-insert-list" role="listbox" ref={listRef} className="overflow-y-auto p-1.5">
          {items.length === 0 && <p className="px-3 py-6 text-center text-13 text-fg-muted">No matches for “{query}”.</p>}
          {items.map((item, i) => (
            <div key={item.id}>
              {i === 0 && item.kind === 'exercise' && <GroupLabel>Exercises</GroupLabel>}
              {i === firstAction && <GroupLabel>Actions</GroupLabel>}
              <div
                id={`qi-${item.id}`}
                role="option"
                aria-selected={i === safeActive}
                data-index={i}
                onMouseMove={() => setActive(i)}
                onClick={() => run(item)}
                className={cn(
                  'flex cursor-pointer items-center gap-3 rounded-lg px-3 py-2',
                  i === safeActive ? 'bg-raised' : 'hover:bg-raised/60',
                )}
              >
                {item.kind === 'exercise' ? (
                  <>
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-13 font-semibold">{item.ex.name}</span>
                      <span className="block truncate text-11 text-fg-muted">
                        {patterns.find((p) => p.id === item.ex.pattern)?.label} · {item.ex.laterality} ·{' '}
                        {item.ex.tags.map((t) => t.label).join(' · ')}
                      </span>
                    </span>
                  </>
                ) : (
                  <>
                    <span className="text-fg-muted">{item.icon}</span>
                    <span className="flex-1 text-13">{item.label}</span>
                    {item.hint && <span className="text-11 text-fg-muted">{item.hint}</span>}
                  </>
                )}
                {i === safeActive && <CornerDownLeft size={14} className="shrink-0 text-fg-muted" aria-hidden />}
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function GroupLabel({ children }: { children: ReactNode }) {
  return <div className="eyebrow px-3 pb-1 pt-2">{children}</div>
}
