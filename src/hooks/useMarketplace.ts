'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { db } from '@/lib/firebase'
import { 
  collection, 
  getDocs, 
  query, 
  orderBy, 
  where,
  documentId
} from 'firebase/firestore'
import { useSmartLoading } from '@/components/GlobalLoadingProvider'
import { useNotifications } from '@/components/NotificationProvider'
import { Listing, MarketplaceCategory } from '@/types/marketplace'

export function useMarketplace() {
  const [listings, setListings] = useState<Listing[]>([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState<MarketplaceCategory>('All')
  const [isPosting, setIsPosting] = useState(false)
  const [showWalkthrough, setShowWalkthrough] = useState(false)
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  
  const { withLoading } = useSmartLoading()
  const { addToast } = useNotifications()

  const fetchListings = useCallback(async () => {
    setLoading(true)
    
    try {
      const listingsSnap = await getDocs(query(
        collection(db, 'marketplace_listings'),
        orderBy('created_at', 'desc')
      ))
      
      const listingsData = listingsSnap.docs.map(doc => ({ id: doc.id, ...doc.data() } as any))
      const ownerIds = Array.from(new Set(listingsData.map(l => l.owner_id).filter(Boolean)))
      
      if (ownerIds.length > 0) {
        // Firestore 'in' queries are limited to 10-30 items depending on version, 
        // but for now we'll assume it fits or handle chunks if needed.
        const profilesSnap = await getDocs(query(
          collection(db, 'profiles'),
          where(documentId(), 'in', ownerIds.slice(0, 30))
        ))

        const profileMap = profilesSnap.docs.reduce((acc, p) => {
          acc[p.id] = p.data()
          return acc
        }, {} as Record<string, any>)

        const merged = listingsData.map(l => ({
          ...l,
          profiles: profileMap[l.owner_id]
        }))

        setListings(merged)
        localStorage.setItem('gf_marketplace_cache', JSON.stringify(merged))
      } else {
        setListings([])
        localStorage.setItem('gf_marketplace_cache', JSON.stringify([]))
      }
    } catch (err: any) {
      console.error('Fetch error:', err.message)
      setListings([])
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const hasSeen = localStorage.getItem('gf_marketplace_onboarding')
    if (!hasSeen) {
      setShowWalkthrough(true)
      localStorage.setItem('gf_marketplace_onboarding', 'true')
    }

    const cached = localStorage.getItem('gf_marketplace_cache')
    if (cached) {
      try {
        setListings(JSON.parse(cached))
        setLoading(false)
      } catch (e) {
        console.error("Marketplace cache corrupted", e)
      }
    }

    void fetchListings()
  }, [fetchListings])

  const filteredListings = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return listings.filter(l => {
      const matchesSearch = l.title.toLowerCase().includes(query) ||
                          l.description?.toLowerCase().includes(query)
      const matchesCategory = activeCategory === 'All' || l.category === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [listings, searchQuery, activeCategory])

  return {
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
    fetchListings
  }
}
