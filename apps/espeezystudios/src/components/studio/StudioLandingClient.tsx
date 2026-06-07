'use client'

import React from 'react'
import Link from 'next/link'
import { motion } from 'framer-motion'
import { Palette, LayoutDashboard, ShoppingBag, Send, ArrowRight } from 'lucide-react'
import { useSessionUser } from '@shared/useSessionUser'
import { supabase } from '@/lib/supabase-client'
import './studio-landing.css'

const motionEase = [0.22, 1, 0.36, 1] as const

const FEATURES = [
  {
    title: 'Studio Dashboard & Analytics',
    desc: 'Monitor your operations, track jobs, and get real-time analytics on your studio performance.',
    icon: LayoutDashboard,
  },
  {
    title: 'Client Delivery',
    desc: 'Professional handoffs, secure document sharing, and streamlined client communications.',
    icon: Send,
  },
  {
    title: 'Marketplace Integration',
    desc: 'Discover and sell assets, templates, and resources directly within your studio environment.',
    icon: ShoppingBag,
  },
]

export default function StudioLandingClient() {
  const { user, loading } = useSessionUser(supabase)
  const signedIn = !loading && !!user

  return (
    <div className="studio-landing-container">
      <div className="studio-landing-bg" />
      <div className="studio-landing-glow" />

      <nav className="studio-landing-nav">
        <Link href="/" className="studio-landing-nav__brand">
          <div className="studio-landing-nav__logo">
            <Palette size={18} color="white" />
          </div>
          Espeezy Studio
        </Link>
        <div className="studio-landing-nav__links">
          <a href="https://espeezy.com" className="studio-landing-nav__link">
            Main Platform
          </a>
          {signedIn ? (
            <Link href="/dashboard" className="studio-landing-nav__btn">
              Go to Dashboard
            </Link>
          ) : (
            <Link href="/login" className="studio-landing-nav__btn">
              Log in
            </Link>
          )}
        </div>
      </nav>

      <main>
        <section className="studio-landing-hero">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.75, ease: motionEase }}
          >
            <div className="studio-landing-hero__eyebrow">
              <span className="studio-landing-hero__eyebrow-dot" />
              Premium Workspace
            </div>
            
            <h1 className="studio-landing-hero__title">
              Run your creative <span>operations</span>
            </h1>
            
            <p className="studio-landing-hero__lead">
              Espeezy Studio gives you the tools to manage client projects, track jobs, monitor analytics, and access the marketplace.
            </p>
            
            <div className="studio-landing-hero__actions">
              {signedIn ? (
                <Link href="/dashboard" className="studio-btn-primary">
                  Open Dashboard <ArrowRight size={18} />
                </Link>
              ) : (
                <>
                  <Link href="/login" className="studio-btn-primary">
                    Log in to Studio <ArrowRight size={18} />
                  </Link>
                  <a href="https://espeezy.com/checkout" className="studio-btn-secondary">
                    View Pricing
                  </a>
                </>
              )}
            </div>
          </motion.div>
        </section>

        <section className="studio-features">
          <motion.div 
            className="studio-features__grid"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: motionEase }}
          >
            {FEATURES.map((feat, i) => {
              const Icon = feat.icon
              return (
                <div key={i} className="studio-feature-card">
                  <div className="studio-feature-card__icon">
                    <Icon size={24} />
                  </div>
                  <h3 className="studio-feature-card__title">{feat.title}</h3>
                  <p className="studio-feature-card__desc">{feat.desc}</p>
                </div>
              )
            })}
          </motion.div>
        </section>
      </main>
    </div>
  )
}
