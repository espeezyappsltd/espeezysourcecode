'use client'

import Link from 'next/link'
import { Braces, Database, KeyRound, Globe, ExternalLink } from 'lucide-react'
import { DATA_API_DATASETS } from '@/config/dataApiCatalog'

const DEFAULT_DATA_API_BASE = 'https://othntbcrtmemavfsslrb.db.co/rest/v1'


export default function LandingDevelopers() {
  const dataApiBase = process.env.NEXT_PUBLIC_SUPABASE_URL
    ? `${process.env.NEXT_PUBLIC_SUPABASE_URL}/rest/v1`
    : DEFAULT_DATA_API_BASE

  return (
    <section id="developers" style={{ padding: '10rem 2rem', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
      <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        <div style={{ textAlign: 'center', marginBottom: '4rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 800, fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.14em', marginBottom: '1.25rem' }}>
            <Braces size={14} /> Developers Data API
          </div>
          <h2 style={{ fontSize: 'clamp(2rem, 5vw, 3rem)', fontWeight: 900, color: '#f3f4f6', letterSpacing: '-0.04em', marginBottom: '1rem' }}>
            Production-ready data endpoints.
          </h2>
          <p style={{ maxWidth: '820px', margin: '0 auto', color: '#9ca3af', fontSize: '1rem', lineHeight: 1.7 }}>
            Use this Supabase Data API base URL to access all core datasets. For browser clients, use anon keys with RLS. For backend jobs,
            use service-role keys in server environments only.
          </p>
          <p style={{ maxWidth: '820px', margin: '0.85rem auto 0', color: '#6b7280', fontSize: '0.86rem', lineHeight: 1.7 }}>
            Recommended production setting: expose schema api in Supabase Data API settings and make api the default REST schema.
          </p>
        </div>

        <div style={{ background: '#101010', border: '1px solid #222222', borderRadius: '14px', padding: '1rem 1.25rem', marginBottom: '2rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', color: '#e5e7eb', fontWeight: 700 }}>
            <Globe size={16} color="#10b981" />
            Data API Base URL
          </div>
          <code style={{ background: 'rgba(16, 185, 129, 0.1)', border: '1px solid rgba(16, 185, 129, 0.3)', color: '#d1fae5', borderRadius: '8px', padding: '0.45rem 0.6rem', fontSize: '0.8rem' }}>
            {dataApiBase}
          </code>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem', marginBottom: '2.5rem' }}>
          {DATA_API_DATASETS.map((endpoint) => {
            const requestUrl = `${dataApiBase}/${endpoint.table}?${endpoint.filterHint}`
            return (
              <article key={endpoint.table} style={{ background: '#111111', border: '1px solid #222222', borderRadius: '12px', padding: '1.25rem', display: 'flex', flexDirection: 'column', gap: '0.7rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem' }}>
                  <h3 style={{ margin: 0, color: '#f3f4f6', fontSize: '1rem', fontWeight: 700, letterSpacing: '-0.01em' }}>{endpoint.name}</h3>
                  <span style={{ color: '#86efac', background: 'rgba(34,197,94,0.12)', border: '1px solid rgba(34,197,94,0.32)', borderRadius: '999px', padding: '0.2rem 0.55rem', fontSize: '0.68rem', fontWeight: 800 }}>GET</span>
                </div>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.45rem', color: '#9ca3af', fontSize: '0.78rem', fontWeight: 700 }}>
                  <Database size={13} /> /{endpoint.table}
                </div>
                <p style={{ margin: 0, color: '#9ca3af', fontSize: '0.85rem', lineHeight: 1.6 }}>{endpoint.notes}</p>
                <code style={{ whiteSpace: 'normal', wordBreak: 'break-word', background: '#0b0b0b', border: '1px solid #1f2937', color: '#d1d5db', borderRadius: '8px', padding: '0.5rem', fontSize: '0.72rem' }}>
                  {requestUrl}
                </code>
              </article>
            )
          })}
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1rem', marginBottom: '1rem' }}>
          <div style={{ background: '#111111', border: '1px solid #222222', borderRadius: '12px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f3f4f6', fontWeight: 800, marginBottom: '0.8rem' }}>
              <KeyRound size={14} color="#10b981" /> Browser example (RLS-aware)
            </div>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#d1d5db', fontSize: '0.76rem', lineHeight: 1.5, background: '#0b0b0b', border: '1px solid #1f2937', borderRadius: '8px', padding: '0.7rem' }}>
{`fetch('${dataApiBase}/tasks?select=id,title,status&order=created_at.desc', {
  headers: {
    apikey: process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    Authorization: 'Bearer <user_jwt_or_anon_key>'
  }
})`}
            </pre>
          </div>

          <div style={{ background: '#111111', border: '1px solid #222222', borderRadius: '12px', padding: '1.25rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#f3f4f6', fontWeight: 800, marginBottom: '0.8rem' }}>
              <ExternalLink size={14} color="#10b981" /> Server-to-server example
            </div>
            <pre style={{ margin: 0, whiteSpace: 'pre-wrap', color: '#d1d5db', fontSize: '0.76rem', lineHeight: 1.5, background: '#0b0b0b', border: '1px solid #1f2937', borderRadius: '8px', padding: '0.7rem' }}>
{`curl '${dataApiBase}/profiles?select=id,full_name,role&limit=50' \\
  -H 'apikey: <SUPABASE_SERVICE_ROLE_KEY>' \\
  -H 'Authorization: Bearer <SUPABASE_SERVICE_ROLE_KEY>'`}
            </pre>
          </div>
        </div>

        <div style={{ marginTop: '1rem', color: '#6b7280', fontSize: '0.85rem', lineHeight: 1.6 }}>
          Keep service-role keys in backend environments only. Never expose service-role credentials in browser code.
          You can also fetch the machine-readable catalog at{' '}
          <Link href="/api/developers/data-endpoints" style={{ color: '#10b981', textDecoration: 'none', fontWeight: 700 }}>
            /api/developers/data-endpoints
          </Link>
          .
          {' '} 
          For full platform documentation, visit{' '}
          <Link href="/docs" style={{ color: '#10b981', textDecoration: 'none', fontWeight: 700 }}>
            Help & Docs
          </Link>
          .
        </div>
      </div>
    </section>
  )
}