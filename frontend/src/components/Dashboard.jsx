import TactIcon from './TactIcon'

const URGENCY_COLOR = {
  'דחוף': '#D64A2E',
  'גבוה': '#E07A52',
  'בינוני': '#1F3A5F',
  'נמוך': '#2F8F5B',
}

const STATUS_BADGE = {
  'חדש': 'tact-badge-new',
  'בטיפול': 'tact-badge-warn',
  'הושלם': 'tact-badge-pos',
  'בוטל': 'tact-badge-muted',
}

export default function Dashboard({ stats, tasks }) {
  const kpis = [
    { label: 'סה"כ מטלות', value: stats.total, sub: 'כל המטלות במערכת' },
    { label: 'חדשות', value: stats.by_status?.['חדש'] || 0, sub: 'ממתינות לטיפול' },
    { label: 'בטיפול', value: stats.by_status?.['בטיפול'] || 0, sub: 'בעבודה כעת' },
    { label: 'הושלמו', value: stats.by_status?.['הושלם'] || 0, sub: 'נסגרו בהצלחה' },
  ]

  const totalByUrgency = Object.values(stats.by_urgency || {}).reduce((a, b) => a + b, 0)
  const recentTasks = tasks.slice(0, 5)

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        {kpis.map(kpi => (
          <div key={kpi.label} className="tact-kpi">
            <div className="tact-kpi-label">{kpi.label}</div>
            <div className="tact-kpi-val">{kpi.value}</div>
            <div className="tact-kpi-sub">{kpi.sub}</div>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <section className="tact-card tone-blue">
          <div className="tact-card-cap">
            <div className="flex items-center gap-3">
              <span className="tact-card-ico">
                <TactIcon name="target" size={18} />
              </span>
              <h3 className="font-bold text-warm-ink">לפי דחיפות</h3>
            </div>
            <span className="tact-badge tact-badge-on">{totalByUrgency} סה"כ</span>
          </div>
          <div className="tact-card-body">
            <div className="grid grid-cols-2 gap-3">
              {['דחוף', 'גבוה', 'בינוני', 'נמוך'].map(level => (
                <div key={level} className="flex items-center justify-between p-3 bg-cream-white rounded-xl border border-warm-border">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full" style={{ background: URGENCY_COLOR[level] }} />
                    <span className="font-semibold text-warm-ink">{level}</span>
                  </div>
                  <span className="font-en font-bold text-xl text-primary">{stats.by_urgency?.[level] || 0}</span>
                </div>
              ))}
            </div>
          </div>
        </section>

        <section className="tact-card tone-steel">
          <div className="tact-card-cap">
            <div className="flex items-center gap-3">
              <span className="tact-card-ico">
                <TactIcon name="clock" size={18} />
              </span>
              <h3 className="font-bold text-warm-ink">מטלות אחרונות</h3>
            </div>
            <span className="tact-badge tact-badge-soon">{recentTasks.length} מוצגות</span>
          </div>
          <div className="tact-card-body">
            {recentTasks.length === 0 ? (
              <p className="text-taupe text-center py-6">אין מטלות עדיין. צור מטלה חדשה כדי להתחיל!</p>
            ) : (
              <div className="space-y-2">
                {recentTasks.map(task => (
                  <div key={task.id} className="flex items-center justify-between gap-3 p-3 bg-cream-white rounded-xl border border-warm-border hover:border-primary-soft transition-colors">
                    <div className="flex items-center gap-3 min-w-0">
                      <span className="w-2 h-2 rounded-full shrink-0" style={{ background: URGENCY_COLOR[task.urgency] || '#9b9588' }} />
                      <span className="text-warm-ink font-medium truncate">{task.subject}</span>
                      {task.sub_subject && <span className="text-taupe text-sm truncate">/ {task.sub_subject}</span>}
                    </div>
                    <span className={`tact-badge ${STATUS_BADGE[task.status] || 'tact-badge-muted'} shrink-0`}>
                      {task.status}
                    </span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      </div>
    </div>
  )
}
