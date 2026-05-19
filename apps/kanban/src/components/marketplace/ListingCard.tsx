'use client'

import React, { memo } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Plus, MapPin, Coins } from 'lucide-react'
import { formatCredits } from '@/lib/credits'
import { Listing } from '@/types/marketplace'
import RemoteAvatar from '@/components/common/RemoteAvatar'
import { avatarUrlForProfile } from '@/lib/platform/contact-rules'
import { marketplaceCategoryUrl, marketplaceItemUrl } from '@/lib/nav/category-url'

interface ListingCardProps {
  item: Listing
  href?: string
  activeCategory?: string | null
}

export const ListingCard = memo(function ListingCard({ item, href, activeCategory }: ListingCardProps) {
  const itemHref = href ?? marketplaceItemUrl(item.id, activeCategory ?? item.category)
  const categoryHref = marketplaceCategoryUrl(item.category ?? 'Other')

  return (
    <article className="listing-card listing-card--dense listing-card--linked">
      <Link
        href={itemHref}
        className="listing-card__overlay-link"
        prefetch
        aria-label={`${item.title}, ${formatCredits(Math.floor(item.price ?? 0))} credits`}
      />
      <div className="listing-card__media">
        {item.images?.[0] ? (
          <Image src={item.images[0]} alt="" fill className="object-cover" loading="lazy" sizes="(max-width: 768px) 50vw, 280px" />
        ) : (
          <div className="listing-card__placeholder" aria-hidden>
            <Plus size={28} opacity={0.3} />
          </div>
        )}
        <Link href={categoryHref} className="listing-card__category-link" prefetch>
          {item.category || 'Item'}
        </Link>
        <div className="listing-card__price">
          {item.price === 0 ? (
            'FREE'
          ) : (
            <>
              <Coins size={13} aria-hidden />
              {formatCredits(Math.floor(item.price))}
            </>
          )}
        </div>
      </div>

      <div className="listing-card__body">
        <div className="listing-card__head">
          <h3 className="listing-card__title">{item.title}</h3>
          <span className="listing-card__condition">{item.condition || 'Used'}</span>
        </div>
        <div className="listing-card__zone">
          <MapPin size={12} aria-hidden />
          <span>{item.meetup_zone}</span>
        </div>
        <div className="listing-card__seller">
          <RemoteAvatar
            src={
              item.owner_id
                ? avatarUrlForProfile({
                    id: item.owner_id,
                    full_name: item.profiles?.full_name,
                    username: item.profiles?.username ?? null,
                    avatar_url: item.profiles?.avatar_url,
                  })
                : ''
            }
            alt=""
            size={28}
            style={{ border: '2px solid var(--bg-main)', background: 'var(--brand)' }}
            fallback={
              <span style={{ color: 'white', fontWeight: 900, fontSize: '0.55rem' }}>
                {item.profiles?.full_name?.charAt(0) || '?'}
              </span>
            }
          />
          <span className="listing-card__seller-name">{item.profiles?.full_name || 'Seller'}</span>
          <span className="listing-card__qty">{item.quantity || 1}×</span>
        </div>
      </div>
    </article>
  )
})
