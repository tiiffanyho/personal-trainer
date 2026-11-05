import { create } from 'zustand'
import { createJSONStorage, persist } from 'zustand/middleware'
import { initialWeeks, programMeta, type ProgramMeta, type Week } from '../data/program'
import {
  cloneWeek,
  makeEntry,
  makeTier,
  modeForTier,
  templateWeek,
  uid,
  type Day,
  type Entry,
  type EntryMode,
  type SetRow,
  type Tier,
} from '../data/session'
import { exerciseById } from '../data/exercises'

export type Theme = 'dark' | 'light'

function readTheme(): Theme {
  const t = document.documentElement.dataset.theme
  return t === 'light' ? 'light' : 'dark'
}

interface StudioState {
  theme: Theme
  toggleTheme: () => void

  meta: ProgramMeta
  weeks: Week[]
  activeWeekId: string
  setActiveWeek: (id: string) => void
  addWeek: () => void

  savedAt: number
  publish: () => void

  /* ----- plan ----- */
  plan: Record<string, Day[]>
  activeDayId: string
  setActiveDay: (id: string) => void
  selectedEntryId: string | null
  selectEntry: (id: string | null) => void
  /** Tier that library "+" adds into — the tier of the last selected row */
  targetTierId: string | null

  updateDay: (patch: Partial<Pick<Day, 'title' | 'subtitle'>>) => void
  setAllCollapsed: (collapsed: boolean) => void

  addTier: (exerciseId?: string) => void
  updateTier: (tierId: string, patch: Partial<Pick<Tier, 'title' | 'collapsed' | 'superset'>>) => void
  setTierUnilateral: (tierId: string, on: boolean) => void
  removeTier: (tierId: string) => void

  /** Add a library exercise to a tier (default: selected entry's tier, else last tier) */
  addExercise: (exerciseId: string, tierId?: string) => void
  updateEntry: (entryId: string, fn: (e: Entry) => void) => void
  setEntryMode: (entryId: string, mode: EntryMode) => void
  duplicateEntry: (entryId: string) => void
  removeEntry: (entryId: string) => void
  /** Replace the exercise with its regression / progression; the chain shifts with it */
  moveAlongChain: (entryId: string, dir: 'regress' | 'progress') => void
  addSet: (entryId: string) => void
  removeSet: (entryId: string, setId: string) => void
  updateSet: (entryId: string, setId: string, patch: Partial<Omit<SetRow, 'id'>>) => void

  /** Drag-to-reorder */
  moveTier: (tierId: string, toIndex: number) => void
  moveEntry: (entryId: string, toTierId: string, toIndex: number) => void
  /** Insert a library exercise at a position (drop onto a row) */
  insertExercise: (exerciseId: string, tierId: string, index: number) => void

  /* ----- undo / toast ----- */
  past: Record<string, Day[]>[]
  future: Record<string, Day[]>[]
  undo: () => void
  redo: () => void
  toast: { id: number; message: string; undo: boolean } | null
  showToast: (message: string, undo?: boolean) => void
  dismissToast: () => void
  resetDemo: () => void

  /* ----- overlays ----- */
  quickInsertOpen: boolean
  setQuickInsertOpen: (open: boolean) => void

  /* ----- library ----- */
  selectedLibraryId: string | null
  selectLibraryExercise: (id: string | null) => void
  libraryOpen: boolean
  setLibraryOpen: (open: boolean) => void
  inspectorOpen: boolean
  setInspectorOpen: (open: boolean) => void
  searchFocusTick: number
  focusLibrarySearch: () => void
}

function initialPlan(): Record<string, Day[]> {
  return {
    w1: cloneWeek(templateWeek()),
    w2: templateWeek(), // keeps the stable demo id for the selected B1 row
    w3: cloneWeek(templateWeek()),
    w4: cloneWeek(templateWeek()),
  }
}

function findEntry(days: Day[], entryId: string) {
  for (const d of days)
    for (const t of d.tiers) {
      const i = t.entries.findIndex((e) => e.id === entryId)
      if (i >= 0) return { day: d, tier: t, entry: t.entries[i], index: i }
    }
  return null
}

