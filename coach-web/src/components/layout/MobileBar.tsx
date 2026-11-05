import type { ReactNode } from 'react'
import { Library, PanelRight, Plus } from 'lucide-react'
import { useStudio } from '../../store/useStudio'

function BarButton({ label, icon, onClick, primary }: { label: string; icon: ReactNode; onClick: () => void; primary?: boolean }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className="flex flex-1 flex-col items-center justify-center gap-0.5 py-1.5 text-11 font-medium text-fg-secondary active:text-fg"
    >
      <span
        className={
          primary
            ? 'flex size-9 items-center justify-center rounded-full bg-accent text-accent-fg shadow-lg shadow-accent/30'
            : 'flex size-6 items-center justify-center'
        }
      >
        {icon}
      </span>
      {!primary && label}
      {primary && <span className="sr-only">{label}</span>}
    </button>
  )
}

/** Phone-only bottom toolbar: library drawer, Quick Insert, inspector drawer */
export function MobileBar() {
  const { setLibraryOpen, setQuickInsertOpen, setInspectorOpen } = useStudio.getState()
  const hasSelection = useStudio((s) => s.selectedEntryId !== null || s.selectedLibraryId !== null)
  return (
    <nav
      aria-label="Workspace"
      className="flex shrink-0 items-center border-t border-line bg-surface px-2 pb-[env(safe-area-inset-bottom)] md:hidden"
    >
      <BarButton label="Library" icon={<Library size={18} />} onClick={() => setLibraryOpen(true)} />
      <BarButton label="Add exercise" icon={<Plus size={20} />} onClick={() => setQuickInsertOpen(true)} primary />
      <BarButton
        label={hasSelection ? 'Details' : 'Details'}
        icon={
          <span className="relative">
            <PanelRight size={18} />
            {hasSelection && <span className="absolute -right-1 -top-1 size-2 rounded-full bg-accent" />}
          </span>
        }
        onClick={() => setInspectorOpen(true)}
      />
    </nav>
  )
}
