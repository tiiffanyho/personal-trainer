import type { ReactNode } from 'react'
import { cn, type Tone } from './cn'

interface TagProps {
  tone?: Tone
  /** solid = filled pill (library card category tags) */
  solid?: boolean
  mono?: boolean
  icon?: ReactNode
  className?: string
  children: ReactNode
}

const soft: Record<Tone, string> = {
  neutral: 'border-line-strong text-fg-secondary',
  accent: 'tint-accent text-accent-strong',
  caution: 'tint-caution text-caution-text',
  critical: 'tint-critical text-critical-strong',
  info: 'tint-info text-info',
}

const solidStyles: Record<Tone, string> = {
  neutral: 'bg-raised border-line-strong text-fg',
  accent: 'bg-accent border-accent text-accent-fg',
  caution: 'bg-caution border-caution text-caution-fg',
  critical: 'bg-critical border-critical text-critical-fg',
  info: 'bg-info border-info text-info-fg',
}

export function Tag({ tone = 'neutral', solid, mono, icon, className, children }: TagProps) {
  return (
    <span
      className={cn(
        'inline-flex h-[22px] items-center gap-1 rounded-full border px-2 text-11 font-medium whitespace-nowrap',
        mono && 'font-mono',
        solid ? solidStyles[tone] : soft[tone],
        className,
      )}
    >
      {icon}
      {children}
    </span>
  )
}
