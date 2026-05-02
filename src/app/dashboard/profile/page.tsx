'use client'

import { useState, useEffect, useMemo } from 'react'
import { db } from '@/lib/firebase'
import { 
  collection, 
  query, 
  where, 
  limit, 
  getDocs, 
  doc, 
  updateDoc 
} from 'firebase/firestore'
import Image from 'next/image'
import { User, Activity, Award, Mail, Calendar, ShieldCheck, Terminal, Fingerprint, Edit2, Check, X, Zap, Handshake, CheckCircle2, Globe, Target } from 'lucide-react'
import { useProfile } from '@/context/ProfileContext'
import { getFlagComponent } from '@/utils/geo'

export default function ProfilePage() {
   const { profile, loading, refreshProfile } = useProfile()
   const [isEditingBio, setIsEditingBio] = useState(false)
   const [bioText, setBioText] = useState('')
   const [isSaving, setIsSaving] = useState(false)
   const [achievements, setAchievements] = useState<any[]>([])

   useEffect(() => {
     async function fetchAchievements() {
       if (!profile?.id) return
       
       try {
         const artifactsSnap = await getDocs(query(
           collection(db, 'artifacts'),
           where('user_id', '==', profile.id),
           limit(3)
         ))
         
         const commitsSnap = await getDocs(query(
           collection(db, 'commits'),
           where('user_id', '==', profile.id),
           limit(3)
         ))

         const combined = [
           ...artifactsSnap.docs.map((d: any) => ({ type: 'artifact', id: d.id, ...d.data() })),
           ...commitsSnap.docs.map((d: any) => ({ type: 'commit', id: d.id, ...d.data() }))
         ]
         setAchievements(combined)
       } catch (err: any) {
         console.error('Fetch achievements error:', err.message)
       }
     }
     fetchAchievements()
   }, [profile?.id])

   const score = profile?.total_score || 0
   const levelData = useMemo(() => {
      if (score < 100) return { level: 1, name: 'Academic Novice', next: 100, color: '#94a3b8' }
      if (score < 500) return { level: 2, name: 'Project Contributor', next: 500, color: 'var(--success)' }
      if (score < 2000) return { level: 3, name: 'Senior Researcher', next: 2000, color: 'var(--brand)' }
      if (score < 5000) return { level: 4, name: 'Lead Analyst', next: 5000, color: 'var(--accent)' }
      return { level: 5, name: 'Principal Scholar', next: 10000, color: '#fbbf24' }
   }, [score])

   const progressToNext = Math.min(100, Math.round((score / levelData.next) * 100))

   useEffect(() => {
      if (profile?.biography) {
         setBioText(profile.biography)
      }
   }, [profile?.biography])

   const handleSaveBio = async () => {
      if (!profile) return
      setIsSaving(true)
      
      try {
        await updateDoc(doc(db, 'profiles', profile.id), { biography: bioText })
        await refreshProfile()
        setIsEditingBio(false)
      } catch (err: any) {
        console.error('Save bio error:', err.message)
      }
      setIsSaving(false)
   }

   if (loading) {
      return (
         <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '60vh', color: 'var(--text-sub)' }}>
            <div style={{ textAlign: 'center' }}>
               <div className="spinner" style={{ border: '3px solid var(--border)', borderTop: '3px solid var(--brand)', borderRadius: '50%', width: '30px', height: '30px', animation: 'spin 1s linear infinite', margin: '0 auto 1rem' }} />
               <span>Loading Identity...</span>
            </div>
         </div>
      )
   }

   return (
      <div style={{ maxWidth: '1200px', margin: '0 auto', padding: '0 var(--p-safe) 4rem', animation: 'fadeIn 0.5s ease-out' }}>

         {/* Identity Hub Header */}
          <div className={`profile-header-card ${profile?.subscription_plan === 'premium' ? 'glow-premium' : profile?.subscription_plan === 'pro' ? 'glow-pro' : ''}`} style={{ 
            maxWidth: '100%', 
            marginBottom: 'var(--gap-lg)', 
            padding: 'var(--section-p)', 
            position: 'relative', 
            overflow: 'hidden', 
            background: 'var(--surface)', 
            borderRadius: '24px', 
            border: profile?.subscription_plan === 'premium' ? '2px solid var(--gold-primary)' : profile?.subscription_plan === 'pro' ? '2px solid var(--pro-cobalt)' : '1px solid var(--border)', 
            boxShadow: profile?.subscription_plan === 'premium' ? '0 0 40px rgba(212, 175, 55, 0.25)' : profile?.subscription_plan === 'pro' ? '0 0 30px rgba(26, 115, 232, 0.15)' : 'var(--shadow-lg)',
            transition: 'all 0.5s cubic-bezier(0.4, 0, 0.2, 1)'
          }}>
            {profile?.subscription_plan === 'premium' && (
              <div style={{ position: 'absolute', top: 0, right: 0, width: '100%', height: '100%', background: 'linear-gradient(135deg, rgba(212, 175, 55, 0.05) 0%, transparent 100%)', pointerEvents: 'none' }} />
            )}
            <div style={{ position: 'absolute', top: 0, right: 0, width: '250px', height: '250px', background: profile?.subscription_plan === 'premium' ? 'radial-gradient(circle, #d4af37 0%, transparent 70%)' : 'radial-gradient(circle, var(--brand) 0%, transparent 70%)', opacity: 0.1, filter: 'blur(50px)' }} />

            <div style={{ display: 'flex', alignItems: 'center', gap: 'var(--gap-lg)', flexWrap: 'wrap', justifyContent: 'center', textAlign: 'center' }}>
               <div style={{ position: 'relative' }}>
                  <div style={{ width: '130px', height: '130px', borderRadius: '50%', background: 'var(--bg-sub)', border: profile?.subscription_plan === 'premium' ? '4px solid #d4af37' : profile?.subscription_plan === 'pro' ? '4px solid var(--pro-cobalt)' : '4px solid var(--surface)', boxShadow: profile?.subscription_plan === 'premium' ? '0 0 25px rgba(212, 175, 55, 0.5)' : profile?.subscription_plan === 'pro' ? '0 0 20px rgba(26, 115, 232, 0.4)' : 'var(--shadow-md)', display: 'flex', alignItems: 'center', justifyContent: 'center', overflow: 'hidden' }}>
                     {profile?.avatar_url ? (
                        <Image 
                           src={profile.avatar_url} 
                           alt={`${profile.full_name || 'User'} avatar`} 
                           width={130} 
                           height={130} 
                           priority
                           style={{ width: '100%', height: '100%', objectFit: 'cover' }} 
                        />
                     ) : (
                        <User size={60} color="var(--text-sub)" />
                     )}
                  </div>
                  <div style={{ position: 'absolute', bottom: '10px', right: '10px', width: '22px', height: '22px', borderRadius: '50%', background: 'var(--success)', border: '3px solid var(--surface)', boxShadow: '0 0 10px var(--success)' }} />
               </div>

                 <div style={{ flex: '1 1 320px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', justifyContent: 'center', marginBottom: '0.5rem' }}>
                        <h1 className="fluid-h1" style={{ fontWeight: 950, margin: 0, fontSize: '2.5rem', letterSpacing: '-0.04em', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                          {profile?.full_name}
                          {(() => {
                            const Flag = getFlagComponent((profile as { country_code?: string })?.country_code)
                            // eslint-disable-next-line react-hooks/static-components
                            return Flag ? <div style={{ width: '32px', height: '20px', borderRadius: '4px', overflow: 'hidden', boxShadow: '0 4px 10px rgba(0,0,0,0.1)' }}><Flag /></div> : null
                          })()}
                        </h1>
                        {profile?.subscription_plan === 'premium' && (
                          <div className="locked-badge locked-badge-premium glow-premium" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 16px', fontSize: '0.75rem' }}>
                            <Award size={14} /> PREMIUM ARCHITECT
                          </div>
                        )}
                        {profile?.subscription_plan === 'pro' && (
                          <div className="locked-badge locked-badge-pro glow-pro" style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '6px 16px', fontSize: '0.75rem' }}>
                            <Zap size={14} /> PRO ANALYST
                          </div>
                        )}
                    </div>
                    {profile?.tagline && (
                       <p style={{ fontSize: '1rem', color: 'var(--brand)', fontStyle: 'italic', margin: '0.4rem 0 0.75rem', fontWeight: 800 }}>
                          &quot;{profile.tagline}&quot;
                       </p>
                    )}
                    <p style={{ color: 'var(--text-sub)', fontSize: '1rem', margin: '0.5rem 0 1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap', fontWeight: 700 }}>
                      <ShieldCheck size={18} color="var(--brand)" />
                      {profile?.course_name || 'Project Analyst'} &bull; {(profile as { role?: string })?.role || 'Team Member'}
                    </p>
                   <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', justifyContent: 'center' }}>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-sub)', background: 'var(--bg-sub)', padding: '0.4rem 0.8rem', borderRadius: '50px', border: '1px solid var(--border)', fontWeight: 700 }}>
                         <Mail size={14} /> {profile?.email}
                      </span>
                      <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.75rem', color: 'var(--text-sub)', background: 'var(--bg-sub)', padding: '0.4rem 0.8rem', borderRadius: '50px', border: '1px solid var(--border)', fontWeight: 700 }}>
                         <Calendar size={14} /> Joined {profile?.created_at ? new Date(profile.created_at).toLocaleDateString(undefined, { month: 'short', year: 'numeric' }) : 'N/A'}
                      </span>
                   </div>
                </div>
             </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 'var(--gap-md)' }}>
             {/* Left Column: Stats & Meta */}
             <div style={{ display: 'flex', flexDirection: 'column', gap: 'var(--gap-md)' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 'var(--gap-md)' }}>
                   <div style={{ background: 'var(--brand)', color: 'white', borderRadius: '24px', padding: '1.5rem', display: 'flex', flexDirection: 'column', justifyContent: 'center', minHeight: '140px', boxShadow: '0 8px 16px rgba(var(--brand-rgb), 0.2)' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', opacity: 0.8, marginBottom: '0.5rem' }}>
                         <Activity size={18} />
                         <span style={{ fontSize: '0.7rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '1px' }}>Team Points</span>
                      </div>
                      <div style={{ fontSize: '2.5rem', fontWeight: 950, lineHeight: 1, letterSpacing: '-0.04em' }}>{profile?.total_score || 0}</div>
                      <p style={{ fontSize: '0.75rem', opacity: 0.8, marginTop: '0.6rem', fontWeight: 700 }}>Academic Contribution</p>
                   </div>

                    <div style={{ background: 'var(--surface)', borderRadius: '24px', padding: '1.5rem', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '0.75rem', justifyContent: 'center' }}>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: 'var(--text-sub)', fontSize: '0.75rem', fontWeight: 850, textTransform: 'uppercase' }}>Standing</span>
                          <span style={{ fontWeight: 950, fontSize: '0.9rem', color: levelData.color }}>{levelData.name}</span>
                       </div>
                       <div style={{ background: 'var(--bg-sub)', height: '6px', borderRadius: '3px', overflow: 'hidden', position: 'relative' }}>
                          <div style={{ position: 'absolute', top: 0, left: 0, height: '100%', width: `${progressToNext}%`, background: levelData.color, transition: 'width 1s ease-out' }} />
                       </div>
                       <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                          <span style={{ color: 'var(--text-sub)', fontSize: '0.75rem', fontWeight: 850 }}>ID#</span>
                          <span style={{ fontWeight: 800, fontSize: '0.9rem', color: 'var(--text-main)' }}>{profile?.school_id || 'U-ID-01'}</span>
                       </div>
                    </div>
                </div>

                <div className="card-item" style={{ background: 'var(--surface)', borderRadius: '24px', padding: '2rem', border: '1px solid var(--border)' }}>
                   <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                      <h3 style={{ fontSize: '0.85rem', margin: 0, display: 'flex', alignItems: 'center', gap: '0.6rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-sub)', letterSpacing: '0.05em' }}>
                         <Fingerprint size={16} color="var(--brand)" /> 
                         Personal Bio
                      </h3>
                      {!isEditingBio ? (
                         <button onClick={() => setIsEditingBio(true)} style={{ background: 'none', border: 'none', color: 'var(--brand)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 800 }}>EDIT</button>
                      ) : (
                         <div style={{ display: 'flex', gap: '0.75rem' }}>
                            <button onClick={handleSaveBio} disabled={isSaving} style={{ background: 'none', border: 'none', color: 'var(--success)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 900 }}>SAVE</button>
                            <button onClick={() => setIsEditingBio(false)} style={{ background: 'none', border: 'none', color: 'var(--error)', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 900 }}>CANCEL</button>
                         </div>
                      )}
                   </div>
                   {isEditingBio ? (
                      <textarea value={bioText} onChange={(e) => setBioText(e.target.value)} rows={4} style={{ width: '100%', padding: '1rem', background: 'var(--bg-sub)', border: '1px solid var(--border)', borderRadius: '12px', color: 'var(--text-main)', fontSize: '0.95rem', outline: 'none', resize: 'none' }} />
                   ) : (
                      <p style={{ margin: 0, fontSize: '0.95rem', color: 'var(--text-main)', lineHeight: 1.6 }}>{profile?.biography || `Student collaborator participating in institutional group projects.`}</p>
                   )}
                </div>
             </div>

              {/* Right Column: Achievements & Credentials */}
              <div className="card-item" style={{ background: 'var(--surface)', borderRadius: '24px', padding: '2rem', border: '1px solid var(--border)' }}>
                 <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem' }}>
                    <h3 style={{ fontSize: '1.1rem', fontWeight: 950, margin: 0, display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                       <Award size={24} color="var(--brand)" />
                       Verifiable Accomplishments
                    </h3>
                    <div style={{ fontSize: '0.7rem', fontWeight: 900, background: 'rgba(var(--brand-rgb), 0.1)', color: 'var(--brand)', padding: '4px 10px', borderRadius: '8px' }}>
                      {profile?.badges_count || 0} Badges
                    </div>
                 </div>

                 <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {achievements.length > 0 ? achievements.map((ach, idx) => (
                      <div key={idx} style={{ padding: '1.25rem', background: 'rgba(var(--brand-rgb), 0.02)', borderRadius: '20px', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem', transition: 'all 0.2s' }}>
                        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: ach.type === 'artifact' ? 'rgba(var(--brand-rgb), 0.1)' : 'rgba(34, 197, 94, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                          {ach.type === 'artifact' ? <Target size={20} color="var(--brand)" /> : <CheckCircle2 size={20} color="var(--success)" />}
                        </div>
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.95rem', fontWeight: 800, color: 'var(--text-main)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{ach.title || ach.content || 'Contribution'}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', marginTop: '2px', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                            {ach.type === 'artifact' ? 'Academic Evidence' : 'Protocol Synchronization'} &bull; {new Date(ach.created_at).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                    )) : (
                      <div style={{ padding: '4rem 2rem', textAlign: 'center', color: 'var(--text-sub)', border: '1px dashed var(--border)', borderRadius: '24px' }}>
                         <Award size={48} style={{ opacity: 0.1, marginBottom: '1.5rem' }} />
                         <p style={{ fontSize: '0.9rem', fontWeight: 700, margin: 0 }}>Identity pending credential sync.</p>
                         <p style={{ fontSize: '0.75rem', marginTop: '0.5rem', opacity: 0.7 }}>Contribute to artifacts or push commits to build your wall.</p>
                      </div>
                    )}
                 </div>
              </div>
          </div>

          <style jsx>{`
             @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
             .premium-aura {
               animation: auraPulse 4s infinite alternate ease-in-out;
             }
             @keyframes auraPulse {
               0% { box-shadow: 0 0 20px rgba(212, 175, 55, 0.1); }
               100% { box-shadow: 0 0 40px rgba(212, 175, 55, 0.3); }
             }
          `}</style>
      </div>
   )
}
