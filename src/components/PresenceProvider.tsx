'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef, useTransition } from 'react'
import { database, auth } from '@/lib/firebase'
import { 
  ref, 
  onValue, 
  set, 
  onDisconnect, 
  serverTimestamp, 
  remove,
  update
} from 'firebase/database'
import { PresenceContextType } from '@/types/ui'
import { useNotifications } from '@/components/NotificationProvider'
import { useProfile } from '@/context/ProfileContext'

const PresenceContext = createContext<PresenceContextType>({
  onlineUsers: new Set(),
  typingUsers: new Set(),
  setTypingStatus: async () => {}
})

export const usePresence = () => useContext(PresenceContext)

type PresenceProviderProps = {
  user?: { id: string; full_name?: string }
  children: React.ReactNode
}

export const PresenceProvider = ({ user, children }: PresenceProviderProps) => {
  const [onlineUsers, setOnlineUsers] = useState<Set<string>>(new Set())
  const [typingUsers, setTypingUsers] = useState<Set<string>>(new Set())
  const [, startTransition] = useTransition()
  const { addToast } = useNotifications()
  const { profile } = useProfile()
  
  const userId = user?.id
  const userName = user?.full_name
  const groupId = profile?.group_id

  const lastNotified = useRef<Map<string, number>>(new Map())

  const setTypingStatus = useCallback(async (isTyping: boolean) => {
    if (!userId) return
    try {
      const presenceRef = ref(database, `presence/global/${userId}`)
      await update(presenceRef, { is_typing: isTyping, last_seen: serverTimestamp() })
    } catch (err: any) {
      console.error('Typing status error:', err.message)
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return

    const presenceRef = ref(database, `presence/global/${userId}`)
    const allPresenceRef = ref(database, 'presence/global')

    // 1. Setup local presence with automatic cleanup
    const setupPresence = async () => {
      await set(presenceRef, {
        user_id: userId,
        full_name: userName || 'Anonymous',
        group_id: groupId || 'none',
        online_at: new Date().toISOString(),
        is_typing: false,
        last_seen: serverTimestamp()
      })
      onDisconnect(presenceRef).remove()
    }

    setupPresence()

    // 2. Listen to all presence
    const unsubscribe = onValue(allPresenceRef, (snap) => {
      const data = snap.val() || {}
      const onlineIds = new Set<string>()
      const typingIds = new Set<string>()

      Object.keys(data).forEach(key => {
        const item = data[key]
        onlineIds.add(key)
        if (item.is_typing) {
          typingIds.add(key)
        }

        // Check for join notifications (scoped to group)
        if (key !== userId && item.group_id === groupId && groupId && groupId !== 'none') {
          const now = Date.now()
          const lastTime = lastNotified.current.get(key) || 0
          if (now - lastTime > 60000) {
            addToast('Teammate Online', `${item.full_name || 'A teammate'} is online now`, 'success')
            lastNotified.current.set(key, now)
          }
        }
      })

      startTransition(() => {
        setOnlineUsers(onlineIds)
        setTypingUsers(typingIds)
      })
    })

    return () => {
      unsubscribe()
      remove(presenceRef)
    }
  }, [userId, userName, groupId, addToast])

  return (
    <PresenceContext.Provider value={{ onlineUsers, typingUsers, setTypingStatus }}>
      {children}
    </PresenceContext.Provider>
  )
}
