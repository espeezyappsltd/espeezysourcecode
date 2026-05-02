'use client'

import { useState, useEffect, useRef, useMemo, useCallback } from 'react'
import Image from 'next/image'
import { db, auth, storage } from '@/lib/firebase'
import { 
  collection, 
  query, 
  where, 
  onSnapshot, 
  orderBy, 
  limit, 
  addDoc, 
  updateDoc, 
  doc, 
  getDocs,
  serverTimestamp 
} from 'firebase/firestore'
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage'
import { 
  Send, MessageSquare, X, Paperclip, Clock,
  Trash2, Shield, LayoutGrid,
  ExternalLink, Search, ShieldCheck, CloudOff
} from 'lucide-react'
import { useConnectivity } from '@/context/ConnectivityContext'
import { useRouter } from 'next/navigation'
import { usePresence } from './PresenceProvider'
import { logActivity } from '@/utils/logging'
import { ChatMessage, ChatPayload } from '@/types/ui'
import { Profile } from '@/types/auth'

type TeamChatProps = {
  groupId: string
  user: Profile
}

function formatDateLabel(timestamp: string): string {
  const date = new Date(timestamp).toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  })

  const today = new Date().toLocaleDateString(undefined, {
    weekday: 'long',
    month: 'short',
    day: 'numeric'
  })

  return date === today ? 'Today' : date
}

function formatMessageTime(timestamp: string): string {
  return new Date(timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
}

function ClosedChatButton({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      style={{
        position: 'fixed',
        bottom: 'calc(var(--h-mobile-bottom) + 1.25rem + env(safe-area-inset-bottom))',
        right: '1.25rem',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        background: 'var(--brand)',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        boxShadow: 'var(--shadow-xl)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        transition: 'all 0.3s'
      }}
      className="chat-toggle"
      aria-label="Open team chat"
    >
      <MessageSquare size={24} />
      <div
        style={{
          position: 'absolute',
          top: '2px',
          right: '2px',
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          background: 'var(--success)',
          border: '2px solid white'
        }}
      />
    </button>
  )
}

function TeamChatHeader({
  isSearching,
  chatSearch,
  onSearchChange,
  onCloseSearch,
  othersTyping,
  teamOnlineCount,
  showLobby,
  onToggleLobby,
  onOpenSearch,
  onClose
}: {
  isSearching: boolean
  chatSearch: string
  onSearchChange: (text: string) => void
  onCloseSearch: () => void
  othersTyping: string[]
  teamOnlineCount: number
  showLobby: boolean
  onToggleLobby: () => void
  onOpenSearch: () => void
  onClose: () => void
}) {
  return (
    <div style={{ padding: '0.5rem 0.75rem', background: 'var(--brand)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative' }}>
      {isSearching ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.4rem', animation: 'fadeIn 0.2s' }}>
          <Search size={14} />
          <input
            type="text"
            value={chatSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search..."
            autoFocus
            style={{ flex: 1, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '6px', padding: '0.3rem 0.6rem', color: 'white', fontSize: '0.8rem', outline: 'none' }}
          />
          <button onClick={onCloseSearch} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }} aria-label="Close search">
            <X size={16} />
          </button>
        </div>
      ) : (
        <>
          <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MessageSquare size={16} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800 }}>Team Chat</h3>
            <div style={{ fontSize: '0.65rem', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {othersTyping.length > 0 ? (
                <span style={{ fontStyle: 'italic', fontWeight: 600 }}>typing...</span>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#4ade80' }} />
                  {teamOnlineCount} online
                </div>
              )}
              <button
                onClick={onToggleLobby}
                style={{
                  background: 'rgba(255,255,255,0.2)', border: 'none', borderRadius: '4px',
                  padding: '1px 4px', color: 'white', fontSize: '0.55rem', fontWeight: 900,
                  cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '2px'
                }}
                title="Team Lobby"
              >
                <LayoutGrid size={8} /> {showLobby ? 'EXIT' : 'LOBBY'}
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.3rem' }}>
            <button onClick={onOpenSearch} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', color: 'white', borderRadius: '6px', padding: '0.25rem' }} aria-label="Search chat">
              <Search size={14} />
            </button>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', color: 'white', borderRadius: '6px', padding: '0.25rem' }} aria-label="Close chat">
              <X size={14} />
            </button>
          </div>
        </>
      )}
    </div>
  )
}

