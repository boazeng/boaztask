import { HiSearch } from 'react-icons/hi'

const urgencyOptions = ['הכל', 'דחוף', 'גבוה', 'בינוני', 'נמוך']
const statusOptions = ['הכל', 'חדש', 'בטיפול', 'הושלם', 'בוטל']

export default function FilterBar({ filters, onFilterChange }) {
  const set = (field) => (e) => {
    const val = e.target.value === 'הכל' ? '' : e.target.value
    onFilterChange({ ...filters, [field]: val })
  }

  return (
    <div className="bg-cream-white rounded-2xl border border-warm-border p-3 flex flex-wrap gap-3 items-center shadow-sm">
      <div className="relative flex-1 min-w-[200px]">
        <HiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-taupe pointer-events-none" size={18} />
        <input
          type="text"
          value={filters.search || ''}
          onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          placeholder="חיפוש..."
          className="tact-field pr-10"
        />
      </div>

      <select
        value={filters.status || 'הכל'}
        onChange={set('status')}
        className="tact-field max-w-[180px]"
      >
        {statusOptions.map(opt => <option key={opt} value={opt}>{opt === 'הכל' ? 'כל הסטטוסים' : opt}</option>)}
      </select>

      <select
        value={filters.urgency || 'הכל'}
        onChange={set('urgency')}
        className="tact-field max-w-[180px]"
      >
        {urgencyOptions.map(opt => <option key={opt} value={opt}>{opt === 'הכל' ? 'כל הדחיפויות' : opt}</option>)}
      </select>
    </div>
  )
}
