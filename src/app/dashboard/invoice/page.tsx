'use client'

import { useState, useEffect, Suspense } from 'react'
import { FileText, ChevronRight, Clock, CheckCircle, AlertCircle, Search, Filter } from 'lucide-react'
import Link from 'next/link'
import { useProfile } from '@/context/ProfileContext'

function InvoiceListPage() {
  const { profile } = useProfile()
  const [invoices, setInvoices] = useState<any[]>([])
  const [loading, setLoading] = useState(true)
  const [filter, setFilter] = useState('all')

  useEffect(() => {
    async function fetchInvoices() {
      setLoading(true)
      try {
        const res = await fetch('/api/payments/history')
        if (res.ok) {
          const data = await res.json()
          setInvoices(data.transfers || [])
        }
      } catch (err) {
        console.error('Failed to fetch invoices:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchInvoices()
  }, [])

  const filteredInvoices = invoices.filter(inv => {
    if (filter === 'all') return true
    return inv.status === filter
  })

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'short', year: 'numeric' })
  const fmtCurrency = (cents: number, curr?: string) => (cents / 100).toLocaleString('en-GB', { style: 'currency', currency: curr || 'GBP' })

  return (
    <div style={{ maxWidth: '900px', margin: '0 auto', padding: '2rem 1rem' }}>
      <div style={{ marginBottom: '2.5rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 950, color: 'white', letterSpacing: '-0.04em', margin: '0 0 0.5rem' }}>Billing & Invoices</h1>
        <p style={{ color: 'rgba(255,255,255,0.4)', fontWeight: 500 }}>Review your payment history and download institutional receipts.</p>
      </div>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1.5rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', gap: '0.5rem', background: 'rgba(255,255,255,0.03)', padding: '0.3rem', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.06)' }}>
          {['all', 'completed', 'pending', 'failed'].map(f => (
            <button key={f} onClick={() => setFilter(f)}
              style={{ padding: '0.5rem 1rem', borderRadius: '8px', background: filter === f ? 'rgba(16,185,129,0.1)' : 'transparent', border: 'none', color: filter === f ? '#10b981' : 'rgba(255,255,255,0.4)', fontWeight: 800, fontSize: '0.8rem', cursor: 'pointer', textTransform: 'capitalize' }}>
              {f}
            </button>
          ))}
        </div>
        <div style={{ position: 'relative' }}>
          <Search size={16} style={{ position: 'absolute', left: '1rem', top: '50%', transform: 'translateY(-50%)', color: 'rgba(255,255,255,0.2)' }} />
          <input type="text" placeholder="Search invoice..." style={{ padding: '0.6rem 1rem 0.6rem 2.5rem', borderRadius: '10px', background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', color: 'white', fontSize: '0.85rem', width: '240px' }} />
        </div>
      </div>

      {loading ? (
        <div style={{ padding: '5rem', textAlign: 'center' }}><div className="spinner" /></div>
      ) : filteredInvoices.length === 0 ? (
        <div style={{ padding: '5rem', textAlign: 'center', background: 'rgba(255,255,255,0.01)', borderRadius: '24px', border: '1px dashed rgba(255,255,255,0.08)' }}>
          <FileText size={48} color="rgba(255,255,255,0.05)" style={{ marginBottom: '1.5rem' }} />
          <h3 style={{ color: 'white', fontWeight: 800, margin: '0 0 0.5rem' }}>No invoices found</h3>
          <p style={{ color: 'rgba(255,255,255,0.4)', fontSize: '0.9rem' }}>You haven&apos;t made any institutional payments yet.</p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
          {filteredInvoices.map(inv => (
            <Link key={inv.id} href={`/dashboard/invoice/${inv.id}`} style={{ textDecoration: 'none' }}>
              <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '18px', padding: '1.25rem 1.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', transition: 'all 0.2s', cursor: 'pointer' }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.04)'; e.currentTarget.style.borderColor = 'rgba(16,185,129,0.2)' }}
                onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,0.02)'; e.currentTarget.style.borderColor = 'rgba(255,255,255,0.08)' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                  <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(255,255,255,0.03)', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'rgba(255,255,255,0.3)' }}>
                    <FileText size={20} />
                  </div>
                  <div>
                    <h4 style={{ margin: 0, color: 'white', fontWeight: 800, fontSize: '1rem' }}>{inv.plan_label || inv.note || 'Scholar Upgrade'}</h4>
                    <p style={{ margin: '0.2rem 0 0', color: 'rgba(255,255,255,0.3)', fontSize: '0.8rem', fontWeight: 600 }}>{inv.invoice_number || `INV-${inv.id.slice(0, 8).toUpperCase()}`} • {fmtDate(inv.created_at || inv.completed_at)}</p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '2rem' }}>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ margin: 0, color: 'white', fontWeight: 900, fontSize: '1.1rem' }}>{fmtCurrency(inv.amount_cents || inv.net_cents, inv.currency)}</p>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', justifyContent: 'flex-end', marginTop: '0.2rem' }}>
                      {inv.status === 'completed' || inv.status === 'paid' ? (
                        <><CheckCircle size={12} color="#10b981" /> <span style={{ fontSize: '0.7rem', color: '#10b981', fontWeight: 800, textTransform: 'uppercase' }}>Paid</span></>
                      ) : inv.status === 'pending' ? (
                        <><Clock size={12} color="#f59e0b" /> <span style={{ fontSize: '0.7rem', color: '#f59e0b', fontWeight: 800, textTransform: 'uppercase' }}>Pending</span></>
                      ) : (
                        <><AlertCircle size={12} color="#ef4444" /> <span style={{ fontSize: '0.7rem', color: '#ef4444', fontWeight: 800, textTransform: 'uppercase' }}>Failed</span></>
                      )}
                    </div>
                  </div>
                  <ChevronRight size={20} color="rgba(255,255,255,0.1)" />
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  )
}

export default function InvoiceHistoryPage() {
  return (
    <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center' }}><div className="spinner" /></div>}>
      <InvoiceListPage />
    </Suspense>
  )
}
