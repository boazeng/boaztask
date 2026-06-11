import { useEffect } from 'react'
import { HiExclamation } from 'react-icons/hi'

export default function ConfirmDialog({
  open,
  title = 'אישור פעולה',
  message,
  confirmText = 'מחק',
  cancelText = 'ביטול',
  onConfirm,
  onCancel,
}) {
  useEffect(() => {
    if (!open) return
    const onKey = (e) => {
      if (e.key === 'Escape') onCancel?.()
      if (e.key === 'Enter') onConfirm?.()
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [open, onConfirm, onCancel])

  if (!open) return null

  return (
    <div
      className="fixed inset-0 bg-warm-ink/40 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-cream-white rounded-2xl border border-warm-border shadow-2xl w-full max-w-sm p-6 dialog-pop"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-[rgba(214,74,46,0.12)] flex items-center justify-center">
            <HiExclamation size={30} className="text-accent" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-primary">{title}</h3>
            {message && <p className="text-sm text-taupe">{message}</p>}
          </div>
          <div className="flex gap-3 w-full pt-2">
            <button
              onClick={onCancel}
              className="tact-btn tact-btn-ghost flex-1"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              autoFocus
              className="tact-btn tact-btn-danger flex-1"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
