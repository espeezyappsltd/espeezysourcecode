'use client'

import { memo, useMemo } from 'react'
import type { Task, Profile } from '@/types/database'

const CATEGORY_ACCENT: Record<string, string> = {
  Implementation: '#38bdf8',
  Architecture: '#8b5cf6',
  'UX/UI Design': '#ec4899',
  'Quality Assurance': '#10b981',
  Research: '#f59e0b',
  Mentorship: '#6366f1',
  Documentation: '#64748b',
  DevOps: '#06b6d4',
  'Ethics & Legal': '#ef4444',
}

export type KanbanTaskCardProps = {
  task: Task
  membersById: Map<string, Profile>
  onOpen: (task: Task) => void
}

function KanbanTaskCardComponent({ task, membersById, onOpen }: KanbanTaskCardProps) {
  const accent = CATEGORY_ACCENT[task.category] ?? 'var(--brand)'
  const isDone = task.status === 'Done'
  const isOverdue =
    Boolean(task.due_date) && new Date(task.due_date!) < new Date() && !isDone

  const assigneePreview = useMemo(() => {
    return (task.assignees ?? []).slice(0, 3).map((uid) => {
      const m = membersById.get(uid)
      return { uid, name: m?.full_name ?? 'Team member', avatar: m?.avatar_url }
    })
  }, [task.assignees, membersById])

  return (
    <li>
      <button
        type="button"
        className={`kanban-card${isDone ? ' kanban-card--done' : ''}`}
        style={{ '--kanban-accent': accent } as React.CSSProperties}
        data-testid={`kanban-task-${task.id}`}
        data-status={task.status}
        aria-label={`${task.title}. ${task.status}. ${task.category}.${task.description ? ` ${task.description}` : ''}`}
        onClick={() => onOpen(task)}
      >
        <span className="kanban-card__accent" aria-hidden="true" />
        <div className="kanban-card__meta">
          <span className="kanban-card__category">{task.category}</span>
        </div>
        <h4 className="kanban-card__title">{task.title}</h4>
        {task.description ? <p className="kanban-card__desc">{task.description}</p> : null}
        <div className="kanban-card__footer">
          {assigneePreview.length > 0 ? (
            <div className="kanban-card__avatars" aria-label={`Assigned: ${assigneePreview.map((a) => a.name).join(', ')}`}>
              {assigneePreview.map((a) => (
                <div key={a.uid} className="kanban-card__avatar" title={a.name}>
                  {a.avatar ? (
                    <img src={a.avatar} alt="" width={22} height={22} loading="lazy" decoding="async" />
                  ) : (
                    <span aria-hidden="true" style={{ fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
                      {a.name[0]}
                    </span>
                  )}
                </div>
              ))}
            </div>
          ) : (
            <span />
          )}
          {task.due_date ? (
            <time
              className={`kanban-card__due${isOverdue ? ' kanban-card__due--overdue' : ''}`}
              dateTime={task.due_date}
            >
              {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
            </time>
          ) : null}
        </div>
      </button>
    </li>
  )
}

export const KanbanTaskCard = memo(KanbanTaskCardComponent, (prev, next) => {
  const a = prev.task
  const b = next.task
  return (
    a.id === b.id &&
    a.title === b.title &&
    a.description === b.description &&
    a.status === b.status &&
    a.category === b.category &&
    a.due_date === b.due_date &&
    JSON.stringify(a.assignees) === JSON.stringify(b.assignees) &&
    prev.membersById === next.membersById &&
    prev.onOpen === next.onOpen
  )
})
