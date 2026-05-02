'use client'

import { useState, useEffect, useMemo } from 'react'
import { auth } from '@/lib/firebase'
import { onAuthStateChanged, User } from 'firebase/auth'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import Image from 'next/image'
import { ChevronDown, Search, Code, Menu, X, MessageSquarePlus } from 'lucide-react'
import { NavMenus, NavCategory, NavItem } from '@/types/landing'
import LanguageSelector from '@/components/LanguageSelector'

interface LandingHeaderProps {
  navMenus: NavMenus
}

export default function LandingHeader({ navMenus }: LandingHeaderProps) {
  const [activeDropdown, setActiveDropdown] = useState<string | null>(null)
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false)
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (u) => {
      setUser(u)
    })
    return () => unsubscribe()
  }, [])

  // Smooth-scroll to a hash anchor; falls back to normal navigation for full paths
  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    setActiveDropdown(null)
    setIsMobileMenuOpen(false)
    if (href.startsWith('/#')) {
      e.preventDefault()
      const id = href.slice(2) // strip '/#'
      const el = document.getElementById(id)
      if (el) el.scrollIntoView({ behavior: 'smooth' })
    }
  }

  return (
    <header
      style={{
        height: '64px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        padding: '0 2rem',
        position: 'sticky',
        top: 0,
        zIndex: 1000,
        borderBottom: '1px solid rgba(255,255,255,0.06)',
        backdropFilter: 'blur(12px)',
        backgroundColor: 'rgba(10, 10, 10, 0.8)',
        transition: 'all 0.4s cubic-bezier(0.16, 1, 0.3, 1)'
      }}
      onMouseLeave={() => setActiveDropdown(null)}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: '2.5rem' }}>
        {/* Brand Identity */}
        <div
          style={{ display: 'flex', alignItems: 'center', gap: '0.8rem', cursor: 'pointer', transition: 'opacity 0.2s ease' }}
          onClick={() => typeof window !== 'undefined' && window.scrollTo({ top: 0, behavior: 'smooth' })}
        >
          <div style={{ width: '28px', height: '28px', background: '#10b981', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center', boxShadow: '0 0 15px rgba(16, 185, 129, 0.2)' }}>
            <img src="/brand_logo2.svg" style={{ width: '22px', height: '22px', objectFit: 'contain' }} alt="Logo" />
          </div>
          <span style={{ fontSize: '1rem', fontWeight: 650, letterSpacing: '-0.02em', color: '#f3f4f6' }}>Espeezy</span>
        </div>

        {/* Architectural Navigation - Desktop Only */}
        <nav
          style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}
          className="hide-mobile-flex"
        >
          {Object.keys(navMenus).map((key) => (
            <div
              key={key}
              className="nav-item-wrapper"
              style={{ position: 'relative' }}
              onMouseEnter={() => setActiveDropdown(key)}
            >
              <button
                aria-expanded={activeDropdown === key}
                aria-haspopup="true"
                style={{
                  background: 'none',
                  border: 'none',
                  padding: '0.5rem 0.75rem',
                  color: activeDropdown === key ? '#f3f4f6' : '#9ca3af',
                  fontWeight: 500,
                  fontSize: '0.875rem',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.25rem',
                  transition: 'color 0.2s ease'
                }}
              >
                {navMenus[key].label}
                <ChevronDown size={12} style={{ opacity: 0.5, transform: activeDropdown === key ? 'rotate(180deg)' : 'rotate(0)', transition: 'transform 0.2s ease' }} aria-hidden="true" />
              </button>

              <AnimatePresence>
                {activeDropdown === key && (
                  <motion.div
                    initial={{ opacity: 0, y: 5, scale: 0.99 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    exit={{ opacity: 0, y: 5, scale: 0.99 }}
                    transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
                    style={{
                      position: 'absolute',
                      top: '100%',
                      left: '-2rem',
                      paddingTop: '0.75rem',
                      zIndex: 1100
                    }}
                  >
                    <div
                      style={{
                        width: '560px',
                        background: '#111111',
                        borderRadius: '12px',
                        border: '1px solid #222222',
                        padding: '1.5rem',
                        boxShadow: '0 20px 50px rgba(0,0,0,0.5)',
                        display: 'grid',
                        gridTemplateColumns: 'repeat(2, 1fr)',
                        gap: '1.5rem'
                      }}
                    >
                      {navMenus[key].categories.map((category: NavCategory, idx: number) => (
                        <div key={idx} style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                          <div style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b7280', marginBottom: '0.25rem' }}>
                            {category.label}
                          </div>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '0.25rem' }}>
                            {category.items.map((item: NavItem) => (
                              <Link
                                key={item.id}
                                href={item.href}
                                className="nav-link-pro"
                                style={{
                                  padding: '0.75rem',
                                  borderRadius: '8px',
                                  display: 'flex',
                                  alignItems: 'flex-start',
                                  gap: '0.75rem',
                                  textDecoration: 'none',
                                  transition: 'background 0.2s ease'
                                }}
                                onClick={(e) => handleNavClick(e, item.href)}
                              >
                                <div style={{ color: '#10b981', marginTop: '0.1rem' }}>{item.icon}</div>
                                <div style={{ flex: 1 }}>
                                  <div style={{ color: '#f3f4f6', fontWeight: 600, fontSize: '0.875rem', marginBottom: '0.1rem' }}>{item.title}</div>
                                  <div style={{ color: '#9ca3af', fontSize: '0.75rem', lineHeight: 1.5 }}>{item.desc}</div>
                                </div>
                              </Link>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          ))}
          <Link
            href="/#pricing"
            style={{ padding: '0.5rem 0.75rem', color: '#9ca3af', fontWeight: 500, fontSize: '0.875rem', textDecoration: 'none', transition: 'color 0.2s ease' }}
            onMouseEnter={(e) => (e.currentTarget.style.color = '#f3f4f6')}
            onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
            onClick={(e) => handleNavClick(e, '/#pricing')}
          >
            Pricing
          </Link>
          <Link href="/docs" style={{ padding: '0.5rem 0.75rem', color: '#9ca3af', fontWeight: 500, fontSize: '0.875rem', textDecoration: 'none', transition: 'color 0.2s ease' }} onMouseEnter={(e) => (e.currentTarget.style.color = '#f3f4f6')} onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}>Help & Docs</Link>
        </nav>
      </div>

      {/* Global Utilities & Authentication - Desktop Only */}
      <div
        style={{ display: 'flex', alignItems: 'center', gap: '1rem' }}
        className="hide-mobile-flex"
      >
        <Link
          href="/contact"
          title="Send Feedback"
          style={{
            background: 'rgba(16, 185, 129, 0.05)',
            border: '1px solid rgba(16, 185, 129, 0.1)',
            borderRadius: '6px',
            padding: '0.4rem 0.6rem',
            color: '#10b981',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            textDecoration: 'none',
            fontSize: '0.75rem',
            fontWeight: 600
          }}
          onMouseEnter={(e) => (e.currentTarget.style.background = 'rgba(16, 185, 129, 0.1)')}
          onMouseLeave={(e) => (e.currentTarget.style.background = 'rgba(16, 185, 129, 0.05)')}
        >
          <MessageSquarePlus size={14} /> Feedback
        </Link>

        <LanguageSelector />

        <Link
          href="/docs"
          className="nav-util-btn"
          style={{
            background: 'rgba(255,255,255,0.03)',
            border: '1px solid #222222',
            borderRadius: '6px',
            padding: '0.4rem 0.75rem',
            color: '#6b7280',
            fontSize: '0.75rem',
            display: 'flex',
            alignItems: 'center',
            gap: '3rem',
            cursor: 'pointer',
            transition: 'all 0.2s ease',
            textDecoration: 'none'
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Search size={14} /> Search...
          </div>
          <div style={{ padding: '2px 4px', background: '#222222', borderRadius: '4px', fontSize: '0.65rem' }}>⌘K</div>
        </Link>

        <Link
          href="/#developers"
          style={{ color: '#9ca3af', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.8125rem' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#f3f4f6')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
        >
          <Code size={16} /> 1.2k
        </Link>

        <div style={{ height: '20px', width: '1px', background: '#222222' }} />

        {user ? (
          <Link
            href="/dashboard"
            style={{
              background: '#10b981',
              color: '#0a0a0a',
              textDecoration: 'none',
              fontSize: '0.875rem',
              fontWeight: 650,
              padding: '0.5rem 1rem',
              borderRadius: '6px',
              boxShadow: '0 0 20px rgba(16, 185, 129, 0.1)',
              transition: 'all 0.2s ease'
            }}
          >
            Dashboard
          </Link>
        ) : (
          <>
            <Link href="/login" style={{ color: '#f3f4f6', textDecoration: 'none', fontSize: '0.875rem', fontWeight: 500, padding: '0.5rem 0.75rem' }}>Sign in</Link>
            <Link
              href="/login?signup=true"
              style={{
                background: '#10b981',
                color: '#0a0a0a',
                textDecoration: 'none',
                fontSize: '0.875rem',
                fontWeight: 650,
                padding: '0.5rem 1rem',
                borderRadius: '6px',
                boxShadow: '0 0 20px rgba(16, 185, 129, 0.1)',
                transition: 'all 0.2s ease'
              }}
              onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
              onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
            >
              Get Started
            </Link>
          </>
        )}
      </div>

      {/* Mobile Menu Toggle */}
      <button
        className="mobile-only-flex"
        style={{ background: 'none', border: 'none', color: '#f3f4f6', cursor: 'pointer', padding: '0.5rem' }}
        onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
      >
        {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
      </button>

      {/* Mobile Menu Overlay */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <motion.div
            initial={{ opacity: 0, x: '100%' }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: '100%' }}
            transition={{ type: 'spring', damping: 25, stiffness: 200 }}
            style={{
              position: 'fixed',
              inset: 0,
              top: '64px',
              background: '#0a0a0a',
              zIndex: 2000,
              padding: '2rem',
              overflowY: 'auto'
            }}
          >
            <div style={{ display: 'flex', flexDirection: 'column', gap: '2.5rem' }}>
              {Object.keys(navMenus).map((key) => (
                <div key={key}>
                  <div style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.1em', color: '#6b7280', marginBottom: '1rem' }}>
                    {navMenus[key].label}
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    {navMenus[key].categories.flatMap((cat: NavCategory) => cat.items).map((item: NavItem) => (
                      <Link
                        key={item.id}
                        href={item.href}
                        style={{ textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '1rem' }}
                        onClick={(e) => handleNavClick(e, item.href)}
                      >
                        <div style={{ color: '#10b981' }}>{item.icon}</div>
                        <div style={{ color: '#f3f4f6', fontWeight: 600 }}>{item.title}</div>
                      </Link>
                    ))}
                  </div>
                </div>
              ))}
              <div style={{ paddingTop: '1rem', borderTop: '1px solid #222', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
                <Link href="/docs" style={{ color: '#f3f4f6', textDecoration: 'none', fontWeight: 600 }} onClick={() => setIsMobileMenuOpen(false)}>Help Center</Link>
                <LanguageSelector />
                {user ? (
                  <Link href="/dashboard" style={{ background: '#10b981', color: '#0a0a0a', padding: '1rem', borderRadius: '8px', textAlign: 'center', fontWeight: 700, textDecoration: 'none' }} onClick={() => setIsMobileMenuOpen(false)}>Dashboard</Link>
                ) : (
                  <>
                    <Link href="/login" style={{ color: '#f3f4f6', textDecoration: 'none', fontWeight: 600 }} onClick={() => setIsMobileMenuOpen(false)}>Sign in</Link>
                    <Link href="/login?signup=true" style={{ background: '#10b981', color: '#0a0a0a', padding: '1rem', borderRadius: '8px', textAlign: 'center', fontWeight: 700, textDecoration: 'none' }} onClick={() => setIsMobileMenuOpen(false)}>Start Project</Link>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  )
}
