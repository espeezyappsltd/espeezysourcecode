'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Maximize2, X, ChevronLeft, ChevronRight } from 'lucide-react'

const SCREENSHOTS = [
  { src: '/screenshots/Screen_Shot_2026-05-14_at_23.11.51.png', title: 'Task Interface', category: 'Productivity' },
  { src: '/screenshots/Screen_Shot_2026-05-14_at_23.12.07.png', title: 'Project Overview', category: 'Management' },
  { src: '/screenshots/Screen_Shot_2026-05-14_at_23.12.38.png', title: 'Contribution Metrics', category: 'Analytics' },
  { src: '/screenshots/Screen_Shot_2026-05-14_at_23.12.46.png', title: 'Team Management', category: 'Collaboration' },
  { src: '/screenshots/Screen_Shot_2026-05-14_at_23.19.00.png', title: 'Dashboard View', category: 'Overview' },
  { src: '/screenshots/Screen_Shot_2026-05-14_at_23.19.15.png', title: 'Collaboration Hub', category: 'Communication' },
  { src: '/screenshots/Screen_Shot_2026-05-14_at_23.19.22.png', title: 'Resource Center', category: 'Resources' },
  { src: '/screenshots/Screen_Shot_2026-05-14_at_23.19.30.png', title: 'Analytics Engine', category: 'Data' },
  { src: '/screenshots/Screen_Shot_2026-05-14_at_23.19.44.png', title: 'User Profile', category: 'Personal' },
  { src: '/screenshots/Screen_Shot_2026-05-14_at_23.19.55.png', title: 'Settings Panel', category: 'Configuration' },
  { src: '/screenshots/Screen_Shot_2026-05-14_at_23.20.09.png', title: 'Notification System', category: 'Alerts' },
  { src: '/screenshots/Screen_Shot_2026-05-14_at_23.20.23.png', title: 'Workflows', category: 'Automation' },
  { src: '/screenshots/Screen_Shot_2026-05-14_at_23.20.51.png', title: 'Deep Insights', category: 'Insights' },
  { src: '/screenshots/Screen_Shot_2026-05-14_at_23.21.02.png', title: 'Performance Tracking', category: 'Performance' },
  { src: '/screenshots/Screen_Shot_2026-05-14_at_23.21.20.png', title: 'Live Updates', category: 'Real-time' },
  { src: '/screenshots/Screen_Shot_2026-05-14_at_23.21.28.png', title: 'Group Chat', category: 'Social' },
  { src: '/screenshots/Screen_Shot_2026-05-14_at_23.21.37.png', title: 'Asset Marketplace', category: 'Economy' },
  { src: '/screenshots/Screen_Shot_2026-05-14_at_23.21.46.png', title: 'Admin Console', category: 'Control' },
  { src: '/screenshots/Screen_Shot_2026-05-14_at_23.22.01.png', title: 'Global Network', category: 'Community' },
  { src: '/screenshots/Screenshot_2026-05-14_at_23-23-54_.png', title: 'Side Hustle', category: 'Income' },
  { src: '/screenshots/Screenshot_2026-05-14_at_23-24-10_.png', title: 'Earning Portal', category: 'Finance' },
  { src: '/screenshots/Screenshot_2026-05-14_at_23-24-30_.png', title: 'Task Marketplace', category: 'Work' },
  { src: '/screenshots/Screenshot_2026-05-14_at_23-24-47_.png', title: 'Internal Node', category: 'Network' },
  { src: '/screenshots/Screenshot_2026-05-14_at_23-25-13_.png', title: 'System Status', category: 'Infrastructure' },
  { src: '/screenshots/mobile.png', title: 'Mobile Experience', category: 'Mobile' },
  { src: '/screenshots/dashboard.png', title: 'Main Dashboard', category: 'Dashboard' },
]

