'use client'

import { MessageSquare } from 'lucide-react'

export function ClosedChatButton({ onOpen }: { onOpen: () => void }) {
  return (
    <button
      onClick={onOpen}
      style={{
        position: 'fixed',
        bottom: 'calc(var(--h-mobile-bottom) + 1.25rem + env(safe-area-inset-bottom))',
        right: '1.25rem',
        width: '60px',
        height: '60px',
        borderRadius: '50%',
        background: 'var(--brand)',
        color: 'white',
        border: 'none',
        cursor: 'pointer',
        boxShadow: 'var(--shadow-xl)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 1000,
        transition: 'all 0.3s',
      }}
      className="chat-toggle"
      aria-label="Open team chat"
    >
      <MessageSquare size={24} />
      <div
        style={{
          position: 'absolute',
          top: '2px',
          right: '2px',
          width: '12px',
          height: '12px',
          borderRadius: '50%',
          background: 'var(--success)',
          border: '2px solid white',
        }}
      />
    </button>
  )
}
