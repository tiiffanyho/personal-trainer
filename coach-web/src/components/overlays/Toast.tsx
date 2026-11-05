import { useEffect } from 'react'
import { X } from 'lucide-react'
import { useStudio } from '../../store/useStudio'

export function Toast() {
  const toast = useStudio((s) => s.toast)
  const { undo, dismissToast } = useStudio.getState()

  useEffect(() => {
    if (!toast) return
    const t = setTimeout(dismissToast, toast.undo ? 6000 : 3000)
    return () => clearTimeout(t)
  }, [toast, dismissToast])

  if (!toast) return null
  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed bottom-20 left-1/2 z-50 flex max-w-[calc(100vw-32px)] -translate-x-1/2 items-center gap-3 md:bottom-6 rounded-lg border border-line-strong bg-surface py-2 pl-4 pr-2 text-13 shadow-xl shadow-black/30"
    >
      <span>{toast.message}</span>
      {toast.undo && (
        <button type="button" onClick={undo} className="rounded px-2 py-1 font-semibold text-accent-strong hover:bg-raised">
          Undo
        </button>
      )}
      <button type="button" aria-label="Dismiss" onClick={dismissToast} className="rounded p-1 text-fg-muted hover:bg-raised hover:text-fg">
        <X size={14} />
      </button>
    </div>
  )
}
