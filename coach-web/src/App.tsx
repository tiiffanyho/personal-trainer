import { useEffect, useState } from 'react'
import {
  closestCenter,
  DndContext,
  DragOverlay,
  KeyboardSensor,
  PointerSensor,
  pointerWithin,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DragEndEvent,
  type DragStartEvent,
} from '@dnd-kit/core'
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable'
import { GripVertical } from 'lucide-react'
import { TopBar } from './components/layout/TopBar'
import { Workspace } from './components/layout/Workspace'
import { ExerciseLibrary } from './components/library/ExerciseLibrary'
import { LibraryCardOverlay, type LibraryDragData } from './components/library/LibraryCard'
import { NEW_TIER_DROP_ID, SessionBuilder } from './components/session/SessionBuilder'
import type { TierDropData } from './components/session/TierBlock'
import type { EntryDragData } from './components/session/dnd'
import { Inspector } from './components/inspector/Inspector'
import { QuickInsert } from './components/overlays/QuickInsert'
import { Toast } from './components/overlays/Toast'
import { exerciseById } from './data/exercises'
import { useStudio } from './store/useStudio'

type DragData = LibraryDragData | EntryDragData | TierDropData

/**
 * Tiers only collide with tiers. Rows and library cards prefer the row under the
 * pointer (insert before it), then the tier under the pointer (append), then the
 * "Add Tier" zone. Keyboard drags have no pointer, so fall back to closest center.
 */
const collisionDetection: CollisionDetection = (args) => {
  const type = (args.active.data.current as DragData | undefined)?.type
  if (type === 'tier') {
    return closestCenter({
      ...args,
      droppableContainers: args.droppableContainers.filter((c) => c.data.current?.type === 'tier'),
    })
  }
  const hits = pointerWithin(args).filter((h) => h.id !== args.active.id)
  if (hits.length) {
    const typeOf = (id: string | number) => args.droppableContainers.find((c) => c.id === id)?.data.current?.type
    const rows = hits.filter((h) => typeOf(h.id) === 'entry')
    return rows.length ? rows : hits
  }
  return closestCenter({
    ...args,
    droppableContainers: args.droppableContainers.filter((c) => c.data.current?.type !== 'tier' || type !== 'entry'),
  })
}

const isEditable = (el: EventTarget | null) =>
  el instanceof HTMLElement && (el.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(el.tagName))

export default function App() {
  const [dragging, setDragging] = useState<DragData | null>(null)

  // Global shortcuts: ⌘K palette · / library search · ⌘Z / ⇧⌘Z undo / redo
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      const s = useStudio.getState()
      const mod = e.metaKey || e.ctrlKey
      if (mod && e.key.toLowerCase() === 'k') {
        e.preventDefault()
        s.setQuickInsertOpen(!s.quickInsertOpen)
      } else if (e.key === '/' && !mod && !isEditable(e.target) && !s.quickInsertOpen) {
        e.preventDefault()
        s.focusLibrarySearch()
      } else if (mod && e.key.toLowerCase() === 'z' && !isEditable(e.target)) {
        e.preventDefault()
        if (e.shiftKey) s.redo()
        else s.undo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [])

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  )

  const onDragStart = (e: DragStartEvent) => {
    const data = e.active.data.current as DragData | undefined
    setDragging(data ?? null)
    if (data?.type === 'library-exercise') useStudio.getState().setLibraryOpen(false) // reveal canvas on small screens
  }

  const onDragEnd = (e: DragEndEvent) => {
    setDragging(null)
    const data = e.active.data.current as DragData | undefined
    const over = e.over
    if (!data || !over) return
    const s = useStudio.getState()
    const days = s.plan[s.activeWeekId] ?? []
    const day = days.find((d) => d.id === s.activeDayId) ?? days[0]
    if (!day) return
    const overData = over.data.current as DragData | undefined

    // Where would a row land? Before the row it's over, or at the end of the tier.
    const landing = (): { tierId: string; index: number } | null => {
      if (overData?.type === 'entry') {
        const tier = day.tiers.find((t) => t.id === overData.tierId)
        return tier ? { tierId: tier.id, index: tier.entries.findIndex((x) => x.id === overData.entryId) } : null
      }
      if (overData?.type === 'tier') {
        const tier = day.tiers.find((t) => t.id === overData.tierId)
        return tier ? { tierId: tier.id, index: tier.entries.length } : null
      }
      return null
    }

    if (data.type === 'tier') {
      if (overData?.type !== 'tier') return
      s.moveTier(data.tierId, day.tiers.findIndex((t) => t.id === overData.tierId))
    } else if (data.type === 'entry') {
      const to = landing()
      if (!to) return
      // dropping on its own tier (not on a row) = move to the end
      const index = to.tierId === data.tierId && overData?.type === 'tier' ? to.index - 1 : to.index
      s.moveEntry(data.entryId, to.tierId, index)
    } else if (data.type === 'library-exercise') {
      if (over.id === NEW_TIER_DROP_ID) return s.addTier(data.exerciseId)
      const to = landing()
      if (to) s.insertExercise(data.exerciseId, to.tierId, to.index)
    }
  }

  const overlay = (() => {
    if (!dragging) return null
    if (dragging.type === 'library-exercise') {
      const ex = exerciseById.get(dragging.exerciseId)
      return ex ? <LibraryCardOverlay exercise={ex} /> : null
    }
    const s = useStudio.getState()
    const day = (s.plan[s.activeWeekId] ?? []).find((d) => d.id === s.activeDayId)
    const label =
      dragging.type === 'tier'
        ? day?.tiers.find((t) => t.id === dragging.tierId)?.title
        : exerciseById.get(
            day?.tiers.flatMap((t) => t.entries).find((x) => x.id === dragging.entryId)?.exerciseId ?? '',
          )?.name
    return (
      <div className="flex w-max cursor-grabbing items-center gap-2 rounded-lg border border-accent bg-surface px-3 py-2 text-13 font-semibold shadow-2xl shadow-black/40">
        <GripVertical size={14} className="text-fg-muted" />
        {dragging.type === 'tier' && <span className="font-mono text-11 text-accent-strong">TIER</span>}
        {label}
      </div>
    )
  })()

  return (
    <DndContext
      sensors={sensors}
      collisionDetection={collisionDetection}
      onDragStart={onDragStart}
      onDragEnd={onDragEnd}
      onDragCancel={() => setDragging(null)}
    >
      <div className="flex h-full min-w-0 flex-col">
        <TopBar />
        <Workspace library={<ExerciseLibrary />} canvas={<SessionBuilder />} inspector={<Inspector />} />
      </div>
      <DragOverlay dropAnimation={null}>{overlay}</DragOverlay>
      <QuickInsert />
      <Toast />
    </DndContext>
  )
}
