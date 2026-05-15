'use client'

import { useState } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Maximize2, X } from 'lucide-react'

const SCREENSHOTS = [
  { src: '/screenshots/Screen_Shot_2026-05-14_at_23.11.51.png', title: 'Task Interface' },
  { src: '/screenshots/Screen_Shot_2026-05-14_at_23.12.07.png', title: 'Project Overview' },
  { src: '/screenshots/Screen_Shot_2026-05-14_at_23.12.38.png', title: 'Contribution Metrics' },
  { src: '/screenshots/Screen_Shot_2026-05-14_at_23.12.46.png', title: 'Team Management' },
  { src: '/screenshots/Screen_Shot_2026-05-14_at_23.19.00.png', title: 'Dashboard View' },
  { src: '/screenshots/Screen_Shot_2026-05-14_at_23.19.15.png', title: 'Collaboration Hub' },
  { src: '/screenshots/Screen_Shot_2026-05-14_at_23.19.22.png', title: 'Resource Center' },
  { src: '/screenshots/Screen_Shot_2026-05-14_at_23.19.30.png', title: 'Analytics Engine' },
  { src: '/screenshots/Screen_Shot_2026-05-14_at_23.19.44.png', title: 'User Profile' },
  { src: '/screenshots/Screen_Shot_2026-05-14_at_23.19.55.png', title: 'Settings Panel' },
  { src: '/screenshots/Screen_Shot_2026-05-14_at_23.20.09.png', title: 'Notification System' },
  { src: '/screenshots/Screen_Shot_2026-05-14_at_23.20.23.png', title: 'Workflows' },
  { src: '/screenshots/Screen_Shot_2026-05-14_at_23.20.51.png', title: 'Deep Insights' },
  { src: '/screenshots/Screen_Shot_2026-05-14_at_23.21.02.png', title: 'Performance Tracking' },
  { src: '/screenshots/Screen_Shot_2026-05-14_at_23.21.20.png', title: 'Live Updates' },
  { src: '/screenshots/Screen_Shot_2026-05-14_at_23.21.28.png', title: 'Group Chat' },
  { src: '/screenshots/Screen_Shot_2026-05-14_at_23.21.37.png', title: 'Asset Marketplace' },
  { src: '/screenshots/Screen_Shot_2026-05-14_at_23.21.46.png', title: 'Admin Console' },
  { src: '/screenshots/Screen_Shot_2026-05-14_at_23.22.01.png', title: 'Global Network' },
  { src: '/screenshots/Screenshot_2026-05-14_at_23-23-54_.png', title: 'Side Hustle' },
  { src: '/screenshots/Screenshot_2026-05-14_at_23-24-10_.png', title: 'Earning Portal' },
  { src: '/screenshots/Screenshot_2026-05-14_at_23-24-30_.png', title: 'Task Marketplace' },
  { src: '/screenshots/Screenshot_2026-05-14_at_23-24-47_.png', title: 'Internal Node' },
  { src: '/screenshots/Screenshot_2026-05-14_at_23-25-13_.png', title: 'System Status' },
  { src: '/screenshots/mobile.png', title: 'Mobile Experience' },
  { src: '/screenshots/dashboard.png', title: 'Main Dashboard' },
  { src: '/screenshots/admin.png', title: 'Admin View' },
  { src: '/screenshots/terminal.png', title: 'Developer Console' },
  { src: '/screenshots/onboarding1.png', title: 'Onboarding Flow' },
  { src: '/screenshots/dash.png', title: 'Dashboard Shortcut' },
]

