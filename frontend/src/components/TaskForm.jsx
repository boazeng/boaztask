import { useState, useEffect } from 'react'
import { HiX } from 'react-icons/hi'

const urgencyOptions = ['דחוף', 'גבוה', 'בינוני', 'נמוך']
const statusOptions = ['חדש', 'בטיפול', 'הושלם', 'בוטל']

export default function TaskForm({ task, onSave, onClose }) {
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

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!form.subject.trim()) return
    onSave(form)
  }

  const set = (field) => (e) => setForm(prev => ({ ...prev, [field]: e.target.value }))

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
            <input
              type="text"
              value={form.subject}
              onChange={set('subject')}
              className="tact-field"
              placeholder="הזן נושא..."
              required
              autoFocus
            />
          </div>

          <div>
            <label className="tact-field-label">תת נושא</label>
            <input
              type="text"
              value={form.sub_subject}
              onChange={set('sub_subject')}
              className="tact-field"
              placeholder="הזן תת נושא..."
            />
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
