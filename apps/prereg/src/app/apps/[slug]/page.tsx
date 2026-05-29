import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import AppProductClient from '@/components/landing/AppProductClient'
import { fetchPlatformAppBySlug } from '@/lib/platform-apps-db'

type PageProps = { params: Promise<{ slug: string }> }

export async function generateMetadata({ params }: PageProps): Promise<Metadata> {
  const { slug } = await params
  const app = await fetchPlatformAppBySlug(slug.trim().toLowerCase())
  if (!app) return { title: 'App not found · Espeezy' }
  return {
    title: `${app.name} · Pay & download · Espeezy`,
    description: app.tagline || app.description,
  }
}

export default async function AppProductPage({ params }: PageProps) {
  const { slug } = await params
  const app = await fetchPlatformAppBySlug(slug.trim().toLowerCase())
  if (!app) notFound()
  return <AppProductClient app={app} />
}
