import type { MetadataRoute } from 'next'

export default function manifest(): MetadataRoute.Manifest {
  return {
    name: 'Espeezy Kanban',
    short_name: 'Kanban',
    description: 'Visual task management and collaboration for students and teams.',
    start_url: '/',
    display: 'standalone',
    background_color: '#0a0a0a',
    theme_color: '#10b981',
    icons: [
      {
        src: '/pwa-icon-192.png',
        sizes: '192x192',
        type: 'image/png',
      },
      {
        src: '/pwa-icon-512.png',
        sizes: '512x512',
        type: 'image/png',
      },
    ],
  }
}
