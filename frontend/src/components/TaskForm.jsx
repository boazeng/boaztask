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
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
      <div className="bg-gray-900 rounded-2xl border border-gray-700 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-800">
          <h2 className="text-xl font-bold text-white">
            {task ? 'עריכת מטלה' : 'מטלה חדשה'}
          </h2>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <HiX size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-4">
          {/* Subject */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">נושא *</label>
            <input
              type="text"
              value={form.subject}
              onChange={set('subject')}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="הזן נושא..."
              required
            />
          </div>

          {/* Sub-subject */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">תת נושא</label>
            <input
              type="text"
              value={form.sub_subject}
              onChange={set('sub_subject')}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              placeholder="הזן תת נושא..."
            />
          </div>

          {/* Description */}
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">תיאור המטלה</label>
            <textarea
              value={form.description}
              onChange={set('description')}
              rows={3}
              className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500 resize-none"
              placeholder="תאר את המטלה..."
            />
          </div>

          {/* Urgency & Status row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">דחיפות</label>
              <select
                value={form.urgency}
                onChange={set('urgency')}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {urgencyOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">סטטוס</label>
              <select
                value={form.status}
                onChange={set('status')}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              >
                {statusOptions.map(opt => <option key={opt} value={opt}>{opt}</option>)}
              </select>
            </div>
          </div>

          {/* Categories row */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">אחראי</label>
              <input
                type="text"
                value={form.category1}
                onChange={set('category1')}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="קטגוריה..."
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-300 mb-1">קטגוריה מיון 2</label>
              <input
                type="text"
                value={form.category2}
                onChange={set('category2')}
                className="w-full bg-gray-800 border border-gray-700 rounded-lg px-4 py-2.5 text-white placeholder-gray-500 focus:outline-none focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
                placeholder="קטגוריה..."
              />
            </div>
          </div>

          {/* Actions */}
          <div className="flex gap-3 pt-4">
            <button
              type="submit"
              className="flex-1 bg-blue-600 hover:bg-blue-700 text-white py-2.5 rounded-lg font-medium transition-colors"
            >
              {task ? 'עדכן' : 'צור מטלה'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-6 bg-gray-800 hover:bg-gray-700 text-gray-300 py-2.5 rounded-lg font-medium transition-colors"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
