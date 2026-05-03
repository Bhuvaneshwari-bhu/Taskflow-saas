import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import Spinner from '../components/Spinner'

function RoleBadge({ role }) {
  return (
    <span className={`text-xs font-semibold px-2 py-0.5 rounded-full border
      ${role === 'admin'
        ? 'bg-amber-50 text-amber-700 border-amber-200'
        : 'bg-slate-50 text-slate-500 border-slate-200'
      }`}
    >
      {role === 'admin' ? '★ Admin' : 'Member'}
    </span>
  )
}

function Avatar({ name, email }) {
  const char = (name || email || '?').charAt(0).toUpperCase()
  return (
    <div className="w-8 h-8 rounded-full bg-blue-100 flex items-center justify-center text-blue-600 text-xs font-bold shrink-0">
      {char}
    </div>
  )
}

export default function OrganizationDetail() {
  const { id: orgId } = useParams()
  const navigate      = useNavigate()
  const { user } = useAuth()

  const [org, setOrg]         = useState(null)
  const [projects, setProjects] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  // Add member form
  const [addUserId, setAddUserId] = useState('')
  const [addRole, setAddRole]     = useState('member')
  const [adding, setAdding]       = useState(false)
  const [addError, setAddError]   = useState('')

  // Create project form
  const [showProjectForm, setShowProjectForm]   = useState(false)
  const [newProjectName, setNewProjectName]     = useState('')
  const [newProjectDesc, setNewProjectDesc]     = useState('')
  const [creatingProject, setCreatingProject]   = useState(false)

  const myMember = org?.members.find(
    m => (m.user?._id || m.user)?.toString() === user?._id
  )
  const isAdmin = myMember?.role === 'admin'

  useEffect(() => { loadAll() }, [orgId])

  async function loadAll() {
    setLoading(true)
    setError('')
    try {
      const [orgRes, projRes] = await Promise.all([
        api.get(`/org/${orgId}`),
        api.get(`/projects?orgId=${orgId}`),
      ])
      setOrg(orgRes.data.org)
      setProjects(projRes.data.projects || [])
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to load organization')
    } finally {
      setLoading(false)
    }
  }

  async function handleAddMember(e) {
    e.preventDefault()
    if (!addUserId.trim()) return
    setAdding(true)
    setAddError('')
    try {
      const { data } = await api.post(`/org/${orgId}/members`, {
        userId: addUserId.trim(),
        role: addRole,
      })
      setOrg(data.org)
      setAddUserId('')
      setAddRole('member')
    } catch (err) {
      setAddError(err.response?.data?.message || 'Failed to add member')
    } finally {
      setAdding(false)
    }
  }

  async function handleRemoveMember(userId) {
    if (!confirm('Remove this member from the organization?')) return
    try {
      const { data } = await api.delete(`/org/${orgId}/members/${userId}`)
      setOrg(data.org)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to remove member')
    }
  }

  async function handleCreateProject(e) {
    e.preventDefault()
    if (!newProjectName.trim()) return
    setCreatingProject(true)
    try {
      const { data } = await api.post('/projects', {
        name: newProjectName.trim(),
        description: newProjectDesc,
        orgId,
      })
      setProjects(prev => [data.project, ...prev])
      setNewProjectName('')
      setNewProjectDesc('')
      setShowProjectForm(false)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project')
    } finally {
      setCreatingProject(false)
    }
  }

  if (loading) return (
    <div className="flex flex-1 items-center justify-center py-32">
      <Spinner />
    </div>
  )

  if (!org) return (
    <div className="flex flex-1 items-center justify-center py-32">
      <div className="text-center">
        <p className="text-red-500 text-sm mb-3">{error || 'Organization not found'}</p>
        <button
          onClick={() => navigate('/organizations')}
          className="text-sm text-blue-600 hover:underline"
        >
          ← Back to organizations
        </button>
      </div>
    </div>
  )

  return (
    <>
      {/* Breadcrumb sub-header */}
      <div className="bg-white border-b border-slate-100 px-6 py-2.5 flex items-center gap-2 text-sm">
        <button
          onClick={() => navigate('/organizations')}
          className="text-slate-500 hover:text-slate-800 transition-colors"
        >
          Organizations
        </button>
        <span className="text-slate-300">/</span>
        <span className="font-medium text-slate-700">{org.name}</span>
        {isAdmin && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
            ★ Admin
          </span>
        )}
        <button
          onClick={() => navigate(`/org/${orgId}/activity`)}
          className="ml-auto text-slate-500 hover:text-slate-800 transition-colors"
        >
          Activity Log →
        </button>
      </div>

      <div className="max-w-6xl mx-auto px-6 py-8">
        {error && (
          <div className="flex items-center justify-between bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2 mb-6">
            <span>{error}</span>
            <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 ml-4">✕</button>
          </div>
        )}

        <div className="flex flex-col lg:flex-row gap-6">

          {/* ── LEFT: Projects ──────────────────────────────── */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-bold text-slate-800">Projects</h2>
              <button
                onClick={() => setShowProjectForm(v => !v)}
                className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
              >
                + New Project
              </button>
            </div>

            {showProjectForm && (
              <form
                onSubmit={handleCreateProject}
                className="bg-white border border-slate-200 rounded-xl p-4 mb-4 space-y-3"
              >
                <input
                  value={newProjectName}
                  onChange={e => setNewProjectName(e.target.value)}
                  placeholder="Project name"
                  required
                  autoFocus
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
                <input
                  value={newProjectDesc}
                  onChange={e => setNewProjectDesc(e.target.value)}
                  placeholder="Description (optional)"
                  className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
                />
                <div className="flex gap-2 justify-end">
                  <button
                    type="button"
                    onClick={() => setShowProjectForm(false)}
                    className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={creatingProject}
                    className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold transition-colors"
                  >
                    {creatingProject ? 'Creating…' : 'Create Project'}
                  </button>
                </div>
              </form>
            )}

            {projects.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-16 text-slate-400 bg-white border border-slate-200 rounded-2xl">
                <p className="text-base mb-1">No projects yet</p>
                <p className="text-sm">Create the first project for this organization</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {projects.map(p => (
                  <div
                    key={p._id}
                    className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col gap-3"
                  >
                    <div>
                      <h3 className="font-semibold text-slate-800">{p.name}</h3>
                      {p.description && (
                        <p className="text-sm text-slate-500 mt-1">{p.description}</p>
                      )}
                    </div>
                    <button
                      onClick={() => navigate(`/project/${p._id}`)}
                      className="mt-auto w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg py-2 transition-colors"
                    >
                      Open Project →
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* ── RIGHT: Members ──────────────────────────────── */}
          <div className="w-full lg:w-72 shrink-0">
            <div className="bg-white border border-slate-200 rounded-2xl p-6 sticky top-6">
              <h3 className="font-semibold text-slate-800 mb-4">
                Members
                <span className="ml-2 text-slate-400 font-normal text-sm">
                  ({org.members.length})
                </span>
              </h3>

              <div className="space-y-3">
                {org.members.map(m => {
                  const memberUser = m.user
                  const uid = (memberUser?._id || memberUser)?.toString()
                  const isSelf = uid === user?._id
                  const isOwner = org.owner?.toString() === uid

                  return (
                    <div key={uid} className="flex items-center gap-2.5">
                      <Avatar name={memberUser?.name} email={memberUser?.email} />
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium text-slate-700 truncate">
                          {memberUser?.name || memberUser?.email || uid?.slice(-8)}
                          {isSelf && (
                            <span className="ml-1 text-xs text-slate-400 font-normal">(you)</span>
                          )}
                        </p>
                        {memberUser?.email && memberUser?.name && (
                          <p className="text-xs text-slate-400 truncate">{memberUser.email}</p>
                        )}
                      </div>
                      <RoleBadge role={m.role} />
                      {isAdmin && !isOwner && !isSelf && (
                        <button
                          onClick={() => handleRemoveMember(uid)}
                          className="shrink-0 w-5 h-5 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors rounded"
                          title="Remove member"
                        >
                          <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      )}
                    </div>
                  )
                })}
              </div>

              {/* Add member form — admin only */}
              {isAdmin ? (
                <form onSubmit={handleAddMember} className="mt-6 pt-5 border-t border-slate-100 space-y-2">
                  <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">
                    Add Member
                  </p>
                  {addError && (
                    <p className="text-xs text-red-500 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
                      {addError}
                    </p>
                  )}
                  <input
                    value={addUserId}
                    onChange={e => setAddUserId(e.target.value)}
                    placeholder="User ID"
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500"
                  />
                  <select
                    value={addRole}
                    onChange={e => setAddRole(e.target.value)}
                    className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700"
                  >
                    <option value="member">Member</option>
                    <option value="admin">Admin</option>
                  </select>
                  <button
                    type="submit"
                    disabled={adding}
                    className="w-full py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold transition-colors"
                  >
                    {adding ? 'Adding…' : 'Add Member'}
                  </button>
                </form>
              ) : (
                <p className="mt-5 pt-4 border-t border-slate-100 text-xs text-slate-400">
                  Only admins can manage members.
                </p>
              )}
            </div>
          </div>

        </div>
      </div>
    </>
  )
}
