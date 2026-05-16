'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useTransition, useMemo } from 'react'
import { createClient as createBrowserSupabaseClient } from '@/lib/supabase/client'
import { PresenceContextType, LayoutUser } from '@/types/ui'
import { useNotifications } from '@/components/NotificationProvider'
import { useProfile } from '@/context/ProfileContext'

const PresenceContext = createContext<PresenceContextType>({
  onlineUsers: new Set(),
  typingUsers: new Set(),
  setTypingStatus: async () => {}
})

export const usePresence = () => useContext(PresenceContext)

type PresenceProviderProps = {
  user?: LayoutUser
  children: React.ReactNode
}

export const PresenceProvider = ({ user, children }: PresenceProviderProps) => {
  const db = useMemo(() => createBrowserSupabaseClient(), [])
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [, startTransition] = useTransition()
  const { addToast } = useNotifications()
  const { profile } = useProfile()
  
  const userId = user?.id
  const isMockUser = userId === '00000000-0000-0000-0000-000000000000'
  const userName = user?.full_name
  const groupId = profile?.group_id

  const lastNotified = useRef<Map<string, number>>(new Map())
  const previousOnlineRef = useRef<Set<string>>(new Set())

  const setTypingStatus = useCallback(async (isTyping: boolean) => {
    if (!userId || isMockUser) return
    try {
      const { error } = await db
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
  }, [db, groupId, userId])

  useEffect(() => {
    if (!userId || isMockUser) return

    let active = true

    const applyPresenceState = (rows: Array<{ user_id: string; is_typing: boolean; group_id: string | null }>) => {
      const nextOnline = new Set<string>()
      const nextTyping = new Set<string>()

      rows.forEach((row) => {
        nextOnline.add(row.user_id)
        if (row.is_typing) {
          nextTyping.add(row.user_id)
        }

        if (
          row.user_id !== userId &&
          row.group_id &&
          groupId &&
          row.group_id === groupId &&
          !previousOnlineRef.current.has(row.user_id)
        ) {
          const now = Date.now()
          const lastTime = lastNotified.current.get(row.user_id) || 0
          if (now - lastTime > 60000) {
            addToast('Teammate Online', 'A teammate is online now', 'success')
            lastNotified.current.set(row.user_id, now)
          }
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
      const { data, error } = await db
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
      const { error } = await db
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
      db
        .from('presence')
        .update({
          is_online: true,
          last_seen: new Date().toISOString(),
          activity_status: 'active',
        })
        .eq('user_id', userId)
    }, 30000)

    const channel = db
      .channel('presence-feed')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'presence' }, () => {
        fetchPresence()
      })
      .subscribe()

    return () => {
      active = false
      clearInterval(heartbeat)
      db
        .from('presence')
        .update({
          is_online: false,
          is_typing: false,
          activity_status: 'offline',
          last_seen: new Date().toISOString(),
        })
        .eq('user_id', userId)
      db.removeChannel(channel)
    }
  }, [addToast, db, groupId, startTransition, userId, userName])

  return (
    <PresenceContext.Provider value={{ onlineUsers, typingUsers, setTypingStatus }}>
      {children}
    </PresenceContext.Provider>
  )
}
