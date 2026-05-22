'use client'

import { useState, useEffect, Suspense, memo, useMemo, useCallback } from 'react'
import { useSearchParams, useRouter } from 'next/navigation'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { PageHeader } from '@/components/layout/PageHeader'
import { useHustle, type HustleItem, type HustleTab } from '@/hooks/useHustle'
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
  Coins,
  RotateCcw,
  Zap,
  AlertCircle,
} from 'lucide-react'
import { formatCredits, formatGbpApprox } from '@/lib/credits'
import { resolveTaskPayoutCredits } from '@/lib/hustle/credits'
import { PostHustleModal } from '@/components/hustle/PostHustleModal'
import { HustleTaskModal } from '@/components/hustle/HustleTaskModal'
import RemoteAvatar from '@/components/common/RemoteAvatar'
import { avatarUrlForProfile } from '@/lib/platform/contact-rules'
import { seedDemoContent } from '@/lib/dev/seed-demo'
import {
  formatHustleCategory,
  HUSTLE_CATEGORIES,
  type HustleCategory,
} from '@/lib/hustle/task-validation'
import { APPLICATION_STATUS_LABELS } from '@/lib/hustle/lifecycle'
import {
  getPosterGigNextAction,
  getWorkerGigNextAction,
  hustleSearchPlaceholder,
} from '@/lib/hustle/gig-ux'
import { CategoryNavDropdown } from '@/components/nav/CategoryNavDropdown'
import { ListPagination } from '@/components/nav/ListPagination'
import { VirtualizedColumnList } from '@/components/list/VirtualizedColumnList'
import { SearchField } from '@/components/forms/SearchField'
import {
  hustleCategoryUrl,
  hustleItemUrl,
  hustleListUrl,
  hustleNavContext,
  hustleTabUrl,
} from '@/lib/nav/category-url'
import { useDebouncedListSearch } from '@/lib/nav/use-debounced-list-search'
import '@/components/nav/list-nav.css'
import { useMobilePageControls } from '@/components/mobile/MobilePageControlsContext'

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

const HUSTLE_TABS = ['marketplace', 'gigs', 'posted', 'sales', 'inventory'] as const

