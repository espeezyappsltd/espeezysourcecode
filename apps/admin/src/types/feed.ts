import type { Profile } from './database'

export type FeedPostReactionType = 'like' | 'love' | 'fire' | 'clap' | 'insightful' | 'celebrate'

export interface FeedPostAuthor {
  id: string
  full_name: string
  username?: string
  avatar_url?: string
  role?: string
}

export type FeedReaction = 'like' | 'love' | 'fire' | 'clap' | 'insightful' | 'celebrate'

export interface FeedPost {
  id: string
  author_id?: string
  content: string
  media_urls: string[]
  post_type: string
  visibility: 'public' | 'connections' | string
  created_at: string
  edited_at?: string | null
  group_id?: string | null
  author: FeedPostAuthor | null
  reactions: { reaction: FeedReaction; user_id: string }[]
  comments: { count: number }[]
}

export interface FeedComment {
  id: string
  post_id?: string
  author_id?: string
  content: string
  created_at: string
  edited_at?: string | null
  parent_id?: string
  author: FeedPostAuthor
}
