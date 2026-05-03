import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import { useAuth } from '../context/AuthContext'
import useRole from '../hooks/useRole'
import MemberList from '../components/MemberList'
import Spinner from '../components/Spinner'

export default function ProjectSettings() {
  const { id: projectId } = useParams()
  const navigate          = useNavigate()
  const { user }          = useAuth()

  const [project, setProject] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  const { isOwner } = useRole(project)

  async function fetchProject() {
    try {
      const { data } = await api.get('/projects')
      const found = (data.projects || []).find(p => p._id === projectId)
      if (found) setProject(found)
      else setError('Project not found')
    } catch {
      setError('Failed to load project')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchProject() }, [projectId])

  if (loading) return (
    <div className="flex flex-1 items-center justify-center py-32">
      <Spinner />
    </div>
  )

  return (
    <>
      {/* Breadcrumb sub-header */}
      <div className="bg-white border-b border-slate-100 px-6 py-2.5 flex items-center gap-2 text-sm">
        <button
          onClick={() => navigate(`/project/${projectId}`)}
          className="text-slate-500 hover:text-slate-800 transition-colors"
        >
          {project?.name}
        </button>
        <span className="text-slate-300">/</span>
        <span className="font-medium text-slate-700">Settings</span>
      </div>

      <div className="max-w-2xl mx-auto w-full px-6 py-8 space-y-6">

        {error && <p className="text-red-500 text-sm">{error}</p>}

        {/* Project details */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6">
          <div className="flex items-start justify-between gap-4">
            <div>
              <h2 className="text-lg font-bold text-slate-800">{project?.name}</h2>
              {project?.description && (
                <p className="text-sm text-slate-500 mt-1">{project.description}</p>
              )}
            </div>
            {isOwner && (
              <span className="shrink-0 text-xs font-semibold px-2.5 py-1 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                ★ You are the Owner
              </span>
            )}
          </div>

          <div className="mt-4 pt-4 border-t border-slate-100 grid grid-cols-2 gap-3 text-sm">
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Your role</p>
              <p className="font-medium text-slate-700 capitalize">{isOwner ? 'Owner' : 'Member'}</p>
            </div>
            <div>
              <p className="text-xs text-slate-400 uppercase tracking-wide mb-0.5">Your ID</p>
              <p className="font-mono text-slate-600 text-xs truncate">{user?._id}</p>
            </div>
          </div>
        </section>

        {/* Members */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="font-semibold text-slate-800 mb-4">
            Team Members
            <span className="ml-2 text-slate-400 font-normal text-sm">
              ({project?.members?.length ?? 0})
            </span>
          </h3>
          {project && (
            <MemberList
              project={project}
              isOwner={isOwner}
              onMemberAdded={fetchProject}
            />
          )}
        </section>

        {/* Permissions reference */}
        <section className="bg-white border border-slate-200 rounded-2xl p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Permissions</h3>
          <div className="space-y-2 text-sm">
            {[
              { action: 'View tasks',         owner: true,  member: true  },
              { action: 'Update task status', owner: true,  member: true  },
              { action: 'Create tasks',       owner: true,  member: false },
              { action: 'Assign users',       owner: true,  member: false },
              { action: 'Delete tasks',       owner: true,  member: false },
              { action: 'Add members',        owner: true,  member: false },
            ].map(row => (
              <div key={row.action} className="flex items-center justify-between py-1.5 border-b border-slate-50 last:border-0">
                <span className="text-slate-600">{row.action}</span>
                <div className="flex gap-3">
                  <Badge label="Owner"  allowed={row.owner}  active={isOwner} />
                  <Badge label="Member" allowed={row.member} active={!isOwner} />
                </div>
              </div>
            ))}
          </div>
        </section>

      </div>
    </>
  )
}

function Badge({ label, allowed, active }) {
  const base = 'text-xs px-2 py-0.5 rounded-full border font-medium'
  const style = allowed
    ? 'bg-green-50 text-green-700 border-green-200'
    : 'bg-slate-50 text-slate-400 border-slate-200'
  const ring = active ? 'ring-2 ring-offset-1 ring-blue-300' : ''
  return (
    <span className={`${base} ${style} ${ring}`}>
      {allowed ? '✓' : '✗'} {label}
    </span>
  )
}
