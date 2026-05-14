'use client'

import React from 'react'
import { Plus, Search, ShoppingBag, Loader2 } from 'lucide-react'
import { useMarketplace } from '@/hooks/useMarketplace'
import { ListingCard } from '@/components/marketplace/ListingCard'
import { MarketplaceSidebar } from '@/components/marketplace/MarketplaceSidebar'
import { PostListingModal } from '@/components/marketplace/PostListingModal'
import { ItemDetailModal } from '@/components/marketplace/ItemDetailModal'
import { OnboardingModal } from '@/components/marketplace/OnboardingModal'

const CATEGORIES = ['All', 'Electronics', 'Textbooks', 'Lab Equipment', 'Stationery', 'Hardware', 'Other']

/**
 * MARKETPLACE REFACTORED
 * Modular, maintainable, and high-performance campus exchange.
 */
export default function MarketplacePage() {
  const {
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
    fetchListings
  } = useMarketplace()

  return (
    <div className="page-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '6rem', position: 'relative' }}>
      
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        
        {/* MODULAR SIDEBAR */}
        <MarketplaceSidebar 
          categories={CATEGORIES} 
          activeCategory={activeCategory} 
          setActiveCategory={setActiveCategory} 
        />

        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* SEARCH & CONTROL HEADER */}
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
                  outline: 'none'
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
                transition: '0.3s'
              }}
              className="hover-card"
            >
              <Plus size={20} />
              <span className="hide-mobile">POST ITEM</span>
            </button>
          </div>

          {/* MAIN LISTINGS GRID */}
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
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '1.5rem' }}>
              {filteredListings.map(item => (
                <ListingCard 
                  key={item.id} 
                  item={item} 
                  onClick={setSelectedListing} 
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* MODAL ORCHESTRATION */}
      {showWalkthrough && <OnboardingModal onClose={() => setShowWalkthrough(false)} />}

      {isPosting && (
        <PostListingModal 
          onClose={() => setIsPosting(false)} 
          onSuccess={() => { setIsPosting(false); fetchListings(); }} 
        />
      )}

      {selectedListing && (
        <ItemDetailModal 
          listing={selectedListing} 
          onClose={() => setSelectedListing(null)} 
        />
      )}
      
      <style jsx global>{`
        @keyframes page-fade {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .page-fade {
          animation: page-fade 0.6s cubic-bezier(0.22, 1, 0.36, 1) forwards;
        }
      `}</style>
    </div>
  )
}
