import type { ReactNode } from 'react'
import { cn } from './cn'

export interface TabItem<T extends string> {
  id: T
  label: ReactNode
}

interface TabsProps<T extends string> {
  items: TabItem<T>[]
  value: T
  onChange: (id: T) => void
  label: string
  className?: string
}

/** Underline tabs — inspector (Parameters / Clinical / History / Notes) */
export function UnderlineTabs<T extends string>({ items, value, onChange, label, className }: TabsProps<T>) {
  return (
    <div role="tablist" aria-label={label} className={cn('flex gap-5 border-b border-line', className)}>
      {items.map((t) => {
        const active = t.id === value
        return (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={cn(
              '-mb-px h-7 border-b-2 text-13 font-medium transition-colors',
              active ? 'border-accent text-fg font-semibold' : 'border-transparent text-fg-muted hover:text-fg-secondary',
            )}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}

/** Pill tabs — day switcher (Day 1 · Mon …) */
export function PillTabs<T extends string>({ items, value, onChange, label, className }: TabsProps<T>) {
  return (
    <div role="tablist" aria-label={label} className={cn('flex gap-1.5', className)}>
      {items.map((t) => {
        const active = t.id === value
        return (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={cn(
              'h-7 rounded-full border px-3 text-12 transition-colors',
              active
                ? 'border-line-strong bg-raised font-semibold text-fg'
                : 'border-line-strong text-fg-secondary hover:text-fg',
            )}
          >
            {t.label}
          </button>
        )
      })}
    </div>
  )
}

/** Segmented tabs — microcycle week switcher; label is fully custom per item */
export function SegmentedTabs<T extends string>({
  items,
  value,
  onChange,
  label,
  className,
  trailing,
}: TabsProps<T> & { trailing?: ReactNode }) {
  return (
    <div
      role="tablist"
      aria-label={label}
      className={cn('flex h-9 items-center gap-1 rounded-lg border border-line bg-surface p-1', className)}
    >
      {items.map((t) => {
        const active = t.id === value
        return (
          <button
            key={t.id}
            role="tab"
            type="button"
            aria-selected={active}
            onClick={() => onChange(t.id)}
            className={cn(
              'flex h-7 items-center gap-1.5 rounded-md px-3 text-13 transition-colors',
              active ? 'bg-raised font-semibold text-fg' : 'text-fg-secondary hover:text-fg',
            )}
          >
            {t.label}
          </button>
        )
      })}
      {trailing}
    </div>
  )
}
