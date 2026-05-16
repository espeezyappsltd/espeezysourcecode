import GameCategoryPlayClient from '@/components/games/GameCategoryPlayClient'
import FlappyBirdClient from '@/components/games/FlappyBirdClient'

export const dynamic = 'force-dynamic'

export default async function GameCategoryPage({ params }: { params: Promise<{ slug: string }> }) {
  const { slug } = await params
  
  if (slug === 'flappybird') {
    return <FlappyBirdClient />
  }

  return <GameCategoryPlayClient slug={slug} />
}
