'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { createWorkspaceTeam, joinWorkspaceTeam } from '@/app/onboarding/actions'
import { Users, Plus, ArrowRight, ShieldCheck, Sparkles, UserCircle } from 'lucide-react'

export default function WelcomeOnboarding() {
  const router = useRouter()
  const [view, setView] = useState<'welcome' | 'create' | 'join'>('welcome')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  
  // Create state
  const [teamName, setTeamName] = useState('')
  const [teamDesc, setTeamDesc] = useState('')
  
  // Join state
  const [teamId, setTeamId] = useState('')

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const result = await createWorkspaceTeam(teamName, teamDesc)
      if (result.error) {
        setError(result.error)
        return
      }
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to create team')
    } finally {
      setLoading(false)
    }
  }

  const handleJoin = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)
    try {
      const result = await joinWorkspaceTeam(teamId)
      if (result.error) {
        setError(result.error)
        return
      }
      router.refresh()
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Failed to join team. Check the Team ID.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="onboarding-container" style={{
      minHeight: '80vh',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '2rem'
    }}>
      <div className="onboarding-card" style={{
        width: '100%',
        maxWidth: '550px',
        background: 'rgba(24, 24, 27, 0.4)',
        backdropFilter: 'blur(20px)',
        border: '1px solid rgba(255, 255, 255, 0.08)',
        borderRadius: '32px',
        padding: '3rem',
        boxShadow: '0 40px 100px rgba(0, 0, 0, 0.6)',
        textAlign: 'center',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Glow effect */}
        <div style={{ position: 'absolute', top: '-100px', left: '-100px', width: '250px', height: '250px', background: 'var(--brand)', filter: 'blur(120px)', opacity: 0.15, pointerEvents: 'none' }} />

        {view === 'welcome' && (
          <div className="animate-in">
            <div style={{ 
              width: '80px', 
              height: '80px', 
              background: 'rgba(var(--brand-rgb), 0.15)', 
              borderRadius: '24px', 
              display: 'flex', 
              alignItems: 'center', 
              justifyContent: 'center', 
              margin: '0 auto 2rem',
              border: '1px solid rgba(var(--brand-rgb), 0.3)',
              color: 'var(--brand)'
            }}>
              <Sparkles size={40} />
            </div>
            
            <h1 style={{ fontSize: '2.5rem', fontWeight: 950, letterSpacing: '-0.04em', color: '#fff', marginBottom: '1rem' }}>
              Set up your team workspace
            </h1>
            <p style={{ color: 'var(--text-sub)', fontSize: '1.1rem', marginBottom: '3rem', lineHeight: 1.6 }}>
              Your account is not linked to a team yet. Create a workspace for your course project, or join an existing team with an invitation code.
            </p>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              <button 
                onClick={() => setView('create')}
                style={{
                  background: 'var(--brand)',
                  color: 'white',
                  padding: '1.25rem',
                  borderRadius: '16px',
                  border: 'none',
                  fontWeight: 900,
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  transition: 'all 0.3s ease'
                }}
              >
                <Plus size={20} strokeWidth={3} /> Create New Team
              </button>
              
              <button 
                onClick={() => setView('join')}
                style={{
                  background: 'rgba(255, 255, 255, 0.03)',
                  color: '#fff',
                  padding: '1.25rem',
                  borderRadius: '16px',
                  border: '1px solid rgba(255, 255, 255, 0.1)',
                  fontWeight: 900,
                  fontSize: '1.1rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.75rem',
                  transition: 'all 0.3s ease'
                }}
              >
                <Users size={20} /> Join Existing Team
              </button>

              <button
                type="button"
                onClick={() => router.push('/profile')}
                data-testid="onboarding-personal-profile"
                style={{
                  background: 'transparent',
                  color: '#93c5fd',
                  padding: '0.9rem 1rem',
                  borderRadius: '14px',
                  border: '1px solid rgba(59, 130, 246, 0.35)',
                  fontWeight: 800,
                  fontSize: '0.95rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                <UserCircle size={18} aria-hidden />
                Personal profile first
              </button>
            </div>
            
            <div style={{ marginTop: '2.5rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem', color: '#6ee7b7', fontSize: '0.9rem', fontWeight: 700 }}>
              <ShieldCheck size={16} /> Secure academic workspace
            </div>
          </div>
        )}

        {view === 'create' && (
          <div className="animate-in">
            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', marginBottom: '0.5rem', textAlign: 'left' }}>
              Launch your team
            </h2>
            <p style={{ color: 'var(--text-sub)', fontSize: '1rem', marginBottom: '2rem', textAlign: 'left' }}>
              Define your workspace. You&apos;ll be the Team Owner.
            </p>

            {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.9rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{error}</div>}

            <form onSubmit={handleCreate} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.5rem' }}>Team Name</label>
                <input 
                  autoFocus
                  required
                  type="text" 
                  value={teamName}
                  onChange={e => setTeamName(e.target.value)}
                  placeholder="e.g. Capstone Alpha"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '1rem', color: '#fff', outline: 'none' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.5rem' }}>Description (Optional)</label>
                <textarea 
                  value={teamDesc}
                  onChange={e => setTeamDesc(e.target.value)}
                  placeholder="What is this team building?"
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '1rem', color: '#fff', outline: 'none', minHeight: '100px', resize: 'none' }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setView('welcome')} style={{ flex: 1, padding: '1rem', borderRadius: '14px', background: 'transparent', color: 'var(--text-sub)', border: '1px solid var(--border)', fontWeight: 800, cursor: 'pointer' }}>Back</button>
                <button type="submit" disabled={loading} style={{ flex: 2, padding: '1rem', borderRadius: '14px', background: 'var(--brand)', color: 'white', border: 'none', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  {loading ? 'Launching...' : <>Start Team <ArrowRight size={18} /></>}
                </button>
              </div>
            </form>
          </div>
        )}

        {view === 'join' && (
          <div className="animate-in">
            <h2 style={{ fontSize: '1.75rem', fontWeight: 900, color: '#fff', marginBottom: '0.5rem', textAlign: 'left' }}>
              Connect to Team
            </h2>
            <p style={{ color: 'var(--text-sub)', fontSize: '1rem', marginBottom: '2rem', textAlign: 'left' }}>
              Enter the unique Team ID shared by your teammate.
            </p>

            {error && <div style={{ background: 'rgba(239, 68, 68, 0.1)', color: '#fca5a5', padding: '1rem', borderRadius: '12px', marginBottom: '1.5rem', fontSize: '0.9rem', border: '1px solid rgba(239, 68, 68, 0.2)' }}>{error}</div>}

            <form onSubmit={handleJoin} style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem', textAlign: 'left' }}>
              <div>
                <label style={{ fontSize: '0.75rem', fontWeight: 900, color: 'var(--text-sub)', textTransform: 'uppercase', letterSpacing: '0.08em', display: 'block', marginBottom: '0.5rem' }}>Team ID</label>
                <input 
                  autoFocus
                  required
                  type="text" 
                  value={teamId}
                  onChange={e => setTeamId(e.target.value)}
                  placeholder="Paste UUID here..."
                  style={{ width: '100%', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', borderRadius: '14px', padding: '1rem', color: '#fff', outline: 'none', fontFamily: 'monospace' }}
                />
              </div>
              
              <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
                <button type="button" onClick={() => setView('welcome')} style={{ flex: 1, padding: '1rem', borderRadius: '14px', background: 'transparent', color: 'var(--text-sub)', border: '1px solid var(--border)', fontWeight: 800, cursor: 'pointer' }}>Back</button>
                <button type="submit" disabled={loading} style={{ flex: 2, padding: '1rem', borderRadius: '14px', background: 'var(--brand)', color: 'white', border: 'none', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
                  {loading ? 'Verifying...' : <>Join Project <ArrowRight size={18} /></>}
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <style jsx>{`
        .animate-in {
          animation: slideUp 0.6s cubic-bezier(0.23, 1, 0.32, 1) forwards;
        }
        @keyframes slideUp {
          from { opacity: 0; transform: translateY(20px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  )
}
