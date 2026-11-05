import { createContext, type HTMLAttributes } from 'react'

/** Provided by sortable wrappers so the grip icon inside a row becomes its drag handle */
export interface HandleProps {
  label: string
  ref: (el: HTMLElement | null) => void
  attributes: HTMLAttributes<HTMLElement>
  listeners: HTMLAttributes<HTMLElement> | undefined
}
export const HandleContext = createContext<HandleProps | null>(null)

export interface EntryDragData {
  type: 'entry'
  entryId: string
  tierId: string
}

export const entryDndId = (id: string) => `entry:${id}`
export const tierDndId = (id: string) => `tier:${id}`
