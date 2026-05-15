import { Profile } from './database'

export type PostReactionType = 'like' | 'love' | 'fire' | 'clap' | 'insightful' | 'celebrate'

export interface PostReaction {
  reaction: PostReactionType
  user_id: string
}

export interface Post {
  id: string
  author_id: string
  content: string
  media_urls: string[]
  post_type: string
  visibility: 'public' | 'connections'
  created_at: string
  edited_at: string | null
  group_id: string | null
  author: Partial<Profile> | null
  reactions: PostReaction[]
  comments: Array<{ count: number }>
}

export interface Comment {
  id: string
  post_id: string
  author_id: string
  content: string
  created_at: string
  edited_at: string | null
  author: Partial<Profile> | null
}
