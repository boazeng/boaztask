import { useState, useEffect, useCallback } from 'react'
import { toast } from 'react-hot-toast'
import { HiChevronDown, HiChevronLeft, HiPlus, HiPencil, HiTrash, HiCheck, HiX } from 'react-icons/hi'
import TactIcon from './TactIcon'
import ConfirmDialog from './ConfirmDialog'
import * as api from '../api/subjects'

export default function SubjectsManager() {
  const [subjects, setSubjects] = useState([])
  const [expanded, setExpanded] = useState(() => new Set())
  const [newSubject, setNewSubject] = useState('')
  const [editingSubjectId, setEditingSubjectId] = useState(null)
  const [editingSubjectName, setEditingSubjectName] = useState('')
  const [newSubSubject, setNewSubSubject] = useState({})
  const [editingSubSubjectId, setEditingSubSubjectId] = useState(null)
  const [editingSubSubjectName, setEditingSubSubjectName] = useState('')
  const [confirmDelete, setConfirmDelete] = useState(null)

  const load = useCallback(async () => {
    try {
      const data = await api.getSubjects()
      setSubjects(data)
    } catch {
      toast.error('שגיאה בטעינת נושאים')
    }
  }, [])

  useEffect(() => { load() }, [load])

  const toggle = (id) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id); else next.add(id)
      return next
    })
  }

  const handleAddSubject = async (e) => {
    e.preventDefault()
    const name = newSubject.trim()
    if (!name) return
    try {
      const created = await api.createSubject(name)
      setSubjects(prev => [...prev, created].sort((a, b) => a.name.localeCompare(b.name, 'he')))
      setNewSubject('')
      toast.success('נושא נוצר')
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'שגיאה ביצירת נושא')
    }
  }

  const startEditSubject = (subj) => {
    setEditingSubjectId(subj.id)
    setEditingSubjectName(subj.name)
  }

  const saveEditSubject = async (id) => {
    const name = editingSubjectName.trim()
    if (!name) return
    try {
      const updated = await api.updateSubject(id, name)
      setSubjects(prev => prev.map(s => s.id === id ? updated : s).sort((a, b) => a.name.localeCompare(b.name, 'he')))
      setEditingSubjectId(null)
      toast.success('הנושא עודכן')
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'שגיאה בעדכון')
    }
  }

  const handleAddSubSubject = async (subjectId, e) => {
    e?.preventDefault?.()
    const name = (newSubSubject[subjectId] || '').trim()
    if (!name) return
    try {
      const created = await api.createSubSubject(subjectId, name)
      setSubjects(prev => prev.map(s =>
        s.id === subjectId
          ? { ...s, sub_subjects: [...s.sub_subjects, created].sort((a, b) => a.name.localeCompare(b.name, 'he')) }
          : s
      ))
      setNewSubSubject(prev => ({ ...prev, [subjectId]: '' }))
      toast.success('תת-נושא נוצר')
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'שגיאה ביצירת תת-נושא')
    }
  }

  const startEditSubSubject = (ss) => {
    setEditingSubSubjectId(ss.id)
    setEditingSubSubjectName(ss.name)
  }

  const saveEditSubSubject = async (subjectId, ssId) => {
    const name = editingSubSubjectName.trim()
    if (!name) return
    try {
      const updated = await api.updateSubSubject(ssId, name)
      setSubjects(prev => prev.map(s =>
        s.id === subjectId
          ? { ...s, sub_subjects: s.sub_subjects.map(x => x.id === ssId ? updated : x).sort((a, b) => a.name.localeCompare(b.name, 'he')) }
          : s
      ))
      setEditingSubSubjectId(null)
      toast.success('תת-נושא עודכן')
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'שגיאה בעדכון')
    }
  }

  const requestDelete = (kind, id, name) => {
    setConfirmDelete({ kind, id, name })
  }

  const performDelete = async () => {
    const { kind, id } = confirmDelete
    setConfirmDelete(null)
    try {
      if (kind === 'subject') {
        await api.deleteSubject(id)
        setSubjects(prev => prev.filter(s => s.id !== id))
        toast.success('הנושא נמחק')
      } else {
        await api.deleteSubSubject(id)
        setSubjects(prev => prev.map(s => ({
          ...s,
          sub_subjects: s.sub_subjects.filter(x => x.id !== id),
        })))
        toast.success('תת-הנושא נמחק')
      }
    } catch (err) {
      toast.error(err?.response?.data?.detail || 'שגיאה במחיקה')
    }
  }

  return (
    <div className="space-y-6">
      <div className="tact-kpi flex flex-col sm:flex-row sm:items-center gap-4 justify-between">
        <div>
          <div className="tact-kpi-label">ניהול נושאים</div>
          <div className="text-warm-ink font-semibold mt-1">
            {subjects.length} נושאים · {subjects.reduce((sum, s) => sum + s.sub_subjects.length, 0)} תת-נושאים
          </div>
          <p className="text-sm text-taupe mt-1">הוסף, ערוך או מחק נושאים ותת-נושאים שישמשו בכל מטלה חדשה.</p>
        </div>
        <form onSubmit={handleAddSubject} className="flex gap-2 w-full sm:w-auto">
          <input
            type="text"
            value={newSubject}
            onChange={(e) => setNewSubject(e.target.value)}
            placeholder="שם נושא חדש..."
            className="tact-field min-w-[200px]"
          />
          <button type="submit" className="tact-btn tact-btn-primary whitespace-nowrap">
            <HiPlus size={18} /> הוסף נושא
          </button>
        </form>
      </div>

      <div className="space-y-3">
        {subjects.length === 0 ? (
          <div className="bg-cream-white rounded-2xl border border-warm-border p-12 text-center shadow-sm">
            <p className="text-taupe text-lg">עוד לא הוגדרו נושאים</p>
            <p className="text-taupe/70 text-sm mt-2">הוסף את הנושא הראשון בטופס למעלה</p>
          </div>
        ) : subjects.map(subj => {
          const isOpen = expanded.has(subj.id)
          const isEditing = editingSubjectId === subj.id
          return (
            <div key={subj.id} className="bg-cream-white rounded-2xl border border-warm-border shadow-sm overflow-hidden">
              <div className="flex items-center gap-3 px-4 py-3 bg-[rgba(31,58,95,0.04)] border-b border-warm-border">
                <button
                  onClick={() => toggle(subj.id)}
                  className="p-1 text-taupe hover:text-primary transition-colors"
                  title={isOpen ? 'כווץ' : 'הרחב'}
                >
                  {isOpen ? <HiChevronDown size={22} /> : <HiChevronLeft size={22} />}
                </button>

                {isEditing ? (
                  <input
                    type="text"
                    value={editingSubjectName}
                    onChange={(e) => setEditingSubjectName(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter') saveEditSubject(subj.id)
                      if (e.key === 'Escape') setEditingSubjectId(null)
                    }}
                    autoFocus
                    className="tact-field flex-1"
                  />
                ) : (
                  <button
                    onClick={() => toggle(subj.id)}
                    className="flex-1 text-right text-warm-ink font-bold text-lg"
                  >
                    {subj.name}
                  </button>
                )}

                <span className="tact-badge tact-badge-on hidden sm:inline-flex">
                  {subj.sub_subjects.length} תת-נושאים
                </span>
                <span className="tact-badge tact-badge-soon hidden sm:inline-flex">
                  {subj.task_count} מטלות
                </span>

                <div className="flex items-center gap-1 shrink-0">
                  {isEditing ? (
                    <>
                      <button
                        onClick={() => saveEditSubject(subj.id)}
                        className="p-2 text-pos hover:bg-pos/10 rounded-lg transition-colors"
                        title="שמור"
                      >
                        <HiCheck size={18} />
                      </button>
                      <button
                        onClick={() => setEditingSubjectId(null)}
                        className="p-2 text-taupe hover:bg-warm-border rounded-lg transition-colors"
                        title="ביטול"
                      >
                        <HiX size={18} />
                      </button>
                    </>
                  ) : (
                    <>
                      <button
                        onClick={() => startEditSubject(subj)}
                        className="p-2 text-taupe hover:text-warn hover:bg-[rgba(201,146,56,0.14)] rounded-lg transition-colors"
                        title="עריכה"
                      >
                        <HiPencil size={18} />
                      </button>
                      <button
                        onClick={() => requestDelete('subject', subj.id, subj.name)}
                        className="p-2 text-taupe hover:text-accent hover:bg-[rgba(214,74,46,0.12)] rounded-lg transition-colors"
                        title="מחיקה"
                      >
                        <HiTrash size={18} />
                      </button>
                    </>
                  )}
                </div>
              </div>

              {isOpen && (
                <div className="p-4 space-y-3">
                  <form onSubmit={(e) => handleAddSubSubject(subj.id, e)} className="flex gap-2">
                    <input
                      type="text"
                      value={newSubSubject[subj.id] || ''}
                      onChange={(e) => setNewSubSubject(prev => ({ ...prev, [subj.id]: e.target.value }))}
                      placeholder="שם תת-נושא חדש..."
                      className="tact-field flex-1"
                    />
                    <button type="submit" className="tact-btn tact-btn-ghost whitespace-nowrap">
                      <HiPlus size={16} /> הוסף תת-נושא
                    </button>
                  </form>

                  {subj.sub_subjects.length === 0 ? (
                    <p className="text-taupe text-sm text-center py-3">עוד לא הוגדרו תת-נושאים</p>
                  ) : (
                    <div className="space-y-1.5">
                      {subj.sub_subjects.map(ss => {
                        const isEditingSS = editingSubSubjectId === ss.id
                        return (
                          <div key={ss.id} className="flex items-center gap-3 p-2 rounded-xl border border-warm-border bg-cream/60">
                            <span className="text-taupe text-sm shrink-0"><TactIcon name="document" size={16} /></span>
                            {isEditingSS ? (
                              <input
                                type="text"
                                value={editingSubSubjectName}
                                onChange={(e) => setEditingSubSubjectName(e.target.value)}
                                onKeyDown={(e) => {
                                  if (e.key === 'Enter') saveEditSubSubject(subj.id, ss.id)
                                  if (e.key === 'Escape') setEditingSubSubjectId(null)
                                }}
                                autoFocus
                                className="tact-field flex-1"
                              />
                            ) : (
                              <span className="flex-1 text-warm-ink font-medium">{ss.name}</span>
                            )}
                            <span className="tact-badge tact-badge-soon hidden sm:inline-flex">
                              {ss.task_count} מטלות
                            </span>
                            <div className="flex items-center gap-1 shrink-0">
                              {isEditingSS ? (
                                <>
                                  <button onClick={() => saveEditSubSubject(subj.id, ss.id)} className="p-1.5 text-pos hover:bg-pos/10 rounded-lg" title="שמור">
                                    <HiCheck size={16} />
                                  </button>
                                  <button onClick={() => setEditingSubSubjectId(null)} className="p-1.5 text-taupe hover:bg-warm-border rounded-lg" title="ביטול">
                                    <HiX size={16} />
                                  </button>
                                </>
                              ) : (
                                <>
                                  <button onClick={() => startEditSubSubject(ss)} className="p-1.5 text-taupe hover:text-warn rounded-lg" title="עריכה">
                                    <HiPencil size={16} />
                                  </button>
                                  <button onClick={() => requestDelete('sub_subject', ss.id, ss.name)} className="p-1.5 text-taupe hover:text-accent rounded-lg" title="מחיקה">
                                    <HiTrash size={16} />
                                  </button>
                                </>
                              )}
                            </div>
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>
          )
        })}
      </div>

      <ConfirmDialog
        open={!!confirmDelete}
        title={confirmDelete?.kind === 'subject' ? 'מחיקת נושא' : 'מחיקת תת-נושא'}
        message={`האם למחוק את "${confirmDelete?.name}"? לא ניתן יהיה לשחזר.`}
        confirmText="מחק"
        cancelText="ביטול"
        onConfirm={performDelete}
        onCancel={() => setConfirmDelete(null)}
      />
    </div>
  )
}
