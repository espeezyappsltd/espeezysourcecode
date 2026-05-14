'use client'

import { useState, useEffect, useCallback, useMemo } from 'react'
import { db, createBrowserSupabaseClient } from '@/lib/db-client'
import { 
  ShoppingBag, 
  Search, 
  MapPin, 
  Clock, 
  Plus, 
  Camera, 
  AlertTriangle, 
  Info,
  CheckCircle2,
  Handshake,
  DollarSign,
  ArrowRight,
  ShieldAlert,
  Loader2
} from 'lucide-react'
import { useProfile } from '@/context/ProfileContext'
import { useSmartLoading } from '@/components/GlobalLoadingProvider'
import { useNotifications } from '@/components/NotificationProvider'
import Image from 'next/image'
import { listingSchema } from '@/utils/validation'

interface Listing {
  id: string
  title: string
  description: string
  price: number
  is_free: boolean
  images: string[]
  meetup_zone: string
  meetup_details: string
  duration_days: number
  payment_method: string
  status: string
  owner_id: string
  category: string
  quantity: number
  condition: string
  created_at: string
  profiles?: {
    full_name: string
    avatar_url: string
    role: string
  }
}

export default function MarketplacePage() {
  const { profile } = useProfile()
  const [listings, setListings] = useState<Listing[]>([])
  const [isPosting, setIsPosting] = useState(false)
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [activeCategory, setActiveCategory] = useState('All')
  const [showWalkthrough, setShowWalkthrough] = useState(false)
  const [selectedListing, setSelectedListing] = useState<Listing | null>(null)
  
  const db = useMemo(() => createBrowserSupabaseClient(), [])
  const { withLoading } = useSmartLoading()
  const { addToast } = useNotifications()

  // 1. Check for first-time visitor
  useEffect(() => {
    const hasSeen = localStorage.getItem('gf_marketplace_onboarding')
    if (!hasSeen) {
      // eslint-disable-next-line react-hooks/set-state-in-effect
      setShowWalkthrough(true)
      localStorage.setItem('gf_marketplace_onboarding', 'true')
    }

    // LOAD CACHE FOR BLAZING SPEED
    const cached = localStorage.getItem('gf_marketplace_cache')
    if (cached) {
      try {
        setListings(JSON.parse(cached))
        setLoading(false) // Instant load from cache
      } catch (e) {
        console.error("Marketplace cache corrupted", e)
      }
    }
  }, [])

  const fetchListings = useCallback(async () => {
    setLoading(true)
    const { data, error } = await db
      .from('marketplace_listings')
      .select('*, profiles(full_name, avatar_url, role)')
      .order('created_at', { ascending: false })
    
    if (error) {
      console.error('Fetch error:', error.message)
    } else {
      setListings(data || [])
      localStorage.setItem('gf_marketplace_cache', JSON.stringify(data || []))
    }
    setLoading(false)
  }, [db])

  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    void fetchListings()
  }, [fetchListings])

  const categories = useMemo(() => ['All', 'Electronics', 'Textbooks', 'Lab Equipment', 'Stationery', 'Hardware', 'Other'], [])
 
  const filteredListings = useMemo(() => {
    const query = searchQuery.toLowerCase()
    return listings.filter(l => {
      const matchesSearch = l.title.toLowerCase().includes(query) ||
                          l.description?.toLowerCase().includes(query)
      const matchesCategory = activeCategory === 'All' || l.category === activeCategory
      return matchesSearch && matchesCategory
    })
  }, [listings, searchQuery, activeCategory])

  return (
    <div className="page-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem', paddingBottom: '6rem' }}>
      
      {/* ── MARKETPLACE BODY TRACE ────────────────────────────────────── */}
      <div style={{ display: 'flex', gap: '2rem', alignItems: 'flex-start' }}>
        
        {/* Sidebar Filters */}
        <aside style={{ width: '220px', flexShrink: 0, position: 'sticky', top: '1rem' }} className="hide-mobile">
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
            <div>
              <h3 style={{ fontSize: '0.75rem', fontWeight: 950, textTransform: 'uppercase', color: 'var(--text-sub)', letterSpacing: '0.1em', marginBottom: '1rem' }}>Categories</h3>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                {categories.map(cat => (
                  <button 
                    key={cat}
                    onClick={() => setActiveCategory(cat)}
                    style={{ 
                      textAlign: 'left', 
                      padding: '0.6rem 1rem', 
                      borderRadius: '12px', 
                      border: 'none', 
                      background: activeCategory === cat ? 'var(--brand)' : 'transparent',
                      color: activeCategory === cat ? 'black' : 'var(--text-main)',
                      fontSize: '0.85rem',
                      fontWeight: activeCategory === cat ? 900 : 600,
                      cursor: 'pointer',
                      transition: '0.2s'
                    }}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>
            
            <div style={{ padding: '1.25rem', background: 'rgba(var(--brand-rgb), 0.05)', borderRadius: '16px', border: '1px solid rgba(var(--brand-rgb), 0.1)' }}>
              <div style={{ fontWeight: 950, fontSize: '0.75rem', color: 'var(--brand)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>Global Sync</div>
              <p style={{ margin: 0, fontSize: '0.65rem', color: 'var(--text-sub)', lineHeight: 1.4 }}>Results are live from the campus-wide peer registry.</p>
            </div>
          </div>
        </aside>

        {/* Listings Content */}
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
          
          {/* SEARCH BAR */}
          <div style={{ position: 'relative' }}>
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
                <div 
                  key={item.id} 
                  className="listing-card"
                  onClick={() => setSelectedListing(item)}
                  style={{ 
                    borderRadius: '28px', 
                    overflow: 'hidden', 
                    border: '1px solid var(--border)',
                    background: 'var(--surface)',
                    display: 'flex',
                    flexDirection: 'column',
                    transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
                    cursor: 'pointer',
                    position: 'relative'
                  }}
                >
                  <div style={{ height: '220px', background: 'var(--bg-sub)', position: 'relative', overflow: 'hidden' }}>
                    {item.images?.[0] ? (
                      <Image 
                        src={db.storage.from('marketplace').getPublicUrl(item.images[0]).data.publicUrl} 
                        alt={item.title} 
                        fill
                        className="object-cover transition-transform hover:scale-110 duration-500"
                        loading="lazy"
                      />
                    ) : (
                      <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-sub)', background: 'var(--bg-main)' }}>
                        <Plus size={32} opacity={0.3} />
                      </div>
                    )}
                    
                    {/* Floating Badges */}
                    <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '6px' }}>
                      <div style={{ padding: '4px 10px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', borderRadius: '8px', color: 'white', fontWeight: 950, fontSize: '0.65rem', textTransform: 'uppercase' }}>
                        {item.category || 'Item'}
                      </div>
                    </div>

                    <div style={{ 
                      position: 'absolute', 
                      bottom: '12px', 
                      right: '12px', 
                      padding: '6px 14px', 
                      background: 'var(--brand)', 
                      borderRadius: '12px',
                      color: 'black',
                      fontWeight: 950,
                      fontSize: '1rem',
                      boxShadow: '0 8px 20px rgba(var(--brand-rgb), 0.4)'
                    }}>
                      {item.price === 0 ? 'FREE' : `£${item.price}`}
                    </div>
                  </div>
                  
                  <div style={{ padding: '1.5rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
                       <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 950, color: 'var(--text-main)', letterSpacing: '-0.02em', flex: 1 }}>{item.title}</h3>
                       <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--brand)', border: '1px solid rgba(var(--brand-rgb), 0.2)', padding: '2px 8px', borderRadius: '6px' }}>{item.condition || 'Used'}</div>
                    </div>

                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-sub)', marginBottom: '1.25rem' }}>
                      <MapPin size={14} />
                      <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{item.meetup_zone}</span>
                    </div>
                    
                    {/* Seller Information (JOIN DATA) */}
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
                      <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--brand)', overflow: 'hidden', border: '2px solid var(--bg-main)' }}>
                        {item.profiles?.avatar_url ? (
                          <Image src={item.profiles.avatar_url} width={32} height={32} alt="Seller" />
                        ) : (
                          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '0.6rem' }}>{item.profiles?.full_name?.charAt(0) || '?'}</div>
                        )}
                      </div>
                      <div style={{ flex: 1, overflow: 'hidden' }}>
                        <div style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--text-main)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{item.profiles?.full_name || 'Anonymous Specialist'}</div>
                        <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--brand)', textTransform: 'uppercase' }}>{item.profiles?.role || 'Contributor'}</div>
                      </div>
                      <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-sub)' }}>{item.quantity || 1}x</div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* ── ONBOARDING WALKTHROUGH ───────────────────────────────────── */}
      {showWalkthrough && (
        <div style={{ position: 'fixed', inset: 0, zIndex: 10000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(8px)' }} onClick={() => setShowWalkthrough(false)} />
          <div className="page-fade" style={{ 
            width: '100%', 
            maxWidth: '500px', 
            background: 'var(--surface)', 
            borderRadius: '32px', 
            overflow: 'hidden', 
            position: 'relative',
            boxShadow: '0 20px 80px rgba(0,0,0,0.5)',
            border: '1px solid var(--border)'
          }}>
            <div style={{ height: '8px', background: 'var(--brand)' }} />
            <div style={{ padding: '2.5rem' }}>
              <div style={{ width: '64px', height: '64px', borderRadius: '20px', background: 'rgba(var(--brand-rgb), 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--brand)', marginBottom: '1.5rem' }}>
                <Handshake size={32} />
              </div>
              <h2 style={{ fontSize: '1.75rem', fontWeight: 950, letterSpacing: '-0.04em', marginBottom: '1rem' }}>Welcome to the Exchange</h2>
              <p style={{ color: 'var(--text-sub)', lineHeight: 1.6, marginBottom: '2rem', fontSize: '1rem' }}>
                Espeezy&apos;s internal marketplace is designed for students to share hardware, textbooks, and resources securely. 
                Coordinate swaps at academic safe-zones and process payments via Stripe or Cash.
              </p>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flexShrink: 0 }}><CheckCircle2 className="text-success" size={20} /></div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.8 }}>Verify your resource before handoff.</div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                  <div style={{ flexShrink: 0 }}><CheckCircle2 className="text-success" size={20} /></div>
                  <div style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.8 }}>Always meet in academic safe-zones.</div>
                </div>
                <div style={{ display: 'flex', gap: '1rem' }}>
                   <div style={{ flexShrink: 0 }}><CheckCircle2 className="text-success" size={20} /></div>
                   <div style={{ fontSize: '0.85rem', fontWeight: 700, opacity: 0.8 }}>Report prohibited or fraudulent behavior.</div>
                </div>
              </div>
              
              <button 
                onClick={() => setShowWalkthrough(false)}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '2.5rem', padding: '1rem', borderRadius: '16px', fontWeight: 900, fontSize: '1rem' }}
              >
                Let&apos;s Begin
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── POSTING WIZARD ───────────────────────────────────────────── */}
      {isPosting && (
        <PostListingModal 
          onClose={() => setIsPosting(false)} 
          onSuccess={() => { setIsPosting(false); fetchListings(); }} 
        />
      )}

      <style jsx>{`
        .listing-card:hover {
          transform: translateY(-12px) scale(1.02);
          border-color: var(--brand) !important;
          box-shadow: 0 30px 60px rgba(0,0,0,0.5);
        }
        .listing-card:hover img {
          transform: scale(1.1);
        }
        @keyframes sweep {
          from { transform: translateX(-100%); }
          to { transform: translateX(100%); }
        }
      `}</style>
      
      {/* ── ITEM DETAIL MODAL ────────────────────────────────────────── */}
      {selectedListing && (
        <ItemDetailModal 
          listing={selectedListing} 
          onClose={() => setSelectedListing(null)} 
        />
      )}
    </div>
  )
}

