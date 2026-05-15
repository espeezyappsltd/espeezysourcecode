import { Post, Comment, PostReactionType } from '@/types/feed'

export async function fetchFeedPosts(cursor?: string) {
  const url = `/api/feed?filter=public${cursor ? `&cursor=${encodeURIComponent(cursor)}` : ''}`
  const res = await fetch(url)
  if (!res.ok) return null
  return res.json() as Promise<{ posts: Post[]; nextCursor: string | null }>
}

export async function createFeedPost(payload: { content: string; visibility: 'public' | 'connections' }) {
  const res = await fetch('/api/feed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  return { ok: res.ok }
}

export async function reactToFeedPost(postId: string, reaction: PostReactionType) {
  const res = await fetch(`/api/feed/${postId}/react`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ reaction }),
  })
  return { ok: res.ok }
}

export async function fetchFeedComments(postId: string) {
  const res = await fetch(`/api/feed/${postId}/comments`)
  if (!res.ok) return null
  return res.json() as Promise<{ comments: Comment[] }>
}

export async function createFeedComment(postId: string, content: string) {
  const res = await fetch(`/api/feed/${postId}/comments`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ content }),
  })
  if (!res.ok) return null
  return res.json() as Promise<{ comment: Comment }>
}