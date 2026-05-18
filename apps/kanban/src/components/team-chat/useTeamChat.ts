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
    let active = true

    const loadMessages = async () => {
      const { data, error } = await db
        .from('messages')
        .select('id, group_id, user_id, content, payload, is_deleted, created_at, profiles:profiles!messages_user_id_fkey(full_name, avatar_url, role)')
        .eq('group_id', groupId)
        .order('created_at', { ascending: true })
        .limit(50)

      if (!active) return
      if (error) {
        console.error('Messages load error:', error.message)
        setLoading(false)
        return
      }

      const normalized = (data ?? []).map((row: Record<string, unknown>) => ({
        ...row,
        profiles: Array.isArray(row.profiles) ? row.profiles[0] : row.profiles,
      }))
      setMessages(normalized as ChatMessage[])
      setLoading(false)
      setTimeout(() => scrollToBottom('smooth'), 100)
    }

    loadMessages()

    const channel = db
      .channel(`team-messages:${groupId}`)
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
                  icon: '/brand_logo2.svg',
                })
              }
            }
          }

          loadMessages()
        },
      )
      .subscribe()

    return () => {
      active = false
      db.removeChannel(channel)
    }
  }, [db, groupId, isOpen, user.id])

  useEffect(() => {
    if (!isOpen) return

    let active = true
    const loadMembers = async () => {
      const { data, error } = await db
        .from('profiles')
        .select('*')
        .eq('group_id', groupId)

      if (!active) return
      if (error) {
        console.error('Group members load error:', error.message)
        return
      }

      setGroupMembers((data ?? []) as Profile[])
    }

    loadMembers()

    const channel = db
      .channel(`team-members:${groupId}`)
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'profiles', filter: `group_id=eq.${groupId}` },
        () => loadMembers(),
      )
      .subscribe()

    return () => {
      active = false
      db.removeChannel(channel)
    }
  }, [db, isOpen, groupId])

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

      // Verifiable Logging
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
