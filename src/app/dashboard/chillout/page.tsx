'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { db } from '@/lib/firebase'
import { 
  doc, 
  getDoc, 
  setDoc, 
  collection, 
  query, 
  where, 
  getDocs,
  documentId,
  addDoc
} from 'firebase/firestore'
import { 
  Sparkles, 
  Gamepad2, 
  Users, 
  BrainCircuit, 
  ShieldCheck, 
  Terminal, 
  Zap,
  CheckCircle2,
  Play,
  Loader2,
  Dna,
  Cpu,
  RefreshCw
} from 'lucide-react'
import { useProfile } from '@/context/ProfileContext'
import { usePresence } from '@/components/PresenceProvider'
import { useNotifications } from '@/components/NotificationProvider'
import { useSmartLoading } from '@/components/GlobalLoadingProvider'

import { motion, AnimatePresence } from 'framer-motion'

const TOPICS = [
  { 
    id: 'cyber_ethics', 
    name: 'Cyber Ethics & Law', 
    icon: ShieldCheck, 
    color: 'var(--error)',
    description: 'Master the legal landscape of the digital academic frontier.'
  },
  { 
    id: 'logic_puzzles', 
    name: 'Algorithmic Riddles', 
    icon: BrainCircuit, 
    color: 'var(--brand)',
    description: 'Test your raw logic with complex computing patterns.'
  },
  { 
    id: 'pop_culture', 
    name: 'Digital History', 
    icon: Gamepad2, 
    color: 'var(--success)',
    description: 'From Turing to Jobs: The history of the digital era.'
  },
  { 
    id: 'institutional', 
    name: 'Espeezy Protocols', 
    icon: Terminal, 
    color: 'var(--accent)',
    description: "Deep dive into the app's advanced governance."
  }
]

