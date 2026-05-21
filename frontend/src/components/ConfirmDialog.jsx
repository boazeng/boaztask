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
      className="fixed inset-0 bg-black/60 backdrop-blur-sm z-[60] flex items-center justify-center p-4"
      onClick={onCancel}
    >
      <div
        className="bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl w-full max-w-sm p-6 dialog-pop"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
      >
        <div className="flex flex-col items-center text-center gap-4">
          <div className="w-14 h-14 rounded-full bg-red-500/10 flex items-center justify-center">
            <HiExclamation size={32} className="text-red-400" />
          </div>
          <div className="space-y-1">
            <h3 className="text-lg font-bold text-white">{title}</h3>
            {message && <p className="text-sm text-gray-400">{message}</p>}
          </div>
          <div className="flex gap-3 w-full pt-2">
            <button
              onClick={onCancel}
              className="flex-1 px-4 py-2.5 rounded-lg bg-gray-800 hover:bg-gray-700 text-gray-200 font-medium transition-colors"
            >
              {cancelText}
            </button>
            <button
              onClick={onConfirm}
              autoFocus
              className="flex-1 px-4 py-2.5 rounded-lg bg-red-500 hover:bg-red-600 text-white font-medium transition-colors"
            >
              {confirmText}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
