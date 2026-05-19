'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import {
  Heart,
  Flame,
  HandMetal,
  Lightbulb,
  PartyPopper,
  ThumbsUp,
  Send,
  Globe,
  Users,
  Loader2,
  Sparkles,
  RefreshCw,
  MoreHorizontal,
  Pencil,
  Trash2,
} from 'lucide-react'
import { useProfile } from '@/context/ProfileContext'
import { useNotifications } from '@/components/NotificationProvider'
import { useTransactionConfirm } from '@/hooks/useTransactionConfirm'
import { feedPostCopy } from '@/lib/platform/transaction-confirm-copy'
import type { Profile } from '@/types/database'
import type { PostReactionType } from '@/types/feed'
import {
  fetchFeedPosts,
  createFeedPost,
  deleteFeedPost,
  updateFeedPost,
  reactToFeedPost,
  fetchFeedComments,
  createFeedComment,
} from '@/services/feed'
import Link from 'next/link'
import RemoteAvatar from '@/components/common/RemoteAvatar'
import { avatarUrlForProfile } from '@/lib/platform/contact-rules'
import { seedDemoContent } from '@/lib/dev/seed-demo'

type Reaction = PostReactionType

const REACTION_META: Record<Reaction, { emoji: string; label: string }> = {
  like: { emoji: '👍', label: 'Like' },
  love: { emoji: '❤️', label: 'Love' },
  fire: { emoji: '🔥', label: 'Fire' },
  clap: { emoji: '👏', label: 'Clap' },
  insightful: { emoji: '💡', label: 'Insightful' },
  celebrate: { emoji: '🎉', label: 'Celebrate' },
}

interface Post {
  id: string
  author_id?: string
  content: string
  media_urls: string[]
  post_type: string
  visibility: string
  created_at: string
  edited_at?: string | null
  author: Partial<Profile> | null
  reactions: { reaction: Reaction; user_id: string }[]
  comments: { count: number }[]
}

interface PostAuthor {
  id: string
  full_name?: string | null
  avatar_url?: string | null
  username?: string | null
  role?: string | null
}

interface Comment {
  id: string
  content: string
  created_at: string
  author: Partial<Profile> | null
}

