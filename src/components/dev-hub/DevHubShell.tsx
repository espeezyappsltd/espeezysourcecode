'use client'

import Link from 'next/link'
import Image from 'next/image'
import { LayoutGrid, LogOut } from 'lucide-react'
import { useRouter } from 'next/navigation'

export function DevHubShell({
  title,
  subtitle,
  children,
}: {
  title: string
  subtitle?: string
  children: React.ReactNode
}) {
  const router = useRouter()

  async function logout() {
    await fetch('/api/dev/auth/logout', { method: 'POST' })
    router.replace('/login')
    router.refresh()
  }

  return (
    <div className="dev-hub-root">
      <div className="dev-hub-grid-bg" aria-hidden />
      <div className="dev-hub-glow dev-hub-glow--tl" aria-hidden />
      <div className="dev-hub-glow dev-hub-glow--br" aria-hidden />

      <div className="dev-hub-shell page-fade">
        <header className="dev-hub-header">
          <div className="dev-hub-brand">
            <div className="dev-hub-brand-mark">
              <Image src="/brand_logo2.svg" width={28} height={28} alt="" priority />
            </div>
            <div>
              <div className="dev-hub-title">{title}</div>
              {subtitle ? <div className="dev-hub-subtitle">{subtitle}</div> : null}
            </div>
          </div>
          <nav className="dev-hub-nav" aria-label="Hub navigation">
            <Link href="/dashboard" className="btn btn-secondary btn-sm btn-inline dev-hub-nav-btn">
              <LayoutGrid size={15} />
              Dashboard
            </Link>
            <button type="button" className="btn btn-ghost btn-sm btn-inline" onClick={() => void logout()}>
              <LogOut size={15} />
              Sign out
            </button>
          </nav>
        </header>
        {children}
      </div>
    </div>
  )
}
