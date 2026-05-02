'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo } from 'react'
import { db, auth, firestoreClientEnabled } from '@/lib/firebase'
import { 
  collection, 
  query, 
  where, 
  orderBy, 
  limit, 
  onSnapshot, 
  getDocs, 
  updateDoc, 
  doc, 
  writeBatch,
  DocumentData
} from 'firebase/firestore'
import { X, Info, UserPlus, CheckCircle2, AlertCircle, Timer } from 'lucide-react'
import { Notification, NotificationContextType, Toast } from '@/types/ui'

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('useNotifications must be used within NotificationProvider')
  return context
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [toasts, setToasts] = useState<Toast[]>([])

  const addToast = (title: string, message: string, type: string = 'info') => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { id, title, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)
  }

  const fetchNotifications = useCallback(async () => {
    if (!firestoreClientEnabled) return
    const user = auth.currentUser
    if (!user) return

    try {
      const q = query(
        collection(db, 'notifications'),
        where('user_id', '==', user.uid),
        orderBy('created_at', 'desc'),
        limit(20)
      )
      const snap = await getDocs(q)
      setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() } as unknown as Notification)))
    } catch (err: any) {
      console.error('Error fetching notifications:', err.message)
    }
  }, [])

  useEffect(() => {
    if (!firestoreClientEnabled) return
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (window.Notification.permission === 'default') {
        window.Notification.requestPermission();
      }
    }

    let unsubscribe: (() => void) | null = null;
    let active = true;

    const showBrowserAlert = (title: string, message: string) => {
      if (typeof window === 'undefined') return;
      if (window.Notification?.permission !== 'granted') return;
      if (!document.hidden && document.hasFocus()) return;

      const notification = new window.Notification(title, {
        body: message,
        icon: '/favicon.ico',
        silent: true
      });
      notification.onclick = () => window.focus();
    };

    const setupSubscription = () => {
      const user = auth.currentUser
      if (!user) return

      const q = query(
        collection(db, 'notifications'),
        where('user_id', '==', user.uid),
        orderBy('created_at', 'desc'),
        limit(20)
      )

      unsubscribe = onSnapshot(q, (snap) => {
        if (!active) return

        const incoming = snap.docChanges()
          .filter(change => change.type === 'added')
          .map(change => ({ id: change.doc.id, ...change.doc.data() } as Notification))

        // Trigger alerts for truly new ones if we already had a baseline
        if (notifications.length > 0) {
          incoming.forEach(notif => {
            addToast(notif.title, notif.message, notif.type)
            showBrowserAlert(notif.title, notif.message)
          })
        }

        setNotifications(snap.docs.map(d => ({ id: d.id, ...d.data() } as unknown as Notification)))
      })
    }

    const unsubAuth = auth.onAuthStateChanged((user) => {
      if (user) {
        setupSubscription()
      } else {
        if (unsubscribe) unsubscribe()
        setNotifications([])
      }
    })

    return () => {
      active = false
      unsubAuth()
      if (unsubscribe) unsubscribe()
    }
  }, [])

  const markAsRead = async (id: string) => {
    if (!firestoreClientEnabled) return
    const original = notifications.find(n => n.id === id)
    if (!original || original.read) return

    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))

    try {
      await updateDoc(doc(db, 'notifications', id), { read: true })
    } catch (err: any) {
      console.error('Persistence error (markAsRead):', err.message)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: false } : n))
      addToast('Check connection', 'We couldn\'t update that just now.', 'error')
    }
  }

  const markAllAsRead = async () => {
    if (!firestoreClientEnabled) return
    const user = auth.currentUser
    if (!user) return

    const original = [...notifications]
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))

    try {
      const q = query(collection(db, 'notifications'), where('user_id', '==', user.uid), where('read', '==', false))
      const snap = await getDocs(q)
      if (!snap.empty) {
        const batch = writeBatch(db)
        snap.docs.forEach(d => batch.update(d.ref, { read: true }))
        await batch.commit()
      }
    } catch (err: any) {
      console.error('Persistence error (markAllAsRead):', err.message)
      setNotifications(original)
      addToast('Check connection', 'We couldn\'t clear your notifications.', 'error')
    }
  }

  const unreadCount = notifications.filter(n => !n.read).length

  return (
    <NotificationContext.Provider value={{ notifications, unreadCount, markAsRead, markAllAsRead, addToast, refreshNotifications: fetchNotifications }}>
      {children}
      
      {/* Absolute Toast Container */}
      <div style={{ position: 'fixed', bottom: '2rem', right: '2rem', display: 'flex', flexDirection: 'column', gap: '0.75rem', zIndex: 99999, pointerEvents: 'none' }}>
        {toasts.map(toast => {
          const type = toast.type?.toLowerCase() || 'info'
          const isError = type === 'error'
          const isSuccess = type === 'success'
          const isWarning = type === 'warning'
          
          const colors = {
            brand: isError ? '#ef4444' : isSuccess ? '#10b981' : isWarning ? '#f59e0b' : '#38bdf8',
            bg: 'rgba(15, 15, 20, 0.9)',
            border: isError ? 'rgba(239, 68, 68, 0.3)' : isSuccess ? 'rgba(16, 185, 129, 0.3)' : isWarning ? 'rgba(245, 158, 11, 0.3)' : 'rgba(56, 189, 248, 0.3)'
          }

          return (
            <div 
              key={toast.id} 
              style={{ 
                pointerEvents: 'auto',
                padding: '1.25rem 1.5rem', 
                borderRadius: '24px', 
                minWidth: '340px', 
                maxWidth: '450px', 
                display: 'flex', 
                alignItems: 'center', 
                gap: '1.25rem',
                border: `1px solid ${colors.border}`,
                background: colors.bg,
                backdropFilter: 'blur(20px)',
                boxShadow: '0 25px 50px rgba(0,0,0,0.5)',
                position: 'relative',
                overflow: 'hidden',
                animation: 'elite-toast-in 0.5s cubic-bezier(0.175, 0.885, 0.32, 1.275) forwards'
              }}
            >
              {/* Progress Bar */}
              <div style={{
                position: 'absolute',
                bottom: 0,
                left: 0,
                height: '3px',
                background: colors.brand,
                width: '100%',
                animation: 'elite-toast-progress 5s linear forwards'
              }} />

              <div style={{ 
                width: '40px',
                height: '40px',
                borderRadius: '12px', 
                background: `rgba(${isError ? '239, 68, 68' : isSuccess ? '16, 185, 129' : '56, 189, 248'}, 0.1)`,
                color: colors.brand,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                 {isError ? <AlertCircle size={22} /> : 
                  isSuccess ? <CheckCircle2 size={22} /> : 
                  isWarning ? <Timer size={22} /> : <Info size={22} />}
              </div>
              
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.7rem', fontWeight: 950, color: colors.brand, textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '2px' }}>
                  {type === 'info' ? 'Update' : type}
                </div>
                <div style={{ fontWeight: 800, fontSize: '1rem', color: 'white', letterSpacing: '-0.01em', lineHeight: 1.2 }}>{toast.title}</div>
                {toast.message && <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.6)', marginTop: '4px', lineHeight: 1.4 }}>{toast.message}</div>}
              </div>

              <button 
                onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.2)', padding: '4px' }}
              >
                <X size={18} />
              </button>
            </div>
          )
        })}
      </div>

      <style jsx global>{`
        @keyframes elite-toast-in {
          from { opacity: 0; transform: translateX(60px) scale(0.9); }
          to { opacity: 1; transform: translateX(0) scale(1); }
        }
        @keyframes elite-toast-progress {
          from { width: 100%; }
          to { width: 0%; }
        }
      `}</style>
    </NotificationContext.Provider>
  )
}


