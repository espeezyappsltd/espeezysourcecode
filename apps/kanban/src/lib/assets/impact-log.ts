import { getAdminDb } from '@/lib/supabase/admin'
import { creditsToGbpEquivalent } from '@/lib/credits'
import { getTradingMetricsForUser, type TradingActivityRow } from '@/lib/marketplace/trading-metrics'

export type ImpactLogEntry = {
  id: string
  source: 'marketplace' | 'hustle' | 'withdrawal'
  kind: string
  title: string
  subtitle: string
  verificationId: string
  verificationLabel: string
  credits: number
  direction: 'in' | 'out'
  gbpApprox: number
  createdAt: string
  href?: string
}

export type HustleImpactSummary = {
  gigsPosted: number
  gigsCompletedAsWorker: number
  gigsPaidAsPoster: number
  creditsEarned: number
  creditsSpentEscrow: number
  creditsRefunded: number
  platformFeesPaid: number
}

export type ImpactLogPayload = {
  summary: {
    totalEvents: number
    creditsIn: number
    creditsOut: number
    marketplaceIn: number
    hustleIn: number
    hustleOut: number
  }
  hustle: HustleImpactSummary
  entries: ImpactLogEntry[]
}

type HustleLedgerRow = {
  id: string
  task_id: string
  from_user_id: string | null
  to_user_id: string | null
  credits_amount: number
  kind: 'escrow_in' | 'release' | 'refund' | 'platform_fee'
  created_at: string
  hustle_tasks: { title: string; category: string; status: string } | null
}

const HUSTLE_KIND_LABEL: Record<HustleLedgerRow['kind'], string> = {
  escrow_in: 'Escrow funded',
  release: 'Gig payout',
  refund: 'Escrow refunded',
  platform_fee: 'Platform fee',
}

function shortId(id: string): string {
  return id.length > 8 ? `${id.slice(0, 8)}…` : id
}

function marketplaceToImpact(row: TradingActivityRow): ImpactLogEntry {
  const verificationLabel =
    row.kind === 'withdrawal' ? 'Withdrawal' : row.kind === 'sale' ? 'Invoice' : 'Purchase'
  return {
    id: row.id,
    source: row.kind === 'withdrawal' ? 'withdrawal' : 'marketplace',
    kind: row.kind,
    title: row.title,
    subtitle: row.subtitle,
    verificationId: row.id,
    verificationLabel,
    credits: row.credits,
    direction: row.direction,
    gbpApprox: row.gbpApprox,
    createdAt: row.createdAt,
    href: row.invoiceUrl,
  }
}

function hustleLedgerToImpact(row: HustleLedgerRow, userId: string): ImpactLogEntry | null {
  const taskTitle = row.hustle_tasks?.title ?? 'Hustle gig'
  const taskHref = `/hustle?tab=gigs&task=${row.task_id}`

  if (row.kind === 'escrow_in' && row.from_user_id === userId) {
    return {
      id: row.id,
      source: 'hustle',
      kind: 'hustle_escrow',
      title: taskTitle,
      subtitle: `${HUSTLE_KIND_LABEL.escrow_in} · Ledger ${shortId(row.id)}`,
      verificationId: row.id,
      verificationLabel: 'Ledger',
      credits: row.credits_amount,
      direction: 'out',
      gbpApprox: creditsToGbpEquivalent(row.credits_amount),
      createdAt: row.created_at,
      href: taskHref,
    }
  }

  if (row.kind === 'release' && row.to_user_id === userId) {
    return {
      id: row.id,
      source: 'hustle',
      kind: 'hustle_earned',
      title: taskTitle,
      subtitle: `${HUSTLE_KIND_LABEL.release} · Ledger ${shortId(row.id)}`,
      verificationId: row.id,
      verificationLabel: 'Ledger',
      credits: row.credits_amount,
      direction: 'in',
      gbpApprox: creditsToGbpEquivalent(row.credits_amount),
      createdAt: row.created_at,
      href: taskHref,
    }
  }

  if (row.kind === 'release' && row.from_user_id === userId) {
    return {
      id: row.id,
      source: 'hustle',
      kind: 'hustle_completed',
      title: taskTitle,
      subtitle: `Gig paid to worker · Ledger ${shortId(row.id)}`,
      verificationId: row.id,
      verificationLabel: 'Ledger',
      credits: row.credits_amount,
      direction: 'out',
      gbpApprox: creditsToGbpEquivalent(row.credits_amount),
      createdAt: row.created_at,
      href: `/hustle?tab=posted&task=${row.task_id}`,
    }
  }

  if (row.kind === 'refund' && row.to_user_id === userId) {
    return {
      id: row.id,
      source: 'hustle',
      kind: 'hustle_refund',
      title: taskTitle,
      subtitle: `${HUSTLE_KIND_LABEL.refund} · Ledger ${shortId(row.id)}`,
      verificationId: row.id,
      verificationLabel: 'Ledger',
      credits: row.credits_amount,
      direction: 'in',
      gbpApprox: creditsToGbpEquivalent(row.credits_amount),
      createdAt: row.created_at,
      href: `/hustle?tab=posted&task=${row.task_id}`,
    }
  }

  if (row.kind === 'platform_fee' && row.from_user_id === userId) {
    return {
      id: row.id,
      source: 'hustle',
      kind: 'hustle_fee',
      title: taskTitle,
      subtitle: `${HUSTLE_KIND_LABEL.platform_fee} · Ledger ${shortId(row.id)}`,
      verificationId: row.id,
      verificationLabel: 'Ledger',
      credits: row.credits_amount,
      direction: 'out',
      gbpApprox: creditsToGbpEquivalent(row.credits_amount),
      createdAt: row.created_at,
      href: taskHref,
    }
  }

  return null
}

