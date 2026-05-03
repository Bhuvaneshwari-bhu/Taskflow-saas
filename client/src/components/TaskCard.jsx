import { Draggable } from '@hello-pangea/dnd'

const STATUS_NEXT = { 'todo': 'in-progress', 'in-progress': 'done', 'done': null }
const STATUS_PREV = { 'in-progress': 'todo', 'done': 'in-progress', 'todo': null }

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
          className={`bg-white border rounded-xl p-4 shadow-sm select-none
            ${snapshot.isDragging ? 'shadow-lg ring-2 ring-blue-400 rotate-1' : 'hover:shadow-md'}
            transition-shadow`}
        >
          <p className="font-medium text-slate-800 text-sm leading-snug">{task.title}</p>

          {task.description && (
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{task.description}</p>
          )}

          {task.assignedTo && (
            <p className="text-xs text-blue-600 mt-2 bg-blue-50 rounded-md px-2 py-0.5 inline-block">
              👤 {String(task.assignedTo).slice(-6)}
            </p>
          )}

          <div className="flex items-center gap-1 mt-3 flex-wrap">
            {/* Status navigation — available to all roles */}
            {prev && (
              <button
                onClick={() => onStatusChange(task._id, prev)}
                className="text-xs px-2 py-1 rounded-md bg-slate-100 hover:bg-slate-200 text-slate-600 transition-colors"
              >
                ← Back
              </button>
            )}
            {next && (
              <button
                onClick={() => onStatusChange(task._id, next)}
                className="text-xs px-2 py-1 rounded-md bg-blue-50 hover:bg-blue-100 text-blue-600 transition-colors"
              >
                Forward →
              </button>
            )}

            {/* Assign — owner only */}
            <button
              onClick={() => isOwner && onAssign(task)}
              disabled={!isOwner}
              title={isOwner ? 'Assign user' : 'Only the owner can assign users'}
              className={`text-xs px-2 py-1 rounded-md transition-colors
                ${isOwner
                  ? 'bg-green-50 hover:bg-green-100 text-green-600 cursor-pointer'
                  : 'bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-200'
                }`}
            >
              Assign
            </button>

            {/* Delete — owner only */}
            <button
              onClick={() => isOwner && onDelete(task._id)}
              disabled={!isOwner}
              title={isOwner ? 'Delete task' : 'Only the owner can delete tasks'}
              className={`text-xs px-2 py-1 rounded-md transition-colors ml-auto
                ${isOwner
                  ? 'bg-red-50 hover:bg-red-100 text-red-500 cursor-pointer'
                  : 'bg-slate-50 text-slate-300 cursor-not-allowed border border-slate-200'
                }`}
            >
              Delete
            </button>
          </div>
        </div>
      )}
    </Draggable>
  )
}
