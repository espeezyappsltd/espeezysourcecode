'use client'

import type { RefObject } from 'react'
import Image from 'next/image'
import { MessageSquare, Paperclip, Trash2, Shield, Clock, ShieldCheck, CloudOff } from 'lucide-react'
import { ChatMessage } from '@/types/ui'
import { Profile } from '@/types/auth'
import { formatMessageTime } from './team-chat-utils'

export function MessageList({
  loading,
  messages,
  groupedMessages,
  user,
  isOnline,
  othersTyping,
  onDeleteMessage,
  messagesEndRef,
}: {
  loading: boolean
  messages: ChatMessage[]
  groupedMessages: { date: string; msgs: ChatMessage[] }[]
  user: Profile
  isOnline: boolean
  othersTyping: string[]
  onDeleteMessage: (messageId: string) => void
  messagesEndRef: RefObject<HTMLDivElement | null>
}) {
  return (
    <div className="chat-viewport" style={{
      flex: 1, overflowY: 'auto', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem',
      background: 'var(--bg-sub)',
    }}
    >
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', padding: '0.5rem' }}>
          {[85, 60, 75, 50, 90].map((w, i) => (
            <div key={i} style={{ display: 'flex', justifyContent: i % 2 === 0 ? 'flex-end' : 'flex-start' }}>
              <div style={{ width: `${w}%`, height: '44px', borderRadius: '12px', background: 'var(--border)', animation: 'shimmer 1.5s infinite', backgroundSize: '200% 100%' }} />
            </div>
          ))}
        </div>
      ) : (
        <>
          {messages.length === 0 && (
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '0.75rem', color: 'var(--text-sub)', padding: '2rem' }}>
              <MessageSquare size={36} style={{ opacity: 0.3 }} />
              <p style={{ textAlign: 'center', fontSize: '0.85rem', margin: 0 }}>No messages yet.<br />Be the first to say something!</p>
            </div>
          )}
          {groupedMessages.map((group) => (
            <div key={group.date} style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
              <div style={{ textAlign: 'center', margin: '0.5rem 0' }}>
                <span style={{ padding: '0.3rem 0.8rem', background: 'var(--surface)', color: 'var(--text-sub)', border: '1px solid var(--border)', borderRadius: '12px', fontSize: '0.68rem', fontWeight: 700 }}>{group.date}</span>
              </div>

              {group.msgs.map((m) => {
                const isOwn = m.user_id === user.id
                const canDelete = isOwn || user.role === 'admin'

                return (
                  <div key={m.id} style={{ display: 'flex', justifyContent: isOwn ? 'flex-end' : 'flex-start', marginBottom: '2px' }}>
                    <div
                      className={`msg-bubble ${isOwn ? 'own' : 'other'} ${m.pending ? 'pending' : ''} ${m.is_deleted ? 'deleted' : ''}`}
                      style={{
                        padding: '0.3rem 0.5rem', borderRadius: isOwn ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                        maxWidth: '85%', fontSize: '0.825rem', lineHeight: 1.35,
                        position: 'relative', boxShadow: 'var(--shadow-sm)',
                        background: isOwn ? 'var(--brand)' : 'var(--surface)',
                        color: isOwn ? 'white' : 'var(--text-main)',
                        border: isOwn ? 'none' : '1px solid var(--border)',
                        minWidth: '40px',
                        fontStyle: m.is_deleted ? 'italic' : 'normal',
                        opacity: m.is_deleted ? 0.6 : 1,
                        transition: 'opacity 0.2s',
                      }}
                    >
                      {!isOwn && (
                        <div style={{ fontSize: '0.68rem', fontWeight: 700, color: 'var(--brand)', marginBottom: '3px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span>{m.profiles?.full_name || 'Student'}</span>
                          {m.profiles?.role === 'admin' && <Shield size={10} style={{ marginLeft: '4px', opacity: 0.7 }} />}
                        </div>
                      )}

                      {!m.is_deleted && m.payload?.type === 'image' && (
                        <Image
                          src={m.payload.url}
                          alt={`${m.profiles?.full_name ?? 'Message'} attachment`}
                          width={320}
                          height={180}
                          style={{ width: '100%', borderRadius: '8px', marginBottom: '0.25rem', objectFit: 'cover' }}
                          unoptimized
                        />
                      )}
                      {!m.is_deleted && m.payload?.type === 'file' && (
                        <a href={m.payload.url} target="_blank" className="file-attachment" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(0,0,0,0.08)', padding: '0.4rem 0.6rem', borderRadius: '8px', textDecoration: 'none', color: 'inherit', marginBottom: '0.25rem' }}>
                          <Paperclip size={12} /> <span style={{ fontSize: '0.78rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{m.payload.name}</span>
                        </a>
                      )}

                      <div style={{ wordBreak: 'break-word' }}>
                        {m.is_deleted ? (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8rem' }}><Trash2 size={11} /> Message deleted</div>
                        ) : m.content}
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'flex-end', gap: '5px', marginTop: '3px' }}>
                        <span style={{ fontSize: '0.62rem', opacity: 0.65 }}>
                          {formatMessageTime(m.created_at)}
                        </span>
                        {isOwn && !m.is_deleted && (
                          <span style={{ display: 'inline-flex', opacity: 0.8 }}>
                            {m.pending ? <Clock size={10} /> : (isOnline ? <ShieldCheck size={11} /> : <CloudOff size={11} />)}
                          </span>
                        )}
                        {canDelete && !m.is_deleted && !m.pending && (
                          <button onClick={() => onDeleteMessage(m.id)} style={{ background: 'none', border: 'none', padding: 0, cursor: 'pointer', color: 'inherit', opacity: 0, transition: 'opacity 0.2s' }} className="delete-btn" aria-label="Delete message">
                            <Trash2 size={10} />
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
          {othersTyping.length > 0 && (
            <div style={{ display: 'flex', justifyContent: 'flex-start', margin: '0.25rem 0' }}>
              <div style={{ background: 'var(--surface)', border: '1px solid var(--border)', padding: '0.4rem 0.9rem', borderRadius: '16px', fontSize: '0.8rem', color: 'var(--text-sub)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <div className="typing-dots"><span>•</span><span>•</span><span>•</span></div>
              </div>
            </div>
          )}
        </>
      )}
      <div ref={messagesEndRef} />
    </div>
  )
}
