'use client'

import Image from 'next/image'
import { Check } from 'lucide-react'
import { CategoryTabs } from '@shared/CategoryTabs'
import type { TaskCategory, TaskStatus } from '@/types/database'
import type { UseTaskModalReturn } from './useTaskModal'
import { CATEGORIES, COLUMNS } from './constants'
import { FormField } from '@/components/forms/FormField'

export type TaskModalFormProps = Pick<
  UseTaskModalReturn,
  | 'title'
  | 'setTitle'
  | 'description'
  | 'setDescription'
  | 'status'
  | 'setStatus'
  | 'category'
  | 'setCategory'
  | 'dueDate'
  | 'setDueDate'
  | 'members'
  | 'assignees'
  | 'searchQuery'
  | 'setSearchQuery'
  | 'onlineUsers'
  | 'handleAIGenerate'
  | 'aiLoading'
  | 'aiError'
  | 'toggleMemberAssignment'
>

export function TaskModalForm({
  title,
  setTitle,
  description,
  setDescription,
  status,
  setStatus,
  category,
  setCategory,
  dueDate,
  setDueDate,
  members,
  assignees,
  searchQuery,
  setSearchQuery,
  onlineUsers,
  handleAIGenerate,
  aiLoading,
  aiError,
  toggleMemberAssignment,
}: TaskModalFormProps) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', marginBottom: '1rem' }}>
      <FormField label="Task name" required>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          placeholder="What needs to be done?"
          autoFocus
          style={{ fontSize: '1rem' }}
        />
      </FormField>

      <FormField
        label="Description"
        hint="Use AI Assist to generate a polished description from the task title."
        error={aiError ?? undefined}
        labelAction={
          <button
            type="button"
            onClick={handleAIGenerate}
            disabled={aiLoading || !title.trim()}
            className="secondary-button"
            aria-label="Use AI to generate description"
            style={{
              padding: '0.55rem 0.85rem',
              fontSize: '0.85rem',
              borderRadius: '999px',
              minWidth: '124px',
              opacity: aiLoading || !title.trim() ? 0.7 : 1,
            }}
          >
            {aiLoading ? 'Generating…' : 'AI Assist'}
          </button>
        }
      >
        <textarea
          value={description || ''}
          onChange={(e) => setDescription(e.target.value)}
          placeholder="Add more details about this task..."
          rows={3}
          style={{ resize: 'vertical', fontSize: '0.95rem' }}
        />
      </FormField>

      <div style={{ display: 'flex', gap: '1rem', width: '100%', flexWrap: 'wrap' }}>
        <div style={{ flex: '1 1 150px' }}>
          <FormField label="Status">
            <select value={status} onChange={(e) => setStatus(e.target.value as TaskStatus)}>
              {COLUMNS.map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <div className="form-group" style={{ flex: '1 1 100%', marginBottom: 0 }}>
          <span className="form-label" id="task-category-label">
            Category
          </span>
          <CategoryTabs categories={CATEGORIES} selected={category} onSelect={(cat) => setCategory(cat as TaskCategory)} />
        </div>

        <div style={{ flex: '1 1 150px' }}>
          <FormField label="Due date" required>
            <input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
              style={{ borderColor: dueDate ? 'var(--border)' : 'var(--error)' }}
            />
          </FormField>
        </div>
      </div>

      <div style={{ marginTop: '0.5rem' }}>
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: '1rem',
            flexWrap: 'wrap',
            gap: '0.5rem',
          }}
        >
          <span className="form-label" style={{ margin: 0 }}>
            Assignments
          </span>
          <div style={{ width: '100%', maxWidth: 220 }}>
            <FormField label="Search collaborators" hideLabel>
              <input
                type="search"
                placeholder="Search collaborators..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{ fontSize: '0.75rem', padding: '0.4rem 0.75rem', borderRadius: '8px' }}
              />
            </FormField>
          </div>
        </div>

        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))',
            gap: '0.75rem',
            maxHeight: '180px',
            overflowY: 'auto',
            padding: '0.25rem',
          }}
        >
          {members.length === 0 ? (
            [1, 2, 3].map((i) => <div key={i} className="skeleton" style={{ height: '40px', borderRadius: '12px' }} />)
          ) : (
            members
              .filter(
                (m) =>
                  !searchQuery ||
                  m.full_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                  m.school_id?.toLowerCase().includes(searchQuery.toLowerCase()),
              )
              .map((member) => {
                const isAssigned = assignees.includes(member.id)
                const isOnline = onlineUsers.has(member.id)
                const initials = member.full_name
                  ? member.full_name
                      .split(' ')
                      .map((n: string) => n[0])
                      .join('')
                      .toUpperCase()
                  : '?'

                return (
                  <div
                    key={member.id}
                    tabIndex={0}
                    role="checkbox"
                    aria-checked={isAssigned}
                    aria-label={`Assign to ${member.full_name || 'Member'}`}
                    onClick={() => toggleMemberAssignment(member.id)}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        toggleMemberAssignment(member.id)
                      }
                    }}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem',
                      padding: '0.5rem',
                      borderRadius: '10px',
                      backgroundColor: isAssigned ? 'rgba(var(--brand-rgb), 0.05)' : 'transparent',
                      border: isAssigned ? '1.5px solid var(--brand)' : '1px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                      position: 'relative',
                      outline: 'none',
                    }}
                    onFocus={(e) => (e.currentTarget.style.borderColor = 'var(--brand)')}
                    onBlur={(e) => (e.currentTarget.style.borderColor = isAssigned ? 'var(--brand)' : 'var(--border)')}
                  >
                    <div style={{ position: 'relative', flexShrink: 0 }}>
                      {member.avatar_url ? (
                        <Image
                          src={member.avatar_url}
                          width={24}
                          height={24}
                          style={{ width: '24px', height: '24px', borderRadius: '50%', objectFit: 'cover' }}
                          alt={member.full_name || 'Member'}
                        />
                      ) : (
                        <div
                          style={{
                            width: '24px',
                            height: '24px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--brand)',
                            color: 'white',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            fontSize: '0.65rem',
                            fontWeight: 700,
                          }}
                        >
                          {initials}
                        </div>
                      )}
                      {isOnline && (
                        <div
                          style={{
                            position: 'absolute',
                            bottom: '-1px',
                            right: '-1px',
                            width: '8px',
                            height: '8px',
                            borderRadius: '50%',
                            backgroundColor: 'var(--success)',
                            border: '1.5px solid var(--surface)',
                          }}
                        />
                      )}
                    </div>
                    <div style={{ overflow: 'hidden' }}>
                      <div
                        style={{
                          fontSize: '0.7rem',
                          fontWeight: 600,
                          color: 'var(--text-main)',
                          whiteSpace: 'nowrap',
                          textOverflow: 'ellipsis',
                        }}
                      >
                        {member.full_name?.split(' ')[0]}
                      </div>
                    </div>
                    {isAssigned && (
                      <div
                        style={{
                          position: 'absolute',
                          top: '-4px',
                          right: '-4px',
                          width: '14px',
                          height: '14px',
                          borderRadius: '50%',
                          backgroundColor: 'var(--brand)',
                          color: 'white',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                        }}
                      >
                        <Check size={10} aria-hidden />
                      </div>
                    )}
                  </div>
                )
              })
          )}
        </div>
      </div>
    </div>
  )
}
