'use client'

import { useState, useEffect, useRef, CSSProperties, useCallback } from 'react'
import { createPortal } from 'react-dom'
import { useRouter } from 'next/navigation'
import { Bell, Clock, ExternalLink, Inbox } from 'lucide-react'
import { useNotifications } from './NotificationProvider'
import { createClient } from '@/lib/supabase/client'
import { Notification } from '@/types/ui'
import './notification-bell.css'

function getPanelPosition(anchor: HTMLElement): CSSProperties {
  const rect = anchor.getBoundingClientRect()
  const isMobile = window.innerWidth <= 768
  const width = isMobile ? Math.min(380, window.innerWidth - 32) : 320

  if (isMobile) {
    const headerBottom =
      document.querySelector('.mobile-header')?.getBoundingClientRect().bottom ?? 56
    return {
      top: `${headerBottom + 10}px`,
      left: '16px',
      width: 'calc(100vw - 32px)',
      maxHeight:
        'min(70dvh, calc(100dvh - var(--mobile-header-total) - var(--mobile-bottom-total) - 2rem))',
    }
  }

  let left = Math.min(Math.max(12, rect.right - width), window.innerWidth - width - 12)
  const top = rect.bottom + 10
  const maxHeight = Math.min(450, window.innerHeight - top - 20)

  return {
    top: `${top}px`,
    left: `${left}px`,
    width: `${width}px`,
    maxHeight: `${maxHeight}px`,
  }
}

