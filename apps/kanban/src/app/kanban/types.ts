export type TaskStatus = 'To Do' | 'In Progress' | 'In Review' | 'Done';

export type Task = {
  id: string;
  group_id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  assignees?: string[];
  due_date?: string;
  artifacts?: any;
  category?: string;
};

export type KanbanBoardProps = {
  groupId: string;
  profile: Profile;
  newTaskSignal?: number;
};
// Shared types for Kanban and Admin

export type Profile = {
  id: string;
  email?: string;
  full_name?: string;
  avatar_url?: string;
  group_id?: string;
  total_score?: number;
};

// Add other shared types here as needed