function HustlePage() {
  const searchParams = useSearchParams()
  const router = useRouter()
  const {
    tab,
    setTab,
    search,
    setSearch,
    category,
    setCategory,
    items,
    displayItems,
    loading,
    loadingMore,
    nextCursor,
    loadMore,
    refresh,
    refreshHard,
    invalidateGigsCache,
    gigsFilter,
    setGigsFilter,
    fetchError,
  } = useHustle()

  const [postOpen, setPostOpen] = useState(false)
  const [selectedTaskId, setSelectedTaskId] = useState<string | null>(null)

  const replaceHustleUrl = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams?.toString() ?? '')
      mutate(params)
      const q = params.toString()
      router.replace(q ? `/hustle?${q}` : '/hustle', { scroll: false })
    },
    [router, searchParams],
  )

  const { draft: searchDraft, setDraft: setSearchDraft, clear: clearSearch } = useDebouncedListSearch({
      searchParams,
      router,
      pathname: '/hustle',
      committedQuery: search,
      setCommittedQuery: setSearch,
    })

  const navCtx = useMemo(() => hustleNavContext(tab, category, search), [tab, category, search])

  useEffect(() => {
    if (!searchParams) return
    const urlTab = searchParams.get('tab')
    if (urlTab && (HUSTLE_TABS as readonly string[]).includes(urlTab)) {
      setTab(urlTab as (typeof HUSTLE_TABS)[number])
    }
    const urlCat = searchParams.get('category')
    if (urlCat && (HUSTLE_CATEGORIES as readonly string[]).includes(urlCat as HustleCategory)) {
      setCategory(urlCat as HustleCategory)
    } else if (!urlCat) {
      setCategory('all')
    }
    const urlTask = searchParams.get('task')
    setSelectedTaskId(urlTask)
  }, [searchParams, setTab, setCategory])

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

  useEffect(() => {
    document.getElementById('hustle-main')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' })
  }, [tab])

  const showCategoryFilters = tab === 'marketplace' || tab === 'gigs' || tab === 'posted'
  const showStatusFilters = tab === 'gigs' || tab === 'posted'
  const isHustleTaskTab = tab === 'marketplace' || tab === 'gigs' || tab === 'posted'
  const listItems = showStatusFilters ? displayItems : items
  const isFilteredEmpty = listItems.length === 0 && items.length > 0
  const resultLabel =
    listItems.length === 1 ? '1 gig' : `${listItems.length} gigs`

  const categoryNavItems = useMemo(
    () =>
      HUSTLE_CATEGORIES.map((cat) => ({
        id: cat,
        label: formatHustleCategory(cat),
        href: hustleCategoryUrl(cat, tab, { q: navCtx.q }),
      })),
    [tab, navCtx.q],
  )

  const closeTask = () => {
    setSelectedTaskId(null)
    replaceHustleUrl((params) => {
      params.delete('task')
    })
  }

  const mobileFilterContent = useMemo(
    () => (
      <>
        <nav className="hustle-tab-nav" aria-label="Hustle sections">
          <HustleTabLink active={tab === 'marketplace'} href={hustleTabUrl('marketplace', navCtx)} icon={<ShoppingBag size={16} />} label="Browse" />
          <HustleTabLink active={tab === 'gigs'} href={hustleTabUrl('gigs', navCtx)} icon={<ListChecks size={16} />} label="My gigs" />
          <HustleTabLink active={tab === 'posted'} href={hustleTabUrl('posted', navCtx)} icon={<Briefcase size={16} />} label="Posted" />
          <HustleTabLink active={tab === 'sales'} href={hustleTabUrl('sales', navCtx)} icon={<Package size={16} />} label="Sales" />
          <HustleTabLink active={tab === 'inventory'} href={hustleTabUrl('inventory', navCtx)} icon={<User size={16} />} label="Assets" />
        </nav>
        {showCategoryFilters && (
          <CategoryNavDropdown
            items={categoryNavItems}
            activeId={category}
            allHref={hustleListUrl({ tab, q: navCtx.q, category: navCtx.category })}
            allLabel="All categories"
            alwaysExpanded
          />
        )}
        {showStatusFilters && (
          <div className="hustle-status-filters" role="tablist" aria-label="Filter by status">
            <StatusFilterChip active={gigsFilter === 'all'} label="All" onClick={() => setGigsFilter('all')} />
            <StatusFilterChip active={gigsFilter === 'action'} label="Needs action" variant="action" onClick={() => setGigsFilter('action')} />
            <StatusFilterChip active={gigsFilter === 'pending'} label="Waiting" onClick={() => setGigsFilter('pending')} />
            <StatusFilterChip active={gigsFilter === 'done'} label="Done" onClick={() => setGigsFilter('done')} />
          </div>
        )}
      </>
    ),
    [
      tab,
      navCtx,
      showCategoryFilters,
      categoryNavItems,
      category,
      showStatusFilters,
      gigsFilter,
      setGigsFilter,
    ],
  )

  useMobilePageControls({
    search: {
      value: searchDraft,
      onChange: setSearchDraft,
      onClear: clearSearch,
      placeholder: hustleSearchPlaceholder(tab),
    },
    filterPanels: [{ id: 'hustle-filters', label: 'Sections & filters', content: mobileFilterContent }],
    actions: [
      {
        id: 'refresh',
        label: 'Refresh',
        icon: <RotateCcw size={17} />,
        onClick: () => void refreshHard(),
      },
      {
        id: 'post',
        label: 'Post gig',
        icon: <Plus size={17} />,
        onClick: () => setPostOpen(true),
        variant: 'primary',
      },
    ],
  })

  return (
    <div className="hustle-shell page-shell list-page--compact">
      <PageHeader
        title="Hustle"
        titleAccent="Board"
        icon={Briefcase}
        description={
          <>
            Campus gigs paid in Espeezy credits · escrow-backed trades.{' '}
            <Link href="/assets/impact" style={{ fontWeight: 800, color: 'var(--brand)' }}>
              Verifiable impact log →
            </Link>
          </>
        }
        actions={
          <button type="button" className="btn btn-primary hustle-post-btn hide-mobile-inline" onClick={() => setPostOpen(true)}>
            <Plus size={18} aria-hidden />
            Post gig
          </button>
        }
      />

      <div className="hustle-toolbar ui-panel">
        <div className="hustle-search-row">
          <SearchField
            id="hustle-search"
            className="hustle-search-wrap"
            label={hustleSearchPlaceholder(tab)}
            placeholder={hustleSearchPlaceholder(tab)}
            value={searchDraft}
            onChange={setSearchDraft}
            onClear={clearSearch}
            leadingIcon={<Search size={18} style={{ opacity: 0.4 }} />}
            inputClassName="form-input hustle-search-input"
          />
          <button
            type="button"
            className="hustle-tab-btn"
            style={{ flexShrink: 0 }}
            aria-label="Refresh list"
            title="Refresh"
            onClick={() => refreshHard()}
            disabled={loading}
          >
            <RotateCcw size={16} className={loading ? 'animate-spin' : undefined} />
          </button>
          <nav className="hustle-tab-nav" aria-label="Hustle sections">
            <HustleTabLink active={tab === 'marketplace'} href={hustleTabUrl('marketplace', navCtx)} icon={<ShoppingBag size={16} />} label="Browse" />
            <HustleTabLink active={tab === 'gigs'} href={hustleTabUrl('gigs', navCtx)} icon={<ListChecks size={16} />} label="My gigs" />
            <HustleTabLink active={tab === 'posted'} href={hustleTabUrl('posted', navCtx)} icon={<Briefcase size={16} />} label="Posted" />
            <HustleTabLink active={tab === 'sales'} href={hustleTabUrl('sales', navCtx)} icon={<Package size={16} />} label="Sales" />
            <HustleTabLink active={tab === 'inventory'} href={hustleTabUrl('inventory', navCtx)} icon={<User size={16} />} label="Assets" />
          </nav>
        </div>

        {showStatusFilters && (
          <div className="hustle-status-filters" role="tablist" aria-label="Filter by status">
            <StatusFilterChip active={gigsFilter === 'all'} label="All" onClick={() => setGigsFilter('all')} />
            <StatusFilterChip
              active={gigsFilter === 'action'}
              label="Needs action"
              variant="action"
              onClick={() => setGigsFilter('action')}
            />
            <StatusFilterChip active={gigsFilter === 'pending'} label="Waiting" onClick={() => setGigsFilter('pending')} />
            <StatusFilterChip active={gigsFilter === 'done'} label="Done" onClick={() => setGigsFilter('done')} />
          </div>
        )}

        {showCategoryFilters && (
          <CategoryNavDropdown
            items={categoryNavItems}
            activeId={category}
            allHref={hustleListUrl({ tab, q: navCtx.q, category: navCtx.category })}
            allLabel="All categories"
          />
        )}

        {!loading && items.length > 0 && isHustleTaskTab && (
          <div className="hustle-toolbar-meta">
            <span aria-live="polite">{resultLabel}</span>
            {(search || category !== 'all' || gigsFilter !== 'all') && (
              <button
                type="button"
                onClick={() => {
                  setGigsFilter('all')
                  router.push(hustleListUrl({ tab }))
                }}
              >
                Clear filters
              </button>
            )}
          </div>
        )}
      </div>

      <main aria-busy={loading} id="hustle-main">
        {fetchError && (
          <div className="hustle-error-banner" role="alert">
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
              <AlertCircle size={18} />
              {fetchError}
            </span>
            <button type="button" className="btn btn-secondary btn-sm" onClick={() => refreshHard()}>
              Retry
            </button>
          </div>
        )}

        {loading && items.length === 0 ? (
          <div style={{ display: 'grid', gap: '0.75rem' }}>
            {[0, 1, 2, 4].map((i) => (
              <div key={i} className="hustle-skeleton" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <EmptyState
            tab={tab}
            onSeed={() => refresh()}
            onBrowse={() => setTab('marketplace')}
            onPost={() => setPostOpen(true)}
          />
        ) : isFilteredEmpty ? (
          <FilteredEmptyState onClear={() => setGigsFilter('all')} />
        ) : (
          <VirtualizedColumnList
            className="hustle-list"
            items={listItems}
            getKey={(item) => item.id}
            estimateSize={136}
            gapPx={9}
            renderItem={(item) => (
              <HustleCard
                item={item}
                tab={tab}
                category={category}
                searchQuery={search}
                isHustleTask={isHustleTaskTab}
                showApplicationMeta={tab === 'gigs'}
                gigPerspective={tab === 'posted' ? 'poster' : tab === 'gigs' ? 'worker' : undefined}
              />
            )}
            footer={
              <ListPagination
                loadedCount={listItems.length}
                hasMore={Boolean(nextCursor)}
                loadingMore={loadingMore}
                onLoadMore={loadMore}
                itemLabel="gigs"
              />
            }
          />
        )}
      </main>

      {postOpen && (
        <PostHustleModal onClose={() => setPostOpen(false)} onCreated={() => void refresh()} />
      )}
      {selectedTaskId && (
        <HustleTaskModal
          taskId={selectedTaskId}
          onClose={closeTask}
          onUpdated={() => void refresh()}
          onViewMyGigs={() => router.push(hustleTabUrl('gigs'))}
          onGigsListChanged={invalidateGigsCache}
        />
      )}
    </div>
  )
}

function HustleTabLink({
  active,
  href,
  icon,
  label,
}: {
  active: boolean
  href: string
  icon: React.ReactNode
  label: string
}) {
  return (
    <Link href={href} className="hustle-tab-link" prefetch aria-current={active ? 'page' : undefined}>
      {icon}
      <span>{label}</span>
    </Link>
  )
}

function StatusFilterChip({
  active,
  label,
  onClick,
  variant,
}: {
  active: boolean
  label: string
  onClick: () => void
  variant?: 'action'
}) {
  return (
    <button
      type="button"
      className={`hustle-status-chip${active ? ' active' : ''}${variant === 'action' ? ' hustle-status-chip--action' : ''}`}
      onClick={onClick}
      aria-pressed={active}
    >
      {variant === 'action' ? <Zap size={12} aria-hidden /> : null}
      {label}
    </button>
  )
}

function FilteredEmptyState({ onClear }: { onClear: () => void }) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      style={{
        textAlign: 'center',
        padding: '3rem 2rem',
        background: 'var(--bg-sub)',
        borderRadius: '20px',
        border: '1px dashed var(--border)',
      }}
    >
      <h3 style={{ fontWeight: 900, marginBottom: '0.5rem' }}>No gigs match these filters</h3>
      <p className="body-copy" style={{ marginBottom: '1rem' }}>
        Try a different status filter or clear your search.
      </p>
      <button type="button" className="btn btn-secondary" onClick={onClear}>
        Show all gigs
      </button>
    </motion.div>
  )
}

