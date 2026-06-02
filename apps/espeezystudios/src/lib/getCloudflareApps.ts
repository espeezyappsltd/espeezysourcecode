import fs from 'fs'
import path from 'path'
import { ESPEEZY_APP_ORIGINS, APP_FOLDER_TO_ORIGIN_KEY, hostnameFromOrigin } from '../../../shared/espeezy-app-origins'

/** Production app links for dev hub / safe-deposit (Cloudflare custom domains). */
export function getCloudflareApps() {
  const appsDir = path.join(process.cwd(), 'apps')
  const ignore = new Set(['shared', 'base', 'core', 'node_modules', '.next'])
  try {
    return fs
      .readdirSync(appsDir)
      .filter((name) => !ignore.has(name) && !name.startsWith('.'))
      .map((folder) => {
        const originKey = APP_FOLDER_TO_ORIGIN_KEY[folder]
        const origin = originKey ? ESPEEZY_APP_ORIGINS[originKey as keyof typeof ESPEEZY_APP_ORIGINS] : null
        const label = folder.charAt(0).toUpperCase() + folder.slice(1)
        return {
          name: label,
          url: origin ?? `https://${folder}.espeezy.com`,
          hostname: origin ? hostnameFromOrigin(origin) : `${folder}.espeezy.com`,
        }
      })
  } catch {
    return []
  }
}

/** @deprecated Use getCloudflareApps */
export const getVercelApps = getCloudflareApps