export default function ChillOutHub() {
  const router = useRouter()
  const { profile } = useProfile()
  const { onlineUsers } = usePresence()
  const { addToast } = useNotifications()
  const { withLoading } = useSmartLoading()

  const [step, setStep] = useState(1) // 1: Topic, 2: Config, 3: Preview, 4: Players
  const [selectedTopic, setSelectedTopic] = useState<typeof TOPICS[0] | null>(null)
  
  // Config State
  const [difficulty, setDifficulty] = useState<'Easy' | 'Medium' | 'Hard'>('Medium')
  const [gameMode, setGameMode] = useState<'Speed Recall' | 'AI Evaluated'>('Speed Recall')
  const [roundCount, setRoundCount] = useState<number>(5)
  
  const [isGenerating, setIsGenerating] = useState(false)
  const [questions, setQuestions] = useState<any[]>([])
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [onlineProfiles, setOnlineProfiles] = useState<any[]>([])
  const [userStats, setUserStats] = useState<any | null>(null)

  // 1. Fetch Stats & Profiles
  useEffect(() => {
    async function fetchData() {
      if (!profile?.id) return

      try {
        // Fetch User Stats
        const statsRef = doc(db, 'user_game_stats', profile.id)
        const statsSnap = await getDoc(statsRef)
        
        if (!statsSnap.exists()) {
          const newStats = { user_id: profile.id, total_xp: 0, level: 1 }
          await setDoc(statsRef, newStats)
          setUserStats(newStats)
        } else {
          setUserStats(statsSnap.data())
        }

        // Fetch Online Profiles
        if (onlineUsers.size > 0) {
          const ids = Array.from(onlineUsers)
          const profilesSnap = await getDocs(query(
            collection(db, 'profiles'),
            where(documentId(), 'in', ids.slice(0, 10)) // Firestore limit
          ))
          
          const profilesData = profilesSnap.docs.map(d => ({ id: d.id, ...d.data() }))
          setOnlineProfiles(profilesData.filter((p: any) => p.id !== profile?.id))
        }
      } catch (err: any) {
        console.error('Fetch data error:', err.message)
      }
    }
    fetchData()
  }, [onlineUsers, profile?.id])

  // 2. AI Synthesis
  const handleTopicSelect = (topic: typeof TOPICS[0]) => {
    setSelectedTopic(topic)
    setStep(2)
  }

  const handleInitializeQuestions = async () => {
    setIsGenerating(true)
    try {
      const res = await fetch('/api/ai/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: selectedTopic?.name,
          difficulty,
          mode: gameMode,
          count: roundCount
        })
      })
      const data = await res.json()
      if (data.questions) {
        setQuestions(data.questions)
        setStep(3)
      } else {
        throw new Error(data.error || 'Synthesis error')
      }
    } catch (err: unknown) {
      addToast('Sync Failure', (err instanceof Error ? err.message : 'Unknown error'), 'error')
    } finally {
      setIsGenerating(false)
    }
  }

  const togglePlayer = (id: string) => {
    setSelectedPlayers(prev => 
      prev.includes(id) ? prev.filter(p => p !== id) : [...prev, id]
    )
  }

  const handleStartGame = async () => {
    if (selectedPlayers.length === 0) {
      addToast('No Players', 'You must invite at least one online peer.', 'warning')
      return
    }

    const roomId = `skirmish_${Date.now()}`
    
    await withLoading(async () => {
      // 1. Create Game Session in Firestore
      await addDoc(collection(db, 'game_sessions'), {
        room_id: roomId,
        creator_id: profile?.id,
        topic_id: selectedTopic?.id,
        difficulty,
        mode: gameMode,
        created_at: new Date().toISOString()
      })

      // 2. Send Notifications
      for (const playerId of selectedPlayers) {
        await addDoc(collection(db, 'notifications'), {
          user_id: playerId,
          type: 'skirmish_invite',
          title: 'SKIRMISH DETECTED',
          message: `${profile?.full_name || 'A Peer'} challenged you to ${difficulty} ${selectedTopic?.name}.`,
          metadata: { room_id: roomId, topic_id: selectedTopic?.id, mode: gameMode, questions },
          created_at: new Date().toISOString()
        })
      }
      
      // 3. SECURE HAND-OFF: Save questions for the room to pick up
      if (typeof window !== 'undefined') {
        sessionStorage.setItem(`skirmish_setup_${roomId}`, JSON.stringify({ questions, config: { difficulty, mode: gameMode } }))
      }
      
      router.push(`/dashboard/chillout/room/${roomId}?id=${roomId}`)
    }, 'Initializing Competitive Flux...')
  }

  return (
    <div className="page-fade" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', paddingBottom: '4rem' }}>
      
      {/* ── STATS HUD ─────────────────────────────────────────── */}
      <AnimatePresence>
        <motion.div 
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--surface)', padding: '1.25rem 2rem', borderRadius: '24px', border: '1px solid var(--border)', boxShadow: 'var(--shadow-sm)' }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
             <div style={{ position: 'relative' }}>
                <div style={{ width: '60px', height: '60px', borderRadius: '18px', background: 'linear-gradient(135deg, var(--brand), #8b5cf6)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 950, fontSize: '1.5rem', boxShadow: '0 8px 16px rgba(var(--brand-rgb), 0.3)' }}>
                  {userStats?.level || 1}
                </div>
                <div style={{ position: 'absolute', bottom: -5, left: '50%', transform: 'translateX(-50%)', background: 'var(--brand)', color: 'white', padding: '2px 8px', borderRadius: '6px', fontSize: '0.6rem', fontWeight: 900, whiteSpace: 'nowrap' }}>LVL</div>
             </div>
             <div>
                <h4 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 950, letterSpacing: '-0.02em' }}>{userStats?.rank_title || 'Novice Scholar'}</h4>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginTop: '0.4rem' }}>
                   <div style={{ width: '200px', height: '6px', background: 'var(--bg-main)', borderRadius: '10px', overflow: 'hidden' }}>
                      <motion.div 
                        initial={{ width: 0 }} 
                        animate={{ width: `${(userStats?.total_xp % 100)}%` }}
                        style={{ height: '100%', background: 'var(--brand)' }} 
                      />
                   </div>
                   <span style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-sub)' }}>{userStats?.total_xp || 0} XP Total</span>
                </div>
             </div>
          </div>
          <div style={{ display: 'flex', gap: '2rem' }}>
             <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 950 }}>{userStats?.wins || 0}</div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-sub)', textTransform: 'uppercase' }}>Wins</div>
             </div>
             <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '1.25rem', fontWeight: 950 }}>{userStats?.games_played || 0}</div>
                <div style={{ fontSize: '0.65rem', fontWeight: 700, color: 'var(--text-sub)', textTransform: 'uppercase' }}>Battles</div>
             </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* ── HEADER ────────────────────────────────────────────── */}
      <header>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <div style={{ padding: '0.75rem', borderRadius: '14px', background: 'rgba(var(--brand-rgb), 0.1)', color: 'var(--brand)' }}>
             <Sparkles size={32} />
          </div>
          <div>
            <h1 style={{ fontSize: '2.25rem', fontWeight: 950, letterSpacing: '-0.04em', margin: 0 }}>
              Chill Out <span style={{ color: 'var(--brand)' }}>Zone</span>
            </h1>
            <p style={{ color: 'var(--text-sub)', fontWeight: 600, fontSize: '0.9rem' }}>Decompress and dominate with real-time academic skirmishes.</p>
          </div>
        </div>
      </header>

      {/* ── CONTENT RENDERING ────────────────────────────────────── */}
      {isGenerating ? (
        <div style={{ height: '400px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
          <motion.div animate={{ rotate: 360 }} transition={{ repeat: Infinity, duration: 4, ease: "linear" }}>
             <Dna size={80} style={{ color: 'var(--brand)' }} />
          </motion.div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 950, letterSpacing: '-0.03em', marginBottom: '0.5rem', marginTop: '2rem' }}>Synthesizing Shards</h2>
          <p style={{ color: 'var(--text-sub)', fontWeight: 700, fontSize: '0.85rem' }}>Constructing {difficulty} logic for {selectedTopic?.name}...</p>
        </div>
      ) : (
        <AnimatePresence mode="wait">
          {step === 1 && (
            <motion.div 
              key="step1" 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -20 }}
              style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1.5rem' }}
            >
              {TOPICS.map(topic => (
                <button 
                  key={topic.id}
                  onClick={() => handleTopicSelect(topic)}
                  className="glass hover-card"
                  style={{ padding: '2rem', borderRadius: '24px', border: '1px solid var(--border)', textAlign: 'left', background: 'var(--surface)', cursor: 'pointer', display: 'flex', flexDirection: 'column', gap: '1rem' }}
                >
                  <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: `rgba(${topic.id === 'cyber_ethics' ? '239, 68, 68' : 'var(--brand-rgb)'}, 0.1)`, color: topic.color, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                     <topic.icon size={28} />
                  </div>
                  <div>
                    <h3 style={{ margin: 0, fontSize: '1.25rem', fontWeight: 900, letterSpacing: '-0.02em', color: 'var(--text-main)' }}>{topic.name}</h3>
                    <p style={{ margin: '0.5rem 0 0', fontSize: '0.85rem', color: 'var(--text-sub)', lineHeight: 1.5, fontWeight: 500 }}>{topic.description}</p>
                  </div>
                </button>
              ))}
            </motion.div>
          )}

          {step === 2 && (
            <motion.div 
              key="step2" 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -20 }}
              style={{ background: 'var(--surface)', borderRadius: '32px', border: '1px solid var(--border)', padding: '2.5rem', maxWidth: '800px', margin: '0 auto', width: '100%' }}
            >
               <h2 style={{ fontSize: '1.75rem', fontWeight: 950, marginBottom: '2rem' }}>Configure Skirmish</h2>
               
               <div style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}>
                  {/* Difficulty */}
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-sub)', display: 'block', marginBottom: '1rem' }}>Challenge Level</label>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                       {['Easy', 'Medium', 'Hard'].map(d => (
                         <button key={d} onClick={() => setDifficulty(d as 'Easy' | 'Medium' | 'Hard')} style={{ flex: 1, padding: '1rem', borderRadius: '14px', border: '2px solid', borderColor: difficulty === d ? 'var(--brand)' : 'var(--border)', background: difficulty === d ? 'rgba(var(--brand-rgb), 0.05)' : 'var(--bg-sub)', color: difficulty === d ? 'var(--text-main)' : 'var(--text-sub)', fontWeight: 900, cursor: 'pointer', transition: '0.2s' }}>{d}</button>
                       ))}
                    </div>
                  </div>

                  {/* Mode */}
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-sub)', display: 'block', marginBottom: '1rem' }}>Grading Protocol</label>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                       {['Speed Recall', 'AI Evaluated'].map(m => (
                         <button key={m} onClick={() => setGameMode(m as 'Speed Recall' | 'AI Evaluated')} style={{ flex: 1, padding: '1rem', borderRadius: '14px', border: '2px solid', borderColor: gameMode === m ? 'var(--brand)' : 'var(--border)', background: gameMode === m ? 'rgba(var(--brand-rgb), 0.05)' : 'var(--bg-sub)', color: gameMode === m ? 'var(--text-main)' : 'var(--text-sub)', fontWeight: 900, cursor: 'pointer', transition: '0.2s', textAlign: 'left' }}>
                            <div style={{ fontWeight: 950 }}>{m}</div>
                            <div style={{ fontSize: '0.65rem', opacity: 0.6, marginTop: '2px' }}>{m === 'Speed Recall' ? 'Reveal & choices' : 'Text input + AI Grade'}</div>
                         </button>
                       ))}
                    </div>
                  </div>

                  {/* Rounds */}
                  <div>
                    <label style={{ fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-sub)', display: 'block', marginBottom: '1rem' }}>Skirmish Depth</label>
                    <div style={{ display: 'flex', gap: '0.75rem' }}>
                       {[3, 5, 10].map(r => (
                         <button key={r} onClick={() => setRoundCount(r)} style={{ flex: 1, padding: '1rem', borderRadius: '14px', border: '2px solid', borderColor: roundCount === r ? 'var(--brand)' : 'var(--border)', background: roundCount === r ? 'rgba(var(--brand-rgb), 0.05)' : 'var(--bg-sub)', color: roundCount === r ? 'var(--text-main)' : 'var(--text-sub)', fontWeight: 900, cursor: 'pointer', transition: '0.2s' }}>{r} Rounds</button>
                       ))}
                    </div>
                  </div>
               </div>

               <div style={{ display: 'flex', gap: '1rem', marginTop: '3rem' }}>
                  <button onClick={() => setStep(1)} className="btn btn-secondary" style={{ flex: 1 }}>Back</button>
                  <button onClick={handleInitializeQuestions} className="btn btn-primary" style={{ flex: 2, fontWeight: 950 }}>INITIALIZE AI ENGINE</button>
               </div>
            </motion.div>
          )}

          {step === 3 && (
            <motion.div 
              key="step3" 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              exit={{ opacity: 0, x: -20 }}
              style={{ background: 'var(--surface)', borderRadius: '24px', border: '1px solid var(--border)', padding: '2rem' }}
            >
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
                 <h2 style={{ fontSize: '1.5rem', fontWeight: 950, margin: 0 }}>Battle Log Configuration</h2>
                 <div style={{ display: 'flex', gap: '1rem' }}>
                    <button onClick={() => setStep(2)} className="btn btn-secondary" style={{ fontSize: '0.8rem' }}>Re-Sync AI</button>
                    <button onClick={() => setStep(4)} className="btn btn-primary" style={{ fontSize: '0.8rem', fontWeight: 950 }}>PROCEED TO INVITES</button>
                 </div>
              </div>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                {questions.map((q, i) => (
                  <div key={i} style={{ padding: '1.25rem', borderRadius: '16px', border: '1px solid var(--border)', background: 'var(--bg-sub)', display: 'flex', gap: '1rem' }}>
                    <div style={{ width: '24px', height: '24px', borderRadius: '50%', background: 'var(--brand)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 900, flexShrink: 0 }}>{i + 1}</div>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '0.4rem' }}>
                         <span style={{ fontSize: '0.6rem', padding: '2px 6px', borderRadius: '4px', background: 'rgba(var(--brand-rgb), 0.1)', color: 'var(--brand)', fontWeight: 900, textTransform: 'uppercase' }}>{q.type}</span>
                         <span style={{ fontSize: '0.6rem', padding: '2px 6px', borderRadius: '4px', background: 'var(--bg-main)', color: 'var(--text-sub)', fontWeight: 900 }}>D-IDX: {q.difficulty_multiplier || 1}</span>
                      </div>
                      <div style={{ fontWeight: 800, fontSize: '0.95rem', color: 'var(--text-main)' }}>{q.question}</div>
                    </div>
                  </div>
                ))}
              </div>
            </motion.div>
          )}

          {step === 4 && (
            <motion.div 
              key="step4" 
              initial={{ opacity: 0, x: 20 }} 
              animate={{ opacity: 1, x: 0 }} 
              style={{ display: 'flex', flexDirection: 'column', gap: '2rem' }}
            >
              <div style={{ background: 'var(--surface)', borderRadius: '24px', border: '1px solid var(--border)', padding: '2.5rem' }}>
                <h2 style={{ fontSize: '1.5rem', fontWeight: 950, marginBottom: '0.5rem' }}>Deploy Challenge Signals</h2>
                <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem', marginBottom: '2rem' }}>Only online scholars can receive real-time game signals.</p>
                
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '1.25rem' }}>
                  {onlineProfiles.length === 0 ? (
                    <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '4rem', color: 'var(--text-sub)' }}>
                      <Users size={48} style={{ opacity: 0.1, marginBottom: '1rem' }} />
                      <p style={{ fontWeight: 700 }}>No other scholars are currently online.</p>
                    </div>
                  ) : (
                    onlineProfiles.map(p => (
                      <button 
                        key={p.id}
                        onClick={() => togglePlayer(p.id)}
                        className="glass"
                        style={{ 
                          padding: '1.25rem', 
                          borderRadius: '18px', 
                          border: '2px solid', 
                          background: selectedPlayers.includes(p.id) ? 'rgba(var(--brand-rgb), 0.05)' : 'var(--surface)',
                          borderColor: selectedPlayers.includes(p.id) ? 'var(--brand)' : 'var(--border)',
                          display: 'flex',
                          alignItems: 'center',
                          gap: '1rem',
                          cursor: 'pointer',
                          transition: 'all 0.2s',
                          textAlign: 'left'
                        }}
                      >
                        <div style={{ width: '36px', height: '36px', borderRadius: '12px', overflow: 'hidden', background: 'var(--bg-main)', border: '1px solid var(--border)' }}>
                          {p.avatar_url ? <img src={p.avatar_url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Users size={16} /></div>}
                        </div>
                        <span style={{ fontSize: '0.9rem', fontWeight: 900, flex: 1, color: 'var(--text-main)' }}>{p.full_name}</span>
                        {selectedPlayers.includes(p.id) && <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }}><CheckCircle2 size={18} color="var(--brand)" /></motion.div>}
                      </button>
                    ))
                  )}
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                 <button onClick={() => setStep(3)} className="btn btn-secondary" style={{ padding: '1rem 2.5rem' }}>Back</button>
                 <button 
                   onClick={handleStartGame} 
                   className="btn btn-primary" 
                   style={{ padding: '1rem 4rem', borderRadius: '20px', display: 'flex', alignItems: 'center', gap: '1rem', fontWeight: 950, fontSize: '1.1rem' }}
                   disabled={selectedPlayers.length === 0}
                 >
                   <Play size={22} fill="currentColor" />
                   INITIATE SKIRMISH
                 </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      )}

      <style jsx>{`
        .hover-card:hover {
          transform: translateY(-8px);
          border-color: var(--brand) !important;
          box-shadow: 0 20px 40px rgba(var(--brand-rgb), 0.2);
        }
        .page-fade { animation: fadeIn 0.4s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .animate-pulse { animation: pulse 2s cubic-bezier(0.4, 0, 0.6, 1) infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; } 50% { opacity: .5; } }
        
        .neural-bg {
          position: fixed;
          top: 0;
          left: 0;
          right: 0;
          bottom: 0;
          background: radial-gradient(circle at 50% 50%, rgba(var(--brand-rgb), 0.03) 0%, transparent 70%);
          z-index: -1;
          pointer-events: none;
        }

        .neural-bg::after {
          content: '';
          position: absolute;
          inset: 0;
          background-image: url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%239C92AC' fill-opacity='0.03'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E");
        }
      `}</style>
      <div className="neural-bg" />
    </div>
  )
}
