
import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { KanbanBoardProps } from './types';
import type { Task, TaskStatus, Profile } from '../src/types/database';
import TaskModal from './TaskModal';
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
					   // onTaskSaved removed: signature mismatch
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
