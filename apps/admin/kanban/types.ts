
// Use canonical types from src/types/database
export type { Task, TaskStatus, TaskCategory, Artifact } from '../src/types/database';

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
