'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useRef } from 'react'
import { db } from './db-client'
import { RealtimeChannel } from '@supabase/supabase-js'

// ─── TYPES ───────────────────────────────────────────────────────────────────

interface PresenceState {
  userId: string
  name: string
  avatar?: string
  lastSeen: string
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
    // Supabase is technically always connected if the client is initialized,
    // but we can track the socket status if needed.
    setIsConnected(true)
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
 * Tracks who is online in a specific room using Supabase Presence.
 */
export function usePresence(roomId: string) {
  const [others, setOthers] = useState<Record<string, PresenceState>>({})
  const [me, setMe] = useState<PresenceState | null>(null)
  const channelRef = useRef<RealtimeChannel | null>(null)
  
  useEffect(() => {
    const fetchUserAndSubscribe = async () => {
      const { data: { user } } = await db.auth.getUser()
      if (!user) return

      const channel = db.channel(`room:${roomId}`, {
        config: {
          presence: {
            key: user.id,
          },
        },
      })

      channel
        .on('presence', { event: 'sync' }, () => {
          const state = channel.presenceState<PresenceState>()
          const filtered: Record<string, PresenceState> = {}
          Object.keys(state).forEach(key => {
            if (key !== user.id) filtered[key] = state[key][0]
          })
          setOthers(filtered)
          if (state[user.id]) setMe(state[user.id][0])
        })
        .subscribe(async (status) => {
          if (status === 'SUBSCRIBED') {
            await channel.track({
              userId: user.id,
              name: user.user_metadata?.full_name || user.email || 'Anonymous',
              avatar: user.user_metadata?.avatar_url,
              lastSeen: new Date().toISOString(),
              status: 'online'
            })
          }
        })

      channelRef.current = channel
    }

    fetchUserAndSubscribe()

    return () => {
      if (channelRef.current) {
        channelRef.current.unsubscribe()
      }
    }
  }, [roomId])

  const updateMyState = useCallback(async (patch: Partial<PresenceState>) => {
    if (channelRef.current) {
      const { data: { user } } = await db.auth.getUser()
      if (!user) return
      
      await channelRef.current.track({
        ...me,
        ...patch,
        lastSeen: new Date().toISOString()
      })
    }
  }, [me])

  return { others: Object.values(others), me, updateMyState }
}

/**
 * useSyncedObject
 * Syncs a single object using Supabase Broadcast or Table changes.
 * Note: Realtime Database 'path' logic maps to Table + ID in Supabase.
 */
export function useSyncedObject<T>(table: string, id: string, initialValue: T) {
  const [value, setValue] = useState<T>(initialValue)

  useEffect(() => {
    // Initial fetch
    db.from(table).select('*').eq('id', id).single().then(({ data }) => {
      if (data) setValue(data)
    })

    const channel = db.channel(`sync:${table}:${id}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table, 
        filter: `id=eq.${id}` 
      }, (payload) => {
        if (payload.new) setValue(payload.new as T)
      })
      .subscribe()

    return () => {
      db.removeChannel(channel)
    }
  }, [table, id])

  const updateObject = useCallback(async (newValue: Partial<T>) => {
    await db.from(table).update(newValue as Record<string, unknown>).eq('id', id)
  }, [table, id])

  return [value, updateObject] as const
}

/**
 * useSyncedList
 * Syncs a list of items from a Supabase table.
 */
export function useSyncedList<T extends Record<string, unknown>>(
  table: string,
  filterField?: string,
  filterValue?: string | number | boolean,
) {
  const [list, setList] = useState<{ id: string; data: T }[]>([])

  const fetchList = useCallback(async () => {
    let query = db.from(table).select('*')
    if (filterField && filterValue !== undefined) {
      query = query.eq(filterField, filterValue)
    }
    const { data } = await query.order('created_at', { ascending: true })
    if (data) {
      setList(
        (data as T[]).map((item, index) => ({
          id: typeof item.id === 'string' ? item.id : `${table}-${index}`,
          data: item,
        })),
      )
    }
  }, [table, filterField, filterValue])

  useEffect(() => {
    fetchList()

    const channel = db.channel(`list:${table}`)
      .on('postgres_changes', { 
        event: '*', 
        schema: 'public', 
        table,
        ...(filterField && filterValue ? { filter: `${filterField}=eq.${filterValue}` } : {})
      }, () => {
        fetchList()
      })
      .subscribe()

    return () => {
      db.removeChannel(channel)
    }
  }, [table, filterField, filterValue, fetchList])

  const pushItem = useCallback(async (item: Omit<T, 'id'> & Partial<Pick<T, 'id'>>) => {
    const { data, error } = await db.from(table).insert(item as Record<string, unknown>).select().single()
    if (error) throw error
    return data
  }, [table])

  const removeItem = useCallback(async (id: string) => {
    const { error } = await db.from(table).delete().eq('id', id)
    if (error) throw error
  }, [table])

  return { list, pushItem, removeItem }
}