function PostListingModal({ onClose, onSuccess }: { onClose: () => void, onSuccess: () => void }) {
  const [step, setStep] = useState(1)
  const [title, setTitle] = useState('')
  const [description, setDescription] = useState('')
  const [price, setPrice] = useState('0')
  const [category, setCategory] = useState('Electronics')
  const [quantity, setQuantity] = useState(1)
  const [condition, setCondition] = useState<'New' | 'Like New' | 'Used' | 'Refurbished'>('Used')
  const [meetupZone, setMeetupZone] = useState('Library')
  const [meetupDetails, setMeetupDetails] = useState('')
  const [duration, setDuration] = useState(7)
  const [paymentMethod, setPaymentMethod] = useState('BOTH')
  const [images, setImages] = useState<File[]>([])
  const [uploading, setUploading] = useState(false)
  const [agreed, setAgreed] = useState(false)

  const db = createBrowserSupabaseClient()
  const { addToast } = useNotifications()

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      const newFiles = Array.from(e.target.files)
      setImages(prev => [...prev, ...newFiles].slice(0, 5))
    }
  }

  const handlePost = async () => {
    if (!agreed) {
      addToast('Authorization Required', 'You must agree to the institutional policy before publishing a listing.', 'warning')
      return
    }
    setUploading(true)
    
    try {
      // 1. INDUSTRY GRADE VALIDATION
      listingSchema.parse({
        title,
        description,
        price: parseFloat(price),
        category,
        quantity,
        condition,
        images: ['placeholder'], // Storage handles actual paths
        location: meetupZone,
        meetup_zone: meetupZone,
        meetup_details: meetupDetails,
        duration_days: duration,
        payment_method: paymentMethod,
      })

      const { data: { user } } = await db.auth.getUser()
      if (!user) throw new Error('Auth required')

      const uploadedPaths: string[] = []
      for (const img of images) {
        const ext = img.name.split('.').pop()
        const path = `${user.id}/${Date.now()}-${Math.random().toString(36).substr(2, 9)}.${ext}`
        const { error: upErr } = await db.storage.from('marketplace').upload(path, img)
        if (!upErr) uploadedPaths.push(path)
      }

      const { error } = await db.from('marketplace_listings').insert({
        owner_id: user.id,
        title,
        description,
        price: parseFloat(price),
        is_free: parseFloat(price) === 0,
        category,
        quantity,
        condition,
        images: uploadedPaths,
        meetup_zone: meetupZone,
        meetup_details: meetupDetails,
        duration_days: duration,
        payment_method: paymentMethod,
        status: 'AVAILABLE'
      })

      if (error) throw error
      addToast('Listing Created', 'Your resource is now visible to the institutional graph.', 'success')
      onSuccess()
    } catch (err: unknown) {
      addToast('Upload Failed', (err instanceof Error ? err.message : 'Unknown error'), 'error')
    } finally {
      setUploading(false)
    }
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 11000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(10px)' }} onClick={onClose} />
      
      <div className="page-fade" style={{ 
        width: '100%', 
        maxWidth: '550px', 
        background: 'var(--surface)', 
        borderRadius: '28px', 
        overflow: 'hidden', 
        position: 'relative',
        boxShadow: 'var(--shadow-2xl)',
        border: '1px solid var(--border)'
      }}>
        <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.25rem', fontWeight: 950, margin: 0 }}>List New Resource</h2>
          <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--brand)', background: 'rgba(var(--brand-rgb), 0.1)', padding: '4px 10px', borderRadius: '10px' }}>
            STEP {step} / 3
          </div>
        </div>

        <div style={{ padding: '2rem', maxHeight: '70vh', overflowY: 'auto' }}>
          {step === 1 && (
            <div className="page-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-sub)', marginBottom: '0.6rem' }}>Resource Title</label>
                <input 
                  type="text" 
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Psychology Textbook, Graphing Calculator..."
                  style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-sub)', outline: 'none' }}
                />
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-sub)', marginBottom: '0.6rem' }}>Category</label>
                  <select 
                    value={category}
                    onChange={(e) => setCategory(e.target.value)}
                    style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-sub)', outline: 'none' }}
                  >
                    {['Electronics', 'Textbooks', 'Lab Equipment', 'Stationery', 'Hardware', 'Other'].map(cat => (
                      <option key={cat} value={cat}>{cat}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-sub)', marginBottom: '0.6rem' }}>Condition</label>
                  <select 
                    value={condition}
                    onChange={(e: React.ChangeEvent<HTMLSelectElement>) => setCondition(e.target.value as any)}
                    style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-sub)', outline: 'none' }}
                  >
                    <option value="New">New</option>
                    <option value="Like New">Like New</option>
                    <option value="Used">Used</option>
                    <option value="Refurbished">Refurbished</option>
                  </select>
                </div>
              </div>
              <div>
                 <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-sub)', marginBottom: '0.6rem' }}>Visual Evidence ({images.length}/5)</label>
                 <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '0.5rem' }}>
                    {images.map((img, i) => (
                      <div key={i} style={{ aspectRatio: '1/1', background: 'var(--bg-sub)', borderRadius: '10px', overflow: 'hidden', position: 'relative' }}>
                        <img src={URL.createObjectURL(img)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                      </div>
                    ))}
                    {images.length < 5 && (
                      <label style={{ aspectRatio: '1/1', background: 'var(--bg-sub)', border: '2px dashed var(--border)', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', transition: 'all 0.2s' }}>
                        <Camera size={24} className="text-sub" />
                        <input type="file" hidden multiple accept="image/*" onChange={handleImageChange} />
                      </label>
                    )}
                 </div>
              </div>
              <div>
                <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-sub)', marginBottom: '0.6rem' }}>Condition & Description</label>
                <textarea 
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  rows={4}
                  placeholder="Describe the condition, version, or any specific details..."
                  style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-sub)', outline: 'none', resize: 'none' }}
                />
              </div>
            </div>
          )}

          {step === 2 && (
            <div className="page-fade" style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
               <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-sub)', marginBottom: '0.6rem' }}>Price ($)</label>
                    <div style={{ position: 'relative' }}>
                       <DollarSign size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'var(--text-sub)' }} />
                       <input 
                         type="number" 
                         value={price}
                         onChange={(e) => setPrice(e.target.value)}
                         style={{ width: '100%', padding: '0.9rem 0.9rem 0.9rem 2.5rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-sub)', outline: 'none' }}
                       />
                    </div>
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-sub)', marginBottom: '0.6rem' }}>Quantity / Stock</label>
                    <input 
                      type="number" 
                      value={quantity}
                      onChange={(e) => setQuantity(parseInt(e.target.value))}
                      min={1}
                      style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-sub)', outline: 'none' }}
                    />
                  </div>
                  <div>
                    <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-sub)', marginBottom: '0.6rem' }}>Max Duration (Days)</label>
                    <input 
                      type="number" 
                      value={duration}
                      onChange={(e) => setDuration(parseInt(e.target.value))}
                      style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-sub)', outline: 'none' }}
                    />
                  </div>
               </div>

               <div>
                 <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-sub)', marginBottom: '0.6rem' }}>Academic Safe Zone</label>
                 <select 
                   value={meetupZone}
                   onChange={(e) => setMeetupZone(e.target.value)}
                   style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-sub)', outline: 'none', appearance: 'none' }}
                 >
                   <option>Library</option>
                   <option>Student Union</option>
                   <option>Science Hub</option>
                   <option>Cafeteria</option>
                   <option>Custom Location</option>
                 </select>
               </div>
               
               <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-sub)', marginBottom: '0.6rem' }}>Meetup Details</label>
                  <input 
                    type="text" 
                    value={meetupDetails}
                    onChange={(e) => setMeetupDetails(e.target.value)}
                    placeholder="e.g. Near the main entrance, 2nd floor study area..."
                    style={{ width: '100%', padding: '0.9rem', borderRadius: '12px', border: '1px solid var(--border)', background: 'var(--bg-sub)', outline: 'none' }}
                  />
               </div>

               <div>
                  <label style={{ display: 'block', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', color: 'var(--text-sub)', marginBottom: '0.6rem' }}>Accepted Payments</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem' }}>
                     {['CASH', 'STRIPE', 'BOTH'].map(m => (
                       <button 
                         key={m} 
                         onClick={() => setPaymentMethod(m)}
                         style={{ 
                           padding: '0.75rem', 
                           borderRadius: '10px', 
                           border: '1px solid var(--border)', 
                           background: paymentMethod === m ? 'var(--brand)' : 'var(--bg-sub)',
                           color: paymentMethod === m ? 'white' : 'var(--text-sub)',
                           fontSize: '0.7rem',
                           fontWeight: 800
                         }}
                       >
                         {m}
                       </button>
                     ))}
                  </div>
               </div>
            </div>
          )}

          {step === 3 && (
            <div className="page-fade" style={{ display: 'flex', flexDirection: 'column', gap: '2rem', textAlign: 'center' }}>
               <div style={{ padding: '2rem', background: 'rgba(239, 68, 68, 0.05)', borderRadius: '24px', border: '2px dashed rgba(239, 68, 68, 0.2)' }}>
                  <AlertTriangle className="text-error" size={40} style={{ margin: '0 auto', marginBottom: '1.5rem' }} />
                  <h3 style={{ fontWeight: 950, color: 'var(--error)' }}>LEGAL & POLICY ALERT</h3>
                  <p style={{ fontSize: '0.85rem', color: 'var(--text-sub)', lineHeight: 1.6, marginTop: '1rem' }}>
                    Trading prohibited substances, dangerous hardware, or copyrighted materials is an institutional violation. 
                    Your account and listing will be immediately logged for human review if reported. 
                    Illegal activities will be forwarded to student conduct boards.
                  </p>
               </div>
               
               <label style={{ display: 'flex', alignItems: 'center', gap: '1rem', cursor: 'pointer', justifyContent: 'center' }}>
                  <input 
                    type="checkbox" 
                    checked={agreed} 
                    onChange={(e) => setAgreed(e.target.checked)}
                    style={{ width: '20px', height: '20px', accentColor: 'var(--brand)' }}
                  />
                  <span style={{ fontSize: '0.9rem', fontWeight: 700 }}>I strictly adhere to these policies.</span>
               </label>
            </div>
          )}
        </div>

        <div style={{ padding: '1.5rem 2rem', borderTop: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <button 
            onClick={() => step > 1 ? setStep(s => s - 1) : onClose()}
            className="btn btn-secondary"
            style={{ padding: '0.75rem 1.5rem', borderRadius: '12px', fontWeight: 800, border: '1px solid var(--border)' }}
          >
            {step === 1 ? 'Cancel' : 'Back'}
          </button>
          
          <button 
            onClick={() => step < 3 ? setStep(s => s + 1) : handlePost()}
            className="btn btn-primary"
            disabled={uploading}
            style={{ padding: '0.75rem 2rem', borderRadius: '12px', fontWeight: 900, minWidth: '120px' }}
          >
            {uploading ? <Loader2 className="animate-spin" size={20} /> : step === 3 ? 'Finalize Post' : 'Continue'}
          </button>
        </div>
      </div>
    </div>
  )
}

