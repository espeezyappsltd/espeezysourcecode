'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useTransition, useMemo } from 'react'
import { createClient as createBrowserSupabaseClient } from '@/lib/supabase/client'
import { PresenceContextType, LayoutUser } from '@/types/ui'
import { useNotifications } from '@/components/NotificationProvider'
import { useProfile } from '@/context/ProfileContext'
import { PRESENCE_ONLINE_WINDOW_MS } from '@/lib/presence/team-presence'

const PresenceContext = createContext<PresenceContextType>({
  onlineUsers: new Set(),
  typingUsers: new Set(),
  globalOnlineCount: 0,
  setTypingStatus: async () => {},
})

export const usePresence = () => useContext(PresenceContext)

type PresenceProviderProps = {
  user?: LayoutUser
  children: React.ReactNode
}

type PresenceRow = { user_id: string; is_typing: boolean; group_id: string | null }

export const PresenceProvider = ({ user, children }: PresenceProviderProps) => {
  const db = useMemo(() => createBrowserSupabaseClient(), [])
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [, startTransition] = useTransition()
  const { addToast } = useNotifications()
  const { profile } = useProfile()

  const userId = user?.id
  const userName = user?.full_name
  const groupId = profile?.group_id

  const lastNotified = useRef<Map<string, number>>(new Map())
  const previousTeamOnlineRef = useRef<Set<string>>(new Set())

  const setTypingStatus = useCallback(
    async (isTyping: boolean) => {
      if (!userId) return
      try {
        const { error } = await db.from('presence').upsert(
          {
            user_id: userId,
            group_id: groupId ?? null,
            is_online: true,
            is_typing: isTyping,
            last_seen: new Date().toISOString(),
            activity_status: 'active',
            device_info: { source: 'presence-provider' },
          },
          { onConflict: 'user_id' },
        )
        if (error) throw error
      } catch (err: unknown) {
        if (err instanceof Error) console.error('Typing status error:', err.message)
      }
    },
    [db, groupId, userId],
  )

  useEffect(() => {
    if (!userId) return

    let active = true

    const applyPresenceState = (rows: PresenceRow[]) => {
      const globalOnline = new Set<string>()
      const teamTyping = new Set<string>()
      const teamOnline = new Set<string>()

      rows.forEach((row) => {
        globalOnline.add(row.user_id)

        if (groupId && row.group_id === groupId) {
          teamOnline.add(row.user_id)
          if (row.is_typing) teamTyping.add(row.user_id)

          if (row.user_id !== userId && !previousTeamOnlineRef.current.has(row.user_id)) {
            const now = Date.now()
            const lastTime = lastNotified.current.get(row.user_id) || 0
            if (now - lastTime > 60_000) {
              addToast('Teammate online', 'Someone on your team is active now.', 'success')
              lastNotified.current.set(row.user_id, now)
            }
          }
        }
      })

      globalOnline.add(userId)
      if (groupId) teamOnline.add(userId)

      previousTeamOnlineRef.current = teamOnline

      startTransition(() => {
        setOnlineUsers(globalOnline)
        setTypingUsers(teamTyping)
      })
    }

    const fetchPresence = async () => {
      const staleCutoff = new Date(Date.now() - PRESENCE_ONLINE_WINDOW_MS).toISOString()
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

      applyPresenceState((data ?? []) as PresenceRow[])
    }

    const setupPresence = async () => {
      const { error } = await db.from('presence').upsert(
        {
          user_id: userId,
          group_id: groupId ?? null,
          is_online: true,
          is_typing: false,
          last_seen: new Date().toISOString(),
          activity_status: 'active',
          device_info: { source: 'presence-provider', user_name: userName ?? 'Anonymous' },
        },
        { onConflict: 'user_id' },
      )

      if (error) {
        console.error('Presence setup error:', error.message)
        return
      }

      await fetchPresence()
    }

    void setupPresence()

    const heartbeat = setInterval(() => {
      void db
        .from('presence')
        .update({
          is_online: true,
          last_seen: new Date().toISOString(),
          activity_status: 'active',
          group_id: groupId ?? null,
        })
        .eq('user_id', userId)
    }, 30_000)

    const channel = db.channel(`presence-global-${userId}`)
    channel.on('postgres_changes', { event: '*', schema: 'public', table: 'presence' }, () => {
      void fetchPresence()
    })
    channel.subscribe()

    return () => {
      active = false
      clearInterval(heartbeat)
      void db
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

  const globalOnlineCount = onlineUsers.size

  return (
    <PresenceContext.Provider value={{ onlineUsers, typingUsers, globalOnlineCount, setTypingStatus }}>
      {children}
    </PresenceContext.Provider>
  )
}
