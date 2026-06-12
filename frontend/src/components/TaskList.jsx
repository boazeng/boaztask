import { useState, useMemo, useEffect } from 'react'
import { HiPencil, HiTrash, HiEye, HiArrowSmUp, HiArrowSmDown, HiX, HiViewList, HiViewGrid, HiPlus, HiMinus } from 'react-icons/hi'

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

const URGENCY_OPTIONS = ['דחוף', 'גבוה', 'בינוני', 'נמוך']
const STATUS_OPTIONS = ['חדש', 'בטיפול', 'הושלם', 'בוטל']

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
const TOTAL_COLS = COLUMNS.length + 1
const NO_SUBJECT = 'ללא נושא'
const NO_SUB = 'ללא תת-נושא'

const DEPTH_KEY = 'boaztask:groupingDepth'
const MAX_DEPTH = 2 // 0 = flat, 1 = subject only, 2 = subject + sub-subject

const EDITABLE_CELL_HOVER = 'hover:bg-primary-soft hover:ring-1 hover:ring-primary/20 rounded transition-colors cursor-text'
const INLINE_INPUT_CLASS = 'w-full bg-cream-white border border-primary rounded-md px-2 py-1 text-sm focus:outline-none focus:ring-2 focus:ring-primary-soft'

function readInitialDepth() {
  try {
    const stored = parseInt(localStorage.getItem(DEPTH_KEY), 10)
    if (Number.isInteger(stored) && stored >= 0 && stored <= MAX_DEPTH) return stored
  } catch {}
  return MAX_DEPTH
}

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

