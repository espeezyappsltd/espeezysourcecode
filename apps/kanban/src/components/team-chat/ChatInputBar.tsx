'use client'

import type { ChangeEvent, FormEvent } from 'react'
import { Paperclip, Send } from 'lucide-react'

export function ChatInputBar({
  newMessage,
  isOnline,
  uploading,
  onTyping,
  onUpload,
  onSend,
}: {
  newMessage: string
  isOnline: boolean
  uploading: boolean
  onTyping: (text: string) => void
  onUpload: (e: ChangeEvent<HTMLInputElement>) => Promise<void>
  onSend: (e: FormEvent | null) => Promise<void>
}) {
  return (
    <div style={{ padding: '0.4rem 0.5rem', background: 'var(--bg-sub)', borderTop: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
      <div style={{ display: 'flex', gap: '0.25rem', color: 'var(--text-sub)' }}>
        <label style={{ cursor: 'pointer', color: 'inherit', display: 'flex', alignItems: 'center', padding: '0.2rem', borderRadius: '6px', transition: 'background 0.2s' }} className="icon-btn">
          <Paperclip size={18} />
          <input type="file" onChange={onUpload} style={{ display: 'none' }} />
        </label>
      </div>
      <form onSubmit={onSend} style={{ flex: 1 }}>
        <input
          type="text"
          value={newMessage}
          onChange={(e) => onTyping(e.target.value)}
          placeholder={isOnline ? 'Message...' : 'Offline mode: Messages will queue'}
          style={{
            width: '100%', background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '16px',
            padding: '0.4rem 0.75rem', fontSize: '0.825rem', outline: 'none', color: 'var(--text-main)',
            transition: 'border-color 0.2s',
          }}
        />
      </form>
      <button
        onClick={(e) => {
          void onSend(e as unknown as FormEvent)
        }}
        disabled={!newMessage.trim() && !uploading}
        style={{
          background: newMessage.trim() ? 'var(--brand)' : 'var(--bg-main)',
          color: newMessage.trim() ? 'white' : 'var(--text-sub)',
          border: `1px solid ${newMessage.trim() ? 'transparent' : 'var(--border)'}`,
          borderRadius: '50%', width: '32px', height: '32px', flexShrink: 0,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          cursor: newMessage.trim() ? 'pointer' : 'default',
        }}
        aria-label="Send message"
      >
        <Send size={15} />
      </button>
    </div>
  )
}
