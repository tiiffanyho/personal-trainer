import type { ReactNode } from 'react'
import { useSortable } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn } from '../ui'
import { entryDndId, HandleContext, type EntryDragData } from './dnd'

/** Wraps one exercise row so its grip reorders it (within or across tiers) */
export function SortableEntry({ entryId, tierId, label, children }: { entryId: string; tierId: string; label: string; children: ReactNode }) {
  const data: EntryDragData = { type: 'entry', entryId, tierId }
  const { setNodeRef, setActivatorNodeRef, attributes, listeners, transform, transition, isDragging, isOver, active } =
    useSortable({ id: entryDndId(entryId), data })
  const incoming = isOver && active?.data.current?.type !== 'entry' // library card hovering this row
  return (
    <div
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      className={cn('relative', isDragging && 'z-10 opacity-40')}
    >
      {incoming && <span aria-hidden className="absolute -top-1.5 inset-x-2 h-0.5 rounded-full bg-accent" />}
      <HandleContext.Provider value={{ label: `Reorder ${label}`, ref: setActivatorNodeRef, attributes, listeners }}>
        {children}
      </HandleContext.Provider>
    </div>
  )
}
