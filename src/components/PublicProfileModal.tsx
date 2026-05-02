import React, { useState, useEffect } from 'react'
import type { Profile } from '@/types/auth'
import ChatRoom from './ChatRoom'
import { getUnicodeFlag } from '@/utils/geo'
import {
  X,
  UserPlus,
  MessageSquare,
  UserCircle,
  GraduationCap,
  Check,
  Hash,
  Globe,
  Award,
  Mail,
  Calendar,
  ShieldCheck,
  Target,
  Zap,
  CheckCircle2,
  Activity,
  Fingerprint
} from 'lucide-react'

interface PublicProfileModalProps {
  member: Profile;
  onClose: () => void;
  isConnected?: boolean;
  onConnect?: () => void;
}

type ExtendedProfile = Profile & { country_code?: string }

function FlagDisplay({ countryCode }: { countryCode?: string }) {
  if (!countryCode) return null
  return (
    <div
      style={{
        width: '28px',
        height: '18px',
        borderRadius: '4px',
        overflow: 'hidden',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        fontSize: '16px'
      }}
      aria-label={`Country flag ${countryCode.toUpperCase()}`}
      title={countryCode.toUpperCase()}
    >
      {getUnicodeFlag(countryCode)}
    </div>
  )
}

import { db, auth } from '@/lib/firebase'
import { 
  doc, 
  getDoc, 
  getDocs, 
  query, 
  collection, 
  where, 
  limit, 
  setDoc, 
  addDoc 
} from 'firebase/firestore'

