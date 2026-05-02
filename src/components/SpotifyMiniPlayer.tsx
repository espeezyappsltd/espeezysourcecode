'use client'

import React from 'react'
import Image from 'next/image'
import { useSpotify } from '@/context/SpotifyContext'
import { Play, Pause, SkipForward, SkipBack, Music, Volume2, Users } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

export default function SpotifyMiniPlayer() {
  const { 
    playbackState, 
    togglePlay, 
    nextTrack, 
    previousTrack, 
    isConnected,
    isPremium,
    connectSpotify
  } = useSpotify()

  // If not connected, show a small "Connect Spotify" bubble
  if (!isConnected) {
    return (
      <div 
        onClick={connectSpotify}
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          background: 'var(--surface)',
          border: '1px solid var(--border)',
          padding: '0.75rem 1.25rem',
          borderRadius: '100px',
          display: 'flex',
          alignItems: 'center',
          gap: '0.75rem',
          cursor: 'pointer',
          boxShadow: 'var(--shadow-xl)',
          zIndex: 1000,
          transition: 'all 0.3s ease'
        }}
        className="hover-lift"
      >
        <Music size={16} color="#1DB954" />
        <span style={{ fontSize: '0.8rem', fontWeight: 800 }}>Connect Spotify</span>
      </div>
    )
  }

  const currentTrack = playbackState?.track_window.current_track
  const isPlaying = !playbackState?.paused

  return (
    <AnimatePresence>
      <motion.div 
        initial={{ y: 100, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        style={{
          position: 'fixed',
          bottom: '1.5rem',
          right: '1.5rem',
          width: '320px',
          background: 'rgba(20, 20, 20, 0.8)',
          backdropFilter: 'blur(20px)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '24px',
          padding: '1rem',
          display: 'flex',
          flexDirection: 'column',
          gap: '1rem',
          boxShadow: '0 20px 40px rgba(0,0,0,0.5)',
          zIndex: 1000
        }}
      >
        {/* Header Section */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {/* Album Art */}
          <div 
            role="img" 
            aria-label={currentTrack ? `Album art for ${currentTrack.name} by ${currentTrack.artists[0].name}` : "No music playing"}
            style={{ 
              width: '56px', 
              height: '56px', 
              borderRadius: '12px', 
              background: '#222', 
              overflow: 'hidden',
              boxShadow: isPlaying ? '0 0 15px rgba(29, 185, 84, 0.3)' : 'none',
              transition: 'all 0.5s ease'
            }}
          >
            {currentTrack?.album.images[0]?.url ? (
              <Image src={currentTrack.album.images[0].url} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="" fill />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Music size={24} color="#666" />
              </div>
            )}
          </div>

          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ 
              fontSize: '0.9rem', 
              fontWeight: 900, 
              color: 'white', 
              whiteSpace: 'nowrap', 
              overflow: 'hidden', 
              textOverflow: 'ellipsis' 
            }}>
              {currentTrack?.name || 'Waiting for music...'}
            </div>
            <div style={{ 
              fontSize: '0.75rem', 
              color: 'rgba(255,255,255,0.5)', 
              fontWeight: 700 
            }}>
              {currentTrack?.artists[0]?.name || 'Spotify'}
            </div>
          </div>

          <div style={{ 
            background: 'rgba(29, 185, 84, 0.1)', 
            padding: '4px 8px', 
            borderRadius: '8px', 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.4rem' 
          }}>
            <Users size={12} color="#1DB954" />
            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: '#1DB954' }}>SYNC</span>
          </div>
        </div>

        {/* Inclusive Fallback Message */}
        {isConnected && isPremium === false && (
          <div style={{ 
            fontSize: '0.65rem', 
            background: 'rgba(251, 191, 36, 0.1)', 
            color: '#fbbf24', 
            padding: '6px 10px', 
            borderRadius: '10px',
            fontWeight: 800,
            lineHeight: 1.3
          }}>
            In-app playback requires Spotify Premium. You can still control your other Spotify devices here!
          </div>
        )}

        {/* Controls */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <button 
              onClick={previousTrack}
              aria-label="Previous track"
              style={{ padding: '8px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.7 }}
            >
              <SkipBack size={18} fill="currentColor" />
            </button>
            <button 
              onClick={togglePlay}
              aria-label={isPlaying ? "Pause" : "Play"}
              style={{ 
                width: '40px', 
                height: '40px', 
                borderRadius: '50%', 
                background: 'white', 
                border: 'none', 
                display: 'flex', 
                alignItems: 'center', 
                justifyContent: 'center',
                color: 'black',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}
            >
              {isPlaying ? <Pause size={20} fill="currentColor" /> : <Play size={20} fill="currentColor" style={{ marginLeft: '2px' }} />}
            </button>
            <button 
              onClick={nextTrack}
              aria-label="Next track"
              style={{ padding: '8px', background: 'transparent', border: 'none', color: 'white', cursor: 'pointer', opacity: 0.7 }}
            >
              <SkipForward size={18} fill="currentColor" />
            </button>
          </div>

          <div 
            style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', opacity: 0.6 }}
            aria-label="Volume indicator"
          >
            <Volume2 size={16} color="white" />
            <div role="progressbar" aria-valuenow={50} aria-valuemin={0} aria-valuemax={100} style={{ width: '60px', height: '4px', background: 'rgba(255,255,255,0.2)', borderRadius: '2px' }}>
              <div style={{ width: '50%', height: '100%', background: 'white', borderRadius: '2px' }} />
            </div>
          </div>
        </div>

        {/* Progress Bar */}
        <div style={{ width: '100%', height: '3px', background: 'rgba(255,255,255,0.1)', borderRadius: '10px', marginTop: '0.25rem' }}>
          <motion.div 
            animate={{ width: playbackState ? `${(playbackState.position / playbackState.duration) * 100}%` : '0%' }}
            style={{ height: '100%', background: '#1DB954', borderRadius: '10px' }} 
          />
        </div>
      </motion.div>
    </AnimatePresence>
  )
}
