'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { createClient as createBrowserSupabaseClient } from '@/lib/supabase/client'
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
  const db = useMemo(() => createBrowserSupabaseClient(), [])
  
  const { withLoading } = useSmartLoading()
  const { addToast } = useNotifications()

  const fetchListings = useCallback(async () => {
    setLoading(true)
    
    try {
      // Fetch marketplace_listings from Supabase
      const { data: listingsData, error: listingsError } = await db
        .from('marketplace_listings')
        .select('*')
        .order('created_at', { ascending: false })
      
      if (listingsError) {
        console.error('Fetch error:', listingsError.message)
        setListings([])
        return
      }

      if (!listingsData || listingsData.length === 0) {
        setListings([])
        localStorage.setItem('gf_marketplace_cache', JSON.stringify([]))
        return
      }

      // Extract unique owner IDs
      const ownerIds = Array.from(new Set((listingsData as Listing[]).map(l => l.owner_id).filter(Boolean)))

      if (ownerIds.length > 0) {
        // Fetch profiles for owner enrichment
        const { data: profilesData, error: profilesError } = await db
          .from('profiles')
          .select('*')
          .in('id', ownerIds)
        
        if (profilesError) {
          console.error('Profile fetch error:', profilesError)
          setListings(listingsData as Listing[])
        } else {
          const profileMap = (profilesData || []).reduce((acc: Record<string, { full_name: string; avatar_url: string; role: string }>, p: { id: string; full_name: string; avatar_url: string; role: string }) => {
            acc[p.id] = p
            return acc
          }, {})

          const merged = (listingsData as Listing[]).map(l => ({
            ...l,
            profiles: profileMap[l.owner_id]
          }))

          setListings(merged)
          localStorage.setItem('gf_marketplace_cache', JSON.stringify(merged))
        }
      } else {
        setListings(listingsData as Listing[])
        localStorage.setItem('gf_marketplace_cache', JSON.stringify(listingsData))
      }
    } catch (err) {
      if (err && typeof err === 'object' && 'message' in err) {
        console.error('Fetch error:', (err as { message: string }).message)
      } else {
        console.error('Fetch error:', err)
      }
      setListings([])
    } finally {
      setLoading(false)
    }
  }, [db])

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
