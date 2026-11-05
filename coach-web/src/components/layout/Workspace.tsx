import { useEffect, type ReactNode } from 'react'
import { cn } from '../ui'
import { useStudio } from '../../store/useStudio'

interface WorkspaceProps {
  library: ReactNode
  canvas: ReactNode
  inspector: ReactNode
}

/**
 * Three-pane workspace from Figma: 280px library · flexible canvas · 400px inspector.
 * < 1024px the library, and < 1280px the inspector, become slide-over drawers.
 */
export function Workspace({ library, canvas, inspector }: WorkspaceProps) {
  const libraryOpen = useStudio((s) => s.libraryOpen)
  const inspectorOpen = useStudio((s) => s.inspectorOpen)
  const { setLibraryOpen, setInspectorOpen } = useStudio.getState()
  const anyOpen = libraryOpen || inspectorOpen
  const closeAll = () => {
    setLibraryOpen(false)
    setInspectorOpen(false)
  }

  useEffect(() => {
    if (!anyOpen) return
    const onKey = (e: KeyboardEvent) => {
      if (e.key !== 'Escape' || (e.target instanceof Element && e.target.closest('[role=menu]'))) return
      useStudio.getState().setLibraryOpen(false)
      useStudio.getState().setInspectorOpen(false)
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [anyOpen])

  return (
    <main className="relative grid min-h-0 flex-1 grid-cols-1 lg:grid-cols-[280px_minmax(0,1fr)] xl:grid-cols-[280px_minmax(0,1fr)_400px]">
      {anyOpen && (
        <div
          aria-hidden
          onClick={closeAll}
          className={cn('fixed inset-0 z-30 bg-black/50', inspectorOpen ? 'xl:hidden' : 'lg:hidden')}
        />
      )}
      <section
        aria-label="Exercise library"
        className={cn(
          'min-h-0 overflow-y-auto border-r border-line bg-canvas px-4 py-5',
          'lg:static lg:block lg:w-auto lg:max-w-none lg:shadow-none',
          libraryOpen ? 'fixed inset-y-0 left-0 z-40 block w-[300px] max-w-[85vw] shadow-2xl' : 'hidden',
        )}
      >
        {library}
      </section>
      <section aria-label="Session builder" className="min-h-0 overflow-y-auto bg-canvas px-4 py-5 sm:px-6">
        {canvas}
      </section>
      <section
        aria-label="Exercise inspector"
        className={cn(
          'min-h-0 overflow-y-auto border-l border-line bg-canvas px-5 py-5',
          'xl:static xl:block xl:w-auto xl:max-w-none xl:shadow-none',
          inspectorOpen ? 'fixed inset-y-0 right-0 z-40 block w-[400px] max-w-[92vw] shadow-2xl' : 'hidden',
        )}
      >
        {inspector}
      </section>
    </main>
  )
}
