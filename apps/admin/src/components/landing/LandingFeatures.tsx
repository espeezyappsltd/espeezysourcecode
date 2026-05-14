'use client'

import React from 'react'

interface Feature {
  icon: React.ReactNode
  title: string
  desc: string
}

interface LandingFeaturesProps {
  features: Feature[]
}

export default function LandingFeatures({ features }: LandingFeaturesProps) {
  return (
    <section id="features" style={{ padding: '10rem 2rem' }}>
       <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '6rem' }}>
             <div style={{ color: '#10b981', fontWeight: 700, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.1em', marginBottom: '1.5rem' }}>Architectural Capabilities</div>
             <h2 style={{ fontSize: '2.5rem', fontWeight: 700, color: '#f3f4f6', letterSpacing: '-0.03em' }}>Built for technical scholarship.</h2>
          </div>
          
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '1.5rem' }}>
             {features.map((feature, i) => (
                <div key={i} style={{ padding: '2.5rem', background: '#111111', border: '1px solid #222222', borderRadius: '12px', transition: 'border-color 0.2s ease' }} className="nav-link-pro">
                   <div style={{ color: '#10b981', marginBottom: '1.5rem' }}>{feature.icon}</div>
                   <h3 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#f3f4f6', marginBottom: '1rem' }}>{feature.title}</h3>
                   <p style={{ color: '#9ca3af', fontSize: '0.875rem', lineHeight: 1.6 }}>{feature.desc}</p>
                </div>
             ))}
          </div>
       </div>
    </section>
  )
}
