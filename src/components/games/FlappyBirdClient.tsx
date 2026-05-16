'use client'

import React, { useEffect, useRef, useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Trophy, Play, RotateCcw, ChevronLeft } from 'lucide-react'
import Link from 'next/link'

// Constants
const CANVAS_WIDTH = 400
const CANVAS_HEIGHT = 600
const GRAVITY = 0.4
const JUMP_STRENGTH = -7
const PIPE_SPEED = 2.5
const PIPE_SPAWN_RATE = 100 // frames
const PIPE_GAP = 160
const BIRD_SIZE = 34

export default function FlappyBirdClient() {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const [gameState, setGameState] = useState<'idle' | 'playing' | 'gameover'>('idle')
  const [score, setScore] = useState(0)
  const [highScore, setHighScore] = useState(0)

  // Game references (non-state to avoid re-renders)
  const birdY = useRef(CANVAS_HEIGHT / 2)
  const birdVelocity = useRef(0)
  const pipes = useRef<{ x: number; topHeight: number; passed: boolean }[]>([])
  const frameCount = useRef(0)
  const animationFrameId = useRef<number | null>(null)

  // Images
  const birdImg = useRef<HTMLImageElement | null>(null)
  const pipeImg = useRef<HTMLImageElement | null>(null)
  const bgImg = useRef<HTMLImageElement | null>(null)

  useEffect(() => {
    // Load high score
    const saved = localStorage.getItem('flappy-highscore')
    if (saved) setHighScore(parseInt(saved))

    // Preload images
    birdImg.current = new Image()
    birdImg.current.src = '/assets/flappybird/flappybird.png'
    pipeImg.current = new Image()
    pipeImg.current.src = '/assets/flappybird/flappypipe.jpg'
    bgImg.current = new Image()
    bgImg.current.src = '/assets/flappybird/bg.png'

    return () => {
      if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current)
    }
  }, [])

  const resetGame = () => {
    birdY.current = CANVAS_HEIGHT / 2
    birdVelocity.current = 0
    pipes.current = []
    frameCount.current = 0
    setScore(0)
    setGameState('playing')
    requestAnimationFrame(gameLoop)
  }

  const handleAction = () => {
    if (gameState === 'playing') {
      birdVelocity.current = JUMP_STRENGTH
    } else if (gameState === 'idle') {
      resetGame()
    } else if (gameState === 'gameover') {
      resetGame()
    }
  }

  const gameLoop = () => {
    const canvas = canvasRef.current
    const ctx = canvas?.getContext('2d')
    if (!canvas || !ctx) return

    // 1. Update positions
    birdVelocity.current += GRAVITY
    birdY.current += birdVelocity.current

    // Spawn pipes
    if (frameCount.current % PIPE_SPAWN_RATE === 0) {
      const minPipeHeight = 50
      const maxPipeHeight = CANVAS_HEIGHT - PIPE_GAP - minPipeHeight
      const topHeight = Math.floor(Math.random() * (maxPipeHeight - minPipeHeight + 1)) + minPipeHeight
      pipes.current.push({ x: CANVAS_WIDTH, topHeight, passed: false })
    }

    // Move pipes
    pipes.current.forEach(p => (p.x -= PIPE_SPEED))

    // 2. Collision detection
    // Ceiling/Floor
    if (birdY.current < 0 || birdY.current + BIRD_SIZE > CANVAS_HEIGHT) {
      handleGameOver()
      return
    }

    // Pipes
    for (const p of pipes.current) {
      if (
        p.x < 50 + BIRD_SIZE &&
        p.x + 50 > 50 &&
        (birdY.current < p.topHeight || birdY.current + BIRD_SIZE > p.topHeight + PIPE_GAP)
      ) {
        handleGameOver()
        return
      }

      // Score
      if (!p.passed && p.x + 50 < 50) {
        p.passed = true
        setScore(prev => prev + 1)
      }
    }

    // 3. Draw
    // BG
    if (bgImg.current) {
      ctx.drawImage(bgImg.current, 0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    } else {
      ctx.fillStyle = '#70c5ce'
      ctx.fillRect(0, 0, CANVAS_WIDTH, CANVAS_HEIGHT)
    }

    // Bird
    ctx.save()
    ctx.translate(50 + BIRD_SIZE / 2, birdY.current + BIRD_SIZE / 2)
    const rotation = Math.min(Math.PI / 4, Math.max(-Math.PI / 4, birdVelocity.current * 0.1))
    ctx.rotate(rotation)
    if (birdImg.current) {
      ctx.drawImage(birdImg.current, -BIRD_SIZE / 2, -BIRD_SIZE / 2, BIRD_SIZE, BIRD_SIZE)
    } else {
      ctx.fillStyle = '#f7d308'
      ctx.fillRect(-BIRD_SIZE / 2, -BIRD_SIZE / 2, BIRD_SIZE, BIRD_SIZE)
    }
    ctx.restore()

    // Pipes
    pipes.current.forEach(p => {
      // Top pipe
      if (pipeImg.current) {
        ctx.save()
        ctx.translate(p.x + 25, p.topHeight / 2)
        ctx.scale(1, -1)
        ctx.drawImage(pipeImg.current, -25, -p.topHeight / 2, 50, p.topHeight)
        ctx.restore()

        // Bottom pipe
        const bottomHeight = CANVAS_HEIGHT - (p.topHeight + PIPE_GAP)
        ctx.drawImage(pipeImg.current, p.x, p.topHeight + PIPE_GAP, 50, bottomHeight)
      } else {
        ctx.fillStyle = '#2ecc71'
        ctx.fillRect(p.x, 0, 50, p.topHeight)
        ctx.fillRect(p.x, p.topHeight + PIPE_GAP, 50, CANVAS_HEIGHT - (p.topHeight + PIPE_GAP))
      }
    })

    // Remove off-screen pipes
    pipes.current = pipes.current.filter(p => p.x > -60)

    frameCount.current++
    animationFrameId.current = requestAnimationFrame(gameLoop)
  }

  const handleGameOver = () => {
    setGameState('gameover')
    if (animationFrameId.current) cancelAnimationFrame(animationFrameId.current)
    
    setHighScore(prev => {
      const next = Math.max(prev, score)
      localStorage.setItem('flappy-highscore', next.toString())
      return next
    })
  }

  return (
    <div style={{ minHeight: '100vh', background: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', padding: '2rem' }}>
      <header style={{ width: '100%', maxWidth: '800px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <Link href="/games" style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', textDecoration: 'none', color: 'rgba(255,255,255,0.6)', fontWeight: 600 }}>
          <ChevronLeft size={20} />
          Lobby
        </Link>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.5rem' }}>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '0.7rem', color: 'rgba(255,255,255,0.4)', fontWeight: 800, textTransform: 'uppercase' }}>Score</p>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 950, color: 'white' }}>{score}</p>
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ margin: 0, fontSize: '0.7rem', color: '#f59e0b', fontWeight: 800, textTransform: 'uppercase' }}>Best</p>
            <p style={{ margin: 0, fontSize: '1.5rem', fontWeight: 950, color: '#f59e0b' }}>{highScore}</p>
          </div>
        </div>
      </header>

      <div 
        style={{ position: 'relative', width: CANVAS_WIDTH, height: CANVAS_HEIGHT, background: '#000', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 20px 50px rgba(0,0,0,0.5)', border: '1px solid rgba(255,255,255,0.1)' }}
        onClick={handleAction}
        tabIndex={0}
        onKeyDown={e => e.code === 'Space' && handleAction()}
      >
        <canvas ref={canvasRef} width={CANVAS_WIDTH} height={CANVAS_HEIGHT} />

        <AnimatePresence>
          {gameState === 'idle' && (
            <motion.div 
              initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}
            >
              <h2 style={{ fontSize: '2.5rem', fontWeight: 950, color: 'white', marginBottom: '1rem', letterSpacing: '-0.04em' }}>Flappy Scholar</h2>
              <p style={{ color: 'rgba(255,255,255,0.6)', marginBottom: '2rem', maxWidth: '240px' }}>Tap or press space to fly through the knowledge gaps.</p>
              <button style={{ padding: '1rem 2rem', background: '#10b981', border: 'none', borderRadius: '12px', color: 'white', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                <Play size={20} fill="white" /> START GAME
              </button>
            </motion.div>
          )}

          {gameState === 'gameover' && (
            <motion.div 
              initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
              style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center' }}
            >
              <div style={{ width: '64px', height: '64px', background: 'rgba(239,68,68,0.2)', border: '1px solid #ef4444', borderRadius: '20px', display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: '1.5rem' }}>
                <Trophy size={32} color="#ef4444" />
              </div>
              <h2 style={{ fontSize: '2rem', fontWeight: 950, color: 'white', marginBottom: '0.5rem' }}>Class Dismissed</h2>
              <p style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 700, textTransform: 'uppercase', fontSize: '0.75rem', letterSpacing: '0.1em' }}>Final Score: {score}</p>
              
              <div style={{ marginTop: '2.5rem', display: 'flex', gap: '1rem' }}>
                <button 
                  onClick={resetGame}
                  style={{ padding: '0.9rem 1.5rem', background: 'white', border: 'none', borderRadius: '12px', color: '#0a0a0a', fontWeight: 900, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.75rem' }}
                >
                  <RotateCcw size={18} /> TRY AGAIN
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      <footer style={{ marginTop: '2rem', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', fontWeight: 600 }}>
        [SPACE] or [TAP] to jump
      </footer>
    </div>
  )
}
