'use client'

import React, { useMemo, useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { Flame, TrendingUp, Tag, User, Loader2, Zap } from 'lucide-react'
import { Listing, MarketplaceCategory } from '@/types/marketplace'
import { computeMarketplaceTrending, isListingAvailable } from '@/lib/marketplace/trending'
import { formatCredits } from '@/lib/credits'
import { runMarketplaceCreditCheckout } from '@/lib/marketplace/run-marketplace-checkout'
import { useTransactionConfirm } from '@/hooks/useTransactionConfirm'
import { marketplacePurchaseCopy } from '@/lib/platform/transaction-confirm-copy'
import { useNotifications } from '@/components/NotificationProvider'

interface MarketplaceTrendingRailProps {
  listings: Listing[]
  userCredits: number | null
  currentUserId?: string | null
  onSelectListing: (listing: Listing) => void
  onPurchaseComplete: (payload: { buyerCredits: number }) => void
  onFilterCategory: (category: MarketplaceCategory | 'All') => void
}

export function MarketplaceTrendingRail({
  listings,
  userCredits,
  currentUserId,
  onSelectListing,
  onPurchaseComplete,
  onFilterCategory,
}: MarketplaceTrendingRailProps) {
  const { addToast } = useNotifications()
  const { confirmTransaction } = useTransactionConfirm()
  const [busyId, setBusyId] = useState<string | null>(null)

  const { trendingItems, trendingSellers, trendingCategories } = useMemo(
    () => computeMarketplaceTrending(listings),
    [listings],
  )

  const quickCheckout = async (listing: Listing, e: React.MouseEvent) => {
    e.stopPropagation()
    if (currentUserId === listing.owner_id) {
      addToast('Cannot purchase', 'This is your listing.', 'warning')
      return
    }
    if (!isListingAvailable(listing)) {
      addToast('Sold out', 'This item is no longer available.', 'warning')
      return
    }

    const price = Math.max(0, Math.floor(listing.price ?? 0))
    const ok = await confirmTransaction(marketplacePurchaseCopy(listing.title, price))
    if (!ok) return

    setBusyId(listing.id)
    try {
      const result = await runMarketplaceCreditCheckout(listing.id, addToast)
      if (!result) return
      onPurchaseComplete({ buyerCredits: result.buyerCredits })
      addToast('Done', price === 0 ? 'Item claimed.' : `Purchased for ${formatCredits(price)}.`, 'success')
    } catch {
      addToast('Error', 'Checkout could not complete.', 'error')
    } finally {
      setBusyId(null)
    }
  }

  if (trendingItems.length === 0) return null

  return (
    <section style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
        <Flame size={22} style={{ color: 'var(--brand)' }} />
        <h2 style={{ margin: 0, fontSize: '1.15rem', fontWeight: 950, letterSpacing: '-0.02em' }}>Trending now</h2>
      </div>

      <div style={{ display: 'flex', gap: '0.75rem', overflowX: 'auto', paddingBottom: '0.25rem' }}>
        {trendingItems.map((item) => {
          const price = Math.max(0, Math.floor(item.price ?? 0))
          const loading = busyId === item.id
          return (
            <article
              key={item.id}
              onClick={() => onSelectListing(item)}
              style={{
                minWidth: '220px',
                maxWidth: '220px',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '20px',
                overflow: 'hidden',
                cursor: 'pointer',
                flexShrink: 0,
              }}
            >
              <div style={{ height: '120px', position: 'relative', background: 'var(--bg-sub)' }}>
                {item.images?.[0] && (
                  <Image src={item.images[0]} alt="" fill className="object-cover" />
                )}
              </div>
              <div style={{ padding: '0.85rem' }}>
                <div style={{ fontWeight: 900, fontSize: '0.85rem', marginBottom: '0.35rem', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                  {item.title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--brand)', fontWeight: 800, marginBottom: '0.65rem' }}>
                  {price === 0 ? 'FREE' : formatCredits(price)}
                </div>
                <button
                  type="button"
                  disabled={loading}
                  onClick={(e) => void quickCheckout(item, e)}
                  style={{
                    width: '100%',
                    padding: '0.5rem',
                    borderRadius: '10px',
                    border: 'none',
                    background: 'var(--brand)',
                    color: '#000',
                    fontWeight: 950,
                    fontSize: '0.75rem',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.35rem',
                  }}
                >
                  {loading ? <Loader2 size={14} className="animate-spin" /> : <Zap size={14} />}
                  1-click checkout
                </button>
              </div>
            </article>
          )
        })}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '1rem' }}>
        <div style={{ padding: '1rem', background: 'var(--surface)', borderRadius: '20px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <User size={18} style={{ color: 'var(--brand)' }} />
            <span style={{ fontWeight: 900, fontSize: '0.85rem' }}>Top sellers</span>
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
            {trendingSellers.map((s) => (
              <div key={s.ownerId} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                <Link
                  href={`/network/profile/${s.ownerId}`}
                  onClick={(e) => e.stopPropagation()}
                  style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flex: 1, textDecoration: 'none', color: 'inherit', minWidth: 0 }}
                >
                  <div style={{ width: 28, height: 28, borderRadius: '8px', background: 'var(--brand)', overflow: 'hidden', flexShrink: 0 }}>
                    {s.avatarUrl && <Image src={s.avatarUrl} width={28} height={28} alt="" />}
                  </div>
                  <span style={{ fontWeight: 800, fontSize: '0.8rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{s.name}</span>
                </Link>
                <span style={{ fontSize: '0.7rem', color: 'var(--text-sub)', fontWeight: 700 }}>{s.listingCount}</span>
                <button
                  type="button"
                  disabled={busyId === s.sampleListing.id}
                  onClick={(e) => void quickCheckout(s.sampleListing, e)}
                  style={{
                    padding: '4px 8px',
                    borderRadius: '8px',
                    border: 'none',
                    background: 'rgba(var(--brand-rgb), 0.15)',
                    color: 'var(--brand)',
                    fontWeight: 900,
                    fontSize: '0.65rem',
                    cursor: 'pointer',
                  }}
                >
                  Buy
                </button>
              </div>
            ))}
          </div>
        </div>

        <div style={{ padding: '1rem', background: 'var(--surface)', borderRadius: '20px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.75rem' }}>
            <Tag size={18} style={{ color: 'var(--brand)' }} />
            <span style={{ fontWeight: 900, fontSize: '0.85rem' }}>Hot categories</span>
          </div>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
            {trendingCategories.map((c) => (
              <button
                key={c.category}
                type="button"
                onClick={() => onFilterCategory(c.category)}
                style={{
                  padding: '6px 12px',
                  borderRadius: '100px',
                  border: '1px solid var(--border)',
                  background: 'var(--bg-sub)',
                  color: 'var(--text-main)',
                  fontWeight: 800,
                  fontSize: '0.75rem',
                  cursor: 'pointer',
                }}
              >
                {c.category} ({c.count})
              </button>
            ))}
          </div>
        </div>

        <div style={{ padding: '1rem', background: 'var(--surface)', borderRadius: '20px', border: '1px solid var(--border)' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
            <TrendingUp size={18} style={{ color: 'var(--brand)' }} />
            <span style={{ fontWeight: 900, fontSize: '0.85rem' }}>Your credits</span>
          </div>
          <p style={{ margin: '0 0 0.75rem', fontSize: '1.5rem', fontWeight: 950, color: 'var(--brand)' }}>
            {userCredits === null ? '—' : `${userCredits}`}
          </p>
          <p style={{ margin: 0, fontSize: '0.75rem', color: 'var(--text-sub)', lineHeight: 1.5 }}>
            Pay with Espeezy credits. Invoices go to your inbox and email after each purchase.
          </p>
        </div>
      </div>
    </section>
  )
}
