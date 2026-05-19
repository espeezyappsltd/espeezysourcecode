'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Coins, Loader2, Receipt, ShoppingBag, TrendingUp, RefreshCw } from 'lucide-react'
import { createClient as createBrowserSupabaseClient } from '@/lib/supabase/client'
import { formatCredits } from '@/lib/credits'
import { FundCreditAccountButton } from '@/components/credits/FundCreditAccountButton'

type PurchaseRow = {
  id: string
  invoice_number: string
  listing_title: string
  listing_category?: string | null
  credits_amount: number
  created_at: string
  seller_id: string
  buyer_id: string
}

type WalletData = {
  credits: number
  purchases: PurchaseRow[]
  sales: PurchaseRow[]
}

export function AccountWalletPanel({ compact = false }: { compact?: boolean }) {
  const db = useMemo(() => createBrowserSupabaseClient(), [])
  const [wallet, setWallet] = useState<WalletData | null>(null)
  const [loading, setLoading] = useState(true)
  const [userId, setUserId] = useState<string | null>(null)

  const loadWallet = useCallback(async () => {
    setLoading(true)
    try {
      const res = await fetch('/api/account/wallet', { credentials: 'include' })
      if (!res.ok) return
      const data = (await res.json()) as WalletData
      setWallet(data)
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => {
    db.auth.getUser().then(({ data }) => setUserId(data.user?.id ?? null))
    void loadWallet()
  }, [db, loadWallet])

  useEffect(() => {
    if (!userId) return

    const channel = db
      .channel(`wallet-credits-${userId}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'profiles',
          filter: `id=eq.${userId}`,
        },
        (payload) => {
          const next = (payload.new as { espeezy_credits?: number }).espeezy_credits
          if (typeof next === 'number') {
            setWallet((prev) => (prev ? { ...prev, credits: next } : { credits: next, purchases: [], sales: [] }))
          }
        },
      )
      .on(
        'postgres_changes',
        {
          event: 'INSERT',
          schema: 'public',
          table: 'marketplace_purchases',
        },
        () => {
          void loadWallet()
        },
      )
      .subscribe()

    return () => {
      void db.removeChannel(channel)
    }
  }, [db, loadWallet, userId])

  if (loading && !wallet) {
    return (
      <div style={{ padding: compact ? '1rem' : '2rem', textAlign: 'center' }}>
        <Loader2 className="animate-spin" style={{ margin: '0 auto', color: 'var(--brand)' }} />
      </div>
    )
  }

  const credits = wallet?.credits ?? 0

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: compact ? '1rem' : '1.5rem' }}>
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          padding: compact ? '1rem' : '1.5rem',
          background: 'linear-gradient(135deg, rgba(var(--brand-rgb), 0.12), transparent)',
          borderRadius: '20px',
          border: '1px solid var(--border)',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Coins size={28} style={{ color: 'var(--brand)' }} aria-hidden />
          <div>
            <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--text-sub)', textTransform: 'uppercase' }}>
              Personal credit account
            </div>
            <div style={{ fontSize: compact ? '1.5rem' : '2rem', fontWeight: 950, color: 'var(--brand)' }}>{credits}</div>
            {!compact && (
              <Link href="/account/credits" style={{ fontSize: '0.75rem', fontWeight: 800, color: 'var(--brand)' }}>
                View account →
              </Link>
            )}
          </div>
        </div>
        <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem', alignItems: 'center' }}>
          <FundCreditAccountButton
            returnPath="/account/credits"
            label="Fund cred acc now"
            variant={compact ? 'primary' : 'primary'}
          />
          <button
            type="button"
            onClick={() => void loadWallet()}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              padding: '0.5rem 0.85rem',
              borderRadius: '10px',
              border: '1px solid var(--border)',
              background: 'var(--surface)',
              color: 'var(--text-main)',
              fontWeight: 800,
              fontSize: '0.8rem',
              cursor: 'pointer',
              minHeight: 44,
            }}
            aria-label="Refresh credit balance"
          >
            <RefreshCw size={14} aria-hidden /> Refresh
          </button>
        </div>
      </div>

      {!compact && (
        <>
          <TransactionSection title="Purchases" icon={<ShoppingBag size={18} />} rows={wallet?.purchases ?? []} role="buyer" />
          <TransactionSection title="Sales" icon={<TrendingUp size={18} />} rows={wallet?.sales ?? []} role="seller" />
        </>
      )}
    </div>
  )
}

function TransactionSection({
  title,
  icon,
  rows,
  role,
}: {
  title: string
  icon: React.ReactNode
  rows: PurchaseRow[]
  role: 'buyer' | 'seller'
}) {
  return (
    <section>
      <h3 style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1rem', fontWeight: 950, marginBottom: '0.75rem' }}>
        {icon}
        {title}
      </h3>
      {rows.length === 0 ? (
        <p style={{ color: 'var(--text-sub)', fontSize: '0.85rem' }}>No {title.toLowerCase()} yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          {rows.map((row) => (
            <div
              key={row.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                padding: '0.85rem 1rem',
                background: 'var(--surface)',
                border: '1px solid var(--border)',
                borderRadius: '14px',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div style={{ fontWeight: 900, fontSize: '0.9rem', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                  {row.listing_title}
                </div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', marginTop: '0.2rem' }}>
                  {row.invoice_number} · {new Date(row.created_at).toLocaleDateString()}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexShrink: 0 }}>
                <span style={{ fontWeight: 950, color: role === 'seller' ? '#22c55e' : 'var(--brand)', fontSize: '0.85rem' }}>
                  {role === 'seller' ? '+' : '−'}
                  {formatCredits(row.credits_amount)}
                </span>
                <Link
                  href={`/marketplace/invoice/${row.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.25rem',
                    fontSize: '0.75rem',
                    fontWeight: 800,
                    color: 'var(--brand)',
                    textDecoration: 'none',
                  }}
                >
                  <Receipt size={14} aria-hidden /> Invoice
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
