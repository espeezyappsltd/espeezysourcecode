import './feed.css'

export const dynamic = 'force-dynamic'

export default function FeedLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return <>{children}</>
}
