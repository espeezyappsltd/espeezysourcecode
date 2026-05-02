'use client'

import { useState, useEffect } from 'react'
import { db, auth } from '@/lib/firebase'
import { 
  doc, 
  getDoc, 
  updateDoc, 
  setDoc, 
  deleteDoc, 
  addDoc, 
  collection 
} from 'firebase/firestore'
import { useNotifications } from '@/components/NotificationProvider'
import type { Notification } from '@/types/ui'
import { Bell, UserPlus, Check, X, Shield, Clock, Inbox, Mail, MessageSquare } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

type InboxNotification = Notification & { metadata?: { sender_id?: string } }

export default function NotificationsPage() {
  const { notifications, markAsRead, markAllAsRead, addToast, refreshNotifications } = useNotifications()
  const [loading, setLoading] = useState(false)
  const [view, setView] = useState<'inbox' | 'settings'>('inbox')

  // Settings state
  const [settings, setSettings] = useState({
    email_notifications: true,
    push_notifications: true,
    marketing_emails: false
  })

  useEffect(() => {
    async function fetchSettings() {
      const user = auth.currentUser
      if (!user) return
      const snap = await getDoc(doc(db, 'profiles', user.uid))
      if (snap.exists()) {
        const data = snap.data()
        setSettings({
          email_notifications: data.email_notifications ?? true,
          push_notifications: data.push_notifications ?? true,
          marketing_emails: data.marketing_emails ?? false
        })
      }
    }
    fetchSettings()
  }, [])

  const updateSetting = async (key: keyof typeof settings, value: boolean) => {
    const newSettings = { ...settings, [key]: value }
    setSettings(newSettings)
    const user = auth.currentUser
    if (!user) return
    try {
      await updateDoc(doc(db, 'profiles', user.uid), { [key]: value })
      addToast('Success', 'Preferences updated', 'success')
    } catch (err: any) {
      console.error('Update settings error:', err.message)
    }
  }

  const handleAcceptConnection = async (notification: InboxNotification) => {
    setLoading(true)
    const { sender_id } = notification.metadata || {}
    if (!sender_id) return

    const user = auth.currentUser
    if (!user) return

    try {
      // 1. Update Connection to 'connected'
      const connId = [user.uid, sender_id].sort().join('_')
      await setDoc(doc(db, 'user_connections', connId), {
        user_id: user.uid,
        target_id: sender_id,
        status: 'connected',
        created_at: new Date().toISOString()
      })

      // 2. Mark notification as read
      await markAsRead(notification.id)
      
      // 3. Send reciprocal notification to sender
      await addDoc(collection(db, 'notifications'), {
        user_id: sender_id,
        type: 'connection_accepted',
        title: 'Connection Accepted',
        message: 'Your connection request was accepted. You can now chat real-time.',
        metadata: { acceptor_id: user.uid },
        created_at: new Date().toISOString()
      })

      addToast('Success', 'Connection established!', 'success')
    } catch (err: any) {
      addToast('Error', 'Failed to accept connection', 'error')
    }
    setLoading(false)
  }

  const handleDeclineConnection = async (notification: InboxNotification) => {
    const senderId = notification.metadata?.sender_id
    if (senderId) {
      const user = auth.currentUser
      if (user) {
        const connId = [user.uid, senderId].sort().join('_')
        await deleteDoc(doc(db, 'user_connections', connId))
      }
    }
    await markAsRead(notification.id)
    addToast('Success', 'Request ignored', 'info')
  }

  return (
    <div className="page-fade" style={{ maxWidth: '800px', margin: '0 auto', padding: '0 var(--p-safe) 4rem' }}>
      
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <div style={{ padding: '8px', background: 'var(--brand)', borderRadius: '10px', boxShadow: '0 4px 8px rgba(var(--brand-rgb), 0.15)' }}>
            <Bell size={20} color="white" />
          </div>
          <h1 className="fluid-h1" style={{ margin: 0, fontWeight: 900, fontSize: '1.5rem' }}>Inbox</h1>
        </div>
      </div>

      {/* Tab Switcher */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1rem', borderBottom: '1px solid var(--border)', paddingBottom: '0.5rem' }}>
         <button 
           onClick={() => setView('inbox')}
           style={{ background: 'none', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem', color: view === 'inbox' ? 'var(--brand)' : 'var(--text-sub)', borderBottom: view === 'inbox' ? '2px solid var(--brand)' : 'none' }}
         >
           Inbox ({notifications.filter((n: Notification) => !n.read).length})
         </button>
         <button 
           onClick={() => setView('settings')}
           style={{ background: 'none', border: 'none', padding: '0.4rem 0.8rem', borderRadius: '6px', cursor: 'pointer', fontWeight: 800, fontSize: '0.85rem', color: view === 'settings' ? 'var(--brand)' : 'var(--text-sub)', borderBottom: view === 'settings' ? '2px solid var(--brand)' : 'none' }}
         >
           Settings
         </button>
      </div>

      {view === 'inbox' ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
          {notifications.length === 0 ? (
            <div style={{ 
              textAlign: 'center', padding: '5rem 2rem', background: 'var(--surface)', 
              borderRadius: '24px', border: '1px solid var(--border)', opacity: 0.8 
            }}>
              <Bell size={48} color="var(--text-sub)" style={{ opacity: 0.2, marginBottom: '1.5rem' }} />
              <h3 style={{ margin: 0, color: 'var(--text-main)', fontSize: '1.25rem' }}>Your inbox is clean</h3>
              <p style={{ color: 'var(--text-sub)', marginTop: '0.5rem' }}>New connection requests and project updates will appear here.</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '0.5rem' }}>
                 <button onClick={markAllAsRead} style={{ background: 'none', border: 'none', fontSize: '0.75rem', color: 'var(--brand)', cursor: 'pointer', fontWeight: 700 }}>Mark all as read</button>
              </div>
              {notifications.map((n: InboxNotification) => (
                <div 
                  key={n.id}
                  onClick={() => !n.read && markAsRead(n.id)}
                  style={{ 
                    padding: '0.6rem 0.75rem', borderRadius: '8px', border: '1px solid var(--border)', 
                    background: n.read ? 'var(--surface)' : 'rgba(var(--brand-rgb), 0.04)',
                    transition: 'all 0.2s ease',
                    position: 'relative',
                    display: 'flex',
                    gap: '0.75rem',
                    alignItems: 'center',
                    cursor: n.read ? 'default' : 'pointer'
                  }}
                >
                  {!n.read && <div style={{ position: 'absolute', top: '0.5rem', right: '0.5rem', width: '6px', height: '6px', borderRadius: '50%', background: 'var(--brand)' }} />}
                  
                  <div style={{ 
                    width: '32px', height: '32px', borderRadius: '8px', flexShrink: 0,
                    background: n.type === 'connection_request' ? 'rgba(var(--brand-rgb), 0.1)' : 'var(--bg-sub)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', color: n.type === 'connection_request' ? 'var(--brand)' : 'var(--text-sub)'
                  }}>
                    {n.type === 'connection_request' ? <UserPlus size={16} /> : n.type === 'message' ? <MessageSquare size={16} /> : <Mail size={16} />}
                  </div>

                  <div style={{ flex: 1, minWidth: 0 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                      <h4 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.title}</h4>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span style={{ fontSize: '0.65rem', color: 'var(--text-sub)', fontWeight: 600 }}>{formatDistanceToNow(new Date(n.created_at))} ago</span>
                        {n.type === 'connection_request' && !n.read && (
                          <div style={{ display: 'flex', gap: '0.35rem' }}>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleAcceptConnection(n); }}
                              disabled={loading}
                              style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', background: 'var(--brand)', color: 'white', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: '0.7rem' }}
                            >
                              {loading ? '...' : 'Accept'}
                            </button>
                            <button 
                              onClick={(e) => { e.stopPropagation(); handleDeclineConnection(n); }}
                              style={{ padding: '0.25rem 0.5rem', borderRadius: '4px', background: 'var(--bg-sub)', color: 'var(--text-sub)', border: 'none', fontWeight: 800, cursor: 'pointer', fontSize: '0.7rem' }}
                            >
                              Ignore
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-sub)', lineHeight: 1.3, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{n.message}</p>
                  </div>
                </div>
              ))}
            </>
          )}
        </div>
      ) : (
        <div style={{ background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '1rem' }}>
           <h3 style={{ margin: 0, fontSize: '1rem', fontWeight: 900 }}>Alert Preferences</h3>
           
           {[
             { key: 'email_notifications', label: 'Email Alerts', desc: 'Receive project updates and connection requests via email.' },
             { key: 'push_notifications', label: 'Push Notifications', desc: 'Real-time browser notifications for chat and system signals.' },
             { key: 'marketing_emails', label: 'Academic Insights', desc: 'Periodic summaries of your project progress and network growth.' }
           ].map((item) => (
              <div key={item.key} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '1rem' }}>
                 <div style={{ flex: 1 }}>
                    <div style={{ fontWeight: 800, fontSize: '0.9rem', marginBottom: '0.15rem' }}>{item.label}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--text-sub)', lineHeight: 1.3 }}>{item.desc}</div>
                 </div>
                <button 
                  onClick={() => updateSetting(item.key as keyof typeof settings, !settings[item.key as keyof typeof settings])}
                  style={{ 
                    width: '50px', height: '26px', borderRadius: '13px', border: 'none', position: 'relative', cursor: 'pointer',
                    background: settings[item.key as keyof typeof settings] ? 'var(--brand)' : 'var(--bg-sub)',
                    transition: 'background 0.3s ease'
                  }}
                >
                   <div style={{ 
                     position: 'absolute', top: '3px', left: settings[item.key as keyof typeof settings] ? '27px' : '3px',
                     width: '20px', height: '20px', borderRadius: '50%', background: 'white', boxShadow: '0 2px 4px rgba(0,0,0,0.2)', transition: 'left 0.3s ease' 
                   }} />
                </button>
             </div>
           ))}
        </div>
      )}
    </div>
  )
}