export default function TaskList({ tasks, subjects = [], onEdit, onDelete, onView, onToggleImmediate, onInlineUpdate, onDuplicate, sort = [], onSort, onClearSort }) {
  const [depth, setDepth] = useState(readInitialDepth)
  const [editing, setEditing] = useState(null) // { taskId, field, draft }

  useEffect(() => {
    try { localStorage.setItem(DEPTH_KEY, String(depth)) } catch {}
  }, [depth])

  const taskById = useMemo(() => new Map(tasks.map(t => [t.id, t])), [tasks])

  const startEdit = (taskId, field, initialValue) => {
    if (editing) commitEdit()
    setEditing({ taskId, field, draft: initialValue ?? '' })
  }

  const updateDraft = (value) => {
    setEditing(prev => prev ? { ...prev, draft: value } : null)
  }

  const cancelEdit = () => setEditing(null)

  const commitEdit = () => {
    if (!editing) return
    const { taskId, field, draft } = editing
    setEditing(null)
    const task = taskById.get(taskId)
    if (!task) return
    if ((task[field] ?? '') === draft) return // no change
    onInlineUpdate?.(taskId, { [field]: draft })
  }

  const commitWithValue = (taskId, field, value) => {
    setEditing(null)
    const task = taskById.get(taskId)
    if (!task) return
    if ((task[field] ?? '') === value) return
    onInlineUpdate?.(taskId, { [field]: value })
  }

  const isEditing = (taskId, field) => editing?.taskId === taskId && editing?.field === field

  const groups = useMemo(() => {
    const map = new Map()
    for (const t of tasks) {
      const subj = (t.subject || '').trim() || NO_SUBJECT
      const sub = (t.sub_subject || '').trim() || NO_SUB
      if (!map.has(subj)) map.set(subj, new Map())
      const inner = map.get(subj)
      if (!inner.has(sub)) inner.set(sub, [])
      inner.get(sub).push(t)
    }
    const subjectOrder = new Map(subjects.map((s, i) => [s.name, i]))
    const subSubjectOrder = new Map(
      subjects.flatMap(s => s.sub_subjects.map((ss, i) => [`${s.name}|${ss.name}`, i]))
    )
    const sortSubjects = (a, b) => {
      const ia = subjectOrder.has(a) ? subjectOrder.get(a) : Number.MAX_SAFE_INTEGER
      const ib = subjectOrder.has(b) ? subjectOrder.get(b) : Number.MAX_SAFE_INTEGER
      if (ia !== ib) return ia - ib
      return a.localeCompare(b, 'he')
    }
    const sortSubsFor = (subjName) => (a, b) => {
      const ka = `${subjName}|${a}`; const kb = `${subjName}|${b}`
      const ia = subSubjectOrder.has(ka) ? subSubjectOrder.get(ka) : Number.MAX_SAFE_INTEGER
      const ib = subSubjectOrder.has(kb) ? subSubjectOrder.get(kb) : Number.MAX_SAFE_INTEGER
      if (ia !== ib) return ia - ib
      return a.localeCompare(b, 'he')
    }
    const sortedSubjects = [...map.keys()].sort(sortSubjects)
    return sortedSubjects.map(subjName => {
      const inner = map.get(subjName)
      const sortedSubs = [...inner.keys()].sort(sortSubsFor(subjName))
      const subBuckets = sortedSubs.map(sName => ({
        name: sName,
        tasks: inner.get(sName),
      }))
      const total = subBuckets.reduce((sum, b) => sum + b.tasks.length, 0)
      return { name: subjName, subBuckets, total }
    })
  }, [tasks, subjects])

  const inc = () => setDepth(d => Math.min(MAX_DEPTH, d + 1))
  const dec = () => setDepth(d => Math.max(0, d - 1))

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

  // Renderers for the editable cells -----------------------------------
  const renderUrgencyCell = (task) => {
    if (isEditing(task.id, 'urgency')) {
      return (
        <select
          autoFocus
          defaultValue={editing.draft}
          onChange={(e) => commitWithValue(task.id, 'urgency', e.target.value)}
          onBlur={cancelEdit}
          onKeyDown={(e) => { if (e.key === 'Escape') cancelEdit() }}
          className={INLINE_INPUT_CLASS}
        >
          {URGENCY_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      )
    }
    return (
      <button
        onClick={() => startEdit(task.id, 'urgency', task.urgency || '')}
        className={`text-xs font-bold px-3 py-1 rounded-full ${URGENCY_BADGE[task.urgency] || ''} hover:ring-2 hover:ring-primary/30 transition-shadow`}
        title="לחץ כדי לערוך"
      >
        {task.urgency || '—'}
      </button>
    )
  }

  const renderStatusCell = (task) => {
    if (isEditing(task.id, 'status')) {
      return (
        <select
          autoFocus
          defaultValue={editing.draft}
          onChange={(e) => commitWithValue(task.id, 'status', e.target.value)}
          onBlur={cancelEdit}
          onKeyDown={(e) => { if (e.key === 'Escape') cancelEdit() }}
          className={INLINE_INPUT_CLASS}
        >
          {STATUS_OPTIONS.map(o => <option key={o} value={o}>{o}</option>)}
        </select>
      )
    }
    return (
      <button
        onClick={() => startEdit(task.id, 'status', task.status || '')}
        className={`tact-badge ${STATUS_BADGE_CLASS[task.status] || 'tact-badge-muted'} hover:ring-2 hover:ring-primary/30 transition-shadow`}
        title="לחץ כדי לערוך"
      >
        {task.status || '—'}
      </button>
    )
  }

  const renderTextCell = (task, field, displayClass = 'text-taupe') => {
    if (isEditing(task.id, field)) {
      return (
        <input
          type="text"
          autoFocus
          value={editing.draft}
          onChange={(e) => updateDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Enter') { e.preventDefault(); commitEdit() }
            if (e.key === 'Escape') cancelEdit()
          }}
          className={INLINE_INPUT_CLASS}
        />
      )
    }
    return (
      <button
        onClick={() => startEdit(task.id, field, task[field] || '')}
        className={`w-full text-right -mx-1 px-1 py-1 ${displayClass} ${EDITABLE_CELL_HOVER}`}
        title="לחץ כדי לערוך"
      >
        {task[field] || '—'}
      </button>
    )
  }

  const renderDescriptionCell = (task) => {
    if (isEditing(task.id, 'description')) {
      return (
        <textarea
          autoFocus
          rows={2}
          value={editing.draft}
          onChange={(e) => updateDraft(e.target.value)}
          onBlur={commitEdit}
          onKeyDown={(e) => {
            if (e.key === 'Escape') cancelEdit()
            if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) { e.preventDefault(); commitEdit() }
          }}
          className={`${INLINE_INPUT_CLASS} resize-none`}
        />
      )
    }
    return (
      <button
        onClick={() => startEdit(task.id, 'description', task.description || '')}
        className={`w-full text-right -mx-1 px-1 py-1 text-taupe ${EDITABLE_CELL_HOVER}`}
        title="לחץ כדי לערוך · Ctrl+Enter לשמירה"
      >
        <span className="line-clamp-2">{task.description || '—'}</span>
      </button>
    )
  }

  const renderTaskRow = (task) => (
    <tr key={task.id} className="border-b border-warm-border/60 hover:bg-cream/60 transition-colors">
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
      <td className="px-4 py-3 min-w-[260px] max-w-[400px]">
        {renderDescriptionCell(task)}
      </td>
      <td className="px-4 py-3">{renderUrgencyCell(task)}</td>
      <td className="px-4 py-3">{renderStatusCell(task)}</td>
      <td className="px-4 py-3">{renderTextCell(task, 'category1')}</td>
      <td className="px-4 py-3">{renderTextCell(task, 'category2')}</td>
      <td className="px-4 py-3 text-taupe whitespace-nowrap font-en text-sm">
        {task.created_at ? new Date(task.created_at).toLocaleDateString('he-IL') : '—'}
      </td>
      <td className="px-4 py-3">
        <div className="flex items-center justify-center gap-1">
          <button onClick={() => onDuplicate?.(task)} className="p-2 text-taupe hover:text-pos hover:bg-pos/10 rounded-lg transition-colors" title="הוסף שורה חדשה עם אותו נושא, תת-נושא, דחיפות, סטטוס ואחראי">
            <HiPlus size={18} />
          </button>
          <button onClick={() => onView(task)} className="p-2 text-taupe hover:text-primary hover:bg-primary-soft rounded-lg transition-colors" title="צפייה">
            <HiEye size={18} />
          </button>
          <button onClick={() => onEdit(task)} className="p-2 text-taupe hover:text-warn hover:bg-[rgba(201,146,56,0.14)] rounded-lg transition-colors" title="עריכה מלאה">
            <HiPencil size={18} />
          </button>
          <button onClick={() => onDelete(task.id)} className="p-2 text-taupe hover:text-accent hover:bg-[rgba(214,74,46,0.12)] rounded-lg transition-colors" title="מחיקה">
            <HiTrash size={18} />
          </button>
        </div>
      </td>
    </tr>
  )

  return (
    <div className="bg-cream-white rounded-2xl border border-warm-border overflow-hidden shadow-sm">
      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-[rgba(31,58,95,0.04)] border-b border-warm-border text-sm">
        <div className="inline-flex items-center rounded-full border border-warm-border bg-cream-white p-1 gap-1">
          <button
            onClick={() => setDepth(MAX_DEPTH)}
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${depth === MAX_DEPTH ? 'bg-primary text-cream-text' : 'text-taupe hover:text-primary'}`}
            title="קיבוץ לפי נושא + תת-נושא"
          >
            <HiViewList size={14} /> מקובץ
          </button>

          <button
            onClick={inc}
            disabled={depth >= MAX_DEPTH}
            className="p-1 rounded-full text-taupe hover:text-primary hover:bg-primary-soft disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-taupe transition-colors"
            title="הוסף רמת קיבוץ"
          >
            <HiPlus size={14} />
          </button>
          <button
            onClick={dec}
            disabled={depth <= 0}
            className="p-1 rounded-full text-taupe hover:text-primary hover:bg-primary-soft disabled:opacity-30 disabled:hover:bg-transparent disabled:hover:text-taupe transition-colors"
            title="הסר רמת קיבוץ"
          >
            <HiMinus size={14} />
          </button>

          <button
            onClick={() => setDepth(0)}
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${depth === 0 ? 'bg-primary text-cream-text' : 'text-taupe hover:text-primary'}`}
            title="ללא קיבוץ"
          >
            <HiViewGrid size={14} /> שטוח
          </button>
        </div>

        {sort.length > 0 && (
          <>
            <span className="text-taupe mr-2">מיין לפי:</span>
            {sort.map((s, i) => (
              <button
                key={s.field}
                onClick={() => onSort?.(s.field, true)}
                className="inline-flex items-center gap-1 px-3 py-1 rounded-full bg-cream-white border border-primary/30 text-primary hover:bg-primary-soft transition-colors text-xs"
                title="לחיצה להפיכת כיוון"
              >
                {sort.length > 1 && <span className="text-[10px] font-en opacity-70">{i + 1}</span>}
                <span>{FIELD_LABEL[s.field] || s.field}</span>
                {s.dir === 'asc' ? <HiArrowSmUp size={14} /> : <HiArrowSmDown size={14} />}
              </button>
            ))}
            <button
              onClick={onClearSort}
              className="inline-flex items-center gap-1 text-taupe hover:text-accent transition-colors text-xs"
            >
              <HiX size={14} /> נקה
            </button>
          </>
        )}

        <span className="text-taupe/70 text-xs mr-auto hidden lg:inline">טיפ: לחץ על תא כדי לערוך · Shift+לחיצה על כותרת מוסיפה רמת מיון</span>
      </div>

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
            {depth === 0 && tasks.map(renderTaskRow)}

            {depth === 1 && groups.map(group => {
              const subjectTasks = group.subBuckets.flatMap(b => b.tasks)
              return (
                <FragmentRows key={`s:${group.name}`}>
                  <tr className="bg-[rgba(31,58,95,0.08)] border-b border-warm-border">
                    <td colSpan={TOTAL_COLS} className="px-4 py-2.5">
                      <div className="flex items-center gap-2 text-warm-ink font-bold">
                        <span className="text-base">{group.name}</span>
                        <span className="tact-badge tact-badge-on">{group.total} מטלות</span>
                      </div>
                    </td>
                  </tr>
                  {subjectTasks.map(renderTaskRow)}
                </FragmentRows>
              )
            })}

            {depth === 2 && groups.map(group => (
              <FragmentRows key={`s:${group.name}`}>
                <tr className="bg-[rgba(31,58,95,0.08)] border-b border-warm-border">
                  <td colSpan={TOTAL_COLS} className="px-4 py-2.5">
                    <div className="flex items-center gap-2 text-warm-ink font-bold">
                      <span className="text-base">{group.name}</span>
                      <span className="tact-badge tact-badge-on">{group.total} מטלות</span>
                      <span className="text-xs text-taupe">· {group.subBuckets.length} תת-נושאים</span>
                    </div>
                  </td>
                </tr>
                {group.subBuckets.map(bucket => (
                  <FragmentRows key={`ss:${group.name}|${bucket.name}`}>
                    <tr className="bg-[rgba(31,58,95,0.035)] border-b border-warm-border/70">
                      <td colSpan={TOTAL_COLS} className="px-4 py-2 pr-10">
                        <div className="flex items-center gap-2 text-warm-ink font-semibold">
                          <span className="text-sm">{bucket.name}</span>
                          <span className="tact-badge tact-badge-soon">{bucket.tasks.length}</span>
                        </div>
                      </td>
                    </tr>
                    {bucket.tasks.map(renderTaskRow)}
                  </FragmentRows>
                ))}
              </FragmentRows>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-warm-border">
        {depth === 0 && tasks.map(task => (
          <MobileCard key={task.id} task={task} onView={onView} onEdit={onEdit} onDelete={onDelete} onToggleImmediate={onToggleImmediate} />
        ))}

        {depth === 1 && groups.map(group => {
          const subjectTasks = group.subBuckets.flatMap(b => b.tasks)
          return (
            <div key={`s:${group.name}`}>
              <div className="flex items-center gap-2 px-4 py-2.5 bg-[rgba(31,58,95,0.08)] text-warm-ink font-bold">
                <span className="flex-1">{group.name}</span>
                <span className="tact-badge tact-badge-on">{group.total}</span>
              </div>
              {subjectTasks.map(task => (
                <MobileCard key={task.id} task={task} onView={onView} onEdit={onEdit} onDelete={onDelete} onToggleImmediate={onToggleImmediate} />
              ))}
            </div>
          )
        })}

        {depth === 2 && groups.map(group => (
          <div key={`s:${group.name}`}>
            <div className="flex items-center gap-2 px-4 py-2.5 bg-[rgba(31,58,95,0.08)] text-warm-ink font-bold">
              <span className="flex-1">{group.name}</span>
              <span className="tact-badge tact-badge-on">{group.total}</span>
            </div>
            {group.subBuckets.map(bucket => (
              <div key={`ss:${group.name}|${bucket.name}`}>
                <div className="flex items-center gap-2 px-4 py-2 pr-8 bg-[rgba(31,58,95,0.035)] text-warm-ink">
                  <span className="flex-1 text-sm font-semibold">{bucket.name}</span>
                  <span className="tact-badge tact-badge-soon">{bucket.tasks.length}</span>
                </div>
                {bucket.tasks.map(task => (
                  <MobileCard key={task.id} task={task} onView={onView} onEdit={onEdit} onDelete={onDelete} onToggleImmediate={onToggleImmediate} />
                ))}
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  )
}

function FragmentRows({ children }) {
  return <>{children}</>
}

function MobileCard({ task, onView, onEdit, onDelete, onToggleImmediate }) {
  return (
    <div className="p-4 space-y-2">
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
  )
}
