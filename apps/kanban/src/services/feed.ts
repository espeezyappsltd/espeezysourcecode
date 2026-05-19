import { Post, Comment, PostReactionType } from '@/types/feed'

export type FeedPostPayload = {
  content: string
  visibility: 'public' | 'connections'
  post_type?: 'general' | 'milestone' | 'project' | 'campus'
  media_urls?: string[]
  group_id?: string | null
}

async function parseJson(res: Response) {
  return (await res.json().catch(() => ({}))) as Record<string, unknown>
}

export async function fetchFeedPosts(cursor?: string, filter: 'public' | 'connections' | 'mine' = 'public') {
  const params = new URLSearchParams({ filter })
  if (cursor) params.set('cursor', cursor)
  const res = await fetch(`/api/feed?${params}`, { credentials: 'include' })
  const data = (await parseJson(res)) as {
    posts?: Post[]
    nextCursor?: string | null
    error?: string
    warning?: string
  }
  if (!res.ok) return null
  return { posts: data.posts ?? [], nextCursor: data.nextCursor ?? null, warning: data.warning }
}

export async function fetchMyFeedPosts(cursor?: string) {
  return fetchFeedPosts(cursor, 'mine')
}

export async function fetchFeedPost(postId: string) {
  const res = await fetch(`/api/feed/${postId}`, { credentials: 'include' })
  const data = (await parseJson(res)) as { post?: Post; error?: string }
  if (!res.ok) return { ok: false as const, error: (data.error as string) ?? 'Post not found' }
  return { ok: true as const, post: data.post as Post }
}

export async function createFeedPost(payload: FeedPostPayload) {
  const res = await fetch('/api/feed', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  const data = (await parseJson(res)) as { error?: string; post?: Post }
  return { ok: res.ok, error: data.error as string | undefined, post: data.post }
}

export async function updateFeedPost(postId: string, payload: Partial<FeedPostPayload>) {
  const res = await fetch(`/api/feed/${postId}`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload),
  })
  const data = (await parseJson(res)) as { error?: string; post?: Post }
  return { ok: res.ok, error: data.error as string | undefined, post: data.post }
}

export async function deleteFeedPost(postId: string) {
  const res = await fetch(`/api/feed/${postId}`, {
    method: 'DELETE',
    credentials: 'include',
  })
  const data = (await parseJson(res)) as { error?: string }
  return { ok: res.ok, error: data.error as string | undefined }
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