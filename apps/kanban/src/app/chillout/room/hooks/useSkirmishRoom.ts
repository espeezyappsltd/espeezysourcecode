'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import confetti from 'canvas-confetti'
import { jsPDF } from 'jspdf'
import { usePresence } from '@/lib/realtime-provider'
import { useSyncedObject } from '@/lib/realtime-provider'
import { useProfile } from '@/context/ProfileContext'
import { useNotifications } from '@/components/NotificationProvider'
import { updateUserGameStats } from '@/app/actions'
import type { SkirmishState } from '@/types/quiz'

const DEFAULT_STATE: SkirmishState = {
  quizStatus: 'setup',
  quizQuestions: [],
  currentQuestionIndex: 0,
  quizScores: [],
  roundStartTime: 0,
  timerDuration: 20,
  config: { difficulty: 'Medium', mode: 'Speed Recall' },
}

export function useSkirmishRoom(roomId: string) {
  const { profile } = useProfile()
  const { addToast } = useNotifications()
  const router = useRouter()
  const { others } = usePresence(roomId)

  const [storage, updateStorage] = useSyncedObject<SkirmishState>(`rooms/${roomId}/state`, DEFAULT_STATE)

  const quizStatus = storage?.quizStatus || 'setup'
  const questions = storage?.quizQuestions || []
  const currentIdx = storage?.currentQuestionIndex ?? 0
  const scores = storage?.quizScores || []
  const activeTurnId = storage?.activeTurnUserId
  const roundStartTime = storage?.roundStartTime
  const timerDuration = storage?.timerDuration ?? 20
  const config = storage?.config || { difficulty: 'Medium', mode: 'Speed Recall' }

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

  const handleStartSkirmish = useCallback(async () => {
    const setupRaw = sessionStorage.getItem(`skirmish_setup_${roomId}`)
    if (!setupRaw) return

    try {
      const { questions: newQs, config: setupConfig } = JSON.parse(setupRaw)

      await updateStorage({
        quizQuestions: newQs,
        quizStatus: 'playing',
        currentQuestionIndex: 0,
        roundStartTime: Date.now(),
        activeTurnUserId: profile?.id ?? null,
        timerDuration: (newQs[0]?.difficulty_multiplier || 2) * 10,
        config: {
          difficulty: setupConfig.difficulty,
          mode: setupConfig.mode,
        },
      })

      addToast('Skirmish Injected', 'AI shards synchronized. Battle started!', 'success')
      sessionStorage.removeItem(`skirmish_setup_${roomId}`)
    } catch {
      addToast('Critical Failure', 'Mental sync aborted.', 'error')
    }
  }, [roomId, profile?.id, updateStorage, addToast])

  useEffect(() => {
    queueMicrotask(() => {
      setSelectedOption(null)
      setHasAnswered(false)
      setTextAnswer('')
      setIsRevealed(false)
      setAiCritique('')
    })
  }, [currentIdx, timerDuration])

  const handleFinalizeStats = useCallback(async () => {
    if (!profile?.id || !scores) return
    const myScore = scores.find((s) => s.userId === profile.id)?.points || 0
    const isWinner = scores.length > 1 && myScore >= Math.max(...scores.map((s) => s.points))

    await updateUserGameStats(profile.id, Math.floor(myScore / 4), isWinner)
  }, [profile?.id, scores])

  const submitActionResult = useCallback(
    async (isCorrect: boolean, bonusXp = 0) => {
      const userId = profile?.id
      if (!userId || !storage) return

      const currentScores = [...(storage.quizScores || [])]
      let found = false
      const pointsToAdd = isCorrect ? 100 + bonusXp : -50

      for (let i = 0; i < currentScores.length; i++) {
        const item = currentScores[i]
        if (item && item.userId === userId) {
          currentScores[i] = { ...item, points: Math.max(0, item.points + pointsToAdd) }
          found = true
          break
        }
      }
      if (!found) {
        currentScores.push({
          userId,
          userName: profile?.full_name || 'Anonymous',
          points: Math.max(0, pointsToAdd),
        })
      }

      const currentQList = storage.quizQuestions || []
      const nextIdx = (storage.currentQuestionIndex || 0) + 1

      if (nextIdx < currentQList.length) {
        const nextQ = currentQList[nextIdx]
        const nextDuration = (nextQ?.difficulty_multiplier || 2) * 10
        const players = [userId, ...others.map((o) => o.userId)].filter(Boolean)

        await updateStorage({
          quizScores: currentScores,
          currentQuestionIndex: nextIdx,
          roundStartTime: Date.now(),
          timerDuration: nextDuration,
          activeTurnUserId: players[nextIdx % players.length] ?? null,
        })
      } else {
        await updateStorage({
          quizScores: currentScores,
          quizStatus: 'results',
        })
        void handleFinalizeStats()
      }
    },
    [profile, others, storage, updateStorage, handleFinalizeStats],
  )

  const handleSkipRound = useCallback(() => {
    void submitActionResult(false)
    addToast('Time Out!', 'The round was skipped due to temporal flux.', 'warning')
  }, [submitActionResult, addToast])

  const handleResetSkirmish = useCallback(async () => {
    await updateStorage({
      quizStatus: 'setup',
      currentQuestionIndex: 0,
      quizQuestions: [],
      activeTurnUserId: null,
    })
    addToast('Archives Reset', 'Neural buffer cleared. Ready for a new iteration.', 'info')
  }, [updateStorage, addToast])

  useEffect(() => {
    if (quizStatus === 'results') {
      confetti({
        particleCount: 150,
        spread: 80,
        origin: { y: 0.6 },
        colors: ['#0ea5e9', '#38bdf8', '#fbbf24'],
      })
      addToast('Ascension Validated', 'The collective knowledge has been successfully assimilated.', 'success')
    }
  }, [quizStatus, addToast])

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

    setTimeout(() => void submitActionResult(correct), 600)
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
          userResponse: textAnswer,
        }),
      })
      const data = await res.json()
      setAiCritique(data.critique)
      setHasAnswered(true)

      if (data.isCorrect) {
        confetti({ particleCount: 50 })
        addToast('Synthesis Validated', 'AI score: ' + data.score, 'success')
      }

      setTimeout(() => void submitActionResult(data.isCorrect, data.score), 1000)
    } catch {
      addToast('Evaluation Failed', 'Judge is offline.', 'error')
    } finally {
      setIsGrading(false)
    }
  }

  const downloadTrophy = () => {
    if (!scores || scores.length === 0) return
    const doc = new jsPDF()
    const sortedScores = [...scores].sort((a, b) => b.points - a.points)
    const winner = sortedScores[0]

    doc.setFillColor(15, 23, 42)
    doc.rect(0, 0, 210, 297, 'F')

    doc.setTextColor(59, 130, 246)
    doc.setFontSize(35)
    doc.text('SKIRMISH RECEIPT', 105, 50, { align: 'center' })

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(20)
    doc.text(`${config?.difficulty || 'Standard'} ${config?.mode || 'Battle'}`.toUpperCase(), 105, 75, {
      align: 'center',
    })

    doc.setTextColor(251, 191, 36)
    doc.setFontSize(28)
    doc.text(winner?.userName?.toUpperCase() || 'PEER', 105, 120, { align: 'center' })

    doc.setTextColor(255, 255, 255)
    doc.setFontSize(14)
    doc.text(`VICTORY SCORE: ${winner?.points || 0}`, 105, 140, { align: 'center' })
    doc.text(`CHALLENGES CLEARED: ${questions?.length || 0}`, 105, 150, { align: 'center' })

    doc.save(`skirmish_receipt_${winner?.userName || 'winner'}.pdf`)
  }

  useEffect(() => {
    const timer = setTimeout(() => setShowIntro(false), 2500)
    return () => clearTimeout(timer)
  }, [])

  return {
    router,
    profile,
    others,
    quizStatus,
    questions,
    currentIdx,
    scores,
    activeTurnId,
    roundStartTime,
    timerDuration,
    config,
    showIntro,
    selectedOption,
    hasAnswered,
    textAnswer,
    setTextAnswer,
    isRevealed,
    setIsRevealed,
    isGrading,
    aiCritique,
    hasSetupData,
    currentQ,
    isMyTurn,
    handleStartSkirmish,
    handleSkipRound,
    handleResetSkirmish,
    handleMCSelect,
    handleAIEvaluation,
    downloadTrophy,
    submitActionResult,
    setHasAnswered,
  }
}
