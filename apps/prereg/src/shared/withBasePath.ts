// Utility to prefix image src with basePath if set in next.config.js
import getConfig from 'next/config'

export function withBasePath(src: string) {
  if (!src.startsWith('/')) return src
  const { publicRuntimeConfig } = getConfig() || {}
  const basePath = publicRuntimeConfig?.basePath || ''
  return `${basePath}${src}`
}
