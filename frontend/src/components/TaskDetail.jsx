import { HiX, HiPencil, HiCalendar } from 'react-icons/hi'

const URGENCY_COLOR = {
  'דחוף': '#D64A2E',
  'גבוה': '#E07A52',
  'בינוני': '#1F3A5F',
  'נמוך': '#2F8F5B',
}

export default function TaskDetail({ task, onClose, onEdit }) {
  if (!task) return null

  return (
    <div className="fixed inset-0 bg-warm-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4" onClick={onClose}>
      <div className="bg-cream-white rounded-2xl border border-warm-border w-full max-w-lg shadow-2xl" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-warm-border bg-[rgba(31,58,95,0.04)]">
          <div className="flex items-center gap-3 min-w-0">
            <span className="w-3 h-3 rounded-full shrink-0" style={{ background: URGENCY_COLOR[task.urgency] || '#9b9588' }} />
            <h2 className="text-xl font-bold text-primary truncate">{task.subject}</h2>
          </div>
          <div className="flex items-center gap-1 shrink-0">
            <button onClick={() => onEdit(task)} className="p-2 text-taupe hover:text-warn hover:bg-[rgba(201,146,56,0.14)] rounded-lg transition-colors" title="עריכה">
              <HiPencil size={18} />
            </button>
            <button onClick={onClose} className="p-2 text-taupe hover:text-warm-ink transition-colors" title="סגירה">
              <HiX size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {task.sub_subject && (
            <div>
              <label className="tact-field-label">תת נושא</label>
              <p className="text-warm-ink">{task.sub_subject}</p>
            </div>
          )}

          {task.description && (
            <div>
              <label className="tact-field-label">תיאור</label>
              <p className="text-warm-ink whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="tact-field-label">דחיפות</label>
              <p className="text-warm-ink font-semibold">{task.urgency}</p>
            </div>
            <div>
              <label className="tact-field-label">סטטוס</label>
              <p className="text-warm-ink font-semibold">{task.status}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {task.category1 && (
              <div>
                <label className="tact-field-label">אחראי</label>
                <p className="text-warm-ink">{task.category1}</p>
              </div>
            )}
            {task.category2 && (
              <div>
                <label className="tact-field-label">קטגוריה 2</label>
                <p className="text-warm-ink">{task.category2}</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-taupe pt-3 border-t border-warm-border">
            <HiCalendar size={14} />
            <span className="font-en">נוצר: {new Date(task.created_at).toLocaleDateString('he-IL')}</span>
            <span className="mx-1">·</span>
            <span className="font-en">עודכן: {new Date(task.updated_at).toLocaleDateString('he-IL')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
