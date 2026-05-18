'use client'

import React, { useState } from 'react'
import Image from 'next/image'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import {
  X,
  MapPin,
  Clock,
  Coins,
  Loader2,
  User,
  Package,
  CreditCard,
  Shield,
  MessageSquare,
} from 'lucide-react'
import { Listing } from '@/types/marketplace'
import { useNotifications } from '@/components/NotificationProvider'
import { formatCredits, creditsToGbpEquivalent } from '@/lib/credits'
import { isListingAvailable } from '@/lib/marketplace/trending'
import { PLATFORM_CONTACT_RULES, avatarUrlForProfile } from '@/lib/platform/contact-rules'
import RemoteAvatar from '@/components/common/RemoteAvatar'

interface ListingDetailPanelProps {
  listing: Listing
  userCredits: number | null
  currentUserId?: string | null
  onClose: () => void
  onPurchaseComplete: (payload: { buyerCredits: number; purchaseId: string }) => void
}

export function ListingDetailPanel({
  listing,
  userCredits,
  currentUserId,
  onClose,
  onPurchaseComplete,
}: ListingDetailPanelProps) {
  const router = useRouter()
  const { addToast } = useNotifications()
  const [checkingOut, setCheckingOut] = useState(false)
  const [saving, setSaving] = useState(false)

  const priceCredits = Math.max(0, Math.floor(listing.price ?? 0))
  const isFree = priceCredits === 0
  const isOwn = currentUserId === listing.owner_id
  const available = isListingAvailable(listing)
  const canAfford = userCredits === null || userCredits >= priceCredits

  const handleCheckout = async () => {
    if (isOwn) {
      addToast('Cannot purchase', 'This is your own listing.', 'warning')
      return
    }
    if (!available) {
      addToast('Unavailable', 'This item has already been sold.', 'warning')
      return
    }
    if (!isFree && !canAfford) {
      addToast('Insufficient credits', `You need ${formatCredits(priceCredits)}. Open Settings → Billing or earn credits by selling.`, 'warning')
      return
    }

    setCheckingOut(true)
    try {
      const res = await fetch('/api/marketplace/purchase', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        credentials: 'include',
        body: JSON.stringify({ listingId: listing.id }),
      })
      const data = (await res.json()) as {
        error?: string
        message?: string
        buyerCredits?: number
        purchaseId?: string
        invoiceUrl?: string
      }

      if (!res.ok) {
        addToast('Checkout failed', data.message ?? data.error ?? 'Try again.', 'error')
        return
      }

      addToast(
        'Purchase confirmed',
        isFree ? 'Item claimed. Check your notifications for the invoice.' : `Paid ${formatCredits(priceCredits)}. Invoice sent.`,
        'success',
      )

      if (typeof data.buyerCredits === 'number' && data.purchaseId) {
        onPurchaseComplete({ buyerCredits: data.buyerCredits, purchaseId: data.purchaseId })
      }

      if (data.invoiceUrl) {
        window.open(data.invoiceUrl, '_blank', 'noopener')
      }
      onClose()
    } catch {
      addToast('Network error', 'Could not complete checkout.', 'error')
    } finally {
      setCheckingOut(false)
    }
  }

  const handleSave = async () => {
    setSaving(true)
    try {
      const res = await fetch('/api/inventory', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ listing_id: listing.id }),
      })
      if (res.ok) {
        addToast('Saved', 'Added to your personal inventory.', 'success')
      } else {
        const d = (await res.json()) as { error?: string }
        addToast('Save failed', d.error ?? 'Could not save.', 'error')
      }
    } catch {
      addToast('Network error', 'Could not save listing.', 'error')
    } finally {
      setSaving(false)
    }
  }

  return (
    <div
      role="dialog"
      aria-modal="true"
      style={{
        position: 'fixed',
        inset: 0,
        zIndex: 12000,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '1rem',
      }}
    >
      <div
        style={{
          position: 'absolute',
          inset: 0,
          background: 'rgba(0,0,0,0.85)',
          backdropFilter: 'blur(12px)',
        }}
        onClick={onClose}
      />
      <div
        className="page-fade"
        style={{
          width: '100%',
          maxWidth: '960px',
          background: 'var(--surface)',
          borderRadius: '32px',
          overflow: 'hidden',
          position: 'relative',
          border: '1px solid var(--border)',
          maxHeight: '92vh',
          display: 'flex',
          flexDirection: 'column',
        }}
      >
        <button
          type="button"
          onClick={onClose}
          aria-label="Close"
          style={{
            position: 'absolute',
            top: '1rem',
            right: '1rem',
            zIndex: 2,
            background: 'rgba(0,0,0,0.5)',
            border: 'none',
            color: 'white',
            borderRadius: '12px',
            padding: '0.5rem',
            cursor: 'pointer',
          }}
        >
          <X size={20} />
        </button>

        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(280px, 1.1fr) 1fr', minHeight: 0 }}>
          <div style={{ background: 'var(--bg-sub)', position: 'relative', minHeight: '320px' }}>
            {listing.images?.[0] ? (
              <Image src={listing.images[0]} alt={listing.title} fill className="object-cover" />
            ) : (
              <div
                style={{
                  width: '100%',
                  height: '100%',
                  minHeight: '320px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  color: 'var(--text-sub)',
                }}
              >
                <Package size={48} opacity={0.3} />
              </div>
            )}
          </div>

          <div style={{ padding: '2rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '0.5rem' }}>
              <span
                style={{
                  padding: '4px 12px',
                  background: 'rgba(var(--brand-rgb), 0.12)',
                  color: 'var(--brand)',
                  borderRadius: '100px',
                  fontSize: '0.7rem',
                  fontWeight: 900,
                }}
              >
                {listing.category}
              </span>
              <span
                style={{
                  padding: '4px 12px',
                  background: 'var(--bg-sub)',
                  borderRadius: '100px',
                  fontSize: '0.7rem',
                  fontWeight: 800,
                  color: 'var(--text-sub)',
                }}
              >
                {listing.condition}
              </span>
              {!available && (
                <span style={{ padding: '4px 12px', background: '#7f1d1d', color: '#fecaca', borderRadius: '100px', fontSize: '0.7rem', fontWeight: 900 }}>
                  SOLD
                </span>
              )}
            </div>

            <h2 style={{ margin: 0, fontSize: '1.75rem', fontWeight: 950, letterSpacing: '-0.03em', color: 'var(--text-main)' }}>
              {listing.title}
            </h2>

            <div style={{ display: 'flex', alignItems: 'baseline', gap: '0.75rem', flexWrap: 'wrap' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem', fontSize: '1.5rem', fontWeight: 950, color: 'var(--brand)' }}>
                <Coins size={22} />
                {isFree ? 'FREE' : formatCredits(priceCredits)}
              </div>
              {!isFree && (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-sub)', fontWeight: 600 }}>
                  ≈ £{creditsToGbpEquivalent(priceCredits).toFixed(2)}
                </span>
              )}
            </div>

            {userCredits !== null && (
              <p style={{ margin: 0, fontSize: '0.85rem', color: canAfford ? 'var(--text-sub)' : '#f87171', fontWeight: 700 }}>
                Your balance: {userCredits} credits
              </p>
            )}

            <p style={{ margin: 0, color: 'var(--text-sub)', lineHeight: 1.65, fontSize: '0.95rem' }}>{listing.description}</p>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
              <div style={{ padding: '1rem', background: 'var(--bg-sub)', borderRadius: '16px' }}>
                <MapPin size={18} style={{ color: 'var(--brand)', marginBottom: '0.35rem' }} />
                <div style={{ fontWeight: 900, fontSize: '0.9rem' }}>{listing.meetup_zone}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', marginTop: '0.25rem' }}>{listing.meetup_details || 'Campus meetup'}</div>
              </div>
              <div style={{ padding: '1rem', background: 'var(--bg-sub)', borderRadius: '16px' }}>
                <Clock size={18} style={{ color: 'var(--brand)', marginBottom: '0.35rem' }} />
                <div style={{ fontWeight: 900, fontSize: '0.9rem' }}>{listing.duration_days} days</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', marginTop: '0.25rem' }}>Listing duration</div>
              </div>
              <div style={{ padding: '1rem', background: 'var(--bg-sub)', borderRadius: '16px' }}>
                <Package size={18} style={{ color: 'var(--brand)', marginBottom: '0.35rem' }} />
                <div style={{ fontWeight: 900, fontSize: '0.9rem' }}>Qty {listing.quantity ?? 1}</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', marginTop: '0.25rem' }}>{listing.payment_method || 'Credits'}</div>
              </div>
              <div style={{ padding: '1rem', background: 'var(--bg-sub)', borderRadius: '16px' }}>
                <Shield size={18} style={{ color: 'var(--brand)', marginBottom: '0.35rem' }} />
                <div style={{ fontWeight: 900, fontSize: '0.9rem' }}>Espeezy escrow</div>
                <div style={{ fontSize: '0.75rem', color: 'var(--text-sub)', marginTop: '0.25rem' }}>Credits + invoice</div>
              </div>
            </div>

            <div style={{ padding: '1.25rem', border: '1px solid var(--border)', borderRadius: '20px' }}>
              <div style={{ fontSize: '0.7rem', fontWeight: 950, color: 'var(--text-sub)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '1px' }}>
                Seller
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}>
                <div style={{ width: 48, height: 48, borderRadius: '14px', background: 'var(--brand)', overflow: 'hidden' }}>
                  {listing.owner_id ? (
                    <RemoteAvatar
                      src={avatarUrlForProfile({
                        id: listing.owner_id,
                        full_name: listing.profiles?.full_name,
                        username: listing.profiles?.username ?? null,
                        avatar_url: listing.profiles?.avatar_url,
                      })}
                      alt={listing.profiles?.full_name ?? 'Seller'}
                      size={48}
                      style={{ width: '100%', height: '100%', borderRadius: 'inherit' }}
                      fallback={
                        <span style={{ fontWeight: 900, color: '#fff' }}>
                          {listing.profiles?.full_name?.charAt(0) ?? '?'}
                        </span>
                      }
                    />
                  ) : null}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontWeight: 950, color: 'var(--text-main)' }}>{listing.profiles?.full_name ?? 'Seller'}</div>
                  <div style={{ fontSize: '0.75rem', color: 'var(--brand)', fontWeight: 800 }}>{listing.profiles?.role ?? 'Contributor'}</div>
                </div>
                <Link
                  href={`/network/profile/${listing.owner_id}`}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                    padding: '0.5rem 0.85rem',
                    borderRadius: '10px',
                    border: '1px solid var(--border)',
                    color: 'var(--text-main)',
                    fontSize: '0.8rem',
                    fontWeight: 800,
                    textDecoration: 'none',
                  }}
                >
                  <User size={14} />
                  Profile
                </Link>
                {!isOwn && (
                  <button
                    type="button"
                    onClick={() =>
                      router.push(`/network/messages/${listing.owner_id}?listing=${listing.id}`)
                    }
                    title="Message seller per Espeezy platform rules"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.35rem',
                      padding: '0.5rem 0.85rem',
                      borderRadius: '10px',
                      border: 'none',
                      background: 'var(--brand)',
                      color: '#000',
                      fontSize: '0.8rem',
                      fontWeight: 900,
                      cursor: 'pointer',
                    }}
                  >
                    <MessageSquare size={14} />
                    Contact
                  </button>
                )}
              </div>
            </div>

            {!isOwn && (
              <p style={{ margin: '0 0 0.75rem', fontSize: '0.7rem', color: 'var(--text-sub)', lineHeight: 1.5 }}>
                {PLATFORM_CONTACT_RULES[0]} Messages are logged; keep deals on-campus and respectful.
              </p>
            )}

            <div style={{ display: 'flex', gap: '0.75rem', marginTop: 'auto', paddingTop: '0.5rem' }}>
              <button
                type="button"
                disabled={checkingOut || isOwn || !available}
                onClick={() => void handleCheckout()}
                className="btn btn-primary"
                style={{
                  flex: 2,
                  padding: '1rem',
                  borderRadius: '16px',
                  fontWeight: 950,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  opacity: checkingOut || isOwn || !available ? 0.6 : 1,
                }}
              >
                {checkingOut ? <Loader2 size={18} className="animate-spin" /> : <CreditCard size={18} />}
                {isFree ? 'Claim item' : 'Checkout with credits'}
              </button>
              <button
                type="button"
                disabled={saving}
                onClick={() => void handleSave()}
                style={{
                  flex: 1,
                  padding: '1rem',
                  borderRadius: '16px',
                  fontWeight: 900,
                  background: 'var(--bg-sub)',
                  border: '1px solid var(--border)',
                  color: 'var(--text-main)',
                  cursor: 'pointer',
                }}
              >
                {saving ? '…' : 'Save'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
