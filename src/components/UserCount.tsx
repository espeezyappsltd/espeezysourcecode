'use client'

import React, { useState, useEffect } from 'react'
import { Users } from 'lucide-react'

export default function UserCount() {
  const [count, setCount] = useState<number | null>(null)
  const [isLive, setIsLive] = useState(false)

  const fetchCount = async () => {
    try {
      const res = await fetch('/api/preregister')
      const data = await res.json()
      if (data.count !== undefined) {
        setCount(data.count)
        setIsLive(true)
        setTimeout(() => setIsLive(false), 2000)
      }
    } catch (err) {
      console.error('Failed to fetch user count:', err)
    }
  }

  useEffect(() => {
    fetchCount()
    // Poll for updates every 30 seconds since we don't have real-time listeners for this simple count
    const interval = setInterval(fetchCount, 30000)
    return () => clearInterval(interval)
  }, [])

  if (count === null) return <span style={{ opacity: 0.5 }}>...</span>

  return (
    <div style={{ 
      display: 'inline-flex', 
      alignItems: 'center', 
      gap: '0.4rem', 
      transition: 'all 0.3s ease', 
      transform: isLive ? 'scale(1.1)' : 'scale(1)' 
    }}>
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
