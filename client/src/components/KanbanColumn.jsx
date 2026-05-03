import { Droppable } from '@hello-pangea/dnd'
import TaskCard from './TaskCard'

const COLUMN_STYLES = {
  'todo':        { label: 'To Do',       dot: 'bg-slate-400',  bg: 'bg-slate-50',  border: 'border-slate-200' },
  'in-progress': { label: 'In Progress', dot: 'bg-orange-400', bg: 'bg-orange-50', border: 'border-orange-200' },
  'done':        { label: 'Done',        dot: 'bg-green-400',  bg: 'bg-green-50',  border: 'border-green-200'  },
}

export default function KanbanColumn({ status, tasks, isOwner, onStatusChange, onDelete, onAssign }) {
  const { label, dot, bg, border } = COLUMN_STYLES[status]

  return (
    <div className={`flex flex-col rounded-2xl border ${border} ${bg} min-h-[480px] w-full`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-inherit">
        <span className={`w-2.5 h-2.5 rounded-full ${dot}`} />
        <span className="font-semibold text-slate-700 text-sm">{label}</span>
        <span className="ml-auto text-xs text-slate-400 bg-white rounded-full px-2 py-0.5 border border-slate-200">
          {tasks.length}
        </span>
      </div>

      {/* Droppable area */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex flex-col gap-3 p-3 flex-1 transition-colors rounded-b-2xl
              ${snapshot.isDraggingOver ? 'bg-blue-50/60' : ''}`}
          >
            {tasks.map((task, i) => (
              <TaskCard
                key={task._id}
                task={task}
                index={i}
                isOwner={isOwner}
                onStatusChange={onStatusChange}
                onDelete={onDelete}
                onAssign={onAssign}
              />
            ))}
            {provided.placeholder}
            {tasks.length === 0 && !snapshot.isDraggingOver && (
              <p className="text-xs text-slate-400 text-center mt-6">No tasks</p>
            )}
          </div>
        )}
      </Droppable>
    </div>
  )
}
