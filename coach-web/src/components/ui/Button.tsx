import type { ButtonHTMLAttributes, ReactNode } from 'react'
import { cn } from './cn'

type Variant = 'primary' | 'secondary' | 'ghost' | 'dashed'
type Size = 'sm' | 'md' | 'lg'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant
  size?: Size
  icon?: ReactNode
  trailing?: ReactNode
}

const variants: Record<Variant, string> = {
  primary: 'bg-accent text-accent-fg border-accent hover:bg-accent-strong hover:border-accent-strong',
  secondary: 'bg-surface text-fg border-line-strong hover:bg-raised',
  ghost: 'bg-transparent text-fg-secondary border-transparent hover:bg-raised hover:text-fg',
  dashed: 'bg-transparent text-fg-secondary border-dashed border-line-strong hover:text-fg hover:border-fg-muted',
}

const sizes: Record<Size, string> = {
  sm: 'h-7 px-2.5 gap-1.5 text-12',
  md: 'h-9 px-3.5 gap-2 text-13',
  lg: 'h-10 px-4 gap-2 text-14',
}

export function Button({ variant = 'secondary', size = 'md', icon, trailing, className, children, ...rest }: ButtonProps) {
  return (
    <button
      type="button"
      className={cn(
        'inline-flex items-center justify-center rounded-lg border font-semibold whitespace-nowrap transition-colors',
        'disabled:opacity-50 disabled:pointer-events-none',
        variants[variant],
        sizes[size],
        className,
      )}
      {...rest}
    >
      {icon}
      {children}
      {trailing}
    </button>
  )
}

interface IconButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  label: string
  size?: 28 | 32
}

export function IconButton({ label, size = 28, className, children, ...rest }: IconButtonProps) {
  return (
    <button
      type="button"
      aria-label={label}
      title={label}
      className={cn(
        'inline-flex shrink-0 items-center justify-center rounded-md text-fg-secondary hover:bg-raised hover:text-fg transition-colors',
        size === 28 ? 'size-7' : 'size-8 border border-line-strong',
        className,
      )}
      {...rest}
    >
      {children}
    </button>
  )
}