function ItemDetailModal({ listing, onClose }: { listing: Listing, onClose: () => void }) {
  const db = createBrowserSupabaseClient()
  
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 12000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }} onClick={onClose} />
      
      <div className="page-fade" style={{ 
        width: '100%', 
        maxWidth: '900px', 
        background: 'var(--surface)', 
        borderRadius: '40px', 
        overflow: 'hidden', 
        position: 'relative',
        boxShadow: 'var(--shadow-2xl)',
        border: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1.2fr) 1fr', height: '100%' }}>
          
          {/* Left: Media Area */}
          <div style={{ background: 'var(--bg-sub)', position: 'relative' }}>
            {listing.images?.[0] ? (
              <Image 
                src={db.storage.from('marketplace').getPublicUrl(listing.images[0]).data.publicUrl} 
                alt={listing.title} 
                fill
                className="object-cover"
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-sub)' }}>
                <Plus size={48} opacity={0.3} />
              </div>
            )}
            <button 
              onClick={onClose}
              style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', border: 'none', color: 'white', padding: '0.75rem', borderRadius: '16px', cursor: 'pointer', fontWeight: 900 }}
            >
               BACK
            </button>
          </div>

          {/* Right: Info Area */}
          <div style={{ padding: '3rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                <span style={{ padding: '6px 14px', background: 'rgba(var(--brand-rgb), 0.1)', color: 'var(--brand)', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 950 }}>{listing.category}</span>
                <span style={{ padding: '6px 14px', background: 'var(--bg-sub)', color: 'var(--text-sub)', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 950 }}>{listing.condition}</span>
              </div>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 950, letterSpacing: '-0.04em', color: 'white', lineHeight: 1.1, marginBottom: '1rem' }}>{listing.title}</h2>
              <div style={{ fontSize: '2rem', fontWeight: 950, color: 'var(--brand)' }}>{listing.price === 0 ? 'FREE / SHARE' : `£${listing.price}`}</div>
            </div>

            <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 950, color: 'var(--text-sub)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '2px' }}>Description</div>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, fontSize: '0.95rem' }}>{listing.description}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
               <div style={{ padding: '1.25rem', background: 'var(--bg-sub)', borderRadius: '20px' }}>
                  <div style={{ color: 'var(--brand)', marginBottom: '0.5rem' }}><MapPin size={20} /></div>
                  <div style={{ fontWeight: 900, color: 'white', fontSize: '0.9rem' }}>{listing.meetup_zone}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-sub)', marginTop: '0.25rem' }}>{listing.meetup_details}</div>
               </div>
               <div style={{ padding: '1.25rem', background: 'var(--bg-sub)', borderRadius: '20px' }}>
                  <div style={{ color: 'var(--brand)', marginBottom: '0.5rem' }}><Clock size={20} /></div>
                  <div style={{ fontWeight: 900, color: 'white', fontSize: '0.9rem' }}>{listing.duration_days} Days Max</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-sub)', marginTop: '0.25rem' }}>Default Loan Agreement</div>
               </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 950, color: 'var(--text-sub)', textTransform: 'uppercase', marginBottom: '1.25rem' }}>Listed By</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '20px', background: 'var(--brand)', overflow: 'hidden' }}>
                  {listing.profiles?.avatar_url && <Image src={listing.profiles.avatar_url} width={56} height={56} alt="Seller" />}
                </div>
                <div>
                   <div style={{ fontWeight: 950, color: 'white', fontSize: '1.1rem' }}>{listing.profiles?.full_name}</div>
                   <div style={{ fontSize: '0.8rem', color: 'var(--brand)', fontWeight: 800 }}>Institutional Specialist / {listing.profiles?.role}</div>
                </div>
              </div>
              <button 
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '2rem', padding: '1.25rem', borderRadius: '20px', fontWeight: 950, fontSize: '1rem' }}
              >
                Request Access via Node
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
