'use client'

import { useState, useEffect, useRef, useMemo, useCallback, type ChangeEvent, type FormEvent } from 'react'
import { createClient as createBrowserSupabaseClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import { useConnectivity } from '@/context/ConnectivityContext'
import { usePresence } from '../PresenceProvider'
import { logActivity } from '@/utils/logging'
import { ChatMessage, ChatPayload } from '@/types/ui'
import { Profile } from '@/types/auth'
import { formatDateLabel } from './team-chat-utils'
import { ESPEEZY_APP_MARK_ICON_PATH } from '@shared/espeezy-app-logo-config'

const TEAM_CHAT_POLL_MS = 5_000
const JOIN_TOAST_MS = 5_000

export type TeamChatProps = {
  groupId: string
  user: Profile
}

export function useTeamChat({ groupId, user }: TeamChatProps) {
  const db = useMemo(() => createBrowserSupabaseClient(), [])
  const [messages, setMessages] = useState<ChatMessage[]>([])
  const [newMessage, setNewMessage] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [uploading, setUploading] = useState(false)
  const [showLobby, setShowLobby] = useState(false)
  const [groupMembers, setGroupMembers] = useState<Profile[]>([])
  const [isSearching, setIsSearching] = useState(false)
  const [chatSearch, setChatSearch] = useState('')
  const [joinToast, setJoinToast] = useState<{ id: string; name: string } | null>(null)
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null)
  const joinToastTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null)
  const previousTeamOnlineRef = useRef<Set<string>>(new Set())
  const lastMessageCountRef = useRef(0)

  const router = useRouter()
  const messagesEndRef = useRef<HTMLDivElement>(null)
  const { isOnline } = useConnectivity()
  const { onlineUsers, typingUsers, setTypingStatus } = usePresence()

  const scrollToBottom = (behavior: ScrollBehavior = 'smooth') => {
    messagesEndRef.current?.scrollIntoView({ behavior })
  }

  const showJoinToast = useCallback((member: Profile) => {
    const name = member.full_name?.trim() || 'Teammate'
    setJoinToast({ id: member.id, name })
    if (joinToastTimeoutRef.current) clearTimeout(joinToastTimeoutRef.current)
    joinToastTimeoutRef.current = setTimeout(() => setJoinToast(null), JOIN_TOAST_MS)
  }, [])

  const clearJoinToast = useCallback(() => {
    setJoinToast(null)
    if (joinToastTimeoutRef.current) clearTimeout(joinToastTimeoutRef.current)
  }, [])

  // Request Notification Permission
  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission()
      }
    }
  }, [])

  const loadMessages = useCallback(
    async (opts?: { silent?: boolean }) => {
      const silent = opts?.silent ?? false
      const { data, error } = await db
        .from('messages')
        .select('id, group_id, user_id, content, payload, is_deleted, created_at, profiles:profiles!messages_user_id_fkey(full_name, avatar_url, role)')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })
        .limit(50)

      if (error) {
        console.error('Messages load error:', error.message)
        if (!silent) setLoading(false)
        return
      }

      const normalized = (data ?? []).map((row: Record<string, unknown>) => ({
        ...row,
        profiles: Array.isArray(row.profiles) ? row.profiles[0] : row.profiles,
      })) as ChatMessage[]

      const grew = normalized.length > lastMessageCountRef.current
      lastMessageCountRef.current = normalized.length
      setMessages(normalized)
      if (!silent) setLoading(false)

      if (grew && (isOpen || silent)) {
        const shouldScroll = isOpen && !silent
        if (shouldScroll) {
          setTimeout(() => scrollToBottom(grew && silent ? 'auto' : 'smooth'), 80)
        }
      }
    },
    [db, groupId, isOpen],
  )

  const loadMembers = useCallback(async () => {
    const { data, error } = await db.from('profiles').select('*').eq('group_id', groupId)

    if (error) {
      console.error('Group members load error:', error.message)
      return
    }

    setGroupMembers((data ?? []) as Profile[])
  }, [db, groupId])

  // Real-time subscription
  useEffect(() => {
    let active = true

    const bootstrap = async () => {
      await loadMessages()
      if (!active) return
    }

    void bootstrap()

    const channel = db
      .channel(`team-messages:${groupId}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'messages', filter: `group_id=eq.${groupId}` },
        (payload) => {
          if (payload.eventType === 'INSERT') {
            const incoming = payload.new as ChatMessage
            if (incoming.user_id !== user.id && (!isOpen || document.hidden)) {
              if ('Notification' in window && Notification.permission === 'granted') {
                new Notification('New Team Message', {
                  body: incoming.content || 'Sent an attachment',
                  icon: ESPEEZY_APP_MARK_ICON_PATH,
                })
              }
            }
          }

          void loadMessages({ silent: true })
        },
      )
      .subscribe()

    return () => {
      active = false
      db.removeChannel(channel)
    }
  }, [db, groupId, isOpen, user.id, loadMessages])

  // Games-style silent poll while tab is visible (backup when realtime lags)
  useEffect(() => {
    const poll = () => {
      if (document.visibilityState !== 'visible') return
      void loadMessages({ silent: true })
      void loadMembers()
    }

    const intervalId = window.setInterval(poll, TEAM_CHAT_POLL_MS)
    document.addEventListener('visibilitychange', poll)

    return () => {
      window.clearInterval(intervalId)
      document.removeEventListener('visibilitychange', poll)
    }
  }, [loadMessages, loadMembers])

  // Team roster — always loaded for lobby + join detection
  useEffect(() => {
    let active = true

    void loadMembers()

    const channel = db
      .channel(`team-members:${groupId}-${Date.now()}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `group_id=eq.${groupId}` },
        () => {
          if (active) void loadMembers()
        },
      )
      .subscribe()

    return () => {
      active = false
      db.removeChannel(channel)
    }
  }, [db, groupId, loadMembers])

  // Live join toasts (games-style) when teammates come online
  useEffect(() => {
    if (!groupMembers.length) return

    const teamOnline = new Set(
      groupMembers.filter((m) => m.id !== user.id && onlineUsers.has(m.id)).map((m) => m.id),
    )

    for (const member of groupMembers) {
      if (member.id === user.id) continue
      if (teamOnline.has(member.id) && !previousTeamOnlineRef.current.has(member.id)) {
        showJoinToast(member)
      }
    }

    previousTeamOnlineRef.current = teamOnline
  }, [groupMembers, onlineUsers, user.id, showJoinToast])

  // Announce active in scoped kanban live chat (parity with games widget)
  useEffect(() => {
    const username =
      user.full_name?.trim().replace(/\s+/g, '_').toLowerCase().slice(0, 24) ||
      `user_${user.id.slice(0, 6)}`

    fetch('/api/chat/presence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        app_scope: 'kanban',
        event_type: 'new_user',
        user_id: user.id,
        username,
        supabase_user_id: user.id,
      }),
    }).catch(() => undefined)

    const heartbeat = window.setInterval(() => {
      if (document.visibilityState !== 'visible') return
      fetch('/api/chat/presence', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          app_scope: 'kanban',
          event_type: 'active',
          user_id: user.id,
          username,
          supabase_user_id: user.id,
        }),
      }).catch(() => undefined)
    }, TEAM_CHAT_POLL_MS)

    return () => window.clearInterval(heartbeat)
  }, [user.full_name, user.id])

  useEffect(() => {
    return () => {
      if (joinToastTimeoutRef.current) clearTimeout(joinToastTimeoutRef.current)
    }
  }, [])

  const handleTyping = (text: string) => {
    setNewMessage(text)
    setTypingStatus(true)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)
    typingTimeoutRef.current = setTimeout(() => {
      setTypingStatus(false)
    }, 2000)
  }

  const handleSendMessage = async (e: FormEvent | null, contentOverride?: string, payload?: ChatPayload) => {
    e?.preventDefault()
    const content = contentOverride || newMessage.trim()
    if (!content && !payload) return

    setTypingStatus(false)
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current)

    setNewMessage('')
    scrollToBottom('smooth')

    try {
      const { data, error } = await db
        .from('messages')
        .insert({
          group_id: groupId,
          user_id: user.id,
          content,
          payload: payload ?? null,
          is_deleted: false,
          created_at: new Date().toISOString(),
        })
        .select('id')
        .single()

      if (error) throw error

      logActivity(
        user.id,
        groupId,
        'message_sent',
        `Sent a ${payload?.type || 'text'} message`,
        { message_id: data.id },
      )
    } catch (err: unknown) {
      console.error('Send message error:', err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const handleDeleteMessage = async (msgId: string) => {
    if (!confirm('Are you sure you want to delete this message for everyone?')) return

    try {
      const { error } = await db
        .from('messages')
        .update({
          is_deleted: true,
          content: 'This message was deleted',
        })
        .eq('id', msgId)

      if (error) throw error

      logActivity(
        user.id,
        groupId,
        'message_deleted',
        'Deleted a message',
        { message_id: msgId },
      )
    } catch (err: unknown) {
      console.error('Delete message error:', err instanceof Error ? err.message : 'Unknown error')
    }
  }

  const handleFileUpload = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    setUploading(true)
    try {
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_')
      const filePath = `${groupId}/chat-${Date.now()}-${safeName}`

      const { error: uploadError } = await db.storage
        .from('espeezy-assets')
        .upload(filePath, file, { upsert: false })

      if (uploadError) throw uploadError

      const { data } = db.storage
        .from('espeezy-assets')
        .getPublicUrl(filePath)

      const publicUrl = data.publicUrl

      await handleSendMessage(
        null,
        '',
        {
          type: file.type.startsWith('image/') ? 'image' : 'file',
          url: publicUrl,
          name: file.name,
        },
      )
    } catch (err: unknown) {
      console.error('File upload error:', err instanceof Error ? err.message : 'Unknown error')
    } finally {
      setUploading(false)
    }
  }

  const filteredMessages = useMemo(() => {
    if (!chatSearch.trim()) return messages
    const term = chatSearch.toLowerCase()
    return messages.filter((m) =>
      m.content.toLowerCase().includes(term) ||
      m.profiles?.full_name?.toLowerCase().includes(term),
    )
  }, [messages, chatSearch])

  const groupedMessages = useMemo(() => {
    const groups: { date: string; msgs: ChatMessage[] }[] = []
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

  const othersTyping = Array.from(typingUsers).filter((id) => id !== user.id)
  const teamOnlineCount = useMemo(() =>
    groupMembers.filter((m) => onlineUsers.has(m.id)).length,
  [groupMembers, onlineUsers],
  )

  const openChat = useCallback(() => setIsOpen(true), [])
  const closeChat = useCallback(() => setIsOpen(false), [])
  const toggleLobby = useCallback(() => setShowLobby((prev) => !prev), [])
  const openSearch = useCallback(() => setIsSearching(true), [])
  const closeSearch = useCallback(() => {
    setIsSearching(false)
    setChatSearch('')
  }, [])
  const onViewProfile = useCallback((memberId: string) => {
    router.push(`/network/profile/${memberId}`)
  }, [router])

  return {
    isOpen,
    messages,
    newMessage,
    loading,
    uploading,
    showLobby,
    groupMembers,
    isSearching,
    chatSearch,
    setChatSearch,
    messagesEndRef,
    isOnline,
    groupedMessages,
    othersTyping,
    teamOnlineCount,
    joinToast,
    clearJoinToast,
    handleTyping,
    handleSendMessage,
    handleDeleteMessage,
    handleFileUpload,
    openChat,
    closeChat,
    toggleLobby,
    openSearch,
    closeSearch,
    onViewProfile,
  }
}
