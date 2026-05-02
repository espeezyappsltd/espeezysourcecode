'use client'

import { useState, useEffect } from 'react'
import { db, createBrowserSupabaseClient } from '@/lib/db-client'
import { Users } from 'lucide-react'

export default function UserCount() {
  const [count, setCount] = useState<number | null>(null)
  const [isLive, setIsLive] = useState(false)
  const db = createBrowserSupabaseClient()

  const fetchCount = async () => {
    const { count: total, error } = await db
      .from('profiles')
      .select('*', { count: 'exact', head: true })
    
    if (!error && total !== null) {
      setCount(total)
      setIsLive(true)
      // Small pulse effect when count updates
      setTimeout(() => setIsLive(false), 2000)
    }
  }

  useEffect(() => {
    let mounted = true

    const initializeCount = async () => {
      if (mounted) {
        await fetchCount()
      }
    }

    initializeCount()

    // Realtime subscription to profiles table
    const channel = db
      .channel('public:profiles_count')
      .on(
        'postgres_changes',
        { event: 'INSERT', schema: 'public', table: 'profiles' },
        () => {
          if (mounted) {
            fetchCount()
          }
        }
      )
      .on(
        'postgres_changes',
        { event: 'DELETE', schema: 'public', table: 'profiles' },
        () => {
          if (mounted) {
            fetchCount()
          }
        }
      )
      .subscribe()

    return () => {
      mounted = false
      db.removeChannel(channel)
    }
  }, [])

  if (count === null) return <span style={{ opacity: 0.5 }}>...</span>

  return (
    <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', transition: 'all 0.3s ease', transform: isLive ? 'scale(1.1)' : 'scale(1)' }}>
      <Users size={16} style={{ color: isLive ? '#10b981' : 'inherit' }} />
      <span style={{ fontWeight: 700 }}>
        {(count + 1200).toLocaleString()}
      </span>
      {isLive && (
        <span style={{ 
          width: '6px', 
          height: '6px', 
          background: '#10b981', 
          borderRadius: '50%', 
          boxShadow: '0 0 8px #10b981',
          animation: 'pulse 1s infinite'
        }} />
      )}
      <style jsx>{`
        @keyframes pulse {
          0% { transform: scale(1); opacity: 1; }
          50% { transform: scale(1.5); opacity: 0.5; }
          100% { transform: scale(1); opacity: 1; }
        }
      `}</style>
    </div>
  )
}
