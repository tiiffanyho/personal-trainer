import type { ComponentProps, InputHTMLAttributes, ReactNode } from 'react'
import { Check, ChevronDown } from 'lucide-react'
import { cn, type Tone } from './cn'

/* ---------- Kbd ---------- */
export function Kbd({ children, className }: { children: ReactNode; className?: string }) {
  return (
    <kbd
      className={cn(
        'inline-flex h-[18px] min-w-[26px] items-center justify-center rounded border border-line-strong bg-raised px-1 font-sans text-[10px] font-medium text-fg-muted',
        className,
      )}
    >
      {children}
    </kbd>
  )
}

/* ---------- Filter chip (pattern filters) ---------- */
interface ChipProps {
  active?: boolean
  count?: number
  onClick?: () => void
  children: ReactNode
}
export function Chip({ active, count, onClick, children }: ChipProps) {
  return (
    <button
      type="button"
      aria-pressed={active}
      onClick={onClick}
      className={cn(
        'inline-flex h-7 items-center gap-1.5 rounded-full border px-2.5 text-12 font-medium transition-colors',
        active ? 'tint-accent text-accent-strong' : 'border-line-strong text-fg-secondary hover:text-fg',
      )}
    >
      {children}
      {count !== undefined && <span className="font-mono text-[10px] opacity-70">{count}</span>}
    </button>
  )
}

/* ---------- Text input ---------- */
interface InputProps extends ComponentProps<'input'> {
  mono?: boolean
  leading?: ReactNode
  trailing?: ReactNode
  wrapperClassName?: string
}
export function Input({ mono, leading, trailing, className, wrapperClassName, ...rest }: InputProps) {
  return (
    <label
      className={cn(
        'flex h-10 items-center gap-2 rounded-lg border border-line-strong bg-surface px-3 text-fg-muted',
        'focus-within:border-accent focus-within:ring-2 focus-within:ring-accent/25',
        wrapperClassName,
      )}
    >
      {leading}
      <input
        className={cn(
          'min-w-0 flex-1 bg-transparent text-13 text-fg outline-none placeholder:text-fg-muted',
          mono && 'font-mono',
          className,
        )}
        {...rest}
      />
      {trailing}
    </label>
  )
}

/* ---------- Spreadsheet / field cell (32px mono input) ---------- */
export function CellInput({ className, ...rest }: InputHTMLAttributes<HTMLInputElement>) {
  return (
    <input
      className={cn(
        'h-8 w-full min-w-0 rounded-md border border-line-strong bg-field px-2.5 font-mono text-13 text-fg outline-none',
        'focus:border-accent focus:ring-2 focus:ring-accent/25',
        className,
      )}
      {...rest}
    />
  )
}

/* ---------- Switch ---------- */
interface SwitchProps {
  checked: boolean
  onChange: (v: boolean) => void
  tone?: Extract<Tone, 'accent' | 'critical'>
  label: string
  size?: 'sm' | 'md'
}
export function Switch({ checked, onChange, tone = 'accent', label, size = 'sm' }: SwitchProps) {
  const track = size === 'sm' ? 'h-3.5 w-[26px]' : 'h-4 w-[30px]'
  const knob = size === 'sm' ? 'size-2.5' : 'size-3'
  const shift = size === 'sm' ? 'translate-x-3' : 'translate-x-3.5'
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative inline-flex shrink-0 items-center rounded-full p-0.5 transition-colors',
        track,
        checked ? (tone === 'critical' ? 'bg-critical' : 'bg-accent') : 'bg-line-strong',
      )}
    >
      <span className={cn('rounded-full bg-white transition-transform', knob, checked && shift)} />
    </button>
  )
}

/* ---------- Checkbox ---------- */
interface CheckboxProps {
  checked: boolean
  onChange: (v: boolean) => void
  tone?: Extract<Tone, 'accent' | 'critical'>
  children: ReactNode
}
export function Checkbox({ checked, onChange, tone = 'accent', children }: CheckboxProps) {
  return (
    <label className="flex cursor-pointer items-center gap-2 text-12 text-fg-secondary">
      <input type="checkbox" className="peer sr-only" checked={checked} onChange={(e) => onChange(e.target.checked)} />
      <span
        className={cn(
          'flex size-4 shrink-0 items-center justify-center rounded border transition-colors',
          'peer-focus-visible:ring-2 peer-focus-visible:ring-accent',
          checked
            ? tone === 'critical'
              ? 'border-critical bg-critical text-critical-fg'
              : 'border-accent bg-accent text-accent-fg'
            : 'border-line-strong bg-surface',
        )}
      >
        {checked && <Check size={12} strokeWidth={3} />}
      </span>
      {children}
    </label>
  )
}

/* ---------- Select (native, styled like the Figma dropdown) ---------- */
interface SelectProps<T extends string> {
  value: T
  options: { value: T; label: string }[]
  onChange: (v: T) => void
  leading?: ReactNode
  hint?: ReactNode
  label: string
}
export function Select<T extends string>({ value, options, onChange, leading, hint, label }: SelectProps<T>) {
  return (
    <div className="relative flex h-10 items-center gap-2 rounded-lg border border-line-strong bg-surface px-3 focus-within:border-accent">
      {leading}
      <select
        aria-label={label}
        value={value}
        onChange={(e) => onChange(e.target.value as T)}
        className="min-w-0 flex-1 appearance-none bg-transparent text-13 font-medium text-fg outline-none"
      >
        {options.map((o) => (
          <option key={o.value} value={o.value}>
            {o.label}
          </option>
        ))}
      </select>
      {hint && <span className="font-mono text-11 text-fg-secondary">{hint}</span>}
      <ChevronDown size={16} className="pointer-events-none text-fg-muted" />
    </div>
  )
}
