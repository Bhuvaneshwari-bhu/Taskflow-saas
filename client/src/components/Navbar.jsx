import { useState, useRef, useEffect } from 'react'
import { Link, useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import { useOrg } from '../context/OrgContext'
import NotificationBell from './NotificationBell'

// ── User dropdown ──────────────────────────────────────────────────────────────

function UserMenu({ user, onLogout }) {
  const [open, setOpen] = useState(false)
  const ref             = useRef(null)
  const navigate        = useNavigate()

  const initials = (user?.name || user?.email || 'U')
    .split(' ')
    .slice(0, 2)
    .map(w => w[0])
    .join('')
    .toUpperCase()

  useEffect(() => {
    if (!open) return
    const handle = e => {
      if (ref.current && !ref.current.contains(e.target)) setOpen(false)
    }
    document.addEventListener('mousedown', handle)
    return () => document.removeEventListener('mousedown', handle)
  }, [open])

  return (
    <div ref={ref} className="relative">
      <button
        onClick={() => setOpen(v => !v)}
        className="flex items-center gap-1.5 px-2 py-1.5 rounded-lg hover:bg-slate-100 transition-colors"
        aria-label="User menu"
      >
        <div className="w-7 h-7 rounded-full bg-blue-600 text-white text-xs font-bold flex items-center justify-center shrink-0">
          {initials}
        </div>
        <svg
          className={`w-3 h-3 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="currentColor" viewBox="0 0 20 20"
        >
          <path fillRule="evenodd" d="M5.293 7.293a1 1 0 011.414 0L10 10.586l3.293-3.293a1 1 0 111.414 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 010-1.414z" clipRule="evenodd" />
        </svg>
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-56 bg-white rounded-xl border border-slate-200 shadow-lg z-50 py-1 overflow-hidden">
          {/* Identity */}
          <div className="px-4 py-3 border-b border-slate-100">
            {user?.name && (
              <p className="text-sm font-semibold text-slate-800 truncate">{user.name}</p>
            )}
            <p className="text-xs text-slate-500 mt-0.5 truncate">{user?.email}</p>
          </div>

          {/* Profile */}
          <button
            onClick={() => { navigate('/profile'); setOpen(false) }}
            className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <svg className="w-4 h-4 text-slate-400 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z" />
            </svg>
            Profile
          </button>

          {/* Sign out */}
          <div className="border-t border-slate-100 mt-1">
            <button
              onClick={() => { onLogout(); setOpen(false) }}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm text-red-600 hover:bg-red-50 transition-colors"
            >
              <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 9V5.25A2.25 2.25 0 0013.5 3h-6a2.25 2.25 0 00-2.25 2.25v13.5A2.25 2.25 0 007.5 21h6a2.25 2.25 0 002.25-2.25V15M12 9l-3 3m0 0l3 3m-3-3h12.75" />
              </svg>
              Sign out
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

// ── Navbar ─────────────────────────────────────────────────────────────────────

export default function Navbar() {
  const { user, logout } = useAuth()
  const { activeOrg }    = useOrg()
  const location         = useLocation()

  const orgsActive = location.pathname === '/organizations'
  const orgActive  = activeOrg && (
    location.pathname.startsWith(`/org/${activeOrg._id}`) ||
    location.pathname.startsWith('/project/')
  )

  const linkClass = (active) =>
    `px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${
      active
        ? 'bg-slate-100 text-slate-900'
        : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
    }`

  return (
    <nav className="bg-white border-b border-slate-200 px-4 sm:px-6 h-14 flex items-center shrink-0 sticky top-0 z-40">
      {/* Logo */}
      <Link
        to="/organizations"
        className="font-bold text-slate-800 text-base mr-4 sm:mr-6 hover:text-blue-600 transition-colors"
      >
        TaskFlow
      </Link>

      {/* Primary nav links */}
      <div className="hidden sm:flex items-center gap-0.5">
        <Link to="/organizations" className={linkClass(orgsActive)}>
          Organizations
        </Link>

        {/* Show active org as a nav item; divider only when org is active */}
        {activeOrg && (
          <>
            <span className="text-slate-300 text-sm mx-1">/</span>
            <Link to={`/org/${activeOrg._id}`} className={linkClass(!!orgActive)}>
              {activeOrg.name}
            </Link>
          </>
        )}
      </div>

      {/* Right section */}
      <div className="ml-auto flex items-center gap-1">
        {/* Switch org shortcut when inside an org */}
        {activeOrg && (
          <Link
            to="/organizations"
            className="hidden sm:flex items-center gap-1 px-2.5 py-1.5 text-xs text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-lg transition-colors"
            title="Switch organization"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 21L3 16.5m0 0L7.5 12M3 16.5h13.5m0-13.5L21 7.5m0 0L16.5 3M21 7.5H7.5" />
            </svg>
            Switch
          </Link>
        )}
        <NotificationBell />
        <UserMenu user={user} onLogout={logout} />
      </div>
    </nav>
  )
}
