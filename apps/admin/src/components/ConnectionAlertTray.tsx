'use client'

import { useState, useEffect, useRef, useCallback } from 'react'

import { useNotifications } from './NotificationProvider'
import { UserPlus, X, Check, RefreshCw } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import type { Profile } from '@/types/database'

type ConnectionRequest = {
  id: string
  user_id: string
  target_id: string
  status: string
  profiles: Profile | null
}


export default function ConnectionAlertTray() {
  const db = useRef(createClient()).current
  const [requests, setRequests] = useState<ConnectionRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const { addToast } = useNotifications()

  const fetchRequests = useCallback(async () => {
    const { data: { user } } = await db.auth.getUser()
    if (!user) return
    try {
      const { data, error } = await db
        .from('user_connections')
        .select(`
          *,
          profiles:user_id (*)
        `)
        .eq('target_id', user.id)
        .eq('status', 'pending')
      
      if (error) throw error
      setRequests(data as unknown as ConnectionRequest[])
    } catch (err) {
      console.error('Error fetching connection requests:', err instanceof Error ? err.message : err)
    } finally {
      setLoading(false)
    }
  }, [db])

  useEffect(() => {
    fetchRequests()
    
    const setupSubscription = async () => {
      const { data: { user } } = await db.auth.getUser()
      if (!user) return

      const channel = db.channel('connection_requests')
        .on('postgres_changes', { 
          event: '*', 
          schema: 'public', 
          table: 'user_connections',
          filter: `target_id=eq.${user.id}`
        }, () => {
          fetchRequests()
        })
        .subscribe()
      
      return () => {
        db.removeChannel(channel)
      }
    }

    setupSubscription()
  }, [db, fetchRequests])

  const handleAction = async (requestId: string, senderId: string, action: 'accept' | 'ignore') => {
    setProcessingId(requestId)
    try {
      const { data: { user } } = await db.auth.getUser()
      if (!user) return

      if (action === 'accept') {
        await db.from('user_connections').update({ status: 'connected' }).eq('id', requestId)
        await db.from('notifications').insert({
          user_id: senderId,
          type: 'connection_accepted',
          title: 'Connection Established',
          message: 'Your connection request was accepted.',
          link: `/dashboard/network/profile/${user.id}`,
          created_at: new Date().toISOString()
        })
        addToast('Connected!', 'You are now connected with a new specialist.', 'success')
      } else {
        await db.from('user_connections').delete().eq('id', requestId)
        addToast('Request Ignored', 'The connection request has been removed.', 'info')
      }

      // Mark related notifications as read
      await db.from('notifications')
        .update({ read: true })
        .eq('user_id', user.id)
        .eq('type', 'connection_request')
        .match({ 'metadata->sender_id': senderId })

      fetchRequests()
    } catch (err) {
      addToast('Sync Error', err instanceof Error ? err.message : String(err), 'error')
    } finally {
      setProcessingId(null)
    }
  }

  if (loading || requests.length === 0) {
    return null
  }

  return (
    <>
      <div className="connection-tray-container" style={{ margin: '0 0 var(--gap-md) 0', animation: 'slideInDown 0.4s cubic-bezier(0.23, 1, 0.32, 1)' }}>
        {requests.map((req) => (
          <div 
            key={req.id} 
            style={{ 
              background: 'rgba(var(--brand-rgb), 0.05)', 
              border: '1px solid var(--brand)', 
              borderRadius: '16px', 
              padding: '0.75rem 1.25rem',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              gap: '1rem',
              flexWrap: 'wrap',
              boxShadow: '0 4px 15px rgba(var(--brand-rgb), 0.1)',
              marginBottom: requests.length > 1 ? '0.5rem' : 0
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1 }}>
              <div style={{ padding: '8px', background: 'var(--brand)', color: 'white', borderRadius: '10px' }}>
                <UserPlus size={18} />
              </div>
              <div>
                <div style={{ fontSize: '0.9rem', fontWeight: 900, color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  Pending Connection Request
                  <span className="pulse-pill" style={{ width: '6px', height: '6px', borderRadius: '50%', background: 'var(--brand)' }} />
                </div>
                <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)' }}>
                  <strong>{req.profiles?.full_name || 'A student'}</strong> wants to connect for collaboration.
                </div>
              </div>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                disabled={processingId === req.id}
                style={{ 
                  padding: '0.5rem 1.25rem', 
                  borderRadius: '10px', 
                  background: 'var(--brand)', 
                  color: 'white',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(var(--brand-rgb), 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
                onClick={() => handleAction(req.id, req.user_id, 'accept')}
              >
                {processingId === req.id ? <RefreshCw size={14} className="spin" /> : <Check size={16} />}
                Accept Request
              </button>
              <button
                disabled={processingId === req.id}
                style={{ 
                  padding: '0.5rem 1.25rem', 
                  borderRadius: '10px', 
                  background: 'var(--danger)', 
                  color: 'white',
                  border: 'none',
                  fontSize: '0.75rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  boxShadow: '0 4px 10px rgba(var(--danger-rgb), 0.2)',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.4rem'
                }}
                onClick={() => handleAction(req.id, req.user_id, 'ignore')}
              >
                {processingId === req.id ? <RefreshCw size={14} className="spin" /> : <X size={16} />}
                Ignore
              </button>
            </div>
          </div>
        ))}
      </div>
      <style jsx>{`
        @keyframes slideInDown {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </>
  )
}