/** Convert an entry between row styles, carrying over what maps cleanly */
function convertEntry(e: Entry, mode: EntryMode) {
  if (e.mode === mode) return
  const first = e.sets[0]
  if (mode === 'unilateral') {
    const base =
      e.mode === 'sets'
        ? { sets: String(e.sets.length), reps: first?.reps ?? '8', load: '', rpe: first?.rpe ?? '' }
        : { sets: e.rx.sets, reps: e.rx.reps, load: '', rpe: '' }
    e.sides = {
      L: { ...base, ...(e.sides.L.load ? { load: e.sides.L.load } : {}) },
      R: { ...base, ...(e.sides.R.load ? { load: e.sides.R.load } : {}) },
    }
  } else if (mode === 'sets') {
    const src = e.mode === 'unilateral' ? e.sides.L : { sets: e.rx.sets, reps: e.rx.reps, rpe: '' }
    const n = Math.max(1, Math.min(10, parseInt(src.sets) || 3))
    const rest = e.mode === 'compact' ? (e.rx.rest ?? '90s') : (first?.rest ?? '90s')
    const tempo = e.mode === 'compact' ? (e.rx.tempo ?? '') : (first?.tempo ?? '')
    e.sets = Array.from({ length: n }, () => ({ id: uid(), target: '', reps: src.reps, tempo, rpe: src.rpe, rest }))
  } else {
    const src = e.mode === 'unilateral' ? e.sides.L : { sets: String(e.sets.length), reps: first?.reps ?? '8' }
    e.rx = {
      ...e.rx,
      sets: src.sets,
      reps: src.reps,
      tempo: first?.tempo || e.rx.tempo,
      rest: first?.rest || e.rx.rest,
    }
  }
  e.mode = mode
}

