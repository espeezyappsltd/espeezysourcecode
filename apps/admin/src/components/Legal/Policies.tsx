'use client'

import React from 'react'

const PolicyContainer = ({ title, children, onClose }: { title: string, children: React.ReactNode, onClose: () => void }) => (
  <div style={{ position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, background: 'rgba(0,0,0,0.85)', backdropFilter: 'blur(10px)', zIndex: 20000, display: 'flex', alignItems: 'center', justifyContent: 'center', padding: '1rem' }}>
    <div className="glass" style={{ background: 'var(--surface)', borderRadius: '24px', width: '100%', maxWidth: '700px', height: '80vh', display: 'flex', flexDirection: 'column', border: '1px solid var(--border)' }}>
      <div style={{ padding: '1.5rem 2rem', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
         <h2 style={{ fontSize: '1.25rem', fontWeight: 800, margin: 0 }}>{title}</h2>
         <button onClick={onClose} className="btn" style={{ width: 'auto', padding: '0.5rem 1rem' }}>Close</button>
      </div>
      <div style={{ flex: 1, padding: '2rem', overflowY: 'auto', lineHeight: 1.6, color: 'var(--text-main)', fontSize: '0.95rem' }}>
         {children}
      </div>
    </div>
  </div>
)

export const PrivacyPolicy = ({ onClose }: { onClose: () => void }) => (
  <PolicyContainer title="Privacy Policy" onClose={onClose}>
    <h3>1. Data Collection</h3>
    <p>Espeezy collects the minimum data required to facilitate educational collaboration. This includes your email, full name, and school ID. We do not sell your data to third parties.</p>
    
    <h3>2. Usage Data</h3>
    <p>We log technical velocity and collaboration metrics to provide verifiable effort scores for your projects. This data is visible to your assigned group members and instructors.</p>
    
    <h3>3. Data Security</h3>
    <p>We use industry-standard encryption and security protocols (AES-256) to protect your academic records and communication logs.</p>
  </PolicyContainer>
)

export const TermsOfService = ({ onClose }: { onClose: () => void }) => (
  <PolicyContainer title="Terms of Service" onClose={onClose}>
    <h3>1. Academic Integrity</h3>
    <p>Espeezy is designed to promote honest collaboration. By using this service, you agree to submit only your original work and accurately report your contributions.</p>
    
    <h3>2. Acceptable Use</h3>
    <p>Users must not use the platform for harassment, data scraping, or any activity that compromises the validity scoring node.</p>
    
    <h3>3. Account Responsibility</h3>
    <p>You are responsible for maintaining the confidentiality of your credentials and for all activity performed under your school ID.</p>
  </PolicyContainer>
)

export const CookiePolicy = ({ onClose }: { onClose: () => void }) => (
  <PolicyContainer title="Cookie Policy" onClose={onClose}>
    <h3>1. Essential Cookies</h3>
    <p>We use essential cookies to manage your authentication session and maintain your active group context. These are mandatory for the application to function.</p>
    
    <h3>2. Performance Cookies</h3>
    <p>Minimal local storage is used to remember your UI preferences, such as your chosen theme palette and sidebar state.</p>
  </PolicyContainer>
)
