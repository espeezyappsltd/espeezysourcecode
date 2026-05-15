'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { useProfile } from '@/context/ProfileContext'
import { motion, AnimatePresence } from 'framer-motion'
import { 
  Briefcase, AlertTriangle, Banknote, ExternalLink, 
  CheckCircle, Plus, Loader2, X, ChevronRight, 
  Clock, Search, Package, ShoppingBag, ListChecks,
  Filter, ArrowRight, User
} from 'lucide-react'

// Constants & Types
const CATEGORIES = ['design', 'writing', 'coding', 'tutoring', 'research', 'admin', 'marketing', 'video', 'photography', 'other']

const STATUS_META: Record<string, { label: string; color: string }> = {
  open: { label: 'Open', color: '#10B981' },
  assigned: { label: 'Assigned', color: '#3B82F6' },
  in_progress: { label: 'In Progress', color: '#F59E0B' },
  submitted: { label: 'Review', color: '#8B5CF6' },
  approved: { label: 'Approved', color: '#10B981' },
  paid: { label: 'Paid', color: '#10B981' },
  disputed: { label: 'Disputed', color: '#EF4444' },
  cancelled: { label: 'Cancelled', color: '#6B7280' },
}

type TabType = 'marketplace' | 'mine' | 'sales' | 'inventory'

interface HustleItem {
  id: string
  title: string
  description?: string
  category: string
  payout_cents?: number
  price?: number
  status?: string
  created_at: string
  poster?: { full_name: string; avatar_url?: string }
}

