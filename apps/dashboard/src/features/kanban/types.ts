import type { User } from "@supabase/supabase-js"

export type Achievement = {
  name: string;
  date: string;
};

export type Profile = {
  id: string;
  email: string | null;
  full_name: string | null;
  avatar_url: string | null;
  course_name: string | null;
  enrollment_year: number | null;
  completion_year: number | null;
  role: string | null;
  rank: string | null;
  badges_count: number | null;
  school_id: string | null;
  group_id: string | null;
  subscription_plan?: string | null;
  subscription_status?: string | null;
  subscription_started_at?: string | null;
  total_score: number;
  created_at: string;
  tagline?: string | null;
  biography?: string | null;
  stack?: string | null;
  last_seen?: string | null;
  achievements?: Achievement[] | null;
};

export type TaskStatus = "To Do" | "In Progress" | "In Review" | "Done";

export type TaskCategory =
  | "Implementation"
  | "Architecture"
  | "UX/UI Design"
  | "Quality Assurance"
  | "Research"
  | "Mentorship"
  | "Documentation"
  | "DevOps"
  | "Ethics & Legal";

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  category: TaskCategory;
  assignees: string[];
  group_id: string;
  due_date: string | null;
  created_at: string;
  artifacts?: Artifact[];
};

export type Artifact = {
  id: string;
  task_id: string;
  file_url: string;
  uploaded_by: string | null;
  endorsements_count: number;
  created_at: string;
};

export interface KanbanBoardProps {
  groupId: string;
  profile: Profile;
  newTaskSignal?: number;
}

export type ChatPayload = {
  type: "image" | "file"
  url: string
  name?: string
}

export interface ChatMessage {
  id: string
  group_id: string
  user_id: string
  content: string
  created_at: string
  is_deleted: boolean
  profiles?: {
    full_name: string | null
    avatar_url: string | null
    role: string | null
  }
  payload?: ChatPayload
  pending?: boolean
}

export type TaskModalProps = {
  task: Task | null
  groupId: string
  onClose: () => void
  onRefresh: () => Promise<void> | void
  onTaskSaved?: () => Promise<void> | void
  initialDueDate?: string
  onlineUserIds?: Set<string>
}
