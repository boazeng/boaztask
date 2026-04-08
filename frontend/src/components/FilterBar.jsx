import { HiSearch, HiFilter } from 'react-icons/hi'

const urgencyOptions = ['הכל', 'דחוף', 'גבוה', 'בינוני', 'נמוך']
const statusOptions = ['הכל', 'חדש', 'בטיפול', 'הושלם', 'בוטל']

export default function FilterBar({ filters, onFilterChange }) {
  const set = (field) => (e) => {
    const val = e.target.value === 'הכל' ? '' : e.target.value
    onFilterChange({ ...filters, [field]: val })
  }

  return (
    <div className="bg-gray-900 rounded-xl p-4 border border-gray-800 flex flex-wrap gap-3 items-center">
      {/* Search */}
      <div className="relative flex-1 min-w-[200px]">
        <HiSearch className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-500" size={18} />
        <input
          type="text"
          value={filters.search || ''}
          onChange={(e) => onFilterChange({ ...filters, search: e.target.value })}
          placeholder="חיפוש..."
          className="w-full bg-gray-800 border border-gray-700 rounded-lg pr-10 pl-4 py-2 text-sm text-white placeholder-gray-500 focus:outline-none focus:border-blue-500"
        />
      </div>

      {/* Status filter */}
      <select
        value={filters.status || 'הכל'}
        onChange={set('status')}
        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
      >
        {statusOptions.map(opt => <option key={opt} value={opt}>{opt === 'הכל' ? 'כל הסטטוסים' : opt}</option>)}
      </select>

      {/* Urgency filter */}
      <select
        value={filters.urgency || 'הכל'}
        onChange={set('urgency')}
        className="bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500"
      >
        {urgencyOptions.map(opt => <option key={opt} value={opt}>{opt === 'הכל' ? 'כל הדחיפויות' : opt}</option>)}
      </select>
    </div>
  )
}
