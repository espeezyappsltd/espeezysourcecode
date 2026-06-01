'use client'

import { Suspense, useMemo } from 'react'
import { useSearchParams } from 'next/navigation'
import { Search } from 'lucide-react'
import { PageHeader } from '@/components/layout/PageHeader'
import { AskCategoryChips } from '@/components/ask/AskCategoryChips'
import { AskResourceRow } from '@/components/ask/AskResourceRow'
import { ASK_RESOURCES } from '@/lib/ask/resources'
import { filterAskResources, paginateAskResources } from '@/lib/ask/search'
import type { AskCategoryFilter } from '@/lib/ask/types'
import './ask.css'

function AskPageContent() {
  const searchParams = useSearchParams()
  const q = searchParams.get('q') ?? ''
  const category = (searchParams.get('category') ?? 'all') as AskCategoryFilter
  const page = Math.max(1, Number(searchParams.get('page') ?? '1') || 1)

  const filtered = useMemo(
    () => filterAskResources(ASK_RESOURCES, q, category),
    [q, category],
  )
  const { items, totalPages } = useMemo(
    () => paginateAskResources(filtered, page, 20),
    [filtered, page],
  )
  return (
    <div className="page-fade page-shell page-shell--narrow">
      <PageHeader
        title="Ask directory"
        description="Search guides, docs, and tools for Espeezy Kanban."
        icon={Search}
      />

      <form
        role="search"
        style={{ marginBottom: '1.25rem' }}
        onSubmit={(e) => {
          e.preventDefault()
          const form = e.currentTarget
          const input = form.elements.namedItem('q') as HTMLInputElement | null
          const next = new URLSearchParams()
          const value = input?.value.trim()
          if (value) next.set('q', value)
          if (category !== 'all') next.set('category', category)
          const qs = next.toString()
          window.location.href = qs ? `/ask?${qs}` : '/ask'
        }}
      >
        <input
          name="q"
          type="search"
          defaultValue={q}
          placeholder="Search topics, tools, or features…"
          className="input"
          style={{ width: '100%' }}
          aria-label="Search Ask directory"
        />
      </form>

      <AskCategoryChips active={category} searchQuery={q} />

      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem', marginTop: '1.25rem' }}>
        {items.length === 0 ? (
          <p style={{ color: 'var(--text-sub)', fontSize: '0.9rem' }}>No matches. Try another search or category.</p>
        ) : (
          items.map((resource) => <AskResourceRow key={resource.id} resource={resource} searchQuery={q || null} />)
        )}
      </div>

      {totalPages > 1 ? (
        <p style={{ marginTop: '1.5rem', fontSize: '0.85rem', color: 'var(--text-sub)' }}>
          Page {page} of {totalPages}
        </p>
      ) : null}
    </div>
  )
}

export default function AskPage() {
  return (
    <Suspense fallback={<div className="page-shell page-fade">Loading Ask directory…</div>}>
      <AskPageContent />
    </Suspense>
  )
}