function TeamLobby({
  showLobby,
  groupMembers,
  userId,
  onViewProfile
}: {
  showLobby: boolean
  groupMembers: Profile[]
  userId: string
  onViewProfile: (memberId: string) => void
}) {
  if (!showLobby) return null

  return (
    <div style={{
      position: 'absolute', top: '54px', left: 0, right: 0, bottom: 0,
      background: 'var(--surface)', zIndex: 100, display: 'flex', flexDirection: 'column',
      animation: 'slideUp 0.3s ease-out'
    }}>
      <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', background: 'var(--bg-sub)' }}>
        <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', color: 'var(--text-sub)' }}>Group Active Members</h4>
      </div>
      <div style={{ flex: 1, overflowY: 'auto', padding: '1rem' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {groupMembers.map((member) => (
            <div
              key={member.id}
              style={{
                background: 'var(--bg-sub)', padding: '0.8rem', borderRadius: '18px',
                border: '1px solid var(--border)', display: 'flex', alignItems: 'center',
                gap: '1rem', transition: 'all 0.2s'
              }}
              className="lobby-card"
            >
              <div style={{
                width: '42px', height: '42px', borderRadius: '14px', background: 'var(--brand)',
                overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center',
                color: 'white', fontWeight: 900
              }}>
                {member.avatar_url ? (
                  <Image
                    src={member.avatar_url}
                    alt={`${member.full_name ?? 'Member'} avatar`}
                    width={42}
                    height={42}
                    style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                    unoptimized
                  />
                ) : (
                  member.full_name?.charAt(0)
                )}
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{member.id === userId ? 'You' : member.full_name}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-sub)', fontWeight: 600 }}>{member.role || 'Member'}</div>
              </div>
              <button
                onClick={() => onViewProfile(member.id)}
                style={{
                  background: 'var(--brand)', color: 'white', border: 'none',
                  borderRadius: '10px', width: '32px', height: '32px',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: 'pointer'
                }}
                aria-label={`Open profile for ${member.full_name ?? 'member'}`}
              >
                <ExternalLink size={16} />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}

function MessageList({
  loading,
  messages,
  groupedMessages,
  user,
  isOnline,
  othersTyping,
  onDeleteMessage,
  messagesEndRef
}: {
  loading: boolean
  messages: ChatMessage[]
  groupedMessages: { date: string; msgs: ChatMessage[] }[]
  user: Profile
  isOnline: boolean
  othersTyping: string[]
  onDeleteMessage: (messageId: string) => void
  messagesEndRef: React.RefObject<HTMLDivElement | null>
}) {
  return (
    <div className="chat-viewport" style={{
      flex: 1, overflowY: 'auto', padding: '0.5rem', display: 'flex', flexDirection: 'column', gap: '0.25rem',
      background: 'var(--bg-sub)'
    }}>
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
                        transition: 'opacity 0.2s'
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

function ChatInputBar({
  newMessage,
  isOnline,
  uploading,
  onTyping,
  onUpload,
  onSend
}: {
  newMessage: string
  isOnline: boolean
  uploading: boolean
  onTyping: (text: string) => void
  onUpload: (e: React.ChangeEvent<HTMLInputElement>) => Promise<void>
  onSend: (e: React.FormEvent | null) => Promise<void>
}) {
  return (
    <div style={{ padding: '0.4rem 0.5rem', background: 'var(--bg-sub)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      <div style={{ display: 'flex', gap: '0.25rem', color: 'var(--text-sub)' }}>
        <label style={{ cursor: 'pointer', color: 'inherit', display: 'flex', alignItems: 'center', padding: '0.2rem', borderRadius: '6px', transition: 'background 0.2s' }} className="icon-btn">
          <Paperclip size={18} />
          <input type="file" onChange={onUpload} style={{ display: 'none' }} />
        </label>
      </div>
      <form onSubmit={onSend} style={{ flex: 1 }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => onTyping(e.target.value)}
          placeholder={isOnline ? 'Message...' : 'Offline mode: Messages will queue'}
          style={{
            width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px',
            padding: '0.4rem 0.75rem', fontSize: '0.825rem', outline: 'none', color: 'var(--text-main)',
            transition: 'border-color 0.2s'
          }}
        />
      </form>
      <button
        onClick={(e) => {
          void onSend(e as unknown as React.FormEvent)
        }}
        disabled={!newMessage.trim() && !uploading}
        style={{
          background: newMessage.trim() ? 'var(--brand)' : 'var(--bg-main)',
          color: newMessage.trim() ? 'white' : 'var(--text-sub)',
          border: `1px solid ${newMessage.trim() ? 'transparent' : 'var(--border)'}`,
          borderRadius: '50%', width: '32px', height: '32px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: newMessage.trim() ? 'pointer' : 'default'
        }}
        aria-label="Send message"
      >
        <Send size={15} />
      </button>
    </div>
  )
}

export default function TeamChat({ groupId, user }: TeamChatProps) {
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showLobby, setShowLobby] = useState(false)
  const [groupMembers, setGroupMembers] = useState<Profile[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [chatSearch, setChatSearch] = useState('')
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  
  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { isOnline } = useConnectivity()
  const { onlineUsers, typingUsers, setTypingStatus } = usePresence()

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }

  // Request Notification Permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }
  }, [])

  // Real-time Subscription
  useEffect(() => {
    const q = query(
      collection(db, 'messages'),
      where('group_id', '==', groupId),
      orderBy('created_at', 'asc'),
      limit(50)
    )

    const unsub = onSnapshot(q, (snap) => {
      const incomingMessages = snap.docs.map(d => ({ id: d.id, ...d.data() } as ChatMessage))
      
      // Handle notifications for new messages
      snap.docChanges().forEach(change => {
        if (change.type === 'added') {
          const incoming = change.doc.data() as ChatMessage
          if (incoming.user_id !== user.id && (!isOpen || document.hidden)) {
            if ('Notification' in window && Notification.permission === 'granted') {
              new Notification('New Team Message', {
                body: incoming.content || 'Sent an attachment',
                icon: '/brand-logo-black-gold.png'
              })
            }
          }
        }
      })

      setMessages(incomingMessages)
      setLoading(false)
      setTimeout(() => scrollToBottom('smooth'), 100)
    })

    return () => unsub()
  }, [groupId, isOpen, user.id])

  useEffect(() => {
    if (!isOpen) return

    const q = query(collection(db, 'profiles'), where('group_id', '==', groupId))
    const unsub = onSnapshot(q, (snap) => {
      setGroupMembers(snap.docs.map(d => ({ id: d.id, ...d.data() } as Profile)))
    })

    return () => unsub()
  }, [isOpen, groupId])

  const handleTyping = (text: string) => {
    setNewMessage(text)
    setTypingStatus(true)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
       setTypingStatus(false)
    }, 2000)
  }

  const handleSendMessage = async (e: React.FormEvent | null, contentOverride?: string, payload?: ChatPayload) => {
    e?.preventDefault()
    const content = contentOverride || newMessage.trim()
    if (!content && !payload) return

    setTypingStatus(false)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

    setNewMessage('')
    scrollToBottom('smooth')

    try {
      const docRef = await addDoc(collection(db, 'messages'), {
        group_id: groupId,
        user_id: user.id,
        content,
        payload,
        is_deleted: false,
        created_at: new Date().toISOString(),
        server_timestamp: serverTimestamp()
      })

      // Verifiable Logging
      logActivity(
        user.id, 
        groupId, 
        'message_sent', 
        `Sent a ${payload?.type || 'text'} message`,
        { message_id: docRef.id }
      )
    } catch (err: any) {
      console.error('Send message error:', err.message)
    }
  }

  const handleDeleteMessage = async (msgId: string) => {
     if (!confirm('Are you sure you want to delete this message for everyone?')) return
     
     try {
       await updateDoc(doc(db, 'messages', msgId), {
         is_deleted: true,
         content: 'This message was deleted'
       })
       
       logActivity(
         user.id, 
         groupId, 
         'message_deleted', 
         'Deleted a message',
         { message_id: msgId }
       )
     } catch (err: any) {
       console.error('Delete message error:', err.message)
     }
  }

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
     const file = e.target.files?.[0]
     if (!file) return
     
     setUploading(true)
     try {
       const fileName = `${groupId}/chat-${Date.now()}-${file.name}`
       const fileRef = ref(storage, `Espeezy_assets/${fileName}`)
       
       await uploadBytes(fileRef, file)
       const publicUrl = await getDownloadURL(fileRef)

       await handleSendMessage(
          null,
          '',
          {
            type: file.type.startsWith('image/') ? 'image' : 'file',
            url: publicUrl,
            name: file.name
          }
       )
     } catch (err: any) {
       console.error('File upload error:', err.message)
     } finally {
       setUploading(false)
     }
  }

  const filteredMessages = useMemo(() => {
     if (!chatSearch.trim()) return messages
     const term = chatSearch.toLowerCase()
     return messages.filter(m => 
        m.content.toLowerCase().includes(term) || 
        m.profiles?.full_name?.toLowerCase().includes(term)
     )
  }, [messages, chatSearch])

    const groupedMessages = useMemo(() => {
      const groups: { date: string, msgs: ChatMessage[] }[] = []
      filteredMessages.forEach((m) => {
        const label = formatDateLabel(m.created_at)

        const lastGroup = groups[groups.length - 1]
        if (lastGroup && lastGroup.date === label) {
          lastGroup.msgs.push(m)
        } else {
          groups.push({ date: label, msgs: [m] })
        }
      })
      return groups
  }, [filteredMessages])

  const othersTyping = Array.from(typingUsers).filter(id => id !== user.id)
    const teamOnlineCount = useMemo(() => {
     return groupMembers.filter(m => onlineUsers.has(m.id)).length
    }, [groupMembers, onlineUsers])

  if (!isOpen) {
      return <ClosedChatButton onOpen={() => setIsOpen(true)} />
  }

  return (
    <div 
      style={{
        position: 'fixed', 
        bottom: 'calc(var(--h-mobile-bottom) + 1rem + env(safe-area-inset-bottom))', 
        right: 'min(2rem, 0.5rem)', 
        width: 'min(400px, calc(100vw - 1rem))', 
        maxHeight: 'calc(var(--vh-dynamic) - var(--h-mobile-bottom) - var(--h-nav) - 2rem)', 
        background: 'var(--surface)', 
        borderRadius: '24px', 
        boxShadow: '0 24px 48px rgba(0,0,0,0.2)', 
        border: '1px solid var(--border)', 
        display: 'flex', 
        flexDirection: 'column', 
        zIndex: 5000, 
        overflow: 'hidden', 
        animation: 'whatsappIn 0.4s ease-out'
      }}
      className="responsive-chat"
    >
      <TeamChatHeader
        isSearching={isSearching}
        chatSearch={chatSearch}
        onSearchChange={(value) => setChatSearch(value)}
        onCloseSearch={() => { setIsSearching(false); setChatSearch('') }}
        othersTyping={othersTyping}
        teamOnlineCount={teamOnlineCount}
        showLobby={showLobby}
        onToggleLobby={() => setShowLobby((prev) => !prev)}
        onOpenSearch={() => setIsSearching(true)}
        onClose={() => setIsOpen(false)}
      />

      <TeamLobby
        showLobby={showLobby}
        groupMembers={groupMembers}
        userId={user.id}
        onViewProfile={(memberId) => router.push(`/dashboard/network/profile/${memberId}`)}
      />

      <MessageList
        loading={loading}
        messages={messages}
        groupedMessages={groupedMessages}
        user={user}
        isOnline={isOnline}
        othersTyping={othersTyping}
        onDeleteMessage={handleDeleteMessage}
        messagesEndRef={messagesEndRef}
      />

      <ChatInputBar
        newMessage={newMessage}
        isOnline={isOnline}
        uploading={uploading}
        onTyping={handleTyping}
        onUpload={handleFileUpload}
        onSend={handleSendMessage}
      />

       <style jsx>{`
          @keyframes whatsappIn { 
            from { opacity: 0; transform: translateY(40px) scale(0.9); } 
            to { opacity: 1; transform: translateY(0) scale(1); } 
          }
          @keyframes shimmer {
            0% { background-position: -200% 0; }
            100% { background-position: 200% 0; }
          }
          .msg-bubble.pending { opacity: 0.65; }
          .chat-viewport::-webkit-scrollbar { display: block; width: 4px; }
          .chat-viewport::-webkit-scrollbar-thumb { background: var(--border); border-radius: 10px; }
          .chat-viewport { scrollbar-width: thin; scrollbar-color: var(--border) transparent; }
          .typing-dots span { animation: blink 1.4s infinite; opacity: 0; font-size: 1.1rem; margin: 0 0.5px; }
          .typing-dots span:nth-child(2) { animation-delay: 0.2s; }
          .typing-dots span:nth-child(3) { animation-delay: 0.4s; }
          @keyframes blink { 0% { opacity: 0; } 50% { opacity: 1; } 100% { opacity: 0; } }
          @keyframes slideUp { 
            from { opacity: 0; transform: translateY(20px); } 
            to { opacity: 1; transform: translateY(0); } 
          }
          .msg-bubble:hover .delete-btn { opacity: 0.7 !important; }
          .icon-btn:hover { background: var(--border); }
          .chat-toggle:hover { transform: scale(1.08) translateY(-2px); box-shadow: 0 12px 24px rgba(0,0,0,0.3); }
          .lobby-card:hover { transform: translateX(5px); border-color: var(--brand) !important; background: var(--surface) !important; }

          @media (min-width: 769px) {
            .chat-toggle {
              bottom: 2rem !important;
              right: 2rem !important;
            }
            .responsive-chat {
              bottom: 2rem !important;
              right: 2rem !important;
              height: min(650px, calc(100vh - 6rem)) !important;
            }
          }
       `}</style>
    </div>
  )
}