// Main Page Component
function HustlePage() {
  const { profile } = useProfile()
  const searchParams = useSearchParams()
  const [tab, setTab] = useState<TabType>('marketplace')
  const [search, setSearch] = useState('')
  const [items, setItems] = useState<HustleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [nextCursor, setNextCursor] = useState<string | null>(null)
  const [isConnected, setIsConnected] = useState(false)

  // Fetch Logic
  const fetchItems = useCallback(async (currentTab: TabType, query = '', cursor = null) => {
    setLoading(true)
    try {
      let endpoint = ''
      switch (currentTab) {
        case 'marketplace': endpoint = `/api/hustle/tasks?status=open&q=${query}` ; break
        case 'mine': endpoint = `/api/hustle/tasks?mine=1&q=${query}` ; break
        case 'sales': endpoint = `/api/marketplace?mine=1&q=${query}` ; break
        case 'inventory': endpoint = `/api/assets?q=${query}` ; break
      }
      
      const res = await fetch(`${endpoint}${cursor ? `&cursor=${cursor}` : ''}`)
      if (res.ok) {
        const data = await res.json()
        const newItems = data.tasks || data.assets || []
        setItems(prev => cursor ? [...prev, ...newItems] : newItems)
        setNextCursor(data.nextCursor || null)
      }
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    const timer = setTimeout(() => fetchItems(tab, search), 300)
    return () => clearTimeout(timer)
  }, [tab, search, fetchItems])

  // Accessibility Focus Trap & Shortcut
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'f') {
        e.preventDefault()
        document.getElementById('hustle-search')?.focus()
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  return (
    <div className="page-shell" style={{ maxWidth: 'var(--content-narrow)', margin: '0 auto' }}>
      {/* Premium Header */}
      <header style={{ marginBottom: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', marginBottom: '0.5rem' }}>
          <div style={{ padding: '0.75rem', background: 'var(--brand)', borderRadius: '12px', color: 'white' }}>
            <Briefcase size={28} />
          </div>
          <div>
            <h1 className="title-display" style={{ color: 'var(--text-main)' }}>Hustle <span style={{ color: 'var(--brand)' }}>Dashboard</span></h1>
            <p className="body-copy" style={{ fontSize: '0.9rem' }}>Maximize your academic earnings and manage digital assets.</p>
          </div>
        </div>
      </header>

      {/* Unified Search & Nav */}
      <div style={{ 
        position: 'sticky', top: '1rem', zIndex: 10, 
        background: 'rgba(var(--brand-rgb), 0.05)', backdropFilter: 'blur(12px)',
        border: '1px solid var(--border)', borderRadius: '20px', padding: '0.75rem',
        display: 'flex', gap: '0.75rem', marginBottom: '2rem', flexWrap: 'wrap'
      }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '240px' }}>
          <Search size={18} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', opacity: 0.4 }} />
          <input 
            id="hustle-search"
            type="text" 
            placeholder="Search tasks, assets, or listings... (Ctrl+F)"
            value={search}
            onChange={e => setSearch(e.target.value)}
            style={{ 
              width: '100%', padding: '0.75rem 1rem 0.75rem 2.75rem', 
              background: 'var(--bg-sub)', border: '1px solid var(--border)', 
              borderRadius: '14px', fontSize: '0.9rem', outline: 'none' 
            }}
          />
        </div>
        
        <nav style={{ display: 'flex', gap: '0.4rem', background: 'var(--bg-sub)', padding: '4px', borderRadius: '14px', border: '1px solid var(--border)' }}>
          <TabButton active={tab === 'marketplace'} onClick={() => setTab('marketplace')} icon={<ShoppingBag size={16} />} label="Browse" />
          <TabButton active={tab === 'mine'} onClick={() => setTab('mine')} icon={<ListChecks size={16} />} label="Tasks" />
          <TabButton active={tab === 'sales'} onClick={() => setTab('sales')} icon={<Package size={16} />} label="Sales" />
          <TabButton active={tab === 'inventory'} onClick={() => setTab('inventory')} icon={<User size={16} />} label="Assets" />
        </nav>
      </div>

      {/* Main Content Area */}
      <main aria-busy={loading} id="hustle-main">
        {items.length === 0 && !loading ? (
          <EmptyState tab={tab} />
        ) : (
          <div style={{ display: 'grid', gap: '1rem' }}>
            <AnimatePresence mode="popLayout">
              {items.map((item, i) => (
                <HustleCard key={item.id} item={item} index={i} tab={tab} />
              ))}
            </AnimatePresence>
            
            {nextCursor && (
              <button 
                onClick={() => fetchItems(tab, search, nextCursor)}
                disabled={loading}
                style={{ 
                  width: '100%', padding: '1rem', background: 'var(--bg-sub)', 
                  border: '1px solid var(--border)', borderRadius: '14px', 
                  color: 'var(--brand)', fontWeight: 800, cursor: 'pointer',
                  marginTop: '1rem', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '0.5rem'
                }}
              >
                {loading ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                Load More Opportunities
              </button>
            )}
          </div>
        )}
        
        {loading && items.length === 0 && (
          <div style={{ textAlign: 'center', padding: '4rem' }}>
            <Loader2 size={32} className="animate-spin" style={{ color: 'var(--brand)', margin: '0 auto' }} />
            <p style={{ marginTop: '1rem', color: 'var(--text-sub)', fontWeight: 600 }}>Syncing with marketplace...</p>
          </div>
        )}
      </main>

      <style jsx>{`
        .animate-spin { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
      `}</style>
    </div>
  )
}

// Components
function TabButton({ active, onClick, icon, label }: { active: boolean; onClick: () => void; icon: React.ReactNode; label: string }) {
  return (
    <button 
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      style={{
        display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.5rem 1rem',
        borderRadius: '10px', border: 'none', background: active ? 'var(--brand)' : 'transparent',
        color: active ? 'white' : 'var(--text-sub)', fontWeight: 800, fontSize: '0.85rem',
        cursor: 'pointer', transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)'
      }}
    >
      {icon}
      <span className="hide-mobile">{label}</span>
    </button>
  )
}

function HustleCard({ item, index, tab }: { item: HustleItem; index: number; tab: TabType }) {
  const isTask = tab === 'marketplace' || tab === 'mine'
  const isAsset = tab === 'inventory' || tab === 'sales'

  return (
    <motion.div
      initial={{ opacity: 0, y: 15 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.05 }}
      tabIndex={0}
      role="article"
      style={{
        background: 'var(--bg-sub)', border: '1px solid var(--border)',
        borderRadius: '18px', padding: '1.25rem', display: 'flex',
        justifyContent: 'space-between', alignItems: 'center', gap: '1.5rem',
        cursor: 'pointer', transition: 'border-color 0.2s'
      }}
      onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--brand)'}
      onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--border)'}
    >
      <div style={{ flex: 1 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.5rem' }}>
          <span style={{ fontSize: '0.65rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--brand)', background: 'rgba(var(--brand-rgb), 0.1)', padding: '2px 8px', borderRadius: '6px' }}>
            {item.category}
          </span>
          {item.status && (
            <span style={{ fontSize: '0.65rem', fontWeight: 900, color: STATUS_META[item.status]?.color || 'var(--text-sub)', background: (STATUS_META[item.status]?.color || 'var(--text-sub)') + '15', padding: '2px 8px', borderRadius: '6px' }}>
              {STATUS_META[item.status]?.label || item.status}
            </span>
          )}
        </div>
        <h3 style={{ margin: 0, fontSize: '1.05rem', fontWeight: 800, color: 'var(--text-main)' }}>{item.title}</h3>
        <p style={{ margin: '0.25rem 0 0', fontSize: '0.85rem', color: 'var(--text-sub)', overflow: 'hidden', display: '-webkit-box', WebkitLineClamp: 1, WebkitBoxOrient: 'vertical' }}>
          {item.description || 'No description provided.'}
        </p>
      </div>

      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontSize: '1.25rem', fontWeight: 950, color: 'var(--brand-3)', letterSpacing: '-0.04em' }}>
          {item.payout_cents ? `$${(item.payout_cents / 100).toFixed(2)}` : item.price ? `$${item.price.toFixed(2)}` : 'Private'}
        </div>
        <div style={{ fontSize: '0.65rem', color: 'var(--text-sub)', fontWeight: 700, textTransform: 'uppercase' }}>
          {item.payout_cents ? 'Payout' : item.price ? 'List Price' : 'Asset'}
        </div>
      </div>
      
      <ArrowRight size={18} style={{ opacity: 0.2 }} />
    </motion.div>
  )
}

function EmptyState({ tab }: { tab: TabType }) {
  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '6rem 2rem', background: 'var(--bg-sub)', borderRadius: '24px', border: '1px dashed var(--border)' }}>
      <div style={{ opacity: 0.2, marginBottom: '1.5rem' }}>
        {tab === 'marketplace' ? <ShoppingBag size={64} /> : tab === 'inventory' ? <Package size={64} /> : <ListChecks size={64} />}
      </div>
      <h3 style={{ fontWeight: 900, fontSize: '1.25rem', marginBottom: '0.5rem' }}>No results found</h3>
      <p className="body-copy">Try adjusting your filters or search term to find what you&apos;re looking for.</p>
    </motion.div>
  )
}

// Wrapper with Suspense
export default function HustleDashboard() {
  return (
    <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center' }}><Loader2 className="animate-spin" /></div>}>
      <HustlePage />
    </Suspense>
  )
}
