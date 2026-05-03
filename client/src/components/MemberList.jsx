import { useState } from 'react'
import api from '../services/api'

function Avatar({ id }) {
  // Deterministic colour from the last 6 chars of the id
  const colors = ['bg-blue-500', 'bg-purple-500', 'bg-green-500', 'bg-orange-500', 'bg-pink-500', 'bg-teal-500']
  const color = colors[parseInt(String(id).slice(-1), 16) % colors.length]
  return (
    <div className={`w-8 h-8 rounded-full ${color} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
      {String(id).slice(-2).toUpperCase()}
    </div>
  )
}

export default function MemberList({ project, isOwner, onMemberAdded }) {
  const [userId, setUserId]     = useState('')
  const [adding, setAdding]     = useState(false)
  const [error, setError]       = useState('')
  const [success, setSuccess]   = useState('')

  const ownerId  = project.owner?._id ?? project.owner
  const members  = project.members ?? []

  async function handleAdd(e) {
    e.preventDefault()
    if (!userId.trim()) return
    setError('')
    setSuccess('')
    setAdding(true)
    try {
      await api.post(`/projects/${project._id}/members`, { userId: userId.trim() })
      setSuccess('Member added successfully')
      setUserId('')
      onMemberAdded?.()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Member rows */}
      <ul className="space-y-2">
        {members.map(memberId => {
          const id       = memberId?._id ?? memberId
          const isTheOwner = String(id) === String(ownerId)
          return (
            <li key={String(id)} className="flex items-center gap-3 py-2 px-3 rounded-xl bg-slate-50 border border-slate-100">
              <Avatar id={id} />
              <span className="text-sm font-mono text-slate-700 truncate flex-1">{String(id)}</span>
              {isTheOwner && (
                <span className="text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200 shrink-0">
                  Owner
                </span>
              )}
            </li>
          )
        })}
        {members.length === 0 && (
          <p className="text-sm text-slate-400 py-2">No members yet.</p>
        )}
      </ul>

      {/* Add member — owner only */}
      <div className={isOwner ? '' : 'opacity-50 pointer-events-none'}>
        <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
          Add Member
          {!isOwner && <span className="ml-2 text-slate-400 normal-case font-normal">(owner only)</span>}
        </p>
        <form onSubmit={handleAdd} className="flex gap-2">
          <input
            value={userId}
            onChange={e => setUserId(e.target.value)}
            placeholder="Paste user ObjectId"
            disabled={!isOwner}
            className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm font-mono outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-slate-100"
          />
          <button
            type="submit"
            disabled={!isOwner || adding}
            className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors"
          >
            {adding ? 'Adding…' : 'Add'}
          </button>
        </form>
        {error   && <p className="text-red-500 text-sm mt-2">{error}</p>}
        {success && <p className="text-green-600 text-sm mt-2">{success}</p>}
      </div>
    </div>
  )
}
