'use client'

/** Page header inside the dashboard main content area. */
export function DevHubShell({
  title,
  subtitle,
  fullHeight,
  children,
}: {
  title: string
  subtitle?: string
  fullHeight?: boolean
  children: React.ReactNode
}) {
  return (
    <div className={`dev-hub-page ${fullHeight ? 'dev-hub-page--fill' : ''}`}>
      <header className="dev-hub-page-header">
        <h1 className="dev-hub-page-title">{title}</h1>
        {subtitle ? <p className="dev-hub-page-subtitle">{subtitle}</p> : null}
      </header>
      {children}
    </div>
  )
}
