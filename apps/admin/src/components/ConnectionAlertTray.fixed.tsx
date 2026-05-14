'use client'

import { useState, useEffect } from 'react'
import Link from 'next/link'
import { useNotifications } from './NotificationProvider'
import { UserPlus, X, Check, RefreshCw } from 'lucide-react'
import { db, auth } from '@/lib/firebase'
import { collection, query, where, getDocs, updateDoc, deleteDoc, doc, onSnapshot, addDoc, writeBatch } from 'firebase/firestore'
import type { Profile } from '@/types/database'

type ConnectionRequest = {
  id: string
  user_id: string
  target_id: string
  status: string
  profiles: Profile | null
}

export default function ConnectionAlertTray() {
  const [requests, setRequests] = useState<ConnectionRequest[]>([])
  const [loading, setLoading] = useState(true)
  const [processingId, setProcessingId] = useState<string | null>(null)
  const { addToast } = useNotifications()

  const fetchRequests = async () => {
    const user = auth.currentUser
    if (!user) return
    try {
      const q = query(
        collection(db, 'user_connections'),
        where('target_id', '==', user.uid),
        where('status', '==', 'pending')
      )
      const snap = await getDocs(q)
      const data = await Promise.all(snap.docs.map(async d => {
        const conn = d.data()
        const pSnap = await getDocs(query(collection(db, 'profiles'), where('id', '==', conn.user_id)))
        return {
          id: d.id,
          ...conn,
          profiles: pSnap.empty ? null : pSnap.docs[0].data() as Profile
        }
      }))
      setRequests(data as ConnectionRequest[])
    } catch (err) {
      console.error('Error fetching connection requests:', err instanceof Error ? err.message : err)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    queueMicrotask(() => {
      void fetchRequests()
    })
    const user = auth.currentUser
    if (!user) return
    const q = query(
      collection(db, 'user_connections'),
      where('target_id', '==', user.uid)
    )
    const unsubscribe = onSnapshot(q, () => {
      fetchRequests()
    })
    return () => unsubscribe()
  }, [])

  const handleAction = async (requestId: string, senderId: string, action: 'accept' | 'ignore') => {
    setProcessingId(requestId)
    try {
      const user = auth.currentUser
      if (!user) return
      if (action === 'accept') {
        await updateDoc(doc(db, 'user_connections', requestId), { status: 'connected' })
        await addDoc(collection(db, 'notifications'), {
          user_id: senderId,
          type: 'connection_accepted',
          title: 'Connection Established',
          message: 'Your connection request was accepted.',
          link: `/dashboard/network/profile/${user.uid}`,
          created_at: new Date().toISOString()
        })
        addToast('Connected!', 'You are now connected with a new specialist.', 'success')
      } else {
        await deleteDoc(doc(db, 'user_connections', requestId))
        addToast('Request Ignored', 'The connection request has been removed.', 'info')
      }
      const qNotif = query(
        collection(db, 'notifications'),
        where('user_id', '==', user.uid),
        where('type', '==', 'connection_request')
      )
      const notifSnap = await getDocs(qNotif)
      if (!notifSnap.empty) {
        const batch = writeBatch(db)
        notifSnap.docs.forEach(d => {
          const data = d.data()
          if (data.metadata?.sender_id === senderId) {
            batch.update(d.ref, { read: true })
          }
        })
        await batch.commit()
      }
      await fetchRequests()
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
      <style jsx>{`
        @keyframes slideInDown {
          from { transform: translateY(-20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        .spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
