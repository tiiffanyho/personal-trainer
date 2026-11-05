import { ChevronDown, Link, SquareSplitHorizontal, Trash2, Unlink } from 'lucide-react'
import { useDndContext } from '@dnd-kit/core'
import { rectSortingStrategy, SortableContext, useSortable, verticalListSortingStrategy } from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'
import { cn, Menu, Switch, Tag } from '../ui'
import type { Tier } from '../../data/session'
import { exerciseById } from '../../data/exercises'

const exerciseName = (id: string) => exerciseById.get(id)?.name ?? id
import { useStudio } from '../../store/useStudio'
import { plural, tierMinutes } from '../../lib/metrics'
import { CompactRow, PrimerCard, SetTableRow, UnilateralRow } from './entries'
import { Grip, InlineText, TierBadge } from './parts'
import { SortableEntry } from './sortable'
import { entryDndId, HandleContext, tierDndId } from './dnd'

export interface TierDropData {
  type: 'tier'
  tierId: string
}

interface TierBlockProps {
  tier: Tier
  index: number
  /** Letter for stack tiers (A, B, …) — undefined for card tiers */
  letter?: string
}

export function TierBlock({ tier, index, letter }: TierBlockProps) {
  const { updateTier, setTierUnilateral, removeTier } = useStudio.getState()
  const data: TierDropData = { type: 'tier', tierId: tier.id }
  const { setNodeRef, setActivatorNodeRef, attributes, listeners, transform, transition, isDragging } = useSortable({
    id: tierDndId(tier.id),
    data,
  })
  const { active, over } = useDndContext()
  const activeType = active?.data.current?.type
  // something that can land in this tier (library card, or a row from another tier)
  const incoming =
    activeType === 'library-exercise' || (activeType === 'entry' && active?.data.current?.tierId !== tier.id)
  const isOver = incoming && (over?.id === tierDndId(tier.id) || over?.data.current?.tierId === tier.id)
  const dragging = incoming

  const labels = tier.entries.map((_, i) => `${letter}${i + 1}`)
  const showSuperset = tier.superset && tier.entries.length > 1 && letter
  const mins = tierMinutes(tier)

  return (
    <section
      ref={setNodeRef}
      style={{ transform: CSS.Translate.toString(transform), transition }}
      aria-label={`Tier ${index + 1}: ${tier.title}`}
      className={cn(
        'relative rounded-xl border bg-raised/40 p-3 transition-colors',
        isDragging && 'z-20 opacity-40',
        isOver ? 'border-accent ring-2 ring-accent/30' : dragging ? 'border-dashed border-line-strong' : 'border-line',
      )}
    >
      <header className="flex flex-wrap items-center gap-2">
        <HandleContext.Provider
          value={{ label: `Reorder tier ${tier.title}`, ref: setActivatorNodeRef, attributes, listeners }}
        >
          <Grip />
        </HandleContext.Provider>
        <TierBadge n={index + 1} />
        <InlineText
          aria-label="Tier title"
          value={tier.title}
          onChange={(e) => updateTier(tier.id, { title: e.target.value })}
          size={Math.max(8, tier.title.length)}
          className="text-14 font-semibold"
        />
        <span className="flex-1 whitespace-nowrap text-12 text-fg-muted">
          {plural(tier.entries.length, 'exercise')}
          {mins > 0 && <> · ~{mins} min</>}
        </span>
        {showSuperset && <Tag tone="accent">Superset {labels.join(' / ')}</Tag>}
        {tier.layout === 'stack' && tier.unilateral && (
          <span
            className={cn(
              'inline-flex h-[22px] items-center gap-1.5 rounded-full border pl-2 pr-1 text-11 font-medium',
              tier.unilateral ? 'tint-accent text-accent-strong' : 'border-line-strong text-fg-muted',
            )}
          >
            Unilateral
            <Switch label="Unilateral tier" checked={tier.unilateral} onChange={(v) => setTierUnilateral(tier.id, v)} />
          </span>
        )}
        <Menu
          label={`${tier.title} options`}
          items={[
            ...(tier.layout === 'stack' && tier.entries.length > 1
              ? [
                  {
                    label: tier.superset ? 'Unlink superset' : 'Link as superset',
                    icon: tier.superset ? <Unlink size={14} /> : <Link size={14} />,
                    onSelect: () => updateTier(tier.id, { superset: !tier.superset }),
                  },
                ]
              : []),
            ...(tier.layout === 'stack' && !tier.unilateral
              ? [
                  {
                    label: 'Make unilateral (L / R)',
                    icon: <SquareSplitHorizontal size={14} />,
                    onSelect: () => setTierUnilateral(tier.id, true),
                  },
                ]
              : []),
            { label: 'Remove tier', icon: <Trash2 size={14} />, destructive: true, onSelect: () => removeTier(tier.id) },
          ]}
        />
        <button
          type="button"
          aria-label={tier.collapsed ? 'Expand tier' : 'Collapse tier'}
          aria-expanded={!tier.collapsed}
          onClick={() => updateTier(tier.id, { collapsed: !tier.collapsed })}
          className="flex size-6 items-center justify-center rounded-md text-fg-muted hover:bg-raised hover:text-fg"
        >
          <ChevronDown size={16} className={cn('transition-transform', tier.collapsed && '-rotate-90')} />
        </button>
      </header>

      {!tier.collapsed && (
        <div className="mt-3">
          {tier.entries.length === 0 ? (
            <div
              className={cn(
                'rounded-lg border border-dashed px-4 py-6 text-center text-12',
                isOver ? 'border-accent text-accent-strong' : 'border-line-strong text-fg-muted',
              )}
            >
              Drag exercises here, or select this tier and press + in the library
            </div>
          ) : tier.layout === 'cards' ? (
            <SortableContext items={tier.entries.map((e) => entryDndId(e.id))} strategy={rectSortingStrategy}>
              <div className="grid gap-2 md:grid-cols-2">
                {tier.entries.map((e) => (
                  <SortableEntry key={e.id} entryId={e.id} tierId={tier.id} label={exerciseName(e.exerciseId)}>
                    <PrimerCard entry={e} />
                  </SortableEntry>
                ))}
              </div>
            </SortableContext>
          ) : (
            <SortableContext items={tier.entries.map((e) => entryDndId(e.id))} strategy={verticalListSortingStrategy}>
              <div className={cn('relative space-y-2', showSuperset && 'pl-3.5')}>
                {showSuperset && <span aria-hidden className="absolute inset-y-0 left-0 w-[3px] rounded-full bg-accent" />}
                {tier.entries.map((e, i) => {
                  const order = labels[i]
                  return (
                    <SortableEntry key={e.id} entryId={e.id} tierId={tier.id} label={exerciseName(e.exerciseId)}>
                      {e.mode === 'sets' ? (
                        <SetTableRow entry={e} order={order} />
                      ) : e.mode === 'unilateral' ? (
                        <UnilateralRow entry={e} order={order} />
                      ) : (
                        <CompactRow entry={e} order={order} />
                      )}
                    </SortableEntry>
                  )
                })}
              </div>
            </SortableContext>
          )}
        </div>
      )}
    </section>
  )
}
