'use client'

import { X, UserCircle, ShieldCheck, Target } from 'lucide-react'
import { MemberProfileModalProps } from '@/types/ui'

export default function MemberProfileModal({ member, groupMembers, tasks, onClose }: MemberProfileModalProps) {
  // Calculate verified CURRENT PROJECT EFFORT contribution %
  const calculateMemberEffort = (memberId: string) => {
    const completedTasks = tasks.filter(t => t.status === 'Done' && t.assignees?.includes(memberId)).length
    return completedTasks * 15 // Standardized score increment
  }

  const memberEffort = calculateMemberEffort(member.id)
  const totalGroupEffort = groupMembers.reduce((acc, m) => acc + calculateMemberEffort(m.id), 0)
  
  const contributionPercent = totalGroupEffort > 0 
    ? Math.round((memberEffort / totalGroupEffort) * 100) 
    : 0

  return (
    <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)', zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div 
        className="glass"
        style={{ 
          background: 'var(--surface)', 
          borderRadius: '24px', 
          width: '100%', 
          maxWidth: '450px', 
          overflow: 'hidden', 
          border: '1px solid var(--border)',
          boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)',
          animation: 'popIn 0.3s cubic-bezier(0.175, 0.885, 0.32, 1.275)'
        }}
      >
        {/* Header Visual */}
        <div style={{ height: '120px', background: 'linear-gradient(135deg, var(--brand), #4f46e5)', position: 'relative' }}>
           <button 
             onClick={onClose}
             style={{ position: 'absolute', top: '1rem', right: '1rem', background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: '50%', padding: '0.5rem', cursor: 'pointer', color: 'white' }}
           >
             <X size={20} />
           </button>
        </div>

        {/* Profile Info */}
        <div style={{ padding: '0 2rem 2.5rem', marginTop: '-45px', textAlign: 'center' }}>
           <div style={{ 
             width: '90px', 
             height: '90px', 
             borderRadius: '50%', 
             background: 'var(--surface)', 
             border: '4px solid var(--surface)', 
             boxShadow: 'var(--shadow-lg)',
             margin: '0 auto 1.5rem',
             overflow: 'hidden',
             display: 'flex',
             alignItems: 'center',
             justifyContent: 'center'
           }}>
              {member.avatar_url ? (
                <img src={member.avatar_url} alt={member.full_name || 'Member avatar'} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <UserCircle size={60} color="var(--text-sub)" />
              )}
           </div>

           <h2 style={{ fontSize: '1.75rem', fontWeight: 900, marginBottom: '0.25rem', letterSpacing: '-0.02em' }}>{member.full_name || 'Anonymous'}</h2>
           <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem' }}>
              <ShieldCheck size={14} /> Contact details are private
           </p>

           {/* Metrics Grid */}
           <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '2.5rem' }}>
              <div style={{ background: 'var(--bg-main)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--brand)', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <Target size={14} /> Contribution
                 </div>
                 <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)' }}>{contributionPercent}%</div>
              </div>
              <div style={{ background: 'var(--bg-main)', padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border)' }}>
                 <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--success)', marginBottom: '0.5rem', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase' }}>
                    <ShieldCheck size={14} /> Local Rank
                 </div>
                 <div style={{ fontSize: '2rem', fontWeight: 900, color: 'var(--text-main)' }}>{memberEffort}</div>
              </div>
           </div>

           {/* Progress Distribution */}
           <div style={{ textAlign: 'left' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.75rem', fontSize: '0.85rem', fontWeight: 700 }}>
                 <span>Team Impact Share</span>
                 <span style={{ color: 'var(--brand)' }}>{contributionPercent}%</span>
              </div>
              <div style={{ height: '8px', background: 'var(--bg-main)', borderRadius: '10px', overflow: 'hidden', border: '1px solid var(--border)' }}>
                 <div style={{ width: `${contributionPercent}%`, height: '100%', background: 'linear-gradient(90deg, var(--brand), #818cf8)', borderRadius: '10px' }} />
              </div>
              <p style={{ fontSize: '0.75rem', color: 'var(--text-sub)', marginTop: '0.75rem', lineHeight: 1.5 }}>
                 This verified metric calculates this collaborator&apos;s contribution effort relative to the CURRENT project performance, based on completed task nodes.
              </p>
           </div>
        </div>

        <div style={{ padding: '1.25rem', background: 'var(--bg-main)', borderTop: '1px solid var(--border)', textAlign: 'center' }}>
           <button 
             onClick={onClose}
             className="btn btn-primary" 
             style={{ width: 'auto', padding: '0.75rem 2rem', borderRadius: '12px' }}
           >
             Close Profile
           </button>
        </div>
      </div>

      <style jsx>{`
        @keyframes popIn {
          from { opacity: 0; transform: scale(0.9); }
          to { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  )
}
