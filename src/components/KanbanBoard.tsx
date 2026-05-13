'use client'

import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import { createBrowserSupabaseClient } from '@/lib/db-client'
import { AlertCircle, Search, X, RefreshCw, CloudOff } from 'lucide-react'
import { useConnectivity } from '@/context/ConnectivityContext'
import { Task, TaskStatus } from '@/types/database'
import { Profile } from '@/types/auth'
import { KanbanBoardProps } from '@/types/ui'
import TaskModal from './TaskModal'
import confetti from 'canvas-confetti'
import { distributeTaskScore } from '@/app/dashboard/actions'
import TeamChat from './TeamChat'
import { logActivity } from '@/utils/logging'

const COLUMNS: TaskStatus[] = ['To Do', 'In Progress', 'In Review', 'Done']

// Minimum drag duration (ms) before a drop is accepted.
// Prevents accidental fast flicks and ensures intentional placement.

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { KanbanBoardProps } from '@/types/ui';
import TaskModal from './TaskModal';
import { Task, TaskStatus, Profile } from '@/types/database';
import { AlertCircle, Search, X } from 'lucide-react';
import confetti from 'canvas-confetti';

const COLUMNS: TaskStatus[] = ['To Do', 'In Progress', 'In Review', 'Done'];
const MIN_DRAG_MS = 150;

export default function KanbanBoard({ groupId, profile, newTaskSignal }: KanbanBoardProps) {
  if (!groupId) return <div>Invalid Group</div>;
  return <KanbanBoardContent groupId={groupId} profile={profile} newTaskSignal={newTaskSignal} />;
}

