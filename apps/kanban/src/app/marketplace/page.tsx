'use client'

import React, { useEffect, useState } from 'react'
import { Plus, Search, ShoppingBag, Loader2, Coins } from 'lucide-react'
import { createClient as createBrowserSupabaseClient } from '@/lib/supabase/client'
import { useMarketplace } from '@/hooks/useMarketplace'
import { useEspeezyCredits } from '@/hooks/useEspeezyCredits'
import { ListingCard } from '@/components/marketplace/ListingCard'
import { MarketplaceSidebar } from '@/components/marketplace/MarketplaceSidebar'
import { MarketplaceCategoryChips } from '@/components/marketplace/MarketplaceCategoryChips'
import { PostListingModal } from '@/components/marketplace/PostListingModal'
import { ListingDetailPanel } from '@/components/marketplace/ListingDetailPanel'
import { MarketplaceTrendingRail } from '@/components/marketplace/MarketplaceTrendingRail'
import { OnboardingModal } from '@/components/marketplace/OnboardingModal'
import { AccountWalletPanel } from '@/components/AccountWalletPanel'
import Link from 'next/link'
import type { MarketplaceCategory } from '@/types/marketplace'
import './marketplace.css'

const CATEGORIES = ['All', 'Electronics', 'Textbooks', 'Lab Equipment', 'Stationery', 'Hardware', 'Other']

export default function MarketplacePage() {
  const {
    listings,
    filteredListings,
    loading,
    searchQuery,
    setSearchQuery,
    activeCategory,
    setActiveCategory,
    isPosting,
    setIsPosting,
    showWalkthrough,
    setShowWalkthrough,
    selectedListing,
    setSelectedListing,
    fetchListings,
    loadingMore,
    hasMore,
    loadMore,
    categories,
  } = useMarketplace()

  const { credits, loading: creditsLoading, refresh: refreshCredits, setCredits } = useEspeezyCredits()
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)

  useEffect(() => {
    const db = createBrowserSupabaseClient()
    db.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null))
  }, [])

  const handlePurchaseComplete = (payload: { buyerCredits: number }) => {
    setCredits(payload.buyerCredits)
    void refreshCredits()
    void fetchListings()
  }

  const catList = categories.length ? categories : CATEGORIES
  const showSkeleton = loading && filteredListings.length === 0

  return (
    <div className="marketplace-page page-fade">
      <AccountWalletPanel compact />

      <header className="marketplace-page__header">
        <div>
          <h1 style={{ margin: 0, fontSize: '1.35rem', fontWeight: 950, letterSpacing: '-0.03em' }}>
            Campus Marketplace
          </h1>
          <p style={{ margin: '0.2rem 0 0', color: 'var(--text-sub)', fontSize: '0.8rem', fontWeight: 600 }}>
            Pay with Espeezy credits · fast campus checkout
          </p>
          <Link href="/assets" style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--brand)' }}>
            Arsenal assets →
          </Link>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.45rem',
            padding: '0.5rem 0.75rem',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '12px',
          }}
          aria-label="Your credit balance"
        >
          <Coins size={18} style={{ color: 'var(--brand)' }} aria-hidden />
          <div>
            <div style={{ fontSize: '0.6rem', fontWeight: 800, color: 'var(--text-sub)', textTransform: 'uppercase' }}>
              Credits
            </div>
            <div style={{ fontWeight: 950, fontSize: '1rem', color: 'var(--brand)' }}>
              {creditsLoading ? '…' : credits ?? '—'}
            </div>
          </div>
        </div>
      </header>

      <MarketplaceCategoryChips
        categories={catList}
        activeCategory={activeCategory}
        onSelect={(cat) => setActiveCategory(cat as MarketplaceCategory)}
      />

      <div className="marketplace-page__layout">
        <MarketplaceSidebar
          categories={catList}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
        />

        <div className="marketplace-page__main">
          <MarketplaceTrendingRail
            listings={listings}
            userCredits={credits}
            currentUserId={currentUserId}
            onSelectListing={setSelectedListing}
            onPurchaseComplete={handlePurchaseComplete}
            onFilterCategory={(cat) => setActiveCategory(cat as MarketplaceCategory | 'All')}
          />

          <div className="marketplace-page__toolbar">
            <div className="marketplace-page__search">
              <Search
                style={{ position: 'absolute', left: '0.85rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-sub)' }}
                size={18}
                aria-hidden
              />
              <input
                type="search"
                placeholder="Search listings…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                aria-label="Search marketplace listings"
              />
            </div>
            <button type="button" className="marketplace-page__post-btn" onClick={() => setIsPosting(true)} aria-label="Post new listing">
              <Plus size={20} aria-hidden />
              <span className="hide-mobile">Post</span>
            </button>
          </div>

          {showSkeleton ? (
            <div className="marketplace-page__skeleton-grid" aria-busy="true" aria-label="Loading listings">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="marketplace-skeleton-card" />
              ))}
            </div>
          ) : filteredListings.length === 0 ? (
            <div
              style={{
                padding: '3rem 1.25rem',
                textAlign: 'center',
                background: 'var(--surface)',
                borderRadius: '16px',
                border: '1px dashed var(--border)',
              }}
            >
              <ShoppingBag size={40} style={{ margin: '0 auto', opacity: 0.2, marginBottom: '1rem' }} aria-hidden />
              <h3 style={{ fontWeight: 900, marginBottom: '0.35rem' }}>No listings found</h3>
              <p style={{ color: 'var(--text-sub)', fontSize: '0.85rem' }}>Try another category or search term.</p>
            </div>
          ) : (
            <>
              <div className="marketplace-page__grid" role="list">
                {filteredListings.map((item) => (
                  <ListingCard key={item.id} item={item} onClick={setSelectedListing} />
                ))}
              </div>
              {hasMore && (
                <button
                  type="button"
                  className="btn btn-secondary"
                  disabled={loadingMore}
                  onClick={() => loadMore()}
                  style={{
                    width: '100%',
                    marginTop: '0.5rem',
                    padding: '0.85rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                    minHeight: 48,
                  }}
                >
                  {loadingMore ? <Loader2 size={18} className="animate-spin" aria-hidden /> : null}
                  Load more
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {showWalkthrough && <OnboardingModal onClose={() => setShowWalkthrough(false)} />}

      {isPosting && (
        <PostListingModal
          onClose={() => setIsPosting(false)}
          onSuccess={() => {
            setIsPosting(false)
            void fetchListings()
          }}
        />
      )}

      {selectedListing && (
        <ListingDetailPanel
          listing={selectedListing}
          userCredits={credits}
          currentUserId={currentUserId}
          onClose={() => setSelectedListing(null)}
          onPurchaseComplete={({ buyerCredits }) => handlePurchaseComplete({ buyerCredits })}
        />
      )}
    </div>
  )
}
