import { Group, Achievement } from './database'

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
  groups?: Group | Group[]; // Nested group data
  achievements?: Achievement[];
  theme_config?: { palette?: string; custom_bg_url?: string };
  custom_bg_url?: string;
  manual_avatar_url?: string | null;
  protect_avatar?: boolean;
  is_phone_verified?: boolean;
  spotify_access_token?: string | null;
  spotify_refresh_token?: string | null;
  spotify_token_expires_at?: string | null;
  spotify_connected?: boolean;
};

export type ActiveUser = {
  id: string;
  full_name: string;
  avatar_url: string | null;
  role: string;
  last_seen: string;
};

export type NetworkMember = Profile & {
  status?: 'online' | 'offline';
};