export default function ScreenshotGallery() {
  const [selectedImage, setSelectedImage] = useState<number | null>(null)
  const [showAll, setShowAll] = useState(false)

  const displayedScreenshots = showAll ? SCREENSHOTS : SCREENSHOTS.slice(0, 12)

  return (
    <div className="w-full">
      {/* Masonry-style grid using CSS columns for maximum flexibility with mixed aspect ratios */}
      <div 
        style={{ 
          columnCount: 'auto',
          columnWidth: '320px',
          columnGap: '1.5rem',
          width: '100%',
          margin: '0 auto'
        }}
      >
        {displayedScreenshots.map((img, i) => (
          <motion.div
            key={img.src}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: (i % 6) * 0.05 }}
            style={{ 
              breakInside: 'avoid',
              marginBottom: '1.5rem',
              borderRadius: '20px',
              overflow: 'hidden',
              background: 'white',
              border: '1px solid rgba(15,23,42,0.08)',
              boxShadow: '0 4px 20px rgba(15,23,42,0.04)',
              cursor: 'pointer',
              position: 'relative'
            }}
            onClick={() => setSelectedImage(i)}
            whileHover={{ y: -4, boxShadow: '0 12px 30px rgba(15,23,42,0.1)' }}
          >
            <div style={{ position: 'relative' }}>
              <img 
                src={img.src} 
                alt={img.title} 
                style={{ 
                  width: '100%', 
                  height: 'auto', 
                  display: 'block',
                  transition: 'transform 0.5s ease'
                }} 
              />
              <div style={{ 
                position: 'absolute', 
                inset: 0, 
                background: 'linear-gradient(to top, rgba(15,23,42,0.4) 0%, transparent 40%)',
                opacity: 0,
                transition: 'opacity 0.3s ease',
                display: 'flex',
                alignItems: 'flex-end',
                padding: '1.25rem'
              }}
              className="hover-overlay"
              >
                <div style={{ color: 'white' }}>
                  <p style={{ fontWeight: 800, fontSize: '0.9rem', margin: 0 }}>{img.title}</p>
                </div>
              </div>
            </div>
            
            <style jsx>{`
              div:hover .hover-overlay {
                opacity: 1;
              }
            `}</style>
          </motion.div>
        ))}
      </div>

      {!showAll && SCREENSHOTS.length > 12 && (
        <div style={{ textAlign: 'center', marginTop: '3rem' }}>
          <button
            onClick={() => setShowAll(true)}
            style={{
              padding: '1rem 2.5rem',
              borderRadius: '12px',
              background: 'white',
              border: '1px solid rgba(15,23,42,0.12)',
              color: '#0f172a',
              fontWeight: 700,
              fontSize: '0.95rem',
              cursor: 'pointer',
              boxShadow: '0 4px 12px rgba(15,23,42,0.05)',
              transition: 'all 0.2s ease'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.transform = 'translateY(-2px)'
              e.currentTarget.style.boxShadow = '0 8px 20px rgba(15,23,42,0.08)'
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.transform = 'translateY(0)'
              e.currentTarget.style.boxShadow = '0 4px 12px rgba(15,23,42,0.05)'
            }}
          >
            View All {SCREENSHOTS.length} Screenshots
          </button>
        </div>
      )}

      {/* Lightbox */}
      <AnimatePresence>
        {selectedImage !== null && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            style={{
              position: 'fixed',
              inset: 0,
              zIndex: 2000,
              background: 'rgba(15,23,42,0.95)',
              backdropFilter: 'blur(8px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem'
            }}
            onClick={() => setSelectedImage(null)}
          >
            <button
              style={{
                position: 'absolute',
                top: '2rem',
                right: '2rem',
                background: 'white',
                border: 'none',
                borderRadius: '50%',
                width: '44px',
                height: '44px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                boxShadow: '0 4px 12px rgba(0,0,0,0.2)'
              }}
              onClick={() => setSelectedImage(null)}
            >
              <X size={24} color="#0f172a" />
            </button>

            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              style={{ maxWidth: '100%', maxHeight: '100%', position: 'relative' }}
              onClick={(e) => e.stopPropagation()}
            >
              <img
                src={SCREENSHOTS[selectedImage].src}
                alt={SCREENSHOTS[selectedImage].title}
                style={{
                  maxWidth: '100%',
                  maxHeight: '90vh',
                  borderRadius: '12px',
                  boxShadow: '0 20px 60px rgba(0,0,0,0.5)',
                  display: 'block'
                }}
              />
              <div style={{ marginTop: '1.5rem', textAlign: 'center', color: 'white' }}>
                <h3 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>{SCREENSHOTS[selectedImage].title}</h3>
                <p style={{ opacity: 0.7, fontSize: '0.9rem', marginTop: '0.5rem' }}>{selectedImage + 1} of {SCREENSHOTS.length}</p>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
