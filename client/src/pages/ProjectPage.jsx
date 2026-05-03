import { useState, useEffect, useCallback } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { DragDropContext } from '@hello-pangea/dnd'
import api from '../services/api'
import useRole from '../hooks/useRole'
import useProjectSocket from '../hooks/useProjectSocket'
import { useToast, ToastContainer } from '../components/Toast'
import { useAuth } from '../context/AuthContext'
import KanbanColumn from '../components/KanbanColumn'
import Modal from '../components/Modal'
import Spinner from '../components/Spinner'
import ActivityFeed from '../components/ActivityFeed'
import TaskFilters from '../components/TaskFilters'

const STATUSES = ['todo', 'in-progress', 'done']

export default function ProjectPage() {
  const { id: projectId } = useParams()
  const navigate          = useNavigate()

  const [project, setProject]               = useState(null)
  const [tasks, setTasks]                   = useState([])
  const [loading, setLoading]               = useState(true)
  const [error, setError]                   = useState('')
  const [refreshTrigger, setRefreshTrigger] = useState(0)

  const { isOwner }                        = useRole(project)
  const { toasts, showToast, removeToast } = useToast()
  const { user: currentUser }              = useAuth()

  const memberLabel = (memberId) => {
    const id = String(memberId)
    if (currentUser && id === String(currentUser._id)) {
      return `${currentUser.name || 'You'} (you)`
    }
    const isOwnerMember = id === String(project?.owner?._id ?? project?.owner)
    return `${isOwnerMember ? 'Owner' : 'User'} - ${id.slice(-4)}`
  }

  const refresh = () => setRefreshTrigger(n => n + 1)

  // Filter state
  const [searchTerm, setSearchTerm]         = useState('')
  const [selectedStatus, setSelectedStatus] = useState('all')
  const [assignedFilter, setAssignedFilter] = useState('')

  const hasActiveFilters = searchTerm !== '' || selectedStatus !== 'all' || assignedFilter !== ''

  const filteredTasks = tasks.filter(task => {
    const matchesSearch = !searchTerm || task.title.toLowerCase().includes(searchTerm.toLowerCase())
    const matchesStatus = selectedStatus === 'all' || task.status === selectedStatus
    const matchesUser   = !assignedFilter || String(task.assignedTo || '').toLowerCase().includes(assignedFilter.toLowerCase())
    return matchesSearch && matchesStatus && matchesUser
  })

  function clearFilters() {
    setSearchTerm('')
    setSelectedStatus('all')
    setAssignedFilter('')
  }

  // Create task modal
  const [showCreate, setShowCreate] = useState(false)
  const [newTitle, setNewTitle]     = useState('')
  const [newDesc, setNewDesc]       = useState('')
  const [newAssignTo, setNewAssignTo] = useState('')
  const [creating, setCreating]     = useState(false)

  // Assign modal
  const [assignTask, setAssignTask]     = useState(null)
  const [assignUserId, setAssignUserId] = useState('')
  const [assigning, setAssigning]       = useState(false)

  const fetchTasks = useCallback(async () => {
    try {
      const { data } = await api.get(`/tasks?projectId=${projectId}`)
      setTasks(data.tasks || [])
    } catch {
      setError('Failed to load tasks')
    }
  }, [projectId])

  useEffect(() => {
    async function init() {
      try {
        const [projRes] = await Promise.all([api.get('/projects'), fetchTasks()])
        const found = (projRes.data.projects || []).find(p => p._id === projectId)
        setProject(found || { name: 'Project', _id: projectId })
      } catch {
        setError('Failed to load project')
      } finally {
        setLoading(false)
      }
    }
    init()
  }, [projectId, fetchTasks])

  // ── Socket.IO real-time events ────────────────────────────────────────────

  useProjectSocket(projectId, {
    onTaskCreated(task) {
      setTasks(prev => {
        // Skip if this task was already added optimistically by this user
        if (prev.some(t => t._id === task._id)) return prev
        showToast('New task added', 'success')
        refresh()
        return [task, ...prev]
      })
    },

    onTaskUpdated(task) {
      setTasks(prev => prev.map(t => t._id === task._id ? task : t))
      showToast('Task updated', 'info')
      refresh()
    },

    onTaskDeleted({ _id }) {
      setTasks(prev => {
        // Skip if already removed optimistically
        if (!prev.some(t => t._id === _id)) return prev
        showToast('Task removed', 'warning')
        refresh()
        return prev.filter(t => t._id !== _id)
      })
    },

    onMemberAdded() {
      showToast('New member added', 'success')
      api.get('/projects').then(({ data }) => {
        const found = (data.projects || []).find(p => p._id === projectId)
        if (found) setProject(found)
      }).catch(() => {})
      refresh()
    },

    onCommentCreated() {
      showToast('New comment', 'info')
      refresh()
    },
  })

  // ── Drag and drop ─────────────────────────────────────────────────────────

  async function onDragEnd(result) {
    const { source, destination, draggableId } = result
    if (!destination || source.droppableId === destination.droppableId) return
    const newStatus = destination.droppableId
    setTasks(prev => prev.map(t => t._id === draggableId ? { ...t, status: newStatus } : t))
    try {
      await api.put(`/tasks/${draggableId}`, { status: newStatus })
      refresh()
    } catch {
      setTasks(prev => prev.map(t => t._id === draggableId ? { ...t, status: source.droppableId } : t))
    }
  }

  // ── Task actions ──────────────────────────────────────────────────────────

  async function handleStatusChange(taskId, status) {
    setTasks(prev => prev.map(t => t._id === taskId ? { ...t, status } : t))
    try {
      await api.put(`/tasks/${taskId}`, { status })
      refresh()
    } catch {
      await fetchTasks()
    }
  }

  async function handleDelete(taskId) {
    if (!isOwner) return setError('Only the project owner can delete tasks')
    if (!confirm('Delete this task?')) return
    setTasks(prev => prev.filter(t => t._id !== taskId))
    try {
      await api.delete(`/tasks/${taskId}`)
      refresh()
    } catch {
      await fetchTasks()
    }
  }

  async function handleCreate(e) {
    e.preventDefault()
    if (!isOwner) return setError('Only the project owner can create tasks')
    if (!newTitle.trim()) return
    setCreating(true)
    try {
      const { data } = await api.post('/tasks', { title: newTitle, description: newDesc, projectId })
      let createdTask = data.task

      if (newAssignTo) {
        try {
          const { data: assignData } = await api.put(`/tasks/${createdTask._id}/assign`, { userId: newAssignTo })
          createdTask = assignData.task
        } catch { /* assignment failed, task still created */ }
      }

      setTasks(prev => {
        if (prev.some(t => t._id === createdTask._id)) {
          return prev.map(t => t._id === createdTask._id ? createdTask : t)
        }
        return [createdTask, ...prev]
      })
      setNewTitle('')
      setNewDesc('')
      setNewAssignTo('')
      setShowCreate(false)
      refresh()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to create task')
    } finally {
      setCreating(false)
    }
  }

  async function handleAssign(e) {
    e.preventDefault()
    if (!isOwner) return setError('Only the project owner can assign tasks')
    if (!assignUserId) return
    setAssigning(true)
    try {
      const { data } = await api.put(`/tasks/${assignTask._id}/assign`, { userId: assignUserId })
      setTasks(prev => prev.map(t => t._id === assignTask._id ? data.task : t))
      setAssignTask(null)
      setAssignUserId('')
      refresh()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to assign task')
    } finally {
      setAssigning(false)
    }
  }

  const byStatus = status => filteredTasks.filter(t => t.status === status)

  if (loading) return (
    <div className="flex flex-1 items-center justify-center py-32">
      <Spinner />
    </div>
  )

  return (
    <div className="flex-1 flex flex-col min-h-0">
      {/* Breadcrumb + action bar */}
      <div className="bg-white border-b border-slate-100 px-6 py-2.5 flex items-center gap-2 text-sm shrink-0">
        <button
          onClick={() => navigate(project?.orgId ? `/org/${project.orgId}` : '/organizations')}
          className="text-slate-500 hover:text-slate-800 transition-colors"
        >
          {project?.orgId ? 'Organization' : 'Organizations'}
        </button>
        <span className="text-slate-300">/</span>
        <span className="font-medium text-slate-700">{project?.name}</span>
        {isOwner && (
          <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
            ★ Owner
          </span>
        )}
        <div className="ml-auto flex items-center gap-2">
          <button
            onClick={() => navigate(`/project/${projectId}/settings`)}
            className="text-slate-500 hover:text-slate-800 transition-colors flex items-center gap-1"
          >
            <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            Settings
          </button>
          <button
            onClick={() => isOwner ? setShowCreate(true) : setError('Only the project owner can create tasks')}
            disabled={!isOwner}
            title={isOwner ? 'Create a new task' : 'Only the owner can create tasks'}
            className={`font-semibold px-3 py-1 rounded-lg transition-colors
              ${isOwner
                ? 'bg-blue-600 hover:bg-blue-700 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
              }`}
          >
            + New Task
          </button>
        </div>
      </div>

      {/* Body: board + activity sidebar */}
      <div className="flex flex-1 overflow-hidden">

        {/* Kanban board */}
        <div className="flex-1 overflow-auto px-6 py-6">
          {error && (
            <div className="flex items-center justify-between bg-red-50 border border-red-200 text-red-700 text-sm rounded-lg px-4 py-2 mb-4">
              <span>{error}</span>
              <button onClick={() => setError('')} className="text-red-400 hover:text-red-600 ml-4">✕</button>
            </div>
          )}

          {!isOwner && (
            <div className="flex items-center gap-2 bg-blue-50 border border-blue-200 text-blue-700 text-sm rounded-lg px-4 py-2 mb-4">
              <span>ℹ</span>
              <span>You are a <strong>member</strong> — you can update task status but cannot create, assign, or delete tasks.</span>
            </div>
          )}

          <TaskFilters
            searchTerm={searchTerm}
            onSearch={setSearchTerm}
            selectedStatus={selectedStatus}
            onStatusChange={setSelectedStatus}
            assignedFilter={assignedFilter}
            onAssignedFilter={setAssignedFilter}
            onClear={clearFilters}
            hasActiveFilters={hasActiveFilters}
            totalCount={tasks.length}
            filteredCount={filteredTasks.length}
          />

          <DragDropContext onDragEnd={onDragEnd}>
            {hasActiveFilters && filteredTasks.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-20 text-center">
                <svg className="w-10 h-10 text-slate-300 mb-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-4.35-4.35M17 11A6 6 0 115 11a6 6 0 0112 0z" />
                </svg>
                <p className="text-sm text-slate-500 font-medium">No tasks found</p>
                <p className="text-xs text-slate-400 mt-1 mb-4">Try adjusting your search or filters</p>
                <button
                  onClick={clearFilters}
                  className="text-xs text-blue-600 hover:text-blue-700 border border-blue-200 hover:border-blue-300 rounded-lg px-3 py-1.5 transition-colors"
                >
                  Clear filters
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 min-w-0">
                {STATUSES.map(status => (
                  <KanbanColumn
                    key={status}
                    status={status}
                    tasks={byStatus(status)}
                    isOwner={isOwner}
                    onStatusChange={handleStatusChange}
                    onDelete={handleDelete}
                    onAssign={task => {
                      if (!isOwner) return setError('Only the project owner can assign tasks')
                      setAssignTask(task)
                      setAssignUserId(task.assignedTo || '')
                    }}
                  />
                ))}
              </div>
            )}
          </DragDropContext>
        </div>

        {/* Activity feed sidebar */}
        <div className="w-72 shrink-0 border-l border-slate-200 bg-white overflow-hidden flex flex-col">
          <ActivityFeed projectId={projectId} refreshTrigger={refreshTrigger} />
        </div>

      </div>

      {/* Create task modal */}
      {showCreate && (
        <Modal title="New Task" onClose={() => { setShowCreate(false); setNewAssignTo('') }}>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Title *</label>
              <input
                value={newTitle}
                onChange={e => setNewTitle(e.target.value)}
                required
                autoFocus
                placeholder="Task title"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Description</label>
              <textarea
                value={newDesc}
                onChange={e => setNewDesc(e.target.value)}
                rows={3}
                placeholder="Optional description"
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Assign To</label>
              <select
                value={newAssignTo}
                onChange={e => setNewAssignTo(e.target.value)}
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white"
              >
                <option value="">Unassigned</option>
                {(project?.members || []).map(memberId => {
                  const id = String(memberId)
                  return (
                    <option key={id} value={id}>
                      {memberLabel(id)}
                    </option>
                  )
                })}
              </select>
            </div>
            <div className="flex gap-2 justify-end pt-1">
              <button
                type="button"
                onClick={() => { setShowCreate(false); setNewAssignTo('') }}
                className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={creating}
                className="px-4 py-2 text-sm rounded-lg bg-blue-600 hover:bg-blue-700 disabled:opacity-60 text-white font-semibold transition-colors"
              >
                {creating ? 'Creating…' : 'Create Task'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Assign user modal */}
      {assignTask && (
        <Modal title="Assign User" onClose={() => setAssignTask(null)}>
          <p className="text-sm text-slate-500 mb-4">
            Assigning to: <span className="font-medium text-slate-700">{assignTask.title}</span>
          </p>
          <form onSubmit={handleAssign} className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-slate-700 mb-1">Assign To</label>
              <select
                value={assignUserId}
                onChange={e => setAssignUserId(e.target.value)}
                autoFocus
                className="w-full border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-500 bg-white"
              >
                <option value="">Select a member…</option>
                {(project?.members || []).map(memberId => {
                  const id = String(memberId)
                  return (
                    <option key={id} value={id}>
                      {memberLabel(id)}
                    </option>
                  )
                })}
              </select>
            </div>
            <div className="flex gap-2 justify-end">
              <button
                type="button"
                onClick={() => setAssignTask(null)}
                className="px-4 py-2 text-sm rounded-lg border border-slate-200 text-slate-600 hover:bg-slate-50 transition-colors"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={assigning}
                className="px-4 py-2 text-sm rounded-lg bg-green-600 hover:bg-green-700 disabled:opacity-60 text-white font-semibold transition-colors"
              >
                {assigning ? 'Assigning…' : 'Assign'}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {/* Toasts */}
      <ToastContainer toasts={toasts} onDone={removeToast} />
    </div>
  )
}

