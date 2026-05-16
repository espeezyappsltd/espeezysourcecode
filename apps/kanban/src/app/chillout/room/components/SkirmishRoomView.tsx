'use client'

import { useSkirmishRoom } from '../hooks/useSkirmishRoom'
import { SkirmishIntro } from './SkirmishIntro'
import { SkirmishLoading } from './SkirmishLoading'
import { SkirmishSetupPanel } from './SkirmishSetupPanel'
import { SkirmishPlayingPanel } from './SkirmishPlayingPanel'
import { SkirmishResultsPanel } from './SkirmishResultsPanel'
import { SkirmishSidebar } from './SkirmishSidebar'

type Props = {
  roomId: string
}

export function SkirmishRoomView({ roomId }: Props) {
  const room = useSkirmishRoom(roomId)

  if (room.quizStatus === null) {
    return <SkirmishLoading />
  }

  if (room.showIntro) {
    return <SkirmishIntro />
  }

  return (
    <div
      className="page-fade"
      style={{
        display: 'grid',
        gridTemplateColumns: '1fr 320px',
        gap: '2rem',
        height: 'calc(var(--vh-dynamic) - 6rem)',
        overflow: 'hidden',
      }}
    >
      <div
        style={{
          background: 'var(--surface)',
          borderRadius: '32px',
          border: '1px solid var(--border)',
          display: 'flex',
          flexDirection: 'column',
          position: 'relative',
          overflow: 'hidden',
          boxShadow: 'var(--shadow-xl)',
        }}
      >
        {room.quizStatus === 'setup' && (
          <SkirmishSetupPanel
            hasSetupData={room.hasSetupData}
            peerCount={room.others.length + 1}
            onStart={room.handleStartSkirmish}
          />
        )}

        {room.quizStatus === 'playing' && room.currentQ && (
          <SkirmishPlayingPanel
            currentQ={room.currentQ}
            currentIdx={room.currentIdx}
            config={room.config}
            roundStartTime={room.roundStartTime}
            timerDuration={room.timerDuration}
            activeTurnId={room.activeTurnId}
            profileId={room.profile?.id}
            isMyTurn={room.isMyTurn}
            others={room.others}
            selectedOption={room.selectedOption}
            hasAnswered={room.hasAnswered}
            textAnswer={room.textAnswer}
            setTextAnswer={room.setTextAnswer}
            isRevealed={room.isRevealed}
            setIsRevealed={room.setIsRevealed}
            isGrading={room.isGrading}
            aiCritique={room.aiCritique}
            onTimeOut={room.handleSkipRound}
            onMCSelect={room.handleMCSelect}
            onAIEvaluation={room.handleAIEvaluation}
            onSpeedRecallMiss={() => {
              room.setHasAnswered(true)
              void room.submitActionResult(false)
            }}
            onSpeedRecallHit={() => {
              room.setHasAnswered(true)
              void room.submitActionResult(true)
            }}
          />
        )}

        {room.quizStatus === 'results' && (
          <SkirmishResultsPanel
            onDownload={room.downloadTrophy}
            onReset={room.handleResetSkirmish}
            onExit={() => room.router.push('/chillout')}
          />
        )}
      </div>

      <SkirmishSidebar
        scores={room.scores}
        profile={room.profile}
        others={room.others}
        activeTurnId={room.activeTurnId}
        router={room.router}
      />

      <style
        dangerouslySetInnerHTML={{
          __html: `
        .animate-pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%, 100% { opacity: 1; transform: scale(1); } 50% { opacity: 0.5; transform: scale(1.1); } }
        .page-fade { animation: fadeIn 0.6s cubic-bezier(0.4, 0, 0.2, 1); }
        @keyframes fadeIn { from { opacity: 0; transform: scale(0.98); } to { opacity: 1; transform: scale(1); } }
        .neural-bg {
          position: fixed;
          top: 0; left: 0; right: 0; bottom: 0;
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
      `,
        }}
      />
      <div className="neural-bg" />
    </div>
  )
}
