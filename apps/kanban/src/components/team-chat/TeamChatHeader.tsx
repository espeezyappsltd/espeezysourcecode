'use client'

import { MessageSquare, X, Search, LayoutGrid } from 'lucide-react'

export function TeamChatHeader({
  isSearching,
  chatSearch,
  onSearchChange,
  onCloseSearch,
  othersTyping,
  teamOnlineCount,
  showLobby,
  onToggleLobby,
  onOpenSearch,
  onClose,
}: {
  isSearching: boolean
  chatSearch: string
  onSearchChange: (text: string) => void
  onCloseSearch: () => void
  othersTyping: string[]
  teamOnlineCount: number
  showLobby: boolean
  onToggleLobby: () => void
  onOpenSearch: () => void
  onClose: () => void
}) {
  return (
    <div style={{ padding: '0.5rem 0.75rem', background: 'var(--brand)', color: 'white', display: 'flex', alignItems: 'center', gap: '0.5rem', position: 'relative' }}>
      {isSearching ? (
        <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: '0.4rem', animation: 'fadeIn 0.2s' }}>
          <Search size={14} />
          <input
            type="text"
            value={chatSearch}
            onChange={(e) => onSearchChange(e.target.value)}
            placeholder="Search..."
            autoFocus
            style={{ flex: 1, background: 'rgba(255,255,255,0.15)', border: 'none', borderRadius: '6px', padding: '0.3rem 0.6rem', color: 'white', fontSize: '0.8rem', outline: 'none' }}
          />
          <button onClick={onCloseSearch} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer' }} aria-label="Close search">
            <X size={16} />
          </button>
        </div>
      ) : (
        <>
          <div style={{ background: 'rgba(255,255,255,0.2)', borderRadius: '50%', width: '30px', height: '30px', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <MessageSquare size={16} />
          </div>
          <div style={{ flex: 1, minWidth: 0 }}>
            <h3 style={{ margin: 0, fontSize: '0.85rem', fontWeight: 800 }}>Team Chat</h3>
            <div style={{ fontSize: '0.65rem', opacity: 0.9, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              {othersTyping.length > 0 ? (
                <span style={{ fontStyle: 'italic', fontWeight: 600 }}>typing...</span>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                  <div style={{ width: '5px', height: '5px', borderRadius: '50%', background: '#4ade80' }} />
                  {teamOnlineCount} online
                </div>
              )}
              <button
                onClick={onToggleLobby}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '4px',
                  padding: '1px 4px',
                  color: 'white',
                  fontSize: '0.55rem',
                  fontWeight: 900,
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '2px',
                }}
                title="Team Lobby"
              >
                <LayoutGrid size={8} /> {showLobby ? 'EXIT' : 'LOBBY'}
              </button>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '0.3rem' }}>
            <button onClick={onOpenSearch} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', color: 'white', borderRadius: '6px', padding: '0.25rem' }} aria-label="Search chat">
              <Search size={14} />
            </button>
            <button onClick={onClose} style={{ background: 'rgba(255,255,255,0.15)', border: 'none', cursor: 'pointer', color: 'white', borderRadius: '6px', padding: '0.25rem' }} aria-label="Close chat">
              <X size={14} />
            </button>
          </div>
        </>
      )}
    </div>
  )
}
