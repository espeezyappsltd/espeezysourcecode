'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useTransition, useMemo } from 'react'
import { supabase } from '@/lib/supabase-client'

export type PresenceContextType = {
  onlineUsers: Set<string>
  typingUsers: Set<string>
  setTypingStatus: (isTyping: boolean) => Promise<void>
}

const PresenceContext = createContext<PresenceContextType>({
  onlineUsers: new Set(),
  typingUsers: new Set(),
  setTypingStatus: async () => {}
})

export const usePresence = () => useContext(PresenceContext)

type PresenceProviderProps = {
  user?: { id: string; full_name?: string | null }
  groupId?: string | null
  children: React.ReactNode
}

export const PresenceProvider = ({ user, groupId, children }: PresenceProviderProps) => {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [, startTransition] = useTransition()

  const userId = user?.id
  const userName = user?.full_name

  const previousOnlineRef = useRef<Set<string>>(new Set())

  const setTypingStatus = useCallback(async (isTyping: boolean) => {
    if (!userId) return
    try {
      const { error } = await supabase
        .from('presence')
        .upsert({
          user_id: userId,
          group_id: groupId ?? null,
          is_online: true,
          is_typing: isTyping,
          last_seen: new Date().toISOString(),
          activity_status: 'active',
          device_info: { source: 'presence-provider' },
        }, { onConflict: 'user_id' })

      if (error) throw error
    } catch (err: unknown) {
      if (err instanceof Error) {
        console.error('Typing status error:', err.message)
      }
    }
  }, [groupId, userId])

  useEffect(() => {
    if (!userId) return

    let active = true

    const applyPresenceState = (rows: Array<{ user_id: string; is_typing: boolean; group_id: string | null }>) => {
      const nextOnline = new Set<string>()
      const nextTyping = new Set<string>()

      rows.forEach((row) => {
        nextOnline.add(row.user_id)
        if (row.is_typing) {
          nextTyping.add(row.user_id)
        }
      })

      previousOnlineRef.current = nextOnline

      startTransition(() => {
        setOnlineUsers(nextOnline)
        setTypingUsers(nextTyping)
      })
    }

    const fetchPresence = async () => {
      const staleCutoff = new Date(Date.now() - 5 * 60 * 1000).toISOString()
      const { data, error } = await supabase
        .from('presence')
        .select('user_id, is_typing, group_id')
        .eq('is_online', true)
        .gte('last_seen', staleCutoff)

      if (!active) return
      if (error) {
        console.error('Presence fetch error:', error.message)
        return
      }

      applyPresenceState((data ?? []) as Array<{ user_id: string; is_typing: boolean; group_id: string | null }>)
    }

    const setupPresence = async () => {
      const { error } = await supabase
        .from('presence')
        .upsert({
          user_id: userId,
          group_id: groupId ?? null,
          is_online: true,
          is_typing: false,
          last_seen: new Date().toISOString(),
          activity_status: 'active',
          device_info: { source: 'presence-provider', user_name: userName ?? 'Anonymous' },  
        }, { onConflict: 'user_id' })

      if (error) {
        console.error('Presence setup error:', error.message)
        return
      }

      await fetchPresence()
    }

    setupPresence()

    const heartbeat = setInterval(() => {
      supabase
        .from('presence')
        .update({
          is_online: true,
          last_seen: new Date().toISOString(),
          activity_status: 'active',
        })
        .eq('user_id', userId)
    }, 30000)

    const channel = supabase
      .channel('presence-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'presence' }, () => {   
        fetchPresence()
      })
      .subscribe()

    return () => {
      active = false
      clearInterval(heartbeat)
      supabase
        .from('presence')
        .update({
          is_online: false,
          is_typing: false,
          activity_status: 'offline',
          last_seen: new Date().toISOString(),
        })
        .eq('user_id', userId)
      supabase.removeChannel(channel)
    }
  }, [groupId, startTransition, userId, userName])

  return (
    <PresenceContext.Provider value={{ onlineUsers, typingUsers, setTypingStatus }}>
      {children}
    </PresenceContext.Provider>
  )
}
