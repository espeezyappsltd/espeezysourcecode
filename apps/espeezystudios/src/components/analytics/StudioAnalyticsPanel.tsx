import type { ReactNode } from 'react'

export function StudioAnalyticsGrid({
  children,
  label,
}: {
  children: ReactNode
  label: string
}) {
  return (
    <section className="studio-analytics__grid" aria-label={label}>
      {children}
    </section>
  )
}

export function StudioAnalyticsPanel({
  title,
  loading,
  children,
}: {
  title: string
  loading?: boolean
  children: ReactNode
}) {
  return (
    <div className="studio-analytics__panel">
      <h3 className="studio-analytics__panel-title">{title}</h3>
      {loading ? (
        <p className="studio-analytics__loading">Loading…</p>
      ) : (
        <div className="studio-analytics__chart">{children}</div>
      )}
    </div>
  )
}

export const studioBarLineChartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: { legend: { display: false } },
  scales: {
    x: {
      ticks: {
        maxRotation: 45,
        minRotation: 0,
        autoSkip: true,
        maxTicksLimit: 10,
      },
    },
  },
}

export const studioPieChartOptions = {
  responsive: true,
  maintainAspectRatio: true,
  plugins: {
    legend: {
      position: 'bottom' as const,
      labels: { boxWidth: 12, padding: 10 },
    },
  },
}
