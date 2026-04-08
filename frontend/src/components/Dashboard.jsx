import { HiClipboardList, HiClock, HiCheckCircle, HiExclamation } from 'react-icons/hi'

const urgencyColors = {
  'דחוף': 'text-red-400 bg-red-400/10',
  'גבוה': 'text-orange-400 bg-orange-400/10',
  'בינוני': 'text-yellow-400 bg-yellow-400/10',
  'נמוך': 'text-green-400 bg-green-400/10',
}

export default function Dashboard({ stats, tasks }) {
  const statCards = [
    { label: 'סה"כ מטלות', value: stats.total, icon: HiClipboardList, color: 'text-blue-400 bg-blue-400/10' },
    { label: 'חדשות', value: stats.by_status?.['חדש'] || 0, icon: HiExclamation, color: 'text-purple-400 bg-purple-400/10' },
    { label: 'בטיפול', value: stats.by_status?.['בטיפול'] || 0, icon: HiClock, color: 'text-yellow-400 bg-yellow-400/10' },
    { label: 'הושלמו', value: stats.by_status?.['הושלם'] || 0, icon: HiCheckCircle, color: 'text-green-400 bg-green-400/10' },
  ]

  const recentTasks = tasks.slice(0, 5)

  return (
    <div className="space-y-6">
      {/* Stats Grid */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {statCards.map(card => (
          <div key={card.label} className="bg-gray-900 rounded-xl p-5 border border-gray-800">
            <div className={`w-10 h-10 rounded-lg flex items-center justify-center mb-3 ${card.color}`}>
              <card.icon size={22} />
            </div>
            <p className="text-2xl font-bold text-white">{card.value}</p>
            <p className="text-sm text-gray-400 mt-1">{card.label}</p>
          </div>
        ))}
      </div>

      {/* Urgency breakdown */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h3 className="text-lg font-semibold text-gray-200 mb-4">לפי דחיפות</h3>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
          {Object.entries(stats.by_urgency || {}).map(([level, count]) => (
            <div key={level} className={`rounded-lg p-4 ${urgencyColors[level] || 'bg-gray-800'}`}>
              <p className="text-xl font-bold">{count}</p>
              <p className="text-sm opacity-80">{level}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Recent Tasks */}
      <div className="bg-gray-900 rounded-xl p-6 border border-gray-800">
        <h3 className="text-lg font-semibold text-gray-200 mb-4">מטלות אחרונות</h3>
        {recentTasks.length === 0 ? (
          <p className="text-gray-500 text-center py-8">אין מטלות עדיין. צור מטלה חדשה כדי להתחיל!</p>
        ) : (
          <div className="space-y-2">
            {recentTasks.map(task => (
              <div key={task.id} className="flex items-center justify-between p-3 rounded-lg bg-gray-800/50 hover:bg-gray-800 transition-colors">
                <div className="flex items-center gap-3">
                  <span className={`w-2 h-2 rounded-full ${
                    task.urgency === 'דחוף' ? 'bg-red-400' :
                    task.urgency === 'גבוה' ? 'bg-orange-400' :
                    task.urgency === 'בינוני' ? 'bg-yellow-400' : 'bg-green-400'
                  }`} />
                  <span className="text-gray-200">{task.subject}</span>
                  {task.sub_subject && <span className="text-gray-500 text-sm">/ {task.sub_subject}</span>}
                </div>
                <span className={`text-xs px-2 py-1 rounded-full ${
                  task.status === 'חדש' ? 'bg-purple-500/20 text-purple-400' :
                  task.status === 'בטיפול' ? 'bg-yellow-500/20 text-yellow-400' :
                  task.status === 'הושלם' ? 'bg-green-500/20 text-green-400' : 'bg-gray-500/20 text-gray-400'
                }`}>
                  {task.status}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
