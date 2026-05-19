'use client'

import { useCallback, useEffect, useState } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { ArrowLeft, Globe, Loader2, Pencil, Plus, Trash2, Users, X } from 'lucide-react'
import { useProfile } from '@/context/ProfileContext'
import { useNotifications } from '@/components/NotificationProvider'
import { useTransactionConfirm } from '@/hooks/useTransactionConfirm'
import { feedPostCopy } from '@/lib/platform/transaction-confirm-copy'
import type { Post } from '@/types/feed'
import {
  createFeedPost,
  deleteFeedPost,
  fetchMyFeedPosts,
  updateFeedPost,
} from '@/services/feed'

const POST_TYPES = ['general', 'milestone', 'project', 'campus'] as const

function timeLabel(date: string) {
  return new Date(date).toLocaleString(undefined, {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  })
}

export default function FeedManagePage() {
  const { profile, loading: profileLoading } = useProfile()
  const { addToast } = useNotifications()
  const { confirmTransaction } = useTransactionConfirm()
  const router = useRouter()

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [loadError, setLoadError] = useState<string | null>(null)
  const [cursor, setCursor] = useState<string | null>(null)
  const [loadingMore, setLoadingMore] = useState(false)

  const [showCreate, setShowCreate] = useState(false)
  const [createContent, setCreateContent] = useState('')
  const [createVisibility, setCreateVisibility] = useState<'public' | 'connections'>('public')
  const [createType, setCreateType] = useState<(typeof POST_TYPES)[number]>('general')
  const [creating, setCreating] = useState(false)

  const [editingId, setEditingId] = useState<string | null>(null)
  const [editContent, setEditContent] = useState('')
  const [editVisibility, setEditVisibility] = useState<'public' | 'connections'>('public')
  const [editType, setEditType] = useState<(typeof POST_TYPES)[number]>('general')
  const [saving, setSaving] = useState(false)
  const [deletingId, setDeletingId] = useState<string | null>(null)

  const loadPosts = useCallback(async (nextCursor?: string | null) => {
    const isMore = Boolean(nextCursor)
    if (isMore) setLoadingMore(true)
    else setLoading(true)

    try {
      const data = await fetchMyFeedPosts(nextCursor ?? undefined)
      if (!data) {
        setLoadError('Could not load your posts.')
        return
      }
      setLoadError(null)
      const incoming = data.posts ?? []
      setPosts((prev) => (isMore ? [...prev, ...incoming] : incoming))
      setCursor(data.nextCursor ?? null)
    } catch {
      setLoadError('Could not load your posts.')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    if (profileLoading) return
    if (!profile) {
      setLoading(false)
      return
    }
    void loadPosts()
  }, [profile, profileLoading, loadPosts])

  const startEdit = (post: Post) => {
    setEditingId(post.id)
    setEditContent(post.content)
    setEditVisibility(post.visibility)
    setEditType((POST_TYPES.includes(post.post_type as (typeof POST_TYPES)[number])
      ? post.post_type
      : 'general') as (typeof POST_TYPES)[number])
    setShowCreate(false)
  }

  const cancelEdit = () => {
    setEditingId(null)
    setEditContent('')
  }

  const submitCreate = async () => {
    if (!createContent.trim() || creating) return
    const ok = await confirmTransaction(feedPostCopy(createVisibility))
    if (!ok) return

    setCreating(true)
    const result = await createFeedPost({
      content: createContent.trim(),
      visibility: createVisibility,
      post_type: createType,
    })
    setCreating(false)

    if (result.ok && result.post) {
      setCreateContent('')
      setShowCreate(false)
      addToast('Posted', 'Your post is live.', 'success')
      setPosts((prev) => [{ ...result.post!, reactions: [], comments: [{ count: 0 }] }, ...prev])
    } else {
      addToast('Could not post', String(result.error ?? 'Try again.'), 'error')
    }
  }

  const submitEdit = async (postId: string) => {
    if (!editContent.trim() || saving) return
    setSaving(true)
    const result = await updateFeedPost(postId, {
      content: editContent.trim(),
      visibility: editVisibility,
      post_type: editType,
    })
    setSaving(false)

    if (result.ok && result.post) {
      addToast('Updated', 'Your post was saved.', 'success')
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? {
                ...p,
                ...result.post!,
                reactions: p.reactions,
                comments: p.comments,
                author: p.author,
              }
            : p,
        ),
      )
      cancelEdit()
    } else {
      addToast('Could not save', String(result.error ?? 'Try again.'), 'error')
    }
  }

  const removePost = async (postId: string) => {
    if (!window.confirm('Delete this post? It will be removed from the public feed.')) return
    setDeletingId(postId)
    const result = await deleteFeedPost(postId)
    setDeletingId(null)

    if (result.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== postId))
      if (editingId === postId) cancelEdit()
      addToast('Deleted', 'Post removed from the feed.', 'success')
    } else {
      addToast('Could not delete', String(result.error ?? 'Try again.'), 'error')
    }
  }

  if (profileLoading) {
    return (
      <div className="feed-manage-shell">
        <p className="feed-manage-muted">
          <Loader2 size={18} className="feed-spin" /> Loading…
        </p>
      </div>
    )
  }

  if (!profile) {
    return (
      <div className="feed-manage-shell">
        <header className="feed-manage-header page-header">
          <div className="page-header__main">
            <Link href="/feed" className="feed-manage-back">
              <ArrowLeft size={18} /> Feed
            </Link>
            <h1 className="page-header__title">My public posts</h1>
          </div>
        </header>
        <div className="feed-empty">
          <h2 style={{ fontWeight: 900, marginBottom: '0.5rem' }}>Sign in required</h2>
          <p style={{ color: 'var(--text-sub)', marginBottom: '1rem' }}>
            Sign in to create, edit, and delete your feed posts.
          </p>
          <button type="button" className="btn btn-primary" onClick={() => router.push('/login')}>
            Sign in
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="feed-manage-shell">
      <header className="feed-manage-header page-header">
        <div className="page-header__main">
          <Link href="/feed" className="feed-manage-back">
            <ArrowLeft size={18} /> Feed
          </Link>
          <h1 className="page-header__title">My public posts</h1>
          <p className="page-header__desc">Create, edit, and delete posts that appear on the academic feed.</p>
        </div>
      </header>

      <div className="feed-manage-toolbar">
        <button
          type="button"
          className="btn btn-primary feed-manage-new"
          onClick={() => {
            setShowCreate((v) => !v)
            cancelEdit()
          }}
        >
          {showCreate ? <X size={16} /> : <Plus size={16} />}
          {showCreate ? 'Cancel' : 'New post'}
        </button>
      </div>

      {showCreate && (
        <div className="feed-composer feed-manage-form">
          <label htmlFor="manage-create" className="sr-only">
            New post
          </label>
          <textarea
            id="manage-create"
            value={createContent}
            onChange={(e) => setCreateContent(e.target.value)}
            placeholder="Write your update…"
            rows={4}
            maxLength={2000}
            className="feed-manage-textarea"
          />
          <div className="feed-manage-form-row">
            <select
              value={createType}
              onChange={(e) => setCreateType(e.target.value as (typeof POST_TYPES)[number])}
              className="feed-manage-select"
              aria-label="Post type"
            >
              {POST_TYPES.map((t) => (
                <option key={t} value={t}>
                  {t}
                </option>
              ))}
            </select>
            <VisibilityButton
              value={createVisibility}
              onChange={setCreateVisibility}
            />
            <button
              type="button"
              className="btn btn-primary"
              disabled={!createContent.trim() || creating}
              onClick={() => void submitCreate()}
            >
              {creating ? <Loader2 size={16} className="feed-spin" /> : 'Publish'}
            </button>
          </div>
        </div>
      )}

      {loading && (
        <div>
          <div className="feed-skeleton" />
          <div className="feed-skeleton" />
        </div>
      )}

      {loadError && !loading && (
        <p className="feed-manage-error" role="alert">
          {loadError}
        </p>
      )}

      {!loading && !loadError && posts.length === 0 && (
        <div className="feed-empty">
          <p style={{ color: 'var(--text-sub)', marginBottom: '0.75rem' }}>You have not posted yet.</p>
          <button type="button" className="btn btn-primary" onClick={() => setShowCreate(true)}>
            Create your first post
          </button>
        </div>
      )}

      <ul className="feed-manage-list">
        {posts.map((post) => (
          <li key={post.id} className="feed-manage-item">
            {editingId === post.id ? (
              <div className="feed-manage-form">
                <textarea
                  value={editContent}
                  onChange={(e) => setEditContent(e.target.value)}
                  rows={4}
                  maxLength={2000}
                  className="feed-manage-textarea"
                  aria-label="Edit post"
                />
                <div className="feed-manage-form-row">
                  <select
                    value={editType}
                    onChange={(e) => setEditType(e.target.value as (typeof POST_TYPES)[number])}
                    className="feed-manage-select"
                    aria-label="Post type"
                  >
                    {POST_TYPES.map((t) => (
                      <option key={t} value={t}>
                        {t}
                      </option>
                    ))}
                  </select>
                  <VisibilityButton value={editVisibility} onChange={setEditVisibility} />
                  <button
                    type="button"
                    className="btn btn-primary"
                    disabled={!editContent.trim() || saving}
                    onClick={() => void submitEdit(post.id)}
                  >
                    {saving ? <Loader2 size={16} className="feed-spin" /> : 'Save'}
                  </button>
                  <button type="button" className="btn btn-ghost" onClick={cancelEdit}>
                    Cancel
                  </button>
                </div>
              </div>
            ) : (
              <>
                <div className="feed-manage-item-meta">
                  <span>{timeLabel(post.created_at)}</span>
                  {post.edited_at && <span> · edited</span>}
                  <span className="feed-manage-visibility">
                    {post.visibility === 'public' ? <Globe size={12} /> : <Users size={12} />}
                    {post.visibility}
                  </span>
                  {post.post_type !== 'general' && (
                    <span className="feed-manage-type">{post.post_type}</span>
                  )}
                </div>
                <p className="feed-manage-content">{post.content}</p>
                <div className="feed-manage-actions">
                  <button type="button" className="feed-manage-action" onClick={() => startEdit(post)}>
                    <Pencil size={14} /> Edit
                  </button>
                  <button
                    type="button"
                    className="feed-manage-action feed-manage-action-danger"
                    disabled={deletingId === post.id}
                    onClick={() => void removePost(post.id)}
                  >
                    {deletingId === post.id ? (
                      <Loader2 size={14} className="feed-spin" />
                    ) : (
                      <Trash2 size={14} />
                    )}{' '}
                    Delete
                  </button>
                </div>
              </>
            )}
          </li>
        ))}
      </ul>

      {cursor && !loading && (
        <div className="feed-manage-more">
          <button
            type="button"
            className="btn btn-ghost"
            disabled={loadingMore}
            onClick={() => void loadPosts(cursor)}
          >
            {loadingMore ? <Loader2 size={16} className="feed-spin" /> : 'Load more'}
          </button>
        </div>
      )}
    </div>
  )
}

function VisibilityButton({
  value,
  onChange,
}: {
  value: 'public' | 'connections'
  onChange: (v: 'public' | 'connections') => void
}) {
  return (
    <button
      type="button"
      className="feed-manage-visibility-btn"
      onClick={() => onChange(value === 'public' ? 'connections' : 'public')}
    >
      {value === 'public' ? <Globe size={14} /> : <Users size={14} />}
      {value === 'public' ? 'Public' : 'Connections'}
    </button>
  )
}
