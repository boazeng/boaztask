import { useState, useEffect, useMemo } from 'react'
import { HiX } from 'react-icons/hi'

const urgencyOptions = ['דחוף', 'גבוה', 'בינוני', 'נמוך']
const statusOptions = ['חדש', 'בטיפול', 'הושלם', 'בוטל']

export default function TaskForm({ task, subjects = [], onSave, onClose }) {
  const [form, setForm] = useState({
    subject: '',
    sub_subject: '',
    description: '',
    urgency: 'בינוני',
    category1: '',
    category2: '',
    status: 'חדש',
    immediate: false,
  })

  useEffect(() => {
    if (task) {
      setForm({
        subject: task.subject || '',
        sub_subject: task.sub_subject || '',
        description: task.description || '',
        urgency: task.urgency || 'בינוני',
        category1: task.category1 || '',
        category2: task.category2 || '',
        status: task.status || 'חדש',
        immediate: task.immediate || false,
      })
    }
  }, [task])

  const subjectNames = useMemo(() => subjects.map(s => s.name), [subjects])

  const subSubjectsForCurrent = useMemo(() => {
    const subj = subjects.find(s => s.name === form.subject)
    return subj ? subj.sub_subjects.map(ss => ss.name) : []
  }, [subjects, form.subject])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.subject.trim()) return
    onSave(form)
  }

  const setSubject = (e) => {
    const val = e.target.value
    setForm(prev => {
      const subj = subjects.find(s => s.name === val)
      const stillValid = subj && subj.sub_subjects.some(ss => ss.name === prev.sub_subject)
      return { ...prev, subject: val, sub_subject: stillValid ? prev.sub_subject : '' }
    })
  }

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

  const subjectOptions = subjectNames.includes(form.subject) || !form.subject
    ? subjectNames
    : [form.subject, ...subjectNames]

  const subSubjectOptions = subSubjectsForCurrent.includes(form.sub_subject) || !form.sub_subject
    ? subSubjectsForCurrent
    : [form.sub_subject, ...subSubjectsForCurrent]

  return (
    <div className="fixed inset-0 bg-warm-ink/40 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-cream-white rounded-2xl border border-warm-border w-full max-w-lg max-h-[90vh] overflow-y-auto shadow-2xl">
        <div className="flex items-center justify-between px-6 py-4 border-b border-warm-border bg-[rgba(31,58,95,0.04)]">
          <h2 className="text-xl font-bold text-primary">
            {task ? 'עריכת מטלה' : 'מטלה חדשה'}
          </h2>
          <button onClick={onClose} className="text-taupe hover:text-warm-ink transition-colors">
            <HiX size={22} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          <div>
            <label className="tact-field-label">נושא *</label>
            {subjectNames.length === 0 ? (
              <input
                type="text"
                value={form.subject}
                onChange={set('subject')}
                className="tact-field"
                placeholder="הזן נושא..."
                required
                autoFocus
              />
            ) : (
              <select
                value={form.subject}
                onChange={setSubject}
                className="tact-field"
                required
                autoFocus
              >
                <option value="">— בחר נושא —</option>
                {subjectOptions.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            )}
            {subjectNames.length === 0 && (
              <p className="text-xs text-taupe mt-1">אין עוד נושאים מוגדרים. צור נושאים במסך "נושאים".</p>
            )}
          </div>

          <div>
            <label className="tact-field-label">תת נושא</label>
            {subSubjectsForCurrent.length === 0 ? (
              <input
                type="text"
                value={form.sub_subject}
                onChange={set('sub_subject')}
                className="tact-field"
                placeholder={form.subject ? 'אין תת-נושאים מוגדרים — אפשר להקליד חופשי' : 'בחר קודם נושא...'}
                disabled={!form.subject && subjectNames.length > 0}
              />
            ) : (
              <select
                value={form.sub_subject}
                onChange={set('sub_subject')}
                className="tact-field"
              >
                <option value="">— ללא תת-נושא —</option>
                {subSubjectOptions.map(name => (
                  <option key={name} value={name}>{name}</option>
                ))}
              </select>
            )}
          </div>

          <div>
            <label className="tact-field-label">תיאור המטלה</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              rows={3}
              className="tact-field resize-none"
              placeholder="תאר את המטלה..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="tact-field-label">דחיפות</label>
              <select value={form.urgency} onChange={set('urgency')} className="tact-field">
                {urgencyOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <label className="tact-field-label">סטטוס</label>
              <select value={form.status} onChange={set('status')} className="tact-field">
                {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="tact-field-label">אחראי</label>
              <input
                type="text"
                value={form.category1}
                onChange={set('category1')}
                className="tact-field"
                placeholder="קטגוריה..."
              />
            </div>
            <div>
              <label className="tact-field-label">קטגוריה מיון 2</label>
              <input
                type="text"
                value={form.category2}
                onChange={set('category2')}
                className="tact-field"
                placeholder="קטגוריה..."
              />
            </div>
          </div>

          <div>
            <label className="flex items-center gap-3 cursor-pointer">
              <input
                type="checkbox"
                checked={form.immediate}
                onChange={(e) => setForm(prev => ({ ...prev, immediate: e.target.checked }))}
                className="w-5 h-5 rounded border-2 border-warm-border text-primary cursor-pointer focus:ring-2 focus:ring-primary/30"
              />
              <span className="text-sm font-semibold text-warm-ink">מיידי</span>
            </label>
          </div>

          <div className="flex gap-3 pt-4">
            <button type="submit" className="tact-btn tact-btn-primary flex-1">
              {task ? 'עדכן' : 'צור מטלה'}
            </button>
            <button type="button" onClick={onClose} className="tact-btn tact-btn-ghost">
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
