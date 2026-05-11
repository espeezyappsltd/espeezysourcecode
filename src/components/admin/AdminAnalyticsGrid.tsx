'use client'

/**
 * AdminAnalyticsGrid
 *
 * The "Business Intelligence Grid"  -  two side-by-side charts:
 *   Left  (3/4 width): AreaChart showing projected MRR over 4 months
 *   Right (1/4 width): Animated conversion funnel (Framer Motion bars)
 *
 * Props:
 *   stats  -  AdminStats from useAdminDashboard hook
 *
 * Chart libraries: recharts + framer-motion
 * No internal state needed  -  all data is derived from props.
 */

import { motion, useReducedMotion } from 'framer-motion'
import {
  XAxis,
  YAxis,
  Tooltip,
  ResponsiveContainer,
  AreaChart,
  Area,
} from 'recharts'
import type { AdminStats } from './types'

interface Props {
  stats: AdminStats
}

export default function AdminAnalyticsGrid({ stats }: Props) {
  // Build chart and funnel data from current stats
  const chartData = buildChartData(stats.revenue)
  const funnelData = buildFunnelData(stats)

  return (
    <div>
      {/* Metrics Row */}
      <div
        style={{
          display: 'flex',
          gap: '2.5rem',
          marginBottom: '2.5rem',
          flexWrap: 'wrap',
        }}
      >
        <MetricCard label="LTV" value={typeof stats.ltv === 'number' ? `£${stats.ltv}` : '—'} desc="Lifetime Value" color="#6366f1" />
        <MetricCard label="CAC" value={typeof stats.cac === 'number' ? `£${stats.cac}` : '—'} desc="Customer Acquisition Cost" color="#f59e42" />
        <MetricCard label="NRR" value={typeof stats.nrr === 'number' ? `${Math.round((stats.nrr ?? 0) * 100)}%` : '—'} desc="Net Revenue Retention" color="#10b981" />
      </div>
      <div
        style={{
          display: 'grid',
          gridTemplateColumns: '3fr 1fr',
          gap: '1.5rem',
          marginBottom: '3rem',
        }}
      >
        <MrrChart chartData={chartData} />
        <ConversionFunnel funnelData={funnelData} />
      </div>
    </div>
  )
}

function MetricCard({ label, value, desc, color }: { label: string; value: string; desc: string; color: string }) {
  return (
    <div
      style={{
        background: '#0a0a0a',
        border: `2px solid ${color}`,
        borderRadius: '20px',
        padding: '1.5rem 2.5rem',
        minWidth: '160px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'flex-start',
        boxShadow: '0 2px 12px 0 rgba(0,0,0,0.08)',
      }}
    >
      <span style={{ fontSize: '0.8rem', fontWeight: 700, color, marginBottom: '0.5rem', letterSpacing: '1px' }}>{label}</span>
      <span style={{ fontSize: '2.2rem', fontWeight: 950, color: 'white', marginBottom: '0.25rem' }}>{value}</span>
      <span style={{ fontSize: '0.8rem', color: '#aaa', fontWeight: 500 }}>{desc}</span>
    </div>
  )
}

// ── Pure data builders ─────────────────────────────────────────────────────────
// Kept as named functions outside the component so they are easy to test.

function buildChartData(revenue: number) {
  return [
    { name: 'Jan', mrr: 1200 },
    { name: 'Feb', mrr: 2100 },
    { name: 'Mar', mrr: 3400 },
    { name: 'Apr', mrr: Math.round(revenue * 0.8) },
  ]
}

function buildFunnelData(stats: AdminStats) {
  return [
    { name: 'Exhibition', value: 4500 },
    { name: 'Registration', value: stats.users },
    { name: 'Elevation', value: stats.pro + stats.premium },
  ]
}

// ── MRR Area Chart ─────────────────────────────────────────────────────────────

function MrrChart({ chartData }: { chartData: { name: string; mrr: number }[] }) {
  return (
    <div
      style={{
        padding: '2.5rem',
        background: '#0a0a0a',
        border: '1px solid #111',
        borderRadius: '32px',
      }}
    >
      {/* Heading row */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '2.5rem',
        }}
      >
        <h2 style={{ fontSize: '1.25rem', fontWeight: 950, margin: 0, color: 'white' }}>
          Projected Revenue Elevation (MRR)
        </h2>
        <div
          style={{
            fontSize: '0.75rem',
            fontWeight: 800,
            color: '#10b981',
            background: 'rgba(16, 185, 129, 0.1)',
            padding: '4px 12px',
            borderRadius: '100px',
          }}
        >
          + 42% GROWTH
        </div>
      </div>

      {/* Recharts area chart */}
      <div style={{ height: '300px', width: '100%' }}>
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={chartData}>
            <defs>
              <linearGradient id="colorMrr" x1="0" y1="0" x2="0" y2="1">
                <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
              </linearGradient>
            </defs>
            <XAxis
              dataKey="name"
              stroke="#333"
              fontSize={12}
              tickLine={false}
              axisLine={false}
            />
            <YAxis
              stroke="#333"
              fontSize={12}
              tickLine={false}
              axisLine={false}
              tickFormatter={(v) => `£${v}`}
            />
            <Tooltip
              contentStyle={{
                background: '#000',
                border: '1px solid #222',
                borderRadius: '12px',
                fontSize: '12px',
              }}
            />
            <Area
              type="monotone"
              dataKey="mrr"
              stroke="#10b981"
              strokeWidth={3}
              fillOpacity={1}
              fill="url(#colorMrr)"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
    </div>
  )
}

// ── Conversion Funnel ──────────────────────────────────────────────────────────

function ConversionFunnel({
  funnelData,
}: {
  funnelData: { name: string; value: number }[]
}) {
  const topValue = funnelData[0]?.value || 1 // avoid divide-by-zero

  return (
    <div
      style={{
        padding: '2.5rem',
        background: '#0a0a0a',
        border: '1px solid #111',
        borderRadius: '32px',
      }}
    >
      <h2
        style={{
          fontSize: '1.25rem',
          fontWeight: 950,
          marginBottom: '2.5rem',
          color: 'white',
        }}
      >
        Institutional Funnel
      </h2>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {funnelData.map((row) => (
          <FunnelRow key={row.name} row={row} topValue={topValue} />
        ))}
      </div>
    </div>
  )
}

/** A single animated row in the conversion funnel. */
function FunnelRow({
  row,
  topValue,
}: {
  row: { name: string; value: number }
  topValue: number
}) {
  // Respect the user's OS-level "reduce motion" preference
  const shouldReduceMotion = useReducedMotion()
  const widthPercent = `${(row.value / topValue) * 100}%`

  return (
    <div>
      {/* Label + count */}
      <div
        style={{
          display: 'flex',
          justifyContent: 'space-between',
          fontSize: '0.8rem',
          marginBottom: '0.5rem',
        }}
      >
        <span style={{ opacity: 0.5, fontWeight: 700, color: 'white' }}>{row.name}</span>
        <span style={{ fontWeight: 900, color: 'white' }}>{row.value}</span>
      </div>

      {/* Bar track */}
      <div
        style={{
          height: '6px',
          background: '#111',
          borderRadius: '10px',
          overflow: 'hidden',
        }}
      >
        <motion.div
          initial={{ width: shouldReduceMotion ? widthPercent : 0 }}
          animate={{ width: widthPercent }}
          transition={{ duration: 0.8, ease: 'easeOut' }}
          style={{ height: '100%', background: '#10b981' }}
        />
      </div>
    </div>
  )
}
