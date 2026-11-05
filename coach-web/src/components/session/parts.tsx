import { useContext, useLayoutEffect, useRef, type InputHTMLAttributes, type ReactNode, type TextareaHTMLAttributes } from 'react'
import { GripVertical, Play } from 'lucide-react'
import { cn } from '../ui'
import { HandleContext } from './dnd'


export function Grip({ size = 16, className }: { size?: number; className?: string }) {
  const handle = useContext(HandleContext)
  const icon = <GripVertical aria-hidden size={size} className={cn('shrink-0 text-fg-muted', className)} />
  if (!handle) return icon
  return (
    <button
      type="button"
      ref={handle.ref}
      {...handle.attributes}
      {...handle.listeners}
      aria-label={handle.label}
      onClick={(e) => e.stopPropagation()}
      className="-m-1 flex shrink-0 cursor-grab touch-none items-center justify-center rounded p-1 hover:bg-raised active:cursor-grabbing [&>svg]:hover:text-fg"
    >
      {icon}
    </button>
  )
}

export function Thumb({ size = 32 }: { size?: 32 | 40 }) {
  return (
    <span
      className={cn(
        'flex shrink-0 items-center justify-center rounded-md bg-gradient-to-br from-raised to-line-strong text-fg',
        size === 32 ? 'size-8' : 'size-10',
      )}
    >
      <Play size={10} fill="currentColor" />
    </span>
  )
}

export function OrderBadge({ children }: { children: ReactNode }) {
  return (
    <span className="tint-accent flex h-6 w-[30px] shrink-0 items-center justify-center rounded-md border font-mono text-11 font-medium text-accent-strong">
      {children}
    </span>
  )
}

export function TierBadge({ n }: { n: number }) {
  return (
    <span className="tint-accent flex h-[18px] shrink-0 items-center rounded border px-1.5 font-mono text-11 font-medium tracking-wide text-accent-strong">
      TIER {n}
    </span>
  )
}

/** Borderless text input that reads as plain text until hovered / focused */
export function InlineText({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        '-mx-1 min-w-0 rounded border border-transparent bg-transparent px-1 outline-none transition-colors',
        'hover:border-line focus:border-accent focus:bg-canvas',
        className,
      )}
      {...rest}
    />
  )
}

/** Multi-line variant of InlineText: grows with its content, Enter commits instead of adding a newline */
export function InlineTextArea({ className, value, ...rest }: TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const ref = useRef<HTMLTextAreaElement>(null)
  useLayoutEffect(() => {
    const el = ref.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = `${el.scrollHeight}px`
  }, [value])
  return (
    <textarea
      ref={ref}
      rows={1}
      value={value}
      onKeyDown={(e) => {
        if (e.key === 'Enter') {
          e.preventDefault()
          e.currentTarget.blur()
        }
      }}
      className={cn(
        '-mx-1 block w-full resize-none overflow-hidden rounded border border-transparent bg-transparent px-1 outline-none transition-colors',
        'hover:border-line focus:border-accent focus:bg-canvas',
        className,
      )}
      {...rest}
    />
  )
}

/** Tiny auto-width input used inside Rx pills */
export function PillField({ value, onChange, label, className }: { value: string; onChange: (v: string) => void; label: string; className?: string }) {
  return (
    <input
      aria-label={label}
      value={value}
      size={Math.max(1, value.length)}
      onChange={(e) => onChange(e.target.value)}
      onClick={(e) => e.stopPropagation()}
      className={cn(
        'min-w-[1ch] bg-transparent text-center font-mono text-11 text-fg outline-none focus:text-accent-strong',
        className,
      )}
    />
  )
}

export function Pill({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <span
      className={cn(
        'inline-flex h-[22px] shrink-0 items-center gap-1 rounded-md border border-line-strong bg-field px-2 font-mono text-11 text-fg-muted',
        'focus-within:border-accent',
        className,
      )}
    >
      {children}
    </span>
  )
}
