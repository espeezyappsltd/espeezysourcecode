'use client'

import React, { createContext, useContext, useEffect, useState, ReactNode, useCallback } from 'react'
import { auth, db } from '@/lib/firebase'
import { onAuthStateChanged, User } from 'firebase/auth'
import { doc, getDoc, onSnapshot } from 'firebase/firestore'
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
  const [profile, setProfile] = useState<Profile | null>(() => {
    if (initialProfile) return initialProfile
    return initialUserId ? PersistentCache.get<Profile>(`profile_${initialUserId}`) : null
  })
  const [loading, setLoading] = useState(true)
  const [user, setUser] = useState<User | null>(null)

  const refreshProfile = useCallback(async () => {
    const currentUserId = user?.uid || initialUserId
    if (!currentUserId) return

    const docRef = doc(db, 'profiles', currentUserId)
    const docSnap = await getDoc(docRef)
    
    if (docSnap.exists()) {
      const data = docSnap.data() as Profile
      setProfile(data)
      PersistentCache.set(`profile_${currentUserId}`, data, 3600000) // 1 Hour TTL
    }
  }, [user, initialUserId])

  useEffect(() => {
    const unsubscribeAuth = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser)
      if (!firebaseUser) {
        setProfile(null)
        setLoading(false)
      }
    })

    return () => unsubscribeAuth()
  }, [])

  useEffect(() => {
    const currentUserId = user?.uid || initialUserId
    if (!currentUserId) {
      setLoading(false)
      return
    }

    setLoading(true)
    
    // Subscribe to REALTIME changes for the current user profile in Firestore
    const docRef = doc(db, 'profiles', currentUserId)
    const unsubscribeSnapshot = onSnapshot(docRef, (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data() as Profile
        setProfile(data)
        PersistentCache.set(`profile_${currentUserId}`, data, 3600000)
      } else {
        setProfile(null)
      }
      setLoading(false)
    }, (error) => {
      console.error("Profile snapshot error:", error)
      setLoading(false)
    })

    return () => unsubscribeSnapshot()
  }, [user, initialUserId])

  return (
    <ProfileContext.Provider value={{ profile, loading, refreshProfile, setProfile }}>
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
