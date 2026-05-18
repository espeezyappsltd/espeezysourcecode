'use client'

import { useState, useEffect, useCallback, Suspense } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Briefcase,
  Plus,
  Loader2,
  Search,
  Package,
  ShoppingBag,
  ListChecks,
  ArrowRight,
  User,
  Clock,
} from 'lucide-react'
import RemoteAvatar from '@/components/common/RemoteAvatar'
import { avatarUrlForProfile } from '@/lib/platform/contact-rules'
import { seedDemoContent } from '@/lib/dev/seed-demo'
import {
  formatHustleCategory,
  HUSTLE_CATEGORIES,
  type HustleCategory,
} from '@/lib/hustle/task-validation'

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
  poster_id: string
  title: string
  description?: string
  category: string
  payout_cents?: number
  price?: number
  status?: string
  created_at: string
  poster?: {
    id?: string
    full_name: string
    avatar_url?: string | null
    username?: string | null
  } | null
}

function HustlePage() {
  const [tab, setTab] = useState<TabType>('marketplace')
  const [search, setSearch] = useState('')
  const [category, setCategory] = useState<'all' | HustleCategory>('all')
  const [items, setItems] = useState<HustleItem[]>([])
  const [loading, setLoading] = useState(true)
  const [loadingMore, setLoadingMore] = useState(false)
  const [nextCursor, setNextCursor] = useState<string | null>(null)

  const fetchItems = useCallback(
    async (currentTab: TabType, query = '', cat: typeof category = 'all', cursor: string | null = null) => {
      if (cursor) setLoadingMore(true)
      else setLoading(true)

      try {
        let endpoint = ''
        const params = new URLSearchParams()
        if (query.trim()) params.set('q', query.trim())
        if (cat !== 'all') params.set('category', cat)
        if (cursor) params.set('cursor', cursor)

        switch (currentTab) {
          case 'marketplace':
            endpoint = `/api/hustle/tasks?status=open&${params}`
            break
          case 'mine':
            endpoint = `/api/hustle/tasks?mine=1&${params}`
            break
          case 'sales':
            endpoint = `/api/marketplace/listings?mine=1&${params}`
            break
          case 'inventory':
            endpoint = `/api/assets?${params}`
            break
        }

        const res = await fetch(endpoint, { credentials: 'include' })
        if (res.ok) {
          const data = await res.json()
          const newItems: HustleItem[] =
            data.tasks ??
            data.listings?.map((l: { id: string; title: string; category: string; price?: number; created_at: string; owner_id: string; profiles?: HustleItem['poster'] }) => ({
              id: l.id,
              poster_id: l.owner_id,
              title: l.title,
              category: l.category,
              price: l.price,
              created_at: l.created_at,
              poster: l.profiles ? { ...l.profiles, id: l.owner_id } : null,
            })) ??
            data.assets ??
            []
          setItems((prev) => (cursor ? [...prev, ...newItems] : newItems))
          setNextCursor(data.nextCursor || null)
        }
      } catch (err: unknown) {
        console.error('Hustle fetch error:', err instanceof Error ? err.message : 'unknown error')
      } finally {
        setLoading(false)
        setLoadingMore(false)
      }
    },
    [],
  )

  useEffect(() => {
    const timer = setTimeout(() => void fetchItems(tab, search, category), 300)
    return () => clearTimeout(timer)
  }, [tab, search, category, fetchItems])

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

  const showCategoryFilters = tab === 'marketplace' || tab === 'mine'

  return (
    <div className="hustle-shell page-shell">
      <header style={{ marginBottom: '2rem' }}>
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
        >
          <div style={{ padding: '0.75rem', background: 'var(--brand)', borderRadius: '12px', color: 'white' }}>
            <Briefcase size={28} />
          </div>
          <motion.div>
            <h1 className="title-display" style={{ color: 'var(--text-main)', margin: 0 }}>
              Hustle <span style={{ color: 'var(--brand)' }}>Board</span>
            </h1>
            <p className="body-copy" style={{ fontSize: '0.9rem', margin: '0.25rem 0 0' }}>
              Campus gigs with verified payouts · search by skill, category, or keyword
            </p>
          </motion.div>
        </motion.div>
      </header>

      <div className="hustle-toolbar">
        <div className="hustle-search-row">
          <div className="hustle-search-wrap">
            <Search
              size={18}
              style={{
                position: 'absolute',
                left: '1rem',
                top: '50%',
                transform: 'translateY(-50%)',
                opacity: 0.4,
              }}
            />
            <input
              id="hustle-search"
              type="search"
              placeholder="Smart search: title, description, category… (Ctrl+F)"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              aria-label="Search hustle tasks"
            />
          </div>
          <nav
            style={{
              display: 'flex',
              gap: '0.4rem',
              background: 'var(--bg-sub)',
              padding: '4px',
              borderRadius: '14px',
              border: '1px solid var(--border)',
            }}
          >
            <TabButton active={tab === 'marketplace'} onClick={() => setTab('marketplace')} icon={<ShoppingBag size={16} />} label="Browse" />
            <TabButton active={tab === 'mine'} onClick={() => setTab('mine')} icon={<ListChecks size={16} />} label="Mine" />
            <TabButton active={tab === 'sales'} onClick={() => setTab('sales')} icon={<Package size={16} />} label="Sales" />
            <TabButton active={tab === 'inventory'} onClick={() => setTab('inventory')} icon={<User size={16} />} label="Assets" />
          </nav>
        </div>

        {showCategoryFilters && (
          <div className="hustle-categories" role="tablist" aria-label="Filter by category">
            <button
              type="button"
              className={`hustle-cat-chip${category === 'all' ? ' active' : ''}`}
              onClick={() => setCategory('all')}
            >
              All
            </button>
            {HUSTLE_CATEGORIES.map((cat) => (
              <button
                key={cat}
                type="button"
                className={`hustle-cat-chip${category === cat ? ' active' : ''}`}
                onClick={() => setCategory(cat)}
              >
                {formatHustleCategory(cat)}
              </button>
            ))}
          </div>
        )}
      </div>

      <main aria-busy={loading} id="hustle-main">
        {loading && items.length === 0 ? (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {[0, 1, 2, 4].map((i) => (
              <div key={i} className="hustle-skeleton" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState tab={tab} onSeed={() => void fetchItems(tab, search, category)} />
        ) : (
          <div style={{ display: 'grid', gap: '0.85rem' }}>
            <AnimatePresence mode="popLayout">
              {items.map((item, i) => (
                <HustleCard key={item.id} item={item} index={i} />
              ))}
            </AnimatePresence>

            {nextCursor && (
              <button
                type="button"
                onClick={() => void fetchItems(tab, search, category, nextCursor)}
                disabled={loadingMore}
                className="btn btn-secondary"
                style={{
                  width: '100%',
                  padding: '1rem',
                  marginTop: '0.5rem',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                }}
              >
                {loadingMore ? <Loader2 size={18} className="animate-spin" /> : <Plus size={18} />}
                Load more
              </button>
            )}
          </div>
        )}
      </main>
    </div>
  )
}

function TabButton({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean
  onClick: () => void
  icon: React.ReactNode
  label: string
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      aria-current={active ? 'page' : undefined}
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: '0.5rem',
        padding: '0.5rem 1rem',
        borderRadius: '10px',
        border: 'none',
        background: active ? 'var(--brand)' : 'transparent',
        color: active ? 'white' : 'var(--text-sub)',
        fontWeight: 800,
        fontSize: '0.85rem',
        cursor: 'pointer',
      }}
    >
      {icon}
      <span className="hide-mobile">{label}</span>
    </button>
  )
}

function HustleCard({ item, index }: { item: HustleItem; index: number }) {
  const posterId = item.poster?.id ?? item.poster_id
  const posterName = item.poster?.full_name ?? 'Scholar'
  const timeLabel = formatTimeAgo(item.created_at)

  return (
    <motion.article
      className="hustle-card"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index * 0.04, 0.35) }}
      tabIndex={0}
    >
      <div className="hustle-card-body">
        {posterId && (
          <RemoteAvatar
            src={avatarUrlForProfile({
              id: posterId,
              full_name: item.poster?.full_name,
              username: item.poster?.username,
              avatar_url: item.poster?.avatar_url,
            })}
            alt={posterName}
            size={44}
            style={{ background: 'var(--bg-main)', border: '2px solid var(--surface)' }}
            fallback={
              <span style={{ fontWeight: 900, color: 'var(--brand)', fontSize: '0.9rem' }}>
                {posterName[0]?.toUpperCase() ?? '?'}
              </span>
            }
          />
        )}
        <div className="hustle-card-meta">
          <div className="hustle-card-tags">
            <span
              style={{
                fontSize: '0.65rem',
                fontWeight: 900,
                textTransform: 'uppercase',
                letterSpacing: '0.08em',
                color: 'var(--brand)',
                background: 'rgba(var(--brand-rgb), 0.1)',
                padding: '2px 8px',
                borderRadius: '6px',
              }}
            >
              {formatHustleCategory(item.category)}
            </span>
            {item.status && STATUS_META[item.status] && (
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 900,
                  color: STATUS_META[item.status].color,
                  background: `${STATUS_META[item.status].color}18`,
                  padding: '2px 8px',
                  borderRadius: '6px',
                }}
              >
                {STATUS_META[item.status].label}
              </span>
            )}
            <span style={{ fontSize: '0.7rem', color: 'var(--text-sub)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Clock size={12} />
              {timeLabel}
            </span>
          </div>
          <h3 className="hustle-card-title">{item.title}</h3>
          <p className="hustle-card-desc">{item.description || 'No description provided.'}</p>
        </div>
      </div>

      <div className="hustle-card-payout">
        <div className="hustle-card-amount">
          {item.payout_cents != null
            ? `$${(item.payout_cents / 100).toFixed(2)}`
            : item.price != null
              ? `${Math.floor(item.price)} cr`
              : '—'}
        </div>
        <div className="hustle-card-payout-label">
          {item.payout_cents != null ? 'Payout' : item.price != null ? 'Credits' : 'Private'}
        </div>
      </div>

      <ArrowRight size={18} style={{ opacity: 0.25, flexShrink: 0 }} aria-hidden />
    </motion.article>
  )
}

