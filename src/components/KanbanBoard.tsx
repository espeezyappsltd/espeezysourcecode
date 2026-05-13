
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
  const router = useRouter();
  const [pendingUpdates, setPendingUpdates] = useState<Set<string>>(new Set());
  const [boardError, setBoardError] = useState<string | null>(null);
  const [now, setNow] = useState(() => Date.now());
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [boardSearch, setBoardSearch] = useState('');
  const [activeDragColumn, setActiveDragColumn] = useState<TaskStatus | null>(null);
  const [draggingCardId, setDraggingCardId] = useState<string | null>(null);
  const dragStartTimeRef = useRef<number>(0);
  const [tasks, setStorageTasks] = useState<Task[]>([]);
  const [groupMembers, setGroupMembers] = useState<Profile[]>([]);
  const isOnline = useConnectivity();
  const currentUserProfile = profile;

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
      Promise.resolve().then(() => {
        setSelectedTask(null);
        setIsModalOpen(true);
      });
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
    // TODO: implement status update logic here
  };

  // ...rest of KanbanBoard rendering logic goes here (omitted for brevity, but should include the JSX for the board, cards, modals, etc.)
  // For now, render a placeholder:
  return <div>Kanban Board UI (fix JSX and logic as needed)</div>;
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
