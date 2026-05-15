'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient as createBrowserSupabaseClient } from '@/lib/supabase/client'
import { PersistentCache } from '@/utils/cache'
import { Profile } from '@/types/auth'

type ProfileContextType = {
  profile: Profile | null
  loading: boolean
  refreshProfile: () => Promise<void>
  setProfile: React.Dispatch<React.SetStateAction<Profile | null>>
}

export const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

export function ProfileProvider({ 
  children, 
  userId: initialUserId,
  initialProfile 
}: { 
  children: ReactNode
  userId?: string
  initialProfile?: Profile | null
}) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), [])
  const [profile, setProfile] = useState<Profile | null>(() => {
    if (initialProfile) return initialProfile
    return initialUserId ? PersistentCache.get<Profile>(`profile_${initialUserId}`) : null
  })
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)

  const refreshProfile = useCallback(async () => {
    const currentUserId = user?.id || initialUserId
    if (!currentUserId) return

    if (currentUserId === '00000000-0000-0000-0000-000000000000') {
      return // Skip DB fetch for mock user
    }

    const { data, error } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', currentUserId)
      .maybeSingle()

    if (error) {
      console.error('Profile refresh error:', error.message)
      return
    }

    if (data) {
      const typed = data as Profile
      setProfile(typed)
      PersistentCache.set(`profile_${currentUserId}`, typed, 3600000) // 1 Hour TTL
    } else {
      setProfile(null)
    }
  }, [initialUserId, supabase, user])

  // Enhanced setProfile that persists to cache
  const setProfileWithCache = useCallback((value: React.SetStateAction<Profile | null>) => {
    setProfile((prev) => {
      const next = typeof value === 'function' ? value(prev) : value
      const currentUserId = user?.id || initialUserId
      if (currentUserId && next) {
        PersistentCache.set(`profile_${currentUserId}`, next, 3600000)
      }
      return next
    })
  }, [initialUserId, user])

  useEffect(() => {
    let mounted = true

    supabase.auth.getUser().then(({ data, error }) => {
      if (!mounted) return
      if (error) {
        console.error('Auth getUser error:', error.message)
      }
      setUser(data.user ?? null)
      if (!data.user) {
        setProfile(null)
        setLoading(false)
      }
    })

    const { data: authSubscription } = supabase.auth.onAuthStateChange((_event, session) => {
      const sessionUser = session?.user ?? null
      setUser(sessionUser)
      if (!sessionUser) {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => {
      mounted = false
      authSubscription.subscription.unsubscribe()
    }
  }, [supabase])

  useEffect(() => {
    const currentUserId = user?.id || initialUserId
    if (!currentUserId) {
      setLoading(false)
      return
    }

    setLoading(true)

    let active = true

    const loadProfile = async () => {
      if (currentUserId === '00000000-0000-0000-0000-000000000000') {
        setLoading(false)
        return
      }

      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .eq('id', currentUserId)
        .maybeSingle()

      if (!active) return

      if (error) {
        console.error('Profile load error:', error.message)
        setLoading(false)
        return
      }

      if (data) {
        const typed = data as Profile
        setProfile(typed)
        PersistentCache.set(`profile_${currentUserId}`, typed, 3600000)
      } else {
        setProfile(null)
      }
      setLoading(false)
    }

    loadProfile()

    const channel = supabase
      .channel(`profile:${currentUserId}`)
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${currentUserId}`,
        },
        (payload) => {
          const next = (payload.new ?? null) as Profile | null
          setProfile(next)
          if (next) {
            PersistentCache.set(`profile_${currentUserId}`, next, 3600000)
          }
        }
      )
      .subscribe((status) => {
        if (status === 'CHANNEL_ERROR') {
          console.error('Profile realtime channel error')
        }
      })

    return () => {
      active = false
      supabase.removeChannel(channel)
    }
  }, [initialUserId, supabase, user])

  return (
    <ProfileContext.Provider value={{ profile, loading, refreshProfile, setProfile: setProfileWithCache }}>
      {children}
    </ProfileContext.Provider>
  )
}

export function useProfile() {
  const context = useContext(ProfileContext)
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider')
  }
  return context
}