export const useStudio = create<StudioState>()(
  persist(
    (set, get) => {
      /** Immutable edit of the active week's days; marks the week as an unpublished draft */
      let lastEditAt = 0
      const edit = (fn: (days: Day[]) => void, opts: { coalesce?: boolean } = {}) =>
        set((s) => {
          const days = structuredClone(s.plan[s.activeWeekId] ?? [])
          fn(days)
          const now = Date.now()
          // keystrokes within 800ms collapse into one undo step
          const coalesce = opts.coalesce === true && now - lastEditAt < 800
          lastEditAt = now
          return {
            past: coalesce ? s.past : [...s.past.slice(-49), s.plan],
            future: [],
            plan: { ...s.plan, [s.activeWeekId]: days },
            savedAt: Date.now(),
            weeks: s.weeks.map((w) =>
              w.id === s.activeWeekId && w.status !== 'draft' ? { ...w, status: 'draft' } : w,
            ),
          }
        })

      const activeDay = (days: Day[]) => days.find((d) => d.id === get().activeDayId) ?? days[0]

      const withEntry = (
        entryId: string,
        fn: (hit: NonNullable<ReturnType<typeof findEntry>>) => void,
        opts?: { coalesce?: boolean },
      ) =>
        edit((days) => {
          const hit = findEntry(days, entryId)
          if (hit) fn(hit)
        }, opts)
      const typing = { coalesce: true }

      return {
        theme: readTheme(),
        toggleTheme: () => {
          const next: Theme = get().theme === 'dark' ? 'light' : 'dark'
          document.documentElement.dataset.theme = next
          try {
            localStorage.setItem('coach-theme', next)
          } catch {
            /* storage unavailable — theme still applies for this session */
          }
          set({ theme: next })
        },

        meta: programMeta,
        weeks: initialWeeks,
        activeWeekId: 'w2',
        setActiveWeek: (id) => set({ activeWeekId: id, selectedEntryId: null, targetTierId: null }),
        addWeek: () =>
          set((s) => {
            const n = s.weeks.length + 1
            const week: Week = { id: `w${n}-${uid()}`, label: `Week ${n}`, status: 'planned' }
            const prev = s.plan[s.weeks[s.weeks.length - 1]?.id] ?? templateWeek()
            return {
              weeks: [...s.weeks, week],
              plan: { ...s.plan, [week.id]: cloneWeek(prev) },
              activeWeekId: week.id,
              selectedEntryId: null,
            }
          }),

        savedAt: Date.now() - 2 * 60_000,
        publish: () =>
          set((s) => ({
            weeks: s.weeks.map((w) => (w.id === s.activeWeekId ? { ...w, status: 'published' } : w)),
            savedAt: Date.now(),
          })),

        /* ----- plan ----- */
        plan: initialPlan(),
        activeDayId: 'd1',
        setActiveDay: (id) => set({ activeDayId: id, selectedEntryId: null, targetTierId: null }),
        selectedEntryId: 'b1-rfess',
        selectEntry: (id) =>
          set((s) => {
            if (!id) return { selectedEntryId: null }
            const hit = findEntry(s.plan[s.activeWeekId] ?? [], id)
            return { selectedEntryId: id, selectedLibraryId: null, targetTierId: hit?.tier.id ?? s.targetTierId }
          }),
        targetTierId: null,

        updateDay: (patch) => edit((days) => Object.assign(activeDay(days), patch), typing),
        setAllCollapsed: (collapsed) => edit((days) => activeDay(days).tiers.forEach((t) => (t.collapsed = collapsed))),

        addTier: (exerciseId) => {
          const tier = makeTier('New tier')
          if (exerciseId) tier.entries.push(makeEntry(exerciseId, 'sets'))
          edit((days) => activeDay(days).tiers.push(tier))
          if (exerciseId) get().selectEntry(tier.entries[0].id)
        },
        updateTier: (tierId, patch) =>
          edit(
            (days) => {
              const t = activeDay(days).tiers.find((x) => x.id === tierId)
              if (t) Object.assign(t, patch)
            },
            'title' in patch ? typing : undefined,
          ),
        setTierUnilateral: (tierId, on) =>
          edit((days) => {
            const t = activeDay(days).tiers.find((x) => x.id === tierId)
            if (!t) return
            t.unilateral = on
            if (t.layout === 'stack') t.entries.forEach((e) => convertEntry(e, on ? 'unilateral' : 'sets'))
          }),
        removeTier: (tierId) => {
          const name = activeDay(get().plan[get().activeWeekId] ?? [])?.tiers.find((t) => t.id === tierId)?.title
          edit((days) => {
            const d = activeDay(days)
            d.tiers = d.tiers.filter((t) => t.id !== tierId)
          })
          get().showToast(`Removed tier “${name ?? ''}”`, true)
        },

        addExercise: (exerciseId, tierId) => {
          if (!exerciseById.has(exerciseId)) return
          const days = get().plan[get().activeWeekId] ?? []
          const day = activeDay(days)
          const remembered = day?.tiers.find((t) => t.id === get().targetTierId)
          const targetId = tierId ?? remembered?.id ?? day?.tiers[day.tiers.length - 1]?.id
          if (!targetId) return get().addTier(exerciseId)

          let newId = ''
          edit((ds) => {
            const t = activeDay(ds).tiers.find((x) => x.id === targetId)
            if (!t) return
            const entry = makeEntry(exerciseId, modeForTier(t), {
              involved: t.entries.find((x) => x.involved)?.involved, // same athlete limb as sibling rows
            })
            newId = entry.id
            t.entries.push(entry)
            t.collapsed = false
            if (t.layout === 'stack' && t.entries.length > 1 && !t.unilateral) t.superset = true
          })
          if (newId) get().selectEntry(newId)
        },
        updateEntry: (entryId, fn) => withEntry(entryId, ({ entry }) => fn(entry), typing),
        setEntryMode: (entryId, mode) => withEntry(entryId, ({ entry }) => convertEntry(entry, mode)),
        duplicateEntry: (entryId) => {
          const copyId = uid()
          withEntry(entryId, ({ tier, entry, index }) => {
            const copy = structuredClone(entry)
            copy.id = copyId
            copy.sets = copy.sets.map((s) => ({ ...s, id: uid() }))
            tier.entries.splice(index + 1, 0, copy)
          })
          get().selectEntry(copyId)
        },
        removeEntry: (entryId) => {
          withEntry(entryId, ({ tier, index }) => {
            tier.entries.splice(index, 1)
            if (tier.entries.length < 2) tier.superset = false
          })
          if (get().selectedEntryId === entryId) set({ selectedEntryId: null })
          get().showToast('Removed exercise', true)
        },
        moveAlongChain: (entryId, dir) =>
          withEntry(entryId, ({ entry }) => {
            const cur = exerciseById.get(entry.exerciseId)
            const regress = entry.linkedRegressionId ?? cur?.regressionId
            const progress = entry.progressionId ?? cur?.progressionId
            const nextId = dir === 'regress' ? regress : progress
            const next = nextId ? exerciseById.get(nextId) : undefined
            if (!next) return
            const oldId = entry.exerciseId
            entry.exerciseId = next.id
            if (dir === 'regress') {
              entry.progressionId = oldId
              entry.linkedRegressionId = next.regressionId
            } else {
              entry.linkedRegressionId = oldId
              entry.progressionId = next.progressionId
            }
          }),
        addSet: (entryId) =>
          withEntry(entryId, ({ entry }) => {
            const last = entry.sets[entry.sets.length - 1]
            entry.sets.push(
              last ? { ...last, id: uid() } : { id: uid(), target: '', reps: '8', tempo: '', rpe: '', rest: '90s' },
            )
          }),
        removeSet: (entryId, setId) =>
          withEntry(entryId, ({ entry }) => {
            if (entry.sets.length > 1) entry.sets = entry.sets.filter((s) => s.id !== setId)
          }),
        updateSet: (entryId, setId, patch) =>
          withEntry(
            entryId,
            ({ entry }) => {
              const s = entry.sets.find((x) => x.id === setId)
              if (s) Object.assign(s, patch)
            },
            typing,
          ),

        moveTier: (tierId, toIndex) =>
          edit((days) => {
            const d = activeDay(days)
            const from = d.tiers.findIndex((t) => t.id === tierId)
            if (from < 0 || from === toIndex) return
            const [t] = d.tiers.splice(from, 1)
            d.tiers.splice(toIndex, 0, t)
          }),
        moveEntry: (entryId, toTierId, toIndex) =>
          edit((days) => {
            const d = activeDay(days)
            const hit = findEntry([d], entryId)
            const target = d.tiers.find((t) => t.id === toTierId)
            if (!hit || !target) return
            if (hit.tier.id === target.id && hit.index === toIndex) return
            hit.tier.entries.splice(hit.index, 1)
            target.entries.splice(Math.min(toIndex, target.entries.length), 0, hit.entry)
            if (hit.tier.id !== target.id) {
              // adopt the row style of the destination tier
              if (target.layout === 'cards') convertEntry(hit.entry, 'compact')
              else if (target.unilateral) convertEntry(hit.entry, 'unilateral')
              else if (hit.entry.mode === 'unilateral' || hit.tier.layout === 'cards') convertEntry(hit.entry, 'sets')
              if (target.unilateral && !hit.entry.involved)
                hit.entry.involved = target.entries.find((x) => x.involved)?.involved
              if (hit.tier.entries.length < 2) hit.tier.superset = false
            }
            target.collapsed = false
          }),
        insertExercise: (exerciseId, tierId, index) => {
          let newId = ''
          edit((days) => {
            const t = activeDay(days).tiers.find((x) => x.id === tierId)
            if (!t) return
            const entry = makeEntry(exerciseId, modeForTier(t), {
              involved: t.entries.find((x) => x.involved)?.involved,
            })
            newId = entry.id
            t.entries.splice(index, 0, entry)
          })
          if (newId) get().selectEntry(newId)
        },

        past: [],
        future: [],
        undo: () =>
          set((s) => {
            const prev = s.past[s.past.length - 1]
            if (!prev) return {}
            return {
              plan: prev,
              past: s.past.slice(0, -1),
              future: [s.plan, ...s.future],
              savedAt: Date.now(),
              toast: null,
            }
          }),
        redo: () =>
          set((s) => {
            const next = s.future[0]
            if (!next) return {}
            return { plan: next, future: s.future.slice(1), past: [...s.past, s.plan], savedAt: Date.now() }
          }),
        toast: null,
        showToast: (message, undo = false) => set({ toast: { id: Date.now(), message, undo } }),
        dismissToast: () => set({ toast: null }),
        resetDemo: () => {
        set((s) => ({
          weeks: initialWeeks,
          plan: initialPlan(),
          activeWeekId: 'w2',
          activeDayId: 'd1',
          selectedEntryId: 'b1-rfess',
          targetTierId: null,
          past: [...s.past, s.plan],
          future: [],
          savedAt: Date.now(),
        }))
        get().showToast('Demo program restored', true)
      },

        quickInsertOpen: false,
        setQuickInsertOpen: (open) => set({ quickInsertOpen: open }),

        /* ----- library ----- */
        selectedLibraryId: null,
        selectLibraryExercise: (id) =>
          set(id ? { selectedLibraryId: id, selectedEntryId: null } : { selectedLibraryId: null }),
        libraryOpen: false,
        setLibraryOpen: (open) => set({ libraryOpen: open }),
        inspectorOpen: false,
        setInspectorOpen: (open) => set({ inspectorOpen: open }),
        searchFocusTick: 0,
        focusLibrarySearch: () => set((s) => ({ libraryOpen: true, searchFocusTick: s.searchFocusTick + 1 })),
      }
    },
    {
      name: 'coach-studio',
      version: 1,
      storage: createJSONStorage(() => localStorage),
      // only the program itself is saved; UI state (drawers, toasts, history) is not
      partialize: (s) => ({
        weeks: s.weeks,
        plan: s.plan,
        activeWeekId: s.activeWeekId,
        activeDayId: s.activeDayId,
        savedAt: s.savedAt,
      }),
    },
  ),
)

/** Days of the active week */
export const useActiveDays = () => useStudio((s) => s.plan[s.activeWeekId] ?? [])
export const useActiveDay = () =>
  useStudio((s) => {
    const days = s.plan[s.activeWeekId] ?? []
    return days.find((d) => d.id === s.activeDayId) ?? days[0]
  })