export default function NotificationBell() {
  const router = useRouter()
  const db = useRef(createClient()).current
  const { notifications, unreadCount, markAsRead, markAllAsRead } = useNotifications()
  const [isOpen, setIsOpen] = useState(false)
  const [panelStyle, setPanelStyle] = useState<CSSProperties>({})
  const [actionBusy, setActionBusy] = useState<string | null>(null)
  const [mounted, setMounted] = useState(false)
  const anchorRef = useRef<HTMLDivElement>(null)
  const panelRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    setMounted(true)
  }, [])

  const closePanel = useCallback(() => setIsOpen(false), [])

  const updatePosition = useCallback(() => {
    if (!anchorRef.current) return
    setPanelStyle(getPanelPosition(anchorRef.current))
  }, [])

  useEffect(() => {
    if (!isOpen) return

    function handleClickOutside(event: MouseEvent) {
      const target = event.target as Node
      if (anchorRef.current?.contains(target)) return
      if (panelRef.current?.contains(target)) return
      closePanel()
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === 'Escape') closePanel()
    }

    document.addEventListener('mousedown', handleClickOutside)
    document.addEventListener('keydown', handleEscape)
    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
      document.removeEventListener('keydown', handleEscape)
    }
  }, [isOpen, closePanel])

  useEffect(() => {
    if (!isOpen) return
    updatePosition()
    window.addEventListener('resize', updatePosition)
    window.addEventListener('scroll', updatePosition, true)
    return () => {
      window.removeEventListener('resize', updatePosition)
      window.removeEventListener('scroll', updatePosition, true)
    }
  }, [isOpen, updatePosition])

  useEffect(() => {
    if (!isOpen || typeof document === 'undefined') return
    const prev = document.body.style.overflow
    if (window.innerWidth <= 768) {
      document.body.style.overflow = 'hidden'
    }
    return () => {
      document.body.style.overflow = prev
    }
  }, [isOpen])

  const handleItemClick = (notif: Notification) => {
    markAsRead(notif.id)
    if (
      notif.link &&
      (notif.type === 'marketplace_purchase' || notif.type === 'marketplace_sale')
    ) {
      closePanel()
      router.push(notif.link)
    }
  }

  const panel = isOpen && mounted ? (
    <>
      <button
        type="button"
        className="notification-panel-backdrop"
        aria-label="Close notifications"
        onClick={closePanel}
      />
      <div
        ref={panelRef}
        className="notification-panel"
        role="dialog"
        aria-label="Project alerts"
        style={panelStyle}
      >
        <div className="notification-panel__head">
          <h3 className="notification-panel__title">Project Alerts</h3>
          <button
            type="button"
            className="notification-panel__clear"
            onClick={() => void markAllAsRead()}
            disabled={unreadCount === 0}
          >
            Clear All
          </button>
        </div>

        <div className="notification-panel__list">
          {notifications.length === 0 ? (
            <div className="notification-panel__empty">
              <Inbox size={32} style={{ marginBottom: '1rem', opacity: 0.3 }} aria-hidden />
              <p style={{ fontSize: '0.875rem', margin: 0 }}>No new signals detected.</p>
            </div>
          ) : (
            notifications.map((notif: Notification) => (
              <div
                key={notif.id}
                role="button"
                tabIndex={0}
                onClick={() => handleItemClick(notif)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' || e.key === ' ') {
                    e.preventDefault()
                    handleItemClick(notif)
                  }
                }}
                className={`notif-item ${notif.read ? '' : 'notif-item--unread'}`}
              >
                <div style={{ display: 'flex', gap: '0.75rem' }}>
                  <div style={{ marginTop: '0.2rem' }}>
                    <div
                      style={{
                        width: '8px',
                        height: '8px',
                        borderRadius: '50%',
                        background: notif.read ? 'transparent' : 'var(--brand)',
                      }}
                      aria-hidden
                    />
                  </div>
                  <div style={{ flex: 1 }}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: '0.2rem',
                      }}
                    >
                      <span
                        style={{
                          fontSize: '0.85rem',
                          fontWeight: 700,
                          color: notif.read ? 'var(--text-sub)' : 'var(--text-main)',
                        }}
                      >
                        {notif.title}
                      </span>
                      <span style={{ fontSize: '0.65rem', color: 'var(--text-sub)' }}>
                        {new Date(notif.created_at).toLocaleTimeString([], {
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </span>
                    </div>
                    <p
                      style={{
                        margin: 0,
                        fontSize: '0.75rem',
                        color: 'var(--text-sub)',
                        lineHeight: 1.4,
                      }}
                    >
                      {notif.message}
                    </p>

                    {notif.type === 'connection_request' && !notif.read && (
                      <div
                        className="notif-item__actions"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="btn-sm btn-primary notification-panel__action"
                          disabled={actionBusy === notif.id}
                          onClick={async () => {
                            const senderId = notif.metadata?.sender_id
                            if (!senderId) return
                            setActionBusy(notif.id)
                            try {
                              const {
                                data: { user },
                              } = await db.auth.getUser()
                              if (!user) return
                              const myId = user.id
                              await db.from('user_connections').upsert({
                                user_id: myId,
                                target_id: senderId,
                                status: 'connected',
                                created_at: new Date().toISOString(),
                              })
                              markAsRead(notif.id)
                              await db.from('notifications').insert({
                                user_id: senderId,
                                type: 'connection_accepted',
                                title: 'Request Accepted',
                                message: 'You are now connected.',
                                link: `/network/profile/${myId}`,
                                created_at: new Date().toISOString(),
                              })
                            } catch (err) {
                              console.error(
                                'Accept connection error:',
                                err instanceof Error ? err.message : err,
                              )
                            } finally {
                              setActionBusy(null)
                            }
                          }}
                        >
                          Accept
                        </button>
                        <button
                          type="button"
                          className="btn-sm btn-ghost notification-panel__action"
                          style={{ border: '1px solid var(--border)' }}
                          disabled={actionBusy === notif.id}
                          onClick={async () => {
                            const senderId = notif.metadata?.sender_id
                            if (!senderId) return
                            setActionBusy(notif.id)
                            try {
                              const {
                                data: { user },
                              } = await db.auth.getUser()
                              if (!user) return
                              const myId = user.id
                              await db
                                .from('user_connections')
                                .delete()
                                .match({ user_id: myId, target_id: senderId })
                              markAsRead(notif.id)
                            } catch (err) {
                              console.error(
                                'Decline connection error:',
                                err instanceof Error ? err.message : err,
                              )
                            } finally {
                              setActionBusy(null)
                            }
                          }}
                        >
                          Decline
                        </button>
                        <button
                          type="button"
                          className="btn-sm btn-ghost notification-panel__action"
                          style={{ display: 'flex', alignItems: 'center', gap: '0.2rem' }}
                          disabled={actionBusy === notif.id}
                          onClick={() => {
                            const senderId = notif.metadata?.sender_id
                            if (senderId) {
                              closePanel()
                              router.push(`/network/profile/${senderId}`)
                            }
                          }}
                        >
                          <ExternalLink size={12} aria-hidden /> Profile
                        </button>
                      </div>
                    )}

                    {notif.type === 'quiz_invite' && !notif.read && (
                      <div
                        className="notif-item__actions"
                        onClick={(e) => e.stopPropagation()}
                        onKeyDown={(e) => e.stopPropagation()}
                      >
                        <button
                          type="button"
                          className="btn-sm btn-primary notification-panel__action"
                          style={{
                            background: 'var(--accent)',
                            borderColor: 'var(--accent)',
                          }}
                          disabled={actionBusy === notif.id}
                          onClick={() => {
                            markAsRead(notif.id)
                            const roomId = notif.metadata?.room_id
                            if (roomId) {
                              closePanel()
                              router.push(roomId ? `/network/messages/${roomId}` : '/network')
                            }
                          }}
                        >
                          Accept & Join
                        </button>
                        <button
                          type="button"
                          className="btn-sm btn-ghost notification-panel__action"
                          style={{ border: '1px solid var(--border)' }}
                          disabled={actionBusy === notif.id}
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

        <div className="notification-panel__foot">
          <button
            type="button"
            className="notification-panel__timeline"
            onClick={() => {
              closePanel()
              router.push('/notifications')
            }}
          >
            <Clock size={12} aria-hidden /> View Full Timeline
          </button>
        </div>
      </div>
    </>
  ) : null

  return (
    <div className="notification-bell-anchor" ref={anchorRef}>
      <button
        type="button"
        onClick={() => setIsOpen((open) => !open)}
        className="nav-bubble notification-bell-trigger"
        aria-label="Notifications"
        aria-expanded={isOpen}
        aria-haspopup="dialog"
        style={{
          color: unreadCount > 0 ? 'var(--brand)' : 'var(--text-sub)',
        }}
      >
        <Bell size={20} aria-hidden />
        {unreadCount > 0 && (
          <span className="notification-bell-badge" aria-label={`${unreadCount} unread`}>
            {unreadCount > 9 ? '9+' : unreadCount}
          </span>
        )}
      </button>

      {mounted && panel && createPortal(panel, document.body)}
    </div>
  )
}
