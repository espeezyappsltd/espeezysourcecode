'use client'

import { useState, useEffect, useRef } from 'react'
import { Globe, Check, ChevronDown } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { locales, detectBrowserLocale, isValidLocale, type LocaleCode } from '@/i18n/config'

// Only show locales that have compiled message files
const SUPPORTED_LOCALE_CODES = new Set([
  'en','es','zh','ar','hi','fr','pt','de','ja','ko',
  'it','tr','vi','pl','nl','id','th','sv','no','da',
])
const SUPPORTED_LOCALES = locales.filter((l) => SUPPORTED_LOCALE_CODES.has(l.code))

function readCookieLocale(): LocaleCode | null {
  if (typeof document === 'undefined') return null
  const match = document.cookie.match(/(?:^|;\s*)NEXT_LOCALE=([^;]+)/)
  const val = match ? decodeURIComponent(match[1]) : undefined
  return val && isValidLocale(val) ? val : null
}

export default function LanguageSelector() {
  const [open, setOpen] = useState(false)
  const [current, setCurrent] = useState<LocaleCode>(() => readCookieLocale() || detectBrowserLocale())
  const containerRef = useRef<HTMLDivElement>(null)

  // Close on outside click
  useEffect(() => {
    if (!open) return
    const handler = (e: MouseEvent) => {
      if (containerRef.current && !containerRef.current.contains(e.target as Node)) {
        setOpen(false)
      }
    }
    document.addEventListener('mousedown', handler)
    return () => document.removeEventListener('mousedown', handler)
  }, [open])

  const setLocale = (code: LocaleCode) => {
    // eslint-disable-next-line react-hooks/immutability
    document.cookie = `NEXT_LOCALE=${encodeURIComponent(code)}; path=/; max-age=31536000; SameSite=Lax`
    setOpen(false)
    window.location.reload()
  }

  const currentInfo = SUPPORTED_LOCALES.find((l) => l.code === current) ?? SUPPORTED_LOCALES[0]

  return (
    <div ref={containerRef} style={{ position: 'relative' }}>
      <button
        aria-label={`Current language: ${currentInfo.name}, click to change`}
        aria-expanded={open}
        aria-haspopup="listbox"
        onClick={() => setOpen((o) => !o)}
        style={{
          background: 'rgba(255,255,255,0.03)',
          border: '1px solid #222222',
          borderRadius: '6px',
          padding: '0.4rem 0.6rem',
          color: '#9ca3af',
          display: 'flex',
          alignItems: 'center',
          gap: '0.4rem',
          cursor: 'pointer',
          fontSize: '0.75rem',
          fontWeight: 600,
          transition: 'all 0.2s ease',
          whiteSpace: 'nowrap',
        }}
        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#10b981'; e.currentTarget.style.color = '#f3f4f6' }}
        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#222222'; e.currentTarget.style.color = '#9ca3af' }}
      >
        <Globe size={14} aria-hidden="true" />
        <span aria-hidden="true">{currentInfo.flag}</span>
        <ChevronDown
          size={10}
          aria-hidden="true"
          style={{ transform: open ? 'rotate(180deg)' : 'rotate(0deg)', transition: 'transform 0.2s ease' }}
        />
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            role="listbox"
            aria-label="Select language"
            initial={{ opacity: 0, y: -8, scale: 0.97 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -8, scale: 0.97 }}
            transition={{ duration: 0.15, ease: [0.16, 1, 0.3, 1] }}
            style={{
              position: 'absolute',
              right: 0,
              top: 'calc(100% + 0.5rem)',
              background: '#111111',
              border: '1px solid #222222',
              borderRadius: '10px',
              boxShadow: '0 20px 50px rgba(0,0,0,0.6)',
              width: '220px',
              maxHeight: '320px',
              overflowY: 'auto',
              zIndex: 2000,
              padding: '0.4rem',
            }}
          >
            {SUPPORTED_LOCALES.map((locale) => (
              <button
                key={locale.code}
                role="option"
                aria-selected={current === locale.code}
                onClick={() => setLocale(locale.code)}
                style={{
                  width: '100%',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.65rem',
                  padding: '0.55rem 0.7rem',
                  background: current === locale.code ? 'rgba(16,185,129,0.1)' : 'transparent',
                  border: 'none',
                  borderRadius: '6px',
                  cursor: 'pointer',
                  textAlign: 'left',
                  transition: 'background 0.15s ease',
                }}
                onMouseEnter={(e) => {
                  if (current !== locale.code) (e.currentTarget as HTMLElement).style.background = 'rgba(255,255,255,0.04)'
                }}
                onMouseLeave={(e) => {
                  if (current !== locale.code) (e.currentTarget as HTMLElement).style.background = 'transparent'
                }}
              >
                <span style={{ fontSize: '1rem', lineHeight: 1 }}>{locale.flag}</span>
                <div style={{ flex: 1, overflow: 'hidden' }}>
                  <div style={{ color: '#f3f4f6', fontSize: '0.8rem', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {locale.nativeName}
                  </div>
                  <div style={{ color: '#6b7280', fontSize: '0.7rem' }}>{locale.name}</div>
                </div>
                {current === locale.code && <Check size={12} color="#10b981" aria-hidden="true" />}
              </button>
            ))}
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
