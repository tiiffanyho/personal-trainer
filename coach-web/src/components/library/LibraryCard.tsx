import { GripVertical, Play, Plus } from 'lucide-react'
import { useDraggable } from '@dnd-kit/core'
import { cn, Tag } from '../ui'
import type { Exercise } from '../../data/exercises'

export interface LibraryDragData {
  type: 'library-exercise'
  exerciseId: string
}

interface CardBodyProps {
  exercise: Exercise
  compact?: boolean
  selected?: boolean
  dragging?: boolean
  overlay?: boolean
  onSelect?: () => void
  onAdd?: () => void
  handleProps?: React.HTMLAttributes<HTMLButtonElement> & { ref?: (el: HTMLElement | null) => void }
}

function CardBody({ exercise, compact, selected, dragging, overlay, onSelect, onAdd, handleProps }: CardBodyProps) {
  return (
    <div
      className={cn(
        'group rounded-xl border p-2.5 transition-colors',
        selected ? 'tint-accent' : 'border-line bg-surface hover:border-line-strong',
        dragging && 'opacity-40',
        overlay && 'w-[247px] cursor-grabbing shadow-2xl shadow-black/40 ring-1 ring-accent/40',
      )}
    >
      <div className="flex items-center gap-2">
        <button
          type="button"
          aria-label={`Drag ${exercise.name}`}
          className="flex size-4 shrink-0 cursor-grab touch-none items-center justify-center text-fg-muted hover:text-fg-secondary active:cursor-grabbing"
          {...handleProps}
        >
          <GripVertical size={16} />
        </button>

        <button
          type="button"
          onClick={onSelect}
          aria-pressed={selected}
          className="flex min-w-0 flex-1 items-center gap-2 text-left"
        >
          <span className="flex size-10 shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-raised to-line-strong text-fg">
            <Play size={12} fill="currentColor" />
          </span>
          <span className="line-clamp-2 text-13 font-semibold">{exercise.name}</span>
        </button>

        <button
          type="button"
          aria-label={`Add ${exercise.name} to session`}
          title="Add to session"
          onClick={onAdd}
          disabled={!onAdd}
          className="flex size-7 shrink-0 items-center justify-center rounded-md bg-raised text-fg-secondary transition-colors hover:bg-accent hover:text-accent-fg disabled:opacity-60 disabled:hover:bg-raised disabled:hover:text-fg-secondary"
        >
          <Plus size={14} />
        </button>
      </div>

      {!compact && (
        <div className="mt-2 flex flex-wrap gap-1 pl-6">
          <Tag>{exercise.laterality}</Tag>
          {exercise.tags.map((t) => (
            <Tag key={t.label} tone={t.tone} solid>
              {t.label}
            </Tag>
          ))}
        </div>
      )}
    </div>
  )
}

interface LibraryCardProps {
  exercise: Exercise
  compact: boolean
  selected: boolean
  onSelect: () => void
  onAdd?: () => void
}

export function LibraryCard({ exercise, compact, selected, onSelect, onAdd }: LibraryCardProps) {
  const data: LibraryDragData = { type: 'library-exercise', exerciseId: exercise.id }
  const { setNodeRef, setActivatorNodeRef, listeners, attributes, isDragging } = useDraggable({
    id: `library:${exercise.id}`,
    data,
  })

  return (
    <li ref={setNodeRef} {...listeners}>
      <CardBody
        exercise={exercise}
        compact={compact}
        selected={selected}
        dragging={isDragging}
        onSelect={onSelect}
        onAdd={onAdd}
        handleProps={{ ...attributes, ref: setActivatorNodeRef }}
      />
    </li>
  )
}

/** Floating copy rendered in the DragOverlay */
export function LibraryCardOverlay({ exercise }: { exercise: Exercise }) {
  return <CardBody exercise={exercise} overlay />
}
