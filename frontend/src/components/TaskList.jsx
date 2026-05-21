import { HiPencil, HiTrash, HiEye, HiArrowSmUp, HiArrowSmDown, HiX } from 'react-icons/hi'

const urgencyBadge = {
  'דחוף': 'bg-red-500/20 text-red-400 border-red-500/30',
  'גבוה': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'בינוני': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'נמוך': 'bg-green-500/20 text-green-400 border-green-500/30',
}

const statusBadge = {
  'חדש': 'bg-purple-500/20 text-purple-400',
  'בטיפול': 'bg-yellow-500/20 text-yellow-400',
  'הושלם': 'bg-green-500/20 text-green-400',
  'בוטל': 'bg-gray-500/20 text-gray-400',
}

const COLUMNS = [
  { key: 'immediate', label: 'מיידי', align: 'center', sortable: true },
  { key: 'subject', label: 'נושא', sortable: true },
  { key: 'sub_subject', label: 'תת נושא', sortable: true },
  { key: 'description', label: 'תיאור', sortable: false },
  { key: 'urgency', label: 'דחיפות', sortable: true },
  { key: 'status', label: 'סטטוס', sortable: true },
  { key: 'category1', label: 'אחראי', sortable: true },
  { key: 'category2', label: 'קטגוריה 2', sortable: true },
  { key: 'created_at', label: 'תאריך', sortable: true },
]

const FIELD_LABEL = Object.fromEntries(COLUMNS.map(c => [c.key, c.label]))

function SortIndicator({ sort, field }) {
  const idx = sort.findIndex(s => s.field === field)
  if (idx < 0) return null
  const { dir } = sort[idx]
  const Icon = dir === 'asc' ? HiArrowSmUp : HiArrowSmDown
  return (
    <span className="inline-flex items-center text-blue-400">
      <Icon size={16} />
      {sort.length > 1 && <span className="text-[10px] mr-0.5">{idx + 1}</span>}
    </span>
  )
}

export default function TaskList({ tasks, onEdit, onDelete, onView, onToggleImmediate, sort = [], onSort, onClearSort }) {
  if (tasks.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
        <p className="text-gray-500 text-lg">לא נמצאו מטלות</p>
        <p className="text-gray-600 text-sm mt-2">צור מטלה חדשה כדי להתחיל</p>
      </div>
    )
  }

  const handleHeaderClick = (e, key, sortable) => {
    if (!sortable) return
    onSort?.(key, e.shiftKey)
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {sort.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-2 bg-gray-800/40 border-b border-gray-800 text-sm">
          <span className="text-gray-400">מיין לפי:</span>
          {sort.map((s, i) => (
            <button
              key={s.field}
              onClick={() => onSort?.(s.field, true)}
              className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full bg-blue-500/10 border border-blue-500/30 text-blue-300 hover:bg-blue-500/20 transition-colors"
              title="לחיצה להפיכת כיוון"
            >
              {sort.length > 1 && <span className="text-[10px] opacity-70">{i + 1}</span>}
              <span>{FIELD_LABEL[s.field] || s.field}</span>
              {s.dir === 'asc' ? <HiArrowSmUp size={14} /> : <HiArrowSmDown size={14} />}
            </button>
          ))}
          <button
            onClick={onClearSort}
            className="inline-flex items-center gap-1 text-gray-400 hover:text-white transition-colors mr-1"
          >
            <HiX size={14} /> נקה
          </button>
          <span className="text-gray-500 text-xs mr-auto hidden sm:inline">טיפ: Shift+לחיצה על כותרת מוסיפה רמת מיון נוספת</span>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800 text-gray-300 text-lg">
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  onClick={(e) => handleHeaderClick(e, col.key, col.sortable)}
                  className={`px-4 py-3 font-bold select-none ${col.align === 'center' ? 'text-center' : 'text-right'} ${col.sortable ? 'cursor-pointer hover:bg-gray-800/50 transition-colors' : ''}`}
                  title={col.sortable ? 'לחיצה למיון · Shift+לחיצה להוספת רמה' : undefined}
                >
                  <span className={`inline-flex items-center gap-1 ${col.align === 'center' ? 'justify-center' : ''}`}>
                    {col.label}
                    <SortIndicator sort={sort} field={col.key} />
                  </span>
                </th>
              ))}
              <th className="text-center px-4 py-3 font-bold">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => (
              <tr key={task.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors text-lg font-bold">
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={task.immediate || false}
                    onChange={(e) => onToggleImmediate?.(task.id, e.target.checked)}
                    className="w-5 h-5 bg-gray-800 border-2 border-gray-600 rounded text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  />
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => onView(task)} className="text-white hover:text-blue-400 font-bold transition-colors text-right">
                    {task.subject}
                  </button>
                </td>
                <td className="px-4 py-3 text-gray-300">{task.sub_subject || '-'}</td>
                <td className="px-4 py-3 text-gray-300 min-w-[300px] max-w-[400px]">
                  <span className="line-clamp-2">{task.description || '-'}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-lg font-bold px-3 py-1.5 rounded-full border ${urgencyBadge[task.urgency] || ''}`}>
                    {task.urgency}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-lg font-bold px-3 py-1.5 rounded-full ${statusBadge[task.status] || ''}`}>
                    {task.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-300">{task.category1 || '-'}</td>
                <td className="px-4 py-3 text-gray-300">{task.category2 || '-'}</td>
                <td className="px-4 py-3 text-gray-300 whitespace-nowrap">
                  {task.created_at ? new Date(task.created_at).toLocaleDateString('he-IL') : '-'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => onView(task)} className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors" title="צפייה">
                      <HiEye size={20} />
                    </button>
                    <button onClick={() => onEdit(task)} className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition-colors" title="עריכה">
                      <HiPencil size={20} />
                    </button>
                    <button onClick={() => onDelete(task.id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="מחיקה">
                      <HiTrash size={20} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-gray-800">
        {tasks.map(task => (
          <div key={task.id} className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-1">
                <input
                  type="checkbox"
                  checked={task.immediate || false}
                  onChange={(e) => onToggleImmediate?.(task.id, e.target.checked)}
                  className="w-5 h-5 bg-gray-800 border-2 border-gray-600 rounded text-blue-600 focus:ring-2 focus:ring-blue-500 cursor-pointer"
                  title="מיידי"
                />
                <button onClick={() => onView(task)} className="text-white font-medium hover:text-blue-400 text-right">
                  {task.subject}
                </button>
              </div>
              <span className={`text-xs px-2 py-1 rounded-full border ${urgencyBadge[task.urgency] || ''}`}>
                {task.urgency}
              </span>
            </div>
            {task.sub_subject && <p className="text-gray-500 text-sm">{task.sub_subject}</p>}
            <div className="flex items-center justify-between">
              <span className={`text-xs px-2 py-1 rounded-full ${statusBadge[task.status] || ''}`}>
                {task.status}
              </span>
              <div className="flex gap-1">
                <button onClick={() => onEdit(task)} className="p-1.5 text-gray-400 hover:text-yellow-400 rounded-lg">
                  <HiPencil size={16} />
                </button>
                <button onClick={() => onDelete(task.id)} className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg">
                  <HiTrash size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
