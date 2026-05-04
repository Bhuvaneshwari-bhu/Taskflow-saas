import { Droppable } from '@hello-pangea/dnd'
import TaskCard from './TaskCard'

const COLUMN_STYLES = {
  'todo':        { label: 'To Do',       dot: 'bg-slate-400',  bg: 'bg-slate-50',   border: 'border-slate-200',  emptyText: 'Nothing to do yet' },
  'in-progress': { label: 'In Progress', dot: 'bg-orange-400', bg: 'bg-orange-50',  border: 'border-orange-200', emptyText: 'No tasks in progress' },
  'done':        { label: 'Done',        dot: 'bg-green-400',  bg: 'bg-green-50',   border: 'border-green-200',  emptyText: 'No completed tasks' },
}

export default function KanbanColumn({ status, tasks, isOwner, onStatusChange, onDelete, onAssign }) {
  const { label, dot, bg, border, emptyText } = COLUMN_STYLES[status]

  return (
    <div className={`flex flex-col rounded-2xl border ${border} ${bg} min-h-[480px] w-full`}>
      {/* Header */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-inherit">
        <span className={`w-2 h-2 rounded-full ${dot}`} />
        <span className="font-semibold text-slate-700 text-sm">{label}</span>
        <span className="ml-auto text-xs font-medium text-slate-400 bg-white rounded-full px-2 py-0.5 border border-slate-200 tabular-nums">
          {tasks.length}
        </span>
      </div>

      {/* Droppable area */}
      <Droppable droppableId={status}>
        {(provided, snapshot) => (
          <div
            ref={provided.innerRef}
            {...provided.droppableProps}
            className={`flex flex-col gap-2.5 p-3 flex-1 rounded-b-2xl transition-colors
              ${snapshot.isDraggingOver ? 'bg-blue-50/70 ring-2 ring-blue-200 ring-inset' : ''}`}
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
              <div className="flex flex-col items-center justify-center flex-1 py-10 gap-2">
                <div className="w-8 h-8 rounded-full bg-white border border-slate-200 flex items-center justify-center">
                  <svg className="w-4 h-4 text-slate-300" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                  </svg>
                </div>
                <p className="text-xs text-slate-400">{emptyText}</p>
              </div>
            )}
          </div>
        )}
      </Droppable>
    </div>
  )
}
