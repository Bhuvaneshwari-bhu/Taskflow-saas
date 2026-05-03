import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import Spinner from '../components/Spinner'

export default function OrganizationsPage() {
  const { user } = useAuth()
  const navigate = useNavigate()

  const [orgs, setOrgs]       = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  const [showForm, setShowForm] = useState(false)
  const [newName, setNewName]   = useState('')
  const [creating, setCreating] = useState(false)

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

  async function handleCreate(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    try {
      const { data } = await api.post('/org', { name: newName.trim() })
      setOrgs(prev => [data.org, ...prev])
      setNewName('')
      setShowForm(false)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create organization')
    } finally {
      setCreating(false)
    }
  }

  function getMyRole(org) {
    const member = org.members.find(m => m.user?.toString() === user?._id)
    return member?.role || 'member'
  }

  return (
    <>
      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-xl font-bold text-slate-800">Organizations</h1>
            <p className="text-sm text-slate-500 mt-0.5">Select an organization to view its projects</p>
          </div>
          <button
            onClick={() => setShowForm(v => !v)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            + New Organization
          </button>
        </div>

        {showForm && (
          <form
            onSubmit={handleCreate}
            className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex gap-3"
          >
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Organization name"
              required
              autoFocus
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <button
              type="submit"
              disabled={creating}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white text-sm font-semibold px-5 py-2 rounded-lg transition-colors"
            >
              {creating ? 'Creating…' : 'Create'}
            </button>
          </form>
        )}

        {error && (
          <div className="flex items-center justify-between bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2 mb-4">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 ml-4">✕</button>
          </div>
        )}

        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : orgs.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-base mb-1">No organizations yet</p>
            <p className="text-sm">Create one to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {orgs.map(org => {
              const role = getMyRole(org)
              return (
                <div
                  key={org._id}
                  className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col gap-3"
                >
                  <div className="flex items-start justify-between gap-2">
                    <h3 className="font-semibold text-slate-800">{org.name}</h3>
                    <span className={`shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full border
                      ${role === 'admin'
                        ? 'bg-amber-50 text-amber-700 border-amber-200'
                        : 'bg-slate-50 text-slate-500 border-slate-200'
                      }`}
                    >
                      {role === 'admin' ? '★ Admin' : 'Member'}
                    </span>
                  </div>
                  <p className="text-xs text-slate-400">
                    {org.members.length} member{org.members.length !== 1 ? 's' : ''}
                  </p>
                  <button
                    onClick={() => navigate(`/org/${org._id}`)}
                    className="mt-auto w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg py-2 transition-colors"
                  >
                    Open →
                  </button>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </>
  )
}
