import { HiPencil, HiTrash, HiEye, HiArrowSmUp, HiArrowSmDown, HiX } from 'react-icons/hi'

const URGENCY_BADGE = {
  'דחוף': 'bg-[rgba(214,74,46,0.12)] text-accent border border-[rgba(214,74,46,0.25)]',
  'גבוה': 'bg-[rgba(224,122,82,0.14)] text-[#B85A2E] border border-[rgba(224,122,82,0.30)]',
  'בינוני': 'bg-primary-soft text-primary border border-[rgba(31,58,95,0.18)]',
  'נמוך': 'bg-[rgba(47,143,91,0.12)] text-pos border border-[rgba(47,143,91,0.25)]',
}

const STATUS_BADGE_CLASS = {
  'חדש': 'tact-badge-new',
  'בטיפול': 'tact-badge-warn',
  'הושלם': 'tact-badge-pos',
  'בוטל': 'tact-badge-muted',
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
    <span className="inline-flex items-center text-primary">
      <Icon size={16} />
      {sort.length > 1 && <span className="text-[10px] mr-0.5 font-en">{idx + 1}</span>}
    </span>
  )
}

export default function TaskList({ tasks, onEdit, onDelete, onView, onToggleImmediate, sort = [], onSort, onClearSort }) {
  if (tasks.length === 0) {
    return (
      <div className="bg-cream-white rounded-2xl border border-warm-border p-12 text-center shadow-sm">
        <p className="text-taupe text-lg">לא נמצאו מטלות</p>
        <p className="text-taupe/70 text-sm mt-2">צור מטלה חדשה כדי להתחיל</p>
      </div>
    )
  }

  const handleHeaderClick = (e, key, sortable) => {
    if (!sortable) return
    onSort?.(key, e.shiftKey)
  }

  return (
    <div className="bg-cream-white rounded-2xl border border-warm-border overflow-hidden shadow-sm">
      {sort.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-[rgba(31,58,95,0.04)] border-b border-warm-border text-sm">
          <span className="text-taupe">מיין לפי:</span>
          {sort.map((s, i) => (
            <button
              key={s.field}
              onClick={() => onSort?.(s.field, true)}
              className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-cream-white border border-primary/30 text-primary hover:bg-primary-soft transition-colors"
              title="לחיצה להפיכת כיוון"
            >
              {sort.length > 1 && <span className="text-[10px] font-en opacity-70">{i + 1}</span>}
              <span>{FIELD_LABEL[s.field] || s.field}</span>
              {s.dir === 'asc' ? <HiArrowSmUp size={14} /> : <HiArrowSmDown size={14} />}
            </button>
          ))}
          <button
            onClick={onClearSort}
            className="inline-flex items-center gap-1 text-taupe hover:text-accent transition-colors mr-1"
          >
            <HiX size={14} /> נקה
          </button>
          <span className="text-taupe/70 text-xs mr-auto hidden sm:inline">טיפ: Shift+לחיצה על כותרת מוסיפה רמת מיון נוספת</span>
        </div>
      )}

      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-warm-border text-warm-ink bg-[rgba(31,58,95,0.04)]">
              {COLUMNS.map(col => (
                <th
                  key={col.key}
                  onClick={(e) => handleHeaderClick(e, col.key, col.sortable)}
                  className={`px-4 py-3 font-bold select-none text-sm ${col.align === 'center' ? 'text-center' : 'text-right'} ${col.sortable ? 'cursor-pointer hover:bg-primary-soft transition-colors' : ''}`}
                  title={col.sortable ? 'לחיצה למיון · Shift+לחיצה להוספת רמה' : undefined}
                >
                  <span className={`inline-flex items-center gap-1 ${col.align === 'center' ? 'justify-center' : ''}`}>
                    {col.label}
                    <SortIndicator sort={sort} field={col.key} />
                  </span>
                </th>
              ))}
              <th className="text-center px-4 py-3 font-bold text-sm">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => (
              <tr key={task.id} className="border-b border-warm-border/60 hover:bg-cream transition-colors">
                <td className="px-4 py-3 text-center">
                  <input
                    type="checkbox"
                    checked={task.immediate || false}
                    onChange={(e) => onToggleImmediate?.(task.id, e.target.checked)}
                    className="w-5 h-5 rounded border-2 border-warm-border text-primary cursor-pointer focus:ring-2 focus:ring-primary/30"
                  />
                </td>
                <td className="px-4 py-3">
                  <button onClick={() => onView(task)} className="text-warm-ink hover:text-primary font-semibold transition-colors text-right">
                    {task.subject}
                  </button>
                </td>
                <td className="px-4 py-3 text-taupe">{task.sub_subject || '—'}</td>
                <td className="px-4 py-3 text-taupe min-w-[260px] max-w-[400px]">
                  <span className="line-clamp-2">{task.description || '—'}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-xs font-bold px-3 py-1 rounded-full ${URGENCY_BADGE[task.urgency] || ''}`}>
                    {task.urgency}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`tact-badge ${STATUS_BADGE_CLASS[task.status] || 'tact-badge-muted'}`}>
                    {task.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-taupe">{task.category1 || '—'}</td>
                <td className="px-4 py-3 text-taupe">{task.category2 || '—'}</td>
                <td className="px-4 py-3 text-taupe whitespace-nowrap font-en text-sm">
                  {task.created_at ? new Date(task.created_at).toLocaleDateString('he-IL') : '—'}
                </td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => onView(task)} className="p-2 text-taupe hover:text-primary hover:bg-primary-soft rounded-lg transition-colors" title="צפייה">
                      <HiEye size={18} />
                    </button>
                    <button onClick={() => onEdit(task)} className="p-2 text-taupe hover:text-warn hover:bg-[rgba(201,146,56,0.14)] rounded-lg transition-colors" title="עריכה">
                      <HiPencil size={18} />
                    </button>
                    <button onClick={() => onDelete(task.id)} className="p-2 text-taupe hover:text-accent hover:bg-[rgba(214,74,46,0.12)] rounded-lg transition-colors" title="מחיקה">
                      <HiTrash size={18} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-warm-border">
        {tasks.map(task => (
          <div key={task.id} className="p-4 space-y-2">
            <div className="flex items-start justify-between gap-2">
              <div className="flex items-center gap-2 flex-1 min-w-0">
                <input
                  type="checkbox"
                  checked={task.immediate || false}
                  onChange={(e) => onToggleImmediate?.(task.id, e.target.checked)}
                  className="w-5 h-5 rounded border-2 border-warm-border text-primary cursor-pointer focus:ring-2 focus:ring-primary/30"
                  title="מיידי"
                />
                <button onClick={() => onView(task)} className="text-warm-ink font-semibold hover:text-primary text-right truncate">
                  {task.subject}
                </button>
              </div>
              <span className={`text-xs font-bold px-2 py-1 rounded-full shrink-0 ${URGENCY_BADGE[task.urgency] || ''}`}>
                {task.urgency}
              </span>
            </div>
            {task.sub_subject && <p className="text-taupe text-sm">{task.sub_subject}</p>}
            <div className="flex items-center justify-between">
              <span className={`tact-badge ${STATUS_BADGE_CLASS[task.status] || 'tact-badge-muted'}`}>
                {task.status}
              </span>
              <div className="flex gap-1">
                <button onClick={() => onEdit(task)} className="p-1.5 text-taupe hover:text-warn rounded-lg">
                  <HiPencil size={16} />
                </button>
                <button onClick={() => onDelete(task.id)} className="p-1.5 text-taupe hover:text-accent rounded-lg">
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
