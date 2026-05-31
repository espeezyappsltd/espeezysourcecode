'use client'

import { Suspense, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useRouter, useSearchParams } from 'next/navigation'
import { HelpCircle, Search } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { SearchField } from '@/components/forms/SearchField'
import { CategoryNavDropdown } from '@/components/nav/CategoryNavDropdown'
import { OffsetPageNav } from '@/components/nav/OffsetPageNav'
import { AskCategoryChips } from '@/components/ask/AskCategoryChips'
import { AskResourceRow } from '@/components/ask/AskResourceRow'
import { ASK_RESOURCES } from '@/lib/ask/resources'
import { filterAskResources, paginateAskResources } from '@/lib/ask/search'
import {
  ASK_CATEGORY_LABELS,
  ASK_CATEGORY_ORDER,
  type AskCategoryFilter,
} from '@/lib/ask/types'
import {
  askCategoryUrl,
  askListUrl,
  askNavContext,
} from '@/lib/nav/category-url'
import { useDebouncedListSearch } from '@/lib/nav/use-debounced-list-search'
import { useMobilePageControls } from '@/components/mobile/MobilePageControlsContext'
import '@/components/nav/list-nav.css'
import './ask.css'

const VALID_CATEGORIES = new Set<string>(['all', ...ASK_CATEGORY_ORDER])

function parseCategory(raw: string | null): AskCategoryFilter {
  if (!raw || !VALID_CATEGORIES.has(raw)) return 'all'
  return raw as AskCategoryFilter
}

function parsePage(raw: string | null | undefined): number {
  const n = parseInt(raw ?? '1', 10)
  return Number.isFinite(n) && n > 0 ? n : 1
}

function AskPageInner() {
  const searchParams = useSearchParams()
  const router = useRouter()

  const [searchQuery, setSearchQuery] = useState(() => searchParams?.get('q') ?? '')
  const [category, setCategory] = useState<AskCategoryFilter>(() =>
    parseCategory(searchParams?.get('category') ?? null),
  )

  const { draft: searchDraft, setDraft: setSearchDraft, clear: clearSearch } = useDebouncedListSearch({
    searchParams,
    router,
    pathname: '/ask',
    committedQuery: searchQuery,
    setCommittedQuery: setSearchQuery,
  })

  useEffect(() => {
    setCategory(parseCategory(searchParams?.get('category') ?? null))
  }, [searchParams])

  const pageFromUrl = parsePage(searchParams?.get('page'))

  const filtered = useMemo(
    () => filterAskResources(ASK_RESOURCES, searchQuery, category),
    [searchQuery, category],
  )

  const paginated = useMemo(
    () => paginateAskResources(filtered, pageFromUrl),
    [filtered, pageFromUrl],
  )

  const navCtx = useMemo(() => askNavContext(category, searchQuery), [category, searchQuery])

  const replaceAskUrl = useCallback(
    (mutate: (params: URLSearchParams) => void) => {
      const params = new URLSearchParams(searchParams?.toString() ?? '')
      mutate(params)
      const qs = params.toString()
      router.replace(qs ? `/ask?${qs}` : '/ask', { scroll: false })
    },
    [router, searchParams],
  )

  const filterKey = `${category}|${searchQuery}`
  const prevFilterKey = useRef(filterKey)

  useEffect(() => {
    if (prevFilterKey.current === filterKey) return
    prevFilterKey.current = filterKey
    if (!searchParams?.get('page')) return
    replaceAskUrl((params) => {
      params.delete('page')
    })
  }, [filterKey, replaceAskUrl, searchParams])

  useEffect(() => {
    if (paginated.page === pageFromUrl) return
    replaceAskUrl((params) => {
      if (paginated.page <= 1) params.delete('page')
      else params.set('page', String(paginated.page))
    })
  }, [paginated.page, pageFromUrl, replaceAskUrl])

  const buildPageHref = useCallback(
    (p: number) =>
      askListUrl({
        category: navCtx.category,
        q: navCtx.q,
        page: p > 1 ? p : null,
      }),
    [navCtx],
  )

  const categoryNavItems = useMemo(
    () =>
      ASK_CATEGORY_ORDER.map((id) => ({
        id,
        label: ASK_CATEGORY_LABELS[id],
        href: askCategoryUrl(id, { q: navCtx.q }),
      })),
    [navCtx.q],
  )

  useMobilePageControls({
    search: {
      value: searchDraft,
      onChange: setSearchDraft,
      onClear: clearSearch,
      placeholder: 'Search resources, tutorials, links…',
    },
    filterPanels: [
      {
        id: 'category',
        label: category === 'all' ? 'Category' : ASK_CATEGORY_LABELS[category as keyof typeof ASK_CATEGORY_LABELS],
        content: (
          <CategoryNavDropdown
            items={categoryNavItems}
            activeId={category === 'all' ? 'all' : category}
            allHref={askListUrl({ q: navCtx.q })}
            allLabel="All categories"
            alwaysExpanded
          />
        ),
      },
    ],
  })

  return (
    <div className="ask-page page-shell page-fade list-page--compact">
      <PageHeader
        variant="compact"
        icon={HelpCircle}
        title="Ask"
        description="Find tutorials, docs, tools, and campus links — search once, jump fast."
      />

      <div className="ask-page__sticky">
        <div className="ask-page__toolbar page-list-toolbar">
          <SearchField
            id="ask-search"
            className="ask-page__search"
            label="Search help resources"
            placeholder="Search resources, tutorials, links…"
            value={searchDraft}
            onChange={setSearchDraft}
            onClear={clearSearch}
            leadingIcon={<Search size={18} />}
            inputClassName="form-input ask-page__search-input"
          />
          <CategoryNavDropdown
            items={categoryNavItems}
            activeId={category === 'all' ? 'all' : category}
            allHref={askListUrl({ q: navCtx.q })}
            allLabel="All categories"
          />
        </div>
        <AskCategoryChips active={category} searchQuery={searchQuery} />
      </div>

      <div className="page-list-main">
        {paginated.total === 0 ? (
          <div className="ask-empty" role="status">
            <p className="ask-empty__title">No matches</p>
            <p className="ask-empty__hint">
              Try a shorter keyword, pick another category, or clear the search.
            </p>
          </div>
        ) : (
          <>
            <ul className="ask-list">
              {paginated.items.map((resource) => (
                <li key={resource.id}>
                  <AskResourceRow resource={resource} searchQuery={navCtx.q} />
                </li>
              ))}
            </ul>
            <OffsetPageNav
              page={paginated.page}
              totalPages={paginated.totalPages}
              from={paginated.from}
              to={paginated.to}
              total={paginated.total}
              buildHref={buildPageHref}
              itemLabel="resources"
            />
          </>
        )}
      </div>
    </div>
  )
}

export default function AskPage() {
  return (
    <Suspense
      fallback={
        <div className="page-shell page-fade" style={{ padding: '2rem 1rem' }}>
          <p style={{ color: 'var(--text-sub)', fontWeight: 700 }}>Loading Ask…</p>
        </div>
      }
    >
      <AskPageInner />
    </Suspense>
  )
}
