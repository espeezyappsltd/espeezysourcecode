'use client'

import { AnimatePresence } from 'framer-motion'
import { useProfile } from '@/context/ProfileContext'
import { hasFeature } from '@/utils/feature-gate'
import PremiumFeatureGate from '@/components/PremiumFeatureGate'
import { useChilloutHub } from './hooks/useChilloutHub'
import { ChilloutStatsHud } from './components/ChilloutStatsHud'
import { ChilloutHeader } from './components/ChilloutHeader'
import { ChilloutGeneratingOverlay } from './components/ChilloutGeneratingOverlay'
import { ChilloutTopicStep } from './components/ChilloutTopicStep'
import { ChilloutConfigStep } from './components/ChilloutConfigStep'
import { ChilloutPreviewStep } from './components/ChilloutPreviewStep'
import { ChilloutInviteStep } from './components/ChilloutInviteStep'
import { ChilloutPageStyles } from './components/ChilloutPageStyles'

export default function ChillOutHub() {
  const { profile, loading: profileLoading } = useProfile()
  const hub = useChilloutHub()

  if (!profileLoading && !hasFeature(profile, 'BREAK_ROOM')) {
    return <PremiumFeatureGate feature="BREAK_ROOM" />
  }

  return (
    <div className="page-fade page-shell page-shell--wide page-stack" style={{ gap: '2rem', paddingBottom: '4rem' }}>
      <ChilloutStatsHud userStats={hub.userStats} />
      <ChilloutHeader />

      {hub.isGenerating ? (
        <ChilloutGeneratingOverlay difficulty={hub.difficulty} selectedTopic={hub.selectedTopic} />
      ) : (
        <AnimatePresence mode="wait">
          {hub.step === 1 && <ChilloutTopicStep onSelectTopic={hub.handleTopicSelect} />}
          {hub.step === 2 && (
            <ChilloutConfigStep
              difficulty={hub.difficulty}
              gameMode={hub.gameMode}
              roundCount={hub.roundCount}
              onDifficultyChange={hub.setDifficulty}
              onGameModeChange={hub.setGameMode}
              onRoundCountChange={hub.setRoundCount}
              onBack={() => hub.setStep(1)}
              onInitialize={hub.handleInitializeQuestions}
            />
          )}
          {hub.step === 3 && (
            <ChilloutPreviewStep
              questions={hub.questions}
              onBack={() => hub.setStep(2)}
              onProceed={() => hub.setStep(4)}
            />
          )}
          {hub.step === 4 && (
            <ChilloutInviteStep
              onlineProfiles={hub.onlineProfiles}
              selectedPlayers={hub.selectedPlayers}
              onTogglePlayer={hub.togglePlayer}
              onBack={() => hub.setStep(3)}
              onStartGame={hub.handleStartGame}
            />
          )}
        </AnimatePresence>
      )}

      <ChilloutPageStyles />
    </div>
  )
}
