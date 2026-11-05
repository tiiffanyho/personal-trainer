import { useEffect, useMemo, useRef, useState } from 'react'
import { Layers, Search, X } from 'lucide-react'
import { Button, Chip, IconButton, Input, Kbd, Tag } from '../ui'
import { exercises, patterns, type Pattern } from '../../data/exercises'
import { matchesExercise as matches, tokenize } from '../../lib/search'
import { useStudio } from '../../store/useStudio'
import { LibraryCard } from './LibraryCard'


export function ExerciseLibrary() {
  const [query, setQuery] = useState('')
  const [pattern, setPattern] = useState<Pattern | null>('squat')
  const [compact, setCompact] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const selectedId = useStudio((s) => s.selectedLibraryId)
  const select = useStudio((s) => s.selectLibraryExercise)
  const focusTick = useStudio((s) => s.searchFocusTick)
  const setLibraryOpen = useStudio((s) => s.setLibraryOpen)
  const addExercise = useStudio((s) => s.addExercise)

  useEffect(() => {
    if (focusTick === 0) return
    inputRef.current?.focus()
    inputRef.current?.select()
  }, [focusTick])

  const tokens = useMemo(() => tokenize(query), [query])

  // Chip counts reflect the current search so they never promise empty results
  const counts = useMemo(() => {
    const c = Object.fromEntries(patterns.map((p) => [p.id, 0])) as Record<Pattern, number>
    for (const ex of exercises) if (matches(ex, tokens)) c[ex.pattern]++
    return c
  }, [tokens])

  const results = useMemo(
    () => exercises.filter((ex) => (!pattern || ex.pattern === pattern) && matches(ex, tokens)),
    [pattern, tokens],
  )

  const sectionLabel = tokens.length
    ? `${results.length} result${results.length === 1 ? '' : 's'}`
    : pattern
      ? patterns.find((p) => p.id === pattern)!.section
      : 'All exercises'

  return (
    <div className="flex flex-col gap-4">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <h2 className="text-14 font-semibold">Exercise Library</h2>
          <Tag mono>{exercises.length}</Tag>
        </div>
        <div className="flex items-center gap-1">
          <IconButton
            label={compact ? 'Show tags' : 'Compact view'}
            aria-pressed={compact}
            onClick={() => setCompact((c) => !c)}
            className={compact ? 'bg-raised text-fg' : undefined}
          >
            <Layers size={16} />
          </IconButton>
          <IconButton label="Close library" className="lg:hidden" onClick={() => setLibraryOpen(false)}>
            <X size={16} />
          </IconButton>
        </div>
      </div>

      <Input
        ref={inputRef}
        type="search"
        aria-label="Search exercises"
        placeholder="Search exercises, tags…"
        value={query}
        onChange={(e) => setQuery(e.target.value)}
        onKeyDown={(e) => e.key === 'Escape' && setQuery('')}
        leading={<Search size={16} />}
        trailing={
          query ? (
            <button type="button" aria-label="Clear search" onClick={() => setQuery('')} className="text-fg-muted hover:text-fg">
              <X size={14} />
            </button>
          ) : (
            <Kbd>/</Kbd>
          )
        }
      />

      <div role="group" aria-label="Filter by movement pattern" className="flex flex-wrap gap-1.5">
        {patterns.map((p) => (
          <Chip
            key={p.id}
            active={pattern === p.id}
            count={counts[p.id]}
            onClick={() => setPattern((cur) => (cur === p.id ? null : p.id))}
          >
            {p.label}
          </Chip>
        ))}
      </div>

      <div className="flex items-baseline justify-between gap-2">
        <span className="eyebrow truncate" aria-live="polite">
          {sectionLabel}
        </span>
        <span className="shrink-0 text-11 text-fg-muted">Drag to canvas</span>
      </div>

      {results.length > 0 ? (
        <ul className="flex flex-col gap-2">
          {results.map((ex) => (
            <LibraryCard
              key={ex.id}
              exercise={ex}
              compact={compact}
              selected={ex.id === selectedId}
              onSelect={() => select(ex.id === selectedId ? null : ex.id)}
              onAdd={() => addExercise(ex.id)}
            />
          ))}
        </ul>
      ) : (
        <div className="flex flex-col items-center gap-3 rounded-xl border border-dashed border-line-strong px-4 py-8 text-center">
          <p className="text-13 text-fg-secondary">
            No {pattern ? patterns.find((p) => p.id === pattern)!.label.toLowerCase() + ' ' : ''}exercises
            {query && <> match “{query}”</>}.
          </p>
          <Button
            size="sm"
            onClick={() => {
              setQuery('')
              setPattern(null)
            }}
          >
            Clear filters
          </Button>
        </div>
      )}
    </div>
  )
}