function formatTimeAgo(iso: string): string {
  const diff = Date.now() - new Date(iso).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 60) return `${mins}m ago`
  const hours = Math.floor(mins / 60)
  if (hours < 24) return `${hours}h ago`
  const days = Math.floor(hours / 24)
  if (days < 7) return `${days}d ago`
  return new Date(iso).toLocaleDateString()
}

function EmptyState({ tab, onSeed }: { tab: TabType; onSeed?: () => void }) {
  const [seeding, setSeeding] = useState(false)

  const handleSeed = async () => {
    setSeeding(true)
    await seedDemoContent()
    setSeeding(false)
    onSeed?.()
  }

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        textAlign: 'center',
        padding: '5rem 2rem',
        background: 'var(--bg-sub)',
        borderRadius: '24px',
        border: '1px dashed var(--border)',
      }}
    >
      <div style={{ opacity: 0.2, marginBottom: '1.5rem' }}>
        {tab === 'marketplace' ? <ShoppingBag size={64} /> : tab === 'inventory' ? <Package size={64} /> : <ListChecks size={64} />}
      </div>
      <h3 style={{ fontWeight: 900, fontSize: '1.25rem', marginBottom: '0.5rem' }}>
        {tab === 'marketplace' ? 'No open tasks yet' : 'No results found'}
      </h3>
      <p className="body-copy" style={{ marginBottom: tab === 'marketplace' ? '1rem' : 0 }}>
        {tab === 'marketplace'
          ? 'Post a gig or load sample tasks — only quality-checked listings appear here.'
          : 'Try another category or search term.'}
      </p>
      {tab === 'marketplace' && onSeed && (
        <button
          type="button"
          className="btn btn-secondary"
          disabled={seeding}
          onClick={() => void handleSeed()}
          style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}
        >
          {seeding ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
          Load sample tasks
        </button>
      )}
    </motion.div>
  )
}

export default function HustleDashboard() {
  return (
    <Suspense
      fallback={
        <div style={{ padding: '4rem', textAlign: 'center' }}>
          <Loader2 className="animate-spin" />
        </div>
      }
    >
      <HustlePage />
    </Suspense>
  )
}
