import { resolveAppOrigin, sanitizeNextPath } from './app-url'

/** Default post-SSO path on games.espeezy.com for the signed-in user. */
export const GAMES_PROFILE_PATH = '/profile'

/** Kanban workspace home (board). */
export const KANBAN_WORKSPACE_PATH = '/'

/** Default post-SSO path on Espeezy Studios (marketplace & jobs hub). */
export const STUDIOS_MARKETPLACE_PATH = '/marketplace'

export type CrossAppSessionTokens = {
  access_token: string
  refresh_token: string
}

/**
 * Build SSO URL to another Espeezy app (hash tokens + /sso bridge).
 * Falls back to that app's /login with `next` when there is no session.
 */
export function buildCrossAppSsoUrl(
  appBaseUrl: string,
  nextPath: string,
  session: CrossAppSessionTokens | null | undefined,
): string {
  const base = appBaseUrl.replace(/\/$/, '')
  const next = sanitizeNextPath(nextPath, '/')

  if (!session?.access_token || !session?.refresh_token) {
    return `${base}/login?next=${encodeURIComponent(next)}`
  }

  const hash = new URLSearchParams({
    access_token: session.access_token,
    refresh_token: session.refresh_token,
  })

  return `${base}/sso?next=${encodeURIComponent(next)}#${hash.toString()}`
}

export function resolveGamesAppOrigin(): string {
  return resolveAppOrigin('games')
}

export function resolveKanbanAppOrigin(): string {
  return resolveAppOrigin('kanban')
}

export function resolveStudiosAppOrigin(): string {
  return resolveAppOrigin('studios')
}

export function resolveCoreAppOrigin(): string {
  return resolveAppOrigin('core')
}

export function resolveArticlesAppOrigin(): string {
  return resolveAppOrigin('articles')
}

export function resolveBaseAppOrigin(): string {
  return resolveAppOrigin('base')
}

export function buildGamesProfileSsoUrl(
  session: CrossAppSessionTokens | null | undefined,
  gamesOrigin?: string,
): string {
  return buildCrossAppSsoUrl(gamesOrigin ?? resolveGamesAppOrigin(), GAMES_PROFILE_PATH, session)
}

export function buildKanbanAppSsoUrl(
  session: CrossAppSessionTokens | null | undefined,
  nextPath: string = KANBAN_WORKSPACE_PATH,
  kanbanOrigin?: string,
): string {
  return buildCrossAppSsoUrl(kanbanOrigin ?? resolveKanbanAppOrigin(), nextPath, session)
}

export function buildKanbanWorkspaceSsoUrl(
  session: CrossAppSessionTokens | null | undefined,
  kanbanOrigin?: string,
): string {
  return buildKanbanAppSsoUrl(session, KANBAN_WORKSPACE_PATH, kanbanOrigin)
}

export function buildStudiosSsoUrl(
  session: CrossAppSessionTokens | null | undefined,
  nextPath: string = STUDIOS_MARKETPLACE_PATH,
  studiosOrigin?: string,
): string {
  return buildCrossAppSsoUrl(studiosOrigin ?? resolveStudiosAppOrigin(), nextPath, session)
}

/** Public games profile by username (no SSO). */
export function buildGamesPublicProfileUrl(username: string, gamesOrigin?: string): string {
  const base = gamesOrigin ?? resolveGamesAppOrigin()
  const slug = username.trim().replace(/^@/, '')
  return `${base}/u/${encodeURIComponent(slug)}`
}
