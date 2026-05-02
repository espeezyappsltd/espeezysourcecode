'use client'

import { useState, useEffect, useRef, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Heart, Flame, HandMetal, Lightbulb, PartyPopper, ThumbsUp,
  MessageCircle, Send, Image as ImageIcon, X, ChevronDown, Loader2,
  Globe, Users, Lock, MoreHorizontal, Trash2, Pencil
} from 'lucide-react'
import { db } from '@/lib/firebase'
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  limit 
} from 'firebase/firestore'
import { useProfile } from '../../context/ProfileContext'

type Reaction = 'like' | 'love' | 'fire' | 'clap' | 'insightful' | 'celebrate'

const REACTION_META: Record<Reaction, { emoji: string; label: string; Icon: typeof Heart }> = {
  like:        { emoji: '👍', label: 'Like',       Icon: ThumbsUp },
  love:        { emoji: '❤️', label: 'Love',       Icon: Heart },
  fire:        { emoji: '🔥', label: 'Fire',       Icon: Flame },
  clap:        { emoji: '👏', label: 'Clap',       Icon: HandMetal },
  insightful:  { emoji: '💡', label: 'Insightful', Icon: Lightbulb },
  celebrate:   { emoji: '🎉', label: 'Celebrate',  Icon: PartyPopper },
}

interface PostAuthor {
  id: string
  full_name: string
  username?: string
  avatar_url?: string
  role?: string
}

interface Post {
  id: string
  content: string
  media_urls: string[]
  post_type: string
  visibility: string
  created_at: string
  edited_at?: string
  author: PostAuthor
  reactions: { reaction: Reaction; user_id: string }[]
  comments: { count: number }[]
}

interface Comment {
  id: string
  content: string
  created_at: string
  parent_id?: string
  author: PostAuthor
}

