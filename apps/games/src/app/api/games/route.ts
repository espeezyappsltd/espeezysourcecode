import { NextRequest, NextResponse } from 'next/server';
import { addGame, getCategoriesWithGames } from '@/services/categories';
import type { Category } from '@/types/games';
import type { GameWithCategory } from '@/types/api';
import { getErrorMessage } from '@/utils/errors';

export async function POST(req: NextRequest) {
  try {
    const { categoryId, name, url } = await req.json();
    if (!categoryId || !name || !url) return NextResponse.json({ error: 'Missing fields' }, { status: 400 });
    const game = await addGame(categoryId, name, url);
    return NextResponse.json(game);
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}

export async function GET() {
  try {
    const categories = await getCategoriesWithGames();
    const games = categories.flatMap((cat: Category) =>
      (cat.games ?? []).map((g) => ({
        ...g,
        category: cat.name,
        categoryId: cat.id,
      } satisfies GameWithCategory)),
    );
    return NextResponse.json(games);
  } catch (error: unknown) {
    return NextResponse.json({ error: getErrorMessage(error) }, { status: 500 });
  }
}
