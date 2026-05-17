'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback, useMemo, useRef } from 'react'
import type { User } from '@supabase/supabase-js'
import { createClient as createBrowserSupabaseClient } from '@/lib/supabase/client'
import { PersistentCache } from '@/utils/cache'
import { Profile } from '@/types/auth'
import { Q } from '@/lib/query-columns'

type ProfileContextType = {
  profile: Profile | null
  loading: boolean
  refreshProfile: () => Promise<void>
  setProfile: React.Dispatch<React.SetStateAction<Profile | null>>
}

export const ProfileContext = createContext<ProfileContextType | undefined>(undefined)

const BACKGROUND_REFRESH_MS = 2500

export function ProfileProvider({
  children,
  userId: initialUserId,
  initialProfile,
}: {
  children: ReactNode
  userId?: string
  initialProfile?: Profile | null
}) {
  const supabase = useMemo(() => createBrowserSupabaseClient(), [])
  const seededFromServer = Boolean(initialProfile?.id && initialProfile.id === initialUserId)

  const [profile, setProfile] = useState<Profile | null>(() => {
    if (initialProfile) return initialProfile
    return initialUserId ? PersistentCache.get<Profile>(`profile_${initialUserId}`) : null
  })
  const [loading, setLoading] = useState(() => {
    if (!initialUserId) return false
    if (seededFromServer) return false
    return !PersistentCache.get<Profile>(`profile_${initialUserId}`)
  })
  const [user, setUser] = useState<User | null>(null)
  const realtimeStarted = useRef(false)

  const refreshProfile = useCallback(async () => {
    const currentUserId = user?.id || initialUserId
    if (!currentUserId) return

    const { data, error } = await supabase
      .from('profiles')
      .select(Q.profile.layout)
      .eq('id', currentUserId)
      .maybeSingle()

    if (error) {
      console.error('Profile refresh error:', error.message)
      return
    }

    if (data) {
      const typed = data as Profile
      setProfile(typed)
      PersistentCache.set(`profile_${currentUserId}`, typed, 3600000)
    } else {
      setProfile(null)
    }
  }, [initialUserId, supabase, user])

  const setProfileWithCache = useCallback(
    (value: React.SetStateAction<Profile | null>) => {
      setProfile((prev) => {
        const next = typeof value === 'function' ? value(prev) : value
        const currentUserId = user?.id || initialUserId
        if (currentUserId && next) {
          PersistentCache.set(`profile_${currentUserId}`, next, 3600000)
        }
        return next
      })
    },
    [initialUserId, user],
  )

  useEffect(() => {
    if (initialUserId) return

    let mounted = true
    supabase.auth.getUser().then(({ data, error }) => {
      if (!mounted) return
      if (error && error.message !== 'Auth session missing!') {
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
  }, [initialUserId, supabase])

  useEffect(() => {
    const currentUserId = user?.id || initialUserId
    if (!currentUserId) {
      setLoading(false)
      return
    }

    const cached = PersistentCache.get<Profile>(`profile_${currentUserId}`)
    const hasSeed =
      seededFromServer ||
      initialProfile?.id === currentUserId ||
      profile?.id === currentUserId ||
      cached?.id === currentUserId

    if (!hasSeed) {
      setLoading(true)
    }

    let active = true
    let refreshTimer: ReturnType<typeof setTimeout> | undefined
    let realtimeTimer: ReturnType<typeof setTimeout> | undefined

    const finishLoad = (data: Profile | null) => {
      if (!active) return
      setProfile(data)
      if (data) {
        PersistentCache.set(`profile_${currentUserId}`, data, 3600000)
      }
      setLoading(false)
    }

    const loadProfile = async () => {
      const { data, error } = await supabase
        .from('profiles')
        .select(Q.profile.layout)
        .eq('id', currentUserId)
        .maybeSingle()

      if (error) {
        console.error('Profile load error:', error.message)
        if (active) setLoading(false)
        return
      }

      finishLoad((data as Profile | null) ?? null)
    }

    if (hasSeed) {
      refreshTimer = setTimeout(() => {
        void loadProfile()
      }, BACKGROUND_REFRESH_MS)
    } else {
      void loadProfile()
    }

    realtimeTimer = setTimeout(() => {
      if (!active || realtimeStarted.current) return
      realtimeStarted.current = true

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
          },
        )
        .subscribe((status) => {
          if (status === 'CHANNEL_ERROR') {
            console.error('Profile realtime channel error')
          }
        })

      return () => {
        supabase.removeChannel(channel)
      }
    }, hasSeed ? BACKGROUND_REFRESH_MS : 0)

    return () => {
      active = false
      if (refreshTimer) clearTimeout(refreshTimer)
      if (realtimeTimer) clearTimeout(realtimeTimer)
    }
  }, [initialProfile, initialUserId, profile?.id, seededFromServer, supabase, user])

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
