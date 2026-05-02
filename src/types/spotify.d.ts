/**
 * Minimal Spotify Web Playback SDK type declarations.
 * Mirrors the official @types/spotify-web-playback-sdk definitions.
 */

declare namespace Spotify {
  interface PlaybackState {
    context: {
      uri: string | null
      metadata: Record<string, unknown> | null
    }
    disallows: {
      pausing?: boolean
      peeking_next?: boolean
      peeking_prev?: boolean
      resuming?: boolean
      seeking?: boolean
      skipping_next?: boolean
      skipping_prev?: boolean
    }
    duration: number
    paused: boolean
    position: number
    repeat_mode: 0 | 1 | 2
    shuffle: boolean
    timestamp: number
    track_window: {
      current_track: Track
      next_tracks: Track[]
      previous_tracks: Track[]
    }
  }

  interface Track {
    id: string | null
    uri: string
    type: 'track' | 'episode' | 'ad'
    media_type: 'audio' | 'video'
    name: string
    is_playable: boolean
    album: {
      uri: string
      name: string
      images: Array<{ url: string; height: number; width: number }>
    }
    artists: Array<{ uri: string; name: string }>
  }

  interface PlayerInit {
    name: string
    getOAuthToken: (callback: (token: string) => void) => void
    volume?: number
  }

  class Player {
    constructor(options: PlayerInit)
    addListener(event: 'ready', callback: (data: { device_id: string }) => void): boolean
    addListener(event: 'not_ready', callback: (data: { device_id: string }) => void): boolean
    addListener(event: 'player_state_changed', callback: (state: PlaybackState) => void): boolean
    addListener(event: 'initialization_error' | 'authentication_error' | 'account_error' | 'playback_error', callback: (data: { message: string }) => void): boolean
    removeListener(event: string, callback?: (...args: unknown[]) => void): boolean
    connect(): Promise<boolean>
    disconnect(): void
    pause(): Promise<void>
    resume(): Promise<void>
    togglePlay(): Promise<void>
    seek(positionMs: number): Promise<void>
    previousTrack(): Promise<void>
    nextTrack(): Promise<void>
    setVolume(volume: number): Promise<void>
    getCurrentState(): Promise<PlaybackState | null>
  }
}

interface Window {
  onSpotifyWebPlaybackSDKReady: () => void
  Spotify: typeof Spotify
}
