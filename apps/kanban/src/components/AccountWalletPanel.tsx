'use client'

import React, { useCallback, useEffect, useMemo, useState } from 'react'
import Link from 'next/link'
import { Loader2, Receipt, ShoppingBag, TrendingUp, RefreshCw } from 'lucide-react'
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
      <div className="wallet-premium wallet-premium--compact central-type" style={{ justifyContent: 'center', padding: '1.5rem' }}>
        <Loader2 className="animate-spin" size={20} style={{ color: 'var(--central-champagne)' }} aria-hidden />
      </div>
    )
  }

  const credits = wallet?.credits ?? 0

  return (
    <div className="central-type" style={{ display: 'flex', flexDirection: 'column', gap: compact ? '1rem' : '1.5rem' }}>
      <div className={`wallet-premium${compact ? ' wallet-premium--compact' : ''}`}>
        <button
          type="button"
          className="wallet-premium__refresh"
          onClick={() => void loadWallet()}
          aria-label="Refresh balance"
          style={{ position: 'absolute', top: '0.85rem', right: '0.85rem' }}
        >
          <RefreshCw size={14} aria-hidden />
        </button>

        <div className="wallet-premium__balance-col">
          <span className="central-eyebrow">Personal balance</span>
          <div className="wallet-premium__balance-row">
            <span className="wallet-premium__balance-value">{formatCredits(credits)}</span>
          </div>
          {!compact && (
            <Link href="/account/credits" className="central-link">
              View ledger
            </Link>
          )}
        </div>

        <div className="wallet-premium__actions">
          <FundCreditAccountButton returnPath="/account/credits" label="Add funds" />
        </div>
      </div>

      {!compact && (
        <>
          <TransactionSection title="Purchases" icon={<ShoppingBag size={16} />} rows={wallet?.purchases ?? []} role="buyer" />
          <TransactionSection title="Sales" icon={<TrendingUp size={16} />} rows={wallet?.sales ?? []} role="seller" />
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
    <section className="central-type">
      <h3
        className="central-eyebrow"
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '0.45rem',
          marginBottom: '0.75rem',
          color: 'var(--central-ink-soft)',
        }}
      >
        {icon}
        {title}
      </h3>
      {rows.length === 0 ? (
        <p className="central-caption">No {title.toLowerCase()} yet.</p>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
          {rows.map((row) => (
            <div
              key={row.id}
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'space-between',
                gap: '1rem',
                padding: '0.75rem 0.9rem',
                background: 'rgba(255,255,255,0.02)',
                border: '1px solid var(--central-rule)',
                borderRadius: '10px',
              }}
            >
              <div style={{ minWidth: 0 }}>
                <div
                  style={{
                    fontFamily: 'var(--font-central-ui)',
                    fontWeight: 500,
                    fontSize: '0.8125rem',
                    letterSpacing: '0.02em',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    color: 'var(--central-ink-soft)',
                  }}
                >
                  {row.listing_title}
                </div>
                <div className="central-caption" style={{ marginTop: '0.15rem' }}>
                  {row.invoice_number} · {new Date(row.created_at).toLocaleDateString('en-GB', { day: 'numeric', month: 'short' })}
                </div>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexShrink: 0 }}>
                <span
                  style={{
                    fontFamily: 'var(--font-central-display)',
                    fontSize: '0.95rem',
                    fontWeight: 500,
                    color: role === 'seller' ? 'rgba(134, 239, 172, 0.85)' : 'var(--central-champagne)',
                  }}
                >
                  {role === 'seller' ? '+' : '−'}
                  {formatCredits(row.credits_amount)}
                </span>
                <Link
                  href={role === 'buyer' ? `/marketplace/invoice/${row.id}` : `/marketplace/receipt/${row.id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="central-link"
                  style={{ display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}
                >
                  <Receipt size={12} aria-hidden />
                  {role === 'buyer' ? 'Invoice' : 'Receipt'}
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  )
}
