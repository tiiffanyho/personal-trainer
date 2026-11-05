import { useEffect, useState } from 'react'
import { ArrowRight, ArrowUp, Check, Command, Download, Dumbbell, Library, Moon, PanelRight, Plus, Send, Sun } from 'lucide-react'
import { Button, IconButton, Kbd, SegmentedTabs, Tag } from '../ui'
import { useStudio } from '../../store/useStudio'
import type { Week } from '../../data/program'

function useRelativeTime(ts: number) {
  const [now, setNow] = useState(() => Date.now())
  useEffect(() => {
    const id = setInterval(() => setNow(Date.now()), 30_000)
    return () => clearInterval(id)
  }, [])
  const min = Math.max(0, Math.round((now - ts) / 60_000))
  return min === 0 ? 'just now' : `${min} min ago`
}

function ProgramHeader() {
  const { meta, weeks, savedAt, publish, theme, toggleTheme, setQuickInsertOpen, setLibraryOpen, setInspectorOpen } = useStudio()
  const saved = useRelativeTime(savedAt)
  const draft = weeks.find((w) => w.status === 'draft')
  const published = [...weeks].reverse().find((w) => w.status === 'published')

  return (
    <div className="flex h-[60px] items-center justify-between gap-6 px-6">
      <div className="flex min-w-0 items-center gap-3">
        <div className="flex size-8 shrink-0 items-center justify-center rounded-lg bg-accent text-accent-fg">
          <Dumbbell size={18} />
        </div>
        <div className="min-w-0">
          <nav aria-label="Breadcrumb" className="truncate text-11 text-fg-muted">
            {meta.breadcrumb.join(' / ')}
          </nav>
          <h1 className="truncate text-16 font-semibold tracking-[-0.3px]">{meta.title}</h1>
        </div>
        <div className="ml-3 hidden shrink-0 items-center gap-1.5 lg:flex">
          {draft && (
            <Tag tone="caution" icon={<span className="size-1.5 rounded-full bg-caution" />}>
              Draft · Wk {draft.label.replace('Week ', '')}
            </Tag>
          )}
          {published && (
            <Tag tone="accent" icon={<Check size={11} strokeWidth={3} />}>
              Published · Wk {published.label.replace('Week ', '')}
            </Tag>
          )}
        </div>
      </div>

      <div className="flex shrink-0 items-center gap-2">
        <span className="hidden text-12 text-fg-muted xl:inline">Saved {saved}</span>
        <IconButton label={theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode'} size={32} onClick={toggleTheme}>
          {theme === 'dark' ? <Sun size={16} /> : <Moon size={16} />}
        </IconButton>
        <IconButton label="Open exercise library" size={32} className="lg:hidden" onClick={() => setLibraryOpen(true)}>
          <Library size={16} />
        </IconButton>
        <IconButton label="Open inspector" size={32} className="xl:hidden" onClick={() => setInspectorOpen(true)}>
          <PanelRight size={16} />
        </IconButton>
        <Button icon={<Command size={16} />} trailing={<Kbd>⌘K</Kbd>} onClick={() => setQuickInsertOpen(true)}>
          Quick Insert
        </Button>
        <Button icon={<Download size={16} />} className="hidden md:inline-flex">
          Export PDF
        </Button>
        <Button variant="primary" icon={<Send size={16} />} onClick={publish}>
          Publish
        </Button>
      </div>
    </div>
  )
}

function WeekLabel({ week, active }: { week: Week; active: boolean }) {
  return (
    <>
      {week.status === 'published' && <Check size={12} className="text-accent-strong" strokeWidth={3} />}
      {active && week.status !== 'published' && <span className="size-1.5 rounded-full bg-accent" />}
      <span>{week.label}</span>
      {active && <span className="text-11 font-medium text-accent-strong">Active</span>}
      {!active && week.note && <span className="text-11 font-medium text-fg-muted">{week.note}</span>}
    </>
  )
}

function MicrocycleBar() {
  const { weeks, activeWeekId, setActiveWeek, addWeek, meta } = useStudio()

  return (
    <div className="flex h-12 items-center justify-between gap-6 px-6">
      <div className="flex min-w-0 items-center gap-3">
        <span className="eyebrow">Microcycle</span>
        <SegmentedTabs
          label="Program weeks"
          value={activeWeekId}
          onChange={setActiveWeek}
          items={weeks.map((w) => ({ id: w.id, label: <WeekLabel week={w} active={w.id === activeWeekId} /> }))}
          trailing={
            <IconButton label="Add week" onClick={addWeek}>
              <Plus size={14} />
            </IconButton>
          }
          className="overflow-x-auto"
        />
      </div>

      <dl className="hidden shrink-0 items-center gap-5 text-12 xl:flex">
        <Meta label="Phase">
          {meta.phase.from} <ArrowRight size={12} className="inline align-[-1px]" /> {meta.phase.to}
        </Meta>
        <Meta label="Athlete">{meta.athleteNote}</Meta>
        <Meta label="Sessions">{meta.sessionsPerWeek} / week</Meta>
        <Meta label="Week load">
          <span className="text-accent-strong">
            <ArrowUp size={12} className="inline align-[-1px]" /> {meta.weekLoadDeltaPct}% vs Wk 1
          </span>
        </Meta>
      </dl>
    </div>
  )
}

function Meta({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center gap-1.5">
      <dt className="text-fg-muted">{label}</dt>
      <dd className="font-medium text-fg">{children}</dd>
    </div>
  )
}

export function TopBar() {
  return (
    <header className="shrink-0 border-b border-line bg-canvas">
      <ProgramHeader />
      <MicrocycleBar />
    </header>
  )
}