export default function PublicProfileModal({ member, onClose, isConnected: initialConnected = false, onConnect }: PublicProfileModalProps) {
  const [me, setMe] = useState<{ id: string; email?: string; full_name?: string } | null>(null)
  const [achievements, setAchievements] = useState<any[]>([])
  const [isConnected, setIsConnected] = useState(initialConnected)
  const [loading, setLoading] = useState(false)
  const [showChat, setShowChat] = useState(false)

  useEffect(() => {
    async function checkConnection() {
      const user = auth.currentUser
      if (!user) return
      setMe({ id: user.uid, email: user.email || '', full_name: user.displayName || 'Me' })

      const connId = [user.uid, member.id].sort().join('_')
      const snap = await getDoc(doc(db, 'user_connections', connId))
      if (snap.exists()) setIsConnected(true)
    }

    async function fetchAchievements() {
      try {
        const artQ = query(collection(db, 'artifacts'), where('user_id', '==', member.id), limit(2))
        const comQ = query(collection(db, 'commits'), where('user_id', '==', member.id), limit(2))
        
        const [artSnap, comSnap] = await Promise.all([getDocs(artQ), getDocs(comQ)])
        
        const combined = [
          ...artSnap.docs.map(d => ({ type: 'artifact', ...d.data(), id: d.id })),
          ...comSnap.docs.map(d => ({ type: 'commit', ...d.data(), id: d.id }))
        ]
        setAchievements(combined)
      } catch (err: any) {
        console.error('Achievements error:', err.message)
      }
    }

    checkConnection()
    fetchAchievements()
  }, [member.id])

  const handleConnect = async () => {
    setLoading(true)
    const user = auth.currentUser
    if (!user) return

    try {
      // 1. Create a pending connection
      const connId = [user.uid, member.id].sort().join('_')
      await setDoc(doc(db, 'user_connections', connId), {
        user_id: user.uid,
        target_id: member.id,
        status: 'pending',
        created_at: new Date().toISOString()
      })

      // 2. Insert a notification for the target user
      await addDoc(collection(db, 'notifications'), {
        user_id: member.id,
        type: 'connection_request',
        title: 'New Connection Request',
        message: `${user.displayName || user.email} wants to connect with you.`,
        metadata: { sender_id: user.uid },
        created_at: new Date().toISOString()
      })

      setIsConnected(true)
      if (onConnect) onConnect()
    } catch (err: any) {
      console.error('Connection request error:', err.message)
    }
    setLoading(false)
  }

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div
        className="glass no-scrollbar"
        style={{
          background: 'var(--surface)',
          borderRadius: '28px',
          width: '100%',
          maxWidth: '500px',
          maxHeight: '90vh',
          overflowY: 'auto',
          border: '1px solid var(--border)',
          boxShadow: '0 25px 70px -12px rgba(0,0,0,0.6)',
          animation: 'popIn 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
          scrollbarWidth: 'none',
          msOverflowStyle: 'none'
        }}
      >
        {/* Header Visual with Gradient */}
        <div style={{ height: '140px', background: 'linear-gradient(135deg, var(--brand), #6366f1, #a855f7)', position: 'relative' }}>
          <button
            onClick={onClose}
            style={{ position: 'absolute', top: '1.25rem', right: '1.25rem', background: 'rgba(255,255,255,0.2)', backdropFilter: 'blur(4px)', border: 'none', borderRadius: '50%', padding: '0.6rem', cursor: 'pointer', color: 'white', transition: 'all 0.2s' }}
            onMouseEnter={(e) => e.currentTarget.style.transform = 'rotate(90deg)'}
            onMouseLeave={(e) => e.currentTarget.style.transform = 'rotate(0deg)'}
          >
            <X size={20} />
          </button>

          <div style={{ position: 'absolute', bottom: '-45px', left: '2rem', display: 'flex', alignItems: 'flex-end', gap: '1.5rem' }}>
            <div style={{
              width: '100px',
              height: '100px',
              borderRadius: '24px',
              background: 'var(--surface)',
              border: '4px solid var(--surface)',
              boxShadow: 'var(--shadow-xl)',
              overflow: 'hidden',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              {member.avatar_url ? (
                <img src={member.avatar_url} alt={member.full_name || 'avatar'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <UserCircle size={70} color="var(--text-sub)" />
              )}
            </div>
          </div>
        </div>

        {/* Profile Info */}
        <div style={{ padding: '3.5rem 2rem 2rem' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '1.5rem' }}>
            <div style={{ flex: 1 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '0.25rem' }}>
                <h2 style={{ fontSize: '1.8rem', fontWeight: 900, letterSpacing: '-0.03em', margin: 0 }}>{member.full_name || 'Anonymous Student'}</h2>
                {(() => {
                  const extMember = member as ExtendedProfile
                  return <FlagDisplay countryCode={extMember.country_code} />
                })()}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '1rem', color: 'var(--text-sub)', fontSize: '0.85rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <GraduationCap size={16} color="var(--brand)" />
                  <span style={{ fontWeight: 600 }}>{member.course_name || 'General Studies'}</span>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                  <Calendar size={14} color="var(--text-sub)" />
                  <span style={{ fontWeight: 500 }}>Joined {member.created_at ? new Date(member.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'N/A'}</span>
                </div>
              </div>
            </div>
            <button
              onClick={handleConnect}
              disabled={isConnected || loading}
              style={{
                padding: '0.6rem 1.25rem',
                borderRadius: '12px',
                border: 'none',
                background: isConnected ? 'var(--bg-sub)' : 'var(--brand)',
                color: isConnected ? 'var(--text-sub)' : 'white',
                fontWeight: 700,
                fontSize: '0.9rem',
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                cursor: isConnected ? 'default' : 'pointer',
                boxShadow: isConnected ? 'none' : '0 4px 14px rgba(var(--brand-rgb), 0.3)',
                transition: 'all 0.2s'
              }}
            >
              {isConnected ? <Check size={18} /> : <UserPlus size={18} />}
              {isConnected ? 'Connected' : 'Connect'}
            </button>
          </div>

          {/* Profile Stats Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '0.75rem', marginBottom: '2rem' }}>
            <div style={{ background: 'var(--bg-sub)', padding: '1rem', borderRadius: '18px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-sub)', marginBottom: '0.25rem', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>
                <Target size={14} color="var(--brand)" /> Score
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 950, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>{member.total_score} <span style={{ fontSize: '0.7rem', fontWeight: 700, opacity: 0.6 }}>pts</span></div>
            </div>
            <div style={{ background: 'var(--bg-sub)', padding: '1rem', borderRadius: '18px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-sub)', marginBottom: '0.25rem', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>
                <ShieldCheck size={14} color="var(--success)" /> Standing
              </div>
              <div style={{ fontSize: '1.4rem', fontWeight: 950, color: 'var(--text-main)', letterSpacing: '-0.02em' }}>#{member.rank || 'Senior'}</div>
            </div>
            <div style={{ background: 'var(--bg-sub)', padding: '1rem', borderRadius: '18px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-sub)', marginBottom: '0.25rem', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>
                <Calendar size={14} /> Academic Year
              </div>
              <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.9rem' }}>{member.enrollment_year} — {member.completion_year}</div>
            </div>
            <div style={{ background: 'var(--bg-sub)', padding: '1rem', borderRadius: '18px', border: '1px solid var(--border)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-sub)', marginBottom: '0.25rem', fontSize: '0.65rem', fontWeight: 800, textTransform: 'uppercase' }}>
                <Hash size={14} /> Student ID
              </div>
              <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '0.9rem' }}>{member.school_id || 'N/A'}</div>
            </div>
          </div>

          <div style={{ marginBottom: '2rem' }}>
            <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '0.75rem' }}>Scholar Bio</h3>
            <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: 1.6, opacity: 0.8 }}>
              {member.biography || `A dedicated student specializing in ${member.course_name || 'Academic Excellence'}. Focused on collaborative research and high-impact project execution.`}
            </p>
          </div>

          {/* Achievements Wall */}
          <div style={{ marginBottom: '2rem' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
              <h3 style={{ margin: 0, fontSize: '0.9rem', fontWeight: 800, color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Accomplishments</h3>
              <span style={{ fontSize: '0.7rem', fontWeight: 800, background: 'rgba(var(--brand-rgb), 0.1)', color: 'var(--brand)', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
                {member.badges_count || 0} Badges
              </span>
            </div>
            <div style={{ background: 'rgba(var(--brand-rgb), 0.03)', border: '1px solid var(--border)', borderRadius: '20px', padding: '1.25rem' }}>
              {achievements.length > 0 ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                  {achievements.map((ach, idx) => (
                    <div key={idx} style={{ padding: '0.75rem', background: 'var(--surface)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '8px', background: 'var(--bg-sub)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        {ach.type === 'artifact' ? <Target size={16} color="var(--brand)" /> : <Check size={16} color="var(--success)" />}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ fontSize: '0.85rem', fontWeight: 700, whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ach.title || ach.content || 'Contribution'}</div>
                        <div style={{ fontSize: '0.7rem', color: 'var(--text-sub)' }}>{ach.type === 'artifact' ? 'Verifiable Artifact' : 'Synced Logic Update'} • {new Date(ach.created_at).toLocaleDateString()}</div>
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div style={{ textAlign: 'center', padding: '1rem', color: 'var(--text-sub)' }}>
                  <Award size={32} style={{ opacity: 0.1, marginBottom: '0.5rem' }} />
                  <p style={{ margin: 0, fontSize: '0.8rem', fontWeight: 600 }}>No verifiable credentials recorded yet.</p>
                </div>
              )}
            </div>
          </div>

          <div style={{ display: 'flex', gap: '1rem' }}>
            <button
              onClick={onClose}
              className="btn btn-secondary"
              style={{ flex: 1, borderRadius: '14px' }}
            >
              Close
            </button>
            {isConnected ? (
              <button
                onClick={() => setShowChat(!showChat)}
                className="btn btn-primary"
                style={{ flex: 1, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', background: 'var(--success)' }}
              >
                <MessageSquare size={18} /> {showChat ? 'View Profile' : 'Live Chat'}
              </button>
            ) : (
              <button
                onClick={handleConnect}
                disabled={loading}
                className="btn btn-primary"
                style={{ flex: 1, borderRadius: '14px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}
              >
                <UserPlus size={18} /> {loading ? 'Requesting...' : 'Request Connection'}
              </button>
            )}
          </div>

          {showChat && isConnected && (
            <div style={{ marginTop: '2rem', height: '350px', animation: 'fadeIn 0.3s ease' }}>
              <ChatRoom
                roomId={`chat_${[me?.id, member.id].sort().join('_')}`}
                currentUser={{ id: me?.id || '', name: me?.full_name || 'Me' }}
              />
            </div>
          )}
        </div>
      </div>

      <style jsx>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.95) translateY(20px); }
          to { opacity: 1; transform: scale(1) translateY(0); }
        }
      `}</style>
    </div>
  )
}
