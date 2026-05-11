'use client'

import React, { createContext, useContext, useEffect, useState, useCallback, useMemo, useRef } from 'react'
import { createClient as createBrowserSupabaseClient } from '@/lib/supabase/client'
import { X, Info, CheckCircle2, AlertCircle, Timer } from 'lucide-react'
import { Notification, NotificationContextType, Toast } from '@/types/ui'

const NotificationContext = createContext<NotificationContextType | undefined>(undefined)

export const useNotifications = () => {
  const context = useContext(NotificationContext)
  if (!context) throw new Error('useNotifications must be used within NotificationProvider')
  return context
}

export function NotificationProvider({ children }: { children: React.ReactNode }) {
  const db = useMemo(() => createBrowserSupabaseClient(), [])
  const [userId, setUserId] = useState<string | null>(null)
  const [notifications, setNotifications] = useState<Notification[]>([])
  const [toasts, setToasts] = useState<Toast[]>([])
  const baselineLoadedRef = useRef(false)

  const addToast = (title: string, message: string, type: string = 'info') => {
    const id = Math.random().toString(36).substr(2, 9)
    setToasts(prev => [...prev, { id, title, message, type }])
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id))
    }, 5000)
  }

  const fetchNotifications = useCallback(async () => {
    if (!userId) return

    try {
      const { data, error } = await db
        .from('notifications')
        .select('id, type, title, message, link, read, created_at, metadata')
        .eq('user_id', userId)
        .order('created_at', { ascending: false })
        .limit(20)

      if (error) throw error

      setNotifications((data ?? []) as Notification[])
      baselineLoadedRef.current = true
      } catch (err) {
      console.error('Error fetching notifications:', err.message)
    }
  }, [db, userId])

  useEffect(() => {
    if (typeof window !== 'undefined' && 'Notification' in window) {
      if (window.Notification.permission === 'default') {
        window.Notification.requestPermission();
      }
    }

    let active = true

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

    db.auth.getUser().then(({ data }) => {
      if (!active) return
      const id = data.user?.id ?? null
      setUserId(id)
      if (!id) {
        baselineLoadedRef.current = false
        setNotifications([])
      }
    })

    const { data: authSubscription } = db.auth.onAuthStateChange((_event, session) => {
      if (!active) return
      const id = session?.user?.id ?? null
      setUserId(id)
      if (!id) {
        baselineLoadedRef.current = false
        setNotifications([])
      }
    })

    const channel = db
      .channel('notifications-feed')
      .on(
        'postgres_changes',
        { event: '*', schema: 'public', table: 'notifications' },
        (payload) => {
          if (!active || !userId) return

          if (payload.eventType === 'INSERT') {
            const inserted = payload.new as Notification & { user_id?: string }
            if (inserted.user_id !== userId) return

            setNotifications((prev) => {
              const exists = prev.some((n) => n.id === inserted.id)
              if (!exists && baselineLoadedRef.current) {
                addToast(inserted.title, inserted.message, inserted.type)
                showBrowserAlert(inserted.title, inserted.message)
              }
              if (exists) return prev
              return [inserted, ...prev].slice(0, 20)
            })
            return
          }

          if (payload.eventType === 'UPDATE') {
            const updated = payload.new as Notification & { user_id?: string }
            if (updated.user_id !== userId) return
            setNotifications((prev) => prev.map((n) => (n.id === updated.id ? updated : n)))
            return
          }

          if (payload.eventType === 'DELETE') {
            const removed = payload.old as { id?: string; user_id?: string }
            if (removed.user_id !== userId) return
            setNotifications((prev) => prev.filter((n) => n.id !== removed.id))
          }
        }
      )
      .subscribe()

    return () => {
      active = false
      authSubscription.subscription.unsubscribe()
      db.removeChannel(channel)
    }
  }, [db, userId])

  useEffect(() => {
    if (userId) {
      fetchNotifications()
    } else {
      baselineLoadedRef.current = false
      setNotifications([])
    }
  }, [fetchNotifications, userId])

  const markAsRead = async (id: string) => {
    if (!userId) return
    const original = notifications.find(n => n.id === id)
    if (!original || original.read) return

    setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: true } : n))

    try {
      const { error } = await db
        .from('notifications')
        .update({ read: true })
        .eq('id', id)
        .eq('user_id', userId)

      if (error) throw error
    } catch (err: any) {
      } catch (err) {
      console.error('Persistence error (markAsRead):', err.message)
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, read: false } : n))
      addToast('Check connection', 'We couldn\'t update that just now.', 'error')
    }
  }

  const markAllAsRead = async () => {
    if (!userId) return

    const original = [...notifications]
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))

    try {
      const { error } = await db
        .from('notifications')
        .update({ read: true })
        .eq('user_id', userId)
        .eq('read', false)

      if (error) throw error
    } catch (err: any) {
      } catch (err) {
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


