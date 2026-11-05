import { Activity, ChevronsDownUp, ChevronsUpDown, Layers, Plus, Timer } from 'lucide-react'
import { useDndContext, useDroppable } from '@dnd-kit/core'
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { tierDndId } from './dnd'
import { Button, cn, Menu, PillTabs } from '../ui'
import { useActiveDay, useActiveDays, useStudio } from '../../store/useStudio'
import { dayStats, plural } from '../../lib/metrics'
import { TierBlock } from './TierBlock'
import { InlineTextArea } from './parts'
import { tierLetters } from '../../lib/structure'

export const NEW_TIER_DROP_ID = 'new-tier'

function AddTierButton() {
  const addTier = useStudio((s) => s.addTier)
  const { setNodeRef, isOver } = useDroppable({ id: NEW_TIER_DROP_ID, data: { type: 'new-tier' } })
  const dragging = useDndContext().active?.data.current?.type === 'library-exercise'
  return (
    <div ref={setNodeRef}>
      <Button
        variant="dashed"
        size="lg"
        icon={<Plus size={16} />}
        onClick={() => addTier()}
        className={cn('w-full', isOver && 'border-accent text-accent-strong', dragging && !isOver && 'border-fg-muted')}
      >
        {dragging ? 'Drop to start a new tier' : 'Add Tier'}
      </Button>
    </div>
  )
}

export function SessionBuilder() {
  const days = useActiveDays()
  const day = useActiveDay()
  const activeDayId = useStudio((s) => s.activeDayId)
  const { setActiveDay, updateDay, setAllCollapsed, setQuickInsertOpen } = useStudio.getState()

  if (!day) return null
  const stats = dayStats(day)
  const letters = tierLetters(day)

  return (
    <div className="mx-auto flex max-w-[960px] flex-col gap-4">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <PillTabs
          label="Session days"
          value={activeDayId}
          onChange={setActiveDay}
          items={days.map((d) => ({ id: d.id, label: d.tab }))}
        />
        <dl className="flex flex-wrap items-center gap-4 text-12 text-fg-secondary">
          <div className="flex items-center gap-1.5">
            <Timer size={14} aria-hidden />
            <dt className="sr-only">Estimated duration</dt>
            <dd>≈ {stats.minutes} min</dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Layers size={14} aria-hidden />
            <dt className="sr-only">Structure</dt>
            <dd>
              {plural(stats.tiers, 'tier')} · {plural(stats.exercises, 'exercise')}
            </dd>
          </div>
          <div className="flex items-center gap-1.5">
            <Activity size={14} aria-hidden />
            <dt className="sr-only">Volume load</dt>
            <dd>Vol. load {stats.volume.toLocaleString()} lb</dd>
          </div>
        </dl>
      </div>

      <article className="rounded-2xl border border-line bg-surface p-3 sm:p-4">
        <header className="mb-4 flex items-start gap-3">
          <div className="flex min-w-0 flex-1 flex-col">
            <InlineTextArea
              aria-label="Day title"
              value={day.title}
              onChange={(e) => updateDay({ title: e.target.value })}
              className="text-18 font-semibold tracking-[-0.5px] sm:text-20"
            />
            <InlineTextArea
              aria-label="Day focus"
              value={day.subtitle}
              onChange={(e) => updateDay({ subtitle: e.target.value })}
              className="text-13 text-fg-secondary"
            />
          </div>
          <Menu
            variant="bordered"
            label="Day options"
            items={[
              { label: 'Collapse all tiers', icon: <ChevronsDownUp size={14} />, onSelect: () => setAllCollapsed(true) },
              { label: 'Expand all tiers', icon: <ChevronsUpDown size={14} />, onSelect: () => setAllCollapsed(false) },
            ]}
          />
        </header>

        <div className="flex flex-col gap-3">
          <SortableContext items={day.tiers.map((t) => tierDndId(t.id))} strategy={verticalListSortingStrategy}>
            {day.tiers.map((t, i) => (
              <TierBlock key={t.id} tier={t} index={i} letter={letters[i]} />
            ))}
          </SortableContext>
          {day.tiers.length === 0 && (
            <p className="rounded-xl border border-dashed border-line-strong px-4 py-10 text-center text-13 text-fg-muted">
              This day is empty. Add a tier, or drag an exercise onto “Add Tier”.
            </p>
          )}
        </div>
      </article>

      <div className="grid gap-3 sm:grid-cols-2">
        <AddTierButton />
        <Button variant="dashed" size="lg" icon={<Plus size={16} />} onClick={() => setQuickInsertOpen(true)}>
          Add Exercise Row
        </Button>
      </div>
    </div>
  )
}
