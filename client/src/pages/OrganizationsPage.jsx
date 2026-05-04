import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import { useOrg } from '../context/OrgContext'
import Spinner from '../components/Spinner'

function roleBadgeProps(role) {
  if (role === 'owner') return { label: '★ Owner', cls: 'bg-amber-50 text-amber-700 border-amber-200' }
  if (role === 'admin') return { label: '★ Admin', cls: 'bg-amber-50 text-amber-700 border-amber-200' }
  return { label: 'Member', cls: 'bg-slate-50 text-slate-500 border-slate-200' }
}

// ── Onboarding screen (zero organizations) ─────────────────────────────────────

function OnboardingScreen({ user, onCreated, onJoined }) {
  const [mode, setMode]         = useState(null) // 'create' | 'join'
  const [newName, setNewName]   = useState('')
  const [creating, setCreating] = useState(false)
  const [createErr, setCreateErr] = useState('')

  const [code, setCode]       = useState('')
  const [joining, setJoining] = useState(false)
  const [joinErr, setJoinErr] = useState('')

  function toggleMode(next) {
    setMode(m => m === next ? null : next)
    setCreateErr('')
    setJoinErr('')
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    setCreateErr('')
    try {
      const { data } = await api.post('/org', { name: newName.trim() })
      onCreated(data.org)
    } catch (err) {
      setCreateErr(err.response?.data?.message || 'Failed to create organization')
    } finally {
      setCreating(false)
    }
  }

  async function handleJoin(e) {
    e.preventDefault()
    if (!code.trim()) return
    setJoining(true)
    setJoinErr('')
    try {
      const { data } = await api.post('/org/join', { inviteCode: code.trim() })
      onJoined(data.org)
    } catch (err) {
      setJoinErr(err.response?.data?.message || 'Invalid invite code')
    } finally {
      setJoining(false)
    }
  }

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] px-4">
      {/* Icon */}
      <div className="w-16 h-16 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center mb-5">
        <svg className="w-8 h-8 text-blue-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 21h19.5m-18-18v18m10.5-18v18m6-13.5V21M6.75 6.75h.75m-.75 3h.75m-.75 3h.75m3-6h.75m-.75 3h.75m-.75 3h.75M6.75 21v-3.375c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125V21M3 3h12m-.75 4.5H21m-3.75 3.75h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008zm0 3h.008v.008h-.008v-.008z" />
        </svg>
      </div>

      <h1 className="text-xl font-bold text-slate-800 mb-1">
        Welcome{user?.name ? `, ${user.name}` : ''}!
      </h1>
      <p className="text-sm text-slate-500 text-center max-w-sm mb-8">
        You're not part of any organization yet. Create a new one to get started, or join an existing one with an invite code.
      </p>

      {/* Action buttons */}
      <div className="flex gap-3 flex-wrap justify-center">
        <button
          onClick={() => toggleMode('create')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-colors
            ${mode === 'create'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:text-blue-600'
            }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 4.5v15m7.5-7.5h-15" />
          </svg>
          Create Organization
        </button>
        <button
          onClick={() => toggleMode('join')}
          className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-semibold border transition-colors
            ${mode === 'join'
              ? 'bg-blue-600 text-white border-blue-600'
              : 'bg-white text-slate-700 border-slate-200 hover:border-blue-300 hover:text-blue-600'
            }`}
        >
          <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
          </svg>
          Join with Invite Code
        </button>
      </div>

      {/* Inline forms */}
      {mode === 'create' && (
        <form onSubmit={handleCreate} className="mt-5 w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <p className="text-sm font-semibold text-slate-700">New Organization</p>
          {createErr && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{createErr}</p>
          )}
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Organization name"
            required
            autoFocus
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={creating}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
          >
            {creating ? 'Creating…' : 'Create Organization'}
          </button>
        </form>
      )}

      {mode === 'join' && (
        <form onSubmit={handleJoin} className="mt-5 w-full max-w-sm bg-white border border-slate-200 rounded-2xl p-5 shadow-sm space-y-3">
          <p className="text-sm font-semibold text-slate-700">Join Organization</p>
          {joinErr && (
            <p className="text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">{joinErr}</p>
          )}
          <input
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Enter invite code"
            required
            autoFocus
            className="w-full border border-slate-200 rounded-lg px-3 py-2.5 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="submit"
            disabled={joining}
            className="w-full py-2.5 rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold transition-colors"
          >
            {joining ? 'Joining…' : 'Join Organization'}
          </button>
        </form>
      )}
    </div>
  )
}

// ── Main page ──────────────────────────────────────────────────────────────────

export default function OrganizationsPage() {
  const { user }         = useAuth()
  const { setActiveOrg } = useOrg()
  const navigate         = useNavigate()

  const [orgs, setOrgs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  // For the "has orgs" view action bar
  const [mode, setMode]         = useState(null) // 'create' | 'join'
  const [newName, setNewName]   = useState('')
  const [creating, setCreating] = useState(false)
  const [code, setCode]         = useState('')
  const [joining, setJoining]   = useState(false)

  useEffect(() => { fetchOrgs() }, [])

  async function fetchOrgs() {
    try {
      const { data } = await api.get('/org')
      setOrgs(data.orgs || [])
    } catch {
      setError('Failed to load organizations')
    } finally {
      setLoading(false)
    }
  }

  function handleCreated(org) {
    setActiveOrg(org)
    navigate(`/org/${org._id}`)
  }

  function handleJoined(org) {
    setActiveOrg(org)
    navigate(`/org/${org._id}`)
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    setError('')
    try {
      const { data } = await api.post('/org', { name: newName.trim() })
      handleCreated(data.org)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create organization')
      setCreating(false)
    }
  }

  async function handleJoin(e) {
    e.preventDefault()
    if (!code.trim()) return
    setJoining(true)
    setError('')
    try {
      const { data } = await api.post('/org/join', { inviteCode: code.trim() })
      handleJoined(data.org)
    } catch (err) {
      setError(err.response?.data?.message || 'Invalid invite code')
      setJoining(false)
    }
  }

  function getMyRole(org) {
    const ownerId = String(org.owner?._id ?? org.owner)
    if (ownerId === user?._id) return 'owner'
    const member = org.members.find(m => String(m.user?._id ?? m.user) === user?._id)
    return member?.role ?? 'member'
  }

  function handleOpen(org) {
    setActiveOrg(org)
    navigate(`/org/${org._id}`)
  }

  function toggleMode(next) {
    setMode(m => m === next ? null : next)
    setError('')
  }

  if (loading) return (
    <div className="flex flex-1 items-center justify-center py-32"><Spinner /></div>
  )

  // ── Zero-org onboarding ──────────────────────────────────────────────────────
  if (orgs.length === 0) {
    return (
      <OnboardingScreen
        user={user}
        onCreated={handleCreated}
        onJoined={handleJoined}
      />
    )
  }

  // ── Normal view (has orgs) ───────────────────────────────────────────────────
  return (
    <div className="max-w-5xl mx-auto px-6 py-8">
      {/* Header */}
      <div className="flex items-start justify-between mb-6 gap-4 flex-wrap">
        <div>
          <h1 className="text-xl font-bold text-slate-800">Organizations</h1>
          <p className="text-sm text-slate-500 mt-0.5">Select an organization to view its projects</p>
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => toggleMode('join')}
            className={`flex items-center gap-1.5 text-sm font-medium px-4 py-2 rounded-lg border transition-colors
              ${mode === 'join'
                ? 'bg-slate-800 text-white border-slate-800'
                : 'bg-white text-slate-600 border-slate-200 hover:border-slate-300 hover:text-slate-800'
              }`}
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M13.19 8.688a4.5 4.5 0 011.242 7.244l-4.5 4.5a4.5 4.5 0 01-6.364-6.364l1.757-1.757m13.35-.622l1.757-1.757a4.5 4.5 0 00-6.364-6.364l-4.5 4.5a4.5 4.5 0 001.242 7.244" />
            </svg>
            Join
          </button>
          <button
            onClick={() => toggleMode('create')}
            className={`flex items-center gap-1.5 text-sm font-semibold px-4 py-2 rounded-lg transition-colors
              ${mode === 'create'
                ? 'bg-blue-700 text-white'
                : 'bg-blue-600 hover:bg-blue-700 text-white'
              }`}
          >
            + New Organization
          </button>
        </div>
      </div>

      {/* Inline forms */}
      {mode === 'create' && (
        <form onSubmit={handleCreate} className="bg-white border border-slate-200 rounded-xl p-4 mb-5 flex gap-3 items-center">
          <input
            value={newName}
            onChange={e => setNewName(e.target.value)}
            placeholder="Organization name"
            required
            autoFocus
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" disabled={creating}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors whitespace-nowrap">
            {creating ? 'Creating…' : 'Create'}
          </button>
        </form>
      )}

      {mode === 'join' && (
        <form onSubmit={handleJoin} className="bg-white border border-slate-200 rounded-xl p-4 mb-5 flex gap-3 items-center">
          <input
            value={code}
            onChange={e => setCode(e.target.value)}
            placeholder="Enter invite code"
            required
            autoFocus
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button type="submit" disabled={joining}
            className="bg-slate-800 hover:bg-slate-900 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors whitespace-nowrap">
            {joining ? 'Joining…' : 'Join'}
          </button>
        </form>
      )}

      {/* Error banner */}
      {error && (
        <div className="flex items-center justify-between bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2 mb-4">
          <span>{error}</span>
          <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 ml-4">✕</button>
        </div>
      )}

      {/* Org grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {orgs.map(org => {
          const role = getMyRole(org)
          const { label, cls } = roleBadgeProps(role)
          return (
            <div
              key={org._id}
              className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col gap-3"
            >
              <div className="flex items-start justify-between gap-2">
                <h3 className="font-semibold text-slate-800">{org.name}</h3>
                <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full border ${cls}`}>
                  {label}
                </span>
              </div>
              <p className="text-xs text-slate-400">
                {org.members.length} member{org.members.length !== 1 ? 's' : ''}
              </p>
              <button
                onClick={() => handleOpen(org)}
                className="mt-auto w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg py-2 transition-colors"
              >
                Open →
              </button>
            </div>
          )
        })}
      </div>
    </div>
  )
}
