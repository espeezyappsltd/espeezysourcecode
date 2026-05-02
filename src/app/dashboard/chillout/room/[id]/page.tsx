'use client'

import React, { useState, useEffect } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { 
  RoomProvider, 
  useStorage, 
  useMutation, 
  useMyPresence, 
  useOthers
} from '@/liveblocks.config'
import { LiveList, LiveObject } from '@liveblocks/client'
import { 
  Trophy, 
  Crown, 
  Zap,
  Loader2
} from 'lucide-react'
import { useProfile } from '@/context/ProfileContext'
import { useNotifications } from '@/components/NotificationProvider'
import confetti from 'canvas-confetti'
import { motion, AnimatePresence } from 'framer-motion'
import { jsPDF } from 'jspdf'
import { updateUserGameStats } from '@/app/dashboard/actions'
import { SkirmishTimer } from '@/components/skirmish/SkirmishTimer'

export default function QuizRoomPage() {
  const params = useParams()
  const roomId = params?.id as string
  
  if (!roomId) return <div style={{ height: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}><Loader2 className="animate-spin" /></div>

  return (
    <RoomProvider 
      id={roomId} 
      initialStorage={{ 
        tasks: new LiveList([]),
        messages: new LiveList([]),
        quizQuestions: new LiveList([]),
        quizScores: new LiveList([]),
        quizStatus: 'setup',
        currentQuestionIndex: 0,
        activeTurnUserId: null,
        gameId: roomId,
        roundStartTime: 0,
        timerDuration: 20,
        config: new LiveObject({ difficulty: 'Medium', mode: 'Speed Recall' })
      }}
      initialPresence={{ draggingTaskId: null, isThinking: false, lastAction: null }}
    >
      <QuizGameContainer roomId={roomId} />
    </RoomProvider>
  )
}

function QuizGameContainer({ roomId }: { roomId: string }) {
  const { profile } = useProfile()
  const { addToast } = useNotifications()
  const router = useRouter()
  useMyPresence()
  const others = useOthers()
  
  const quizStatus = useStorage(s => s.quizStatus)
  const questions = useStorage(s => s.quizQuestions)
  const currentIdx = useStorage(s => s.currentQuestionIndex) ?? 0
  const scores = useStorage(s => s.quizScores)
  const activeTurnId = useStorage(s => s.activeTurnUserId)
  const roundStartTime = useStorage(s => s.roundStartTime)
  const timerDuration = useStorage(s => s.timerDuration) ?? 20
  const config = useStorage(s => s.config)
  
  const [showIntro, setShowIntro] = useState(true)
  const [selectedOption, setSelectedOption] = useState<number | null>(null)
  const [hasAnswered, setHasAnswered] = useState(false)
  const [textAnswer, setTextAnswer] = useState('')
  const [isRevealed, setIsRevealed] = useState(false)
  const [isGrading, setIsGrading] = useState(false)
  const [aiCritique, setAiCritique] = useState('')
  const [hasSetupData] = useState(() => {
    if (typeof window === 'undefined') return false
    return !!sessionStorage.getItem(`skirmish_setup_${roomId}`)
  })

  // eslint-disable-next-line react-hooks/rules-of-hooks
  const handleStartSkirmish = useMutation(({ storage }) => {
    const setupRaw = sessionStorage.getItem(`skirmish_setup_${roomId}`)
    if (!setupRaw) return

    try {
        const { questions: newQs, config: setupConfig } = JSON.parse(setupRaw)
        
        // Populate Storage
        const qList = storage.get('quizQuestions')
        qList.clear()
        newQs.forEach((q: any) => qList.push(q))
        
        storage.set('quizStatus', 'playing')
        storage.set('currentQuestionIndex', 0)
        storage.set('roundStartTime', Date.now())
        storage.set('activeTurnUserId', profile?.id ?? null)
        
        const firstQ = newQs[0]
        const firstDuration = (firstQ?.difficulty_multiplier || 2) * 10
        storage.set('timerDuration', firstDuration)
        
        const conf = storage.get('config')
        conf.set('difficulty', setupConfig.difficulty)
        conf.set('mode', setupConfig.mode)

        addToast('Skirmish Injected', 'AI shards synchronized. Battle started!', 'success')
        sessionStorage.removeItem(`skirmish_setup_${roomId}`)
    } catch (err) {
        addToast('Critical Failure', 'Mental sync aborted.', 'error')
    }
  }, [roomId, profile])

  // ── TIMER LOGIC ──────────────────────────────────────────────────
  // Timer controlled by SkirmishTimer component now

  // ── RESET UI ON QUESTION CHANGE ──────────────────────────────────
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    queueMicrotask(() => {
      setSelectedOption(null)
      setHasAnswered(false)
      setTextAnswer('')
      setIsRevealed(false)
      setAiCritique('')
    })
  }, [currentIdx, timerDuration])

  async function handleFinalizeStats() {
    if (!profile?.id || !scores) return
    const myScore = scores.find(s => s.userId === profile.id)?.points || 0
    const isWinner = scores.length > 1 && myScore >= Math.max(...scores.map(s => s.points))

    await updateUserGameStats(profile.id, Math.floor(myScore / 4), isWinner)
  }

  // ── MUTATIONS ───────────────────────────────────────────────────
  // eslint-disable-next-line react-hooks/rules-of-hooks
  const submitActionResult = useMutation(({ storage }, isCorrect: boolean, bonusXp = 0) => {
    const userId = profile?.id
    if (!userId) return

    // Update Scores
    const scoresList = storage.get('quizScores')
    let found = false
    const pointsToAdd = isCorrect ? (100 + bonusXp) : -50

    for (let i = 0; i < scoresList.length; i++) {
        const item = scoresList.get(i)
        if (item && item.userId === userId) {
            scoresList.set(i, { ...item, points: Math.max(0, item.points + pointsToAdd) })
            found = true
            break
        }
    }
    if (!found) {
        scoresList.push({ userId, userName: profile?.full_name || 'Anonymous', points: Math.max(0, pointsToAdd) })
    }

    // Next Round Setup
    const currentQList = storage.get('quizQuestions')
    const nextIdx = storage.get('currentQuestionIndex') + 1
    
    if (nextIdx < currentQList.length) {
      storage.set('currentQuestionIndex', nextIdx)
      storage.set('roundStartTime', Date.now())
      
      const nextQ = currentQList.get(nextIdx)
      if (nextQ) {
          const nextDuration = (nextQ.difficulty_multiplier || 2) * 10
          storage.set('timerDuration', nextDuration)
      }

      const players = [userId, ...others.map(o => o.id)].filter(Boolean)
      storage.set('activeTurnUserId', players[nextIdx % players.length])
    } else {
      storage.set('quizStatus', 'results')
      // eslint-disable-next-line react-hooks/immutability
      handleFinalizeStats()
    }
  }, [profile, others])

  const handleSkipRound = () => {
    submitActionResult(false)
    addToast('Time Out!', 'The round was skipped due to temporal flux.', 'warning')
  }

  const handleResetSkirmish = useMutation(({ storage }) => {
    storage.set('quizStatus', 'setup')
    storage.set('currentQuestionIndex', 0)
    storage.get('quizQuestions').clear()
    storage.set('activeTurnUserId', null)
    addToast('Archives Reset', 'Neural buffer cleared. Ready for a new iteration.', 'info')
  }, [])

  // ── COLLECTIVE CELEBRATION ────────────────────────────────────
  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    if (quizStatus === 'results') {
        confetti({ 
          particleCount: 150, 
          spread: 80, 
          origin: { y: 0.6 },
          colors: ['#0ea5e9', '#38bdf8', '#fbbf24']
        })
        addToast('Ascension Validated', 'The collective knowledge has been successfully assimilated.', 'success')
    }
  }, [quizStatus])

  // ── INTERACTION HANDLERS ───────────────────────────────────────
  const currentQ = questions && questions.length > currentIdx ? questions[currentIdx] : null
  const isMyTurn = activeTurnId === profile?.id

  const handleMCSelect = (idx: number) => {
    if (!isMyTurn || hasAnswered || !currentQ) return
    setSelectedOption(idx)
    setHasAnswered(true)
    
    const correct = idx === currentQ.correctAnswer
    if (correct) {
      confetti({ particleCount: 40, scalar: 0.7 })
      addToast('Correct!', 'Neural pathways aligned.', 'success')
    } else {
      addToast('Incorrect', 'Divergent thought detected.', 'error')
    }
    
    // Performance: Reduced delay for snappier feel
    setTimeout(() => submitActionResult(correct), 600)
  }

  const handleAIEvaluation = async () => {
    if (!textAnswer.trim() || !currentQ) return
    setIsGrading(true)
    try {
        const res = await fetch('/api/ai/grade', {
           method: 'POST',
           headers: { 'Content-Type': 'application/json' },
           body: JSON.stringify({
              question: currentQ.question,
              correctAnswer: currentQ.correctAnswer,
              userResponse: textAnswer
           })
        })
        const data = await res.json()
        setAiCritique(data.critique)
        setHasAnswered(true)
        
        if (data.isCorrect) {
          confetti({ particleCount: 50 })
          addToast('Synthesis Validated', 'AI score: ' + data.score, 'success')
        }
        
        // Performance: Reduced delay
        setTimeout(() => submitActionResult(data.isCorrect, data.score), 1000)
    } catch (err) {
        addToast('Evaluation Failed', 'Judge is offline.', 'error')
    } finally {
        setIsGrading(false)
    }
  }

  const downloadTrophy = () => {
    if (!scores || scores.length === 0) return
    const doc = new jsPDF()
    const sortedScores = [...scores].sort((a,b) => b.points - a.points)
    const winner = sortedScores[0]
    
    doc.setFillColor(15, 23, 42)
    doc.rect(0, 0, 210, 297, 'F')
    
    doc.setTextColor(59, 130, 246)
    doc.setFontSize(35)
    doc.text('SKIRMISH RECEIPT', 105, 50, { align: 'center' })
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.text(`${config?.difficulty || 'Standard'} ${config?.mode || 'Battle'}`.toUpperCase(), 105, 75, { align: 'center' })
    
    doc.setTextColor(251, 191, 36)
    doc.setFontSize(28)
    doc.text(winner?.userName?.toUpperCase() || 'PEER', 105, 120, { align: 'center' })
    
    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.text(`VICTORY SCORE: ${winner?.points || 0}`, 105, 140, { align: 'center' })
    doc.text(`CHALLENGES CLEARED: ${questions?.length || 0}`, 105, 150, { align: 'center' })
    
    doc.save(`skirmish_receipt_${winner?.userName || 'winner'}.pdf`)
  }

  // eslint-disable-next-line react-hooks/rules-of-hooks
  useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), 2500)
    return () => clearTimeout(timer)
  }, [])

  if (quizStatus === null) {
    return (
      <div style={{ height: 'calc(var(--vh-dynamic) - 6rem)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '1rem', color: 'var(--text-sub)' }}>
         <Loader2 className="animate-spin" size={32} />
         <div style={{ fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.2em', fontSize: '0.8rem' }}>Calibrating Storage...</div>
      </div>
    )
  }

  if (showIntro) {
    return (
      <div style={{ height: 'var(--vh-dynamic)', background: 'var(--bg-main)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}>
         <motion.div initial={{ scale: 0.5, rotate: -45 }} animate={{ scale: 1, rotate: 0 }} transition={{ type: 'spring' }}>
            <Zap size={120} className="text-brand" fill="var(--brand)" style={{ filter: 'drop-shadow(0 0 30px rgba(var(--brand-rgb), 0.5))' }} />
         </motion.div>
         <h1 style={{ fontSize: '3.5rem', fontWeight: 950, letterSpacing: '-0.06em', marginTop: '2rem' }}>SKIRMISH <span style={{ color: 'var(--brand)' }}>ACTIVE</span></h1>
         <p style={{ color: 'var(--text-sub)', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.4em' }}>Assembling Virtual Shards...</p>
      </div>
    )
  }

  return (
    <div className="page-fade" style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: '2rem', height: 'calc(var(--vh-dynamic) - 6rem)', overflow: 'hidden' }}>
      
      {/* ── MAIN SKYRMISH AREA ────────────────────────────────────────── */}
      <div style={{ background: 'var(--surface)', borderRadius: '32px', border: '1px solid var(--border)', display: 'flex', flexDirection: 'column', position: 'relative', overflow: 'hidden', boxShadow: 'var(--shadow-xl)' }}>
        
        {quizStatus === 'setup' && (
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '2rem' }}>
             <Crown size={80} className="text-brand" style={{ marginBottom: '2rem', opacity: 0.2 }} />
             <h2 style={{ fontSize: '2rem', fontWeight: 950, marginBottom: '1rem' }}>Initiating Protocol</h2>
             <p style={{ color: 'var(--text-sub)', marginBottom: '2.5rem', maxWidth: '450px', fontWeight: 600 }}>
                {hasSetupData 
                  ? "The Master Librarian awaits your signal. Deploy the academic shards whenever you feel adequately prepared." 
                  : "Synchronizing with the Central Archive. Waiting for the Host to initiate the knowledge extraction."}
             </p>
             
             {hasSetupData ? (
                <button 
                  onClick={handleStartSkirmish}
                  className="btn btn-primary"
                  style={{ padding: '1.25rem 3.5rem', borderRadius: '20px', fontWeight: 950, fontSize: '1.1rem', boxShadow: '0 10px 30px rgba(var(--brand-rgb), 0.3)' }}
                >
                  COMMENCE THE EXTRACTION
                </button>
             ) : (
                <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '1rem' }}>
                   <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'var(--brand)', fontWeight: 900 }}>
                      <Loader2 className="animate-spin" size={24} /> 
                      <span className="animate-pulse">AWAITING HOST COMMAND...</span>
                   </div>
                   <div style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--text-sub)' }}>{others.length + 1} Scholars Connected</div>
                </div>
             )}
          </div>
        )}

        {quizStatus === 'playing' && currentQ && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ flex: 1, display: 'flex', flexDirection: 'column', padding: '3rem' }}>
             {/* Header */}
             <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '3rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                   <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'rgba(var(--brand-rgb), 0.1)', color: 'var(--brand)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 950, fontSize: '1.25rem' }}>{currentIdx + 1}</div>
                   <div>
                      <div style={{ fontSize: '0.65rem', fontWeight: 950, textTransform: 'uppercase', color: 'var(--text-sub)', letterSpacing: '0.15em' }}>Round Progress</div>
                      <div style={{ fontWeight: 850 }}>{config?.mode || 'Battle'} <span style={{ color: 'var(--text-sub)' }}>({config?.difficulty || 'Standard'})</span></div>
                   </div>
                </div>
                
                {/* SMART TIMER (Isolated for performance) */}
                <SkirmishTimer 
                  roundStartTime={roundStartTime || 0} 
                  timerDuration={timerDuration || 20}
                  activeTurnId={activeTurnId}
                  currentProfileId={profile?.id || null}
                  onTimeOut={handleSkipRound}
                />
             </div>

             {/* Question Area */}
             <div style={{ textAlign: 'center', marginBottom: '3rem', minHeight: '120px' }}>
                <AnimatePresence mode="wait">
                   <motion.h2 
                     key={currentIdx}
                     initial={{ y: 20, opacity: 0 }}
                     animate={{ y: 0, opacity: 1 }}
                     style={{ fontSize: '2.25rem', fontWeight: 950, color: 'var(--text-main)', letterSpacing: '-0.04em', lineHeight: 1.1, marginBottom: '1.5rem' }}
                   >
                     {currentQ.question}
                   </motion.h2>
                </AnimatePresence>
                <div style={{ display: 'flex', justifyContent: 'center', gap: '0.75rem', alignItems: 'center' }}>
                   <motion.div 
                     animate={isMyTurn ? { scale: [1, 1.05, 1], boxShadow: ['0 0 0px var(--brand)', '0 0 20px var(--brand)', '0 0 0px var(--brand)'] } : {}}
                     transition={{ repeat: Infinity, duration: 1.5 }}
                     style={{ padding: '6px 16px', background: isMyTurn ? 'var(--brand)' : 'var(--bg-sub)', color: isMyTurn ? 'white' : 'var(--text-sub)', borderRadius: '10px', fontSize: '0.75rem', fontWeight: 950, textTransform: 'uppercase', letterSpacing: '0.05em' }}
                   >
                      {isMyTurn ? '⚡ IT IS YOUR TURN TO SYNTHESIZE' : `🔍 ${others.find(o => o.id === activeTurnId)?.info?.name || 'A Peer'} is currently being evaluated...`}
                   </motion.div>
                </div>
             </div>

             {/* Dynamic Mode Controller */}
             <div style={{ flex: 1 }}>
                {/* 1. Multiple Choice Mode */}
                {currentQ?.type === 'multiple_choice' && (
                    <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
                        {currentQ.options?.map((opt: string, i: number) => {
                            const isCorrect = hasAnswered && i === currentQ.correctAnswer
                            const isWrong = hasAnswered && selectedOption === i && i !== currentQ.correctAnswer
                            return (
                                <button 
                                  key={i}
                                  disabled={!isMyTurn || hasAnswered}
                                  onClick={() => handleMCSelect(i)}
                                  className="glass"
                                  style={{ 
                                    padding: '1.5rem', borderRadius: '20px', border: '2px solid',
                                    borderColor: isCorrect ? 'var(--success)' : isWrong ? 'var(--error)' : selectedOption === i ? 'var(--brand)' : 'var(--border)',
                                    background: isCorrect ? 'rgba(var(--success-rgb), 0.05)' : 'var(--surface)',
                                    textAlign: 'left', fontWeight: 800, cursor: isMyTurn ? 'pointer' : 'default', transition: '0.2s', width: '100%'
                                  }}
                                >
                                    {opt}
                                </button>
                            )
                        })}
                    </div>
                )}

                {/* 2. Speed Recall Mode */}
                {config?.mode === 'Speed Recall' && currentQ?.type === 'explanation' && (
                    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '2rem' }}>
                        <AnimatePresence>
                           {isRevealed ? (
                               <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} style={{ padding: '2rem', background: 'rgba(var(--brand-rgb), 0.03)', borderRadius: '24px', border: '1px dashed var(--brand)', width: '100%', textAlign: 'center' }}>
                                  <div style={{ fontSize: '0.7rem', fontWeight: 950, color: 'var(--brand)', marginBottom: '0.5rem', textTransform: 'uppercase' }}>Correct Answer</div>
                                  <div style={{ fontSize: '1.1rem', fontWeight: 800 }}>{currentQ?.correctAnswer}</div>
                               </motion.div>
                           ) : (
                               <button onClick={() => setIsRevealed(true)} className="btn btn-primary" style={{ padding: '1rem 3rem', borderRadius: '16px', fontWeight: 950 }}>REVEAL FLUX</button>
                           )}
                        </AnimatePresence>

                        {isRevealed && isMyTurn && !hasAnswered && (
                            <div style={{ display: 'flex', gap: '1rem' }}>
                                <button onClick={() => { setHasAnswered(true); submitActionResult(false); }} className="btn" style={{ background: 'var(--error)', color: 'white', padding: '1rem 2rem', borderRadius: '12px', fontWeight: 900 }}>MISSED IT</button>
                                <button onClick={() => { setHasAnswered(true); confetti(); submitActionResult(true); }} className="btn" style={{ background: 'var(--success)', color: 'white', padding: '1rem 2rem', borderRadius: '12px', fontWeight: 900 }}>GOT IT!</button>
                            </div>
                        )}
                    </div>
                )}

                {/* 3. AI Evaluated Mode */}
                {config?.mode === 'AI Evaluated' && currentQ?.type === 'explanation' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                        <textarea 
                          value={textAnswer}
                          onChange={(e) => setTextAnswer(e.target.value)}
                          disabled={!isMyTurn || hasAnswered}
                          placeholder="Synthesize your explanation here..."
                          style={{ width: '100%', height: '140px', background: 'var(--bg-sub)', border: '2px solid var(--border)', borderRadius: '20px', padding: '1.5rem', color: 'var(--text-main)', fontSize: '1rem', outline: 'none', resize: 'none', transition: 'border-color 0.2s' }}
                        />
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                           <div style={{ color: 'var(--text-sub)', fontSize: '0.8rem', fontWeight: 600 }}>{textAnswer.length} characters used</div>
                           <button 
                             onClick={handleAIEvaluation}
                             disabled={!isMyTurn || hasAnswered || isGrading || !textAnswer.trim()}
                             className="btn btn-primary"
                             style={{ padding: '0.8rem 2.5rem', borderRadius: '14px', fontWeight: 950, display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                           >
                              {isGrading ? <Loader2 className="animate-spin" size={18} /> : <Zap size={18} />}
                              DEPLOY FOR GRADING
                           </button>
                        </div>
                        {aiCritique && (
                            <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ padding: '1rem 1.5rem', background: 'var(--bg-main)', borderLeft: '4px solid var(--brand)', borderRadius: '0 12px 12px 0' }}>
                               <span style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--brand)', textTransform: 'uppercase' }}>Judge&apos;s Critique:</span>
                               <p style={{ margin: '4px 0 0', fontWeight: 700, fontStyle: 'italic' }}>&quot;{aiCritique}&quot;</p>
                            </motion.div>
                        )}
                    </div>
                )}
             </div>
          </motion.div>
        )}

        {quizStatus === 'results' && (
           <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', padding: '3rem' }}>
              <motion.div initial={{ scale: 0 }} animate={{ scale: 1, rotate: [0, 10, -10, 0] }} transition={{ duration: 0.5 }}>
                 <Trophy size={140} className="text-brand" fill="var(--brand)" style={{ filter: 'drop-shadow(0 0 40px rgba(var(--brand-rgb), 0.4))' }} />
              </motion.div>
              <h2 style={{ fontSize: '3.5rem', fontWeight: 950, marginBottom: '0.5rem', letterSpacing: '-0.04em' }}>SKIRMISH CONCLUDED</h2>
              <p style={{ color: 'var(--text-sub)', fontSize: '1.1rem', fontWeight: 600, maxWidth: '500px', marginBottom: '3rem' }}>The hierarchy has been established. XP rewards have been injected into your profile.</p>
              
              <div style={{ display: 'flex', gap: '1.5rem' }}>
                 <button onClick={downloadTrophy} className="btn btn-primary" style={{ padding: '1.25rem 3rem', borderRadius: '20px', fontWeight: 950, fontSize: '1.1rem', boxShadow: '0 10px 20px rgba(var(--brand-rgb), 0.2)' }}>Record Victory Shard (PDF)</button>
                 <button onClick={handleResetSkirmish} className="btn btn-secondary" style={{ padding: '1.25rem 3rem', borderRadius: '20px', fontWeight: 950, fontSize: '1.1rem' }}>Enter New Loop</button>
                  <button onClick={() => router.push('/dashboard/chillout')} className="btn btn-ghost" style={{ padding: '1.25rem 2rem', borderRadius: '20px', fontWeight: 950, fontSize: '1rem' }}>Exit Zone</button>
              </div>
           </div>
        )}
      </div>

      {/* ── SIDEBAR / LEADERBOARD ─────────────────────────────────── */}
      <aside style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
         <div style={{ flex: 1, background: 'var(--surface)', borderRadius: '32px', border: '1px solid var(--border)', padding: '1.5rem', display: 'flex', flexDirection: 'column' }}>
            <h3 style={{ fontSize: '0.75rem', fontWeight: 950, textTransform: 'uppercase', color: 'var(--text-sub)', letterSpacing: '0.15em', marginBottom: '1.5rem' }}>Skirmish Standings</h3>
            
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
               {scores && [...scores].sort((a,b) => b.points - a.points).map((s, idx) => (
                 <div key={s.userId} style={{ padding: '1rem', borderRadius: '16px', background: s.userId === profile?.id ? 'rgba(var(--brand-rgb), 0.05)' : 'var(--bg-sub)', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
                    <div style={{ width: '24px', fontWeight: 950, color: idx === 0 ? '#fbbf24' : 'var(--text-sub)', fontSize: '1.1rem' }}>{idx + 1}.</div>
                    <div style={{ flex: 1, fontWeight: 850, fontSize: '0.9rem' }}>{s.userName}</div>
                    <div style={{ fontWeight: 1000, color: 'var(--brand)', fontSize: '1.1rem' }}>{s.points}</div>
                 </div>
               ))}
               {(!scores || scores.length === 0) && (
                 <div style={{ padding: '2rem', textAlign: 'center', color: 'var(--text-sub)', fontSize: '0.8rem', fontWeight: 600 }}>Initializing Standings...</div>
               )}
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '1.5rem' }}>
               <div style={{ fontSize: '0.7rem', fontWeight: 950, textTransform: 'uppercase', color: 'var(--text-sub)', marginBottom: '1rem' }}>Room Population ({others.length + 1})</div>
               <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.6rem' }}>
                  <div style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'var(--brand)', padding: '2px', border: activeTurnId === profile?.id ? '2px solid var(--success)' : 'none' }}>
                     <img src={profile?.avatar_url || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }} />
                  </div>
                   {others.map(o => (
                    <div key={o.id} style={{ width: '36px', height: '36px', borderRadius: '12px', background: 'var(--bg-sub)', padding: '2px', border: activeTurnId === o.id ? '2px solid var(--success)' : 'none' }}>
                      <img src={o.info?.avatar || ''} style={{ width: '100%', height: '100%', objectFit: 'cover', borderRadius: '10px' }} />
                    </div>
                  ))}
               </div>
            </div>
         </div>

         <button onClick={() => router.push('/dashboard/chillout')} className="btn btn-secondary" style={{ width: '100%', padding: '1.25rem', borderRadius: '20px', fontWeight: 950, color: 'var(--error)', borderColor: '#ef444433' }}>
            ABANDON SKIRMISH
         </button>
      </aside>

      <style dangerouslySetInnerHTML={{ __html: `
        .animate-pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.1); } }
        .page-fade { animation: fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        
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
      `}} />
      <div className="neural-bg" />
    </div>
  )
}
