'use client'

import { useState, useEffect, useRef, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import Image from 'next/image'
import {
  Heart, Flame, HandMetal, Lightbulb, PartyPopper, ThumbsUp,
  MessageCircle, Send, Image as ImageIcon, X, ChevronDown, Loader2,
  Globe, Users, Lock, MoreHorizontal, Trash2, Pencil, Sparkles
} from 'lucide-react'
import { createClient as createBrowserSupabaseClient } from '@/lib/supabase/client'
import { useProfile } from '../../context/ProfileContext'
import type { Profile } from '@/types/database'
import {
  fetchFeedPosts,
  createFeedPost,
  reactToFeedPost,
  fetchFeedComments,
  createFeedComment,
} from '@/services/feed'
import RemoteAvatar from '@/components/common/RemoteAvatar'

type Reaction = 'like' | 'love' | 'fire' | 'clap' | 'insightful' | 'celebrate'

const REACTION_META: Record<Reaction, { emoji: string; label: string; Icon: typeof Heart }> = {
  like:        { emoji: '??', label: 'Like',       Icon: ThumbsUp },
  love:        { emoji: '??', label: 'Love',       Icon: Heart },
  fire:        { emoji: '??', label: 'Fire',       Icon: Flame },
  clap:        { emoji: '??', label: 'Clap',       Icon: HandMetal },
  insightful:  { emoji: '??', label: 'Insightful', Icon: Lightbulb },
  celebrate:   { emoji: '??', label: 'Celebrate',  Icon: PartyPopper },
}

interface Post {
  id: string
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
interface PostAuthor { id: string; full_name?: string | null; avatar_url?: string | null; username?: string | null; }

interface Comment {
  id: string
  content: string
  created_at: string
  parent_id?: string
  author: Partial<Profile> | null
}

export default function FeedPage() {
  const { profile } = useProfile();
  const router = useRouter();

  // Composer state
  const [composerText, setComposerText] = useState<string>('');
  const [composerVisibility, setComposerVisibility] = useState<'public' | 'private'>('public');
  const [posting, setPosting] = useState<boolean>(false);

  // Feed state
  const [posts, setPosts] = useState<Post[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [loadingMore, setLoadingMore] = useState<boolean>(false);
  const [hasMore, setHasMore] = useState<boolean>(true);

  // Comments state
  const [expandedComments, setExpandedComments] = useState<Record<string, Comment[]>>({});
  const [loadingComments, setLoadingComments] = useState<Record<string, boolean>>({});
  const [commentText, setCommentText] = useState<Record<string, string>>({});
  const [submittingComment, setSubmittingComment] = useState<Record<string, boolean>>({});

  // Reaction picker state
  const [showReactionPicker, setShowReactionPicker] = useState<string | null>(null);

  // Infinite scroll sentinel
  const sentinelRef = useRef<HTMLDivElement>(null);

  // Handler: submit post
  const submitPost = useCallback(() => {
    if (!composerText.trim() || posting) return;
    setPosting(true);
    // TODO: Implement post creation logic
    setTimeout(() => {
      setPosting(false);
      setComposerText('');
    }, 1000);
  }, [composerText, posting]);

  // Handler: toggle reaction
  const toggleReaction = useCallback((postId: string, reaction: Reaction) => {
    // TODO: Implement reaction logic
  }, []);

  // Handler: user reaction
  const userReaction = useCallback((reactions: { reaction: Reaction; user_id: string }[]): Reaction | undefined => {
    // TODO: Implement user reaction lookup
    return undefined;
  }, []);

  // Handler: group reactions
  const groupReactions = useCallback((reactions: { reaction: Reaction; user_id: string }[]): [Reaction, number][] => {
    // TODO: Implement grouping logic
    return [];
  }, []);

  // Handler: load comments
  const loadComments = useCallback((postId: string) => {
    // TODO: Implement comment loading
  }, []);

  // Handler: submit comment
  const submitComment = useCallback((postId: string) => {
    // TODO: Implement comment submission
  }, []);

  // Handler: time ago
  const timeAgo = useCallback((date: string) => {
    // TODO: Implement time ago formatting
    return '';
  }, []);

  // Handler: VisibilityToggle stub
  const VisibilityToggle = ({ value, onChange }: { value: 'public' | 'private'; onChange: (v: 'public' | 'private') => void }) => (
    <button type="button" onClick={() => onChange(value === 'public' ? 'private' : 'public')} style={{ padding: '0.3rem 0.8rem', borderRadius: '8px', border: '1px solid var(--border)', background: 'var(--bg-sub)', color: 'var(--text-main)', fontWeight: 700, fontSize: '0.8rem' }}>
      {value === 'public' ? '🌍 Public' : '🔒 Private'}
    </button>
  );

  // Handler: Avatar stub
  const Avatar = ({ profile, size }: { profile: PostAuthor | null | undefined; size: number }) => (
    <div style={{ width: size, height: size, borderRadius: '50%', background: '#222', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
      {profile?.avatar_url ? (
        <Image src={profile.avatar_url} alt={profile.full_name || 'User'} width={size} height={size} />
      ) : (
        <span style={{ fontSize: size * 0.5, color: '#888' }}>{profile?.full_name?.[0] || '?'}</span>
      )}
    </div>
  );

  // Handler: ActionButton stub
  const ActionButton = ({ onClick, active, label, ariaLabel, ariaExpanded }: { onClick: () => void; active?: boolean; label: string; ariaLabel?: string; ariaExpanded?: boolean }) => (
    <button onClick={onClick} aria-label={ariaLabel} aria-expanded={ariaExpanded} style={{ background: active ? '#10B981' : 'rgba(255,255,255,0.04)', color: active ? '#000' : '#fff', border: 'none', borderRadius: '8px', padding: '0.4rem 1rem', fontWeight: 800, fontSize: '0.85rem', cursor: 'pointer', marginRight: '0.5rem' }}>{label}</button>
  );

  return (
  
    <div style={{ maxWidth: '640px', margin: '0 auto', padding: '1.5rem 1rem' }}>
      
      {/* IG-like Public Header */}
      <div style={{ textAlign: 'center', marginBottom: '2.5rem', marginTop: '1rem' }}>
        <h1 style={{ fontSize: '2.2rem', fontWeight: 950, letterSpacing: '-0.05em', marginBottom: '0.5rem', background: 'linear-gradient(to right, #10B981, #3B82F6)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
          Academic Journeys
        </h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.95rem', fontWeight: 600, maxWidth: '400px', margin: '0 auto' }}>
          Real-time signals from students building the future. Share your milestones.
        </p>
      </div>

      {!profile && (
        <div style={{ 
          background: 'rgba(16, 185, 129, 0.05)', 
          border: '1px solid rgba(16, 185, 129, 0.15)', 
          borderRadius: '20px', 
          padding: '2rem', 
          textAlign: 'center', 
          marginBottom: '2rem',
          backdropFilter: 'blur(10px)'
        }}>
          <Sparkles size={32} color="#10B981" style={{ marginBottom: '1rem' }} />
          <h2 style={{ fontSize: '1.1rem', fontWeight: 800, marginBottom: '0.5rem', color: '#F3F4F6' }}>Join the Journey</h2>
          <p style={{ fontSize: '0.85rem', color: 'rgba(255,255,255,0.4)', marginBottom: '1.5rem' }}>Sign in to share your academic milestones and connect with other builders.</p>
          <button 
            onClick={() => router.push('/login')}
            style={{ 
              padding: '0.75rem 1.75rem', 
              background: '#10B981', 
              border: 'none', 
              borderRadius: '12px', 
              color: '#000', 
              fontWeight: 800, 
              fontSize: '0.9rem',
              cursor: 'pointer',
              boxShadow: '0 4px 15px rgba(16, 185, 129, 0.3)'
            }}
          >
            Get Started
          </button>
        </div>
      )}

      {/* Composer (Only for logged in) */}
      {profile && (
        <div style={{ background: '#111', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '16px', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'flex-start' }}>
            <Avatar profile={profile as unknown as PostAuthor} size={38} />
            <div style={{ flex: 1 }}>
              <label htmlFor="feed-composer" className="sr-only">What's on your mind?</label>
              <textarea
                id="feed-composer"
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
      )}

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

  const isOwn = post.author?.id === currentUserId;

  return (
    <div style={{
      background: '#111', border: '1px solid rgba(255,255,255,0.07)', borderRadius: '16px',
      marginBottom: '1rem', overflow: 'hidden',
    }}>
      {/* Header */}
      <div style={{ padding: '1rem 1.25rem 0.75rem', display: 'flex', alignItems: 'flex-start', gap: '0.75rem' }}>
        {post.author && <Avatar profile={post.author as PostAuthor} size={40} />}
        <div style={{ flex: 1 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
            <span style={{ fontWeight: 800, fontSize: '0.9rem', color: '#F3F4F6' }}>{post.author?.full_name}</span>
            {post.author?.role === 'admin' && (
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
          <div style={{ display: 'flex', gap: '2px' }} aria-hidden="true">
            {reactionCounts.slice(0, 3).map(([r]) => (
              <span key={r} style={{ fontSize: '0.8rem' }}>{REACTION_META[r].emoji}</span>
            ))}
          </div>
          <span style={{ fontSize: '0.72rem', color: 'rgba(255,255,255,0.35)' }} aria-label={`${totalReactions} reactions`}>{totalReactions.toLocaleString()}</span>
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
            ariaLabel="Open reaction picker"
            ariaExpanded={showReactionPicker}
          />
          {showReactionPicker && (
            <div 
              role="group"
              aria-label="Reaction picker"
              style={{
                position: 'absolute', bottom: '110%', left: 0,
                background: '#1a1a1a', border: '1px solid rgba(255,255,255,0.1)',
                borderRadius: '12px', padding: '0.5rem', display: 'flex', gap: '0.25rem',
                zIndex: 100, boxShadow: '0 8px 32px rgba(0,0,0,0.5)',
              }}
            >
              {(Object.entries(REACTION_META) as [Reaction, typeof REACTION_META[Reaction]][]).map(([key, meta]) => (
                <button
                  key={key}
                  onClick={() => onReaction(post.id, key)}
                  title={meta.label}
                  aria-label={meta.label}
                  style={{
                    background: userReaction === key ? 'rgba(16,185,129,0.2)' : 'transparent',
                    border: 'none', cursor: 'pointer', fontSize: '1.3rem', padding: '0.3rem',
                    borderRadius: '8px', transition: 'transform 0.15s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.transform = 'scale(1.35)')}
                  onMouseLeave={e => (e.currentTarget.style.transform = 'scale(1)')}
                >
                  <span aria-hidden="true">{meta.emoji}</span>
                </button>
              ))}
            </div>
          )}
        </div>

        <ActionButton
          onClick={onToggleComments}
          label={`💬 ${commentCount > 0 ? commentCount : ''} Comment${commentCount !== 1 ? 's' : ''}`}
          ariaLabel={`${commentCount} comments. Click to expand.`}
          ariaExpanded={!!comments || loadingComments}
        />
      </div>

      {/* Comments section */}
      {(comments || loadingComments) && (
        <div style={{ borderTop: '1px solid rgba(255,255,255,0.05)', padding: '1rem 1.25rem' }}>
          {loadingComments && <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem' }}>Loading…</div>}
          {comments?.map(c => (
            <div key={c.id} style={{ display: 'flex', gap: '0.6rem', marginBottom: '0.75rem' }}>
              <Avatar profile={c.author as PostAuthor} size={28} />
              <div style={{ flex: 1 }}>
                <div style={{ background: '#0d0d0d', borderRadius: '10px', padding: '0.5rem 0.75rem' }}>
                  <span style={{ fontWeight: 700, fontSize: '0.8rem', color: '#E5E7EB' }}>{c.author?.full_name ?? 'Unknown'}</span>
                  <p style={{ margin: '0.2rem 0 0', fontSize: '0.83rem', color: 'rgba(255,255,255,0.7)', lineHeight: 1.5 }}>{c.content}</p>
                </div>
              </div>
            </div>
          ))}
          {/* Comment input */}
          <div style={{ display: 'flex', gap: '0.6rem', alignItems: 'center', marginTop: '0.5rem' }}>
            <div style={{ flex: 1, display: 'flex', alignItems: 'center', background: '#0d0d0d', borderRadius: '20px', padding: '0.4rem 0.75rem', gap: '0.5rem' }}>
              <label htmlFor={`comment-${post.id}`} className="sr-only">Write a comment</label>
              <input
                id={`comment-${post.id}`}
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
    <RemoteAvatar
      src={profile?.avatar_url}
      alt={`${profile?.full_name ?? 'User'} avatar`}
      size={size}
      fallback={<span style={{ color: '#10B981', fontWeight: 800 }}>{profile?.full_name?.[0]?.toUpperCase() ?? '?'}</span>}
      style={{ background: '#222', flexShrink: 0, fontSize: size * 0.4 }}
    />
  )
}

function ActionButton({ onClick, label, active, ariaLabel, ariaExpanded }: { onClick: () => void; label: string; active?: boolean; ariaLabel?: string; ariaExpanded?: boolean }) {
  return (
    <button 
      onClick={onClick} 
      aria-label={ariaLabel}
      aria-expanded={ariaExpanded}
      style={{
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
      aria-label={`Current visibility: ${value}. Click to toggle.`}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.35rem', background: 'rgba(255,255,255,0.06)',
        border: '1px solid rgba(255,255,255,0.1)', borderRadius: '8px', padding: '0.3rem 0.6rem',
        color: 'rgba(255,255,255,0.5)', fontSize: '0.72rem', fontWeight: 700, cursor: 'pointer',
      }}
    >
      {value === 'public' ? <Globe size={11} aria-hidden="true" /> : <Users size={11} aria-hidden="true" />}
      {value === 'public' ? 'Public' : 'Connections'}
    </button>
  )
}


