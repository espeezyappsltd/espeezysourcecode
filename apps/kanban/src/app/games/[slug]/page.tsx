import GameCategoryPlayClient from '@/components/games/GameCategoryPlayClient'

export const dynamic = 'force-dynamic'

export default async function GameCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  return <GameCategoryPlayClient slug={slug} />
}
