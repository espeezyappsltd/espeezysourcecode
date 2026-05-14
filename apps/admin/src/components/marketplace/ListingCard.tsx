'use client'

import React from 'react'
import Image from 'next/image'
import { Plus, MapPin } from 'lucide-react'
import { Listing } from '@/types/marketplace'

interface ListingCardProps {
  item: Listing
  onClick: (item: Listing) => void
}

export function ListingCard({ item, onClick }: ListingCardProps) {
  return (
    <div 
      className="listing-card"
      onClick={() => onClick(item)}
      style={{ 
        borderRadius: '28px', 
        overflow: 'hidden', 
        border: '1px solid var(--border)',
        background: 'var(--surface)',
        display: 'flex',
        flexDirection: 'column',
        transition: 'all 0.4s cubic-bezier(0.175, 0.885, 0.32, 1.275)',
        cursor: 'pointer',
        position: 'relative'
      }}
    >
      <div style={{ height: '220px', background: 'var(--bg-sub)', position: 'relative', overflow: 'hidden' }}>
        {item.images?.[0] ? (
          <Image 
            src={item.images[0]} 
            alt={item.title} 
            fill
            className="object-cover transition-transform hover:scale-110 duration-500"
            loading="lazy"
          />
        ) : (
          <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-sub)', background: 'var(--bg-main)' }}>
            <Plus size={32} opacity={0.3} />
          </div>
        )}
        
        {/* Floating Badges */}
        <div style={{ position: 'absolute', top: '12px', left: '12px', display: 'flex', gap: '6px' }}>
          <div style={{ padding: '4px 10px', background: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(8px)', borderRadius: '8px', color: 'white', fontWeight: 950, fontSize: '0.65rem', textTransform: 'uppercase' }}>
            {item.category || 'Item'}
          </div>
        </div>

        <div style={{ 
          position: 'absolute', 
          bottom: '12px', 
          right: '12px', 
          padding: '6px 14px', 
          background: 'var(--brand)', 
          borderRadius: '12px',
          color: 'black',
          fontWeight: 950,
          fontSize: '1rem',
          boxShadow: '0 8px 20px rgba(var(--brand-rgb), 0.4)'
        }}>
          {item.price === 0 ? 'FREE' : `£${item.price}`}
        </div>
      </div>
      
      <div style={{ padding: '1.5rem' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '0.75rem' }}>
           <h3 style={{ margin: 0, fontSize: '1.1rem', fontWeight: 950, color: 'var(--text-main)', letterSpacing: '-0.02em', flex: 1 }}>{item.title}</h3>
           <div style={{ fontSize: '0.7rem', fontWeight: 900, color: 'var(--brand)', border: '1px solid rgba(var(--brand-rgb), 0.2)', padding: '2px 8px', borderRadius: '6px' }}>{item.condition || 'Used'}</div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-sub)', marginBottom: '1.25rem' }}>
          <MapPin size={14} />
          <span style={{ fontSize: '0.75rem', fontWeight: 700 }}>{item.meetup_zone}</span>
        </div>
        
        {/* Seller Information */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', marginTop: 'auto', paddingTop: '1rem', borderTop: '1px solid var(--border)' }}>
          <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--brand)', overflow: 'hidden', border: '2px solid var(--bg-main)' }}>
            {item.profiles?.avatar_url ? (
              <Image src={item.profiles.avatar_url} width={32} height={32} alt="Seller" />
            ) : (
              <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'white', fontWeight: 900, fontSize: '0.6rem' }}>{item.profiles?.full_name?.charAt(0) || '?'}</div>
            )}
          </div>
          <div style={{ flex: 1, overflow: 'hidden' }}>
            <div style={{ fontSize: '0.8rem', fontWeight: 900, color: 'var(--text-main)', whiteSpace: 'nowrap', textOverflow: 'ellipsis' }}>{item.profiles?.full_name || 'Anonymous Specialist'}</div>
            <div style={{ fontSize: '0.65rem', fontWeight: 800, color: 'var(--brand)', textTransform: 'uppercase' }}>{item.profiles?.role || 'Contributor'}</div>
          </div>
          <div style={{ fontSize: '0.7rem', fontWeight: 800, color: 'var(--text-sub)' }}>{item.quantity || 1}x</div>
        </div>
      </div>
      <style jsx>{`
        .listing-card:hover {
          transform: translateY(-12px) scale(1.02);
          border-color: var(--brand) !important;
          box-shadow: 0 30px 60px rgba(0,0,0,0.5);
        }
        .listing-card:hover :global(img) {
          transform: scale(1.1);
        }
      `}</style>
    </div>
  )
}
