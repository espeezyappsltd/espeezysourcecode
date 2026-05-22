'use client'

import { useEffect, useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import './remote-avatar.css'

type RemoteAvatarProps = {
  src?: string | null
  alt: string
  size: number
  fallback: ReactNode
  style?: CSSProperties
  imgStyle?: CSSProperties
  className?: string
}

function isSupportedRemoteSource(value: string) {
  return (
    value.startsWith('http://') ||
    value.startsWith('https://') ||
    value.startsWith('blob:') ||
    value.startsWith('data:') ||
    value.startsWith('/')
  )
}

/** Prefer ui-avatars for known-bad or empty URLs from legacy rows */
function isLikelyBrokenAvatarUrl(url: string) {
  if (!url.trim()) return true
  if (url.includes('undefined') || url.includes('null')) return true
  return false
}

export default function RemoteAvatar({
  src,
  alt,
  size,
  fallback,
  style,
  imgStyle,
  className,
}: RemoteAvatarProps) {
  const normalized = useMemo(() => {
    const clean = (src ?? '').trim()
    if (!clean || !isSupportedRemoteSource(clean) || isLikelyBrokenAvatarUrl(clean)) return ''
    return clean
  }, [src])

  const [failed, setFailed] = useState(false)

  useEffect(() => {
    setFailed(false)
  }, [normalized])

  const showImage = Boolean(normalized) && !failed

  const mergedClass = ['remote-avatar', className].filter(Boolean).join(' ')

  return (
    <div
      className={mergedClass}
      style={{
        width: size,
        height: size,
        minWidth: size,
        minHeight: size,
        aspectRatio: '1 / 1',
        borderRadius: '50%',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        flexShrink: 0,
        ...style,
      }}
    >
      {showImage ? (
        // Native img avoids Next/Image remote-config errors for ui-avatars & CDN URLs
        <img
          src={normalized}
          alt={alt}
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            display: 'block',
            ...imgStyle,
          }}
        />
      ) : (
        fallback
      )}
    </div>
  )
}