const HustleCard = memo(function HustleCard({
  item,
  tab,
  category,
  searchQuery,
  isHustleTask,
  showApplicationMeta,
  gigPerspective,
}: {
  item: HustleItem
  tab: HustleTab
  category: 'all' | HustleCategory
  searchQuery?: string
  isHustleTask: boolean
  showApplicationMeta?: boolean
  gigPerspective?: 'worker' | 'poster'
}) {
  const posterId = item.poster?.id ?? item.poster_id
  const posterName = item.poster?.full_name ?? 'Scholar'
  const timeLabel = formatTimeAgo(item.created_at)

  const creditValue = isHustleTask
    ? resolveTaskPayoutCredits({ payout_credits: item.payout_credits, payout_cents: item.payout_cents })
    : 0
  const escrowOk = (item.escrow_credits ?? 0) >= creditValue && creditValue > 0

  const nextAction =
    gigPerspective === 'worker'
      ? getWorkerGigNextAction(item)
      : gigPerspective === 'poster'
        ? getPosterGigNextAction(item)
        : null
  const needsAction = nextAction?.tone === 'action'
  const linkCtx = {
    category: category === 'all' ? null : category,
    q: searchQuery?.trim() || null,
  }
  const taskHref = hustleItemUrl(item.id, { tab, ...linkCtx })
  const catHref = hustleCategoryUrl(item.category, tab, { q: linkCtx.q })

  return (
    <article
      className={`hustle-card ui-panel ui-panel--inset${isHustleTask ? ' hustle-card--linked' : ' hustle-card--listing'}${needsAction ? ' hustle-card--needs-action' : ''}`}
    >
      {isHustleTask ? (
        <Link href={taskHref} className="hustle-card__overlay-link" prefetch aria-label={item.title} />
      ) : null}
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
            <Link href={catHref} className="hustle-card__cat-link" prefetch>
              {formatHustleCategory(item.category)}
            </Link>
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
            {showApplicationMeta && item.application_status && (
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 900,
                  color: 'var(--brand)',
                  background: 'rgba(var(--brand-rgb), 0.12)',
                  padding: '2px 8px',
                  borderRadius: '6px',
                }}
              >
                {APPLICATION_STATUS_LABELS[item.application_status] ?? item.application_status}
              </span>
            )}
            {showApplicationMeta && item.my_role === 'assignee' && (
              <span
                style={{
                  fontSize: '0.65rem',
                  fontWeight: 900,
                  color: '#3B82F6',
                  background: '#3B82F618',
                  padding: '2px 8px',
                  borderRadius: '6px',
                }}
              >
                Hired
              </span>
            )}
            <span style={{ fontSize: '0.7rem', color: 'var(--text-sub)', display: 'inline-flex', alignItems: 'center', gap: 4 }}>
              <Clock size={12} />
              {timeLabel}
            </span>
          </div>
          <h3 className="hustle-card-title">{item.title}</h3>
          <p className="hustle-card-desc">{item.description || 'No description provided.'}</p>
          {showApplicationMeta && item.application_message ? (
            <p
              style={{
                margin: '0.35rem 0 0',
                fontSize: '0.75rem',
                color: 'var(--text-sub)',
                fontStyle: 'italic',
              }}
            >
              Your note: {item.application_message}
            </p>
          ) : null}
          {nextAction ? (
            <p className={`hustle-card-next-action hustle-card-next-action--${nextAction.tone}`}>
              {nextAction.tone === 'action' ? <Zap size={13} aria-hidden /> : null}
              {nextAction.label}
            </p>
          ) : null}
        </div>
      </div>

      <div className="hustle-card-payout">
        {isHustleTask && creditValue > 0 ? (
          <>
            <div className="hustle-card-amount hustle-card-amount--credits">
              <Coins size={16} aria-hidden />
              {formatCredits(creditValue)}
            </div>
            <div className="hustle-card-payout-label">{formatGbpApprox(creditValue)}</div>
            {escrowOk ? (
              <span className="hustle-card-escrow-badge">Escrow</span>
            ) : (
              <span className="hustle-card-escrow-badge hustle-card-escrow-badge--pending">Unfunded</span>
            )}
          </>
        ) : item.price != null ? (
          <>
            <div className="hustle-card-amount">{Math.floor(item.price)} cr</div>
            <div className="hustle-card-payout-label">Marketplace</div>
          </>
        ) : (
          <>
            <div className="hustle-card-amount">—</div>
            <div className="hustle-card-payout-label">—</div>
          </>
        )}
      </div>

      <ArrowRight size={18} style={{ opacity: 0.25, flexShrink: 0 }} aria-hidden />
    </article>
  )
})

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

