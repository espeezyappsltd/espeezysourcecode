'use client'

import { useState, useEffect, useCallback } from 'react'
import { useRouter } from 'next/navigation'
import { useProfile } from '@/context/ProfileContext'
import { usePresence } from '@/components/PresenceProvider'
import { useNotifications } from '@/components/NotificationProvider'
import { useSmartLoading } from '@/components/GlobalLoadingProvider'
import type { Profile } from '@/types/database'
import type { QuizQuestion } from '@/types/quiz'
import {
  createGameSession,
  createNotification,
  fetchProfilesByIds,
  fetchUserGameStats,
  upsertUserGameStats,
} from '@/services/dashboard'
import type { ChilloutDifficulty, ChilloutGameMode, ChilloutTopic, ChilloutUserStats } from '../types'
import { defaultGameStatsPayload, mapDbStatsToView } from '../utils'

async function runSkirmishStart(params: {
  roomId: string
  profileId: string | undefined
  profileName: string | undefined
  selectedTopic: ChilloutTopic | null
  difficulty: ChilloutDifficulty
  gameMode: ChilloutGameMode
  questions: QuizQuestion[]
  selectedPlayers: string[]
  router: ReturnType<typeof useRouter>
}) {
  const {
    roomId,
    profileId,
    profileName,
    selectedTopic,
    difficulty,
    gameMode,
    questions,
    selectedPlayers,
    router,
  } = params

  await createGameSession({
    room_id: roomId,
    creator_id: profileId,
    topic_id: selectedTopic?.id,
    difficulty,
    mode: gameMode,
    created_at: new Date().toISOString(),
  })

  await Promise.all(
    selectedPlayers.map((playerId) =>
      createNotification({
        user_id: playerId,
        type: 'skirmish_invite',
        title: 'SKIRMISH DETECTED',
        message: `${profileName || 'A Peer'} challenged you to ${difficulty} ${selectedTopic?.name}.`,
        metadata: { room_id: roomId, topic_id: selectedTopic?.id, mode: gameMode, questions },
      }),
    ),
  )

  if (typeof window !== 'undefined') {
    sessionStorage.setItem(
      `skirmish_setup_${roomId}`,
      JSON.stringify({
        questions: Array.isArray(questions) ? questions : [],
        config: { difficulty, mode: gameMode },
      }),
    )
  }

  router.push(`/chillout/room/${roomId}?id=${roomId}`)
}

export function useChilloutHub() {
  const router = useRouter()
  const { profile } = useProfile()
  const { onlineUsers } = usePresence()
  const { addToast } = useNotifications()
  const loadingContext = useSmartLoading()
  const withLoading = loadingContext?.withLoading

  const [step, setStep] = useState<1 | 2 | 3 | 4>(1)
  const [selectedTopic, setSelectedTopic] = useState<ChilloutTopic | null>(null)
  const [difficulty, setDifficulty] = useState<ChilloutDifficulty>('Medium')
  const [gameMode, setGameMode] = useState<ChilloutGameMode>('Speed Recall')
  const [roundCount, setRoundCount] = useState(5)
  const [isGenerating, setIsGenerating] = useState(false)
  const [questions, setQuestions] = useState<QuizQuestion[]>([])
  const [selectedPlayers, setSelectedPlayers] = useState<string[]>([])
  const [onlineProfiles, setOnlineProfiles] = useState<Profile[]>([])
  const [userStats, setUserStats] = useState<ChilloutUserStats | null>(null)

  useEffect(() => {
    async function loadHubData() {
      if (!profile?.id) return

      try {
        const stats = await fetchUserGameStats(profile.id)

        if (!stats) {
          await upsertUserGameStats(profile.id, defaultGameStatsPayload(profile.id))
          setUserStats(mapDbStatsToView({ total_points: 0, wins: 0, total_games: 0 }))
        } else {
          setUserStats(mapDbStatsToView(stats))
        }

        if (onlineUsers.size > 0) {
          const ids = Array.from(onlineUsers)
          const profilesData = await fetchProfilesByIds(ids.slice(0, 10))
          setOnlineProfiles(profilesData.filter((p) => p.id !== profile.id))
        } else {
          setOnlineProfiles([])
        }
      } catch (err: unknown) {
        console.error('Fetch data error:', err instanceof Error ? err.message : err)
      }
    }

    void loadHubData()
  }, [onlineUsers, profile?.id])

  const handleTopicSelect = useCallback((topic: ChilloutTopic) => {
    setSelectedTopic(topic)
    setStep(2)
  }, [])

  const handleInitializeQuestions = useCallback(async () => {
    setIsGenerating(true)
    try {
      const res = await fetch('/api/ai/quiz', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          topic: selectedTopic?.name,
          difficulty,
          mode: gameMode,
          count: roundCount,
        }),
      })
      const data = await res.json()
      if (data.questions) {
        setQuestions(data.questions)
        setStep(3)
      } else {
        throw new Error(data.error || 'Synthesis error')
      }
    } catch (err: unknown) {
      addToast('Sync Failure', err instanceof Error ? err.message : 'Unknown error', 'error')
    } finally {
      setIsGenerating(false)
    }
  }, [addToast, difficulty, gameMode, roundCount, selectedTopic?.name])

  const togglePlayer = useCallback((id: string) => {
    setSelectedPlayers((prev) => (prev.includes(id) ? prev.filter((p) => p !== id) : [...prev, id]))
  }, [])

  const handleStartGame = useCallback(async () => {
    if (selectedPlayers.length === 0) {
      addToast('No Players', 'You must invite at least one online peer.', 'warning')
      return
    }

    const roomId = `skirmish_${Date.now()}`
    const start = () =>
      runSkirmishStart({
        roomId,
        profileId: profile?.id,
        profileName: profile?.full_name ?? undefined,
        selectedTopic,
        difficulty,
        gameMode,
        questions,
        selectedPlayers,
        router,
      })

    if (withLoading) {
      await withLoading(start, 'Initializing Skirmish...')
    } else {
      try {
        await start()
      } catch (err: unknown) {
        addToast('Launch Failed', err instanceof Error ? err.message : 'Unknown error', 'error')
      }
    }
  }, [
    addToast,
    difficulty,
    gameMode,
    profile?.full_name,
    profile?.id,
    questions,
    router,
    selectedPlayers,
    selectedTopic,
    withLoading,
  ])

  return {
    step,
    setStep,
    selectedTopic,
    difficulty,
    setDifficulty,
    gameMode,
    setGameMode,
    roundCount,
    setRoundCount,
    isGenerating,
    questions,
    selectedPlayers,
    onlineProfiles,
    userStats,
    handleTopicSelect,
    handleInitializeQuestions,
    togglePlayer,
    handleStartGame,
  }
}