export async function getImpactLogForUser(userId: string): Promise<ImpactLogPayload> {
  const db = getAdminDb()

  const [trading, ledgerRes, postedRes, workerPaidRes, posterPaidRes] = await Promise.all([
    getTradingMetricsForUser(userId),
    db
      .from('hustle_task_ledger')
      .select(
        'id, task_id, from_user_id, to_user_id, credits_amount, kind, created_at, hustle_tasks(title, category, status)',
      )
      .or(`from_user_id.eq.${userId},to_user_id.eq.${userId}`)
      .order('created_at', { ascending: false })
      .limit(120),
    db.from('hustle_tasks').select('id', { count: 'exact', head: true }).eq('poster_id', userId),
    db
      .from('hustle_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('assignee_id', userId)
      .eq('status', 'paid'),
    db
      .from('hustle_tasks')
      .select('id', { count: 'exact', head: true })
      .eq('poster_id', userId)
      .eq('status', 'paid'),
  ])

  const ledgerRows = (ledgerRes.data ?? []) as HustleLedgerRow[]
  const hustleEntries = ledgerRows
    .map((row) => hustleLedgerToImpact(row, userId))
    .filter((e): e is ImpactLogEntry => e !== null)

  const marketplaceEntries = trading.activity.map(marketplaceToImpact)

  const entries = [...marketplaceEntries, ...hustleEntries].sort((a, b) =>
    a.createdAt < b.createdAt ? 1 : -1,
  )

  let creditsEarned = 0
  let creditsSpentEscrow = 0
  let creditsRefunded = 0
  let platformFeesPaid = 0

  for (const row of ledgerRows) {
    if (row.kind === 'release' && row.to_user_id === userId) creditsEarned += row.credits_amount
    if (row.kind === 'escrow_in' && row.from_user_id === userId) creditsSpentEscrow += row.credits_amount
    if (row.kind === 'refund' && row.to_user_id === userId) creditsRefunded += row.credits_amount
    if (row.kind === 'platform_fee' && row.from_user_id === userId) platformFeesPaid += row.credits_amount
  }

  const hustleIn = hustleEntries.filter((e) => e.direction === 'in').reduce((s, e) => s + e.credits, 0)
  const hustleOut = hustleEntries.filter((e) => e.direction === 'out').reduce((s, e) => s + e.credits, 0)
  const marketplaceIn = marketplaceEntries.filter((e) => e.direction === 'in').reduce((s, e) => s + e.credits, 0)
  const marketplaceOut = marketplaceEntries
    .filter((e) => e.direction === 'out')
    .reduce((s, e) => s + e.credits, 0)

  return {
    summary: {
      totalEvents: entries.length,
      creditsIn: marketplaceIn + hustleIn,
      creditsOut: marketplaceOut + hustleOut,
      marketplaceIn,
      hustleIn,
      hustleOut,
    },
    hustle: {
      gigsPosted: postedRes.count ?? 0,
      gigsCompletedAsWorker: workerPaidRes.count ?? 0,
      gigsPaidAsPoster: posterPaidRes.count ?? 0,
      creditsEarned,
      creditsSpentEscrow,
      creditsRefunded,
      platformFeesPaid,
    },
    entries: entries.slice(0, 80),
  }
}
