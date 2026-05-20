'use client'

import React, { useEffect, useState, Suspense, useMemo, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import { Plus, Search, ShoppingBag, Loader2, Coins, MessageSquare } from 'lucide-react'
import { createClient as createBrowserSupabaseClient } from '@/lib/supabase/client'
import { useMarketplace } from '@/hooks/useMarketplace'
import { useEspeezyCredits } from '@/hooks/useEspeezyCredits'
import { ListingCard } from '@/components/marketplace/ListingCard'
import { PostListingModal } from '@/components/marketplace/PostListingModal'
import { ListingDetailPanel } from '@/components/marketplace/ListingDetailPanel'
import { MarketplaceInquiriesPanel } from '@/components/marketplace/MarketplaceInquiriesPanel'
import { MarketplaceTrendingRail } from '@/components/marketplace/MarketplaceTrendingRail'
import { OnboardingModal } from '@/components/marketplace/OnboardingModal'
import { AccountWalletPanel } from '@/components/AccountWalletPanel'
import { CategoryNavDropdown } from '@/components/nav/CategoryNavDropdown'
import { ListPagination } from '@/components/nav/ListPagination'
import { SearchField } from '@/components/forms/SearchField'
import Link from 'next/link'
import type { MarketplaceCategory } from '@/types/marketplace'
import {
  marketplaceCategoryUrl,
  marketplaceListUrl,
  marketplaceNavContext,
} from '@/lib/nav/category-url'
import { useDebouncedListSearch } from '@/lib/nav/use-debounced-list-search'
import './marketplace.css'
import '@/components/nav/list-nav.css'
import { useMobilePageControls } from '@/components/mobile/MobilePageControlsContext'

const CATEGORIES = ['All', 'Electronics', 'Textbooks', 'Lab Equipment', 'Stationery', 'Hardware', 'Other']

function MarketplacePageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()
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
  const [inquiriesOpen, setInquiriesOpen] = useState(false)
  const [inquiryUnread, setInquiryUnread] = useState(0)
  const [inquiryPeerId, setInquiryPeerId] = useState<string | null>(null)
  const [inquiryListingId, setInquiryListingId] = useState<string | null>(null)

  useEffect(() => {
    const db = createBrowserSupabaseClient()
    db.auth.getUser().then(({ data }) => setCurrentUserId(data.user?.id ?? null))
  }, [])

  const { draft: searchDraft, setDraft: setSearchDraft, clear: clearSearch } = useDebouncedListSearch({
      searchParams,
      router,
      pathname: '/marketplace',
      committedQuery: searchQuery,
      setCommittedQuery: setSearchQuery,
    })

  const navCtx = useMemo(
    () => marketplaceNavContext(activeCategory, searchQuery),
    [activeCategory, searchQuery],
  )

  useEffect(() => {
    if (!searchParams) return
    const urlCat = searchParams.get('category')
    if (urlCat) setActiveCategory(urlCat as MarketplaceCategory)
    else setActiveCategory('All')
  }, [searchParams, setActiveCategory])

  useEffect(() => {
    if (!searchParams) return
    const itemId = searchParams.get('item')
    if (!itemId) {
      setSelectedListing(null)
      return
    }
    const found = listings.find((l) => l.id === itemId)
    if (found) setSelectedListing(found)
  }, [searchParams, listings, setSelectedListing])

  useEffect(() => {
    if (!searchParams) return
    const peer = searchParams.get('inquiry')
    const listing = searchParams.get('listing')
    if (peer) {
      setInquiryPeerId(peer)
      setInquiryListingId(listing)
      setInquiriesOpen(true)
    }
  }, [searchParams])

  useEffect(() => {
    if (!searchParams || searchParams.get('fund') !== 'success') return
    const sessionId = searchParams.get('session_id')
    if (!sessionId) return

    let attempts = 0
    const poll = async () => {
      const res = await fetch(`/api/credits/fund/status?session_id=${encodeURIComponent(sessionId)}`, {
        credentials: 'include',
      })
      const data = (await res.json()) as { status?: string; balance?: number }
      if (data.status === 'completed' && typeof data.balance === 'number') {
        setCredits(data.balance)
        void refreshCredits()
        return
      }
      attempts += 1
      if (attempts < 12) setTimeout(poll, 2000)
    }
    void poll()
  }, [searchParams, refreshCredits, setCredits])

  useEffect(() => {
    if (!currentUserId) return
    void fetch('/api/marketplace/inquiries', { credentials: 'include' })
      .then((r) => (r.ok ? r.json() : null))
      .then((data: { unreadTotal?: number } | null) => {
        if (data?.unreadTotal != null) setInquiryUnread(data.unreadTotal)
      })
      .catch(() => undefined)
  }, [currentUserId])

  const replaceMarketplaceUrl = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams?.toString() ?? '')
      mutate(params)
      const q = params.toString()
      router.replace(q ? `/marketplace?${q}` : '/marketplace', { scroll: false })
    },
    [router, searchParams],
  )

  const openInquiry = (peerId: string, listingId: string) => {
    setInquiryPeerId(peerId)
    setInquiryListingId(listingId)
    setInquiriesOpen(true)
    replaceMarketplaceUrl((params) => {
      params.set('inquiry', peerId)
      params.set('listing', listingId)
    })
  }

  const closeInquiries = () => {
    setInquiriesOpen(false)
    setInquiryPeerId(null)
    setInquiryListingId(null)
    replaceMarketplaceUrl((params) => {
      params.delete('inquiry')
      params.delete('listing')
    })
  }

  const closeListing = () => {
    setSelectedListing(null)
    replaceMarketplaceUrl((params) => {
      params.delete('item')
    })
  }

  const handlePurchaseComplete = (payload: { buyerCredits: number }) => {
    setCredits(payload.buyerCredits)
    void refreshCredits()
    void fetchListings()
  }

  const catList = categories.length ? categories : CATEGORIES
  const showSkeleton = loading && filteredListings.length === 0
  const activeCategoryId = activeCategory === 'All' ? 'all' : activeCategory

  const categoryNavItems = useMemo(
    () =>
      catList
        .filter((c) => c !== 'All')
        .map((cat) => ({
          id: cat,
          label: cat,
          href: marketplaceCategoryUrl(cat, { q: navCtx.q }),
        })),
    [catList, navCtx.q],
  )

  useMobilePageControls({
    search: {
      value: searchDraft,
      onChange: setSearchDraft,
      onClear: clearSearch,
      placeholder: 'Search listings…',
    },
    filterPanels: [
      {
        id: 'category',
        label: activeCategory === 'All' ? 'Category' : activeCategory,
        content: (
          <CategoryNavDropdown
            items={categoryNavItems}
            activeId={activeCategoryId}
            allHref={marketplaceListUrl({ q: navCtx.q })}
            allLabel="All categories"
            alwaysExpanded
          />
        ),
      },
    ],
    actions: [
      {
        id: 'inquiries',
        label: 'Inquiries',
        icon: <MessageSquare size={17} />,
        onClick: () => setInquiriesOpen(true),
        badge: inquiryUnread,
      },
      {
        id: 'post',
        label: 'Post listing',
        icon: <Plus size={17} />,
        onClick: () => setIsPosting(true),
        variant: 'primary',
      },
    ],
  })

  return (
    <div className="marketplace-page page-shell marketplace-page--compact page-fade list-page--compact">
      <AccountWalletPanel compact />

      <header className="marketplace-page__header page-list-header page-header page-header--compact">
        <div className="page-header__main">
          <h1 className="page-header__title">Campus Marketplace</h1>
          <p className="page-header__desc">Pay with Espeezy credits · fast campus checkout</p>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap', marginTop: '0.15rem' }}>
            <Link href="/assets" style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--brand)' }}>
              Arsenal assets →
            </Link>
            <Link href="/account/credits" style={{ fontSize: '0.72rem', fontWeight: 800, color: 'var(--brand)' }}>
              Credit account →
            </Link>
          </div>
        </div>
        <div
          className="page-header__aside"
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

      <div className="marketplace-page__layout">
        <div className="marketplace-page__main page-list-main">
          <MarketplaceTrendingRail
            listings={listings}
            userCredits={credits}
            currentUserId={currentUserId}
            onSelectListing={setSelectedListing}
            onPurchaseComplete={handlePurchaseComplete}
            onFilterCategory={(cat) => {
              router.push(
                marketplaceCategoryUrl(cat === 'All' ? 'All' : cat, { q: navCtx.q }),
              )
            }}
          />

          <div className="marketplace-page__toolbar page-list-toolbar">
            <SearchField
              id="marketplace-search"
              className="marketplace-page__search"
              label="Search marketplace listings"
              placeholder="Search listings…"
              value={searchDraft}
              onChange={setSearchDraft}
              onClear={clearSearch}
              leadingIcon={<Search size={18} />}
              inputClassName="form-input marketplace-page__search-input"
            />
            <CategoryNavDropdown
              items={categoryNavItems}
              activeId={activeCategoryId}
              allHref={marketplaceListUrl({ q: navCtx.q })}
              allLabel="All categories"
            />
            <button
              type="button"
              className="marketplace-page__inquiry-btn"
              onClick={() => setInquiriesOpen(true)}
              aria-label="Open marketplace inquiries"
            >
              <MessageSquare size={18} aria-hidden />
              <span className="hide-mobile">Inquiries</span>
              {inquiryUnread > 0 ? (
                <span className="marketplace-inquiry-pill">{inquiryUnread > 9 ? '9+' : inquiryUnread}</span>
              ) : null}
            </button>
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
                  <ListingCard
                    key={item.id}
                    item={item}
                    activeCategory={activeCategory === 'All' ? null : activeCategory}
                    searchQuery={searchQuery}
                  />
                ))}
              </div>
              <ListPagination
                loadedCount={filteredListings.length}
                hasMore={hasMore}
                loadingMore={loadingMore}
                onLoadMore={loadMore}
                itemLabel="listings"
              />
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
          onClose={closeListing}
          onPurchaseComplete={({ buyerCredits }) => handlePurchaseComplete({ buyerCredits })}
          onOpenInquiry={(peerId, listingId) => {
            setSelectedListing(null)
            openInquiry(peerId, listingId)
          }}
        />
      )}

      <MarketplaceInquiriesPanel
        open={inquiriesOpen}
        onClose={closeInquiries}
        currentUserId={currentUserId}
        initialPeerId={inquiryPeerId}
        initialListingId={inquiryListingId}
        onUnreadChange={setInquiryUnread}
      />
    </div>
  )
}

export default function MarketplacePage() {
  return (
    <Suspense
      fallback={
        <div className="marketplace-page page-shell page-fade" style={{ padding: '2rem', textAlign: 'center' }}>
          <Loader2 className="animate-spin" />
        </div>
      }
    >
      <MarketplacePageInner />
    </Suspense>
  )
}
