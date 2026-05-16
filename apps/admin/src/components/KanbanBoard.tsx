
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { useConnectivity } from '@/context/ConnectivityContext';
import { Task, TaskStatus, Profile } from '@/types/database';
import { KanbanBoardProps } from '@/types/ui';
import TaskModal from './TaskModal';
import TeamChat from './TeamChat';
import { AlertCircle, RefreshCw, CloudOff } from 'lucide-react';
import { getErrorMessage } from '@/utils/errors';

const COLUMNS: TaskStatus[] = ['To Do', 'In Progress', 'In Review', 'Done'];



export default function KanbanBoard({ groupId, profile }: KanbanBoardProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [groupMembers, setGroupMembers] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const isOnline = useConnectivity();

  // Fetch tasks and members

  // Contextual Help Button
  const openKanbanHelp = () => {
    window.dispatchEvent(new CustomEvent('open-help-tray'));
    setTimeout(() => {
      const el = document.querySelector('a[href="/docs/features/kanban"]');
      if (el) (el as HTMLElement).focus();
    }, 350);
  };
  const fetchAll = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const [tasksRes, membersRes] = await Promise.all([
        fetch(`/api/kanban/tasks?group_id=${groupId}`),
        fetch(`/api/kanban/profiles?group_id=${groupId}`)
      ]);
      const { tasks, error: taskError } = await tasksRes.json();
      const { profiles, error: memberError } = await membersRes.json();
      if (taskError) throw new Error(taskError);
      if (memberError) throw new Error(memberError);
      setTasks(tasks || []);
      setGroupMembers(profiles || []);
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Failed to load board data.'));
    } finally {
      setLoading(false);
    }
  }, [groupId]);

  useEffect(() => {
    fetchAll();
  }, [fetchAll]);

  // CRUD
  const createTask = async (task: Partial<Task>) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch('/api/kanban/tasks', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(task)
      });
      const { task: newTask, error } = await res.json();
      if (error) throw new Error(error);
      setTasks(prev => [...prev, newTask]);
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Failed to create task.'));
    } finally {
      setLoading(false);
    }
  };

  const updateTaskStatus = async (taskId: string, newStatus: TaskStatus) => {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/kanban/tasks/${taskId}`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      const { task: updatedTask, error } = await res.json();
      if (error) throw new Error(error);
      setTasks(prev => prev.map(t => t.id === taskId ? updatedTask : t));
    } catch (e: unknown) {
      setError(getErrorMessage(e, 'Failed to update task.'));
    } finally {
      setLoading(false);
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
        <button onClick={fetchAll} style={{ marginLeft: 16, background: '#10b981', color: 'white', border: 'none', borderRadius: 8, padding: '0.5rem 1rem', cursor: 'pointer' }}>Retry</button>
      </div>
    );
  }
  if (!tasks.length) {
    return (
      <div role="region" aria-label="Kanban Board" style={{ padding: '2rem', textAlign: 'center', color: '#888' }}>
        <CloudOff style={{ marginBottom: 8 }} />
        No tasks yet. Get started by adding a new task.
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
        <div key={col} role="list" aria-label={col} style={{ minWidth: 280, flex: 1, background: '#18181b', borderRadius: 12, padding: 16 }}>
          <h3 style={{ color: '#10b981', fontWeight: 700, fontSize: 18, marginBottom: 12 }}>{col}</h3>
          {tasks.filter(t => t.status === col).length === 0 ? (
            <div style={{ color: '#888', fontSize: 14, padding: '1rem 0' }}>No tasks</div>
          ) : (
            tasks.filter(t => t.status === col).map(task => (
              <div key={task.id} tabIndex={0} role="listitem" aria-label={task.title} style={{ background: '#232326', borderRadius: 8, marginBottom: 12, padding: 12, outline: 'none' }}>
                <div style={{ fontWeight: 600 }}>{task.title}</div>
                <div style={{ fontSize: 13, color: '#aaa' }}>{task.description}</div>
                <button onClick={() => { setSelectedTask(task); setIsModalOpen(true); }} style={{ marginTop: 8, background: '#10b981', color: 'white', border: 'none', borderRadius: 6, padding: '0.3rem 0.7rem', fontSize: 13, cursor: 'pointer' }}>View</button>
              </div>
            ))
          )}
        </div>
      ))}
      {isModalOpen && selectedTask && (
        <TaskModal
          task={selectedTask}
          groupId={groupId}
          onClose={() => setIsModalOpen(false)}
          onRefresh={fetchAll}
          onTaskSaved={fetchAll}
          initialDueDate={selectedTask.due_date || undefined}
          onlineUserIds={new Set(groupMembers.map(m => m.id))}
        />
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
