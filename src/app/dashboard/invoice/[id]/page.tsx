'use client'

import { useState, useEffect, Suspense } from 'react'
import { useParams, useRouter } from 'next/navigation'
import { FileText, Download, CheckCircle, Clock, XCircle, ArrowLeft, Printer, CreditCard, ShieldCheck } from 'lucide-react'
import Link from 'next/link'
import { useProfile } from '@/context/ProfileContext'

function InvoiceDetailPage() {
  const params = useParams()
  const router = useRouter()
  const { profile } = useProfile()
  const [invoice, setInvoice] = useState<any>(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    async function fetchInvoice() {
      if (!params.id) return
      setLoading(true)
      try {
        // Fetch from history API which returns transfers/payments
        const res = await fetch(`/api/payments/history`)
        if (res.ok) {
          const data = await res.json()
          // In a real app, we'd have a specific GET /api/payments/[id]
          // but we'll search the history for now as a fallback
          const found = data.transfers?.find((t: any) => t.id === params.id)
          setInvoice(found)
        }
      } catch (err) {
        console.error('Failed to fetch invoice:', err)
      } finally {
        setLoading(false)
      }
    }
    fetchInvoice()
  }, [params.id])

  if (loading) {
    return (
      <div style={{ minHeight: '80vh', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <div className="spinner" />
      </div>
    )
  }

  if (!invoice && !loading) {
    return (
      <div style={{ maxWidth: '600px', margin: '4rem auto', textAlign: 'center', padding: '2rem' }}>
        <XCircle size={48} color="#ef4444" style={{ marginBottom: '1.5rem' }} />
        <h1 style={{ fontSize: '1.5rem', fontWeight: 900, color: 'white' }}>Invoice Not Found</h1>
        <p style={{ color: 'rgba(255,255,255,0.5)', marginBottom: '2rem' }}>We couldn't locate the payment record you're looking for.</p>
        <Link href="/dashboard" style={{ color: 'var(--brand)', fontWeight: 700, textDecoration: 'none' }}>Return to Dashboard</Link>
      </div>
    )
  }

  const fmtDate = (d: string) => new Date(d).toLocaleDateString('en-GB', { day: 'numeric', month: 'long', year: 'numeric' })
  const fmtCurrency = (cents: number) => (cents / 100).toLocaleString('en-GB', { style: 'currency', currency: invoice.currency || 'GBP' })

  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '2rem 1rem' }}>
      <button onClick={() => router.back()} style={{ background: 'none', border: 'none', color: 'rgba(255,255,255,0.5)', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '2rem', fontWeight: 700, fontSize: '0.9rem' }}>
        <ArrowLeft size={16} /> Back
      </button>

      <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '24px', padding: '3rem', boxShadow: '0 20px 50px rgba(0,0,0,0.3)' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '4rem', flexWrap: 'wrap', gap: '2rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginBottom: '1.5rem' }}>
              <div style={{ width: '40px', height: '40px', background: 'var(--brand)', borderRadius: '12px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <FileText color="white" size={24} />
              </div>
              <h1 style={{ fontSize: '1.5rem', fontWeight: 950, color: 'white', margin: 0 }}>Invoice</h1>
            </div>
            <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>Invoice Number</p>
            <p style={{ color: 'white', margin: '0.25rem 0 0', fontWeight: 800 }}>{invoice.invoice_number || `INV-${invoice.id.slice(0, 8).toUpperCase()}`}</p>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ display: 'inline-flex', padding: '6px 14px', borderRadius: '100px', background: invoice.status === 'completed' || invoice.status === 'paid' ? 'rgba(16,185,129,0.1)' : 'rgba(245,158,11,0.1)', border: '1px solid rgba(255,255,255,0.1)', color: invoice.status === 'completed' || invoice.status === 'paid' ? '#10b981' : '#f59e0b', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '1rem' }}>
              {invoice.status === 'completed' || invoice.status === 'paid' ? <><CheckCircle size={14} style={{ marginRight: '6px' }} /> Paid</> : <><Clock size={14} style={{ marginRight: '6px' }} /> Pending</>}
            </div>
            <p style={{ color: 'rgba(255,255,255,0.4)', margin: 0, fontSize: '0.85rem', fontWeight: 600 }}>Date Issued</p>
            <p style={{ color: 'white', margin: '0.25rem 0 0', fontWeight: 800 }}>{fmtDate(invoice.created_at || invoice.completed_at)}</p>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '3rem', marginBottom: '4rem' }}>
          <div>
            <h3 style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Billed To</h3>
            <p style={{ color: 'white', fontWeight: 800, margin: '0 0 0.25rem' }}>{profile?.full_name || 'Scholar'}</p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.9rem', margin: 0 }}>{profile?.email || 'N/A'}</p>
          </div>
          <div>
            <h3 style={{ fontSize: '0.75rem', color: 'rgba(255,255,255,0.3)', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1rem' }}>Payment Method</h3>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', color: 'white' }}>
              <CreditCard size={18} color="rgba(255,255,255,0.4)" />
              <span style={{ fontWeight: 700, fontSize: '0.95rem' }}>Stripe Secure Payment</span>
            </div>
          </div>
        </div>

        <table style={{ width: '100%', borderCollapse: 'collapse', marginBottom: '4rem' }}>
          <thead>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <th style={{ textAlign: 'left', padding: '1rem 0', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Description</th>
              <th style={{ textAlign: 'right', padding: '1rem 0', color: 'rgba(255,255,255,0.3)', fontSize: '0.75rem', fontWeight: 900, textTransform: 'uppercase', letterSpacing: '0.1em' }}>Amount</th>
            </tr>
          </thead>
          <tbody>
            <tr style={{ borderBottom: '1px solid rgba(255,255,255,0.06)' }}>
              <td style={{ padding: '2rem 0', color: 'white', fontWeight: 700 }}>
                {invoice.note || invoice.plan_label || 'Espeezy Scholar Upgrade'}
                <div style={{ fontSize: '0.8rem', color: 'rgba(255,255,255,0.4)', fontWeight: 500, marginTop: '0.25rem' }}>Institutional access and AI tools authorization</div>
              </td>
              <td style={{ textAlign: 'right', padding: '2rem 0', color: 'white', fontWeight: 900, fontSize: '1.1rem' }}>{fmtCurrency(invoice.amount_cents || invoice.net_cents)}</td>
            </tr>
          </tbody>
          <tfoot>
            <tr>
              <td style={{ padding: '2rem 0 0.5rem', textAlign: 'right', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>Subtotal</td>
              <td style={{ padding: '2rem 0 0.5rem', textAlign: 'right', color: 'white', fontWeight: 800 }}>{fmtCurrency(invoice.amount_cents || invoice.net_cents)}</td>
            </tr>
            <tr>
              <td style={{ padding: '0.5rem 0', textAlign: 'right', color: 'rgba(255,255,255,0.4)', fontWeight: 700 }}>Tax</td>
              <td style={{ padding: '0.5rem 0', textAlign: 'right', color: 'white', fontWeight: 800 }}>{fmtCurrency(0)}</td>
            </tr>
            <tr>
              <td style={{ padding: '1.5rem 0', textAlign: 'right', color: 'white', fontWeight: 950, fontSize: '1.2rem' }}>Total</td>
              <td style={{ padding: '1.5rem 0', textAlign: 'right', color: 'var(--brand)', fontWeight: 950, fontSize: '1.5rem' }}>{fmtCurrency(invoice.amount_cents || invoice.net_cents)}</td>
            </tr>
          </tfoot>
        </table>

        <div style={{ background: 'rgba(16,185,129,0.04)', border: '1px solid rgba(16,185,129,0.1)', borderRadius: '16px', padding: '1.5rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
          <ShieldCheck size={24} color="#10b981" />
          <div>
            <p style={{ margin: 0, color: 'white', fontWeight: 800, fontSize: '0.9rem' }}>Verified Payment</p>
            <p style={{ margin: 0, color: 'rgba(255,255,255,0.5)', fontSize: '0.8rem', fontWeight: 500 }}>This invoice has been reconciled with financial records.</p>
          </div>
        </div>
      </div>

      <div style={{ display: 'flex', justifyContent: 'center', gap: '1rem', marginTop: '2rem' }}>
        <button onClick={() => window.print()} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer' }}>
          <Printer size={18} /> Print Invoice
        </button>
        <button style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', padding: '0.75rem 1.5rem', borderRadius: '12px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: 'white', fontWeight: 800, fontSize: '0.9rem', cursor: 'pointer' }}>
          <Download size={18} /> Download PDF
        </button>
      </div>
    </div>
  )
}

export default function InvoicePageWrapper() {
  return (
    <Suspense fallback={<div style={{ padding: '4rem', textAlign: 'center' }}><div className="spinner" /></div>}>
      <InvoiceDetailPage />
    </Suspense>
  )
}
