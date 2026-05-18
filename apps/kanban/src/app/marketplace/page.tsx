'use client'

import React, { useEffect, useState } from 'react'
import { Plus, Search, ShoppingBag, Loader2, Coins } from 'lucide-react'
import { createClient as createBrowserSupabaseClient } from '@/lib/supabase/client'
import { useMarketplace } from '@/hooks/useMarketplace'
import { useEspeezyCredits } from '@/hooks/useEspeezyCredits'
import { ListingCard } from '@/components/marketplace/ListingCard'
import { MarketplaceSidebar } from '@/components/marketplace/MarketplaceSidebar'
import { PostListingModal } from '@/components/marketplace/PostListingModal'
import { ListingDetailPanel } from '@/components/marketplace/ListingDetailPanel'
import { MarketplaceTrendingRail } from '@/components/marketplace/MarketplaceTrendingRail'
import { OnboardingModal } from '@/components/marketplace/OnboardingModal'
import { StripeOnboarding } from '@/components/marketplace/StripeOnboarding'
import { StripeWithdraw } from '@/components/marketplace/StripeWithdraw'
import { StripeInstructions } from '@/components/marketplace/StripeInstructions'
import { AccountWalletPanel } from '@/components/AccountWalletPanel'
import type { MarketplaceCategory } from '@/types/marketplace'

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
  const [balanceCents, setBalanceCents] = React.useState(0)

  useEffect(() => {
    const db = createBrowserSupabaseClient()
    db.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null))
  }, [])

  React.useEffect(() => {
    fetch('/api/account')
      .then((res) => res.json())
      .then((data) => setBalanceCents(data.balance_cents || 0))
      .catch(() => setBalanceCents(0))
  }, [])

  const handlePurchaseComplete = (payload: { buyerCredits: number }) => {
    setCredits(payload.buyerCredits)
    void refreshCredits()
    void fetchListings()
  }

  return (
    <div className="page-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '6rem', position: 'relative' }}>
      <StripeInstructions />
      <StripeOnboarding />
      <StripeWithdraw balanceCents={balanceCents} />

      <AccountWalletPanel compact />

      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: '0 0.25rem',
        }}
      >
        <div>
          <h1 style={{ margin: 0, fontSize: '1.5rem', fontWeight: 950, letterSpacing: '-0.03em' }}>Campus Marketplace</h1>
          <p style={{ margin: '0.25rem 0 0', color: 'var(--text-sub)', fontSize: '0.85rem', fontWeight: 600 }}>
            Buy and sell with Espeezy credits · printable invoices for every party
          </p>
        </div>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            padding: '0.65rem 1rem',
            background: 'var(--surface)',
            border: '1px solid var(--border)',
            borderRadius: '16px',
          }}
        >
          <Coins size={20} style={{ color: 'var(--brand)' }} />
          <div>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--text-sub)', textTransform: 'uppercase' }}>Your credits</div>
            <div style={{ fontWeight: 950, fontSize: '1.1rem', color: 'var(--brand)' }}>
              {creditsLoading ? '…' : credits ?? '—'}
            </div>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        <MarketplaceSidebar
          categories={categories.length ? categories : CATEGORIES}
          activeCategory={activeCategory}
          setActiveCategory={setActiveCategory}
        />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          <MarketplaceTrendingRail
            listings={listings}
            userCredits={credits}
            currentUserId={currentUserId}
            onSelectListing={setSelectedListing}
            onPurchaseComplete={handlePurchaseComplete}
            onFilterCategory={(cat) => setActiveCategory(cat as MarketplaceCategory | 'All')}
          />

          <div style={{ display: 'flex', gap: '1rem', alignItems: 'center' }}>
            <div style={{ position: 'relative', flex: 1 }}>
              <Search style={{ position: 'absolute', left: '1.25rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-sub)' }} size={20} />
              <input
                type="text"
                placeholder="Filter by title, content, or seller..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                style={{
                  width: '100%',
                  padding: '1rem 1.25rem 1rem 3.5rem',
                  background: 'var(--surface)',
                  border: '1px solid var(--border)',
                  borderRadius: '20px',
                  fontSize: '1rem',
                  fontWeight: 600,
                  boxShadow: 'var(--shadow-md)',
                  outline: 'none',
                }}
              />
            </div>
            <button
              onClick={() => setIsPosting(true)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.75rem',
                padding: '1rem 1.5rem',
                background: 'var(--brand)',
                color: 'black',
                borderRadius: '20px',
                border: 'none',
                fontWeight: 950,
                cursor: 'pointer',
                boxShadow: 'var(--shadow-lg)',
              }}
              className="hover-card"
            >
              <Plus size={20} />
              <span className="hide-mobile">POST ITEM</span>
            </button>
          </div>

          {loading ? (
            <div style={{ padding: '5rem', textAlign: 'center' }}>
              <Loader2 size={40} className="animate-spin text-brand" style={{ margin: '0 auto' }} />
              <p style={{ marginTop: '1.5rem', fontWeight: 800, color: 'var(--text-sub)' }}>Synchronizing Marketplace Flux...</p>
            </div>
          ) : filteredListings.length === 0 ? (
            <div style={{ padding: '8rem 2rem', textAlign: 'center', background: 'var(--surface)', borderRadius: '24px', border: '1px dashed var(--border)' }}>
              <ShoppingBag size={48} style={{ margin: '0 auto', opacity: 0.2, marginBottom: '1.5rem' }} />
              <h3 style={{ fontWeight: 900, marginBottom: '0.5rem' }}>No Listings Found</h3>
              <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem' }}>Divergent results. Try adjusting your clearance filters.</p>
            </div>
          ) : (
            <>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
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
                    marginTop: '1rem',
                    padding: '1rem',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.5rem',
                  }}
                >
                  {loadingMore ? <Loader2 size={18} className="animate-spin" /> : null}
                  Load more listings
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

      <style jsx global>{`
        @keyframes page-fade {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .page-fade {
          animation: page-fade 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
      `}</style>
    </div>
  )
}
