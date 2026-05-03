import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'
import Spinner from '../components/Spinner'

export default function DashboardPage() {
  const navigate = useNavigate()

  const [projects, setProjects] = useState([])
  const [loading, setLoading]   = useState(true)
  const [error, setError]       = useState('')

  const [showForm, setShowForm]     = useState(false)
  const [newName, setNewName]       = useState('')
  const [newDesc, setNewDesc]       = useState('')
  const [creating, setCreating]     = useState(false)

  useEffect(() => { fetchProjects() }, [])

  async function fetchProjects() {
    try {
      const { data } = await api.get('/projects')
      setProjects(data.projects || [])
    } catch {
      setError('Failed to load projects')
    } finally {
      setLoading(false)
    }
  }

  async function createProject(e) {
    e.preventDefault()
    if (!newName.trim()) return
    setCreating(true)
    try {
      const { data } = await api.post('/projects', { name: newName, description: newDesc })
      setProjects(prev => [data.project, ...prev])
      setNewName('')
      setNewDesc('')
      setShowForm(false)
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create project')
    } finally {
      setCreating(false)
    }
  }

  return (
    <>
      <div className="max-w-6xl mx-auto px-6 py-8">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold text-slate-800">Projects</h2>
          <button
            onClick={() => setShowForm(v => !v)}
            className="bg-blue-600 hover:bg-blue-700 text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            + New Project
          </button>
        </div>

        {showForm && (
          <form onSubmit={createProject} className="bg-white border border-slate-200 rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-3">
            <input
              value={newName}
              onChange={e => setNewName(e.target.value)}
              placeholder="Project name"
              required
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
            />
            <input
              value={newDesc}
              onChange={e => setNewDesc(e.target.value)}
              placeholder="Description (optional)"
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

        {error && <p className="text-red-500 text-sm mb-4">{error}</p>}

        {loading ? (
          <div className="flex justify-center py-16"><Spinner /></div>
        ) : projects.length === 0 ? (
          <div className="text-center py-16 text-slate-400">
            <p className="text-lg mb-1">No projects yet</p>
            <p className="text-sm">Create your first project to get started</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {projects.map(p => (
              <div key={p._id} className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow flex flex-col gap-3">
                <div>
                  <h3 className="font-semibold text-slate-800">{p.name}</h3>
                  {p.description && <p className="text-sm text-slate-500 mt-1">{p.description}</p>}
                </div>
                <div className="mt-auto">
                  <button
                    onClick={() => navigate(`/project/${p._id}`)}
                    className="w-full bg-slate-100 hover:bg-slate-200 text-slate-700 text-sm font-medium rounded-lg py-2 transition-colors"
                  >
                    Open Project →
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  )
}