export default function ScreenshotGallery() {
  const [selectedImage, setSelectedImage] = useState<number | null>(null)
  const [filter, setFilter] = useState('All')

  // Extract unique categories
  const categories = ['All', ...Array.from(new Set(SCREENSHOTS.map(s => s.category)))]
  
  const filteredScreenshots = filter === 'All' 
    ? SCREENSHOTS 
    : SCREENSHOTS.filter(s => s.category === filter)

  // Carousel logic for infinite loop background animation
  const [offset, setOffset] = useState(0)
  
  useEffect(() => {
    const timer = setInterval(() => {
      setOffset(prev => (prev + 0.5) % (SCREENSHOTS.length * 300))
    }, 30)
    return () => clearInterval(timer)
  }, [])

  return (
    <div className="w-full" style={{ position: 'relative', paddingBottom: '4rem' }}>
      
      {/* Category Filter */}
      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', justifyContent: 'center', marginBottom: '3rem' }}>
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setFilter(cat)}
            style={{
              padding: '0.5rem 1.25rem',
              borderRadius: '100px',
              border: '1px solid rgba(15,23,42,0.08)',
              background: filter === cat ? 'var(--brand)' : 'white',
              color: filter === cat ? 'white' : '#64748b',
              fontSize: '0.8rem',
              fontWeight: 800,
              cursor: 'pointer',
              transition: '0.2s cubic-bezier(0.4, 0, 0.2, 1)',
              boxShadow: filter === cat ? '0 8px 20px rgba(16,185,129,0.2)' : 'none'
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Main Grid */}
      <div style={{ 
        display: 'grid', 
        gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', 
        gap: '2rem',
        perspective: '1000px'
      }}>
        <AnimatePresence mode="popLayout">
          {filteredScreenshots.map((img, i) => (
            <motion.div
              key={img.src}
              layout
              initial={{ opacity: 0, scale: 0.9, rotateX: -10 }}
              animate={{ opacity: 1, scale: 1, rotateX: 0 }}
              exit={{ opacity: 0, scale: 0.9, rotateX: 10 }}
              transition={{ 
                duration: 0.5, 
                delay: (i % 6) * 0.05,
                type: 'spring',
                stiffness: 100,
                damping: 20
              }}
              style={{ 
                borderRadius: '24px',
                overflow: 'hidden',
                background: 'white',
                border: '1px solid rgba(15,23,42,0.06)',
                boxShadow: '0 4px 30px rgba(15,23,42,0.03)',
                cursor: 'pointer',
                position: 'relative',
                transformStyle: 'preserve-3d'
              }}
              onClick={() => setSelectedImage(SCREENSHOTS.findIndex(s => s.src === img.src))}
            >
              <div style={{ position: 'relative', paddingBottom: '62.5%', overflow: 'hidden' }}>
                <motion.img 
                  src={img.src} 
                  alt={img.title} 
                  style={{ 
                    position: 'absolute',
                    width: '100%', 
                    height: '100%', 
                    objectFit: 'cover',
                    display: 'block',
                  }} 
                  whileHover={{ scale: 1.05 }}
                  transition={{ duration: 0.6 }}
                />
                
                {/* Subtle Floating Animation Overlay */}
                <motion.div 
                  animate={{ 
                    y: [0, -4, 0],
                    opacity: [0.3, 0.6, 0.3]
                  }}
                  transition={{ 
                    duration: 4, 
                    repeat: Infinity, 
                    ease: "easeInOut",
                    delay: i * 0.2
                  }}
                  style={{
                    position: 'absolute',
                    inset: 0,
                    background: 'linear-gradient(45deg, transparent, rgba(255,255,255,0.1), transparent)',
                    pointerEvents: 'none'
                  }}
                />

                <div style={{ 
                  position: 'absolute', 
                  inset: 0, 
                  background: 'linear-gradient(to top, rgba(15,23,42,0.8) 0%, transparent 60%)',
                  opacity: 0,
                  transition: 'opacity 0.4s ease',
                  display: 'flex',
                  flexDirection: 'column',
                  justifyContent: 'flex-end',
                  padding: '1.5rem'
                }}
                className="hover-overlay"
                >
                  <div style={{ color: 'white' }}>
                    <span style={{ 
                      fontSize: '0.65rem', 
                      fontWeight: 900, 
                      textTransform: 'uppercase', 
                      letterSpacing: '0.1em',
                      color: 'var(--brand)',
                      background: 'rgba(16,185,129,0.15)',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      marginBottom: '0.5rem',
                      display: 'inline-block'
                    }}>{img.category}</span>
                    <p style={{ fontWeight: 800, fontSize: '1rem', margin: 0, letterSpacing: '-0.02em' }}>{img.title}</p>
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
        </AnimatePresence>
      </div>

      {/* Infinite Horizontal Scroller for extra flair */}
      <div style={{ 
        marginTop: '6rem', 
        overflow: 'hidden', 
        whiteSpace: 'nowrap',
        maskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
        WebkitMaskImage: 'linear-gradient(to right, transparent, black 10%, black 90%, transparent)',
        opacity: 0.4
      }}>
        <div style={{ 
          display: 'inline-block', 
          transform: `translateX(-${offset}px)`,
          transition: 'transform 0.03s linear'
        }}>
          {[...SCREENSHOTS, ...SCREENSHOTS, ...SCREENSHOTS].map((img, i) => (
            <div key={i} style={{ 
              display: 'inline-block', 
              width: '120px', 
              height: '80px', 
              marginRight: '1rem', 
              borderRadius: '12px', 
              overflow: 'hidden',
              border: '1px solid rgba(15,23,42,0.1)',
              background: '#f1f5f9'
            }}>
              <img src={img.src} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover', opacity: 0.6 }} />
            </div>
          ))}
        </div>
      </div>

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
              zIndex: 3000,
              background: 'rgba(15,23,42,0.98)',
              backdropFilter: 'blur(20px)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              padding: '2rem'
            }}
            onClick={() => setSelectedImage(null)}
          >
            {/* Close Button */}
            <button
              style={{
                position: 'absolute',
                top: '2rem',
                right: '2rem',
                background: 'rgba(255,255,255,0.1)',
                border: '1px solid rgba(255,255,255,0.2)',
                borderRadius: '50%',
                width: '52px',
                height: '52px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                cursor: 'pointer',
                transition: '0.2s',
                zIndex: 10
              }}
              onClick={() => setSelectedImage(null)}
              onMouseEnter={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.2)'}
              onMouseLeave={(e) => e.currentTarget.style.background = 'rgba(255,255,255,0.1)'}
            >
              <X size={24} color="white" />
            </button>

            {/* Navigation Buttons */}
            <div style={{ position: 'absolute', left: '2rem', right: '2rem', display: 'flex', justifyContent: 'space-between', width: 'calc(100% - 4rem)', pointerEvents: 'none', zIndex: 5 }}>
               <button 
                onClick={(e) => { e.stopPropagation(); setSelectedImage(prev => (prev === null ? 0 : (prev - 1 + SCREENSHOTS.length) % SCREENSHOTS.length)) }}
                style={{ pointerEvents: 'auto', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '1.5rem', borderRadius: '100px', cursor: 'pointer' }}
               >
                 <ChevronLeft size={32} />
               </button>
               <button 
                onClick={(e) => { e.stopPropagation(); setSelectedImage(prev => (prev === null ? 0 : (prev + 1) % SCREENSHOTS.length)) }}
                style={{ pointerEvents: 'auto', background: 'rgba(255,255,255,0.05)', border: 'none', color: 'white', padding: '1.5rem', borderRadius: '100px', cursor: 'pointer' }}
               >
                 <ChevronRight size={32} />
               </button>
            </div>

            <motion.div
              key={selectedImage}
              initial={{ scale: 0.95, opacity: 0, y: 20 }}
              animate={{ scale: 1, opacity: 1, y: 0 }}
              exit={{ scale: 0.95, opacity: 0, y: -20 }}
              transition={{ type: 'spring', damping: 30, stiffness: 300 }}
              style={{ maxWidth: '1200px', width: '100%', position: 'relative' }}
              onClick={(e) => e.stopPropagation()}
            >
              <div style={{ 
                borderRadius: '32px', 
                overflow: 'hidden', 
                boxShadow: '0 40px 100px rgba(0,0,0,0.8)',
                border: '1px solid rgba(255,255,255,0.1)',
                background: 'black'
              }}>
                <img
                  src={SCREENSHOTS[selectedImage].src}
                  alt={SCREENSHOTS[selectedImage].title}
                  style={{
                    width: '100%',
                    height: 'auto',
                    maxHeight: '75vh',
                    objectFit: 'contain',
                    display: 'block'
                  }}
                />
              </div>
              
              <div style={{ marginTop: '2.5rem', textAlign: 'center', color: 'white' }}>
                <span style={{ color: 'var(--brand)', fontWeight: 900, textTransform: 'uppercase', fontSize: '0.8rem', letterSpacing: '0.2em' }}>{SCREENSHOTS[selectedImage].category}</span>
                <h3 style={{ fontSize: '2rem', fontWeight: 950, margin: '0.5rem 0', letterSpacing: '-0.04em' }}>{SCREENSHOTS[selectedImage].title}</h3>
                <div style={{ display: 'inline-flex', gap: '8px', opacity: 0.5, fontSize: '0.9rem', fontWeight: 600 }}>
                  <span>{selectedImage + 1}</span>
                  <span>/</span>
                  <span>{SCREENSHOTS.length}</span>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}
