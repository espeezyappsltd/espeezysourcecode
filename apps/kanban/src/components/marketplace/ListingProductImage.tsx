'use client'

import { useEffect, useMemo, useState } from 'react'
import { Package } from 'lucide-react'
import {
  MARKETPLACE_PLACEHOLDER_SRC,
  normalizeListingImages,
  placeholderToneForCategory,
  primaryListingImage,
} from '@/lib/marketplace/listing-images'

type ListingProductImageProps = {
  images?: unknown
  src?: string | null
  alt: string
  category?: string | null
  className?: string
  /** CSS aspect-ratio value, e.g. "4 / 3" */
  aspectRatio?: string
  priority?: boolean
  sizes?: string
}

export function ListingProductImage({
  images,
  src,
  alt,
  category,
  className = '',
  aspectRatio = '4 / 3',
  priority = false,
  sizes = '(max-width: 768px) 48vw, 280px',
}: ListingProductImageProps) {
  const imageUrl = useMemo(() => {
    if (src) return primaryListingImage([src])
    return primaryListingImage(images)
  }, [images, src])

  const [photoLoaded, setPhotoLoaded] = useState(false)
  const [photoFailed, setPhotoFailed] = useState(false)

  useEffect(() => {
    setPhotoLoaded(false)
    setPhotoFailed(false)
  }, [imageUrl])

  const tone = placeholderToneForCategory(category)
  const showPhoto = Boolean(imageUrl) && !photoFailed

  return (
    <div
      className={`listing-product-image ${className}`.trim()}
      style={{ aspectRatio }}
      data-loaded={photoLoaded ? 'true' : 'false'}
    >
      <div
        className="listing-product-image__placeholder"
        style={{ background: tone.gradient }}
        aria-hidden
      >
        <img
          src={MARKETPLACE_PLACEHOLDER_SRC}
          alt=""
          className="listing-product-image__placeholder-art"
          decoding="async"
        />
        <div className="listing-product-image__placeholder-fallback">
          <Package size={32} strokeWidth={1.5} color={tone.accent} aria-hidden />
          <span style={{ color: tone.accent, fontSize: '0.65rem', fontWeight: 800, letterSpacing: '0.08em', textTransform: 'uppercase' }}>
            {tone.label}
          </span>
        </div>
      </div>

      {showPhoto ? (
        <img
          src={imageUrl!}
          alt={alt}
          className={`listing-product-image__photo${photoLoaded ? ' listing-product-image__photo--visible' : ''}`}
          loading={priority ? 'eager' : 'lazy'}
          decoding="async"
          fetchPriority={priority ? 'high' : 'auto'}
          sizes={sizes}
          onLoad={() => setPhotoLoaded(true)}
          onError={() => setPhotoFailed(true)}
        />
      ) : null}
    </div>
  )
}

