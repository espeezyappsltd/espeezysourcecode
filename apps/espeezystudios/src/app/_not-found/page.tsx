'use client'

import Link from 'next/link'

export default function NotFoundPage() {
  return (
    <main id="main-content" className="studio-page studio-page--centered">
      <header className="studio-page__header">
        <h1 className="studio-page__title">Page not found</h1>
        <p className="studio-page__desc">This route does not exist or may have moved.</p>
      </header>
      <div className="studio-page__body">
        <div className="studio-panel studio-panel--prose">
          <p>
            <Link href="/">Return to dashboard</Link> or use the navigation above to continue.
          </p>
        </div>
      </div>
    </main>
  )
}
