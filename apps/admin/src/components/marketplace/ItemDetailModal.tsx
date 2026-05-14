'use client'

import React from 'react'
import Image from 'next/image'
import { Plus, MapPin, Clock } from 'lucide-react'
import { Listing } from '@/types/marketplace'

interface ItemDetailModalProps {
  listing: Listing
  onClose: () => void
}

export function ItemDetailModal({ listing, onClose }: ItemDetailModalProps) {
  return (
    <div style={{ position: 'fixed', inset: 0, zIndex: 12000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(12px)' }} onClick={onClose} />
      
      <div className="page-fade" style={{ 
        width: '100%', 
        maxWidth: '900px', 
        background: 'var(--surface)', 
        borderRadius: '40px', 
        overflow: 'hidden', 
        position: 'relative',
        boxShadow: 'var(--shadow-2xl)',
        border: '1px solid var(--border)',
        display: 'flex',
        flexDirection: 'column',
        maxHeight: '90vh'
      }}>
        <div style={{ display: 'grid', gridTemplateColumns: 'minmax(400px, 1.2fr) 1fr', height: '100%' }}>
          
          {/* Left: Media Area */}
          <div style={{ background: 'var(--bg-sub)', position: 'relative' }}>
            {listing.images?.[0] ? (
              <Image 
                src={listing.images[0]} 
                alt={listing.title} 
                fill
                className="object-cover"
              />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-sub)' }}>
                <Plus size={48} opacity={0.3} />
              </div>
            )}
            <button 
              onClick={onClose}
              style={{ position: 'absolute', top: '1.5rem', left: '1.5rem', background: 'rgba(0,0,0,0.5)', backdropFilter: 'blur(10px)', border: 'none', color: 'white', padding: '0.75rem', borderRadius: '16px', cursor: 'pointer', fontWeight: 900 }}
            >
               BACK
            </button>
          </div>

          {/* Right: Info Area */}
          <div style={{ padding: '3rem', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '2rem' }}>
            <div>
              <div style={{ display: 'flex', gap: '0.75rem', marginBottom: '1rem' }}>
                <span style={{ padding: '6px 14px', background: 'rgba(var(--brand-rgb), 0.1)', color: 'var(--brand)', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 950 }}>{listing.category}</span>
                <span style={{ padding: '6px 14px', background: 'var(--bg-sub)', color: 'var(--text-sub)', borderRadius: '100px', fontSize: '0.75rem', fontWeight: 950 }}>{listing.condition}</span>
              </div>
              <h2 style={{ fontSize: '2.5rem', fontWeight: 950, letterSpacing: '-0.04em', color: 'white', lineHeight: 1.1, marginBottom: '1rem' }}>{listing.title}</h2>
              <div style={{ fontSize: '2rem', fontWeight: 950, color: 'var(--brand)' }}>{listing.price === 0 ? 'FREE / SHARE' : `£${listing.price}`}</div>
            </div>

            <div style={{ padding: '1.5rem', background: 'rgba(255,255,255,0.02)', borderRadius: '24px', border: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 950, color: 'var(--text-sub)', textTransform: 'uppercase', marginBottom: '0.75rem', letterSpacing: '2px' }}>Description</div>
              <p style={{ margin: 0, color: 'rgba(255,255,255,0.7)', lineHeight: 1.6, fontSize: '0.95rem' }}>{listing.description}</p>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
               <div style={{ padding: '1.25rem', background: 'var(--bg-sub)', borderRadius: '20px' }}>
                  <div style={{ color: 'var(--brand)', marginBottom: '0.5rem' }}><MapPin size={20} /></div>
                  <div style={{ fontWeight: 900, color: 'white', fontSize: '0.9rem' }}>{listing.meetup_zone}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-sub)', marginTop: '0.25rem' }}>{listing.meetup_details}</div>
               </div>
               <div style={{ padding: '1.25rem', background: 'var(--bg-sub)', borderRadius: '20px' }}>
                  <div style={{ color: 'var(--brand)', marginBottom: '0.5rem' }}><Clock size={20} /></div>
                  <div style={{ fontWeight: 900, color: 'white', fontSize: '0.9rem' }}>{listing.duration_days} Days Max</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--text-sub)', marginTop: '0.25rem' }}>Default Loan Agreement</div>
               </div>
            </div>

            <div style={{ marginTop: 'auto', paddingTop: '2rem', borderTop: '1px solid var(--border)' }}>
              <div style={{ fontSize: '0.75rem', fontWeight: 950, color: 'var(--text-sub)', textTransform: 'uppercase', marginBottom: '1.25rem' }}>Listed By</div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
                <div style={{ width: '56px', height: '56px', borderRadius: '20px', background: 'var(--brand)', overflow: 'hidden' }}>
                  {listing.profiles?.avatar_url && <Image src={listing.profiles.avatar_url} width={56} height={56} alt="Seller" />}
                </div>
                <div>
                   <div style={{ fontWeight: 950, color: 'white', fontSize: '1.1rem' }}>{listing.profiles?.full_name}</div>
                   <div style={{ fontSize: '0.8rem', color: 'var(--brand)', fontWeight: 800 }}>Institutional Specialist / {listing.profiles?.role}</div>
                </div>
              </div>
              <button 
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '2rem', padding: '1.25rem', borderRadius: '20px', fontWeight: 950, fontSize: '1rem' }}
              >
                Request Access via Node
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
