import { useState, useEffect, useCallback, useMemo } from 'react'
import { Toaster, toast } from 'react-hot-toast'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import TaskList from './components/TaskList'
import TaskForm from './components/TaskForm'
import TaskDetail from './components/TaskDetail'
import FilterBar from './components/FilterBar'
import ConfirmDialog from './components/ConfirmDialog'
import * as api from './api/tasks'

export default function App() {
  const [view, setView] = useState('tasks')
  const [tasks, setTasks] = useState([])
  const [stats, setStats] = useState({ total: 0, by_status: {}, by_urgency: {} })
  const [filters, setFilters] = useState({})
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [viewingTask, setViewingTask] = useState(null)
  const [deleteTargetId, setDeleteTargetId] = useState(null)
  const [sort, setSort] = useState([])

  const loadTasks = useCallback(async () => {
    try {
      const params = {}
      if (filters.status) params.status = filters.status
      if (filters.urgency) params.urgency = filters.urgency
      if (filters.search) params.search = filters.search
      const data = await api.getTasks(params)
      setTasks(data)
    } catch {
      toast.error('שגיאה בטעינת מטלות')
    }
  }, [filters])

  const loadStats = useCallback(async () => {
    try {
      const data = await api.getStats()
      setStats(data)
    } catch {
      // stats endpoint might not exist yet
    }
  }, [])

  useEffect(() => {
    loadTasks()
    loadStats()
  }, [loadTasks, loadStats])

  const handleSort = (field, addLevel) => {
    setSort(prev => {
      const idx = prev.findIndex(s => s.field === field)
      if (addLevel) {
        if (idx >= 0) {
          const next = [...prev]
          next[idx] = { field, dir: prev[idx].dir === 'asc' ? 'desc' : 'asc' }
          return next
        }
        return [...prev, { field, dir: 'asc' }]
      }
      if (prev.length === 1 && prev[0].field === field) {
        return [{ field, dir: prev[0].dir === 'asc' ? 'desc' : 'asc' }]
      }
      return [{ field, dir: 'asc' }]
    })
  }

  const sortedTasks = useMemo(() => {
    if (sort.length === 0) return tasks
    const URGENCY_ORDER = { 'דחוף': 4, 'גבוה': 3, 'בינוני': 2, 'נמוך': 1 }
    const STATUS_ORDER = { 'חדש': 1, 'בטיפול': 2, 'הושלם': 3, 'בוטל': 4 }
    const arr = [...tasks]
    arr.sort((a, b) => {
      for (const { field, dir } of sort) {
        const va = a[field]; const vb = b[field]
        const aNull = va == null || va === ''
        const bNull = vb == null || vb === ''
        if (aNull && bNull) continue
        if (aNull) return 1
        if (bNull) return -1
        let c
        if (field === 'urgency') c = (URGENCY_ORDER[va] || 0) - (URGENCY_ORDER[vb] || 0)
        else if (field === 'status') c = (STATUS_ORDER[va] || 0) - (STATUS_ORDER[vb] || 0)
        else if (field === 'immediate') c = (va ? 1 : 0) - (vb ? 1 : 0)
        else if (field === 'created_at' || field === 'updated_at') c = new Date(va) - new Date(vb)
        else c = String(va).localeCompare(String(vb), 'he')
        if (c !== 0) return dir === 'asc' ? c : -c
      }
      return 0
    })
    return arr
  }, [tasks, sort])

  const handleSave = async (formData) => {
    try {
      if (editingTask) {
        await api.updateTask(editingTask.id, formData)
        toast.success('מטלה עודכנה בהצלחה')
      } else {
        await api.createTask(formData)
        toast.success('מטלה נוצרה בהצלחה')
      }
      setShowForm(false)
      setEditingTask(null)
      loadTasks()
      loadStats()
    } catch {
      toast.error('שגיאה בשמירת מטלה')
    }
  }

  const handleDelete = (id) => {
    setDeleteTargetId(id)
  }

  const confirmDelete = async () => {
    const id = deleteTargetId
    setDeleteTargetId(null)
    try {
      await api.deleteTask(id)
      toast.success('מטלה נמחקה')
      loadTasks()
      loadStats()
    } catch {
      toast.error('שגיאה במחיקת מטלה')
    }
  }

  const handleToggleImmediate = async (id, immediate) => {
    setTasks(prev => prev.map(t => t.id === id ? { ...t, immediate } : t))
    try {
      await api.updateTask(id, { immediate })
    } catch {
      toast.error('שגיאה בעדכון')
      loadTasks()
    }
  }

  const handleEdit = (task) => {
    setEditingTask(task)
    setShowForm(true)
    setViewingTask(null)
  }

  const handleAddTask = () => {
    setEditingTask(null)
    setShowForm(true)
  }

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: { background: '#1f2937', color: '#f3f4f6', border: '1px solid #374151' },
        }}
      />

      <Layout currentView={view} onViewChange={setView} onAddTask={handleAddTask}>
        {view === 'dashboard' && (
          <Dashboard stats={stats} tasks={tasks} />
        )}

        {view === 'tasks' && (
          <div className="space-y-4">
            <FilterBar filters={filters} onFilterChange={setFilters} />
            <TaskList
              tasks={sortedTasks}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={setViewingTask}
              onToggleImmediate={handleToggleImmediate}
              sort={sort}
              onSort={handleSort}
              onClearSort={() => setSort([])}
            />
          </div>
        )}
      </Layout>

      {showForm && (
        <TaskForm
          task={editingTask}
          onSave={handleSave}
          onClose={() => { setShowForm(false); setEditingTask(null) }}
        />
      )}

      {viewingTask && (
        <TaskDetail
          task={viewingTask}
          onClose={() => setViewingTask(null)}
          onEdit={handleEdit}
        />
      )}

      <ConfirmDialog
        open={deleteTargetId !== null}
        title="מחיקת מטלה"
        message="האם אתה בטוח שברצונך למחוק את המטלה? לא ניתן יהיה לשחזר אותה."
        confirmText="מחק"
        cancelText="ביטול"
        onConfirm={confirmDelete}
        onCancel={() => setDeleteTargetId(null)}
      />
    </>
  )
}
