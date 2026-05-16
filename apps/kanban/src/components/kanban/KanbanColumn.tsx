'use client'

import { memo } from 'react'
import { Plus, CloudOff } from 'lucide-react'
import type { Task, TaskStatus, Profile } from '@/types/database'
import { KanbanTaskCard } from './KanbanTaskCard'

export type KanbanColumnProps = {
  status: TaskStatus
  tasks: Task[]
  membersById: Map<string, Profile>
  onAddTask: (status: TaskStatus) => void
  onOpenTask: (task: Task) => void
}

function KanbanColumnComponent({ status, tasks, membersById, onAddTask, onOpenTask }: KanbanColumnProps) {
  return (
    <section
      className="kanban-column"
      aria-label={`${status} column, ${tasks.length} tasks`}
      data-testid={`kanban-column-${status.replace(/\s+/g, '-').toLowerCase()}`}
    >
      <div className="kanban-column__header">
        <h3 className="kanban-column__title">
          {status}
          <span className="kanban-column__count" aria-hidden="true">
            {tasks.length}
          </span>
        </h3>
        <button
          type="button"
          className="kanban-column__add"
          onClick={() => onAddTask(status)}
          aria-label={`Add task to ${status}`}
          title={`Add task to ${status}`}
        >
          <Plus size={16} aria-hidden="true" />
        </button>
      </div>

      <ul className="kanban-column__list" role="list">
        {tasks.length === 0 ? (
          <li className="kanban-column__empty" role="listitem">
            <CloudOff size={20} aria-hidden="true" />
            <span>No tasks in {status}</span>
          </li>
        ) : (
          tasks.map((task) => (
            <KanbanTaskCard key={task.id} task={task} membersById={membersById} onOpen={onOpenTask} />
          ))
        )}
      </ul>
    </section>
  )
}

export const KanbanColumn = memo(KanbanColumnComponent)
