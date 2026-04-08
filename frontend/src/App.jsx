import { useState, useEffect, useCallback } from 'react'
import { Toaster, toast } from 'react-hot-toast'
import Layout from './components/Layout'
import Dashboard from './components/Dashboard'
import TaskList from './components/TaskList'
import TaskForm from './components/TaskForm'
import TaskDetail from './components/TaskDetail'
import FilterBar from './components/FilterBar'
import * as api from './api/tasks'

export default function App() {
  const [view, setView] = useState('dashboard')
  const [tasks, setTasks] = useState([])
  const [stats, setStats] = useState({ total: 0, by_status: {}, by_urgency: {} })
  const [filters, setFilters] = useState({})
  const [showForm, setShowForm] = useState(false)
  const [editingTask, setEditingTask] = useState(null)
  const [viewingTask, setViewingTask] = useState(null)

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

  const handleDelete = async (id) => {
    if (!confirm('האם אתה בטוח שברצונך למחוק את המטלה?')) return
    try {
      await api.deleteTask(id)
      toast.success('מטלה נמחקה')
      loadTasks()
      loadStats()
    } catch {
      toast.error('שגיאה במחיקת מטלה')
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
              tasks={tasks}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onView={setViewingTask}
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
    </>
  )
}