function EmptyState({
  tab,
  onSeed,
  onBrowse,
  onPost,
}: {
  tab: HustleTab
  onSeed?: () => void
  onBrowse?: () => void
  onPost?: () => void
}) {
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
        {tab === 'marketplace'
          ? 'No open tasks yet'
          : tab === 'gigs'
            ? 'No gigs yet'
            : tab === 'posted'
              ? 'Nothing posted yet'
              : 'No results found'}
      </h3>
      <p
        className="body-copy"
        style={{
          marginBottom: tab === 'marketplace' || tab === 'gigs' || tab === 'posted' ? '1rem' : 0,
        }}
      >
        {tab === 'marketplace'
          ? 'Post a gig or load sample tasks — only quality-checked listings appear here.'
          : tab === 'gigs'
            ? 'Apply to gigs on Browse — they appear here with status, escrow, and next steps.'
            : tab === 'posted'
              ? 'Post a gig to hire scholars and manage escrow from here.'
              : 'Try another category or search term.'}
      </p>
      <div style={{ display: 'flex', gap: '0.5rem', justifyContent: 'center', flexWrap: 'wrap' }}>
        {tab === 'gigs' && onBrowse && (
          <button type="button" className="btn btn-primary" onClick={onBrowse}>
            <ShoppingBag size={16} aria-hidden />
            Browse gigs
          </button>
        )}
        {tab === 'posted' && onPost && (
          <button type="button" className="btn btn-primary" onClick={onPost}>
            <Plus size={16} aria-hidden />
            Post a gig
          </button>
        )}
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
      </div>
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
