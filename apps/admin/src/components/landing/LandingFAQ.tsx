'use client'

import { ChevronRight } from 'lucide-react'

interface FAQ {
  q: string
  a: string
}

interface LandingFAQProps {
  faqs: FAQ[]
}

export default function LandingFAQ({ faqs }: LandingFAQProps) {
  return (
    <section id="faq" style={{ padding: '10rem 2rem', background: '#0d0d0d', borderTop: '1px solid rgba(255,255,255,0.06)' }}>
       <div style={{ maxWidth: '800px', margin: '0 auto' }}>
          <div style={{ textAlign: 'center', marginBottom: '5rem' }}>
             <h2 style={{ fontSize: '2rem', fontWeight: 700, color: '#f3f4f6', letterSpacing: '-0.02em' }}>Technical FAQ</h2>
             <p style={{ color: '#9ca3af', fontSize: '1rem', marginTop: '1rem' }}>Protocols and mission statements.</p>
          </div>

          <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
             {faqs.map((faq, i) => (
                <div key={i} style={{ padding: '1.5rem 2.5rem', background: '#111111', borderRadius: '12px', border: '1px solid #222222' }}>
                   <h4 style={{ fontSize: '1.125rem', fontWeight: 600, color: '#f3f4f6', marginBottom: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      {faq.q}
                      <ChevronRight size={18} style={{ color: '#10b981' }} />
                   </h4>
                   <p style={{ color: '#6b7280', fontSize: '0.95rem', lineHeight: 1.6 }}>{faq.a}</p>
                </div>
             ))}
          </div>
       </div>
    </section>
  )
}