function timeAgo(date: string): string {
  const diff = Date.now() - new Date(date).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'Just now'
  if (mins < 60) return `${mins}m`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d`
  return new Date(date).toLocaleDateString()
}

export default function FeedPage() {
  const { profile } = useProfile()
  const { addToast } = useNotifications()
  const { confirmTransaction } = useTransactionConfirm()
  const router = useRouter()

  const [composerText, setComposerText] = useState('')
  const [composerVisibility, setComposerVisibility] = useState<'public' | 'connections'>('public')
  const [posting, setPosting] = useState(false)

  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [hasMore, setHasMore] = useState(true)
  const [cursor, setCursor] = useState<string | null>(null)
  const [loadError, setLoadError] = useState<string | null>(null)

  const [expandedComments, setExpandedComments] = useState<Record<string, Comment[]>>({})
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({})
  const [commentText, setCommentText] = useState<Record<string, string>>({})
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({})
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null)
  const [seeding, setSeeding] = useState(false)

  const sentinelRef = useRef<HTMLDivElement>(null)

  const runDemoSeed = async () => {
    setSeeding(true)
    const result = await seedDemoContent()
    setSeeding(false)
    if (result.ok) await loadPosts()
    else setLoadError(result.error ?? 'Seed failed.')
  }

  const loadPosts = useCallback(async (nextCursor?: string | null) => {
    const isMore = Boolean(nextCursor)
    if (isMore) setLoadingMore(true)
    else setLoading(true)

    try {
      const data = await fetchFeedPosts(nextCursor ?? undefined)
      if (!data) {
        setLoadError('Could not load feed.')
        return
      }
      setLoadError(null)
      const incoming = (data.posts ?? []) as Post[]
      setPosts((prev) => (isMore ? [...prev, ...incoming] : incoming))
      setCursor(data.nextCursor ?? null)
      setHasMore(Boolean(data.nextCursor))
      if (data.warning && incoming.length === 0) {
        setLoadError(data.warning)
      }
    } catch {
      setLoadError('Could not load feed.')
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  useEffect(() => {
    void loadPosts()
  }, [loadPosts])

  useEffect(() => {
    const el = sentinelRef.current
    if (!el || !hasMore) return

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loadingMore && cursor) {
          void loadPosts(cursor)
        }
      },
      { rootMargin: '200px' },
    )
    observer.observe(el)
    return () => observer.disconnect()
  }, [cursor, hasMore, loadingMore, loadPosts])

  const submitPost = async () => {
    if (!composerText.trim() || posting || !profile) return
    const ok = await confirmTransaction(feedPostCopy(composerVisibility))
    if (!ok) return

    setPosting(true)
    const result = await createFeedPost({
      content: composerText.trim(),
      visibility: composerVisibility,
    })
    if (result.ok) {
      setComposerText('')
      addToast('Posted', 'Your update is live on the feed.', 'success')
      await loadPosts()
    } else {
      addToast('Could not post', result.error ?? 'Try again in a moment.', 'error')
    }
    setPosting(false)
  }

  const toggleReaction = async (postId: string, reaction: Reaction) => {
    if (!profile?.id) return
    setShowReactionPicker(null)
    await reactToFeedPost(postId, reaction)
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id !== postId) return p
        const existing = p.reactions.find((r) => r.user_id === profile.id)
        let reactions = [...p.reactions]
        if (existing?.reaction === reaction) {
          reactions = reactions.filter((r) => r.user_id !== profile.id)
        } else {
          reactions = reactions.filter((r) => r.user_id !== profile.id)
          reactions.push({ reaction, user_id: profile.id })
        }
        return { ...p, reactions }
      }),
    )
  }

  const getUserReaction = (reactions: { reaction: Reaction; user_id: string }[]) =>
    profile?.id ? reactions.find((r) => r.user_id === profile.id)?.reaction : undefined

  const groupReactions = (reactions: { reaction: Reaction; user_id: string }[]): [Reaction, number][] => {
    const map = new Map<Reaction, number>()
    for (const r of reactions) {
      map.set(r.reaction, (map.get(r.reaction) ?? 0) + 1)
    }
    return [...map.entries()].sort((a, b) => b[1] - a[1])
  }

  const loadComments = async (postId: string) => {
    if (expandedComments[postId]) {
      setExpandedComments((prev) => {
        const next = { ...prev }
        delete next[postId]
        return next
      })
      return
    }
    setLoadingComments((prev) => ({ ...prev, [postId]: true }))
    const data = await fetchFeedComments(postId)
    setExpandedComments((prev) => ({ ...prev, [postId]: data?.comments ?? [] }))
    setLoadingComments((prev) => ({ ...prev, [postId]: false }))
  }

  const [editingPostId, setEditingPostId] = useState<string | null>(null)
  const [editDraft, setEditDraft] = useState('')
  const [savingEdit, setSavingEdit] = useState(false)
  const [deletingPostId, setDeletingPostId] = useState<string | null>(null)
  const [postMenuId, setPostMenuId] = useState<string | null>(null)

  const startInlineEdit = (post: Post) => {
    setPostMenuId(null)
    setEditingPostId(post.id)
    setEditDraft(post.content)
  }

  const cancelInlineEdit = () => {
    setEditingPostId(null)
    setEditDraft('')
  }

  const saveInlineEdit = async (postId: string) => {
    const text = editDraft.trim()
    if (!text || savingEdit) return
    setSavingEdit(true)
    const result = await updateFeedPost(postId, { content: text })
    setSavingEdit(false)
    if (result.ok) {
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId ? { ...p, content: text, edited_at: new Date().toISOString() } : p,
        ),
      )
      cancelInlineEdit()
      addToast('Updated', 'Your post was saved.', 'success')
    } else {
      addToast('Could not save', result.error ?? 'Try again.', 'error')
    }
  }

  const removePost = async (postId: string) => {
    setPostMenuId(null)
    if (!window.confirm('Delete this post?')) return
    setDeletingPostId(postId)
    const result = await deleteFeedPost(postId)
    setDeletingPostId(null)
    if (result.ok) {
      setPosts((prev) => prev.filter((p) => p.id !== postId))
      if (editingPostId === postId) cancelInlineEdit()
      addToast('Deleted', 'Post removed from the feed.', 'success')
    } else {
      addToast('Could not delete', result.error ?? 'Try again.', 'error')
    }
  }

  const submitComment = async (postId: string) => {
    const text = (commentText[postId] ?? '').trim()
    if (!text) return
    setSubmittingComment((prev) => ({ ...prev, [postId]: true }))
    const result = await createFeedComment(postId, text)
    if (result?.comment) {
      setExpandedComments((prev) => ({
        ...prev,
        [postId]: [...(prev[postId] ?? []), result.comment as Comment],
      }))
      setCommentText((prev) => ({ ...prev, [postId]: '' }))
      setPosts((prev) =>
        prev.map((p) =>
          p.id === postId
            ? { ...p, comments: [{ count: (p.comments?.[0]?.count ?? 0) + 1 }] }
            : p,
        ),
      )
    }
    setSubmittingComment((prev) => ({ ...prev, [postId]: false }))
  }

  const storyAuthors = posts
    .map((p) => p.author)
    .filter((a): a is PostAuthor => Boolean(a?.id))
    .filter((a, i, arr) => arr.findIndex((x) => x.id === a.id) === i)
    .slice(0, 8)

  return (
    <div className="feed-shell page-shell page-fade">
      <header className="feed-hero page-header page-header--center">
        <div className="page-header__main">
          <h1 className="page-header__title">Academic Journeys</h1>
          <p className="page-header__desc">Real-time signals from students building the future. Share milestones, wins, and campus life.</p>
        </div>
        {profile && (
          <Link href="/feed/manage" className="feed-manage-link">
            Manage your posts
          </Link>
        )}
      </header>

      {!profile && (
        <div className="feed-empty ui-panel ui-panel--dashed" style={{ marginBottom: '1.5rem' }}>
          <Sparkles size={32} color="var(--brand)" style={{ marginBottom: '0.75rem' }} />
          <h2 style={{ fontWeight: 900, marginBottom: '0.35rem' }}>Join the journey</h2>
          <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Sign in to post and react with your cohort.
          </p>
          <button type="button" className="btn btn-primary" onClick={() => router.push('/login')}>
            Get started
          </button>
        </div>
      )}

      {storyAuthors.length > 0 && (
        <div className="feed-stories" aria-label="Active scholars">
          {storyAuthors.map((author) => (
            <div key={author.id} className="feed-story">
              <div className="feed-story-ring">
                <FeedAvatar profile={author} size={52} />
              </div>
              <span className="feed-story-label">{author.full_name?.split(' ')[0] ?? 'Peer'}</span>
            </div>
          ))}
        </div>
      )}

      {profile && (
        <div className="feed-composer ui-panel">
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <FeedAvatar profile={profile as PostAuthor} size={42} ring />
            <div style={{ flex: 1 }}>
              <label htmlFor="feed-composer" className="sr-only">
                What&apos;s on your mind?
              </label>
              <textarea
                id="feed-composer"
                value={composerText}
                onChange={(e) => setComposerText(e.target.value)}
                placeholder="Share a milestone, project update, or campus tip…"
                rows={composerText.length > 100 ? 4 : 2}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) void submitPost()
                }}
                style={{
                  width: '100%',
                  background: 'transparent',
                  border: 'none',
                  outline: 'none',
                  color: 'var(--text-main)',
                  fontSize: '0.95rem',
                  lineHeight: 1.6,
                  resize: 'none',
                  fontFamily: 'inherit',
                }}
              />
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  marginTop: '0.75rem',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                }}
              >
                <VisibilityToggle value={composerVisibility} onChange={setComposerVisibility} />
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  <span
                    style={{
                      fontSize: '0.72rem',
                      color: composerText.length > 1900 ? '#ef4444' : 'var(--text-sub)',
                    }}
                  >
                    {composerText.length}/2000
                  </span>
                  <button
                    type="button"
                    onClick={() => void submitPost()}
                    disabled={!composerText.trim() || posting}
                    className="btn btn-primary"
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      opacity: !composerText.trim() || posting ? 0.5 : 1,
                    }}
                  >
                    {posting ? <Loader2 size={14} className="feed-spin" /> : <Send size={14} />}
                    Post
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {loadError && (
        <div className="feed-empty ui-panel ui-panel--dashed">
          <p style={{ color: 'var(--text-sub)', marginBottom: '0.75rem' }}>{loadError}</p>
          <button type="button" className="btn btn-secondary" onClick={() => void loadPosts()}>
            <RefreshCw size={14} style={{ marginRight: 6 }} />
            Retry
          </button>
        </div>
      )}

      {loading &&
        posts.length === 0 &&
        [0, 1, 2].map((i) => <div key={i} className="feed-skeleton" />)}

      {!loading && posts.length === 0 && !loadError && (
        <div className="feed-empty ui-panel ui-panel--dashed">
          <Globe size={40} style={{ marginBottom: '0.75rem', opacity: 0.35, color: 'var(--brand)' }} />
          <p style={{ fontWeight: 800, marginBottom: '0.35rem' }}>No journeys yet</p>
          <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem', marginBottom: '1rem' }}>
            Be the first to share a milestone — or load sample journeys to preview the feed.
          </p>
          <button
            type="button"
            className="btn btn-secondary"
            disabled={seeding}
            onClick={() => void runDemoSeed()}
            style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
          >
            {seeding ? <Loader2 size={14} className="feed-spin" /> : <Sparkles size={14} />}
            Load sample journeys
          </button>
        </div>
      )}

      {posts.map((post) => (
        <PostCard
          key={post.id}
          post={post}
          isAuthor={Boolean(profile?.id && (post.author_id === profile.id || post.author?.id === profile.id))}
          isEditing={editingPostId === post.id}
          editDraft={editDraft}
          onEditDraftChange={setEditDraft}
          onStartEdit={() => startInlineEdit(post)}
          onCancelEdit={cancelInlineEdit}
          onSaveEdit={() => void saveInlineEdit(post.id)}
          savingEdit={savingEdit}
          onDelete={() => void removePost(post.id)}
          deleting={deletingPostId === post.id}
          showMenu={postMenuId === post.id}
          onToggleMenu={() => setPostMenuId((id) => (id === post.id ? null : post.id))}
          onReaction={toggleReaction}
          userReaction={getUserReaction(post.reactions)}
          reactionCounts={groupReactions(post.reactions)}
          totalReactions={post.reactions.length}
          commentCount={post.comments?.[0]?.count ?? 0}
          comments={expandedComments[post.id]}
          loadingComments={loadingComments[post.id]}
          onToggleComments={() => void loadComments(post.id)}
          commentText={commentText[post.id] ?? ''}
          onCommentTextChange={(t) => setCommentText((prev) => ({ ...prev, [post.id]: t }))}
          onSubmitComment={() => void submitComment(post.id)}
          submittingComment={submittingComment[post.id]}
          showReactionPicker={showReactionPicker === post.id}
          onToggleReactionPicker={() =>
            setShowReactionPicker((p) => (p === post.id ? null : post.id))
          }
          timeAgo={timeAgo(post.created_at)}
        />
      ))}

      <div ref={sentinelRef} style={{ height: 48, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {loadingMore && <Loader2 size={20} className="feed-spin" style={{ color: 'var(--brand)' }} />}
        {!hasMore && posts.length > 0 && (
          <span style={{ fontSize: '0.75rem', color: 'var(--text-sub)' }}>You&apos;re all caught up</span>
        )}
      </div>
    </div>
  )
}

function FeedAvatar({
  profile,
  size,
  ring,
}: {
  profile?: PostAuthor | null
  size: number
  ring?: boolean
}) {
  const src =
    profile?.id
      ? avatarUrlForProfile({
          id: profile.id,
          full_name: profile.full_name,
          username: profile.username,
          avatar_url: profile.avatar_url,
        })
      : ''

  return (
    <RemoteAvatar
      src={src}
      alt={`${profile?.full_name ?? 'User'} avatar`}
      size={size}
      style={{
        background: 'var(--bg-sub)',
        border: ring ? '2px solid var(--surface)' : undefined,
        flexShrink: 0,
      }}
      fallback={
        <span style={{ color: 'var(--brand)', fontWeight: 900, fontSize: size * 0.38 }}>
          {profile?.full_name?.[0]?.toUpperCase() ?? '?'}
        </span>
      }
    />
  )
}

function PostCard({
  post,
  isAuthor,
  isEditing,
  editDraft,
  onEditDraftChange,
  onStartEdit,
  onCancelEdit,
  onSaveEdit,
  savingEdit,
  onDelete,
  deleting,
  showMenu,
  onToggleMenu,
  onReaction,
  userReaction,
  reactionCounts,
  totalReactions,
  commentCount,
  comments,
  loadingComments,
  onToggleComments,
  commentText,
  onCommentTextChange,
  onSubmitComment,
  submittingComment,
  showReactionPicker,
  onToggleReactionPicker,
  timeAgo: timeLabel,
}: {
  post: Post
  isAuthor: boolean
  isEditing: boolean
  editDraft: string
  onEditDraftChange: (t: string) => void
  onStartEdit: () => void
  onCancelEdit: () => void
  onSaveEdit: () => void
  savingEdit: boolean
  onDelete: () => void
  deleting: boolean
  showMenu: boolean
  onToggleMenu: () => void
  onReaction: (id: string, r: Reaction) => void
  userReaction?: Reaction
  reactionCounts: [Reaction, number][]
  totalReactions: number
  commentCount: number
  comments?: Comment[]
  loadingComments?: boolean
  onToggleComments: () => void
  commentText: string
  onCommentTextChange: (t: string) => void
  onSubmitComment: () => void
  submittingComment?: boolean
  showReactionPicker: boolean
  onToggleReactionPicker: () => void
  timeAgo: string
}) {
  return (
    <article className="feed-card ui-panel ui-panel--flush">
      <div style={{ padding: '1rem 1.15rem 0.65rem', display: 'flex', gap: '0.75rem', position: 'relative' }}>
        <FeedAvatar profile={post.author as PostAuthor} size={44} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 900, fontSize: '0.92rem', color: 'var(--text-main)' }}>
              {post.author?.full_name ?? 'Scholar'}
            </span>
            {post.author?.role === 'admin' && (
              <span
                style={{
                  background: 'rgba(var(--brand-rgb), 0.15)',
                  color: 'var(--brand)',
                  fontSize: '0.6rem',
                  fontWeight: 900,
                  padding: '2px 8px',
                  borderRadius: '6px',
                }}
              >
                ADMIN
              </span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: 2 }}>
            <span style={{ fontSize: '0.72rem', color: 'var(--text-sub)' }}>{timeLabel}</span>
            {post.visibility === 'public' ? (
              <Globe size={11} aria-hidden />
            ) : (
              <Users size={11} aria-hidden />
            )}
            {post.post_type !== 'general' && (
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 800,
                  textTransform: 'uppercase',
                  color: 'var(--brand)',
                }}
              >
                {post.post_type}
              </span>
            )}
            {post.edited_at && (
              <span style={{ fontSize: '0.65rem', color: 'var(--text-sub)' }}> · edited</span>
            )}
          </div>
        </div>
        {isAuthor && !isEditing && (
          <div className="feed-card-menu-wrap">
            <button
              type="button"
              className="feed-card-menu-btn"
              aria-expanded={showMenu}
              aria-label="Post options"
              onClick={onToggleMenu}
            >
              <MoreHorizontal size={18} />
            </button>
            {showMenu && (
              <div className="feed-card-menu" role="menu">
                <button type="button" role="menuitem" onClick={onStartEdit}>
                  <Pencil size={14} /> Edit
                </button>
                <Link href="/feed/manage" role="menuitem" className="feed-card-menu-link" onClick={onToggleMenu}>
                  Manage all posts
                </Link>
                <button
                  type="button"
                  role="menuitem"
                  className="feed-card-menu-danger"
                  disabled={deleting}
                  onClick={onDelete}
                >
                  <Trash2 size={14} /> {deleting ? 'Deleting…' : 'Delete'}
                </button>
              </div>
            )}
          </div>
        )}
      </div>

      <div style={{ padding: '0 1.15rem 1rem' }}>
        {isEditing ? (
          <>
            <textarea
              value={editDraft}
              onChange={(e) => onEditDraftChange(e.target.value)}
              rows={4}
              maxLength={2000}
              className="feed-manage-textarea"
              style={{ width: '100%', marginBottom: '0.5rem' }}
            />
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button type="button" className="btn btn-primary" disabled={!editDraft.trim() || savingEdit} onClick={onSaveEdit}>
                {savingEdit ? <Loader2 size={14} className="feed-spin" /> : 'Save'}
              </button>
              <button type="button" className="btn btn-ghost" onClick={onCancelEdit}>
                Cancel
              </button>
            </div>
          </>
        ) : (
        <p
          style={{
            margin: 0,
            lineHeight: 1.65,
            color: 'var(--text-main)',
            fontSize: '0.93rem',
            whiteSpace: 'pre-wrap',
          }}
        >
          {post.content}
        </p>
        )}
      </div>

      {totalReactions > 0 && (
        <div style={{ padding: '0 0.35rem 0.5rem 1.15rem', display: 'flex', alignItems: 'center', gap: 6 }}>
          {reactionCounts.slice(0, 3).map(([r]) => (
            <span key={r} style={{ fontSize: '0.85rem' }}>
              {REACTION_META[r].emoji}
            </span>
          ))}
          <span style={{ fontSize: '0.72rem', color: 'var(--text-sub)' }}>{totalReactions}</span>
        </div>
      )}

      <div
        style={{
          padding: '0.35rem 0.75rem 0.65rem',
          borderTop: '1px solid var(--border)',
          display: 'flex',
          gap: '0.25rem',
          position: 'relative',
        }}
      >
        <div style={{ position: 'relative' }}>
          <ActionButton
            onClick={onToggleReactionPicker}
            active={!!userReaction}
            label={userReaction ? `${REACTION_META[userReaction].emoji} ${REACTION_META[userReaction].label}` : 'React'}
          />
          {showReactionPicker && (
            <div
              role="group"
              aria-label="Reactions"
              style={{
                position: 'absolute',
                bottom: '110%',
                left: 0,
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: 12,
                padding: '0.4rem',
                display: 'flex',
                gap: 4,
                zIndex: 50,
                boxShadow: 'var(--shadow-lg)',
              }}
            >
              {(Object.keys(REACTION_META) as Reaction[]).map((key) => (
                <button
                  key={key}
                  type="button"
                  title={REACTION_META[key].label}
                  onClick={() => onReaction(post.id, key)}
                  style={{
                    background: userReaction === key ? 'rgba(var(--brand-rgb), 0.15)' : 'transparent',
                    border: 'none',
                    cursor: 'pointer',
                    fontSize: '1.25rem',
                    padding: '0.25rem',
                    borderRadius: 8,
                  }}
                >
                  {REACTION_META[key].emoji}
                </button>
              ))}
            </div>
          )}
        </div>
        <ActionButton
          onClick={onToggleComments}
          label={`Comment${commentCount > 0 ? ` · ${commentCount}` : ''}`}
        />
      </div>

      {(comments || loadingComments) && (
        <div style={{ borderTop: '1px solid var(--border)', padding: '0.85rem 1.15rem' }}>
          {loadingComments && (
            <p style={{ textAlign: 'center', color: 'var(--text-sub)', fontSize: '0.8rem' }}>Loading…</p>
          )}
          {comments?.map((c) => (
            <div key={c.id} style={{ display: 'flex', gap: '0.55rem', marginBottom: '0.65rem' }}>
              <FeedAvatar profile={c.author as PostAuthor} size={28} />
              <div
                style={{
                  flex: 1,
                  background: 'var(--bg-sub)',
                  borderRadius: 12,
                  padding: '0.45rem 0.7rem',
                }}
              >
                <span style={{ fontWeight: 800, fontSize: '0.78rem' }}>{c.author?.full_name ?? 'Peer'}</span>
                <p style={{ margin: '0.15rem 0 0', fontSize: '0.83rem', color: 'var(--text-sub)' }}>{c.content}</p>
              </div>
            </div>
          ))}
          <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center', marginTop: '0.35rem' }}>
            <input
              value={commentText}
              onChange={(e) => onCommentTextChange(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && !e.shiftKey) {
                  e.preventDefault()
                  onSubmitComment()
                }
              }}
              placeholder="Write a comment…"
              maxLength={500}
              style={{
                flex: 1,
                padding: '0.5rem 0.75rem',
                borderRadius: 20,
                border: '1px solid var(--border)',
                background: 'var(--bg-sub)',
                color: 'var(--text-main)',
                fontSize: '0.83rem',
                outline: 'none',
              }}
            />
            <button
              type="button"
              onClick={onSubmitComment}
              disabled={!commentText.trim() || submittingComment}
              style={{
                background: 'none',
                border: 'none',
                color: commentText.trim() ? 'var(--brand)' : 'var(--text-sub)',
                cursor: 'pointer',
              }}
            >
              {submittingComment ? <Loader2 size={16} className="feed-spin" /> : <Send size={16} />}
            </button>
          </div>
        </div>
      )}
    </article>
  )
}

function ActionButton({
  onClick,
  label,
  active,
}: {
  onClick: () => void
  label: string
  active?: boolean
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      style={{
        background: 'none',
        border: 'none',
        cursor: 'pointer',
        padding: '0.4rem 0.65rem',
        borderRadius: 8,
        color: active ? 'var(--brand)' : 'var(--text-sub)',
        fontWeight: 800,
        fontSize: '0.78rem',
      }}
    >
      {label}
    </button>
  )
}

function VisibilityToggle({
  value,
  onChange,
}: {
  value: 'public' | 'connections'
  onChange: (v: 'public' | 'connections') => void
}) {
  return (
    <button
      type="button"
      onClick={() => onChange(value === 'public' ? 'connections' : 'public')}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.35rem',
        background: 'var(--bg-sub)',
        border: '1px solid var(--border)',
        borderRadius: 8,
        padding: '0.35rem 0.65rem',
        color: 'var(--text-sub)',
        fontSize: '0.72rem',
        fontWeight: 800,
        cursor: 'pointer',
      }}
    >
      {value === 'public' ? <Globe size={12} /> : <Users size={12} />}
      {value === 'public' ? 'Public' : 'Connections'}
    </button>
  )
}
