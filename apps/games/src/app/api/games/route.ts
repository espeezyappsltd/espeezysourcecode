import { NextRequest, NextResponse } from 'next/server';
import { addGame, getCategoriesWithGames } from '@/services/categories';

export async function POST(req: NextRequest) {
  try {
    const { categoryId, name, url } = await req.json();
    if (!categoryId || !name || !url) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const game = await addGame(categoryId, name, url);
    return NextResponse.json(game);
  } catch (error) {
    return NextResponse.json({ error: (error as any).message }, { status: 500 });
  }
}

// Optionally, GET all games (flattened) if needed
export async function GET() {
  try {
    const categories = await getCategoriesWithGames();
    const games = categories.flatMap((cat: any) => (cat.games || []).map((g: any) => ({ ...g, category: cat.name, categoryId: cat.id })));
    return NextResponse.json(games);
  } catch (error) {
    return NextResponse.json({ error: (error as any).message }, { status: 500 });
  }
}
