import { useState, useEffect } from 'react'

const STATUS_OPTIONS = [
  { value: 'all',         label: 'All Statuses' },
  { value: 'todo',        label: 'To Do'        },
  { value: 'in-progress', label: 'In Progress'  },
  { value: 'done',        label: 'Done'         },
]

export default function TaskFilters({
  searchTerm,
  onSearch,
  selectedStatus,
  onStatusChange,
  assignedFilter,
  onAssignedFilter,
  onClear,
  hasActiveFilters,
  totalCount,
  filteredCount,
}) {
  const [inputValue, setInputValue] = useState(searchTerm)

  // Sync input when parent resets (e.g. clear)
  useEffect(() => { setInputValue(searchTerm) }, [searchTerm])

  // Debounce search — 200 ms
  useEffect(() => {
    const t = setTimeout(() => onSearch(inputValue.trim()), 200)
    return () => clearTimeout(t)
  }, [inputValue])

  return (
    <div className="mb-4 space-y-2">
      <div className="flex flex-wrap items-center gap-2">

        {/* Search */}
        <div className="relative">
          <svg
            className="absolute left-2.5 top-1/2 -translate-y-1/2 w-3.5 h-3.5 text-slate-400 pointer-events-none"
            fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
          >
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
          </svg>
          <input
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            placeholder="Search tasks..."
            className="pl-8 pr-3 py-1.5 text-sm border border-slate-200 rounded-lg outline-none focus:ring-2 focus:ring-blue-500 w-48 bg-white"
          />
        </div>

        {/* Status dropdown */}
        <select
          value={selectedStatus}
          onChange={e => onStatusChange(e.target.value)}
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700"
        >
          {STATUS_OPTIONS.map(o => (
            <option key={o.value} value={o.value}>{o.label}</option>
          ))}
        </select>

        {/* Assigned user filter */}
        <input
          value={assignedFilter}
          onChange={e => onAssignedFilter(e.target.value)}
          placeholder="Assigned to..."
          className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 w-40 bg-white"
        />

        {/* Clear */}
        {hasActiveFilters && (
          <button
            onClick={onClear}
            className="flex items-center gap-1 text-xs text-slate-500 hover:text-red-500 border border-slate-200 hover:border-red-200 rounded-lg px-3 py-1.5 transition-colors bg-white"
          >
            <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
            Clear
          </button>
        )}

        {/* Result count — only when filters are active */}
        {hasActiveFilters && (
          <span className="text-xs text-slate-400 ml-1">
            {filteredCount} of {totalCount} task{totalCount !== 1 ? 's' : ''}
          </span>
        )}
      </div>
    </div>
  )
}
