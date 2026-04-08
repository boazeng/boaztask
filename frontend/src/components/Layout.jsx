import { useState } from 'react'
import { HiClipboardList, HiPlus, HiChartBar, HiMenu, HiX } from 'react-icons/hi'

const navItems = [
  { id: 'dashboard', label: 'לוח בקרה', icon: HiChartBar },
  { id: 'tasks', label: 'מטלות', icon: HiClipboardList },
]

export default function Layout({ currentView, onViewChange, onAddTask, children }) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-gray-950 flex">
      {/* Mobile overlay */}
      {sidebarOpen && (
        <div className="fixed inset-0 bg-black/50 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`fixed lg:static inset-y-0 right-0 z-30 w-64 bg-gray-900 border-l border-gray-800 transform transition-transform duration-200 lg:translate-x-0 ${sidebarOpen ? 'translate-x-0' : 'translate-x-full lg:translate-x-0'}`}>
        <div className="p-6">
          <div className="flex items-center justify-between">
            <h1 className="text-2xl font-bold bg-gradient-to-l from-blue-400 to-purple-500 bg-clip-text text-transparent">
              BoazTask
            </h1>
            <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(false)}>
              <HiX size={24} />
            </button>
          </div>
          <p className="text-gray-500 text-sm mt-1">מערכת מעקב מטלות</p>
        </div>

        <nav className="px-4 space-y-1">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => { onViewChange(item.id); setSidebarOpen(false) }}
              className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-medium transition-colors ${
                currentView === item.id
                  ? 'bg-blue-600/20 text-blue-400'
                  : 'text-gray-400 hover:bg-gray-800 hover:text-gray-200'
              }`}
            >
              <item.icon size={20} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="px-4 mt-6">
          <button
            onClick={() => { onAddTask(); setSidebarOpen(false) }}
            className="w-full flex items-center justify-center gap-2 px-4 py-3 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium transition-colors"
          >
            <HiPlus size={20} />
            מטלה חדשה
          </button>
        </div>
      </aside>

      {/* Main content */}
      <main className="flex-1 min-w-0">
        {/* Top bar */}
        <header className="sticky top-0 z-10 bg-gray-950/80 backdrop-blur-sm border-b border-gray-800 px-6 py-4 flex items-center justify-between">
          <button className="lg:hidden text-gray-400 hover:text-white" onClick={() => setSidebarOpen(true)}>
            <HiMenu size={24} />
          </button>
          <h2 className="text-lg font-semibold text-gray-200">
            {navItems.find(n => n.id === currentView)?.label || 'לוח בקרה'}
          </h2>
          <div className="text-sm text-gray-500">
            {new Date().toLocaleDateString('he-IL')}
          </div>
        </header>

        <div className="p-6">
          {children}
        </div>
      </main>
    </div>
  )
}
