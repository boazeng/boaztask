import { HiPlus } from 'react-icons/hi'
import TactLogo from './TactLogo'
import TactIcon from './TactIcon'

const navItems = [
  { id: 'dashboard', label: 'לוח בקרה', icon: 'dashboard' },
  { id: 'tasks', label: 'מטלות', icon: 'document' },
]

export default function Layout({ currentView, onViewChange, onAddTask, children }) {
  return (
    <div className="tact-aurora min-h-screen bg-cream text-warm-ink">
      <header className="tact-bar">
        <div className="flex items-center gap-3">
          <TactLogo word="tasks" size={1.05} />
        </div>

        <nav className="tact-nav">
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => onViewChange(item.id)}
              className={currentView === item.id ? 'active' : ''}
            >
              <TactIcon name={item.icon} size={16} />
              {item.label}
            </button>
          ))}
        </nav>

        <div className="mr-auto flex items-center gap-3">
          <span className="hidden sm:inline text-sm text-taupe">
            {new Date().toLocaleDateString('he-IL')}
          </span>
          <button
            onClick={onAddTask}
            className="tact-btn tact-btn-primary"
          >
            <HiPlus size={18} />
            מטלה חדשה
          </button>
        </div>
      </header>

      <main className="container py-8">
        {children}
      </main>
    </div>
  )
}
