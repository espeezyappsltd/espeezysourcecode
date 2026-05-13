
'use client';
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import Image from 'next/image';
import { AlertCircle, Search, X, RefreshCw, CloudOff } from 'lucide-react';
import { useConnectivity } from '@/context/ConnectivityContext';
import { Task, TaskStatus } from '@/types/database';
import { Profile } from '@/types/auth';
import { KanbanBoardProps } from '@/types/ui';
import TaskModal from './TaskModal';
import confetti from 'canvas-confetti';
import { distributeTaskScore } from '@/app/dashboard/actions';
import TeamChat from './TeamChat';
import { logActivity } from '@/utils/logging';

const COLUMNS: TaskStatus[] = ['To Do', 'In Progress', 'In Review', 'Done'];
const MIN_DRAG_MS = 150;

export default function KanbanBoard({ groupId, profile, newTaskSignal }: KanbanBoardProps) {
  if (!groupId) return <div>Invalid Group</div>;
  // ...existing code...
  // The rest of the KanbanBoard implementation remains unchanged
  // ...existing code...
}
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
  }
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
