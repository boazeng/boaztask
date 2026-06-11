import { HiPlus, HiLogout, HiUser } from 'react-icons/hi'
import TactLogo from './TactLogo'
import TactIcon from './TactIcon'

const BASE_NAV = [
  { id: 'dashboard', label: 'לוח בקרה', icon: 'dashboard' },
  { id: 'tasks', label: 'מטלות', icon: 'document' },
  { id: 'subjects', label: 'נושאים', icon: 'folder' },
  { id: 'tokens', label: 'API Tokens', icon: 'terminal' },
]

const ADMIN_NAV = [
  { id: 'users', label: 'משתמשים', icon: 'users' },
]

export default function Layout({ currentView, onViewChange, onAddTask, currentUser, children }) {
  const role = currentUser?.role
  const navItems = role === 'admin' ? [...BASE_NAV, ...ADMIN_NAV] : BASE_NAV

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
          <span className="hidden md:inline text-sm text-taupe">
            {new Date().toLocaleDateString('he-IL')}
          </span>

          <button
            onClick={onAddTask}
            className="tact-btn tact-btn-primary"
          >
            <HiPlus size={18} />
            מטלה חדשה
          </button>

          {currentUser && (
            <div className="flex items-center gap-2 pr-2 mr-1 border-r border-warm-border">
              <div className="hidden sm:flex items-center gap-2 text-sm">
                <HiUser size={16} className="text-taupe" />
                <span className="text-warm-ink font-medium">{currentUser.email}</span>
                {currentUser.role === 'admin' && (
                  <span className="tact-badge tact-badge-on">admin</span>
                )}
              </div>
              <a
                href="/logout"
                className="p-2 text-taupe hover:text-accent hover:bg-[rgba(214,74,46,0.12)] rounded-lg transition-colors"
                title="התנתקות"
              >
                <HiLogout size={18} />
              </a>
            </div>
          )}
        </div>
      </header>

      <main className="container py-8">
        {children}
      </main>
    </div>
  )
}
