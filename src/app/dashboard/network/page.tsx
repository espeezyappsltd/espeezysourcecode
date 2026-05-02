'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { useRouter } from 'next/navigation'
import { db, createBrowserSupabaseClient } from '@/lib/db-client'
import Image from 'next/image'
import { 
  Search, 
  User, 
  MessageSquare, 
  ExternalLink, 
  Users, 
  GraduationCap, 
  Sparkles, 
  Fingerprint, 
  Compass,
  ChevronRight,
  Info
} from 'lucide-react'
import { usePresence } from '@/components/PresenceProvider'
import { Profile } from '@/types/database'
import { useSmartLoading } from '@/components/GlobalLoadingProvider'

export default function NetworkPage() {
  const [teamMembers, setTeamMembers] = useState<Profile[]>([])
  const [personalNetwork, setPersonalNetwork] = useState<Profile[]>([])
  const [suggestedUsers, setSuggestedUsers] = useState<Profile[]>([])
  const [globalCount, setGlobalCount] = useState(0)
  const [search, setSearch] = useState('')
  const [loading, setLoading] = useState(true)
  
  const router = useRouter()
  const { withLoading } = useSmartLoading()
  const db = useMemo(() => createBrowserSupabaseClient(), [])
  const { onlineUsers } = usePresence()

  const fetchMetrics = useCallback(async () => {
    // 1. Fetch Global User Count
    const { count } = await db.from('profiles').select('*', { count: 'exact', head: true })
    setGlobalCount(count || 0)

    const { data: { user } } = await db.auth.getUser()
    if (!user) return

    // 2. Fetch Team Members
    const { data: me } = await db.from('profiles').select('group_id').eq('id', user.id).single()
    if (me?.group_id) {
      const { data: team } = await db.from('profiles').select('*').eq('group_id', me.group_id).neq('id', user.id)
      setTeamMembers(team || [])
    }

    // 3. Fetch Personal Network (Connections)
    const { data: conn } = await db
      .from('user_connections')
      .select('user_id, target_id')
      .or(`user_id.eq.${user.id},target_id.eq.${user.id}`)
      .eq('status', 'connected')
    
    let connectionIds: string[] = []
    if (conn) {
      connectionIds = conn.map((c: { user_id: string; target_id: string }) => c.user_id === user.id ? c.target_id : c.user_id)
      if (connectionIds.length > 0) {
        const { data: net } = await db.from('profiles').select('*').in('id', connectionIds)
        setPersonalNetwork(net || [])
      }
    }

    // 4. Fetch Suggestions (Scholars you may know)
    // EXCLUDE: Self, Team Members, and already connected Peers
    const excludeIds = [user.id, ...(teamMembers.map(m => m.id)), ...connectionIds]
    
    const { data: sugg } = await db
      .from('profiles')
      .select('*')
      .not('id', 'in', `(${excludeIds.join(',')})`)
      .limit(10)
    
    setSuggestedUsers(sugg || [])
    
    setLoading(false)
  }, [db, teamMembers])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchMetrics()
  }, [fetchMetrics])

  const filterList = (list: Profile[]) => {
    return list.filter(u => 
      u.full_name?.toLowerCase().includes(search.toLowerCase()) || 
      u.course_name?.toLowerCase().includes(search.toLowerCase())
    )
  }

  return (
    <div className="page-fade" style={{ maxWidth: '1000px', margin: '0 auto', paddingBottom: '6rem' }}>
      
      {/* ── NETWORK HUD ────────────────────────────────────────────────── */}
      <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: '3rem', flexWrap: 'wrap', gap: '2rem' }}>
        <div>
          <h1 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 950, letterSpacing: '-0.06em', margin: 0, lineHeight: 0.9 }}>
            Peer Network
          </h1>
          <div style={{ display: 'flex', gap: '1.5rem', marginTop: '1.5rem' }}>
             <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-sub)', letterSpacing: '0.1em' }}>Global Community</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 950, color: 'var(--brand)' }}>{globalCount.toLocaleString()} <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>Peers</span></span>
             </div>
             <div style={{ display: 'flex', flexDirection: 'column' }}>
                <span style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-sub)', letterSpacing: '0.1em' }}>My Network</span>
                <span style={{ fontSize: '1.5rem', fontWeight: 950, color: 'var(--success)' }}>{personalNetwork.length} <span style={{ fontSize: '0.8rem', opacity: 0.5 }}>Connections</span></span>
             </div>
          </div>
        </div>

        <div style={{ width: '100%', maxWidth: '400px', position: 'relative' }}>
          <Search size={20} style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-sub)' }} />
          <input 
            type="text" 
            placeholder="Search scholars by name or course..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{ 
              width: '100%', 
              padding: '1rem 1rem 1rem 3.5rem', 
              borderRadius: '16px', 
              border: '1px solid var(--border)', 
              background: 'var(--surface)', 
              fontSize: '1rem',
              fontWeight: 600,
              boxShadow: 'var(--shadow-sm)',
              outline: 'none'
            }}
          />
        </div>
      </header>

      {/* ── NETWORK SECTIONS ───────────────────────────────────────────── */}
      <div style={{ display: 'flex', flexDirection: 'column', gap: '3rem' }}>
        
        {/* 1. Global Discovery */}
        <NetworkSection 
          title="Scholars you may know" 
          icon={<Compass size={18} />} 
          users={filterList(suggestedUsers)} 
          loading={loading}
          router={router}
          onlineUsers={onlineUsers}
        />

        {/* 2. My Peer Network */}
        <NetworkSection 
          title="My Peer Network" 
          icon={<Fingerprint size={18} />} 
          users={filterList(personalNetwork)} 
          loading={loading}
          router={router}
          onlineUsers={onlineUsers}
        />

        {/* 3. Team Members */}
        <NetworkSection 
          title="Team Roster" 
          icon={<Users size={18} />} 
          users={filterList(teamMembers)} 
          loading={loading}
          router={router}
          onlineUsers={onlineUsers}
        />

      </div>

      <style jsx>{`
        @keyframes fadeInHeader { from { opacity: 0; transform: translateY(-10px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </div>
  )
}

function NetworkSection({ title, icon, users, loading, router, onlineUsers }: { 
  title: string, 
  icon: React.ReactNode, 
  users: Profile[], 
  loading: boolean,
  router: { push: (url: string) => void },
  onlineUsers: Set<string>
}) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column' }}>
       <div style={{ 
         display: 'flex', 
         alignItems: 'center', 
         padding: '0.5rem 0.75rem', 
         borderBottom: '1px solid var(--border)',
         marginBottom: '0.75rem',
         gap: '0.75rem',
         background: 'rgba(var(--brand-rgb), 0.02)',
         borderRadius: '8px',
         color: 'var(--text-sub)'
       }}>
          <Search size={14} style={{ opacity: 0.5 }} />
          <h2 style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', margin: 0, flex: 1 }}>
            {title} <span style={{ opacity: 0.5, fontWeight: 700 }}>({users.length})</span>
          </h2>
          <div style={{ opacity: 0.6 }}>{icon}</div>
       </div>

       {loading ? (
         <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {[1, 2, 3].map(i => <div key={i} className="skeleton" style={{ height: '60px', borderRadius: '12px' }} />)}
         </div>
       ) : users.length === 0 ? (
          <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-sub)', fontSize: '0.85rem', background: 'var(--bg-sub)', borderRadius: '16px', border: '1px dashed var(--border)' }}>
             No peers identified in this sector.
          </div>
       ) : (
         <div style={{ display: 'flex', flexDirection: 'column' }}>
            {users.map(u => (
              <NetworkRow key={u.id} user={u} router={router} isOnline={onlineUsers.has(u.id)} />
            ))}
         </div>
       )}
    </div>
  )
}

function NetworkRow({ user, router, isOnline }: { user: Profile, router: { push: (url: string) => void }, isOnline: boolean }) {
  return (
    <div 
      className="network-row"
      style={{ 
        display: 'flex', 
        alignItems: 'center', 
        padding: '0.75rem 0', 
        borderBottom: '1px solid rgba(var(--text-main-rgb), 0.05)',
        transition: 'all 0.2s',
        gap: '1rem'
      }}
    >
      <div style={{ position: 'relative' }}>
        <div style={{ 
          width: '44px', 
          height: '44px', 
          borderRadius: '12px', 
          background: 'var(--bg-sub)', 
          border: '1px solid var(--border)', 
          display: 'flex', 
          alignItems: 'center', 
          justifyContent: 'center',
          overflow: 'hidden',
          fontSize: '0.9rem',
          fontWeight: 900,
          color: 'var(--brand)'
        }}>
          {user.avatar_url ? (
            <Image 
              src={user.avatar_url} 
              alt={user.full_name || 'Profile'} 
              width={44} 
              height={44} 
              style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
            />
          ) : user.full_name?.[0]}
        </div>
        {isOnline && (
           <div style={{ 
             position: 'absolute', 
             bottom: '-2px', 
             right: '-2px', 
             width: '12px', 
             height: '12px', 
             borderRadius: '50%', 
             background: 'var(--success)', 
             border: '2px solid var(--surface)',
             boxShadow: '0 0 10px var(--success)' 
           }} />
        )}
      </div>

      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ fontSize: '1rem', fontWeight: 850, color: 'var(--text-main)', lineHeight: 1.2 }}>{user.full_name}</div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-sub)', fontSize: '0.75rem', marginTop: '0.25rem' }}>
           <GraduationCap size={12} />
           <span style={{ fontWeight: 600, textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>{user.course_name || user.tagline || 'Academic Collaborator'}</span>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '0.5rem' }}>
        <button 
          onClick={() => router.push(`/dashboard/network/profile/${user.id}`)}
          className="btn-phonebook"
          style={{ 
            padding: '0.5rem 1rem', 
            borderRadius: '10px', 
            background: 'var(--bg-sub)', 
            border: '1px solid var(--border)', 
            fontSize: '0.75rem', 
            fontWeight: 800, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            color: 'var(--text-main)' 
          }}
        >
          <User size={14} />
          <span className="desktop-only">Profile</span>
        </button>
        <button 
          onClick={() => router.push(`/dashboard/network/chat/${user.id}`)}
          className="btn-phonebook"
          style={{ 
            padding: '0.5rem 1rem', 
            borderRadius: '10px', 
            background: 'var(--brand)', 
            border: 'none', 
            fontSize: '0.75rem', 
            fontWeight: 900, 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.5rem',
            color: 'white',
            boxShadow: '0 4px 10px rgba(var(--brand-rgb), 0.2)' 
          }}
        >
          <MessageSquare size={14} />
          <span className="desktop-only">Message</span>
        </button>
      </div>

      <style jsx>{`
        .network-row:hover {
           background: rgba(var(--brand-rgb), 0.02);
           padding-left: 0.5rem;
           padding-right: 0.5rem;
           border-radius: 12px;
        }
        @media (max-width: 600px) {
           .desktop-only { display: none; }
        }
      `}</style>
    </div>
  )
}
