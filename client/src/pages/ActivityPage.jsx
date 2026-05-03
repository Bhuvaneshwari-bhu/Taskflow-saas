import { useState, useEffect, useRef, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { io } from 'socket.io-client'
import api from '../services/api'
import Spinner from '../components/Spinner'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

// ── Action metadata ────────────────────────────────────────────────────────────

const ACTION_META = {
  TASK_CREATED:    { label: 'Task Created',    color: 'bg-blue-500'   },
  TASK_UPDATED:    { label: 'Task Updated',    color: 'bg-orange-400' },
  TASK_MOVED:      { label: 'Task Moved',      color: 'bg-purple-500' },
  TASK_ASSIGNED:   { label: 'Task Assigned',   color: 'bg-teal-500'   },
  TASK_DELETED:    { label: 'Task Deleted',    color: 'bg-red-500'    },
  PROJECT_CREATED: { label: 'Project Created', color: 'bg-green-500'  },
  MEMBER_ADDED:    { label: 'Member Added',    color: 'bg-amber-500'  },
}

const STATUS_LABELS = {
  'todo':        'To Do',
  'in-progress': 'In Progress',
  'done':        'Done',
}

function formatDescription(activity) {
  const m = activity.metadata || {}
  const title = m.title ? `"${m.title}"` : 'a task'
  switch (activity.action) {
    case 'TASK_CREATED':    return `created task ${title}`
    case 'TASK_UPDATED':    return `updated task ${title}`
    case 'TASK_MOVED':      return `moved ${title} to ${STATUS_LABELS[m.newStatus] || m.newStatus || '—'}`
    case 'TASK_ASSIGNED':   return `assigned ${title} to a member`
    case 'TASK_DELETED':    return `deleted task ${title}`
    case 'PROJECT_CREATED': return `created project "${m.name || 'a project'}"`
    case 'MEMBER_ADDED':    return `added a new member`
    default:                return activity.action
  }
}

// ── Helpers ────────────────────────────────────────────────────────────────────

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60)   return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400)return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

function userName(userId) {
  if (!userId) return 'Unknown'
  if (typeof userId === 'object') return userId.name || userId.email || String(userId._id).slice(-8)
  return String(userId).slice(-8)
}

function userInitial(userId) {
  if (!userId) return '?'
  if (typeof userId === 'object') {
    return (userId.name || userId.email || '?').charAt(0).toUpperCase()
  }
  return String(userId).slice(-1).toUpperCase()
}

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-purple-500', 'bg-green-500',
  'bg-orange-500', 'bg-pink-500', 'bg-teal-500', 'bg-rose-500',
]

function avatarColor(userId) {
  const id = typeof userId === 'object' ? String(userId._id || '') : String(userId || '')
  return AVATAR_COLORS[parseInt(id.slice(-1), 16) % AVATAR_COLORS.length]
}

// ── ActivityRow ────────────────────────────────────────────────────────────────

