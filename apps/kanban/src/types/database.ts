export type Group = {
  id: string;
  name: string;
  module_code: string | null;
  is_encrypted: boolean;
  description: string | null;
  rules: string | null;
  capacity: number | null;
  created_at: string;
};


export type Achievement = {
  name: string;
  date: string;
};

export type Profile = {
  id: string; // matches auth.users UUID
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

export type TaskStatus = 'To Do' | 'In Progress' | 'In Review' | 'Done';

export type TaskCategory = 
  | 'Implementation' 
  | 'Architecture' 
  | 'UX/UI Design' 
  | 'Quality Assurance' 
  | 'Research' 
  | 'Mentorship' 
  | 'Documentation' 
  | 'DevOps' 
  | 'Ethics & Legal';

export type Task = {
  id: string;
  title: string;
  description: string | null;
  status: TaskStatus;
  category: TaskCategory; // NEW Field
  assignees: string[];
  group_id: string;
  is_coding_task: boolean; // Legacy
  due_date: string | null;
  created_at: string;
  artifacts?: Artifact[];
};

export type Commit = {
  hash: string;
  message: string;
  lines_added: number;
  lines_deleted: number;
  author_email: string | null;
  task_id: string | null;
  impact_score: number;
  created_at: string;
};

export type Artifact = {
  id: string;
  task_id: string;
  file_url: string;
  uploaded_by: string | null;
  endorsements_count: number;
  created_at: string;
};

export type AIUsage = {
  id: string;
  profile_id: string;
  action: string;
  created_at: string;
};