function KanbanBoardContent({ groupId, profile, newTaskSignal }: KanbanBoardProps) {
  const [storageTasks, setStorageTasks] = useState<Task[]>([]);
  const [groupMembers, setGroupMembers] = useState<Profile[]>([]);
  const [pendingUpdates, setPendingUpdates] = useState<Set<string>>(new Set());
  const [boardError, setBoardError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [boardSearch, setBoardSearch] = useState('');
  const [activeDragColumn, setActiveDragColumn] = useState<TaskStatus | null>(null);
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const dragStartTimeRef = useRef<number>(0);

  // Fetch tasks from API
  const fetchTasks = useCallback(() => {
    fetch(`/api/kanban/tasks?group_id=${groupId}`)
      .then(res => res.json())
      .then(({ tasks, error }) => {
        if (tasks) setStorageTasks(tasks);
        if (error) setBoardError(error);
      });
  }, [groupId]);

  // Fetch group members from API
  const fetchGroupMembers = useCallback(() => {
    fetch(`/api/kanban/profiles?group_id=${groupId}`)
      .then(res => res.json())
      .then(({ profiles, error }) => {
        if (profiles) setGroupMembers(profiles);
        if (error) setBoardError(error);
      });
  }, [groupId]);

  useEffect(() => {
    fetchTasks();
    fetchGroupMembers();
    const interval = setInterval(() => setNow(Date.now()), 60000);
    return () => clearInterval(interval);
  }, [fetchTasks, fetchGroupMembers]);

  useEffect(() => {
    if (typeof newTaskSignal === 'number' && newTaskSignal > 0) {
      setSelectedTask(null);
      setIsModalOpen(true);
    }
  }, [newTaskSignal]);

  // CRUD via API
  const createTask = async (task: Partial<Task>) => {
    setPendingUpdates(prev => new Set(prev).add('new'));
    const res = await fetch('/api/kanban/tasks', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(task)
    });
    const { task: newTask, error } = await res.json();
    setPendingUpdates(prev => { const s = new Set(prev); s.delete('new'); return s; });
    if (error) setBoardError(error);
    else setStorageTasks(tasks => [...tasks, newTask]);
  };

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    setPendingUpdates(prev => new Set(prev).add(taskId));
    setStorageTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    const res = await fetch('/api/kanban/tasks', {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ id: taskId, status: newStatus })
    });
    const { error } = await res.json();
    setPendingUpdates(prev => { const s = new Set(prev); s.delete(taskId); return s; });
    if (error) setBoardError(error);
  };

  // Drag handlers with ARIA/keyboard
  const handleDragStart = (e: React.DragEvent, taskId: string) => {
    e.dataTransfer.setData('taskId', taskId);
    e.dataTransfer.effectAllowed = 'move';
    dragStartTimeRef.current = Date.now();
    setDraggingCardId(taskId);
  };
  const handleDragEnd = () => {
    setDraggingCardId(null);
    setActiveDragColumn(null);
  };
  const handleDragOver = (e: React.DragEvent, col: TaskStatus) => {
    e.preventDefault();
    setActiveDragColumn(col);
  };
  const handleDrop = async (e: React.DragEvent, newStatus: TaskStatus) => {
    e.preventDefault();
    setActiveDragColumn(null);
    const taskId = e.dataTransfer.getData('taskId');
    if (!taskId) return;
    const elapsed = Date.now() - dragStartTimeRef.current;
    if (elapsed < MIN_DRAG_MS) {
      setDraggingCardId(null);
      return;
    }
    setDraggingCardId(null);
    await updateTaskStatus(taskId, newStatus);
  };

  // Accessibility: Keyboard drag-and-drop
  const handleColumnKeyDown = (e: React.KeyboardEvent, col: TaskStatus) => {
    if (e.key === 'ArrowRight' || e.key === 'ArrowLeft') {
      const columns = document.querySelectorAll('.kanban-column');
      const idx = Array.from(columns).findIndex(el => el === e.currentTarget);
      if (e.key === 'ArrowRight' && idx < columns.length - 1) (columns[idx + 1] as HTMLElement).focus();
      if (e.key === 'ArrowLeft' && idx > 0) (columns[idx - 1] as HTMLElement).focus();
    }
  };

  // Modal accessibility: aria-modal, aria-labelledby, focus trap handled in TaskModal

  // Filtering
  const filteredTasks = useMemo(() => {
    if (!storageTasks) return [];
    const raw = Array.from(storageTasks);
    if (!boardSearch.trim()) return raw;
    const term = boardSearch.toLowerCase();
    return raw.filter(t =>
      t.title.toLowerCase().includes(term) ||
      t.description?.toLowerCase().includes(term) ||
      t.category?.toLowerCase().includes(term)
    );
  }, [storageTasks, boardSearch]);

  const tasksByStatus = useMemo(() => {
    const map: Record<TaskStatus, Task[]> = {
      'To Do': [],
      'In Progress': [],
      'In Review': [],
      'Done': []
    };
    filteredTasks.forEach(t => {
      if (map[t.status]) map[t.status].push(t);
    });
    return map;
  }, [filteredTasks]);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', width: '100%' }} aria-label="Kanban Board" role="region">
      {boardError && (
        <div className="error-message" style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-start', gap: '0.5rem', margin: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <AlertCircle size={16} />
            <span>{boardError}</span>
          </div>
          <button className="btn btn-secondary" style={{ marginTop: '0.5rem' }} onClick={fetchTasks}>
            Retry Sync
          </button>
        </div>
      )}
      <div className="kanban-board scroll-x-allowed" role="list" aria-label="Kanban Columns">
        {COLUMNS.map((col) => (
          <div
            key={col}
            className={`kanban-column${activeDragColumn === col ? ' kanban-column-active' : ''}`}
            role="listitem"
            aria-label={`${col} column`}
            tabIndex={0}
            onKeyDown={e => handleColumnKeyDown(e, col)}
          >
            <div className="kanban-column-header">
              <span>{col}</span>
              <span className="badge" style={{ backgroundColor: 'var(--bg-sub)', color: 'var(--text-sub)' }}>
                {tasksByStatus[col].length}
              </span>
            </div>
            <div
              className="kanban-task-list"
              onDragOver={e => handleDragOver(e, col)}
              onDrop={e => handleDrop(e, col)}
              aria-label={`${col} tasks`}
              role="list"
            >
              {tasksByStatus[col].map((task) => (
                <div
                  key={task.id}
                  className={`kanban-card${draggingCardId === task.id ? ' dragging' : ''}`}
                  draggable
                  aria-label={`Task: ${task.title}`}
                  tabIndex={0}
                  role="listitem"
                  onDragStart={e => handleDragStart(e, task.id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => { setSelectedTask(task); setIsModalOpen(true); }}
                  onKeyDown={e => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      setSelectedTask(task);
                      setIsModalOpen(true);
                    }
                  }}
                  style={{ position: 'relative', border: '1px solid var(--border)', padding: '0.5rem', marginBottom: '0.5rem', borderRadius: '8px', background: 'var(--bg-main)', cursor: 'grab' }}
                >
                  <div style={{ fontWeight: 700 }}>{task.title}</div>
                  <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>{task.description}</div>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
      {isModalOpen && (
        <TaskModal
          task={selectedTask}
          onClose={() => setIsModalOpen(false)}
          onSave={createTask}
          groupMembers={groupMembers}
          aria-modal="true"
          aria-labelledby="task-modal-title"
          role="dialog"
          tabIndex={-1}
        />
      )}
    </div>
  );
}
              <AlertCircle size={14} /> {overdueCount} Critical Tasks
            </span>
          )}
        </div>
        <div style={{ width: '100%', backgroundColor: 'var(--surface)', height: '8px', borderRadius: '4px', overflow: 'hidden', border: '1px solid var(--border)' }}>
          <div style={{ width: `${globalProbability}%`, height: '100%', backgroundColor: globalProbability < 30 ? 'var(--error)' : 'var(--brand)', transition: 'width 0.8s cubic-bezier(0.4, 0, 0.2, 1)' }}></div>
        </div>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '0.4rem' }}>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)', fontWeight: 700 }}>Velocity: <span style={{ color: 'var(--text-main)', fontWeight: 900 }}>{globalProbability}%</span></span>
          <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)', fontWeight: 700 }}>{storageTasks?.length || 0} Tasks</span>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem', gap: '1.5rem' }}>
        <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-sub)' }} />
          <input 
            type="text" 
            placeholder="Search system tasks..." 
            value={boardSearch}
            onChange={(e) => setBoardSearch(e.target.value)}
            style={{ 
              width: '100%', padding: '0.5rem 0.75rem 0.5rem 2.25rem', borderRadius: '8px', 
              background: 'var(--bg-sub)', border: '1px solid var(--border)', color: 'var(--text-main)', 
              fontSize: '0.8rem', outline: 'none', transition: 'all 0.2s', fontWeight: 600
            }}
            className="search-focus"
          />
          {boardSearch && (
            <button 
              onClick={() => setBoardSearch('')}
              style={{ position: 'absolute', right: '0.75rem', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', color: 'var(--text-sub)', cursor: 'pointer', display: 'flex' }}
            >
              <X size={16} />
            </button>
          )}
        </div>
        <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--success)', fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em' }} className="hide-mobile">
              <div className="pulse-pill" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--success)', boxShadow: '0 0 8px var(--success)' }} />
              Node Verified
            </div>
          <button className="btn btn-primary" onClick={() => { setSelectedTask(null); setIsModalOpen(true); }} style={{ width: 'auto', fontWeight: 900, padding: '0.6rem 1rem', borderRadius: '8px', fontSize: '0.8rem' }}>
            + Create Task
          </button>
        </div>
      </div>

      <div className="kanban-board scroll-x-allowed">
        {COLUMNS.map((col) => (
          <div
            key={col}
            className={`kanban-column ${activeDragColumn === col ? 'kanban-column-active' : ''}`}
          >
            <div className="kanban-column-header">
              <span>{col}</span>
              <span className="badge" style={{ backgroundColor: 'var(--bg-sub)', color: 'var(--text-sub)' }}>
                {filteredTasks.filter((t: Task) => t.status === col).length}
              </span>
            </div>

             <div
               className="kanban-task-list"
               onDragOver={(e) => handleDragOver(e, col)}
               onDragLeave={handleDragLeave}
               onDrop={(e) => handleDrop(e, col)}
             >
                  {tasksByStatus[col].map((task: Task) => {
                    const isDraggingThis = draggingCardId === task.id

                    return (
                      <div
                        key={task.id}
                        className={`kanban-card ${isDraggingThis ? 'dragging' : ''}`}
                        draggable
                        onDragStart={(e) => handleDragStart(e as unknown as React.DragEvent<HTMLDivElement>, task.id)}
                        onDragEnd={handleDragEnd}
                        onClick={() => { setSelectedTask(task); setIsModalOpen(true); }}
                        style={{
                          position: 'relative',
                          border: '1px solid var(--border)',
                          padding: '0.5rem',
                          cursor: isDraggingThis ? 'grabbing' : 'grab',
                          opacity: isDraggingThis ? 0.4 : 1,
                        }}
                      >
                     <div className="kanban-card-title" style={{ fontSize: '0.85rem', marginBottom: '0.4rem' }}>{task.title}</div>

                    {/* COMPACT PROGRESS BAR */}
                    <div style={{ marginTop: '0.5rem', marginBottom: '0.5rem' }}>
                      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.6rem', fontWeight: 700, color: 'var(--text-sub)', marginBottom: '0.15rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                        <span>Completion</span>
                        <span style={{ color: calculateProbability(task) < 30 ? 'var(--error)' : 'var(--text-sub)' }}>
                          {calculateProbability(task)}%
                        </span>
                      </div>
                      <div style={{ width: '100%', backgroundColor: 'var(--bg-sub)', height: '2px', borderRadius: '2px' }}>
                        <div style={{ width: `${calculateProbability(task)}%`, height: '100%', backgroundColor: calculateProbability(task) < 30 ? 'var(--error)' : calculateProbability(task) === 100 ? 'var(--success)' : 'var(--brand)', borderRadius: '2px', transition: 'width 0.4s ease' }}></div>
                      </div>
                    </div>

                    <div className="kanban-card-meta" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div style={{ display: 'flex', gap: '0.4rem', alignItems: 'center', flexWrap: 'wrap' }}>
                        <span
                          className="badge"
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '0.25rem',
                            background: task.category === 'Implementation' ? 'rgba(var(--brand-rgb), 0.1)' :
                              task.category === 'Architecture' ? 'rgba(139, 92, 246, 0.1)' :
                                task.category === 'UX/UI Design' ? 'rgba(236, 72, 153, 0.1)' :
                                  task.category === 'Quality Assurance' ? 'rgba(10, 185, 129, 0.1)' :
                                    task.category === 'Research' ? 'rgba(245, 158, 11, 0.1)' :
                                      task.category === 'Mentorship' ? 'rgba(99, 102, 241, 0.1)' :
                                        task.category === 'Documentation' ? 'rgba(100, 116, 139, 0.1)' :
                                          task.category === 'DevOps' ? 'rgba(6, 182, 212, 0.1)' :
                                            'rgba(239, 68, 68, 0.1)',
                            color: task.category === 'Implementation' ? 'var(--brand)' :
                              task.category === 'Architecture' ? '#8b5cf6' :
                                task.category === 'UX/UI Design' ? '#ec4899' :
                                  task.category === 'Quality Assurance' ? '#10b981' :
                                    task.category === 'Research' ? '#f59e0b' :
                                      task.category === 'Mentorship' ? '#6366f1' :
                                        task.category === 'Documentation' ? '#64748b' :
                                          task.category === 'DevOps' ? '#06b6d4' :
                                            'var(--error)',
                            border: 'none',
                            fontSize: '0.65rem',
                            fontWeight: 800
                          }}
                        >
                          {task.category || 'Legacy'}
                        </span>
                        
                        {pendingUpdates.has(task.id) && (
                          <span style={{ 
                            fontSize: '0.6rem', color: 'var(--brand)', fontWeight: 900, textTransform: 'uppercase', 
                            display: 'flex', alignItems: 'center', gap: '0.25rem', letterSpacing: '0.5px' 
                          }}>
                            <RefreshCw size={10} className="spin" />
                            Vault Sync
                          </span>
                        )}
                        
                        {!isOnline && (
                          <span style={{ 
                            fontSize: '0.6rem', color: 'var(--error)', fontWeight: 900, textTransform: 'uppercase', 
                            display: 'flex', alignItems: 'center', gap: '0.25rem' 
                          }}>
                            <CloudOff size={10} />
                            Local Mode
                          </span>
                        )}
                        {task.due_date && (
                          <span style={{ fontSize: '0.65rem', fontWeight: 600, color: new Date(task.due_date).getTime() < Date.now() && task.status !== 'Done' ? 'var(--error)' : 'var(--text-sub)' }}>
                            Due: {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                          </span>
                        )}
                      </div>

                      <div style={{ display: 'flex', gap: '0.2rem', flexWrap: 'wrap', justifyContent: 'flex-end', maxWidth: '40%' }}>
                        {(!task.assignees || task.assignees.length === 0) ? (
                          <span style={{ fontSize: '0.7rem', color: 'var(--text-sub)' }}>Unassigned</span>
                        ) : (
                          task.assignees.map((userId: string) => {
                            const user = groupMembers.find(m => m.id === userId)
                            const initial = user?.full_name ? user.full_name.substring(0, 1).toUpperCase() : '?'

                            return (
                              <button
                                key={userId}
                                onClick={(e) => { 
                                  e.stopPropagation(); 
                                  router.push(`/dashboard/network/profile/${userId}`);
                                }}
                                style={{
                                  position: 'relative', padding: 0, background: 'none', border: 'none', cursor: 'pointer',
                                  transition: 'transform 0.2s'
                                }}
                                className="avatar-bubble"
                              >
                                {user?.avatar_url ? (
                                  <Image
                                    src={user.avatar_url}
                                    alt={user.full_name || 'View Profile'}
                                    width={20}
                                    height={20}
                                    style={{ borderRadius: '50%', objectFit: 'cover', border: '1px solid var(--surface)', boxShadow: 'var(--shadow-sm)' }}
                                  />
                                ) : (
                                  <div
                                    title={user?.full_name || 'View Profile'}
                                    style={{
                                      width: '20px', height: '20px', borderRadius: '50%', backgroundColor: 'var(--brand)', color: 'white',
                                      display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.6rem', fontWeight: 'bold',
                                      border: '1px solid var(--surface)', boxShadow: 'var(--shadow-sm)'
                                    }}
                                  >
                                    {initial}
                                  </div>
                                )}
                              </button>
                            )
                          })
                        )}
                      </div>
                    </div>
                     </div>
                   )
                 })}
             </div>
          </div>
        ))}

        {groupId && (currentUserProfile || profile) && (
          <TeamChat groupId={groupId} user={(currentUserProfile || profile)!} />
        )}
      </div>

      {isModalOpen && (
        <TaskModal
          task={selectedTask}
          groupId={groupId}
          onRefresh={fetchTasksFromDB}
          onTaskSaved={fetchTasksFromDB}
          onClose={() => {
            setIsModalOpen(false)
            setSelectedTask(null)
          }}
          onlineUserIds={new Set([profile?.id].filter(Boolean) as string[])}
        />
      )}

      <style jsx>{`
        .avatar-bubble:hover { transform: scale(1.1) translateY(-1px); z-index: 10; filter: brightness(1.1); }
        .kanban-board { display: grid; grid-template-columns: repeat(4, 1fr); gap: var(--gap-md); min-height: 70vh; }
        @media (max-width: 1024px) {
          .kanban-board { display: flex; overflow-x: auto; padding-bottom: 1rem; }
          .kanban-column { flex: 0 0 calc(90vw); }
        }
        .kanban-column {
          background: var(--bg-main);
          border-radius: var(--radius);
          padding: 0.5rem;
          display: flex;
          flex-direction: column;
          gap: var(--gap-md);
          border: 1px solid var(--border);
          transition: border-color 0.2s ease, box-shadow 0.2s ease, background 0.2s ease;
        }
        .kanban-column-active {
          border-color: var(--brand) !important;
          background: rgba(var(--brand-rgb), 0.03) !important;
          box-shadow: 0 0 0 2px rgba(var(--brand-rgb), 0.15), inset 0 0 20px rgba(var(--brand-rgb), 0.04) !important;
        }
        .kanban-column-header {
          font-weight: 850;
          font-size: 0.75rem;
          text-transform: uppercase;
          color: var(--text-sub);
          display: flex;
          justify-content: space-between;
          align-items: center;
          padding: 0.4rem;
          border-bottom: 2px solid var(--border);
          margin-bottom: 0.25rem;
        }
        .kanban-task-list {
          flex: 1;
          display: flex;
          flex-direction: column;
          gap: 0.4rem;
          min-height: 150px;
          padding: 0.25rem;
          border-radius: 8px;
          transition: background 0.2s ease;
        }
        .kanban-card {
          background: var(--surface);
          border: 1px solid var(--border);
          border-radius: var(--radius);
          padding: 0.5rem;
          cursor: grab;
          box-shadow: var(--shadow-sm);
          user-select: none;
          -webkit-user-select: none;
        }
        .kanban-card:hover {
          border-color: var(--brand);
          box-shadow: 0 4px 16px rgba(var(--brand-rgb), 0.15), var(--shadow-sm);
          transform: translateY(-2px);
          transition: transform 0.18s ease, box-shadow 0.18s ease, border-color 0.18s ease;
        }
        .kanban-card-title { font-weight: 700; font-size: 0.9rem; color: var(--text-main); margin-bottom: 0.25rem; line-height: 1.3; }
         .remote-dragging { pointer-events: none; opacity: 0.7; filter: grayscale(0.5); }
      `}</style>
    </div>
  )
}

function KanbanBoardSkeleton() {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', width: '100%', marginTop: '1rem' }}>
      <div className="skeleton" style={{ height: '110px', borderRadius: '16px' }} />
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div className="skeleton skeleton-title" style={{ width: '30%' }} />
        <div className="skeleton" style={{ width: '100px', height: '38px', borderRadius: '14px' }} />
      </div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '1.5rem' }}>
        {[1, 2, 3, 4].map(i => (
          <div key={i} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
            <div className="skeleton skeleton-title" style={{ width: '40%', height: '1.2rem' }} />
            <div className="skeleton skeleton-card" style={{ height: '120px' }} />
          </div>
        ))}
      </div>
    </div>
  )
}
