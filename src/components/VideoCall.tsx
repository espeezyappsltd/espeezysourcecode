'use client'

import React, { useEffect, useRef, useState } from 'react'

interface VideoCallProps {
  roomName: string;
  userName: string;
  onClose: () => void;
}

interface JitsiExternalAPI {
  addEventListener: (event: string, listener: () => void) => void
  dispose: () => void
}

declare global {
  interface Window {
    JitsiMeetExternalAPI?: new (domain: string, options: Record<string, unknown>) => JitsiExternalAPI
  }
}

export default function VideoCall({ roomName, userName, onClose }: VideoCallProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const apiRef = useRef<JitsiExternalAPI | null>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const domain = 'meet.jit.si'
    
    // Load script
    const script = document.createElement('script')
    script.src = `https://${domain}/external_api.js`
    script.async = true
    document.body.appendChild(script)

    script.onload = () => {
      setLoading(false)
      if (containerRef.current) {
        const options = {
          roomName: roomName,
          width: '100%',
          height: '100%',
          parentNode: containerRef.current,
          userInfo: {
            displayName: userName
          },
          configOverwrite: {
            prejoinPageEnabled: false,
            disableDeepLinking: true,
            startWithAudioMuted: true,
            startWithVideoMuted: false,
          },
          interfaceConfigOverwrite: {
            TOOLBAR_BUTTONS: [
              'microphone', 'camera', 'closedcaptions', 'desktop', 'fullscreen',
              'fodeviceselection', 'hangup', 'profile', 'chat', 'recording',
              'livestreaming', 'etherpad', 'sharedvideo', 'settings', 'raisehand',
              'videoquality', 'filmstrip', 'invite', 'feedback', 'stats', 'shortcuts',
              'tileview', 'videobackgroundblur', 'download', 'help', 'mute-everyone',
              'security'
            ],
            SHOW_JITSI_WATERMARK: false,
            SHOW_WATERMARK_FOR_GUESTS: false,
            DEFAULT_REMOTE_DISPLAY_NAME: 'Fellow Scholar',
          }
        }

        if (window.JitsiMeetExternalAPI) {
          apiRef.current = new window.JitsiMeetExternalAPI(domain, options)
          
          // Listen for hangup
          apiRef.current.addEventListener('videoConferenceLeft', () => {
            onClose()
          })
        }
      }
    }

    return () => {
      if (apiRef.current) {
        apiRef.current.dispose()
      }
      document.body.removeChild(script)
    }
  }, [roomName, userName, onClose])

  return (
    <div className="video-call-modal page-fade" style={{ 
      position: 'fixed', inset: 0, zIndex: 10000, 
      background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)',
      display: 'flex', flexDirection: 'column'
    }}>
      <div style={{ 
        padding: '1rem 2rem', borderBottom: '1px solid var(--border)', 
        display: 'flex', justifyContent: 'space-between', alignItems: 'center',
        background: 'var(--surface)'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <div style={{ width: '10px', height: '10px', background: 'var(--success)', borderRadius: '50%', boxShadow: '0 0 10px var(--success)' }} />
          <span style={{ fontWeight: 800, fontSize: '0.9rem' }}>Secure Video Lab: {roomName.split('_').pop()}</span>
        </div>
        <button 
          onClick={onClose}
          style={{ 
            background: 'var(--bg-sub)', border: 'none', padding: '0.5rem 1rem', 
            borderRadius: '10px', cursor: 'pointer', fontWeight: 800, color: 'var(--text-main)' 
          }}
        >
          Exit Call
        </button>
      </div>
      
      <div style={{ flex: 1, position: 'relative' }}>
        {loading && (
          <div style={{ position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', gap: '1rem' }}>
             <div className="spinner" />
             <p style={{ color: 'white', fontWeight: 700 }}>Initializing Video Encryption...</p>
          </div>
        )}
        <div ref={containerRef} style={{ width: '100%', height: '100%' }} />
      </div>

      <style jsx>{`
        .spinner {
          width: 40px; height: 40px; border: 4px solid rgba(255,255,255,0.1);
          border-top-color: var(--brand); border-radius: 50%; animation: spin 1s linear infinite;
        }
        @keyframes spin { to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}
