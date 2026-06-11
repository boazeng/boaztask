import { useState, useEffect, useCallback, useMemo } from 'react'
import { Toaster, toast } from 'react-hot-toast'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import TaskList from './components/TaskList'
import TaskForm from './components/TaskForm'
import TaskDetail from './components/TaskDetail'
import FilterBar from './components/FilterBar'
import ConfirmDialog from './components/ConfirmDialog'
import SubjectsManager from './components/SubjectsManager'
import TokensManager from './components/TokensManager'
import UsersManager from './components/UsersManager'
import { installAuthInterceptor } from './api/client'
import * as api from './api/tasks'
import * as subjectsApi from './api/subjects'
import * as authApi from './api/auth'

export default function App() {
  const [authReady, setAuthReady] = useState(false)
  const [currentUser, setCurrentUser] = useState(null)
  const [view, setView] = useState('tasks')
  const [tasks, setTasks] = useState([])
  const [stats, setStats] = useState({ total: 0, by_status: {}, by_urgency: {} })
  const [filters, setFilters] = useState({})
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [viewingTask, setViewingTask] = useState(null)
  const [deleteTargetId, setDeleteTargetId] = useState(null)
  const [sort, setSort] = useState([])
  const [subjects, setSubjects] = useState([])

  // Install the 401 interceptor once on mount.
  useEffect(() => {
    installAuthInterceptor(() => { window.location.href = '/login' })
  }, [])

  // Resolve the current user — if /auth/me returns nothing, send the user
  // through Google. If shared-auth isn't installed at all (dev mode), the
  // endpoint will 404 and we fall back to an anonymous user so the app
  // still loads.
  useEffect(() => {
    let cancelled = false
    ;(async () => {
      try {
        const me = await authApi.getMe()
        if (cancelled) return
        if (me && me.email) {
          setCurrentUser(me)
        } else {
          window.location.href = '/login'
          return
        }
      } catch (err) {
        if (cancelled) return
        if (err?.response?.status === 401) {
          window.location.href = '/login'
          return
        }
        // 404 or network — auth not installed; proceed without it
        setCurrentUser({ email: 'guest', role: 'admin', name: '' })
      }
      setAuthReady(true)
    })()
    return () => { cancelled = true }
  }, [])

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

  const loadSubjects = useCallback(async () => {
    try {
      const data = await subjectsApi.getSubjects()
      setSubjects(data)
    } catch {
      // subjects endpoint may not be up yet
    }
  }, [])

  useEffect(() => {
    if (!authReady) return
    loadTasks()
    loadStats()
    loadSubjects()
  }, [authReady, loadTasks, loadStats, loadSubjects])

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
      loadSubjects()
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
    loadSubjects()
  }

  if (!authReady) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-cream">
        <p className="text-taupe">טוען...</p>
      </div>
    )
  }

  return (
    <>
      <Toaster
        position="top-center"
        toastOptions={{
          style: {
            background: '#FFFEFB',
            color: '#2A2A28',
            border: '1px solid #E7E2D6',
            boxShadow: '0 8px 30px rgba(28, 27, 25, 0.13)',
            fontFamily: "'Heebo', sans-serif",
          },
          success: { iconTheme: { primary: '#2F8F5B', secondary: '#FFFEFB' } },
          error:   { iconTheme: { primary: '#D64A2E', secondary: '#FFFEFB' } },
        }}
      />

      <Layout
        currentView={view}
        currentUser={currentUser}
        onViewChange={(v) => { setView(v); if (v !== 'subjects') loadSubjects() }}
        onAddTask={handleAddTask}
      >
        {view === 'dashboard' && (
          <Dashboard stats={stats} tasks={tasks} />
        )}

        {view === 'tasks' && (
          <div className="space-y-4">
            <FilterBar filters={filters} onFilterChange={setFilters} />
            <TaskList
              tasks={sortedTasks}
              subjects={subjects}
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

        {view === 'subjects' && (
          <SubjectsManager />
        )}

        {view === 'tokens' && (
          <TokensManager currentUser={currentUser} />
        )}

        {view === 'users' && currentUser?.role === 'admin' && (
          <UsersManager />
        )}
      </Layout>

      {showForm && (
        <TaskForm
          task={editingTask}
          subjects={subjects}
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
