/**
 * Shared TypeScript types for the Admin Dashboard feature.
 *
 * Keep this file as the single source of truth for admin-related shapes.
 * Import from here in every admin component — never redefine inline.
 */

// ── Platform Config ────────────────────────────────────────────────────────────

/** The union of all possible values stored in a platform_config row. */
export type ConfigValue =
  | string
  | number
  | boolean
  | Record<string, string>

/** One row from the platform_config table. */
export interface ConfigEntry {
  value: ConfigValue
  is_active: boolean
}

/** The full config map keyed by the config row's `key` column. */
export interface PlatformConfig {
  [key: string]: ConfigEntry
}

// ── Stats ──────────────────────────────────────────────────────────────────────

/** Aggregated numbers shown in the top-level stats cards. */
export interface AdminStats {
  users: number
  pro: number
  premium: number
  revenue: number
}

// ── Users ──────────────────────────────────────────────────────────────────────

/** The subset of `profiles` columns we need in the user orchestrator list. */
export interface RecentUser {
  id: string
  full_name: string | null
  email: string | null
  subscription_plan: string | null
  created_at: string
  role: string | null
}

// ── System Logs ───────────────────────────────────────────────────────────────

/** One line in the live terminal log feed. */
export interface SystemLog {
  /** Formatted time string, e.g. "13:42:01" */
  t: string
  /** Log message text */
  m: string
}

// ── Launch Config ─────────────────────────────────────────────────────────────

/** Shape of the pre-registration / launch page config form. */
export interface LaunchConfig {
  launch_date: string
  launch_message: string
  preregister_goal: string
  /** String "true" | "false" — stored as text in the DB. */
  preregister_open: string
  brand_name: string
  platform_version: string
}