function ActivityRow({ activity }) {
  const meta  = ACTION_META[activity.action] || { label: activity.action, color: 'bg-slate-400' }
  const actor = activity.userId

  return (
    <div className="flex items-start gap-3 px-5 py-3.5 hover:bg-slate-50 transition-colors">
      {/* User avatar */}
      <div className={`w-8 h-8 rounded-full ${avatarColor(actor)} flex items-center justify-center text-white text-xs font-bold shrink-0 mt-0.5`}>
        {userInitial(actor)}
      </div>

      {/* Body */}
      <div className="flex-1 min-w-0">
        <p className="text-sm text-slate-800 leading-snug">
          <span className="font-semibold">{userName(actor)}</span>
          {' '}
          <span className="text-slate-600">{formatDescription(activity)}</span>
        </p>
        <div className="flex items-center gap-2 mt-1">
          <span className={`inline-block w-1.5 h-1.5 rounded-full ${meta.color}`} />
          <span className="text-xs text-slate-400">{meta.label}</span>
        </div>
      </div>

      {/* Timestamp */}
      <span className="text-xs text-slate-400 shrink-0 mt-0.5 tabular-nums whitespace-nowrap">
        {timeAgo(activity.createdAt)}
      </span>
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function ActivityPage() {
  const { id: orgId } = useParams()
  const navigate      = useNavigate()

  const [orgName, setOrgName]         = useState('')
  const [activities, setActivities]   = useState([])
  const [loading, setLoading]         = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [error, setError]             = useState('')
  const [pagination, setPagination]   = useState({ page: 1, hasMore: false, total: 0 })

  const [actionFilter, setActionFilter] = useState('')

  const pageRef = useRef(1)

  // Fetch a page of logs, optionally appending (load more)
  const fetchLogs = useCallback(async ({ page = 1, append = false, action = actionFilter } = {}) => {
    try {
      const params = new URLSearchParams({ page, limit: 20 })
      if (action) params.set('action', action)

      const { data } = await api.get(`/activity/${orgId}?${params}`)
      const incoming = data.activities || []

      setActivities(prev => append ? [...prev, ...incoming] : incoming)
      setPagination(data.pagination)
      pageRef.current = page
      setError('')
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load activity')
    }
  }, [orgId, actionFilter])

  // Initial load — also fetch org name
  useEffect(() => {
    const init = async () => {
      setLoading(true)
      try {
        const [, ] = await Promise.all([
          fetchLogs({ page: 1 }),
          api.get(`/org/${orgId}`).then(({ data }) => setOrgName(data.org?.name || '')),
        ])
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [orgId])

  // Re-fetch from page 1 when filter changes
  useEffect(() => {
    if (loading) return
    setLoading(true)
    fetchLogs({ page: 1, action: actionFilter }).finally(() => setLoading(false))
  }, [actionFilter])

  // Socket.IO — real-time prepend
  useEffect(() => {
    const socket = io(SOCKET_URL, { transports: ['websocket'] })
    socket.on('connect', () => socket.emit('join-org', orgId))
    socket.on('activity:new', (log) => {
      setActivities(prev => [log, ...prev])
      setPagination(p => ({ ...p, total: p.total + 1 }))
    })
    return () => socket.disconnect()
  }, [orgId])

  async function loadMore() {
    setLoadingMore(true)
    await fetchLogs({ page: pageRef.current + 1, append: true })
    setLoadingMore(false)
  }

  function handleFilterChange(action) {
    setActionFilter(action)
  }

  return (
    <>
      {/* Breadcrumb sub-header */}
      <div className="bg-white border-b border-slate-100 px-6 py-2.5 flex items-center gap-2 text-sm">
        <button
          onClick={() => navigate(`/org/${orgId}`)}
          className="text-slate-500 hover:text-slate-800 transition-colors"
        >
          {orgName || 'Organization'}
        </button>
        <span className="text-slate-300">/</span>
        <span className="font-medium text-slate-700">Activity Log</span>
      </div>

      <div className="max-w-3xl mx-auto px-6 py-8">
        {/* Header + filter bar */}
        <div className="flex flex-wrap items-center justify-between gap-3 mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Activity Log</h1>
            {!loading && (
              <p className="text-sm text-slate-500 mt-0.5">
                {pagination.total} event{pagination.total !== 1 ? 's' : ''} recorded
              </p>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={actionFilter}
              onChange={e => handleFilterChange(e.target.value)}
              className="text-sm border border-slate-200 rounded-lg px-3 py-1.5 outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700"
            >
              <option value="">All Actions</option>
              {Object.entries(ACTION_META).map(([value, { label }]) => (
                <option key={value} value={value}>{label}</option>
              ))}
            </select>

            {actionFilter && (
              <button
                onClick={() => handleFilterChange('')}
                className="text-xs text-slate-500 hover:text-red-500 border border-slate-200 hover:border-red-200 rounded-lg px-3 py-1.5 transition-colors bg-white"
              >
                Clear
              </button>
            )}
          </div>
        </div>

        {error && (
          <div className="flex items-center justify-between bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-3 mb-6">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 ml-4">✕</button>
          </div>
        )}

        {/* Activity list card */}
        <div className="bg-white border border-slate-200 rounded-2xl overflow-hidden">
          {loading ? (
            <div className="flex justify-center py-16">
              <Spinner />
            </div>
          ) : activities.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-16 text-center">
              <svg className="w-10 h-10 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <p className="text-sm font-medium text-slate-500">No activity yet</p>
              <p className="text-xs text-slate-400 mt-1">
                {actionFilter ? 'No events match the selected filter' : 'Actions will appear here as they happen'}
              </p>
            </div>
          ) : (
            <div className="divide-y divide-slate-100">
              {activities.map((a, i) => (
                <ActivityRow key={`${a._id}-${i}`} activity={a} />
              ))}
            </div>
          )}
        </div>

        {/* Load More */}
        {!loading && pagination.hasMore && (
          <div className="flex justify-center mt-6">
            <button
              onClick={loadMore}
              disabled={loadingMore}
              className="flex items-center gap-2 text-sm font-medium text-slate-600 hover:text-slate-800 border border-slate-200 hover:border-slate-300 bg-white rounded-lg px-5 py-2.5 transition-colors disabled:opacity-60"
            >
              {loadingMore ? (
                <>
                  <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8H4z" />
                  </svg>
                  Loading…
                </>
              ) : (
                'Load More'
              )}
            </button>
          </div>
        )}
      </div>
    </>
  )
}
