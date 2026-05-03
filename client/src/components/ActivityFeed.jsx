import { useState, useEffect, useCallback } from 'react'
import api from '../services/api'
import Spinner from './Spinner'

const COLORS = [
  'bg-blue-500', 'bg-purple-500', 'bg-green-500',
  'bg-orange-500', 'bg-pink-500', 'bg-teal-500', 'bg-rose-500',
]

function avatar(userId) {
  const id    = String(userId || '')
  const color = COLORS[parseInt(id.slice(-1), 16) % COLORS.length]
  const label = id.slice(-2).toUpperCase() || '??'
  return { color, label }
}

function timeAgo(dateStr) {
  const diff = Date.now() - new Date(dateStr)
  const s = Math.floor(diff / 1000)
  if (s < 60)  return `${s}s ago`
  const m = Math.floor(s / 60)
  if (m < 60)  return `${m}m ago`
  const h = Math.floor(m / 60)
  if (h < 24)  return `${h}h ago`
  return `${Math.floor(h / 24)}d ago`
}

function formatMessage(activity) {
  const action = activity.action || ''
  const meta   = activity.meta  || {}

  switch (action) {
    case 'created task':    return `Created task${meta.title   ? ` "${meta.title}"`    : ''}`
    case 'deleted task':    return `Deleted task${meta.title   ? ` "${meta.title}"`    : ''}`
    case 'updated status':  return `Updated status to ${meta.status || 'unknown'}`
    case 'assigned user':   return `Assigned user to task`
    case 'added member':    return `Added a new member`
    default:                return action
  }
}

const ENTITY_ICON = {
  task:    '📋',
  comment: '💬',
  member:  '👤',
}

export default function ActivityFeed({ projectId, refreshTrigger }) {
  const [activities, setActivities] = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')

  const fetchActivities = useCallback(async () => {
    try {
      const { data } = await api.get(`/projects/${projectId}/activity`)
      setActivities(data.activities || [])
      setError('')
    } catch {
      setError('Failed to load activity')
    } finally {
      setLoading(false)
    }
  }, [projectId])

  // Fetch on mount, on refreshTrigger change, and every 10s
  useEffect(() => {
    fetchActivities()
  }, [fetchActivities, refreshTrigger])

  useEffect(() => {
    const timer = setInterval(fetchActivities, 10_000)
    return () => clearInterval(timer)
  }, [fetchActivities])

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="px-4 py-3 border-b border-slate-200 flex items-center justify-between shrink-0">
        <span className="text-sm font-semibold text-slate-700">Activity</span>
        <button
          onClick={fetchActivities}
          title="Refresh"
          className="text-slate-400 hover:text-slate-600 text-xs transition-colors"
        >
          ↻
        </button>
      </div>

      {/* Body */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="flex justify-center py-8">
            <Spinner size="sm" />
          </div>
        ) : error ? (
          <p className="text-xs text-red-400 text-center py-8 px-4">{error}</p>
        ) : activities.length === 0 ? (
          <p className="text-xs text-slate-400 text-center py-8 px-4">
            No activity yet. Actions will appear here.
          </p>
        ) : (
          <ul className="divide-y divide-slate-100">
            {activities.map(a => {
              const userId       = a.user?._id ?? a.user ?? ''
              const { color, label } = avatar(userId)
              const icon         = ENTITY_ICON[a.entity] ?? '•'

              return (
                <li key={a._id} className="flex gap-3 px-4 py-3 hover:bg-slate-50 transition-colors">
                  {/* Avatar */}
                  <div className={`w-7 h-7 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5`}>
                    {label}
                  </div>

                  {/* Content */}
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-slate-700 leading-snug">
                      <span className="mr-1">{icon}</span>
                      {formatMessage(a)}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5 font-mono truncate">
                      {String(userId).slice(-8)}
                    </p>
                  </div>

                  {/* Timestamp */}
                  <span className="text-xs text-slate-400 shrink-0 mt-0.5 tabular-nums">
                    {timeAgo(a.createdAt)}
                  </span>
                </li>
              )
            })}
          </ul>
        )}
      </div>
    </div>
  )
}
