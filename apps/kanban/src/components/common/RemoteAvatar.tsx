'use client'

import { useMemo, useState, type CSSProperties, type ReactNode } from 'react'
import Image from 'next/image'

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
  return value.startsWith('http://') || value.startsWith('https://') || value.startsWith('blob:') || value.startsWith('data:') || value.startsWith('/')
}

export default function RemoteAvatar({ src, alt, size, fallback, style, imgStyle, className }: RemoteAvatarProps) {
  const normalized = useMemo(() => {
    const clean = (src ?? '').trim()
    return clean && isSupportedRemoteSource(clean) ? clean : ''
  }, [src])
  const [failed, setFailed] = useState(false)

  const showImage = Boolean(normalized) && !failed

  return (
    <div
      className={className}
      style={{
        width: size,
        height: size,
        borderRadius: '50%',
        overflow: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        ...style,
      }}
    >
      {showImage ? (
        <Image
          src={normalized}
          alt={alt}
          width={size}
          height={size}
          loading="lazy"
          decoding="async"
          referrerPolicy="no-referrer"
          onError={() => setFailed(true)}
          style={{ width: '100%', height: 'auto', aspectRatio: '1/1', objectFit: 'cover', ...imgStyle }}
        />
      ) : (
        fallback
      )}
    </div>
  )
}