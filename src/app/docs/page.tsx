'use client'

import React from 'react'
import Link from 'next/link'
import { Sparkles, ArrowRight, BookOpen, Fingerprint } from 'lucide-react'

export default function DocsHome() {
  return (
    <div className="docs-content">
      <div className="docs-hero">
        <div className="docs-badge">
           THE Espeezy ARCHIVE
        </div>
        <h1 className="docs-title">
           Welcome to the Espeezy Documentation.
        </h1>
        <p className="docs-description">
          The official technical guide for students, researchers, and technical leads. 
          Learn how to professionalize your academic collaboration through our real-time persistence protocol.
        </p>
      </div>

      <section className="docs-section">
        <h2 className="docs-section-title">The Documentation Pipeline</h2>
        <div className="docs-card">
           <p className="docs-card-text">
             <strong style={{ color: '#f3f4f6' }}>Auto-Sync Architecture:</strong> This documentation site is powered by a 
             &quot;Documentation as Code&quot; pipeline. Every page you see here is stored directly in the GitHub repository. 
             When a developer pushes an update to GitHub, the documentation site updates automatically. 
             This ensures the manual is always as up-to-date as the code.
           </p>
        </div>
      </section>

      <section className="docs-section">
        <h2 className="docs-section-title">Explaining Espeezy (ELI12)</h2>
        <div className="docs-grid">
           <div className="docs-card small">
              <div style={{ color: '#10b981', marginBottom: '1rem' }}><Sparkles size={24} /></div>
              <h3 className="docs-card-title">What is it?</h3>
              <p className="docs-card-subtext">
                Think of Espeezy as a super-powered school project app. It&apos;s a place where you and your friends can work together on a technical project without ever losing your work.
              </p>
           </div>
           <div className="docs-card small">
              <div style={{ color: '#10b981', marginBottom: '1rem' }}><BookOpen size={24} /></div>
              <h3 className="docs-card-title">Why use it?</h3>
              <p className="docs-card-subtext">
                Shared Google Docs can get messy. Espeezy uses professional tools (like Kanban and Roadmaps) to make sure everyone knows exactly what to do and when to do it.
              </p>
           </div>
        </div>
      </section>

      <div className="docs-actions">
        <Link href="/docs/getting-started" className="btn-primary">
          Quick Start Guide <ArrowRight size={18} />
        </Link>
        <Link href="/docs/features/kanban" className="btn-secondary">
          Explore Features
        </Link>
      </div>

      <style jsx>{`
        .docs-content {
          animation: fadeIn 0.5s ease-out;
        }

        .docs-hero {
          margin-bottom: 4rem;
        }

        .docs-badge {
          display: inline-flex;
          padding: 6px 12px;
          background: rgba(16, 185, 129, 0.1);
          color: #10b981;
          border-radius: 6px;
          font-size: 0.7rem;
          font-weight: 700;
          margin-bottom: 1rem;
          letter-spacing: 1px;
        }

        .docs-title {
          font-size: 3rem;
          font-weight: 800;
          letter-spacing: -0.04em;
          margin-bottom: 1.5rem;
          color: #f3f4f6;
          line-height: 1.1;
        }

        .docs-description {
          font-size: 1.25rem;
          color: #9ca3af;
          line-height: 1.6;
          max-width: 700px;
        }

        .docs-section {
          margin-bottom: 4rem;
        }

        .docs-section-title {
          font-size: 1.5rem;
          font-weight: 700;
          margin-bottom: 1.5rem;
        }

        .docs-card {
          background: #111;
          padding: 2rem;
          border-radius: 16px;
          border: 1px solid #222;
        }

        .docs-card.small {
          padding: 1.5rem;
          border-radius: 12px;
        }

        .docs-card-text {
          margin: 0;
          color: #9ca3af;
          line-height: 1.7;
        }

        .docs-grid {
          display: grid;
          grid-template-columns: repeat(auto-fit, minmax(280px, 1fr));
          gap: 1.5rem;
        }

        .docs-card-title {
          font-size: 1.1rem;
          font-weight: 600;
          margin-bottom: 0.5rem;
        }

        .docs-card-subtext {
          font-size: 0.9rem;
          color: #6b7280;
          margin: 0;
          line-height: 1.6;
        }

        .docs-actions {
          display: flex;
          gap: 1rem;
          flex-wrap: wrap;
        }

        .btn-primary {
          background: #10b981;
          color: #0a0a0a;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 700;
          display: flex;
          align-items: center;
          gap: 0.5rem;
        }

        .btn-secondary {
          color: #f3f4f6;
          border: 1px solid #222;
          padding: 0.75rem 1.5rem;
          border-radius: 8px;
          text-decoration: none;
          font-weight: 600;
        }

        @keyframes fadeIn {
          from { opacity: 0; transform: translateY(10px); }
          to { opacity: 1; transform: translateY(0); }
        }

        @media (max-width: 768px) {
          .docs-title {
            font-size: 1.85rem;
          }
          .docs-description {
            font-size: 1.05rem;
          }
          .docs-hero {
            margin-bottom: 2.5rem;
          }
          .docs-section {
            margin-bottom: 3rem;
          }
        }
      `}</style>
    </div>
  )
}
