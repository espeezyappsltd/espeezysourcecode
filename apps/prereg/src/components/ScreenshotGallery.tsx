'use client'

import { useState, useEffect } from 'react'
import Image from 'next/image'
import { motion, AnimatePresence } from 'framer-motion'
import { Maximize2, X, ChevronLeft, ChevronRight } from 'lucide-react'
import { SCREENSHOT_ASSETS } from '@shared/assets'
    import { CategoryTabs } from 'apps/shared/CategoryTabs'

const SCREENSHOTS = [
  { src: SCREENSHOT_ASSETS.CONTRIBUTION_METRICS, title: 'Contribution Metrics', category: 'Analytics' },
  { src: SCREENSHOT_ASSETS.TASK_INTERFACE, title: 'Task Interface', category: 'Productivity' },
  { src: SCREENSHOT_ASSETS.COLLABORATION_HUB, title: 'Collaboration Hub', category: 'Communication' },
  { src: SCREENSHOT_ASSETS.ANALYTICS_ENGINE, title: 'Analytics Engine', category: 'Data' },
  { src: SCREENSHOT_ASSETS.GLOBAL_NETWORK, title: 'Global Network', category: 'Community' },
  { src: SCREENSHOT_ASSETS.SIDE_HUSTLE, title: 'Side Hustle', category: 'Income' },
  { src: SCREENSHOT_ASSETS.EARNING_PORTAL, title: 'Earning Portal', category: 'Finance' },
]

export default function ScreenshotGallery() {
  const [selectedImage, setSelectedImage] = useState<number | null>(null)
  const [filter, setFilter] = useState('All')
  const [loadedImages, setLoadedImages] = useState<Record<string, boolean>>({})

  const handleImageLoad = (src: string) => {
    setLoadedImages(prev => ({ ...prev, [src]: true }))
  }

  // Extract unique categories
  const categories = ['All', ...Array.from(new Set(SCREENSHOTS.map(s => s.category)))]
  
  const filteredScreenshots = filter === 'All' 
    ? SCREENSHOTS 
    : SCREENSHOTS.filter(s => s.category === filter)

  return (
    <div className="w-full" style={{ position: 'relative', paddingBottom: '4rem' }}>
      
      {/* Category Filter */}
      <CategoryTabs categories={categories} selected={filter} onSelect={setFilter} />

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
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ 
                opacity: 1, 
                y: 0,
                transition: { 
                  duration: 0.8,
                  delay: (i % 4) * 0.1, // Staggered entry
                  ease: [0.16, 1, 0.3, 1]
                }
              }}
              viewport={{ once: true, margin: "-50px" }}
              style={{ 
                borderRadius: '24px',
                overflow: 'hidden',
                background: '#f8fafc',
                border: '1px solid rgba(15,23,42,0.06)',
                boxShadow: '0 4px 30px rgba(15,23,42,0.03)',
                cursor: 'pointer',
                position: 'relative',
              }}
              onClick={() => setSelectedImage(SCREENSHOTS.findIndex(s => s.src === img.src))}
            >
              <div style={{ 
              position: 'relative', 
              paddingBottom: '62.5%', 
              overflow: 'hidden',
              background: '#f1f5f9' // Fallback color while loading
            }}>
              <Image 
                src={img.src} 
                alt={img.title} 
                fill
                sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 400px"
                quality={75}
                onLoad={() => handleImageLoad(img.src)}
                style={{ 
                  objectFit: 'cover',
                  display: 'block',
                  opacity: loadedImages[img.src] ? 1 : 0,
                  transition: 'opacity 1s ease-in-out',
                  transform: loadedImages[img.src] ? 'scale(1)' : 'scale(1.05)',
                }} 
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
                background: 'black',
                position: 'relative'
              }}>
                <Image
                  src={SCREENSHOTS[selectedImage].src}
                  alt={SCREENSHOTS[selectedImage].title}
                  width={800} // Smaller width for faster lightbox
                  height={533}
                  quality={60} // Slightly better but still optimized
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
