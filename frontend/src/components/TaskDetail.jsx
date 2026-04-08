import { HiX, HiPencil, HiCalendar } from 'react-icons/hi'

export default function TaskDetail({ task, onClose, onEdit }) {
  if (!task) return null

  const urgencyColor = {
    'דחוף': 'bg-red-500',
    'גבוה': 'bg-orange-500',
    'בינוני': 'bg-yellow-500',
    'נמוך': 'bg-green-500',
  }

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-lg">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <div className="flex items-center gap-3">
            <span className={`w-3 h-3 rounded-full ${urgencyColor[task.urgency]}`} />
            <h2 className="text-xl font-bold text-white">{task.subject}</h2>
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => onEdit(task)} className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition-colors">
              <HiPencil size={20} />
            </button>
            <button onClick={onClose} className="p-2 text-gray-400 hover:text-white transition-colors">
              <HiX size={20} />
            </button>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {task.sub_subject && (
            <div>
              <label className="text-sm text-gray-500">תת נושא</label>
              <p className="text-gray-200">{task.sub_subject}</p>
            </div>
          )}

          {task.description && (
            <div>
              <label className="text-sm text-gray-500">תיאור</label>
              <p className="text-gray-200 whitespace-pre-wrap">{task.description}</p>
            </div>
          )}

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-sm text-gray-500">דחיפות</label>
              <p className="text-gray-200">{task.urgency}</p>
            </div>
            <div>
              <label className="text-sm text-gray-500">סטטוס</label>
              <p className="text-gray-200">{task.status}</p>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            {task.category1 && (
              <div>
                <label className="text-sm text-gray-500">אחראי</label>
                <p className="text-gray-200">{task.category1}</p>
              </div>
            )}
            {task.category2 && (
              <div>
                <label className="text-sm text-gray-500">קטגוריה 2</label>
                <p className="text-gray-200">{task.category2}</p>
              </div>
            )}
          </div>

          <div className="flex items-center gap-2 text-sm text-gray-500 pt-2 border-t border-gray-800">
            <HiCalendar size={14} />
            <span>נוצר: {new Date(task.created_at).toLocaleDateString('he-IL')}</span>
            <span className="mx-2">|</span>
            <span>עודכן: {new Date(task.updated_at).toLocaleDateString('he-IL')}</span>
          </div>
        </div>
      </div>
    </div>
  )
}
