'use client'

import React, { createContext, useContext, useState, useCallback } from 'react'

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

const RealtimeContext = createContext<RealtimeContextType>({ isConnected: true })

// ─── PROVIDER ────────────────────────────────────────────────────────────────

export const RealtimeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  return (
    <RealtimeContext.Provider value={{ isConnected: true }}>
      {children}
    </RealtimeContext.Provider>
  )
}

export const useRealtime = () => useContext(RealtimeContext)

// ─── MOCK HOOKS ──────────────────────────────────────────────────────────────

export function usePresence(roomId: string) {
  const [me, setMe] = useState<PresenceState | null>({
    userId: '00000000-0000-0000-0000-000000000000',
    name: 'Test User',
    lastSeen: Date.now(),
    status: 'online'
  })
  
  const updateMyState = useCallback((patch: Partial<PresenceState>) => {
    setMe(prev => prev ? { ...prev, ...patch } : null)
  }, [])

  return { others: [], me, updateMyState }
}

export function useSyncedObject<T>(path: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue)

  const updateObject = useCallback((newValue: Partial<T>) => {
    setValue(prev => ({ ...prev, ...newValue }))
  }, [])

  const atomicUpdate = useCallback((updater: (current: T) => T) => {
    setValue(prev => updater(prev))
  }, [])

  return [value, updateObject, atomicUpdate] as const
}

export function useSyncedList<T>(path: string) {
  const [list, setList] = useState<{ id: string; data: T }[]>([])

  const pushItem = useCallback((item: T) => {
    const id = Math.random().toString(36).substr(2, 9)
    setList(prev => [...prev, { id, data: item }])
    return Promise.resolve()
  }, [])

  const removeItem = useCallback((id: string) => {
    setList(prev => prev.filter(i => i.id !== id))
    return Promise.resolve()
  }, [])

  return { list, pushItem, removeItem }
}
