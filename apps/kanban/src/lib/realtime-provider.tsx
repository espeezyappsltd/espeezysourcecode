'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { 
  ref, 
  onValue, 
  set, 
  push, 
  onDisconnect, 
  serverTimestamp, 
  update,
  remove,
  runTransaction
} from 'firebase/database'
import { database, auth } from './firebase'
import { onAuthStateChanged } from 'firebase/auth'

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface PresenceState {
  userId: string
  name: string
  avatar?: string
  lastSeen: number | object
  cursor?: { x: number; y: number }
  status?: 'online' | 'idle' | 'typing'
  draggingTaskId?: string | null
}

interface RealtimeContextType {
  isConnected: boolean
}

const RealtimeContext = createContext<RealtimeContextType>({ isConnected: false })

// ─── PROVIDER ────────────────────────────────────────────────────────────────

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(false)

  useEffect(() => {
    const connectedRef = ref(database, '.info/connected')
    const unsubscribe = onValue(connectedRef, (snap) => {
      setIsConnected(snap.val() === true)
    })
    return () => unsubscribe()
  }, [])

  return (
    <RealtimeContext.Provider value={{ isConnected }}>
      {children}
    </RealtimeContext.Provider>
  )
}

export const useRealtime = () => useContext(RealtimeContext)

// ─── HOOKS ───────────────────────────────────────────────────────────────────

/**
 * usePresence
 * Tracks who is online in a specific room and their temporary state (cursors, typing).
 */
export function usePresence(roomId: string) {
  const [others, setOthers] = useState<Record<string, PresenceState>>({})
  const [me, setMe] = useState<PresenceState | null>(null)
  
  useEffect(() => {
    const user = auth.currentUser
    if (!user) return

    const roomPresenceRef = ref(database, `rooms/${roomId}/presence`)
    const myPresenceRef = ref(database, `rooms/${roomId}/presence/${user.uid}`)
    
    // Set up presence on connect
    const myState: PresenceState = {
      userId: user.uid,
      name: user.displayName || user.email || 'Anonymous',
      avatar: user.photoURL || undefined,
      lastSeen: serverTimestamp(),
      status: 'online'
    }
    
    set(myPresenceRef, myState)
    onDisconnect(myPresenceRef).remove()

    // Listen for others
    const unsubscribe = onValue(roomPresenceRef, (snap) => {
      const data = snap.val() || {}
      const filtered: Record<string, PresenceState> = {}
      Object.keys(data).forEach(uid => {
        if (uid !== user.uid) filtered[uid] = data[uid]
      })
      setOthers(filtered)
      if (data[user.uid]) setMe(data[user.uid])
    })

    return () => {
      unsubscribe()
      remove(myPresenceRef)
    }
  }, [roomId])

  const updateMyState = useCallback((patch: Partial<PresenceState>) => {
    const user = auth.currentUser
    if (!user) return
    const myPresenceRef = ref(database, `rooms/${roomId}/presence/${user.uid}`)
    update(myPresenceRef, { ...patch, lastSeen: serverTimestamp() })
  }, [roomId])

  return { others: Object.values(others), me, updateMyState }
}

/**
 * useSyncedObject
 * Syncs a single object (e.g., Kanban card properties) in real-time.
 */
export function useSyncedObject<T>(path: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue)
  const isInitialLoad = useRef(true)

  useEffect(() => {
    const objectRef = ref(database, path)
    const unsubscribe = onValue(objectRef, (snap) => {
      const data = snap.val()
      if (data !== null) {
        setValue(data)
      }
      isInitialLoad.current = false
    })
    return () => unsubscribe()
  }, [path])

  const updateObject = useCallback((newValue: Partial<T>) => {
    const objectRef = ref(database, path)
    update(objectRef, newValue as any)
  }, [path])

  const atomicUpdate = useCallback((updater: (current: T) => T) => {
    const objectRef = ref(database, path)
    runTransaction(objectRef, (current) => {
      return updater(current || initialValue)
    })
  }, [path, initialValue])

  return [value, updateObject, atomicUpdate] as const
}

/**
 * useSyncedList
 * Syncs a list of items (e.g., Chat messages, Kanban cards).
 */
export function useSyncedList<T>(path: string) {
  const [list, setList] = useState<{ id: string; data: T }[]>([])

  useEffect(() => {
    const listRef = ref(database, path)
    const unsubscribe = onValue(listRef, (snap) => {
      const data = snap.val() || {}
      const items = Object.keys(data).map(key => ({
        id: key,
        data: data[key] as T
      }))
      setList(items)
    })
    return () => unsubscribe()
  }, [path])

  const pushItem = useCallback((item: T) => {
    const listRef = ref(database, path)
    const newItemRef = push(listRef)
    return set(newItemRef, { ...item, createdAt: serverTimestamp() })
  }, [path])

  const removeItem = useCallback((id: string) => {
    const itemRef = ref(database, `${path}/${id}`)
    return remove(itemRef)
  }, [path])

  return { list, pushItem, removeItem }
}
