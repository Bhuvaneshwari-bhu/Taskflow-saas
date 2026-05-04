import { useState } from 'react'
import api from '../services/api'

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-violet-500', 'bg-rose-500',
  'bg-amber-500', 'bg-teal-500',  'bg-cyan-500',
]

function hashColor(id) {
  let h = 0
  const s = String(id)
  for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) & 0xffff
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

function MemberAvatar({ user }) {
  const raw      = user?.name || user?.email || String(user?._id ?? user)
  const initials = raw.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase() || '?'
  const id       = String(user?._id ?? user)
  return (
    <div className={`w-8 h-8 rounded-full ${hashColor(id)} flex items-center justify-center text-white text-xs font-bold shrink-0`}>
      {initials}
    </div>
  )
}

/**
 * project      – project doc with populated members: [{_id, name, email}]
 * orgMembers   – org.members array: [{user: {_id, name, email}, role}]
 * isOwner      – true if current user is project owner or org admin
 * onMemberAdded – callback after successful add
 */
export default function MemberList({ project, orgMembers = [], isOwner, onMemberAdded }) {
  const [selectedUserId, setSelectedUserId] = useState('')
  const [adding, setAdding]                 = useState(false)
  const [error, setError]                   = useState('')

  const ownerId = String(project.owner?._id ?? project.owner)

  // IDs already in the project (owner + members)
  const projectMemberIds = new Set([
    ownerId,
    ...(project.members ?? []).map(m => String(m?._id ?? m)),
  ])

  // Org members not yet added to this project
  const eligible = orgMembers.filter(m => {
    const uid = String(m.user?._id ?? m.user)
    return !projectMemberIds.has(uid)
  })

  // Resolve plain IDs to populated objects using orgMembers as a lookup
  const populatedMembers = (project.members ?? []).map(m => {
    if (m?._id && m?.name !== undefined) return m          // already populated
    const uid   = String(m?._id ?? m)
    const match = orgMembers.find(om => String(om.user?._id ?? om.user) === uid)
    return match?.user ? { ...match.user } : { _id: uid }
  })

  async function handleAdd(e) {
    e.preventDefault()
    if (!selectedUserId) return
    setError('')
    setAdding(true)
    try {
      await api.patch(`/projects/${project._id}/members`, { userId: selectedUserId })
      setSelectedUserId('')
      onMemberAdded?.()
    } catch (err) {
      setError(err.response?.data?.message || 'Failed to add member')
    } finally {
      setAdding(false)
    }
  }

  return (
    <div className="space-y-4">
      {/* Current members */}
      <ul className="space-y-2">
        {populatedMembers.map(member => {
          const id        = String(member?._id ?? member)
          const name      = member?.name
          const email     = member?.email
          const label     = name || email || id.slice(-8)
          const isTheOwner = id === ownerId

          return (
            <li key={id} className="flex items-center gap-3 py-2.5 px-3 rounded-xl bg-slate-50 border border-slate-100">
              <MemberAvatar user={member} />
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-slate-700 truncate">{label}</p>
                {email && name && (
                  <p className="text-xs text-slate-400 truncate">{email}</p>
                )}
              </div>
              {isTheOwner && (
                <span className="shrink-0 text-xs font-semibold px-2 py-0.5 rounded-full bg-amber-100 text-amber-700 border border-amber-200">
                  Owner
                </span>
              )}
            </li>
          )
        })}
        {populatedMembers.length === 0 && (
          <p className="text-sm text-slate-400 py-2">No members yet.</p>
        )}
      </ul>

      {/* Add member */}
      {isOwner ? (
        <div>
          <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-2">
            Add Member
          </p>
          <form onSubmit={handleAdd} className="flex gap-2">
            <select
              value={selectedUserId}
              onChange={e => setSelectedUserId(e.target.value)}
              className="flex-1 border border-slate-200 rounded-lg px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-blue-500 bg-white text-slate-700"
            >
              <option value="">Select org member…</option>
              {eligible.map(m => {
                const u     = m.user
                const uid   = String(u?._id ?? u)
                const label = u?.name || u?.email || uid.slice(-8)
                return <option key={uid} value={uid}>{label}</option>
              })}
            </select>
            <button
              type="submit"
              disabled={!selectedUserId || adding}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed text-white text-sm font-semibold px-4 py-2 rounded-lg transition-colors whitespace-nowrap"
            >
              {adding ? 'Adding…' : 'Add Member'}
            </button>
          </form>
          {eligible.length === 0 && !adding && (
            <p className="text-xs text-slate-400 mt-2">All org members are already in this project.</p>
          )}
          {error && <p className="text-red-500 text-sm mt-2">{error}</p>}
        </div>
      ) : (
        <p className="text-xs text-slate-400 pt-4 border-t border-slate-100">
          Only the project owner or org admin can add members.
        </p>
      )}
    </div>
  )
}
