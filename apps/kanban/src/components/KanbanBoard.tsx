
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useConnectivity } from '@/context/ConnectivityContext';
import { Task, TaskStatus, Profile } from '@/types/database';
import { KanbanBoardProps } from '@/types/ui';
import TaskModal from './TaskModal';
import TeamChat from './TeamChat';
import KanbanOnboardingModal from './KanbanOnboardingModal';
import { AlertCircle, RefreshCw, CloudOff, Plus } from 'lucide-react';
import { fetchGroupMembers, createTask as createTaskApi } from '@/services/dashboard';
import { handleTaskStatusUpdate } from '@/app/actions';
import { db } from '@/lib/db-client';

const COLUMNS: TaskStatus[] = ['To Do', 'In Progress', 'In Review', 'Done'];



export default function KanbanBoard({ groupId, profile, newTaskSignal }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [groupMembers, setGroupMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isOnboardingOpen, setIsOnboardingOpen] = useState(false);
  const [activeColumn, setActiveColumn] = useState<TaskStatus | undefined>();
  const isOnline = useConnectivity();

  // Fetch tasks and members

  // Contextual Help Button
  const openKanbanHelp = () => {
    setIsOnboardingOpen(true);
  };

  // Handle "New Task" signal from DashboardHome
  const lastSignalRef = useRef(newTaskSignal);
  useEffect(() => {
    if (newTaskSignal !== undefined && newTaskSignal > (lastSignalRef.current || 0)) {
      setSelectedTask(null);
      setActiveColumn('To Do');
      setIsModalOpen(true);
    }
    lastSignalRef.current = newTaskSignal;
  }, [newTaskSignal]);

  useEffect(() => {
    setLoading(true);
    fetchGroupMembers(groupId).then(setGroupMembers).catch(console.error);

    // REALTIME TASK LOOP & PRESENCE
    const channel = db.channel(`kanban-tasks-${groupId}`)
      .on(
        'postgres_changes',
        { 
          event: '*', 
          schema: 'public', 
          table: 'tasks', 
          filter: `group_id=eq.${groupId}` 
        },
        (payload) => {
          console.log('Realtime task update:', payload);
          if (payload.eventType === 'INSERT') {
            setTasks(prev => [...prev, payload.new as Task]);
          } else if (payload.eventType === 'UPDATE') {
            setTasks(prev => prev.map(t => t.id === payload.new.id ? payload.new as Task : t));
          } else if (payload.eventType === 'DELETE' && payload.old) {
            const oldId = (payload.old as { id: string }).id;
            setTasks(prev => prev.filter(t => t.id === oldId));
          }
        }
      )
      .on('presence', { event: 'sync' }, () => {
        const state = channel.presenceState();
        console.log('Presence state synced:', state);
        // We can use this to update online status in parent or local state
        window.dispatchEvent(new CustomEvent('presence-sync', { detail: state }));
      })
      .on('presence', { event: 'join' }, ({ newPresences }) => {
        console.log('Joined:', newPresences);
      })
      .on('presence', { event: 'leave' }, ({ leftPresences }) => {
        console.log('Left:', leftPresences);
      })
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          setLoading(false);
          await channel.track({
            user_id: profile.id,
            online_at: new Date().toISOString(),
          });
        }
      });

    // Initial fetch
    db.from('tasks').select('*').eq('group_id', groupId).then(({ data }) => {
      if (data) setTasks(data as Task[]);
    });

    return () => {
      db.removeChannel(channel);
    };
  }, [groupId]);

  useEffect(() => {
    const handler = () => setIsOnboardingOpen(true);
    window.addEventListener('open-kanban-onboarding', handler);
    return () => window.removeEventListener('open-kanban-onboarding', handler);
  }, []);

  // CRUD
  const createTask = async (task: Partial<Task>) => {
    setLoading(true);
    setError(null);
    try {
      const newTask = await createTaskApi(task);
      setTasks(prev => [...prev, newTask]);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to create task.');
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    // Optimistic UI update
    const oldTasks = [...tasks];
    setTasks(prev => prev.map(t => t.id === taskId ? { ...t, status: newStatus } : t));
    
    try {
      await handleTaskStatusUpdate(taskId, newStatus, groupId, profile.id);
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Failed to update task.');
      setTasks(oldTasks); // Rollback
    }
  };

  // Accessibility: ARIA roles, keyboard nav, error/empty/loading states
  if (loading) {
    return (
      <div role="status" aria-busy="true" style={{ padding: '2rem', textAlign: 'center' }}>
        <RefreshCw className="animate-spin" style={{ margin: '0 auto', color: '#10b981' }} />
        <div>Loading board…</div>
      </div>
    );
  }
  if (error) {
    return (
      <div role="alert" style={{ color: '#ef4444', padding: '2rem', textAlign: 'center' }}>
        <AlertCircle style={{ marginBottom: 8 }} />
        {error}
        <button onClick={() => window.location.reload()} style={{ marginLeft: 16, background: '#10b981', color: 'white', border: 'none', borderRadius: 8, padding: '0.5rem 1rem', cursor: 'pointer' }}>Retry</button>
      </div>
    );
  }


  // Main Kanban UI (simplified, modularize as needed)
  return (
    <div style={{ position: 'relative' }}>
      {/* Contextual Help Button */}
      <button
        aria-label="How to use Kanban Board"
        title="How to use Kanban Board"
        onClick={openKanbanHelp}
        style={{
          position: 'absolute',
          top: 8,
          right: 8,
          zIndex: 20,
          background: 'rgba(59,130,246,0.09)',
          border: '1px solid rgba(59,130,246,0.18)',
          borderRadius: 12,
          padding: '0.5rem 0.8rem',
          color: '#2563eb',
          fontWeight: 900,
          fontSize: '1rem',
          boxShadow: 'var(--shadow-xs)',
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          cursor: 'pointer'
        }}
      >
        <svg width="18" height="18" fill="none" stroke="#2563eb" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" viewBox="0 0 24 24"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 1 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>
        <span style={{ fontWeight: 700, fontSize: '0.97rem' }}>How to use Kanban</span>
      </button>
      <div role="region" aria-label="Kanban Board" style={{ display: 'flex', gap: 24, padding: 24, overflowX: 'auto' }}>
      {COLUMNS.map(col => (
        <div key={col} role="list" aria-label={col} style={{ minWidth: 300, flex: 1, background: 'rgba(24, 24, 27, 0.4)', backdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.05)', borderRadius: 20, padding: 20, display: 'flex', flexDirection: 'column' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
            <h3 style={{ color: '#ffffff', fontWeight: 800, fontSize: 16, margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              {col}
              <span style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.1)', padding: '0.1rem 0.5rem', borderRadius: '999px', color: '#888' }}>
                {tasks.filter(t => t.status === col).length}
              </span>
            </h3>
            <button 
              onClick={() => { setSelectedTask(null); setActiveColumn(col); setIsModalOpen(true); }}
              style={{ background: 'rgba(16, 185, 129, 0.1)', color: '#10b981', border: 'none', borderRadius: '8px', width: '28px', height: '28px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
              title={`Add task to ${col}`}
              aria-label={`Add task to ${col} column`}
            >
              <Plus size={16} />
            </button>
          </div>

          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1rem', minHeight: '100px' }}>
            {tasks.filter(t => t.status === col).length === 0 ? (
              <div style={{ 
                flex: 1, 
                display: 'flex', 
                flexDirection: 'column', 
                alignItems: 'center', 
                justifyContent: 'center', 
                padding: '2rem 1rem', 
                color: 'var(--text-sub)', 
                fontSize: '0.8rem', 
                border: '1px dashed var(--border)', 
                borderRadius: '14px',
                opacity: 0.6,
                gap: '0.5rem'
              }}>
                <CloudOff size={20} />
                <span>No tasks in {col}</span>
              </div>
            ) : (
              tasks.filter(t => t.status === col).map(task => (
                <div 
                  key={task.id} 
                  tabIndex={0} 
                  role="button" 
                  aria-label={`Task: ${task.title}. ${task.description || ''}`} 
                  onClick={() => { setSelectedTask(task); setIsModalOpen(true); }}
                  onKeyDown={(e) => {
                    if (e.key === 'Enter' || e.key === ' ') {
                      e.preventDefault();
                      setSelectedTask(task);
                      setIsModalOpen(true);
                    }
                  }}
                  style={{ 
                    background: 'rgba(255,255,255,0.03)', 
                    border: '1px solid rgba(255,255,255,0.05)',
                    borderRadius: '14px', 
                    padding: '1rem', 
                    cursor: 'pointer',
                    transition: 'all 0.2s ease',
                    outline: 'none'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.05)';
                    e.currentTarget.style.transform = 'translateY(-2px)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.background = 'rgba(255,255,255,0.03)';
                    e.currentTarget.style.transform = 'translateY(0)';
                  }}
                >
                  <div style={{ fontWeight: 700, fontSize: '0.9rem', marginBottom: '0.4rem', color: '#f4f4f5' }}>{task.title}</div>
                  {task.description && (
                    <div style={{ fontSize: '0.75rem', color: '#a1a1aa', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical', overflow: 'hidden' }}>
                      {task.description}
                    </div>
                  )}
                  
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginTop: '1rem' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '-0.4rem' }}>
                      {(task.assignees || []).slice(0, 3).map((uid) => {
                        const m = groupMembers.find(gm => gm.id === uid);
                        return (
                          <div key={uid} style={{ width: 22, height: 22, borderRadius: '50%', border: '2px solid #18181b', background: '#333', overflow: 'hidden' }} title={`Assigned to ${m?.full_name || 'Team Member'}`}>
                             {m?.avatar_url ? <img src={m.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt={m.full_name || 'Avatar'} /> : <div style={{ fontSize: 10, display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }} aria-label={m?.full_name || 'Team Member'}>{(m?.full_name || '?')[0]}</div>}
                          </div>
                        )
                      })}
                    </div>
                    {task.due_date && (
                      <div style={{ fontSize: '0.65rem', color: '#71717a', background: 'rgba(0,0,0,0.2)', padding: '0.1rem 0.4rem', borderRadius: '4px' }}>
                        {new Date(task.due_date).toLocaleDateString(undefined, { month: 'short', day: 'numeric' })}
                      </div>
                    )}
                  </div>
                </div>
              ))
            )}
          </div>

        </div>
      ))}
      {isModalOpen && (
        <TaskModal
          task={selectedTask || undefined}
          groupId={groupId}
          initialStatus={activeColumn}
          onClose={() => setIsModalOpen(false)}
          onRefresh={async () => {
             // Realtime handles this, but we can force fetch if needed
             const { data } = await db.from('tasks').select('*').eq('group_id', groupId);
             if (data) setTasks(data as Task[]);
          }}
          onTaskSaved={() => setIsModalOpen(false)}
          onlineUserIds={new Set(groupMembers.map(m => m.id))}
        />
      )}

      {isOnboardingOpen && (
        <KanbanOnboardingModal onClose={() => setIsOnboardingOpen(false)} />
      )}
      </div>
    </div>
  );
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
