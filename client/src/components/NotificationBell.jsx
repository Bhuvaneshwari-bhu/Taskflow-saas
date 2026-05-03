import { useState, useEffect, useRef } from 'react'
import { io } from 'socket.io-client'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'

const SOCKET_URL = import.meta.env.VITE_SOCKET_URL || 'http://localhost:5000'

function timeAgo(dateStr) {
  const diff = Math.floor((Date.now() - new Date(dateStr)) / 1000)
  if (diff < 60) return `${diff}s ago`
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function NotificationBell() {
  const { user } = useAuth()
  const [notifications, setNotifications] = useState([])
  const [open, setOpen] = useState(false)
  const containerRef = useRef(null)

  const unreadCount = notifications.filter(n => !n.isRead).length

  useEffect(() => {
    api.get('/notifications')
      .then(({ data }) => setNotifications(data.notifications || []))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!user?._id) return

    const socket = io(SOCKET_URL, { transports: ['websocket'] })

    socket.on('connect', () => {
      socket.emit('join-user', user._id)
    })

    socket.on('notification:new', (notification) => {
      setNotifications(prev => [notification, ...prev])
    })

    return () => socket.disconnect()
  }, [user?._id])

  useEffect(() => {
    if (!open) return
    const handle = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  async function handleNotificationClick(notification) {
    if (notification.isRead) return
    try {
      await api.patch(`/notifications/${notification._id}/read`)
      setNotifications(prev =>
        prev.map(n => n._id === notification._id ? { ...n, isRead: true } : n)
      )
    } catch {}
  }

  return (
    <div ref={containerRef} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="relative p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
        aria-label="Notifications"
      >
        <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
        </svg>

        {unreadCount > 0 && (
          <span className="absolute -top-0.5 -right-0.5 min-w-[18px] h-[18px] flex items-center justify-center bg-red-500 text-white text-[10px] font-bold rounded-full px-1 leading-none">
            {unreadCount > 99 ? '99+' : unreadCount}
          </span>
        )}
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-2 w-80 bg-white border border-slate-200 rounded-xl shadow-lg z-50 flex flex-col overflow-hidden">
          <div className="px-4 py-3 border-b border-slate-100 flex items-center justify-between shrink-0">
            <span className="text-sm font-semibold text-slate-800">Notifications</span>
            {unreadCount > 0 && (
              <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                {unreadCount} new
              </span>
            )}
          </div>

          <div className="overflow-y-auto max-h-80 divide-y divide-slate-50">
            {notifications.length === 0 ? (
              <div className="px-4 py-10 text-center">
                <svg className="w-8 h-8 text-slate-300 mx-auto mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                <p className="text-sm text-slate-400">No notifications</p>
              </div>
            ) : (
              notifications.map(n => (
                <button
                  key={n._id}
                  onClick={() => handleNotificationClick(n)}
                  className={`w-full text-left px-4 py-3 flex gap-3 items-start transition-colors hover:bg-slate-50 ${
                    !n.isRead ? 'bg-blue-50/60' : ''
                  }`}
                >
                  <span className={`mt-[7px] w-2 h-2 rounded-full shrink-0 ${
                    !n.isRead ? 'bg-blue-500' : 'bg-slate-200'
                  }`} />
                  <div className="flex-1 min-w-0">
                    <p className={`text-sm leading-snug break-words ${
                      !n.isRead ? 'text-slate-800 font-medium' : 'text-slate-500'
                    }`}>
                      {n.message}
                    </p>
                    <p className="text-xs text-slate-400 mt-1">{timeAgo(n.createdAt)}</p>
                  </div>
                </button>
              ))
            )}
          </div>
        </div>
      )}
    </div>
  )
}
