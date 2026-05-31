/** Runtime platform hints for health checks and logging. */

export type DeployPlatform = 'cloudflare' | 'local' | 'docker'

export function getDeployPlatform(): DeployPlatform {
  if (
    process.env.CF_PAGES === '1' ||
    process.env.CLOUDFLARE_WORKERS === '1' ||
    process.env.CF_PAGES_URL ||
    process.env.CF_PAGES_COMMIT_SHA
  ) {
    return 'cloudflare'
  }
  if (process.env.DOCKER === 'true' || process.env.KUBERNETES_SERVICE_HOST) {
    return 'docker'
  }
  return 'local'
}

/** Edge colo / region label for /api/health (Cloudflare sets CF_* at runtime on Workers). */
export function getDeployRegion(): string {
  return (
    process.env.CF_REGION ??
    process.env.CLOUDFLARE_REGION ??
    process.env.CF_PAGES_BRANCH ??
    (getDeployPlatform() === 'cloudflare' ? 'cloudflare-edge' : 'local')
  )
}
