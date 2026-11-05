import { useEffect, useRef, useState, type ReactNode } from 'react'
import { MoreHorizontal } from 'lucide-react'
import { cn } from './cn'

export interface MenuItem {
  label: string
  icon?: ReactNode
  onSelect: () => void
  destructive?: boolean
  disabled?: boolean
}

interface MenuProps {
  label: string
  items: MenuItem[]
  /** bordered 32px trigger (day header) vs. bare 16px icon (rows) */
  variant?: 'bordered' | 'bare'
  className?: string
}

export function Menu({ label, items, variant = 'bare', className }: MenuProps) {
  const [open, setOpen] = useState(false)
  const ref = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (!open) return
    const onDown = (e: PointerEvent) => !ref.current?.contains(e.target as Node) && setOpen(false)
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && setOpen(false)
    document.addEventListener('pointerdown', onDown)
    document.addEventListener('keydown', onKey)
    return () => {
      document.removeEventListener('pointerdown', onDown)
      document.removeEventListener('keydown', onKey)
    }
  }, [open])

  return (
    <div ref={ref} className={cn('relative shrink-0', className, open && '!opacity-100')}>
      <button
        type="button"
        aria-label={label}
        aria-haspopup="menu"
        aria-expanded={open}
        onClick={(e) => {
          e.stopPropagation()
          setOpen((o) => !o)
        }}
        className={cn(
          'flex items-center justify-center rounded-md text-fg-muted transition-colors hover:bg-raised hover:text-fg',
          variant === 'bordered' ? 'size-8 border border-line-strong' : 'size-6',
        )}
      >
        <MoreHorizontal size={16} />
      </button>
      {open && (
        <div
          role="menu"
          className="absolute right-0 top-full z-50 mt-1 min-w-44 rounded-lg border border-line-strong bg-surface p-1 shadow-xl shadow-black/30"
        >
          {items.map((item) => (
            <button
              key={item.label}
              role="menuitem"
              type="button"
              disabled={item.disabled}
              onClick={(e) => {
                e.stopPropagation()
                setOpen(false)
                item.onSelect()
              }}
              className={cn(
                'flex w-full items-center gap-2 rounded-md px-2.5 py-1.5 text-left text-13 transition-colors hover:bg-raised disabled:opacity-40',
                item.destructive ? 'text-critical-strong' : 'text-fg',
              )}
            >
              {item.icon && <span className="text-fg-muted">{item.icon}</span>}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  )
}
