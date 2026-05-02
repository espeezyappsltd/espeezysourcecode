'use client'

import { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { db, auth } from '@/lib/firebase'
import { 
  doc, 
  getDoc, 
  collection, 
  query, 
  where, 
  getDocs, 
  addDoc, 
  setDoc,
  serverTimestamp 
} from 'firebase/firestore'
import { 
  X, UserCircle, ShieldCheck, Mail, Target, Award, Hash, 
  GraduationCap, Calendar, UserPlus, Check, MessageSquare, 
  Video, Info, Clock, ChevronLeft, ExternalLink, Activity, Terminal
} from 'lucide-react'
import Link from 'next/link'
import { Profile } from '@/types/database'
import { useSmartLoading } from '@/components/GlobalLoadingProvider'

export default function StudentProfilePage() {
  const params = useParams()
  const router = useRouter()
  const studentId = params.id as string

  const [member, setMember] = useState<any | null>(null)
  const [me, setMe] = useState<any | null>(null)
  const [loading, setLoading] = useState(true)
  const [connectionStatus, setConnectionStatus] = useState<'idle' | 'pending' | 'connected'>('idle')
  const [activeTab, setActiveTab] = useState<'info' | 'accomplishments'>('info')
  const { withLoading, showConfirmation } = useSmartLoading()

  const formatRelativeTime = (date: any) => {
    if (!date) return 'Unknown'
    const now = new Date()
    const targetDate = date.seconds ? new Date(date.seconds * 1000) : new Date(date)
    const diff = now.getTime() - targetDate.getTime()
    const mins = Math.floor(diff / 60000)
    if (mins < 1) return 'Just now'
    if (mins < 60) return `${mins}m ago`
    const hours = Math.floor(mins / 60)
    if (hours < 24) return `${hours}h ago`
    return targetDate.toLocaleDateString()
  }

  useEffect(() => {
    fetchProfileData()
  }, [studentId])

  const fetchProfileData = async () => {
    setLoading(true)
    const currentUser = auth.currentUser
    setMe(currentUser)

    try {
      const profileSnap = await getDoc(doc(db, 'profiles', studentId))
      if (profileSnap.exists()) {
        const profileData = profileSnap.data()
        
        // Fetch group details if group_id exists
        let groupData = null
        if (profileData.group_id) {
          const groupSnap = await getDoc(doc(db, 'groups', profileData.group_id))
          groupData = groupSnap.exists() ? groupSnap.data() : null
        }

        setMember({ id: profileSnap.id, ...profileData, groups: groupData })

        if (currentUser) {
          // Check connections
          const q = query(
            collection(db, 'user_connections'),
            where('user_id', 'in', [currentUser.uid, studentId]),
            where('target_id', 'in', [currentUser.uid, studentId])
          )
          const connSnap = await getDocs(q)
          const conns = connSnap.docs.map(d => d.data())
          
          const connection = conns.find((c: any) => c.status === 'connected' || c.status === 'accepted')
          const pendingSentByMe = conns.find((c: any) => c.user_id === currentUser.uid && c.status === 'pending')

          if (connection) {
            setConnectionStatus('connected')
          } else if (pendingSentByMe) {
            setConnectionStatus('pending')
          } else {
            setConnectionStatus('idle')
          }
        }
      }
    } catch (err: any) {
      console.error('Profile fetch error:', err.message)
    }

    setLoading(false)
  }

  const handleConnect = async () => {
    if (!me || !member || connectionStatus !== 'idle') return

    await withLoading(async () => {
      try {
        const connId = [me.uid, member.id].sort().join('_')
        await setDoc(doc(db, 'user_connections', connId), { 
          user_id: me.uid, 
          target_id: member.id, 
          status: 'pending',
          created_at: serverTimestamp()
        })

        await addDoc(collection(db, 'notifications'), {
          user_id: member.id,
          type: 'connection_request',
          title: 'New Connection Request',
          message: `${me.displayName || me.email} wants to connect with you.`,
          metadata: { sender_id: me.uid },
          created_at: serverTimestamp()
        })

        setConnectionStatus('pending')
        
        showConfirmation({
          title: 'Request Sent',
          message: `Your connection request has been sent to ${member.full_name?.split(' ')[0]}.`,
          type: 'success',
          onConfirm: () => {}
        })
      } catch (err: any) {
        throw err
      }
    }, 'Authenticating Request...')
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh' }}>
        <div className="spinner-mini" style={{ width: '32px', height: '32px', borderTopColor: 'var(--brand)' }} />
      </div>
    )
  }

  if (!member) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem 2rem' }}>
        <h2 style={{ fontWeight: 800 }}>Scholar Not Identified</h2>
        <Link href="/dashboard/network" className="btn btn-secondary btn-inline" style={{ marginTop: '1rem' }}>Back to Network</Link>
      </div>
    )
  }

  return (
    <div style={{ maxWidth: '1000px', margin: '0 auto', padding: '0 var(--p-safe) 5rem', animation: 'fadeIn 0.5s ease-out' }}>
      
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.25rem', marginTop: '1rem' }}>
        <button 
          onClick={() => router.back()}
          style={{ background: 'var(--surface)', border: '1px solid var(--border)', borderRadius: '10px', padding: '0.5rem', cursor: 'pointer', color: 'var(--text-main)' }}
        >
          <ChevronLeft size={20} />
        </button>
        <h1 style={{ fontSize: '1.25rem', fontWeight: 900, margin: 0 }}>Scholar Transcript</h1>
      </div>

      <div className="profile-main-layout" style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 320px) 1fr', gap: '1.5rem' }}>
        
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', padding: '1.5rem', textAlign: 'center', boxShadow: 'var(--shadow-sm)' }}>
            <div style={{ position: 'relative', width: '90px', height: '90px', margin: '0 auto 1rem' }}>
              <div style={{ width: '100%', height: '100%', borderRadius: '50%', background: 'var(--bg-sub)', border: '3px solid var(--surface)', boxShadow: 'var(--shadow-md)', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                {member.avatar_url ? (
                  <img src={member.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                ) : (
                  <UserCircle size={60} color="var(--text-sub)" />
                )}
              </div>
              <div style={{ position: 'absolute', bottom: '2px', right: '2px', width: '14px', height: '14px', borderRadius: '50%', background: 'var(--success)', border: '2px solid var(--surface)' }} />
            </div>

            <h2 style={{ fontSize: '1.5rem', fontWeight: 950, marginBottom: '0.25rem' }}>{member.full_name}</h2>
            {member.tagline && (
              <p style={{ fontSize: '0.85rem', color: 'var(--brand)', fontWeight: 800, fontStyle: 'italic', marginBottom: '1rem' }}>
                &quot;{member.tagline}&quot;
              </p>
            )}

            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.3rem', marginBottom: '1.25rem' }}>
               <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.4rem', color: 'var(--text-sub)', fontSize: '0.75rem', fontWeight: 700 }}>
                  <ShieldCheck size={14} color="var(--brand)" /> 
                  {member.rank || 'Scholar'}
               </div>
               <div style={{ color: 'var(--text-sub)', fontSize: '0.7rem', fontWeight: 600 }}>
                 Last active {formatRelativeTime(member.last_seen || null)}
               </div>
            </div>

            <button 
              onClick={handleConnect}
              disabled={connectionStatus !== 'idle'}
              className="btn btn-primary"
              style={{ fontSize: '0.9rem', padding: '0.75rem' }}
            >
              {connectionStatus === 'connected' ? <Check size={18} /> : connectionStatus === 'pending' ? <Clock size={18} /> : <UserPlus size={18} />}
              {connectionStatus === 'connected' ? 'Connected' : connectionStatus === 'pending' ? 'Pending' : 'Connect'}
            </button>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
             {[
               { id: 'info', icon: Info, label: 'Stats' },
               { id: 'chat', icon: MessageSquare, label: 'Chat', disabled: connectionStatus !== 'connected' },
               { id: 'accomplishments', icon: Award, label: 'Badges' }
             ].map((item) => (
               <button
                 key={item.id}
                 onClick={() => {
                   if (item.disabled) return;
                   if (item.id === 'chat') router.push(`/dashboard/network/chat/${studentId}`);
                   else setActiveTab(item.id as 'info' | 'accomplishments');
                 }}
                 style={{ 
                   borderRadius: '12px', border: activeTab === item.id ? '2px solid var(--brand)' : '1px solid var(--border)',
                   background: activeTab === item.id ? 'var(--bg-sub)' : 'var(--surface)',
                   color: activeTab === item.id ? 'var(--brand)' : 'var(--text-sub)',
                   display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '0.4rem',
                   padding: '0.75rem 0', fontSize: '0.7rem', fontWeight: 800, cursor: item.disabled ? 'not-allowed' : 'pointer',
                   opacity: item.disabled ? 0.4 : 1, transition: 'all 0.2s'
                 }}
               >
                 <item.icon size={16} />
                 {item.label}
               </button>
             ))}
          </div>
        </div>

        <div style={{ background: 'var(--surface)', borderRadius: '16px', border: '1px solid var(--border)', padding: '1.5rem', boxShadow: 'var(--shadow-sm)' }}>
           {activeTab === 'info' && (
              <div className="page-fade">
                 <div style={{ marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1rem', fontWeight: 900, marginBottom: '0.75rem' }}>Scholar Overview</h3>
                    <div style={{ padding: '1rem', background: 'var(--bg-sub)', borderRadius: '12px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                       <GraduationCap size={18} color="var(--brand)" />
                       <div>
                          <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-sub)', textTransform: 'uppercase' }}>Current Track</div>
                          <div style={{ fontSize: '0.9rem', fontWeight: 800 }}>{member.course_name || 'Independent Scholar'}</div>
                       </div>
                    </div>
                 </div>

                 <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1.5rem' }}>
                    <div style={{ background: 'var(--bg-sub)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                       <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-sub)', textTransform: 'uppercase' }}>Score</div>
                       <div style={{ fontSize: '1.5rem', fontWeight: 950, color: 'var(--brand)' }}>{member.total_score}</div>
                    </div>
                    <div style={{ background: 'var(--bg-sub)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)' }}>
                       <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-sub)', textTransform: 'uppercase' }}>Grad Year</div>
                       <div style={{ fontSize: '0.9rem', fontWeight: 800, marginTop: '0.4rem' }}>{member.completion_year || 'N/A'}</div>
                    </div>
                 </div>

                  {member.stack && (
                    <div style={{ marginBottom: '1.5rem' }}>
                       <h4 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-sub)', marginBottom: '0.5rem' }}>
                          <Terminal size={14} style={{ verticalAlign: 'middle', marginRight: '4px' }} /> Technical Arsenal
                       </h4>
                       <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.4rem' }}>
                          {member.stack.split(',').map((tech: string, idx: number) => (
                             <span key={idx} style={{ padding: '0.3rem 0.6rem', background: 'var(--bg-sub)', border: '1px solid var(--border)', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand)' }}>
                                {tech.trim()}
                             </span>
                          ))}
                       </div>
                    </div>
                  )}

                 <div style={{ marginBottom: '1.5rem' }}>
                    <h4 style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-sub)', marginBottom: '0.5rem' }}>Scholar Identity</h4>
                    <p style={{ fontSize: '0.9rem', lineHeight: 1.6, color: 'var(--text-main)', opacity: 0.85 }}>
                      {member.biography || `An active scholar in the Espeezy network, specializing in ${member.course_name || 'their academic field'}.`}
                    </p>
                 </div>
              </div>
           )}

           {activeTab === 'accomplishments' && (
              <div className="page-fade">
                 <h3 style={{ fontSize: '1rem', fontWeight: 900, marginBottom: '1.25rem' }}>Verified Credentials</h3>
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(130px, 1fr))', gap: '0.75rem' }}>
                    {member.badges_count && member.badges_count > 0 ? (
                      [...Array(member.badges_count)].map((_, i) => (
                         <div key={i} style={{ background: 'var(--bg-sub)', padding: '1rem', borderRadius: '12px', border: '1px solid var(--border)', textAlign: 'center' }}>
                            <Award size={24} color="#f59e0b" style={{ marginBottom: '0.5rem' }} />
                            <div style={{ fontWeight: 800, fontSize: '0.75rem' }}>Verified</div>
                         </div>
                      ))
                    ) : (
                      <div style={{ gridColumn: '1 / -1', textAlign: 'center', padding: '3rem 1rem', background: 'var(--bg-sub)', borderRadius: '12px', opacity: 0.5 }}>
                         <Award size={40} style={{ marginBottom: '0.5rem' }} />
                         <p style={{ fontWeight: 700, fontSize: '0.85rem' }}>No credentials earned yet.</p>
                      </div>
                    )}
                 </div>
              </div>
           )}
        </div>
      </div>

      <style jsx>{`
        @keyframes fadeIn { from { opacity: 0; transform: translateY(8px); } to { opacity: 1; transform: translateY(0); } }
        @media (max-width: 800px) {
          .profile-main-layout { grid-template-columns: 1fr !important; }
        }
      `}</style>
    </div>
  )
}
