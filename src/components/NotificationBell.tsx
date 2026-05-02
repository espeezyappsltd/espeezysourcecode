'use client'

import { useState, useRef, useEffect, type CSSProperties } from 'react'
import { Bell, Check, Clock, ExternalLink, Inbox } from 'lucide-react'
import { useNotifications } from './NotificationProvider'
import { db, auth } from '@/lib/firebase'
import { 
  doc, 
  updateDoc, 
  deleteDoc, 
  addDoc, 
  collection, 
  setDoc 
} from 'firebase/firestore'
import { Notification } from '@/types/ui'

export default function NotificationBell() {
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const [dropdownStyle, setDropdownStyle] = useState<CSSProperties>({})
  const menuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(event.target as Node)) {
        setIsOpen(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  useEffect(() => {
    if (!isOpen || !menuRef.current) return

    const updatePosition = () => {
      const rect = menuRef.current?.getBoundingClientRect()
      if (!rect) return

      const isMobile = window.innerWidth <= 768
      const width = isMobile ? Math.min(380, window.innerWidth - 32) : 320
      
      let left: string | number = rect.right - width
      let top: string | number = rect.bottom + 10

      if (isMobile) {
        // Force fixed centering on mobile
        left = 16
        top = 70 // Below mobile header
        setDropdownStyle({
          position: 'fixed',
          top: `${top}px`,
          left: `${left}px`,
          width: `calc(100vw - 32px)`,
          maxHeight: '70vh',
          overflow: 'hidden',
          zIndex: 9000,
        })
      } else {
        // Clamp to screen edges for desktop
        left = Math.min(Math.max(12, rect.right - width), window.innerWidth - width - 12)
        const maxHeight = Math.min(450, window.innerHeight - top - 20)
        setDropdownStyle({
          position: 'fixed',
          top: `${top}px`,
          left: `${left}px`,
          width: `${width}px`,
          maxHeight: `${maxHeight}px`,
          overflow: 'hidden',
          zIndex: 9000,
        })
      }
    }

    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isOpen])

  return (
    <div style={{ position: 'relative' }} ref={menuRef}>
      <button 
        onClick={() => setIsOpen(!isOpen)}
        className="nav-bubble"
        style={{ 
          background: 'none', 
          border: 'none', 
          cursor: 'pointer', 
          position: 'relative',
          padding: '0.5rem',
          color: unreadCount > 0 ? 'var(--brand)' : 'var(--text-sub)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          transition: 'transform 0.2s'
        }}
      >
        <Bell size={20} />
        {unreadCount > 0 && (
          <div style={{ 
            position: 'absolute', 
            top: '0', 
            right: '0', 
            background: 'var(--error)', 
            color: 'white', 
            fontSize: '10px', 
            fontWeight: 800, 
            width: '18px', 
            height: '18px', 
            borderRadius: '50%', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center',
            border: '2px solid var(--surface)',
            boxShadow: '0 0 10px rgba(var(--error-rgb), 0.3)'
          }}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </div>
        )}
      </button>

      {isOpen && (
        <div style={{
          ...dropdownStyle,
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          borderRadius: '16px',
          boxShadow: 'var(--shadow-lg)',
          animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          overflow: 'hidden'
        }}>
          <div style={{ padding: '1rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
             <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800 }}>Project Alerts</h3>
             <button 
               onClick={markAllAsRead} 
               style={{ background: 'none', border: 'none', fontSize: '0.75rem', color: 'var(--brand)', cursor: 'pointer', fontWeight: 600 }}
             >
                Clear All
             </button>
          </div>

          <div style={{ maxHeight: '400px', overflowY: 'auto' }}>
            {notifications.length === 0 ? (
              <div style={{ padding: '3rem 1rem', textAlign: 'center', color: 'var(--text-sub)' }}>
                 <Inbox size={32} style={{ marginBottom: '1rem', opacity: 0.3 }} />
                 <p style={{ fontSize: '0.875rem' }}>No new signals detected.</p>
              </div>
            ) : (
              notifications.map((notif: Notification) => (
                <div 
                  key={notif.id} 
                  onClick={() => markAsRead(notif.id)}
                  style={{ 
                    padding: '1rem', 
                    borderBottom: '1px solid var(--bg-main)', 
                    cursor: 'pointer',
                    background: notif.read ? 'transparent' : 'rgba(var(--brand-rgb), 0.03)',
                    transition: 'background 0.2s'
                  }}
                  className="notif-item"
                >
                   <div style={{ display: 'flex', gap: '0.75rem' }}>
                      <div style={{ marginTop: '0.2rem' }}>
                         <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: notif.read ? 'transparent' : 'var(--brand)' }} />
                      </div>
                      <div style={{ flex: 1 }}>
                         <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.2rem' }}>
                            <span style={{ fontSize: '0.85rem', fontWeight: 700, color: notif.read ? 'var(--text-sub)' : 'var(--text-main)' }}>{notif.title}</span>
                            <span style={{ fontSize: '0.65rem', color: 'var(--text-sub)' }}>
                               {new Date(notif.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                         </div>
                         <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-sub)', lineHeight: 1.4 }}>{notif.message}</p>
                         
                         {notif.type === 'connection_request' && !notif.read && (
                           <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }} onClick={(e) => e.stopPropagation()}>
                             <button 
                               className="btn-sm btn-primary" 
                               style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem' }}
                               onClick={async () => {
                                 const senderId = notif.metadata?.sender_id;
                                 if (!senderId) return;

                                 const user = auth.currentUser;
                                 if (!user) return;
                                 const myId = user.uid;

                                 const connId = [myId, senderId].sort().join('_')
                                 try {
                                   await setDoc(doc(db, 'user_connections', connId), {
                                     user_id: myId,
                                     target_id: senderId,
                                     status: 'connected',
                                     created_at: new Date().toISOString()
                                   });
                                   markAsRead(notif.id);
                                   // Notify sender back
                                   await addDoc(collection(db, 'notifications'), {
                                     user_id: senderId,
                                     type: 'connection_accepted',
                                     title: 'Request Accepted',
                                     message: `You are now connected.`,
                                     link: `/dashboard/network/profile/${myId}`,
                                     created_at: new Date().toISOString()
                                   });
                                 } catch (err: any) {
                                   console.error('Accept connection error:', err.message)
                                 }
                               }}
                             >
                                Accept
                             </button>
                             <button 
                               className="btn-sm btn-ghost" 
                               style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem', border: '1px solid var(--border)' }}
                               onClick={async () => {
                                 const senderId = notif.metadata?.sender_id;
                                 if (!senderId) return;
                                 const user = auth.currentUser;
                                 if (!user) return;
                                 const myId = user.uid;

                                 const connId = [myId, senderId].sort().join('_')
                                 try {
                                   await deleteDoc(doc(db, 'user_connections', connId));
                                   markAsRead(notif.id);
                                 } catch (err: any) {
                                   console.error('Decline connection error:', err.message)
                                 }
                               }}
                             >
                                Decline
                             </button>
                             <button 
                               className="btn-sm btn-ghost" 
                               style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem', display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                               onClick={() => {
                                 const senderId = notif.metadata?.sender_id;
                                 if (senderId) {
                                   window.location.href = `/dashboard/network/profile/${senderId}`;
                                 }
                               }}
                             >
                               <ExternalLink size={12} /> Profile
                             </button>
                           </div>
                         )}

                         {notif.type === 'quiz_invite' && !notif.read && (
                           <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.75rem' }} onClick={(e) => e.stopPropagation()}>
                             <button 
                               className="btn-sm btn-primary" 
                               style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem', background: 'var(--accent)', borderColor: 'var(--accent)' }}
                               onClick={() => {
                                 markAsRead(notif.id);
                                 const roomId = notif.metadata?.room_id;
                                 if (roomId) window.location.href = `/dashboard/chillout/room/${roomId}`;
                               }}
                             >
                                Accept & Join
                             </button>
                             <button 
                               className="btn-sm btn-ghost" 
                               style={{ padding: '0.3rem 0.6rem', fontSize: '0.7rem', border: '1px solid var(--border)' }}
                               onClick={() => markAsRead(notif.id)}
                             >
                                Decline
                             </button>
                           </div>
                         )}
                      </div>
                   </div>
                </div>
              ))
            )}
          </div>
          
          <div style={{ padding: '0.75rem', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
             <button style={{ background: 'none', border: 'none', fontSize: '0.7rem', color: 'var(--text-sub)', cursor: 'pointer', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'center', width: '100%' }}>
                <Clock size={12} /> View Full Timeline
             </button>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes popIn {
          from { opacity: 0; transform: translateY(-10px) scale(0.95); }
          to { opacity: 1; transform: translateY(0) scale(1); }
        }
        .notif-item:hover { background: var(--bg-main) !important; }
      `}</style>
    </div>
  )
}
