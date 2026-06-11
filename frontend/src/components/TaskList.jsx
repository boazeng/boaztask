import { useState, useMemo, useEffect } from 'react'
import { HiPencil, HiTrash, HiEye, HiArrowSmUp, HiArrowSmDown, HiX, HiChevronDown, HiChevronLeft, HiViewList, HiViewGrid } from 'react-icons/hi'

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
const TOTAL_COLS = COLUMNS.length + 1
const NO_SUBJECT = 'ללא נושא'
const NO_SUB = 'ללא תת-נושא'

const COLLAPSED_KEY = 'boaztask:collapsedGroups'
const VIEW_KEY = 'boaztask:viewMode'

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

function TaskRow({ task, onView, onEdit, onDelete, onToggleImmediate }) {
  return (
    <tr className="border-b border-warm-border/60 hover:bg-cream transition-colors">
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
  )
}

export default function TaskList({ tasks, onEdit, onDelete, onView, onToggleImmediate, sort = [], onSort, onClearSort }) {
  const [viewMode, setViewMode] = useState(() => {
    try { return localStorage.getItem(VIEW_KEY) || 'grouped' } catch { return 'grouped' }
  })
  const [collapsed, setCollapsed] = useState(() => {
    try {
      const stored = localStorage.getItem(COLLAPSED_KEY)
      return stored ? new Set(JSON.parse(stored)) : new Set()
    } catch { return new Set() }
  })

  useEffect(() => {
    try { localStorage.setItem(VIEW_KEY, viewMode) } catch {}
  }, [viewMode])

  useEffect(() => {
    try { localStorage.setItem(COLLAPSED_KEY, JSON.stringify([...collapsed])) } catch {}
  }, [collapsed])

  const toggleKey = (key) => {
    setCollapsed(prev => {
      const next = new Set(prev)
      if (next.has(key)) next.delete(key); else next.add(key)
      return next
    })
  }

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
    const sortedSubjects = [...map.keys()].sort((a, b) => a.localeCompare(b, 'he'))
    return sortedSubjects.map(subjName => {
      const inner = map.get(subjName)
      const sortedSubs = [...inner.keys()].sort((a, b) => a.localeCompare(b, 'he'))
      const subBuckets = sortedSubs.map(sName => ({
        name: sName,
        tasks: inner.get(sName),
      }))
      const total = subBuckets.reduce((sum, b) => sum + b.tasks.length, 0)
      return { name: subjName, subBuckets, total }
    })
  }, [tasks])

  const collapseAll = () => {
    const all = new Set()
    for (const g of groups) {
      all.add(`s:${g.name}`)
      for (const b of g.subBuckets) all.add(`ss:${g.name}|${b.name}`)
    }
    setCollapsed(all)
  }
  const expandAll = () => setCollapsed(new Set())

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
      <div className="flex flex-wrap items-center gap-2 px-4 py-2.5 bg-[rgba(31,58,95,0.04)] border-b border-warm-border text-sm">
        <div className="inline-flex rounded-full border border-warm-border bg-cream-white p-1">
          <button
            onClick={() => setViewMode('grouped')}
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${viewMode === 'grouped' ? 'bg-primary text-cream-text' : 'text-taupe hover:text-primary'}`}
          >
            <HiViewList size={14} /> מקובץ
          </button>
          <button
            onClick={() => setViewMode('flat')}
            className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-semibold transition-colors ${viewMode === 'flat' ? 'bg-primary text-cream-text' : 'text-taupe hover:text-primary'}`}
          >
            <HiViewGrid size={14} /> שטוח
          </button>
        </div>

        {viewMode === 'grouped' && (
          <>
            <button onClick={expandAll} className="text-taupe hover:text-primary transition-colors text-xs">פתח הכל</button>
            <span className="text-taupe/50">·</span>
            <button onClick={collapseAll} className="text-taupe hover:text-primary transition-colors text-xs">כווץ הכל</button>
          </>
        )}

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

        <span className="text-taupe/70 text-xs mr-auto hidden lg:inline">טיפ: Shift+לחיצה על כותרת מוסיפה רמת מיון</span>
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
            {viewMode === 'flat' && tasks.map(task => (
              <TaskRow key={task.id} task={task} onView={onView} onEdit={onEdit} onDelete={onDelete} onToggleImmediate={onToggleImmediate} />
            ))}

            {viewMode === 'grouped' && groups.map(group => {
              const subjKey = `s:${group.name}`
              const subjOpen = !collapsed.has(subjKey)
              return (
                <FragmentRows key={subjKey}>
                  <tr className="bg-[rgba(31,58,95,0.08)] border-b border-warm-border">
                    <td colSpan={TOTAL_COLS} className="px-3 py-2.5">
                      <button
                        onClick={() => toggleKey(subjKey)}
                        className="w-full flex items-center gap-2 text-right text-warm-ink font-bold"
                      >
                        {subjOpen ? <HiChevronDown size={20} className="text-primary" /> : <HiChevronLeft size={20} className="text-primary" />}
                        <span className="text-base">{group.name}</span>
                        <span className="tact-badge tact-badge-on">{group.total} מטלות</span>
                        <span className="text-xs text-taupe">· {group.subBuckets.length} תת-נושאים</span>
                      </button>
                    </td>
                  </tr>

                  {subjOpen && group.subBuckets.map(bucket => {
                    const subKey = `ss:${group.name}|${bucket.name}`
                    const subOpen = !collapsed.has(subKey)
                    return (
                      <FragmentRows key={subKey}>
                        <tr className="bg-[rgba(31,58,95,0.035)] border-b border-warm-border/70">
                          <td colSpan={TOTAL_COLS} className="px-3 py-2 pr-10">
                            <button
                              onClick={() => toggleKey(subKey)}
                              className="w-full flex items-center gap-2 text-right text-warm-ink font-semibold"
                            >
                              {subOpen ? <HiChevronDown size={18} className="text-primary/70" /> : <HiChevronLeft size={18} className="text-primary/70" />}
                              <span className="text-sm">{bucket.name}</span>
                              <span className="tact-badge tact-badge-soon">{bucket.tasks.length}</span>
                            </button>
                          </td>
                        </tr>
                        {subOpen && bucket.tasks.map(task => (
                          <TaskRow key={task.id} task={task} onView={onView} onEdit={onEdit} onDelete={onDelete} onToggleImmediate={onToggleImmediate} />
                        ))}
                      </FragmentRows>
                    )
                  })}
                </FragmentRows>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-warm-border">
        {viewMode === 'flat' && tasks.map(task => (
          <MobileCard key={task.id} task={task} onView={onView} onEdit={onEdit} onDelete={onDelete} onToggleImmediate={onToggleImmediate} />
        ))}

        {viewMode === 'grouped' && groups.map(group => {
          const subjKey = `s:${group.name}`
          const subjOpen = !collapsed.has(subjKey)
          return (
            <div key={subjKey}>
              <button
                onClick={() => toggleKey(subjKey)}
                className="w-full flex items-center gap-2 px-4 py-2.5 bg-[rgba(31,58,95,0.08)] text-right text-warm-ink font-bold"
              >
                {subjOpen ? <HiChevronDown size={18} className="text-primary" /> : <HiChevronLeft size={18} className="text-primary" />}
                <span className="flex-1">{group.name}</span>
                <span className="tact-badge tact-badge-on">{group.total}</span>
              </button>
              {subjOpen && group.subBuckets.map(bucket => {
                const subKey = `ss:${group.name}|${bucket.name}`
                const subOpen = !collapsed.has(subKey)
                return (
                  <div key={subKey}>
                    <button
                      onClick={() => toggleKey(subKey)}
                      className="w-full flex items-center gap-2 px-4 py-2 pr-8 bg-[rgba(31,58,95,0.035)] text-right text-warm-ink"
                    >
                      {subOpen ? <HiChevronDown size={16} className="text-primary/70" /> : <HiChevronLeft size={16} className="text-primary/70" />}
                      <span className="flex-1 text-sm font-semibold">{bucket.name}</span>
                      <span className="tact-badge tact-badge-soon">{bucket.tasks.length}</span>
                    </button>
                    {subOpen && bucket.tasks.map(task => (
                      <MobileCard key={task.id} task={task} onView={onView} onEdit={onEdit} onDelete={onDelete} onToggleImmediate={onToggleImmediate} />
                    ))}
                  </div>
                )
              })}
            </div>
          )
        })}
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
