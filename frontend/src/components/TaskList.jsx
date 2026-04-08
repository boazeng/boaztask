import { HiPencil, HiTrash, HiEye } from 'react-icons/hi'

const urgencyBadge = {
  'דחוף': 'bg-red-500/20 text-red-400 border-red-500/30',
  'גבוה': 'bg-orange-500/20 text-orange-400 border-orange-500/30',
  'בינוני': 'bg-yellow-500/20 text-yellow-400 border-yellow-500/30',
  'נמוך': 'bg-green-500/20 text-green-400 border-green-500/30',
}

const statusBadge = {
  'חדש': 'bg-purple-500/20 text-purple-400',
  'בטיפול': 'bg-yellow-500/20 text-yellow-400',
  'הושלם': 'bg-green-500/20 text-green-400',
  'בוטל': 'bg-gray-500/20 text-gray-400',
}

export default function TaskList({ tasks, onEdit, onDelete, onView }) {
  if (tasks.length === 0) {
    return (
      <div className="bg-gray-900 rounded-xl border border-gray-800 p-12 text-center">
        <p className="text-gray-500 text-lg">לא נמצאו מטלות</p>
        <p className="text-gray-600 text-sm mt-2">צור מטלה חדשה כדי להתחיל</p>
      </div>
    )
  }

  return (
    <div className="bg-gray-900 rounded-xl border border-gray-800 overflow-hidden">
      {/* Desktop table */}
      <div className="hidden md:block overflow-x-auto">
        <table className="w-full">
          <thead>
            <tr className="border-b border-gray-800 text-gray-300 text-lg">
              <th className="text-right px-4 py-3 font-bold">נושא</th>
              <th className="text-right px-4 py-3 font-bold">תת נושא</th>
              <th className="text-right px-4 py-3 font-bold">תיאור</th>
              <th className="text-right px-4 py-3 font-bold">דחיפות</th>
              <th className="text-right px-4 py-3 font-bold">סטטוס</th>
              <th className="text-right px-4 py-3 font-bold">אחראי</th>
              <th className="text-right px-4 py-3 font-bold">קטגוריה 2</th>
              <th className="text-center px-4 py-3 font-bold">פעולות</th>
            </tr>
          </thead>
          <tbody>
            {tasks.map(task => (
              <tr key={task.id} className="border-b border-gray-800/50 hover:bg-gray-800/30 transition-colors text-lg font-bold">
                <td className="px-4 py-3">
                  <button onClick={() => onView(task)} className="text-white hover:text-blue-400 font-bold transition-colors text-right">
                    {task.subject}
                  </button>
                </td>
                <td className="px-4 py-3 text-gray-300">{task.sub_subject || '-'}</td>
                <td className="px-4 py-3 text-gray-300 min-w-[300px] max-w-[400px]">
                  <span className="line-clamp-2">{task.description || '-'}</span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-lg font-bold px-3 py-1.5 rounded-full border ${urgencyBadge[task.urgency] || ''}`}>
                    {task.urgency}
                  </span>
                </td>
                <td className="px-4 py-3">
                  <span className={`text-lg font-bold px-3 py-1.5 rounded-full ${statusBadge[task.status] || ''}`}>
                    {task.status}
                  </span>
                </td>
                <td className="px-4 py-3 text-gray-300">{task.category1 || '-'}</td>
                <td className="px-4 py-3 text-gray-300">{task.category2 || '-'}</td>
                <td className="px-4 py-3">
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => onView(task)} className="p-2 text-gray-400 hover:text-blue-400 hover:bg-blue-400/10 rounded-lg transition-colors" title="צפייה">
                      <HiEye size={20} />
                    </button>
                    <button onClick={() => onEdit(task)} className="p-2 text-gray-400 hover:text-yellow-400 hover:bg-yellow-400/10 rounded-lg transition-colors" title="עריכה">
                      <HiPencil size={20} />
                    </button>
                    <button onClick={() => onDelete(task.id)} className="p-2 text-gray-400 hover:text-red-400 hover:bg-red-400/10 rounded-lg transition-colors" title="מחיקה">
                      <HiTrash size={20} />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile cards */}
      <div className="md:hidden divide-y divide-gray-800">
        {tasks.map(task => (
          <div key={task.id} className="p-4 space-y-2">
            <div className="flex items-start justify-between">
              <button onClick={() => onView(task)} className="text-white font-medium hover:text-blue-400">
                {task.subject}
              </button>
              <span className={`text-xs px-2 py-1 rounded-full border ${urgencyBadge[task.urgency] || ''}`}>
                {task.urgency}
              </span>
            </div>
            {task.sub_subject && <p className="text-gray-500 text-sm">{task.sub_subject}</p>}
            <div className="flex items-center justify-between">
              <span className={`text-xs px-2 py-1 rounded-full ${statusBadge[task.status] || ''}`}>
                {task.status}
              </span>
              <div className="flex gap-1">
                <button onClick={() => onEdit(task)} className="p-1.5 text-gray-400 hover:text-yellow-400 rounded-lg">
                  <HiPencil size={16} />
                </button>
                <button onClick={() => onDelete(task.id)} className="p-1.5 text-gray-400 hover:text-red-400 rounded-lg">
                  <HiTrash size={16} />
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  )
}