export default function FeedPage() {
  const { profile } = useProfile()
  const router = useRouter()
  const [posts, setPosts] = useState<Post[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [cursor, setCursor] = useState<string | null>(null)
  const [hasMore, setHasMore] = useState(true)
  const [composerText, setComposerText] = useState('')
  const [composerVisibility, setComposerVisibility] = useState<'public' | 'connections'>('public')
  const [posting, setPosting] = useState(false)
  const [expandedComments, setExpandedComments] = useState<Record<string, Comment[]>>({})
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({})
  const [commentText, setCommentText] = useState<Record<string, string>>({})
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({})
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null)
  const observerRef = useRef<IntersectionObserver | null>(null)
  const sentinelRef = useRef<HTMLDivElement>(null)

  const loadPosts = useCallback(async (cur?: string) => {
    if (cur) setLoadingMore(true); else setLoading(true)
    try {
      const url = `/api/feed?filter=public${cur ? `&cursor=${encodeURIComponent(cur)}` : ''}`
      const res = await fetch(url)
      if (!res.ok) return
      const { posts: newPosts, nextCursor } = await res.json()
      setPosts(prev => cur ? [...prev, ...newPosts] : newPosts)
      setCursor(nextCursor)
      setHasMore(!!nextCursor)
    } finally {
      setLoading(false)
      setLoadingMore(false)
    }
  }, [])

  // eslint-disable-next-line react-hooks/set-state-in-effect
  useEffect(() => { loadPosts() }, [loadPosts])

  // Infinite scroll sentinel
  useEffect(() => {
    observerRef.current = new IntersectionObserver(entries => {
      if (entries[0].isIntersecting && hasMore && !loadingMore) {
        if (cursor) loadPosts(cursor)
      }
    }, { threshold: 0.1 })
    if (sentinelRef.current) observerRef.current.observe(sentinelRef.current)
    return () => observerRef.current?.disconnect()
  }, [cursor, hasMore, loadingMore, loadPosts])

  // Realtime subscription
  useEffect(() => {
    const q = query(
      collection(db, 'posts'),
      where('visibility', '==', 'public'),
      orderBy('created_at', 'desc'),
      limit(1)
    )
    const unsubscribe = onSnapshot(q, (snapshot) => {
      snapshot.docChanges().forEach((change) => {
        if (change.type === 'added') {
          const data = change.doc.data()
          if (data.author_id !== profile?.id) {
            loadPosts()
          }
        }
      })
    })
    return () => unsubscribe()
  }, [profile?.id, loadPosts])

  async function submitPost() {
    if (!composerText.trim() || posting) return
    setPosting(true)
    try {
      const res = await fetch('/api/feed', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: composerText.trim(), visibility: composerVisibility }),
      })
      if (res.ok) {
        setComposerText('')
        loadPosts()
      }
    } finally {
      setPosting(false)
    }
  }

  async function toggleReaction(postId: string, reaction: Reaction) {
    setShowReactionPicker(null)
    const res = await fetch(`/api/feed/${postId}/react`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ reaction }),
    })
    if (res.ok) {
      // Optimistic update
      setPosts(prev => prev.map(p => {
        if (p.id !== postId) return p
        const existingIdx = p.reactions.findIndex(r => r.user_id === profile?.id)
        let reactions = [...p.reactions]
        if (existingIdx >= 0) {
          if (reactions[existingIdx].reaction === reaction) {
            reactions = reactions.filter((_, i) => i !== existingIdx)
          } else {
            reactions[existingIdx] = { ...reactions[existingIdx], reaction }
          }
        } else {
          reactions.push({ reaction, user_id: profile?.id ?? '' })
        }
        return { ...p, reactions }
      }))
    }
  }

  async function loadComments(postId: string) {
    if (expandedComments[postId]) {
      setExpandedComments(prev => { const n = { ...prev }; delete n[postId]; return n })
      return
    }
    setLoadingComments(prev => ({ ...prev, [postId]: true }))
    try {
      const res = await fetch(`/api/feed/${postId}/comments`)
      if (res.ok) {
        const { comments } = await res.json()
        setExpandedComments(prev => ({ ...prev, [postId]: comments }))
      }
    } finally {
      setLoadingComments(prev => ({ ...prev, [postId]: false }))
    }
  }

  async function submitComment(postId: string) {
    const text = commentText[postId]?.trim()
    if (!text || submittingComment[postId]) return
    setSubmittingComment(prev => ({ ...prev, [postId]: true }))
    try {
      const res = await fetch(`/api/feed/${postId}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: text }),
      })
      if (res.ok) {
        const { comment } = await res.json()
        setExpandedComments(prev => ({ ...prev, [postId]: [...(prev[postId] ?? []), comment] }))
        setCommentText(prev => ({ ...prev, [postId]: '' }))
        setPosts(prev => prev.map(p => p.id === postId
          ? { ...p, comments: [{ count: (p.comments?.[0]?.count ?? 0) + 1 }] }
          : p
        ))
      }
    } finally {
      setSubmittingComment(prev => ({ ...prev, [postId]: false }))
    }
  }

  function timeAgo(date: string) {
    // eslint-disable-next-line react-hooks/purity
    const secs = Math.floor((Date.now() - new Date(date).getTime()) / 1000)
    if (secs < 60) return 'just now'
    if (secs < 3600) return `${Math.floor(secs / 60)}m ago`
    if (secs < 86400) return `${Math.floor(secs / 3600)}h ago`
    return `${Math.floor(secs / 86400)}d ago`
  }

  function groupReactions(reactions: Post['reactions']) {
    const counts: Record<Reaction, number> = {} as Record<Reaction, number>
    for (const r of reactions) counts[r.reaction] = (counts[r.reaction] ?? 0) + 1
    return Object.entries(counts).sort((a, b) => b[1] - a[1]) as [Reaction, number][]
  }

  const userReaction = (reactions: Post['reactions']) =>
    reactions.find(r => r.user_id === profile?.id)?.reaction

  return (
    <div style={{ maxWidth: '680px', margin: '0 auto', padding: '1.5rem 1rem' }}>

      {/* Composer */}
      <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem' }}>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
          <Avatar profile={profile as unknown as PostAuthor} size={38} />
          <div style={{ flex: 1 }}>
            <textarea
              value={composerText}
              onChange={e => setComposerText(e.target.value)}
              placeholder="What's on your mind?"
              rows={composerText.length > 80 ? 4 : 2}
              onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submitPost() }}
              style={{
                width: '100%', background: 'transparent', border: 'none', outline: 'none',
                color: '#F3F4F6', fontSize: '0.95rem', lineHeight: 1.6, resize: 'none',
                fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.75rem', flexWrap: 'wrap', gap: '0.5rem' }}>
              <div style={{ display: 'flex', gap: '0.5rem' }}>
                <VisibilityToggle value={composerVisibility} onChange={setComposerVisibility} />
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.72rem', color: composerText.length > 1900 ? '#EF4444' : 'rgba(255,255,255,0.2)' }}>
                  {composerText.length}/2000
                </span>
                <button
                  onClick={submitPost}
                  disabled={!composerText.trim() || posting}
                  style={{
                    padding: '0.45rem 1.1rem', background: '#10B981', border: 'none', borderRadius: '8px',
                    color: '#000', fontWeight: 800, fontSize: '0.8rem', cursor: (!composerText.trim() || posting) ? 'not-allowed' : 'pointer',
                    opacity: (!composerText.trim() || posting) ? 0.5 : 1, display: 'flex', alignItems: 'center', gap: '0.35rem',
                  }}
                >
                  {posting ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
                  Post
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Feed */}
      {loading && (
        <div style={{ textAlign: 'center', padding: '3rem', color: 'rgba(255,255,255,0.3)' }}>
          <Loader2 size={24} style={{ animation: 'spin 1s linear infinite', display: 'inline-block' }} />
        </div>
      )}

      {!loading && posts.length === 0 && (
        <div style={{ textAlign: 'center', padding: '4rem 2rem', color: 'rgba(255,255,255,0.3)' }}>
          <Globe size={40} style={{ marginBottom: '1rem', opacity: 0.3 }} />
          <p style={{ fontWeight: 600 }}>No posts yet. Be the first!</p>
        </div>
      )}

      {posts.map(post => (
        <PostCard
          key={post.id}
          post={post}
          currentUserId={profile?.id ?? ''}
          onReaction={toggleReaction}
          userReaction={userReaction(post.reactions)}
          reactionCounts={groupReactions(post.reactions)}
          totalReactions={post.reactions.length}
          commentCount={post.comments?.[0]?.count ?? 0}
          comments={expandedComments[post.id]}
          loadingComments={loadingComments[post.id]}
          onToggleComments={() => loadComments(post.id)}
          commentText={commentText[post.id] ?? ''}
          onCommentTextChange={t => setCommentText(prev => ({ ...prev, [post.id]: t }))}
          onSubmitComment={() => submitComment(post.id)}
          submittingComment={submittingComment[post.id]}
          showReactionPicker={showReactionPicker === post.id}
          onToggleReactionPicker={() => setShowReactionPicker(p => p === post.id ? null : post.id)}
          timeAgo={timeAgo(post.created_at)}
        />
      ))}

      {/* Infinite scroll sentinel */}
      <div ref={sentinelRef} style={{ height: '40px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {loadingMore && <Loader2 size={18} style={{ animation: 'spin 1s linear infinite', color: 'rgba(255,255,255,0.3)' }} />}
        {!hasMore && posts.length > 0 && <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.2)' }}>You&apos;ve seen it all</span>}
      </div>
    </div>
  )
}

// ─── PostCard ────────────────────────────────────────────────────────────────
function PostCard({
  post, currentUserId, onReaction, userReaction, reactionCounts, totalReactions,
  commentCount, comments, loadingComments, onToggleComments,
  commentText, onCommentTextChange, onSubmitComment, submittingComment,
  showReactionPicker, onToggleReactionPicker, timeAgo
}: {
  post: Post; currentUserId: string
  onReaction: (id: string, r: Reaction) => void
  userReaction?: Reaction; reactionCounts: [Reaction, number][]
  totalReactions: number; commentCount: number
  comments?: Comment[]; loadingComments?: boolean
  onToggleComments: () => void; commentText: string
  onCommentTextChange: (t: string) => void
  onSubmitComment: () => void; submittingComment?: boolean
  showReactionPicker: boolean; onToggleReactionPicker: () => void
  timeAgo: string
}) {
  const isOwn = post.author.id === currentUserId

  return (
    <div style={{
      background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px',
      marginBottom: '1rem', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.25rem 0.75rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        <Avatar profile={post.author} size={40} />
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#F3F4F6' }}>{post.author.full_name}</span>
            {post.author.role === 'admin' && (
              <span style={{ background: '#10B98130', color: '#10B981', fontSize: '0.6rem', fontWeight: 900, padding: '1px 6px', borderRadius: '4px', letterSpacing: '0.08em' }}>ADMIN</span>
            )}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', marginTop: '2px' }}>
            <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>{timeAgo}</span>
            {post.visibility === 'public' ? <Globe size={11} color="rgba(255,255,255,0.2)" /> : <Users size={11} color="rgba(255,255,255,0.2)" />}
            {post.post_type !== 'general' && (
              <span style={{ fontSize: '0.65rem', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: '#10B981', opacity: 0.7 }}>
                {post.post_type}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Content */}
      <div style={{ padding: '0 1.25rem 1rem' }}>
        <p style={{ margin: 0, lineHeight: 1.65, color: '#E5E7EB', fontSize: '0.93rem', whiteSpace: 'pre-wrap' }}>{post.content}</p>
      </div>

      {/* Media */}
      {post.media_urls?.length > 0 && (
        <div style={{ display: 'grid', gridTemplateColumns: post.media_urls.length > 1 ? '1fr 1fr' : '1fr', gap: '2px' }}>
          {post.media_urls.slice(0, 4).map((url, i) => (
            <div key={i} style={{ position: 'relative', paddingTop: '56.25%', overflow: 'hidden', background: '#000' }}>
              <img src={url} alt="" style={{ position: 'absolute', top: 0, left: 0, width: '100%', height: '100%', objectFit: 'cover' }} />
            </div>
          ))}
        </div>
      )}

      {/* Reaction counts row */}
      {totalReactions > 0 && (
        <div style={{ padding: '0.5rem 1.25rem 0', display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
          <div style={{ display: 'flex', gap: '2px' }}>
            {reactionCounts.slice(0, 3).map(([r]) => (
              <span key={r} style={{ fontSize: '0.8rem' }}>{REACTION_META[r].emoji}</span>
            ))}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }}>{totalReactions.toLocaleString()}</span>
        </div>
      )}

      {/* Action bar */}
      <div style={{ padding: '0.5rem 0.75rem', borderTop: '1px solid rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', gap: '0.25rem', position: 'relative' }}>
        {/* Reaction button + picker */}
        <div style={{ position: 'relative' }}>
          <ActionButton
            onClick={onToggleReactionPicker}
            active={!!userReaction}
            label={userReaction ? `${REACTION_META[userReaction].emoji} ${REACTION_META[userReaction].label}` : '👍 React'}
          />
          {showReactionPicker && (
            <div style={{
              position: 'absolute', bottom: '110%', left: 0,
              background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)',
              borderRadius: '12px', padding: '0.5rem', display: 'flex', gap: '0.25rem',
              zIndex: 100, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
            }}>
              {(Object.entries(REACTION_META) as [Reaction, typeof REACTION_META[Reaction]][]).map(([key, meta]) => (
                <button
                  key={key}
                  onClick={() => onReaction(post.id, key)}
                  title={meta.label}
                  style={{
                    background: userReaction === key ? 'rgba(16,185,129,0.2)' : 'transparent',
                    border: 'none', cursor: 'pointer', fontSize: '1.3rem', padding: '0.3rem',
                    borderRadius: '8px', transition: 'transform 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.35)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  {meta.emoji}
                </button>
              ))}
            </div>
          )}
        </div>

        <ActionButton
          onClick={onToggleComments}
          label={`💬 ${commentCount > 0 ? commentCount : ''} Comment${commentCount !== 1 ? 's' : ''}`}
        />
      </div>

      {/* Comments section */}
      {(comments || loadingComments) && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '1rem 1.25rem' }}>
          {loadingComments && <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>Loading…</div>}
          {comments?.map(c => (
            <div key={c.id} style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <Avatar profile={c.author} size={28} />
              <div style={{ flex: 1 }}>
                <div style={{ background: '#0d0d0d', borderRadius: '10px', padding: '0.5rem 0.75rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#E5E7EB' }}>{c.author.full_name}</span>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.83rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{c.content}</p>
                </div>
              </div>
            </div>
          ))}
          {/* Comment input */}
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginTop: '0.5rem' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#0d0d0d', borderRadius: '20px', padding: '0.4rem 0.75rem', gap: '0.5rem' }}>
              <input
                value={commentText}
                onChange={e => onCommentTextChange(e.target.value)}
                onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); onSubmitComment() }}}
                placeholder="Write a comment…"
                maxLength={500}
                style={{ flex: 1, background: 'transparent', border: 'none', outline: 'none', color: '#E5E7EB', fontSize: '0.83rem', fontFamily: 'inherit' }}
              />
              <button
                onClick={onSubmitComment}
                disabled={!commentText.trim() || submittingComment}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: commentText.trim() ? '#10B981' : 'rgba(255,255,255,0.2)', padding: 0 }}
              >
                {submittingComment ? <Loader2 size={14} /> : <Send size={14} />}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

function Avatar({ profile, size = 36 }: { profile?: PostAuthor | null; size?: number }) {
  return (
    <div style={{ width: size, height: size, borderRadius: '50%', overflow: 'hidden', background: '#222', flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: size * 0.4 }}>
      {profile?.avatar_url ? (
        <img src={profile.avatar_url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
      ) : (
        <span style={{ color: '#10B981', fontWeight: 800 }}>{profile?.full_name?.[0]?.toUpperCase() ?? '?'}</span>
      )}
    </div>
  )
}

function ActionButton({ onClick, label, active }: { onClick: () => void; label: string; active?: boolean }) {
  return (
    <button onClick={onClick} style={{
      background: 'none', border: 'none', cursor: 'pointer', padding: '0.4rem 0.75rem',
      borderRadius: '8px', color: active ? '#10B981' : 'rgba(255,255,255,0.5)',
      fontWeight: 700, fontSize: '0.78rem', transition: 'background 0.15s',
    }}
    onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.05)')}
    onMouseLeave={e => (e.currentTarget.style.background = 'transparent')}
    >
      {label}
    </button>
  )
}

function VisibilityToggle({ value, onChange }: { value: 'public' | 'connections'; onChange: (v: 'public' | 'connections') => void }) {
  return (
    <button
      onClick={() => onChange(value === 'public' ? 'connections' : 'public')}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.3rem 0.6rem',
        color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
      }}
    >
      {value === 'public' ? <Globe size={11} /> : <Users size={11} />}
      {value === 'public' ? 'Public' : 'Connections'}
    </button>
  )
}
