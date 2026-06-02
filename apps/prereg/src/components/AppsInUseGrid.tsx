'use client'

import Link from 'next/link'
import { ArrowRight, ExternalLink } from 'lucide-react'
import type { AppInUse } from '@shared/platform-docs-content'
import './landing/landing.css'

type Props = {
  apps: AppInUse[]
  variant?: 'landing' | 'docs'
  showDocsLink?: boolean
}

export function AppsInUseGrid({ apps, variant = 'landing', showDocsLink = true }: Props) {
  return (
    <ul className={`apps-in-use${variant === 'docs' ? ' apps-in-use--docs' : ''}`}>
      {apps.map((app) => (
        <li key={app.key} className="apps-in-use__card">
          <div className="apps-in-use__body">
            <h3 className="apps-in-use__name">{app.name}</h3>
            <p className="apps-in-use__summary">{app.summary}</p>
          </div>
          <div className="apps-in-use__actions">
            <a
              href={app.href}
              target="_blank"
              rel="noopener noreferrer"
              className="apps-in-use__open"
            >
              Open
              <ExternalLink size={14} aria-hidden />
            </a>
            {showDocsLink && app.docsHref ? (
              <Link href={app.docsHref} className="apps-in-use__docs">
                Docs
                <ArrowRight size={14} aria-hidden />
              </Link>
            ) : null}
          </div>
        </li>
      ))}
    </ul>
  )
}
