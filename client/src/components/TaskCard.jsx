import { Draggable } from '@hello-pangea/dnd'

const STATUS_NEXT = { 'todo': 'in-progress', 'in-progress': 'done', 'done': null }
const STATUS_PREV = { 'in-progress': 'todo', 'done': 'in-progress', 'todo': null }

const STATUS_BORDER = {
  'todo':        'border-l-slate-300',
  'in-progress': 'border-l-orange-400',
  'done':        'border-l-green-400',
}

const AVATAR_COLORS = [
  'bg-blue-500', 'bg-violet-500', 'bg-rose-500',
  'bg-amber-500', 'bg-teal-500', 'bg-cyan-500',
]

function hashColor(str) {
  let h = 0
  for (let i = 0; i < str.length; i++) h = (h * 31 + str.charCodeAt(i)) & 0xffff
  return AVATAR_COLORS[h % AVATAR_COLORS.length]
}

function UserChip({ assignedTo }) {
  if (!assignedTo) return null

  const isPopulated = assignedTo && typeof assignedTo === 'object' && assignedTo.name
  const id = isPopulated ? assignedTo._id : String(assignedTo)
  const name = isPopulated ? assignedTo.name : null
  const email = isPopulated ? assignedTo.email : null
  const label = name || email?.split('@')[0] || id.slice(-6)
  const initials = label.split(' ').slice(0, 2).map(w => w[0]).join('').toUpperCase()
  const color = hashColor(id)

  return (
    <div className="flex items-center gap-1.5 mt-2">
      <div className={`w-5 h-5 rounded-full ${color} text-white text-[9px] font-bold flex items-center justify-center shrink-0`}>
        {initials}
      </div>
      <span className="text-xs text-slate-500 truncate max-w-[120px]">{label}</span>
    </div>
  )
}

function RelativeDate({ iso }) {
  if (!iso) return null
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  const hrs  = Math.floor(diff / 3600000)
  const days = Math.floor(diff / 86400000)
  let label
  if (mins < 1)    label = 'just now'
  else if (mins < 60) label = `${mins}m ago`
  else if (hrs < 24)  label = `${hrs}h ago`
  else if (days < 7)  label = `${days}d ago`
  else label = new Date(iso).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })
  return <span className="text-[10px] text-slate-400">{label}</span>
}

export default function TaskCard({ task, index, isOwner, onStatusChange, onDelete, onAssign }) {
  const next = STATUS_NEXT[task.status]
  const prev = STATUS_PREV[task.status]

  return (
    <Draggable draggableId={task._id} index={index}>
      {(provided, snapshot) => (
        <div
          ref={provided.innerRef}
          {...provided.draggableProps}
          {...provided.dragHandleProps}
          className={`bg-white border border-slate-200 border-l-4 ${STATUS_BORDER[task.status]}
            rounded-xl p-3.5 shadow-sm select-none
            ${snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-400 rotate-1' : 'hover:shadow-md'}
            transition-all`}
        >
          <p className="font-medium text-slate-800 text-sm leading-snug">{task.title}</p>

          {task.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>
          )}

          <UserChip assignedTo={task.assignedTo} />

          <div className="flex items-center justify-between mt-3">
            {/* Status navigation */}
            <div className="flex items-center gap-1">
              {prev && (
                <button
                  onClick={() => onStatusChange(task._id, prev)}
                  title="Move back"
                  className="w-6 h-6 flex items-center justify-center rounded-md bg-slate-100 hover:bg-slate-200 text-slate-500 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                  </svg>
                </button>
              )}
              {next && (
                <button
                  onClick={() => onStatusChange(task._id, next)}
                  title="Move forward"
                  className="w-6 h-6 flex items-center justify-center rounded-md bg-blue-50 hover:bg-blue-100 text-blue-500 transition-colors"
                >
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                </button>
              )}
            </div>

            <div className="flex items-center gap-1.5">
              <RelativeDate iso={task.createdAt} />

              {/* Assign */}
              <button
                onClick={() => isOwner && onAssign(task)}
                disabled={!isOwner}
                title={isOwner ? 'Assign user' : 'Only the owner can assign users'}
                className={`w-6 h-6 flex items-center justify-center rounded-md transition-colors
                  ${isOwner
                    ? 'bg-green-50 hover:bg-green-100 text-green-500 cursor-pointer'
                    : 'text-slate-300 cursor-not-allowed'
                  }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </button>

              {/* Delete */}
              <button
                onClick={() => isOwner && onDelete(task._id)}
                disabled={!isOwner}
                title={isOwner ? 'Delete task' : 'Only the owner can delete tasks'}
                className={`w-6 h-6 flex items-center justify-center rounded-md transition-colors
                  ${isOwner
                    ? 'bg-red-50 hover:bg-red-100 text-red-400 cursor-pointer'
                    : 'text-slate-300 cursor-not-allowed'
                  }`}
              >
                <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      )}
    </Draggable>
  )
}
