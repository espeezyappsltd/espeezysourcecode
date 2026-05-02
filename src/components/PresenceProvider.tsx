'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef, useTransition } from 'react'
import { db, auth } from '@/lib/firebase'
import { 
  doc, 
  setDoc, 
  onSnapshot, 
  collection, 
  query, 
  where, 
  updateDoc, 
  serverTimestamp,
  deleteDoc,
  getDocs
} from 'firebase/firestore'
import { PresenceContextType, PresenceState } from '@/types/ui'
import { useNotifications } from '@/components/NotificationProvider'
import { useProfile } from '@/context/ProfileContext'
import { hasFeature } from '@/utils/feature-gate'

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
      await updateDoc(doc(db, 'presence', userId), { is_typing: isTyping })
    } catch (err: any) {
      console.error('Typing status error:', err.message)
    }
  }, [userId])

  useEffect(() => {
    if (!userId) return

    let unsubscribePresence: (() => void) | null = null

    const setupPresence = async () => {
      // 1. Initial tracking
      await setDoc(doc(db, 'presence', userId), {
        user_id: userId,
        full_name: userName,
        group_id: groupId,
        online_at: new Date().toISOString(),
        is_typing: false,
        last_seen: serverTimestamp()
      })

      // 2. Listen to all presence
      const q = query(collection(db, 'presence'))
      unsubscribePresence = onSnapshot(q, (snap) => {
        const onlineIds = new Set<string>()
        const typingIds = new Set<string>()

        snap.docs.forEach(d => {
          const data = d.data()
          const key = d.id
          onlineIds.add(key)
          if (data.is_typing) {
            typingIds.add(key)
          }

          // Check for join notifications (scoped to group)
          if (key !== userId && data.group_id === groupId && groupId) {
            const now = Date.now()
            const lastTime = lastNotified.current.get(key) || 0
            if (now - lastTime > 60000) {
              addToast('Teammate Online', `${data.full_name || 'A teammate'} is online now`, 'success')
              lastNotified.current.set(key, now)
            }
          }
        })

        startTransition(() => {
          setOnlineUsers(onlineIds)
          setTypingUsers(typingIds)
        })
      })
    }

    setupPresence()

    const updateLastSeen = async () => {
      if (!userId) return
      try {
        await updateDoc(doc(db, 'profiles', userId), { last_seen: new Date().toISOString() })
      } catch (err: any) {
        console.error('Heartbeat error:', err.message)
      }
    }

    const heartbeat = setInterval(updateLastSeen, 60000)

    const handleVisibilityChange = () => {
      if (document.visibilityState === 'hidden') {
        void updateLastSeen()
      }
    }

    window.addEventListener('visibilitychange', handleVisibilityChange)
    window.addEventListener('beforeunload', () => {
      if (userId) {
        deleteDoc(doc(db, 'presence', userId))
        updateLastSeen()
      }
    })

    return () => {
      clearInterval(heartbeat)
      window.removeEventListener('visibilitychange', handleVisibilityChange)
      if (unsubscribePresence) unsubscribePresence()
      if (userId) deleteDoc(doc(db, 'presence', userId))
    }
  }, [userId, userName, groupId, addToast])

  return (
    <PresenceContext.Provider value={{ onlineUsers, typingUsers, setTypingStatus }}>
      {children}
    </PresenceContext.Provider>
  )
}
