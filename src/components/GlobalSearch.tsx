'use client'

import React, { useState, useEffect, useRef } from 'react'
import { Search, User, CheckSquare, Users, X, ArrowRight, Loader2 } from 'lucide-react'
import { db, createBrowserSupabaseClient } from '@/lib/db-client'
import { useRouter } from 'next/navigation'
import { useSmartLoading } from '@/components/GlobalLoadingProvider'
import { getFlagComponent } from '@/utils/geo'

interface SearchResult {
  id: string
  type: 'profile' | 'task' | 'group'
  title: string
  subtitle: string
  image_url?: string
  country_code?: string
}

interface ProfileSearchRow {
  id: string
  full_name: string | null
  avatar_url: string | null
  course_name: string | null
  country_code: string | null
}

interface TaskSearchRow {
  id: string
  title: string
  status: string
}

interface GroupSearchRow {
  id: string
  name: string
  module_code: string
}

interface GlobalSearchProps {
  collapsed?: boolean
}

export default function GlobalSearch({ collapsed }: GlobalSearchProps) {
  const [isOpen, setIsOpen] = useState(false)
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<SearchResult[]>([])
  const [loading, setLoading] = useState(false)
  const searchRef = useRef<HTMLDivElement>(null)
  const inputRef = useRef<HTMLInputElement>(null)
  const db = createBrowserSupabaseClient()
  const router = useRouter()
  const { withLoading } = useSmartLoading()

  // Shortcut Listener (CMD+K / CTRL+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault()
        setIsOpen(true)
      }
      if (e.key === 'Escape') {
        setIsOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  useEffect(() => {
    if (isOpen) {
      inputRef.current?.focus()
    }
  }, [isOpen])

  // Smart Search Logic
  useEffect(() => {
    if (query.length < 2) {
      queueMicrotask(() => {
        setResults([])
        setLoading(false)
      })
      return
    }

    const performSearch = async () => {
      setLoading(true)
      try {
        // Try calling the smart_search RPC function
        const { data, error } = await db.rpc('smart_search', { search_term: query })

        if (!error && data) {
          setResults(data)
        } else {
          // Fallback to manual queries if RPC fails (e.g. migration not applied)
          const [profiles, tasks, groups] = await Promise.all([
            db.from('profiles').select('id, full_name, avatar_url, course_name, country_code').ilike('full_name', `%${query}%`).limit(3),
            db.from('tasks').select('id, title, status').ilike('title', `%${query}%`).limit(3),
            db.from('groups').select('id, name, module_code').ilike('name', `%${query}%`).limit(3)
          ])

          const profileRows = (profiles.data || []) as ProfileSearchRow[]
          const taskRows = (tasks.data || []) as TaskSearchRow[]
          const groupRows = (groups.data || []) as GroupSearchRow[]

          const combined: SearchResult[] = [
            ...profileRows.map(p => ({
              id: p.id,
              type: 'profile' as const, 
              title: p.full_name || 'Unknown',
              subtitle: p.course_name || 'No course',
              image_url: p.avatar_url || undefined,
              country_code: p.country_code || undefined
            })),
            ...taskRows.map(t => ({ id: t.id, type: 'task' as const, title: t.title, subtitle: t.status })),
            ...groupRows.map(g => ({ id: g.id, type: 'group' as const, title: g.name, subtitle: g.module_code }))
          ]
          setResults(combined)
        }
      } catch (err) {
        console.error('Search error:', err)
      } finally {
        setLoading(false)
      }
    }

    const timer = setTimeout(performSearch, 300)
    return () => clearTimeout(timer)
  }, [query, db])

  const handleSelect = (result: SearchResult) => {
    setIsOpen(false)
    setQuery('')
    
    let path = '/dashboard'
    let label = 'Navigating...'

    if (result.type === 'profile') {
      path = `/dashboard/network/profile/${result.id}`
      label = `Opening ${result.title}...`
    } else if (result.type === 'task') {
      path = `/dashboard?taskId=${result.id}`
      label = `Opening Task: ${result.title}...`
    } else if (result.type === 'group') {
      path = `/dashboard/network` 
      label = `Finding Team: ${result.title}...`
    }

    withLoading(async () => {
      router.push(path)
    }, label)
  }

  if (!isOpen) {
    return (
      <button 
        onClick={() => setIsOpen(true)}
        style={{
          width: '100%', 
          padding: collapsed ? '0.75rem' : '0.75rem 1rem', 
          borderRadius: '14px', 
          background: 'var(--bg-main)',
          border: '1px solid var(--border)', 
          display: 'flex', 
          alignItems: 'center', 
          gap: collapsed ? '0' : '0.75rem',
          justifyContent: collapsed ? 'center' : 'flex-start',
          color: 'var(--text-sub)', 
          cursor: 'pointer', 
          transition: 'all 0.2s', 
          marginBottom: '1rem',
          minHeight: '44px'
        }}
        title="Search workspace (⌘K)"
        className="search-trigger"
      >
        <Search size={18} />
        {!collapsed && (
          <>
            <span style={{ fontSize: '0.85rem', flex: 1, textAlign: 'left' }}>Search workspace...</span>
            <span style={{ fontSize: '0.7rem', opacity: 0.5, border: '1px solid var(--border)', padding: '2px 6px', borderRadius: '6px' }}>⌘K</span>
          </>
        )}
      </button>
    )
  }

  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 9999, display: 'flex', alignItems: 'flex-start', justifyContent: 'center', paddingTop: '10vh', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(4px)' }} onClick={() => setIsOpen(false)}>
      <div 
        ref={searchRef}
        onClick={(e) => e.stopPropagation()}
        style={{ 
          width: '90%', maxWidth: '600px', background: 'var(--surface)', borderRadius: '24px', 
          border: '1px solid var(--border)', boxShadow: '0 25px 50px -12px rgba(0,0,0,0.5)', 
          overflow: 'hidden', animation: 'searchSlideIn 0.3s cubic-bezier(0.4, 0, 0.2, 1)' 
        }}
      >
        {/* Input Header */}
        <div style={{ padding: '1.25rem', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          {loading ? <Loader2 size={24} className="spin" color="var(--brand)" /> : <Search size={24} color="var(--brand)" />}
          <input 
            ref={inputRef}
            type="text" 
            placeholder="Search students, tasks, or teams..." 
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            style={{ flex: 1, background: 'none', border: 'none', color: 'var(--text-main)', fontSize: '1.25rem', fontWeight: 600, outline: 'none' }}
          />
          <button onClick={() => setIsOpen(false)} style={{ background: 'none', border: 'none', color: 'var(--text-sub)', cursor: 'pointer' }}><X size={20} /></button>
        </div>

        {/* Results Area */}
        <div style={{ maxHeight: '60vh', overflowY: 'auto', padding: '0.75rem' }}>
          {query.length < 2 ? (
            <div style={{ padding: '3rem 2rem', textAlign: 'center', color: 'var(--text-sub)' }}>
               <Search size={40} style={{ opacity: 0.1, marginBottom: '1rem' }} />
               <p style={{ margin: 0 }}>Find students, tasks, or teams across the network.</p>
               <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'center', gap: '1rem' }}>
                  <div className="search-pill">⌘K to search</div>
                  <div className="search-pill">ESC to close</div>
               </div>
            </div>
          ) : results.length === 0 && !loading ? (
            <div style={{ padding: '3rem 2rem', textAlign: 'center' }}>
              <p style={{ color: 'var(--text-sub)' }}>No exact matches for &quot;<span style={{ color: 'var(--text-main)' }}>{query}</span>&quot;</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
               {results.map((r, i) => (
                 <div 
                   key={`${r.type}-${r.id}`}
                   onClick={() => handleSelect(r)}
                   style={{ 
                     display: 'flex', alignItems: 'center', gap: '1.25rem', padding: '1rem', 
                     borderRadius: '16px', cursor: 'pointer', transition: 'all 0.2s' 
                   }}
                   className="search-item"
                 >
                   <div style={{ width: '42px', height: '42px', borderRadius: '12px', background: 'var(--bg-sub)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                      {r.type === 'profile' && (
                        r.image_url ? (
                          <img src={r.image_url} style={{ width: '100%', height: '100%', borderRadius: '12px', objectFit: 'cover' }} />
                        ) : (
                          <User size={20} color="var(--brand)" />
                        )
                      )}
                      {r.type === 'task' && <CheckSquare size={20} color="#10b981" />}
                      {r.type === 'group' && <Users size={20} color="#8b5cf6" />}
                   </div>
                   <div style={{ flex: 1 }}>
                      <div style={{ fontWeight: 800, color: 'var(--text-main)', fontSize: '1rem' }}>{r.title}</div>
                      <div style={{ color: 'var(--text-sub)', fontSize: '0.8rem', textTransform: 'capitalize' }}>
                        {r.type === 'profile' ? 'Teammate' : r.type === 'group' ? 'Group' : 'Task'} • {r.subtitle}
                      </div>
                   </div>
                   <ArrowRight size={16} color="var(--text-sub)" className="search-arrow" />
                 </div>
               ))}
            </div>
          )}
        </div>

        {/* Footer */}
        <div style={{ padding: '0.75rem 1.25rem', borderTop: '1px solid var(--border)', backgroundColor: 'var(--bg-sub)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '0.75rem', color: 'var(--text-sub)' }}>
          <div style={{ display: 'flex', gap: '1rem' }}>
             <span><strong>ENTER</strong> to select</span>
             <span><strong>↑↓</strong> to navigate</span>
          </div>
          <div>Smart Search v1.0</div>
        </div>

        <style jsx>{`
          .search-item:hover { background: rgba(var(--brand-rgb), 0.08); }
          .search-item:hover .search-arrow { transform: translateX(4px); color: var(--brand); }
          .search-pill { font-size: 0.7rem; font-weight: 800; background: var(--bg-sub); padding: 4px 10px; borderRadius: 20px; border: 1px solid var(--border); }
          @keyframes searchSlideIn { from { transform: translateY(-30px); opacity: 0; } to { transform: translateY(0); opacity: 1; } }
          .spin { animation: spin 1s linear infinite; }
          @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        `}</style>
      </div>
    </div>
  )
}
