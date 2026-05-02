'use client'

import { useState } from 'react'
import Link from 'next/link'
import { motion, AnimatePresence } from 'framer-motion'
import { Mail, MessageSquare, Send, CheckCircle, ArrowLeft } from 'lucide-react'

export default function ContactPage() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    category: 'General',
    message: ''
  })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isSubmitted, setIsSubmitted] = useState(false)
  const [error, setError] = useState('')

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setIsSubmitting(true)
    setError('')

    try {
      const res = await fetch('/api/contact', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData)
      })

      if (res.ok) {
        setIsSubmitted(true)
      } else {
        const data = await res.json()
        setError(data.error || 'Something went wrong. Please try again.')
      }
    } catch (err) {
      setError('Network error. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <main style={{ minHeight: '100vh', background: '#0a0a0a', color: 'white', position: 'relative', overflow: 'hidden' }}>
      {/* Background Gradients */}
      <div style={{ position: 'fixed', inset: 0, backgroundImage: 'linear-gradient(rgba(16,185,129,0.02) 1px, transparent 1px), linear-gradient(90deg, rgba(16,185,129,0.02) 1px, transparent 1px)', backgroundSize: '64px 64px', pointerEvents: 'none' }} />
      <div style={{ position: 'fixed', top: '-10%', right: '-5%', width: '50vw', height: '50vw', background: 'radial-gradient(circle, rgba(16,185,129,0.05) 0%, transparent 70%)', filter: 'blur(100px)', pointerEvents: 'none' }} />

      <div style={{ maxWidth: '800px', margin: '0 auto', padding: '6rem 1.5rem', position: 'relative', zIndex: 1 }}>
        <Link 
          href="/" 
          style={{ 
            display: 'inline-flex', 
            alignItems: 'center', 
            gap: '0.5rem', 
            color: '#9ca3af', 
            textDecoration: 'none', 
            fontSize: '0.875rem', 
            marginBottom: '3rem',
            transition: 'color 0.2s'
          }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#10b981')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#9ca3af')}
        >
          <ArrowLeft size={16} /> Back to Home
        </Link>

        <header style={{ marginBottom: '4rem' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', color: '#10b981', fontWeight: 800, fontSize: '0.75rem', textTransform: 'uppercase', letterSpacing: '0.15em', marginBottom: '1rem' }}>
            <MessageSquare size={14} /> Contact & Feedback
          </div>
          <h1 style={{ fontSize: 'clamp(2.5rem, 5vw, 4rem)', fontWeight: 950, letterSpacing: '-0.04em', lineHeight: 1, marginBottom: '1.5rem' }}>
            Let&apos;s build the <br />
            <span style={{ color: '#10b981' }}>future together.</span>
          </h1>
          <p style={{ color: '#9ca3af', fontSize: '1.1rem', lineHeight: 1.6, maxWidth: '600px' }}>
            Have a suggestion, found a bug, or just want to say hello? Our team is always listening to the community.
          </p>
        </header>

        <div style={{ background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.06)', borderRadius: '24px', padding: '2.5rem', backdropFilter: 'blur(20px)' }}>
          <AnimatePresence mode="wait">
            {isSubmitted ? (
              <motion.div 
                key="success"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                style={{ textAlign: 'center', padding: '2rem 0' }}
              >
                <div style={{ width: '80px', height: '80px', background: 'rgba(16,185,129,0.1)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 2rem' }}>
                  <CheckCircle size={40} color="#10b981" />
                </div>
                <h2 style={{ fontSize: '2rem', fontWeight: 900, marginBottom: '1rem' }}>Message Sent!</h2>
                <p style={{ color: '#9ca3af', marginBottom: '3rem' }}>
                  Thank you for reaching out. We&apos;ve received your message and will get back to you soon.
                </p>
                <button 
                  onClick={() => setIsSubmitted(false)}
                  style={{ background: '#10b981', color: '#0a0a0a', border: 'none', padding: '1rem 2.5rem', borderRadius: '12px', fontWeight: 800, cursor: 'pointer' }}
                >
                  Send Another Message
                </button>
              </motion.div>
            ) : (
              <motion.form 
                key="form"
                onSubmit={handleSubmit}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}
              >
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.5rem' }}>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Full Name</label>
                    <input 
                      type="text" 
                      required
                      value={formData.name}
                      onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                      placeholder="Jane Doe"
                      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #222', borderRadius: '10px', padding: '0.8rem 1rem', color: 'white', outline: 'none' }}
                    />
                  </div>
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                    <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Email Address</label>
                    <input 
                      type="email" 
                      required
                      value={formData.email}
                      onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                      placeholder="jane@example.com"
                      style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #222', borderRadius: '10px', padding: '0.8rem 1rem', color: 'white', outline: 'none' }}
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Category</label>
                  <select 
                    value={formData.category}
                    onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #222', borderRadius: '10px', padding: '0.8rem 1rem', color: 'white', outline: 'none', cursor: 'pointer' }}
                  >
                    <option value="General">General Inquiry</option>
                    <option value="Bug">Bug Report</option>
                    <option value="Feature">Feature Suggestion</option>
                    <option value="Business">Business Partnership</option>
                  </select>
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                  <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#6b7280', textTransform: 'uppercase' }}>Your Message</label>
                  <textarea 
                    required
                    rows={5}
                    value={formData.message}
                    onChange={(e) => setFormData({ ...formData, message: e.target.value })}
                    placeholder="Tell us what's on your mind..."
                    style={{ background: 'rgba(0,0,0,0.3)', border: '1px solid #222', borderRadius: '10px', padding: '0.8rem 1rem', color: 'white', outline: 'none', resize: 'vertical' }}
                  />
                </div>

                {error && (
                  <div style={{ color: '#ef4444', fontSize: '0.875rem', textAlign: 'center' }}>
                    {error}
                  </div>
                )}

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  style={{ 
                    background: '#10b981', 
                    color: '#0a0a0a', 
                    border: 'none', 
                    padding: '1.2rem', 
                    borderRadius: '12px', 
                    fontWeight: 800, 
                    fontSize: '1rem',
                    cursor: isSubmitting ? 'not-allowed' : 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '0.75rem',
                    transition: 'opacity 0.2s',
                    opacity: isSubmitting ? 0.7 : 1
                  }}
                >
                  {isSubmitting ? 'Sending...' : <><Send size={18} /> Send Message</>}
                </button>
              </motion.form>
            )}
          </AnimatePresence>
        </div>

        <div style={{ marginTop: '4rem', display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '2rem' }}>
          <div>
            <h3 style={{ fontSize: '0.875rem', color: '#6b7280', textTransform: 'uppercase', marginBottom: '1rem' }}>Support</h3>
            <p style={{ color: '#f3f4f6', fontWeight: 600 }}>support@espeezy.com</p>
          </div>
          <div>
            <h3 style={{ fontSize: '0.875rem', color: '#6b7280', textTransform: 'uppercase', marginBottom: '1rem' }}>Business</h3>
            <p style={{ color: '#f3f4f6', fontWeight: 600 }}>business@espeezy.com</p>
          </div>
          <div>
            <h3 style={{ fontSize: '0.875rem', color: '#6b7280', textTransform: 'uppercase', marginBottom: '1rem' }}>Response Time</h3>
            <p style={{ color: '#f3f4f6', fontWeight: 600 }}>Within 24-48 hours</p>
          </div>
        </div>
      </div>
    </main>
  )
}
